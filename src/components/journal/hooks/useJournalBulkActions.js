import { useCallback } from 'react';
import { toast } from 'sonner';

export function useJournalBulkActions({ updateTrade, deleteTrade }) {
  const handleBulkDelete = useCallback(async (ids) => {
    if (!ids?.length) return;
    const results = await Promise.allSettled(ids.map((id) => deleteTrade(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    const deleted = ids.length - failed;
    if (deleted > 0) toast.success(`Deleted ${deleted} trade${deleted !== 1 ? 's' : ''}`);
    if (failed > 0) toast.error(`${failed} trade${failed !== 1 ? 's' : ''} could not be deleted`);
  }, [deleteTrade]);

  const handleBulkTag = useCallback(async (trades, tagNames) => {
    if (!trades?.length || !tagNames?.length) return;
    const results = await Promise.allSettled(trades.map(async (trade) => {
      const existingTags = Array.isArray(trade.tags) ? trade.tags : [];
      const merged = [...new Set([...existingTags, ...tagNames])];
      await updateTrade({ id: trade.id, data: { ...trade, tags: merged } });
    }));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) toast.error(`Tags could not be applied to ${failed} trade${failed !== 1 ? 's' : ''}`);
    else toast.success(`Tags added to ${trades.length} trade${trades.length !== 1 ? 's' : ''}`);
  }, [updateTrade]);

  const handleBulkMarkPlan = useCallback(async (trades, followed) => {
    if (!trades?.length) return;
    const results = await Promise.allSettled(
      trades.map((trade) => updateTrade({ id: trade.id, data: { ...trade, followed_plan: followed } }))
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const updated = trades.length - failed;
    if (updated > 0) toast.success(`Marked ${updated} trade${updated !== 1 ? 's' : ''} as ${followed ? 'followed' : 'violated'}`);
    if (failed > 0) toast.error(`${failed} trade${failed !== 1 ? 's' : ''} could not be updated`);
  }, [updateTrade]);

  return { handleBulkDelete, handleBulkTag, handleBulkMarkPlan };
}
