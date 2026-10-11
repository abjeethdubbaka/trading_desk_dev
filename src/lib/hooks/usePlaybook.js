import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { createVersionRecord, getCurrentVersions, hasVersionableChange } from '@/lib/playbook/versions';
import { PLAYBOOK_VERSIONS_QUERY_KEY } from '@/lib/hooks/usePlaybookVersions';
import { useSettings } from '@/lib/context/SettingsContext';
import {
  PLAYBOOK_FIELD,
  normalizePlaybookEntries,
  normalizePlaybookEntry,
  getPlaybookEntryBySetupName,
  planGalleryImageSync,
  resolvePlaybookImages,
  mergeSetupTypesWithPlaybook,
  withPreservedJournalTemplate,
} from '@/lib/playbook/utils';

export function usePlaybook() {
  const {
    settings,
    saveImmediately,
    isSaving,
    saveError,
  } = useSettings();

  const queryClient = useQueryClient();

  /**
   * Stores a setup's charts in Informative Images, one gallery entry per
   * chart, and leaves the setup holding only their ids. Every setup shares
   * the single 1 MiB Settings document, so charts kept there had to be
   * squeezed small; with a document each, a chart can be stored close to
   * full quality.
   *
   * `entry.images` is the truth for this save. Charts already stored are
   * matched by content and left untouched, new ones are written, and entries
   * for charts that were removed are deleted — including a setup's older
   * shared entry, which is retired once its charts have been split out.
   */
  const externalizeImages = useCallback(async (entry) => {
    const images = Array.isArray(entry?.images) ? entry.images.filter((i) => typeof i === 'string' && i) : [];
    const currentIds = Array.isArray(entry?.images_gallery_ids) ? entry.images_gallery_ids : [];
    const legacyId = String(entry?.images_gallery_id || '').trim();

    const gallery = currentIds.length > 0 || legacyId
      ? await db.informativeImages.list().catch(() => [])
      : [];

    const storedCharts = gallery
      .filter((item) => currentIds.includes(item.id))
      .map((item) => ({ id: item.id, image: Array.isArray(item.images) ? item.images[0] : '' }));

    const { order, create, remove } = planGalleryImageSync(images, storedCharts);

    const created = [];
    for (const image of create) {
      const record = await db.informativeImages.create({
        images: [image],
        category: String(entry?.name || '').trim(),
        category_type: 'setup',
        note: 'Playbook chart',
      });
      created.push(record?.id || '');
    }

    // If any write failed to hand back an id, keep the charts inline rather
    // than lose one.
    if (created.some((id) => !id)) return entry;

    let next = 0;
    const nextIds = order.map((id) => id ?? created[next++]);

    for (const id of remove) {
      await db.informativeImages.delete(id).catch(() => {});
    }
    if (legacyId) {
      await db.informativeImages.delete(legacyId).catch(() => {});
    }

    if (create.length > 0 || remove.length > 0 || legacyId) {
      queryClient.invalidateQueries({ queryKey: ['informativeImages'] });
    }

    return { ...entry, images: [], images_gallery_ids: nextIds, images_gallery_id: '' };
  }, [queryClient]);

  /**
   * Cuts a version when a save changes how a setup is traded. Charts, notes
   * and journal prompts are not versioned: they cannot change an outcome, and
   * a history full of cosmetic edits is one nobody reads.
   *
   * Failing to write a version must never block the save itself — the setup
   * is the record, the version is the trail.
   */
  const recordVersion = useCallback(async (entry, previousEntry) => {
    try {
      const versions = await db.playbookVersions.list();
      const current = getCurrentVersions(versions).get(entry.id) || null;

      // Compared against the last version rather than the setup as it was, so
      // a save that undoes an unversioned edit does not cut a second version.
      const baseline = current ? current.snapshot : previousEntry;
      if (current && !hasVersionableChange(baseline, entry)) return null;

      const record = await db.playbookVersions.create(createVersionRecord(entry, current));
      queryClient.invalidateQueries({ queryKey: PLAYBOOK_VERSIONS_QUERY_KEY });
      return record;
    } catch {
      return null;
    }
  }, [queryClient]);

  /**
   * The live version of a setup, cutting v1 on the spot for a setup that
   * predates versioning. Called when a trade is about to be stamped, so a
   * trade is never credited to rules that were never recorded.
   */
  const ensureCurrentVersion = useCallback(async (entry) => {
    if (!entry?.id) return null;
    try {
      const versions = await db.playbookVersions.list();
      const current = getCurrentVersions(versions).get(entry.id) || null;
      if (current) return current;

      const record = await db.playbookVersions.create(createVersionRecord(entry, null));
      queryClient.invalidateQueries({ queryKey: PLAYBOOK_VERSIONS_QUERY_KEY });
      return record;
    } catch {
      return null;
    }
  }, [queryClient]);

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
    const normalizedEntry = normalizePlaybookEntry(await externalizeImages(normalizePlaybookEntry(entry)));
    const nextEntries = [...playbookEntries, normalizedEntry];
    await persistEntries(nextEntries);
    await recordVersion(normalizedEntry, null);
    return normalizedEntry;
  }, [persistEntries, playbookEntries, externalizeImages, recordVersion]);

  const updateEntry = useCallback(async (id, updates) => {
    const normalizedId = String(id || '').trim();
    if (!normalizedId) return null;

    const existing = playbookEntries.find((entry) => entry.id === normalizedId);
    if (!existing) return null;

    let merged = normalizePlaybookEntry({
      ...existing,
      ...updates,
      id: existing.id,
      // The references are the setup's, never the caller's to drop by omission.
      images_gallery_ids: existing.images_gallery_ids,
      images_gallery_id: existing.images_gallery_id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    });

    // Only a save that actually carries the charts gets to change them — a
    // partial update (a journal template, say) leaves them exactly as they are.
    if (updates && Object.prototype.hasOwnProperty.call(updates, 'images')) {
      merged = normalizePlaybookEntry(await externalizeImages(merged));
    }

    const nextEntries = playbookEntries.map((entry) => (entry.id === normalizedId ? merged : entry));
    await persistEntries(nextEntries);
    await recordVersion(merged, existing);
    return merged;
  }, [persistEntries, playbookEntries, externalizeImages, recordVersion]);

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

    // A copy must not share its original's gallery entry, or editing one
    // setup's charts would silently change the other's.
    let images = Array.isArray(source.images) ? source.images : [];
    if ((source.images_gallery_ids || []).length > 0 || source.images_gallery_id) {
      const gallery = await db.informativeImages.list().catch(() => []);
      const imagesByGalleryId = new Map(gallery.map((item) => [item.id, item.images]));
      images = resolvePlaybookImages(source, imagesByGalleryId);
    }

    const duplicated = normalizePlaybookEntry(await externalizeImages(normalizePlaybookEntry({
      ...source,
      id: undefined,
      name: `${source.name} Copy`,
      images,
      images_gallery_ids: [],
      images_gallery_id: '',
      created_at: now,
      updated_at: now,
      last_reviewed_at: '',
    })));

    await persistEntries([...playbookEntries, duplicated]);
    // A copy starts its own history rather than inheriting the original's.
    await recordVersion(duplicated, null);
    return duplicated;
  }, [persistEntries, playbookEntries, externalizeImages, recordVersion]);

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
    if (incoming.length === 0) return { created: 0, updated: 0, entries: playbookEntries };

    const now = new Date().toISOString();
    const nextEntries = [...playbookEntries];
    const touched = new Set();
    let created = 0;
    let updated = 0;

    for (const rawEntry of incoming) {
      const name = String(rawEntry?.name || '').trim();
      if (!name) continue;

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
          ...withPreservedJournalTemplate(raw, existing),
          id: existing.id,
          // Charts are not part of a strategies file. Whatever this setup
          // already shows stays exactly as it is.
          images: existing.images,
          images_gallery_ids: existing.images_gallery_ids,
          images_gallery_id: existing.images_gallery_id,
          created_at: existing.created_at,
          updated_at: now,
        });
        touched.add(existing.id);
        updated += 1;
      } else {
        const fresh = normalizePlaybookEntry({
          ...raw,
          id: undefined,
          images: [],
          images_gallery_ids: [],
          images_gallery_id: '',
          created_at: now,
          updated_at: now,
        });
        nextEntries.push(fresh);
        touched.add(fresh.id);
        created += 1;
      }
    }

    await persistEntries(nextEntries);

    // An imported file can change how a setup is traded, so it earns a
    // version the same way an edit does.
    for (const entry of nextEntries) {
      if (touched.has(entry.id)) await recordVersion(entry, null);
    }

    // The saved setups, so what travelled with them (alert triggers) can be
    // re-attached by name — ids differ from one account or machine to the next.
    return { created, updated, entries: nextEntries };
  }, [persistEntries, playbookEntries, recordVersion]);

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
    ensureCurrentVersion,
    importEntries,
  };
}

export default usePlaybook;
