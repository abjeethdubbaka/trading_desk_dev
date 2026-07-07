/**
 * @file src/lib/hooks/useInformativeImages.js
 *
 * Informative Images — a gallery of chart setups/behaviors the user studied.
 * Backed by a real Firestore collection (one doc per entry, see
 * src/lib/db/adapters/firebase-simple/informativeImages.js).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

const INFORMATIVE_IMAGES_QUERY_KEY = ['informativeImages'];

export function useInformativeImages() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: INFORMATIVE_IMAGES_QUERY_KEY,
    queryFn: () => db.informativeImages.list(),
    staleTime: 1000 * 60 * 2,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: INFORMATIVE_IMAGES_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (entry) => db.informativeImages.create(entry),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.informativeImages.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.informativeImages.delete(id),
    onSuccess: invalidate,
  });

  return {
    items,
    isLoading,
    addItem: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
    updateItem: (id, data) => updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    deleteItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
