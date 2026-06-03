import { useMemo } from 'react';
import { useMediaUrls } from './useMediaUrls';
import { journalMediaService } from './mediaService';

// If the stored value is already a data URL or blob URL, return it directly
// without touching MediaService or IndexedDB.
const getMediaById = async (id) => {
  if (typeof id === 'string' && (id.startsWith('data:') || id.startsWith('blob:'))) {
    return { file_url: id };
  }
  return journalMediaService.get(id);
};

export function useTradeScreenshotUrls(trades) {
  const screenshotIds = useMemo(
    () => [...new Set((Array.isArray(trades) ? trades : []).flatMap((trade) => trade?.screenshots || []))],
    [trades]
  );

  return useMediaUrls(screenshotIds, { getMediaById });
}

export function useScreenshotIdsUrls(screenshotIds) {
  return useMediaUrls(screenshotIds, { getMediaById });
}
