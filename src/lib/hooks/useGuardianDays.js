/**
 * @file src/lib/hooks/useGuardianDays.js
 *
 * Trading Guardian's record of each day, as stored for the journal: read for
 * the day headers and Report Card, written as Guardian's day unfolds.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { guardianDayKey, toGuardianDayRecord } from '@/lib/guardian/days';

export const GUARDIAN_DAYS_QUERY_KEY = ['guardianDays'];

export function useGuardianDays() {
  const { data = [] } = useQuery({
    queryKey: GUARDIAN_DAYS_QUERY_KEY,
    queryFn: () => db.guardianDays.list(),
    staleTime: 1000 * 60 * 5,
  });
  const byDate = useMemo(() => new Map(data.map((record) => [record.date, record])), [data]);
  return { guardianDays: data, guardianDaysByDate: byDate };
}

/**
 * Saves Guardian's live day whenever something worth keeping happens — an
 * alert, the final trade, a lock — and not on every second's reading.
 */
export function useGuardianDaySync(status) {
  const queryClient = useQueryClient();
  const lastSaved = useRef('');
  const record = useMemo(() => toGuardianDayRecord(status), [status]);
  const key = guardianDayKey(record);

  useEffect(() => {
    if (!record || !key || key === lastSaved.current) return;
    lastSaved.current = key;
    const payload = { ...record, updated_at: new Date().toISOString() };
    db.guardianDays.save(record.date, payload)
      .then((saved) => {
        queryClient.setQueryData(GUARDIAN_DAYS_QUERY_KEY, (previous = []) => [
          ...previous.filter((item) => item.date !== saved.date),
          saved,
        ]);
      })
      .catch(() => { lastSaved.current = ''; });
  }, [record, key, queryClient]);
}
