import { useState, useCallback, useMemo, useEffect } from 'react';

export function useJournalSelection({ trades = [], resetSignal } = {}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Clear selection whenever filters/sort change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [resetSignal]);

  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePage = useCallback((pageTrades) => {
    const pageIds = pageTrades.map((t) => t.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [selectedIds]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const selectedTrades = useMemo(
    () => trades.filter((t) => selectedIds.has(t.id)),
    [trades, selectedIds],
  );

  const pageIds = trades.map((t) => t.id);
  const isAllSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const isIndeterminate = !isAllSelected && pageIds.some((id) => selectedIds.has(id));

  return {
    selectedIds,
    selectedTrades,
    toggle,
    togglePage: () => togglePage(trades),
    clear,
    isAllSelected,
    isIndeterminate,
    count: selectedIds.size,
  };
}
