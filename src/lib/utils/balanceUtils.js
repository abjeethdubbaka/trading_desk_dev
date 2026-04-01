import { useQuery } from '@tanstack/react-query';

// Utility functions for calculating current balance

export const getCurrentBalance = (initialAccountSize, trades) => {
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  return initialAccountSize + totalPnL;
};

export const useCurrentBalance = () => {
  // Use the settings hook instead of base44
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      // Import dynamically to avoid circular dependencies
      const { createSettingsService } = await import('@/lib/services/SettingsService.js');
      const { db } = await import('@/lib/db');
      const settingsService = createSettingsService(db);
      return settingsService.get();
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Use the trades hook instead of localStorage
  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      // Import dynamically to avoid circular dependencies
      const { createTradeService } = await import('@/lib/services/TradeService.js');
      const { db } = await import('@/lib/db');
      const tradeService = createTradeService(db);
      return tradeService.list();
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const initialBalance = settings?.account_size || 50000;
  const currentBalance = getCurrentBalance(initialBalance, trades);

  return {
    initialBalance,
    currentBalance,
    totalPnL: currentBalance - initialBalance
  };
};


