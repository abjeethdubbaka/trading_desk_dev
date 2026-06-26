/**
 * @file src/lib/hooks/useDosAndDonts.js
 *
 * Do's & Don'ts rules, backed by Firestore via DosAndDontsService instead of
 * localStorage. `setItems` mirrors useState's setter (accepts a value or an
 * updater function) so existing call sites barely change.
 */

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { createDosAndDontsService } from '@/lib/services/DosAndDontsService';

const dosAndDontsService = createDosAndDontsService(db);
const DOS_AND_DONTS_QUERY_KEY = ['dosAndDonts'];

export function useDosAndDonts() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: DOS_AND_DONTS_QUERY_KEY,
    queryFn: () => dosAndDontsService.getItems(),
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: (nextItems) => dosAndDontsService.saveItems(nextItems),
    onSuccess: (savedItems) => {
      queryClient.setQueryData(DOS_AND_DONTS_QUERY_KEY, savedItems);
    },
  });

  const setItems = useCallback((updater) => {
    const current = queryClient.getQueryData(DOS_AND_DONTS_QUERY_KEY) ?? [];
    const next = typeof updater === 'function' ? updater(current) : updater;
    queryClient.setQueryData(DOS_AND_DONTS_QUERY_KEY, next);
    saveMutation.mutate(next);
  }, [queryClient, saveMutation]);

  return { items, isLoading, setItems, isSaving: saveMutation.isPending };
}
