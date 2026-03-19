import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Utility functions for calculating current balance

export const getCurrentBalance = (initialAccountSize, trades) => {
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  return initialAccountSize + totalPnL;
};

export const useCurrentBalance = () => {
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['journal-trades'],
    queryFn: () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = window.localStorage.getItem('trades');
          return stored ? JSON.parse(stored) : [];
        }
      } catch (e) {
        console.error('Failed to load trades from localStorage:', e);
        return [];
      }
    }
  });

  const initialBalance = settings?.[0]?.account_size || 50000;
  const currentBalance = getCurrentBalance(initialBalance, trades);

  return {
    initialBalance,
    currentBalance,
    totalPnL: currentBalance - initialBalance
  };
};
