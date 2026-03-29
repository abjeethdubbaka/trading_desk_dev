/**
 * @file src/lib/hooks/useTrades/useTradesBySetup.js
 *
 * Hook for trades by setup type.
 */

import { useQuery } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTradesBySetup(setupType, options = {}) {
  return useQuery({
    queryKey: [...tradeKeys.list(), { setup_type: setupType }],
    queryFn: () => tradeService.getBySetup(setupType),
    enabled: !!setupType,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}


