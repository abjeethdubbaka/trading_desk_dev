/**
 * @file src/lib/hooks/useSetupJournal.js
 *
 * Setup Journal — structured per-trade debriefs, stored in their own
 * collection. The template each entry is answered against lives on the
 * Playbook setup itself, so it is saved through usePlaybook, not here.
 */

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useSettings } from '@/lib/context/SettingsContext';
import {
  filterJournalEntriesByAccount,
  normalizeJournalEntry,
} from '@/lib/setupJournal/utils';

export const SETUP_JOURNAL_QUERY_KEY = ['setupJournal'];

export function useSetupJournal() {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const accountType = settings?.account_type || 'demo';

  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: SETUP_JOURNAL_QUERY_KEY,
    queryFn: () => db.setupJournal.list(),
    staleTime: 1000 * 60 * 2,
  });

  // A debrief belongs to the tier it was traded on, so switching tiers shows
  // that tier's journal — the same way the trade list behaves.
  const journalEntries = useMemo(
    () => filterJournalEntriesByAccount(allEntries, accountType),
    [allEntries, accountType],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: SETUP_JOURNAL_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (entry) => db.setupJournal.create({ account_type: accountType, ...entry }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.setupJournal.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.setupJournal.delete(id),
    onSuccess: invalidate,
  });

  /**
   * Restores debriefs from a strategies backup. The file is the record: this
   * tier's existing entries are cleared first, so importing replaces the
   * journal rather than layering a second copy on top of it.
   */
  const importJournalEntries = async (rawEntries) => {
    const incoming = (Array.isArray(rawEntries) ? rawEntries : [])
      .map((raw) => normalizeJournalEntry(raw))
      .filter((entry) => entry.strategy);

    const removed = journalEntries.length;
    for (const existing of journalEntries) {
      if (existing.id) await db.setupJournal.delete(existing.id);
    }

    let created = 0;
    for (const entry of incoming) {
      const { id: _ignoredId, ...payload } = entry;
      await db.setupJournal.create({ ...payload, account_type: accountType });
      created += 1;
    }

    await invalidate();
    return { created, removed };
  };

  return {
    journalEntries,
    isLoading,
    addJournalEntry: createMutation.mutateAsync,
    isAdding: createMutation.isPending,
    updateJournalEntry: (id, data) => updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    deleteJournalEntry: deleteMutation.mutateAsync,
    importJournalEntries,
    isDeleting: deleteMutation.isPending,
  };
}
