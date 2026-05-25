import { useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { validateTrade } from '@/lib/validation/trades';
import { buildInlineUpdatePayload } from '../utils/tradePayloadMappers';
import { tradeKeys } from '@/lib/hooks/useTrades/queryKeys';
import { useJournalModal } from './useJournalModal';
import { useJournalBulkActions } from './useJournalBulkActions';

export function useJournalTradeManagement({ createTrade, updateTrade, deleteTrade, confirmFn }) {
  const confirm = useCallback(async (opts) => {
    if (confirmFn) return confirmFn(opts);
    return window.confirm(opts?.title ?? 'Are you sure?');
  }, [confirmFn]);

  const queryClient = useQueryClient();
  const modal = useJournalModal({ createTrade, updateTrade });
  const bulkActions = useJournalBulkActions({ updateTrade, deleteTrade });

  const handleDelete = useCallback(async (id) => {
    const ok = await confirm({
      title: 'Delete this trade?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteTrade(id);
      toast.success('Trade deleted');
    } catch (error) {
      toast.error(`Delete failed: ${error.message}`);
    }
  }, [confirm, deleteTrade]);

  const handleInlineUpdateTrade = useCallback(async (trade, changes) => {
    if (!trade?.id) throw new Error('Missing trade id');

    const payload = buildInlineUpdatePayload(trade, changes);
    const validation = validateTrade(payload);

    if (!validation.isValid) {
      const message = `Trade validation failed: ${(validation.errors || []).join(', ')}`;
      toast.error(message);
      throw new Error(message);
    }

    // Snapshot all list caches for rollback on failure
    const snapshot = queryClient.getQueriesData({ queryKey: tradeKeys.lists() });
    queryClient.setQueriesData({ queryKey: tradeKeys.lists() }, (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((t) => (t.id === trade.id ? { ...t, ...payload } : t));
    });

    try {
      const updated = await updateTrade({ id: trade.id, data: payload });
      toast.success(`${updated?.symbol || trade.symbol || 'Trade'} updated`);
      return updated;
    } catch (error) {
      snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      const codeText = error?.code ? ` (${error.code})` : '';
      toast.error(`Inline update failed${codeText}: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }, [updateTrade, queryClient]);

  return {
    ...modal,
    handleDelete,
    handleInlineUpdateTrade,
    ...bulkActions,
  };
}
