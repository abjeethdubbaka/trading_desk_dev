import { useMemo } from 'react';
import { useMediaUrls } from './useMediaUrls';
import { journalMediaService } from './mediaService';

const getMediaById = (id) => journalMediaService.get(id);

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
