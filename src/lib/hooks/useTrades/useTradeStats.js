/**
 * @file src/lib/hooks/useTrades/useTradeStats.js
 *
 * Hook for getting trade statistics.
 */

import { useQuery } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTradeStats(options = {}) {
  const { filters = {}, ...queryOptions } = options;

  return useQuery({
    queryKey: tradeKeys.stats(),
    queryFn: () => tradeService.getStats(filters),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    ...queryOptions
  });
}


