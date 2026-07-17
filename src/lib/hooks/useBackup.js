import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { tradeKeys } from './useTrades/queryKeys';
import { settingsKeys } from '../utils/queryKeys';

const LAST_BACKUP_KEY = 'tradedesk_last_backup';
const AUTO_BACKUP_RUN_KEY = 'tradedesk_auto_backup_last_run';
const AUTO_BACKUP_HOUR = 10; // 10 AM

export function getLastBackupInfo() {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLastBackupInfo(info) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, JSON.stringify(info));
  } catch {}
}

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useBackup() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  const exportBackup = useCallback(async () => {
    setIsExporting(true);
    try {
      const [trades, settings, dosAndDonts] = await Promise.all([
        db.trades.list({}),
        db.settings.get(),
        db.dosAndDonts.get(),
      ]);

      const backup = {
        version: 1,
        app: 'TradeDesk Pro',
        exported_at: new Date().toISOString(),
        trades: trades || [],
        settings: settings || {},
        dosAndDonts: dosAndDonts || {},
      };

      const date = new Date().toISOString().slice(0, 10);
      triggerDownload(JSON.stringify(backup, null, 2), `tradedesk-backup-${date}.json`);

      const info = { at: new Date().toISOString(), tradesCount: (trades || []).length };
      saveLastBackupInfo(info);
      return info;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const importBackup = useCallback(async (backupData, options = {}) => {
    setIsImporting(true);
    try {
      const results = { trades: 0, settings: false, dosAndDonts: false };

      if (options.trades && Array.isArray(backupData.trades) && backupData.trades.length > 0) {
        for (const trade of backupData.trades) {
          const { id: _id, ...tradeData } = trade;
          await db.trades.create(tradeData);
        }
        results.trades = backupData.trades.length;
        queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      }

      if (options.settings && backupData.settings && Object.keys(backupData.settings).length > 0) {
        const { id: _id, ...settingsData } = backupData.settings;
        await db.settings.save(settingsData);
        queryClient.invalidateQueries({ queryKey: settingsKeys.all });
        results.settings = true;
      }

      if (options.dosAndDonts && backupData.dosAndDonts && Object.keys(backupData.dosAndDonts).length > 0) {
        const { id: _id, ...rulesData } = backupData.dosAndDonts;
        await db.dosAndDonts.save(rulesData);
        queryClient.invalidateQueries({ queryKey: ['dosAndDonts'] });
        results.dosAndDonts = true;
      }

      return results;
    } finally {
      setIsImporting(false);
    }
  }, [queryClient]);

  return { isExporting, isImporting, exportBackup, importBackup };
}

function shouldRunAutoBackup() {
  try {
    const lastRun = localStorage.getItem(AUTO_BACKUP_RUN_KEY);
    const now = new Date();
    if (now.getHours() < AUTO_BACKUP_HOUR) return false;
    if (!lastRun) return true;
    const last = new Date(lastRun);
    return last.toDateString() !== now.toDateString();
  } catch {
    return false;
  }
}

function markAutoBackupRan() {
  try {
    localStorage.setItem(AUTO_BACKUP_RUN_KEY, new Date().toISOString());
  } catch {}
}

export function useAutoBackup() {
  const hasTriedRef = useRef(false);

  useEffect(() => {
    if (hasTriedRef.current) return;
    hasTriedRef.current = true;

    if (!shouldRunAutoBackup()) return;

    const run = async () => {
      try {
        const [trades, settings, dosAndDonts] = await Promise.all([
          db.trades.list({}),
          db.settings.get(),
          db.dosAndDonts.get(),
        ]);

        const backup = {
          version: 1,
          app: 'TradeDesk Pro',
          exported_at: new Date().toISOString(),
          trades: trades || [],
          settings: settings || {},
          dosAndDonts: dosAndDonts || {},
        };

        const info = {
          at: new Date().toISOString(),
          tradesCount: (trades || []).length,
          data: backup,
        };

        localStorage.setItem(LAST_BACKUP_KEY, JSON.stringify({ at: info.at, tradesCount: info.tradesCount }));
        markAutoBackupRan();
      } catch {
        // Silent — auto-backup must not disrupt the user
      }
    };

    run();
  }, []);
}
