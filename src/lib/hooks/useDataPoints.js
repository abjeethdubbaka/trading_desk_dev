/**
 * @file src/lib/hooks/useDataPoints.js
 *
 * Data Points — entry/exit/stop observations collected per Playbook strategy.
 * Backed by its own Firestore collection; intentionally unrelated to trades,
 * so nothing here reaches the Performance analytics.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { dataPointSignature, normalizeDataPoint } from '@/lib/dataPoints/utils';

export const DATA_POINTS_QUERY_KEY = ['dataPoints'];

export function useDataPoints() {
  const queryClient = useQueryClient();

  const { data: dataPoints = [], isLoading } = useQuery({
    queryKey: DATA_POINTS_QUERY_KEY,
    queryFn: () => db.dataPoints.list(),
    staleTime: 1000 * 60 * 2,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: DATA_POINTS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (entry) => db.dataPoints.create(entry),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.dataPoints.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.dataPoints.delete(id),
    onSuccess: invalidate,
  });

  /**
   * Restores observations from a strategies backup. Points already held —
   * matched on content, not id — are skipped, so re-importing the same file
   * is a no-op rather than a duplication.
   */
  const importDataPoints = async (rawPoints) => {
    const existing = new Set(dataPoints.map((point) => dataPointSignature(point)));
    let created = 0;
    let skipped = 0;

    for (const raw of Array.isArray(rawPoints) ? rawPoints : []) {
      const point = normalizeDataPoint(raw);
      if (!point.strategy) { skipped += 1; continue; }

      const signature = dataPointSignature(point);
      if (existing.has(signature)) { skipped += 1; continue; }

      const { id: _ignoredId, ...payload } = point;
      await db.dataPoints.create(payload);
      existing.add(signature);
      created += 1;
    }

    await invalidate();
    return { created, skipped };
  };

  return {
    dataPoints,
    isLoading,
    addDataPoint: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
    updateDataPoint: (id, data) => updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    deleteDataPoint: deleteMutation.mutateAsync,
    importDataPoints,
    isDeleting: deleteMutation.isPending,
  };
}
