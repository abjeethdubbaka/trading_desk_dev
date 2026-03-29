/**
 * @file src/lib/hooks/useTrades/useTradesByDateRange.js
 *
 * Hook for trades by date range.
 */

import { useQuery } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTradesByDateRange(startDate, endDate, options = {}) {
  return useQuery({
    queryKey: [...tradeKeys.list(), { date_from: startDate, date_to: endDate }],
    queryFn: () => tradeService.getByDateRange(startDate, endDate),
    enabled: !!(startDate && endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}


