/**
 * @file src/lib/hooks/usePlaybookImages.js
 *
 * Resolves a Playbook setup's charts from Informative Images, where they are
 * stored, falling back to images still held inline on older setups.
 */

import { useCallback, useMemo } from 'react';
import { useInformativeImages } from '@/lib/hooks/useInformativeImages';
import { resolvePlaybookImages } from '@/lib/playbook/utils';

export function usePlaybookImages() {
  const { items } = useInformativeImages();

  const imagesByGalleryId = useMemo(
    () => new Map(items.map((item) => [item.id, Array.isArray(item.images) ? item.images : []])),
    [items],
  );

  const resolveImages = useCallback(
    (entry) => resolvePlaybookImages(entry, imagesByGalleryId),
    [imagesByGalleryId],
  );

  return { resolveImages, imagesByGalleryId };
}

export default usePlaybookImages;
