/**
 * @file src/lib/hooks/useTrades/useTradeStatsByPeriod.js
 *
 * Hook for getting stats by period.
 */

import { useQuery } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTradeStatsByPeriod(period = 'month', options = {}) {
  return useQuery({
    queryKey: tradeKeys.statsByPeriod(period),
    queryFn: () => tradeService.getStatsByPeriod(period),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}


