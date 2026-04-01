/**
 * @file src/lib/hooks/useTrades/queryKeys.js
 *
 * Query keys for trade-related React Query operations.
 */

export const tradeKeys = {
  all: ['trades'],
  lists: () => [...tradeKeys.all, 'list'],
  list: (filters) => [...tradeKeys.lists(), filters],
  details: () => [...tradeKeys.all, 'detail'],
  detail: (id) => [...tradeKeys.details(), id],
  stats: () => [...tradeKeys.all, 'stats'],
  statsByPeriod: (period) => [...tradeKeys.stats(), period],
  performance: () => [...tradeKeys.all, 'performance'],
  search: (query) => [...tradeKeys.all, 'search', query]
};


