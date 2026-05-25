/**
 * @file src/lib/hooks/useTrades/useTrades.js
 *
 * Hook for getting all trades.
 */

import { useQuery } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTrades(options = {}) {
  const { filters = {}, ...queryOptions } = options;

  return useQuery({
    queryKey: tradeKeys.list(filters),
    queryFn: () => tradeService.list(filters),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Retry failed requests 2 times
    ...queryOptions
  });
}


