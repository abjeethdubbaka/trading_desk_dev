import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { createSettingsService } from '@/lib/services/SettingsService.js';
import { db } from '@/lib/db';

const settingsService = createSettingsService(db);

function fixDateYear(iso, targetYear) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() === targetYear) return null; // already correct
  if (d.getFullYear() >= 2010) return null; // looks intentional, leave alone
  d.setFullYear(targetYear);
  return d.toISOString();
}

export function useSettingsMaintenanceActions({ signOut, refetch, confirmFn }) {
  const [isReEnrichingTrades, setIsReEnrichingTrades] = useState(false);
  const [isFixingDates, setIsFixingDates] = useState(false);

  const confirm = useCallback(async (opts) => {
    if (confirmFn) return confirmFn(opts);
    return window.confirm(opts?.title ?? 'Are you sure?');
  }, [confirmFn]);

  const handleReEnrichTrades = useCallback(async () => {
    if (isReEnrichingTrades) return;

    const confirmed = await confirm({
      title: 'Re-enrich all trades?',
      description: 'Updates share float and float range for every trade. May take a moment for larger journals.',
      confirmLabel: 'Re-enrich',
      destructive: false,
    });
    if (!confirmed) return;

    setIsReEnrichingTrades(true);
    try {
      const { createTradeService } = await import('@/lib/services/TradeService.js');
      const tradeService = createTradeService(db);
      const result = await tradeService.backfillShareFloatEnrichment();

      if (result.updated > 0) {
        toast.success(
          `Re-enrich complete: updated ${result.updated} of ${result.eligible} eligible trades (${result.scanned} scanned).`
        );
      } else {
        toast.info(
          `Re-enrich complete: no updates needed (${result.scanned} scanned, ${result.eligible} eligible).`
        );
      }

      if (result.failed > 0) {
        toast.warning(`${result.failed} trades failed during re-enrich.`);
      }
    } catch (error) {
      toast.error(`Failed to re-enrich trades: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsReEnrichingTrades(false);
    }
  }, [isReEnrichingTrades]);

  const handleClearAndReinit = useCallback(async () => {
    const ok = await confirm({
      title: 'Reset all settings to defaults?',
      description: 'This cannot be undone.',
      confirmLabel: 'Reset',
      destructive: true,
    });
    if (!ok) return;
    try {
      await settingsService.clearAndReinit();
      toast.success('Settings cleared and reinitialized!');
      refetch();
    } catch {
      toast.error('Failed to clear settings');
    }
  }, [confirm, refetch]);

  const handleSignOut = useCallback(async () => {
    const ok = await confirm({ title: 'Sign out?', confirmLabel: 'Sign out', destructive: false });
    if (ok) signOut();
  }, [confirm, signOut]);

  const handleFixImportDates = useCallback(async () => {
    if (isFixingDates) return;
    const ok = await confirm({
      title: 'Fix imported trade dates?',
      description: 'Trades with a year before 2010 (e.g. 2001 from a bad import) will have their year updated to the current year. This cannot be undone.',
      confirmLabel: 'Fix dates',
      destructive: false,
    });
    if (!ok) return;

    setIsFixingDates(true);
    try {
      const trades = await db.trades.list();
      const targetYear = new Date().getFullYear();
      let updated = 0;

      for (const trade of trades) {
        const patches = {};
        const fe = fixDateYear(trade.entry_time, targetYear);
        const fx = fixDateYear(trade.exit_time, targetYear);
        if (fe) patches.entry_time = fe;
        if (fx) patches.exit_time = fx;
        if (Object.keys(patches).length > 0) {
          await db.trades.update(trade.id, patches);
          updated++;
        }
      }

      if (updated > 0) {
        toast.success(`Fixed dates on ${updated} trade${updated === 1 ? '' : 's'}.`);
      } else {
        toast.info('No trades needed a date fix.');
      }
    } catch (error) {
      toast.error(`Failed to fix dates: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsFixingDates(false);
    }
  }, [isFixingDates, confirm]);

  const handleClearLocalCache = useCallback(async () => {
    const ok = await confirm({
      title: 'Delete all local trades?',
      description: 'Firebase data is unaffected, but this removes all locally cached trades and cannot be undone.',
      confirmLabel: 'Delete local cache',
      destructive: true,
    });
    if (!ok) return;
    localStorage.removeItem('trades');
    window.dispatchEvent(new CustomEvent('trades-updated', { detail: { action: 'reset' } }));
    toast.success('Local cache cleared');
  }, [confirm]);

  return {
    isReEnrichingTrades,
    handleReEnrichTrades,
    handleClearAndReinit,
    handleSignOut,
    handleClearLocalCache,
    isFixingDates,
    handleFixImportDates,
  };
}
