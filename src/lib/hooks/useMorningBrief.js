/**
 * @file src/lib/hooks/useMorningBrief.js
 *
 * Today's morning check-in: whether it is still owed, and saving it. Skipping
 * is remembered for the day on this machine, so the app does not ask again
 * every time it opens.
 */

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { getLocalDateKey } from '@/lib/reviews/utils';

export const MORNING_BRIEF_QUERY_KEY = ['morningBrief'];
const SKIPPED_KEY = 'tradedesk:morning-brief-skipped';

function readSkippedDate() {
  try {
    return localStorage.getItem(SKIPPED_KEY) || '';
  } catch {
    return '';
  }
}

export function useMorningBrief({ enabled = true } = {}) {
  const queryClient = useQueryClient();
  const todayKey = getLocalDateKey();

  const { data: todayBrief = null, isLoading, isError } = useQuery({
    queryKey: [...MORNING_BRIEF_QUERY_KEY, todayKey],
    queryFn: () => db.morningBriefs.get(todayKey),
    enabled,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const saveMutation = useMutation({
    mutationFn: (record) => db.morningBriefs.save(todayKey, record),
    onSuccess: (saved) => {
      queryClient.setQueryData([...MORNING_BRIEF_QUERY_KEY, todayKey], saved);
    },
  });

  const skip = useCallback(() => {
    try { localStorage.setItem(SKIPPED_KEY, todayKey); } catch { /* storage unavailable */ }
  }, [todayKey]);

  // Owed when today has no answer and was not skipped. A failed read does not
  // count as owed: better to miss a morning than to ask on every launch.
  const isDue = enabled && !isLoading && !isError && !todayBrief && readSkippedDate() !== todayKey;

  return {
    todayKey,
    todayBrief,
    isDue,
    // Still finding out whether today is answered; other launch popups wait.
    isChecking: enabled && isLoading,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    skip,
  };
}

export default useMorningBrief;
