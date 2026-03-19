import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Custom hook for handling cross-tab trade synchronization
 * Listens for trade-updated events and invalidates queries accordingly
 */
export const useTradeEvents = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleTradesUpdated = (event) => {
      const { action, trade } = event.detail;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Trade event received:', { action, trade });
      }
      
      // Invalidate trades query to refresh data
      queryClient.invalidateQueries(['journal-trades']);
      
      // Invalidate related analytics queries
      queryClient.invalidateQueries(['journal-analytics']);
      
      // Invalidate heatmap data if it exists
      queryClient.invalidateQueries(['heatmap-data']);
      
      // Invalidate calendar data
      queryClient.invalidateQueries(['calendar-trades']);
      
      // Invalidate dashboard data
      queryClient.invalidateQueries(['dashboard-trades']);
    };

    // Listen for trade events
    window.addEventListener('trades-updated', handleTradesUpdated);
    
    // Also listen for storage events (for cross-tab localStorage changes)
    const handleStorageChange = (event) => {
      if (event.key === 'trades') {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Storage change detected, invalidating queries');
        }
        queryClient.invalidateQueries(['journal-trades']);
        queryClient.invalidateQueries(['journal-analytics']);
        queryClient.invalidateQueries(['heatmap-data']);
        queryClient.invalidateQueries(['calendar-trades']);
        queryClient.invalidateQueries(['dashboard-trades']);
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
      console.log('📡 Trade event dispatched:', { action, trade });
    }
  };

  return { dispatchTradeEvent };
};
