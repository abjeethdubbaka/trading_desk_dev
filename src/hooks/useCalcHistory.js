/**
 * @file src/hooks/useCalcHistory.js
 *
 * Calculator history — stored in Firebase.
 * Replaces direct localStorage.setItem('calcHistory', ...) calls scattered
 * through the calculator components.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

const KEY = ['calcHistory'];

export function useCalcHistory() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: KEY,
    queryFn:  () => db.calcHistory.list(),
    staleTime: 60_000,
  });

  const addMutation = useMutation({
    mutationFn: (item) => db.calcHistory.add(item),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.calcHistory.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const clearMutation = useMutation({
    mutationFn: () => db.calcHistory.clear(),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return {
    history:       data,
    isLoading,
    addToHistory:  addMutation.mutate,
    deleteItem:    deleteMutation.mutate,
    clearHistory:  clearMutation.mutate,
  };
}
