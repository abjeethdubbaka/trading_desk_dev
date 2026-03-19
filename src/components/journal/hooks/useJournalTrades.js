import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTradeEvents } from './useTradeEvents';

const sanitizeScreenshots = (screenshots) => {
  if (!Array.isArray(screenshots)) return screenshots;
  return screenshots.filter((url) => typeof url === 'string' && !url.startsWith('blob:'));
};

const sanitizeTradeScreenshots = (trade) => ({
  ...trade,
  screenshots: sanitizeScreenshots(trade.screenshots)
});

export function useJournalTrades() {
  const queryClient = useQueryClient();

  // Set up cross-tab event listening
  useTradeEvents();

  const { data: trades = [], isLoading, error } = useQuery({
    queryKey: ['journal-trades'],
    queryFn: () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = window.localStorage.getItem('trades');
          const parsed = stored ? JSON.parse(stored) : [];
          return Array.isArray(parsed) ? parsed.map(sanitizeTradeScreenshots) : [];
        }
      } catch (e) {
        console.error('Failed to load trades from localStorage:', e);
        return [];
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const record = sanitizeTradeScreenshots({ id: Date.now(), ...data });
          const existingTrades = JSON.parse(window.localStorage.getItem('trades') || '[]');
          existingTrades.push(record);
          window.localStorage.setItem('trades', JSON.stringify(existingTrades));
          
          // Dispatch event for cross-tab sync
          window.dispatchEvent(new CustomEvent('trades-updated', { 
            detail: { action: 'create', trade: record } 
          }));
          
          return record;
        }
      } catch (e) {
        console.error('Failed to create trade:', e);
        throw e;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-trades']);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const existingTrades = JSON.parse(window.localStorage.getItem('trades') || '[]');
          const tradeIndex = existingTrades.findIndex(trade => trade.id === id);
          if (tradeIndex !== -1) {
            const updatedTrade = sanitizeTradeScreenshots({ ...existingTrades[tradeIndex], ...data });
            existingTrades[tradeIndex] = updatedTrade;
            window.localStorage.setItem('trades', JSON.stringify(existingTrades));
            
            // Dispatch event for cross-tab sync
            window.dispatchEvent(new CustomEvent('trades-updated', { 
              detail: { action: 'update', trade: updatedTrade } 
            }));
            
            return { id, ...data };
          }
        }
      } catch (e) {
        console.error('Failed to update trade:', e);
        throw e;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['journal-trades']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const existingTrades = JSON.parse(window.localStorage.getItem('trades') || '[]');
          const deletedTrade = existingTrades.find(trade => trade.id === id);
          const filteredTrades = existingTrades.filter(trade => trade.id !== id);
          window.localStorage.setItem('trades', JSON.stringify(filteredTrades));
          
          // Dispatch event for cross-tab sync
          window.dispatchEvent(new CustomEvent('trades-updated', { 
            detail: { action: 'delete', trade: deletedTrade } 
          }));
          
          return { success: true };
        }
      } catch (e) {
        console.error('Failed to delete trade:', e);
        throw e;
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['journal-trades'])
  });

  return {
    trades,
    isLoading,
    error,
    createTrade: createMutation.mutateAsync,
    updateTrade: updateMutation.mutateAsync,
    deleteTrade: deleteMutation.mutate
  };
}
