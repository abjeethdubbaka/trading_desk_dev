/**
 * @file src/lib/hooks/useTrades/useTrade.js
 *
 * Hook for getting a single trade.
 */

import { useQuery } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTrade(id, options = {}) {
  return useQuery({
    queryKey: tradeKeys.detail(id),
    queryFn: () => tradeService.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options
  });
}


