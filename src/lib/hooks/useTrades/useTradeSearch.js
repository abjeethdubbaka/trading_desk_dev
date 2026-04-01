/**
 * @file src/lib/hooks/useTrades/useTradeSearch.js
 *
 * Hook for searching trades.
 */

import { useQuery } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTradeSearch(query, options = {}) {
  return useQuery({
    queryKey: tradeKeys.search(query),
    queryFn: () => tradeService.search(query),
    enabled: !!query && query.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
}


