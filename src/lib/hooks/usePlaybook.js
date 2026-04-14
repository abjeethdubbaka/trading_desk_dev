import { useCallback, useMemo } from 'react';
import { useSettings } from '@/lib/context/SettingsContext';
import {
  PLAYBOOK_FIELD,
  normalizePlaybookEntries,
  normalizePlaybookEntry,
  getPlaybookEntryBySetupName,
  mergeSetupTypesWithPlaybook,
  createPlaybookEntryFromSetupName,
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

  const seedFromSetupTypes = useCallback(async () => {
    const configuredSetups = Array.isArray(settings?.journal_preferences?.default_setup_types)
      ? settings.journal_preferences.default_setup_types
      : [];

    const existingNameKeys = new Set(playbookEntries.map((entry) => entry.name.toLowerCase()));
    const entriesToSeed = configuredSetups
      .filter((setup) => {
        const normalizedName = String(setup || '').trim().toLowerCase();
        return normalizedName && !existingNameKeys.has(normalizedName);
      })
      .map((setup) => createPlaybookEntryFromSetupName(setup));

    if (entriesToSeed.length === 0) return 0;

    await persistEntries([...playbookEntries, ...entriesToSeed]);
    return entriesToSeed.length;
  }, [persistEntries, playbookEntries, settings?.journal_preferences?.default_setup_types]);

  const getEntryBySetupName = useCallback((setupName) => (
    getPlaybookEntryBySetupName(playbookEntries, setupName)
  ), [playbookEntries]);

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
    seedFromSetupTypes,
    getEntryBySetupName,
  };
}

export default usePlaybook;
