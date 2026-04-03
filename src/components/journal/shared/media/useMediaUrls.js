import { useEffect, useMemo, useRef, useState } from 'react';

const toUniqueIds = (ids) => (
  [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id || '').trim()).filter(Boolean))]
);

export function useMediaUrls(ids, { getMediaById }) {
  const [urlsById, setUrlsById] = useState({});
  const [statusById, setStatusById] = useState({});
  const blobUrlsByIdRef = useRef(new Map());

  const rawIdsKey = useMemo(
    () => (Array.isArray(ids) ? ids.map((id) => String(id || '').trim()).join('|') : ''),
    [ids]
  );
  const mediaIds = useMemo(() => toUniqueIds(ids), [rawIdsKey]);

  useEffect(() => {
    if (!mediaIds.length) {
      blobUrlsByIdRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsByIdRef.current = new Map();
      setUrlsById({});
      setStatusById({});
      return;
    }

    let cancelled = false;
    setStatusById((prev) => {
      const next = {};
      mediaIds.forEach((id) => {
        next[id] = prev[id] === 'loaded' ? 'loaded' : 'loading';
      });
      return next;
    });

    Promise.all(
      mediaIds.map(async (id) => {
        try {
          const media = await getMediaById(id);
          const fileUrl = media?.file_url;
          if (fileUrl) {
            return { id, status: 'loaded', url: fileUrl, isBlobUrl: false };
          }

          if (media?.file) {
            const objectUrl = URL.createObjectURL(media.file);
            return { id, status: 'loaded', url: objectUrl, isBlobUrl: true };
          }

          return { id, status: 'error', url: null, isBlobUrl: false };
        } catch {
          return { id, status: 'error', url: null, isBlobUrl: false };
        }
      })
    ).then((results) => {
      if (cancelled) {
        results.forEach((result) => {
          if (result.isBlobUrl && result.url) URL.revokeObjectURL(result.url);
        });
        return;
      }

      const nextUrls = {};
      const nextStatuses = {};
      const nextBlobUrlsById = new Map();

      results.forEach((result) => {
        nextStatuses[result.id] = result.status;
        if (result.url) {
          nextUrls[result.id] = result.url;
        }
        if (result.isBlobUrl && result.url) {
          nextBlobUrlsById.set(result.id, result.url);
        }
      });

      blobUrlsByIdRef.current.forEach((oldUrl, id) => {
        const nextUrl = nextBlobUrlsById.get(id);
        if (oldUrl && oldUrl !== nextUrl) {
          URL.revokeObjectURL(oldUrl);
        }
      });

      blobUrlsByIdRef.current = nextBlobUrlsById;
      setUrlsById(nextUrls);
      setStatusById(nextStatuses);
    });

    return () => {
      cancelled = true;
    };
  }, [getMediaById, mediaIds]);

  useEffect(() => () => {
    blobUrlsByIdRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsByIdRef.current = new Map();
  }, []);

  return {
    urlsById,
    statusById,
  };
}
