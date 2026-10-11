/**
 * @file src/lib/hooks/useLocalImages.jsx
 *
 * Reading and writing images kept as files on disk. A record stores a
 * reference; this resolves it for display, on demand, so a gallery loads the
 * charts on screen rather than every chart ever saved.
 *
 * Because a file has no document-size limit, images are stored exactly as
 * they were selected — no downscaling, no re-encoding, no quality budget.
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  IMAGE_BUCKETS,
  buildImageFileName,
  isDataUrl,
  isLocalImageRef,
  parseDataUrl,
  parseLocalImageRef,
  toDataUrl,
  toLocalImageRef,
} from '@/lib/images/localStore';

const LocalImagesContext = createContext(null);

function getBridge() {
  return typeof window !== 'undefined' ? window.electronAPI?.images || null : null;
}

/**
 * True when the desktop app is running an older main process than the code in
 * the window: the bridge exists, but the handler behind it does not.
 */
export function isStaleMainProcessError(error) {
  return /No handler registered for 'images:/.test(String(error?.message || ''));
}

export const RESTART_REQUIRED_MESSAGE =
  'Restart TradeDesk to finish updating — image storage was added to the app after this session started.';

/** Reads a File as a data URL, untouched. */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = (event) => resolve(event.target.result);
    reader.readAsDataURL(file);
  });
}

export function LocalImagesProvider({ children }) {
  const bridge = getBridge();
  // Resolved images, kept for the session: reading the same chart twice in a
  // gallery should not hit the disk twice.
  const cache = useRef(new Map());
  const pending = useRef(new Map());
  const [, forceRender] = useState(0);

  const resolve = useCallback(async (ref) => {
    if (!isLocalImageRef(ref)) return ref;
    if (cache.current.has(ref)) return cache.current.get(ref);
    if (!bridge) return null;

    if (!pending.current.has(ref)) {
      const parsed = parseLocalImageRef(ref);
      const read = parsed
        ? bridge.read({ bucket: parsed.bucket, fileName: parsed.fileName })
            .then((result) => {
              const url = result?.exists ? toDataUrl(null, result.base64) : null;
              cache.current.set(ref, url);
              pending.current.delete(ref);
              forceRender((n) => n + 1);
              return url;
            })
            .catch(() => {
              cache.current.set(ref, null);
              pending.current.delete(ref);
              return null;
            })
        : Promise.resolve(null);

      pending.current.set(ref, read);
    }

    return pending.current.get(ref);
  }, [bridge]);

  /** What is already resolved, for rendering without waiting. */
  const peek = useCallback((ref) => {
    if (!isLocalImageRef(ref)) return ref;
    return cache.current.get(ref) ?? null;
  }, []);

  /**
   * Stores a file on disk and returns its reference. The file is written as
   * selected: a chart screenshot keeps its full resolution.
   */
  const store = useCallback(async (file, bucket = IMAGE_BUCKETS.informative) => {
    const dataUrl = await readFileAsDataUrl(file);
    if (!bridge) return dataUrl; // Browser build: nothing to write to.

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return dataUrl;

    const fileName = buildImageFileName(parsed.extension);
    await bridge.write({ bucket, fileName, base64: parsed.base64 });

    const ref = toLocalImageRef(bucket, fileName);
    cache.current.set(ref, dataUrl);
    return ref;
  }, [bridge]);

  /** Moves an image that is already a data URL onto disk, for migrations. */
  const storeDataUrl = useCallback(async (dataUrl, bucket = IMAGE_BUCKETS.informative) => {
    if (!bridge || !isDataUrl(dataUrl)) return dataUrl;

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return dataUrl;

    const fileName = buildImageFileName(parsed.extension);
    await bridge.write({ bucket, fileName, base64: parsed.base64 });

    const ref = toLocalImageRef(bucket, fileName);
    cache.current.set(ref, dataUrl);
    return ref;
  }, [bridge]);

  const remove = useCallback(async (ref) => {
    const parsed = parseLocalImageRef(ref);
    if (!parsed || !bridge) return false;

    await bridge.delete({ bucket: parsed.bucket, fileName: parsed.fileName }).catch(() => {});
    cache.current.delete(ref);
    return true;
  }, [bridge]);

  const value = useMemo(() => ({
    isSupported: Boolean(bridge),
    resolve,
    peek,
    store,
    storeDataUrl,
    remove,
    listStored: (bucket) => (bridge ? bridge.list({ bucket }) : Promise.resolve({ paths: [] })),
  }), [bridge, resolve, peek, store, storeDataUrl, remove]);

  return <LocalImagesContext.Provider value={value}>{children}</LocalImagesContext.Provider>;
}

export function useLocalImages() {
  const context = useContext(LocalImagesContext);
  if (context) return context;

  // Usable outside the provider, so a component is never coupled to it.
  return {
    isSupported: false,
    resolve: async (ref) => (isLocalImageRef(ref) ? null : ref),
    peek: (ref) => (isLocalImageRef(ref) ? null : ref),
    store: readFileAsDataUrl,
    storeDataUrl: async (dataUrl) => dataUrl,
    remove: async () => false,
    listStored: async () => ({ paths: [] }),
  };
}

/**
 * Resolves a list of images for display: references become data URLs, and
 * anything already inline is passed straight through.
 */
export function useResolvedImages(images = []) {
  const { resolve, peek } = useLocalImages();
  const [, forceRender] = useState(0);

  const refs = Array.isArray(images) ? images : [];
  const resolved = refs.map((image) => peek(image));

  React.useEffect(() => {
    let cancelled = false;
    const missing = refs.filter((image) => isLocalImageRef(image) && peek(image) == null);
    if (missing.length === 0) return undefined;

    Promise.all(missing.map((image) => resolve(image))).then(() => {
      if (!cancelled) forceRender((n) => n + 1);
    });

    return () => { cancelled = true; };
    // Keyed on the joined refs: the array identity changes every render, the
    // images it names usually do not.
  }, [refs.join('|'), resolve, peek]);

  return resolved;
}

export default useLocalImages;
