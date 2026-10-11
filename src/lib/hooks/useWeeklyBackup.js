/**
 * @file src/lib/hooks/useWeeklyBackup.js
 *
 * Weekly data backup. Once a week — Friday, or the next launch after a
 * missed Friday — everything belonging to the selected account tier is
 * written to a JSON file in the backup folder, one file per tier, rewritten
 * in place.
 *
 * Only available in the desktop build: writing to a real folder needs the
 * Electron main process. In a browser the hook reports unsupported and does
 * nothing.
 *
 * Nothing is read until a backup actually runs. The check for whether one is
 * due needs only the date of the last run, so a launch on any other day
 * costs no database reads at all; when a backup does run it takes what is
 * already cached and reads only what is missing.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '@/lib/context/SettingsContext';
import { readWorkflowStore } from '@/lib/review/weeklyWorkflow';
import { db } from '@/lib/db';
import { useQueryClient } from '@tanstack/react-query';
import { tradeKeys } from '@/lib/hooks/useTrades/queryKeys';
import { fetchAllTrades } from '@/lib/hooks/useTrades/useTrades';
import { DATA_POINTS_QUERY_KEY } from '@/lib/hooks/useDataPoints';
import { SETUP_JOURNAL_QUERY_KEY } from '@/lib/hooks/useSetupJournal';
import { INFORMATIVE_IMAGES_QUERY_KEY } from '@/lib/hooks/useInformativeImages';
import { PLAYBOOK_FIELD, normalizePlaybookEntries, resolvePlaybookImages } from '@/lib/playbook/utils';
import { RULES_FIELD, normalizeRuleCategories } from '@/lib/rules/utils';
import { filterJournalEntriesByAccount } from '@/lib/setupJournal/utils';
import { getBackupFileName, isBackupDue } from '@/lib/backup/schedule';

const LAST_RUN_KEY = 'tradedesk:last-backup';

function readLastRuns() {
  try {
    return JSON.parse(localStorage.getItem(LAST_RUN_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function writeLastRun(accountType, isoDate) {
  try {
    localStorage.setItem(LAST_RUN_KEY, JSON.stringify({ ...readLastRuns(), [accountType]: isoDate }));
  } catch {
    // A backup that cannot record itself will simply run again next launch,
    // which is the safe direction to fail in.
  }
}

// Shared across every mounted copy of the hook: one automatic attempt per
// tier per session, however often the app re-renders or data refetches.
const attemptedTiers = new Set();

/** A cached collection, read from the database only if nothing fresh is held. */
function fetchCached(queryClient, queryKey, queryFn) {
  return queryClient.fetchQuery({ queryKey, queryFn, staleTime: 1000 * 60 * 2 });
}

export function getBackupBridge() {
  return typeof window !== 'undefined' ? window.electronAPI?.backup || null : null;
}

/**
 * @param {{ auto?: boolean }} [options] `auto` runs the weekly backup when it
 *   is due. Only the app shell passes it; the Settings card only reports and
 *   runs on demand.
 */
export function useWeeklyBackup({ auto = false } = {}) {
  const { settings } = useSettings();
  const accountType = settings?.account_type || 'demo';
  const queryClient = useQueryClient();

  const bridge = getBackupBridge();
  const [folder, setFolder] = useState('');
  const [lastRunAt, setLastRunAt] = useState(() => readLastRuns()[accountType] || '');
  const [isBackingUp, setIsBackingUp] = useState(false);
  // The latest settings, read when a backup runs, without making the
  // automatic-run effect restart on every settings save.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    setLastRunAt(readLastRuns()[accountType] || '');
  }, [accountType]);

  useEffect(() => {
    if (!bridge) return;
    bridge.getFolder().then((result) => setFolder(result?.folder || '')).catch(() => {});
  }, [bridge]);

  /**
   * Writes this tier's backup. With `skipIfEmpty`, a snapshot holding no
   * strategies and no trades is not written: the automatic run must never
   * overwrite a good file with an empty one because a read came back short.
   */
  const runBackup = useCallback(async ({ skipIfEmpty = false } = {}) => {
    if (!bridge) return null;

    setIsBackingUp(true);
    try {
      const currentSettings = settingsRef.current || {};
      const playbookEntries = normalizePlaybookEntries(currentSettings[PLAYBOOK_FIELD]);
      const ruleCategories = normalizeRuleCategories(currentSettings[RULES_FIELD]);

      // Everything else is read now, from the cache where a screen has already
      // loaded it and from the database where not. A backup that only covers
      // what the current screen happens to have loaded is not a backup.
      const [
        trades,
        dataPoints,
        allJournalEntries,
        informativeImages,
        dailyReviews,
        morningBriefs,
        guardianDays,
        alertTriggers,
        playbookVersions,
        dosAndDonts,
        settingsPresets,
        watchlist,
        expenses,
      ] = await Promise.all([
        fetchAllTrades(queryClient),
        fetchCached(queryClient, DATA_POINTS_QUERY_KEY, () => db.dataPoints.list()),
        fetchCached(queryClient, SETUP_JOURNAL_QUERY_KEY, () => db.setupJournal.list()),
        fetchCached(queryClient, INFORMATIVE_IMAGES_QUERY_KEY, () => db.informativeImages.list()).catch(() => []),
        db.dailyReviews.list().catch(() => []),
        db.morningBriefs.list().catch(() => []),
        db.guardianDays.list().catch(() => []),
        db.alertTriggers.list().catch(() => []),
        db.playbookVersions.list().catch(() => []),
        db.dosAndDonts.get().catch(() => null),
        db.settingsPresets.list().catch(() => []),
        db.watchlist.list().catch(() => []),
        db.finance.list().catch(() => []),
      ]);

      const tierTrades = trades.filter((trade) => (trade?.account_type || 'demo') === accountType);
      if (skipIfEmpty && playbookEntries.length === 0 && tierTrades.length === 0) return null;

      const journalEntries = filterJournalEntriesByAccount(allJournalEntries, accountType);
      const imagesByGalleryId = new Map(
        informativeImages.map((item) => [item.id, Array.isArray(item.images) ? item.images : []]),
      );

      const payload = {
        version: 2,
        app: 'TradeDesk Pro',
        kind: 'weekly-backup',
        account_type: accountType,
        created_at: new Date().toISOString(),
        settings: currentSettings,
        settings_presets: settingsPresets,
        // Charts are files in the images folder, which sits inside this backup
        // folder — so the file records references and the images travel beside
        // it rather than being embedded twice.
        strategies: playbookEntries.map((entry) => ({
          ...entry,
          images: resolvePlaybookImages(entry, imagesByGalleryId),
        })),
        // The rule history behind those strategies: without it, a restored
        // trade's version stamp points at nothing.
        playbook_versions: playbookVersions,
        rule_categories: ruleCategories,
        dos_and_donts: dosAndDonts,
        data_points: dataPoints,
        setup_journal: journalEntries,
        // Every studied chart, including the ones Data Points and Playbook
        // setups reference rather than store themselves. Images moved to disk
        // are references here; the files are in the images folder alongside.
        informative_images: informativeImages,
        images_folder: 'images',
        // Daily Report Cards.
        daily_reviews: dailyReviews,
        // Morning check-ins: sleep, emotions, focus, confidence and the day's goal.
        morning_briefs: morningBriefs,
        // Trading Guardian's timeline of each guarded day.
        guardian_days: guardianDays,
        // Trade Terminal's alert triggers, filed by Playbook strategy.
        alert_triggers: alertTriggers,
        // The weekly review's wins, improvements and focus, kept per week in
        // local storage rather than the database.
        weekly_workflow: readWorkflowStore(),
        watchlist,
        expenses,
        // Trades are stamped with the tier they were taken on, so a tier's
        // backup carries only its own.
        trades: tierTrades,
        // Counts, so a backup can be checked at a glance without reading it.
        manifest: {
          trades: tierTrades.length,
          strategies: playbookEntries.length,
          playbook_versions: playbookVersions.length,
          rule_categories: ruleCategories.length,
          data_points: dataPoints.length,
          setup_journal: journalEntries.length,
          informative_images: informativeImages.length,
          daily_reviews: dailyReviews.length,
          morning_briefs: morningBriefs.length,
          guardian_days: guardianDays.length,
          alert_triggers: alertTriggers.length,
          settings_presets: settingsPresets.length,
          watchlist: watchlist.length,
          expenses: expenses.length,
        },
      };

      const result = await bridge.write({
        fileName: getBackupFileName(accountType),
        contents: JSON.stringify(payload, null, 2),
      });

      const writtenAt = result?.written_at || new Date().toISOString();
      writeLastRun(accountType, writtenAt);
      setLastRunAt(writtenAt);
      return result;
    } finally {
      setIsBackingUp(false);
    }
  }, [bridge, accountType, queryClient]);

  /**
   * Restores this tier from its backup file. The file is the record, so the
   * tier's current trades are removed first — a restore puts the account back
   * to the state the backup describes rather than merging two versions of it.
   */
  const restoreBackup = useCallback(async () => {
    if (!bridge) return null;

    const file = await bridge.read({ fileName: getBackupFileName(accountType) });
    if (!file?.exists) throw new Error('No backup file for this tier yet');

    const payload = JSON.parse(file.contents);
    const backedUpTier = String(payload?.account_type || '').trim();
    if (backedUpTier && backedUpTier !== accountType) {
      throw new Error(`That backup belongs to the ${backedUpTier} tier`);
    }

    const incoming = Array.isArray(payload?.trades) ? payload.trades : [];
    const trades = await fetchAllTrades(queryClient);
    const current = trades.filter((trade) => (trade?.account_type || 'demo') === accountType);

    for (const trade of current) {
      if (trade?.id) await db.trades.delete(trade.id);
    }

    let restored = 0;
    for (const trade of incoming) {
      const { id: _ignoredId, ...tradeData } = trade;
      await db.trades.create({ ...tradeData, account_type: accountType });
      restored += 1;
    }

    await queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
    return { restored, removed: current.length, filePath: file.filePath, backedUpAt: payload?.created_at };
  }, [bridge, accountType, queryClient]);

  const chooseFolder = useCallback(async () => {
    if (!bridge) return null;
    const result = await bridge.chooseFolder();
    if (result?.folder) setFolder(result.folder);
    return result;
  }, [bridge]);

  const revealFolder = useCallback(async () => {
    if (!bridge?.revealFolder) throw new Error('This build cannot open the folder');
    return bridge.revealFolder();
  }, [bridge]);

  // The automatic run: once per tier per session, and only when due.
  useEffect(() => {
    if (!auto || !bridge || attemptedTiers.has(accountType)) return;
    if (!isBackupDue(readLastRuns()[accountType], new Date())) return;
    // Wait for Settings: the strategies and the tier come from it.
    if (!settings) return;

    attemptedTiers.add(accountType);
    runBackup({ skipIfEmpty: true })
      .then((result) => {
        // Nothing to back up yet: try again on the next launch.
        if (!result) attemptedTiers.delete(accountType);
      })
      .catch(() => {
        // Let the next launch try again rather than surfacing a toast here.
        attemptedTiers.delete(accountType);
      });
  }, [auto, bridge, accountType, settings, runBackup]);

  return {
    isSupported: Boolean(bridge),
    folder,
    lastRunAt,
    isBackingUp,
    isDue: isBackupDue(lastRunAt, new Date()),
    runBackup,
    restoreBackup,
    chooseFolder,
    revealFolder,
  };
}

export default useWeeklyBackup;
