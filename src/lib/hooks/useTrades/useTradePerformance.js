/**
 * @file src/lib/hooks/useTrades/useTradePerformance.js
 *
 * Hook for getting performance metrics.
 */

import { useQuery } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTradePerformance(options = {}) {
  return useQuery({
    queryKey: tradeKeys.performance(),
    queryFn: () => tradeService.getPerformanceMetrics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}


