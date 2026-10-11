/**
 * @file src/lib/hooks/useAlertTriggers.js
 *
 * Trade Terminal's alert triggers, filed under Playbook strategies. The
 * desktop Guardian reads them off the screen; this keeps them in the
 * database, matched to a strategy when one fits and Unassigned otherwise.
 * Nothing is judged here: the data is kept so it can be judged later.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { usePlaybook } from '@/lib/hooks/usePlaybook';
import { matchTriggerToPlaybook } from '@/lib/playbook/triggers';

export const ALERT_TRIGGERS_QUERY_KEY = ['alertTriggers'];

function toRecord(trigger, match) {
  return {
    date: trigger.date,
    time_et: trigger.timeEt,
    symbol: trigger.symbol,
    direction: trigger.direction,
    price: trigger.price,
    setup_text: trigger.setupText || '',
    setup_raw: trigger.setupRaw || '',
    raw: trigger.raw || '',
    captured_at: trigger.capturedAt || new Date().toISOString(),
    context: trigger.context || null,
    playbook_id: match?.entry?.id || null,
    playbook_name: match?.entry?.name || null,
    match_keyword: match?.keyword || null,
    match_score: match?.score ?? null,
    assigned: match ? 'auto' : null,
  };
}

export function useAlertTriggers() {
  const queryClient = useQueryClient();
  const { data: triggers = [], isLoading } = useQuery({
    queryKey: ALERT_TRIGGERS_QUERY_KEY,
    queryFn: () => db.alertTriggers.list(),
    staleTime: 1000 * 60 * 2,
  });

  const upsert = useCallback(async (id, record) => {
    const saved = await db.alertTriggers.save(id, record);
    queryClient.setQueryData(ALERT_TRIGGERS_QUERY_KEY, (previous = []) => [
      ...previous.filter((item) => item.id !== id),
      saved,
    ]);
    return saved;
  }, [queryClient]);

  /** Files a trigger under a strategy by hand; null makes it unassigned again. */
  const assign = useCallback(async (trigger, entry) => {
    const { id, ...rest } = trigger;
    return upsert(id, {
      ...rest,
      playbook_id: entry?.id || null,
      playbook_name: entry?.name || null,
      match_keyword: null,
      match_score: null,
      assigned: entry ? 'manual' : null,
    });
  }, [upsert]);

  const remove = useCallback(async (id) => {
    await db.alertTriggers.delete(id);
    queryClient.setQueryData(ALERT_TRIGGERS_QUERY_KEY, (previous = []) => previous.filter((item) => item.id !== id));
  }, [queryClient]);

  const unassigned = useMemo(() => triggers.filter((t) => !t.playbook_id), [triggers]);

  return { triggers, unassigned, isLoading, assign, remove, upsert };
}

/**
 * Carries the desktop Guardian's triggers into the database as they appear,
 * and re-files unassigned ones when a strategy gains a matching keyword.
 * A trigger filed by hand is never moved.
 */
export function useAlertTriggerSync(status, bridge) {
  const { triggers, upsert, isLoading } = useAlertTriggers();
  const { playbookEntries } = usePlaybook();
  const synced = useRef(new Set());
  const count = status?.triggersToday || 0;
  const date = status?.day?.date || null;

  // New triggers from Guardian.
  useEffect(() => {
    if (!bridge?.getTriggers || isLoading || count === 0) return;
    let cancelled = false;
    bridge.getTriggers(date).then(async (fresh = []) => {
      if (cancelled) return;
      const stored = new Set(triggers.map((t) => t.id));
      for (const trigger of fresh) {
        if (stored.has(trigger.id) || synced.current.has(trigger.id)) continue;
        synced.current.add(trigger.id);
        const match = matchTriggerToPlaybook(trigger, playbookEntries);
        await upsert(trigger.id, toRecord(trigger, match)).catch(() => synced.current.delete(trigger.id));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
    // Re-run when Guardian reports more triggers, not on every list change.
  }, [bridge, count, date, isLoading]);

  // Re-file the unassigned when keywords change.
  const keywordsKey = useMemo(
    () => JSON.stringify(playbookEntries.map((e) => [e.id, e.alert_keywords, e.direction, e.is_active])),
    [playbookEntries],
  );
  useEffect(() => {
    if (isLoading) return;
    for (const trigger of triggers) {
      if (trigger.playbook_id || trigger.assigned === 'manual') continue;
      const match = matchTriggerToPlaybook({ setupText: trigger.setup_text, direction: trigger.direction }, playbookEntries);
      if (!match) continue;
      const { id, ...rest } = trigger;
      upsert(id, {
        ...rest,
        playbook_id: match.entry.id,
        playbook_name: match.entry.name,
        match_keyword: match.keyword,
        match_score: match.score,
        assigned: 'auto',
      }).catch(() => {});
    }
  }, [keywordsKey, isLoading]);
}
