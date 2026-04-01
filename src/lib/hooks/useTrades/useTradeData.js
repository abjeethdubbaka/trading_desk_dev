/**
 * @file src/lib/hooks/useTrades/useTradeData.js
 *
 * Hook for trade export/import.
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTradeData() {
  const queryClient = useQueryClient();

  const exportTrades = useCallback(async (filters = {}) => {
    try {
      const trades = await tradeService.list(filters);
      return JSON.stringify({
        exported_at: new Date().toISOString(),
        count: trades.length,
        trades
      }, null, 2);
    } catch (error) {
      
      throw error;
    }
  }, []);

  const importTrades = useCallback(async (tradesJson) => {
    try {
      const data = JSON.parse(tradesJson);
      const trades = data.trades || [];
      
      const results = await tradeService.bulkCreate(trades);
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      
      return results;
    } catch (error) {
      
      throw error;
    }
  }, [queryClient]);

  return {
    exportTrades,
    importTrades
  };
}


