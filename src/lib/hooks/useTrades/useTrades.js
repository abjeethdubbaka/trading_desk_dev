/**
 * @file src/lib/hooks/useTrades/useTrades.js
 *
 * Hook for getting trades.
 *
 * The trades collection is read once and shared. Every caller's filters —
 * tier, account type, symbol, date range, sort, limit — are applied to that
 * one cached list in memory, so the Journal, Dashboard, calculator and
 * watchers opening together cost one Firestore read, not one each.
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { selectTrades } from '../../db/adapters/firebase-simple/trades.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

/** The one cache entry every trade view is derived from. */
export const ALL_TRADES_QUERY_KEY = tradeKeys.list({});

const ALL_TRADES_QUERY = {
  queryKey: ALL_TRADES_QUERY_KEY,
  queryFn: () => tradeService.list(),
  staleTime: 1000 * 60 * 10,
  gcTime: 1000 * 60 * 30,
};

/**
 * The full trade list from the cache, reading the database only when the
 * cache is empty or stale. For work outside a component, such as a backup.
 */
export function fetchAllTrades(queryClient) {
  return queryClient.fetchQuery(ALL_TRADES_QUERY);
}

export function useTrades(options = {}) {
  const { filters = {}, ...queryOptions } = options;

  // Callers build a fresh filters object each render; keying the selector on
  // its contents lets React Query reuse the previous result while nothing
  // has changed.
  const filterKey = JSON.stringify(filters);
  const select = useCallback(
    (trades) => selectTrades(trades, JSON.parse(filterKey)),
    [filterKey],
  );

  return useQuery({
    ...ALL_TRADES_QUERY,
    select,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Retry failed requests 2 times
    ...queryOptions,
  });
}
