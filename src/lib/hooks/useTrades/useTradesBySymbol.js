/**
 * @file src/lib/hooks/useTrades/useTradesBySymbol.js
 *
 * Hook for trades by symbol.
 */

import { useQuery } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTradesBySymbol(symbol, options = {}) {
  return useQuery({
    queryKey: [...tradeKeys.list(), { symbol }],
    queryFn: () => tradeService.getBySymbol(symbol),
    enabled: !!symbol,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}


