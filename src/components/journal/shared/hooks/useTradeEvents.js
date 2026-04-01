import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tradeKeys } from '@/lib/hooks/useTrades/queryKeys';

/**
 * Custom hook for handling cross-tab trade synchronization
 * Listens for trade-updated events and invalidates queries accordingly
 */
export const useTradeEvents = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const applyTradeEventToListCaches = (detail = {}) => {
      const { action, trade, id, tradeId } = detail;
      const removedId = tradeId ?? id ?? trade?.id;

      queryClient.setQueriesData({ queryKey: tradeKeys.lists() }, (oldData) => {
        if (!Array.isArray(oldData)) return oldData;

        if (action === 'delete' && removedId) {
          return oldData.filter((t) => t?.id !== removedId);
        }

        if (action === 'create' && trade?.id) {
          if (oldData.some((t) => t?.id === trade.id)) return oldData;
          return [trade, ...oldData];
        }

        if (action === 'update' && trade?.id) {
          return oldData.map((t) => (t?.id === trade.id ? { ...t, ...trade } : t));
        }

        if (action === 'clear' || action === 'reset') {
          return [];
        }

        return oldData;
      });
    };

    const invalidateTradeQueries = () => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tradeKeys.stats() });
      queryClient.invalidateQueries({ queryKey: tradeKeys.performance() });
    };

    const handleTradesUpdated = (event) => {
      const detail = event?.detail || {};
      applyTradeEventToListCaches(detail);
      invalidateTradeQueries();

      const removedId = detail?.tradeId ?? detail?.id ?? detail?.trade?.id;
      if (detail?.action === 'delete' && removedId) {
        queryClient.removeQueries({ queryKey: tradeKeys.detail(removedId) });
      }
    };

    // Listen for trade events
    window.addEventListener('trades-updated', handleTradesUpdated);
    
    // Also listen for storage events (for cross-tab localStorage changes)
    const handleStorageChange = (event) => {
      if (event.key === 'trades') {
        invalidateTradeQueries();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('trades-updated', handleTradesUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);
};

/**
 * Custom hook for dispatching trade events
 * Used by components that need to notify other tabs of changes
 */
export const useTradeEventDispatcher = () => {
  const dispatchTradeEvent = (action, trade) => {
    const event = new CustomEvent('trades-updated', {
      detail: { action, trade }
    });
    
    window.dispatchEvent(event);
    
    if (process.env.NODE_ENV === 'development') {
      
    }
  };

  return { dispatchTradeEvent };
};


