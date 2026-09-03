import { useCallback, useMemo } from 'react';
import { useSettings } from '@/lib/context/SettingsContext';
import {
  PLAYBOOK_FIELD,
  normalizePlaybookEntries,
  normalizePlaybookEntry,
  getPlaybookEntryBySetupName,
  mergeSetupTypesWithPlaybook,
} from '@/lib/playbook/utils';

export function usePlaybook() {
  const {
    settings,
    saveImmediately,
    isSaving,
    saveError,
  } = useSettings();

  const playbookEntries = useMemo(
    () => normalizePlaybookEntries(settings?.[PLAYBOOK_FIELD]),
    [settings]
  );

  const persistEntries = useCallback(async (entries) => {
    const normalizedEntries = normalizePlaybookEntries(entries);
    const mergedSetupTypes = mergeSetupTypesWithPlaybook(
      settings?.journal_preferences?.default_setup_types,
      normalizedEntries
    );

    return saveImmediately({
      [PLAYBOOK_FIELD]: normalizedEntries,
      journal_preferences: {
        ...(settings?.journal_preferences || {}),
        default_setup_types: mergedSetupTypes,
      },
    });
  }, [saveImmediately, settings?.journal_preferences, settings?.journal_preferences?.default_setup_types]);

  const createEntry = useCallback(async (entry) => {
    const normalizedEntry = normalizePlaybookEntry(entry);
    const nextEntries = [...playbookEntries, normalizedEntry];
    await persistEntries(nextEntries);
    return normalizedEntry;
  }, [persistEntries, playbookEntries]);

  const updateEntry = useCallback(async (id, updates) => {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) return null;

    const nextEntries = playbookEntries.map((entry) => {
      if (entry.id !== normalizedId) return entry;

      const merged = normalizePlaybookEntry({
        ...entry,
        ...updates,
        id: entry.id,
        created_at: entry.created_at,
        updated_at: new Date().toISOString(),
      });

      return merged;
    });

    await persistEntries(nextEntries);
    return nextEntries.find((entry) => entry.id === normalizedId) || null;
  }, [persistEntries, playbookEntries]);

  const deleteEntry = useCallback(async (id) => {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) return;

    const nextEntries = playbookEntries.filter((entry) => entry.id !== normalizedId);
    await persistEntries(nextEntries);
  }, [persistEntries, playbookEntries]);

  const duplicateEntry = useCallback(async (id) => {
    const normalizedId = String(id || '').trim();
    const source = playbookEntries.find((entry) => entry.id === normalizedId);
    if (!source) return null;

    const now = new Date().toISOString();
    const duplicated = normalizePlaybookEntry({
      ...source,
      id: undefined,
      name: `${source.name} Copy`,
      created_at: now,
      updated_at: now,
      last_reviewed_at: '',
    });

    await persistEntries([...playbookEntries, duplicated]);
    return duplicated;
  }, [persistEntries, playbookEntries]);

  const toggleEntryActive = useCallback(async (id) => {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) return null;

    const nextEntries = playbookEntries.map((entry) => (
      entry.id === normalizedId
        ? {
            ...entry,
            is_active: !entry.is_active,
            updated_at: new Date().toISOString(),
          }
        : entry
    ));

    await persistEntries(nextEntries);
    return nextEntries.find((entry) => entry.id === normalizedId) || null;
  }, [persistEntries, playbookEntries]);

  const markEntryReviewed = useCallback(async (id) => {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) return null;

    const timestamp = new Date().toISOString();
    const nextEntries = playbookEntries.map((entry) => (
      entry.id === normalizedId
        ? {
            ...entry,
            last_reviewed_at: timestamp,
            updated_at: timestamp,
          }
        : entry
    ));

    await persistEntries(nextEntries);
    return nextEntries.find((entry) => entry.id === normalizedId) || null;
  }, [persistEntries, playbookEntries]);

  const getEntryBySetupName = useCallback((setupName) => (
    getPlaybookEntryBySetupName(playbookEntries, setupName)
  ), [playbookEntries]);

  // Bulk import (e.g. from an exported strategies file): entries matching an
  // existing setup by name (case-insensitive) are updated in place, everything
  // else is created. Runs as a single persistEntries call/write.
  const importEntries = useCallback(async (rawEntries) => {
    const incoming = Array.isArray(rawEntries) ? rawEntries : [];
    if (incoming.length === 0) return { created: 0, updated: 0 };

    const now = new Date().toISOString();
    const nextEntries = [...playbookEntries];
    let created = 0;
    let updated = 0;

    incoming.forEach((rawEntry) => {
      const name = String(rawEntry?.name || '').trim();
      if (!name) return;

      // Loss (R) / Win Rate are this account's own live trade performance, not
      // portable strategy config — never let an imported file overwrite them.
      const raw = rawEntry?.trigger_spec
        ? { ...rawEntry, trigger_spec: { ...rawEntry.trigger_spec, loss_r: null, win_rate: null } }
        : rawEntry;

      const nameKey = name.toLowerCase();
      const existingIndex = nextEntries.findIndex((entry) => entry.name.toLowerCase() === nameKey);

      if (existingIndex >= 0) {
        const existing = nextEntries[existingIndex];
        // Fully replace with the imported version — only identity/history carry over.
        nextEntries[existingIndex] = normalizePlaybookEntry({
          ...raw,
          id: existing.id,
          created_at: existing.created_at,
          updated_at: now,
        });
        updated += 1;
      } else {
        nextEntries.push(normalizePlaybookEntry({ ...raw, id: undefined, created_at: now, updated_at: now }));
        created += 1;
      }
    });

    await persistEntries(nextEntries);
    return { created, updated };
  }, [persistEntries, playbookEntries]);

  return {
    playbookEntries,
    isSaving,
    saveError,
    createEntry,
    updateEntry,
    deleteEntry,
    duplicateEntry,
    toggleEntryActive,
    markEntryReviewed,
    getEntryBySetupName,
    importEntries,
  };
}

export default usePlaybook;
