import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { createSettingsService } from '@/lib/services/SettingsService.js';
import { db } from '@/lib/db';

const settingsService = createSettingsService(db);

export function useSettingsMaintenanceActions({ signOut, refetch }) {
  const [isReEnrichingTrades, setIsReEnrichingTrades] = useState(false);

  const handleReEnrichTrades = useCallback(async () => {
    if (isReEnrichingTrades) return;

    const confirmed = window.confirm(
      'Re-enrich all existing trades with share float and float range? This may take a moment for larger journals.'
    );
    if (!confirmed) return;

    setIsReEnrichingTrades(true);
    try {
      const { createTradeService } = await import('@/lib/services/TradeService.js');
      const tradeService = createTradeService(db);
      const result = await tradeService.backfillShareFloatEnrichment();
      const debugRows = Array.isArray(result?.debugRows) ? result.debugRows : [];
      const maxConsoleRows = 200;

      console.groupCollapsed('[Settings] Re-enrich Trades Debug');
      console.info('Summary:', {
        scanned: result?.scanned,
        eligible: result?.eligible,
        updated: result?.updated,
        skipped: result?.skipped,
        failed: result?.failed,
        debugMeta: result?.debugMeta,
      });
      if (debugRows.length > 0) {
        console.table(debugRows.slice(0, maxConsoleRows));
        if (debugRows.length > maxConsoleRows) {
          console.info(
            `Showing first ${maxConsoleRows} debug rows of ${debugRows.length}.`
          );
        }
      } else {
        console.info('No debug rows returned.');
      }
      console.groupEnd();

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
        toast.warning(`${result.failed} trades failed during re-enrich. Check console for details.`);
        console.warn('[Settings] backfillShareFloatEnrichment failures', result.failures);
      }
    } catch (error) {
      toast.error(`Failed to re-enrich trades: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsReEnrichingTrades(false);
    }
  }, [isReEnrichingTrades]);

  const handleClearAndReinit = useCallback(async () => {
    if (window.confirm('This will reset all settings to defaults. Are you sure?')) {
      try {
        await settingsService.clearAndReinit();
        toast.success('Settings cleared and reinitialized!');
        refetch();
      } catch (error) {
        toast.error('Failed to clear settings');
      }
    }
  }, [refetch]);

  const handleSignOut = useCallback(() => {
    if (window.confirm('Sign out?')) signOut();
  }, [signOut]);

  const handleClearLocalCache = useCallback(() => {
    if (window.confirm('Delete ALL local trades? Firebase data is unaffected.')) {
      const confirmation = window.confirm('Are you absolutely sure? This cannot be undone.');
      if (confirmation) {
        localStorage.removeItem('trades');
        window.dispatchEvent(new CustomEvent('trades-updated', { detail: { action: 'reset' } }));
        toast.success('Local cache cleared');
      }
    }
  }, []);

  return {
    isReEnrichingTrades,
    handleReEnrichTrades,
    handleClearAndReinit,
    handleSignOut,
    handleClearLocalCache,
  };
}

