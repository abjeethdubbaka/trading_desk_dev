import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { createSettingsService } from '@/lib/services/SettingsService.js';
import { db } from '@/lib/db';

const settingsService = createSettingsService(db);

export function useSettingsMaintenanceActions({ signOut, refetch, confirmFn }) {
  const [isReEnrichingTrades, setIsReEnrichingTrades] = useState(false);

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
  };
}
