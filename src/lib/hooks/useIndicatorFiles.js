/**
 * @file src/lib/hooks/useIndicatorFiles.js
 *
 * Attaching, reading and saving the indicator source files (.cs) a Playbook
 * setup is traded with. In the desktop app the file is written to disk
 * beside the backups; in a browser its code is kept on the setup's record.
 */

import { useCallback, useMemo } from 'react';
import { parseLocalImageRef, toLocalImageRef } from '@/lib/images/localStore';
import {
  INDICATOR_BUCKET,
  MAX_INDICATOR_BYTES,
  MAX_INLINE_INDICATOR_BYTES,
  buildIndicatorFileName,
  formatIndicatorSize,
  isIndicatorFileName,
  toIndicatorName,
  toOriginalFileName,
} from '@/lib/playbook/indicators';

function getBridge() {
  return typeof window !== 'undefined' ? window.electronAPI?.images || null : null;
}

/** A file's bytes as base64, exactly as selected. */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = (event) => {
      const result = String(event.target.result || '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });
}

function base64ToText(base64) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

export function useIndicatorFiles() {
  const bridge = getBridge();

  /** Stores a selected .cs file and returns the record to keep on the setup. */
  const attach = useCallback(async (file) => {
    if (!file) throw new Error('No file selected');
    if (!isIndicatorFileName(file.name)) throw new Error(`${file.name} is not a .cs file`);
    if (file.size > MAX_INDICATOR_BYTES) {
      throw new Error(`${file.name} is ${formatIndicatorSize(file.size)}; indicators are limited to ${formatIndicatorSize(MAX_INDICATOR_BYTES)}`);
    }

    const record = {
      id: `ind_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: toIndicatorName(file.name),
      original_name: file.name,
      size: file.size,
      note: '',
      added_at: new Date().toISOString(),
    };

    if (!bridge) {
      if (file.size > MAX_INLINE_INDICATOR_BYTES) {
        throw new Error(`Files over ${formatIndicatorSize(MAX_INLINE_INDICATOR_BYTES)} can only be attached in the desktop app`);
      }
      return { ...record, file_name: '', ref: '', content: await file.text() };
    }

    const fileName = buildIndicatorFileName(file.name);
    await bridge.write({ bucket: INDICATOR_BUCKET, fileName, base64: await readFileAsBase64(file) });
    return { ...record, file_name: fileName, ref: toLocalImageRef(INDICATOR_BUCKET, fileName) };
  }, [bridge]);

  /**
   * Restores an indicator from a strategies file, where its code travels
   * inline: written to disk again on the desktop, kept inline in a browser.
   */
  const restore = useCallback(async (indicator) => {
    const name = String(indicator?.original_name || `${indicator?.name || 'indicator'}.cs`);
    const restored = await attach(new File([String(indicator?.content || '')], name, { type: 'text/plain' }));
    return { ...restored, id: indicator.id || restored.id, note: indicator.note || '', added_at: indicator.added_at || restored.added_at };
  }, [attach]);

  /** The indicator's source code. */
  const readCode = useCallback(async (indicator) => {
    if (typeof indicator?.content === 'string' && !indicator.ref) return indicator.content;

    const parsed = parseLocalImageRef(indicator?.ref);
    if (!parsed) throw new Error('This indicator has no file');
    if (!bridge) throw new Error('Indicator files can only be opened in the desktop app');

    const result = await bridge.read({ bucket: parsed.bucket, fileName: parsed.fileName });
    if (!result?.exists) throw new Error(`${toOriginalFileName(indicator)} is missing from the indicators folder`);
    return base64ToText(result.base64);
  }, [bridge]);

  /** Saves a copy under its original name, ready to import into NinjaTrader. */
  const download = useCallback(async (indicator) => {
    const code = await readCode(indicator);
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = toOriginalFileName(indicator);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [readCode]);

  /** Deletes files no setup refers to any more. A failure leaves a stray file, nothing worse. */
  const release = useCallback(async (refs = []) => {
    if (!bridge) return;
    await Promise.all(refs.map((ref) => {
      const parsed = parseLocalImageRef(ref);
      return parsed
        ? bridge.delete({ bucket: parsed.bucket, fileName: parsed.fileName }).catch(() => {})
        : null;
    }));
  }, [bridge]);

  return useMemo(() => ({
    isDesktop: Boolean(bridge),
    attach,
    restore,
    readCode,
    download,
    release,
  }), [bridge, attach, restore, readCode, download, release]);
}

export default useIndicatorFiles;
