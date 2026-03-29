/**
 * @file src/lib/hooks/useTrades/useJournal.js
 *
 * Combined hook for journal functionality.
 */

import { useSettings } from '../../context/SettingsContext.jsx';
import { useTrades } from './useTrades.js';
import { useTradeStats } from './useTradeStats.js';
import { useTradePerformance } from './useTradePerformance.js';

export function useJournal(options = {}) {
  const { settings } = useSettings();
  const currentTier = settings.account_tier || 'custom';
  const { filters = {}, ...queryOptions } = options;

  // Add account tier filter for trades list (show only current tier trades)
  const filtersWithTier = {
    ...filters,
    account_tier: currentTier
  };

  // But for stats and performance, use all trades (no account_tier filter)
  const filtersForStats = { ...filters };
  delete filtersForStats.account_tier; // Remove tier filter for stats

  const tradesQuery = useTrades({ filters: filtersWithTier, ...queryOptions });
  const statsQuery = useTradeStats({ filters: filtersForStats });
  const performanceQuery = useTradePerformance();

  return {
    trades: tradesQuery.data || [],
    isLoading: tradesQuery.isLoading || statsQuery.isLoading || performanceQuery.isLoading,
    error: tradesQuery.error || statsQuery.error || performanceQuery.error,
    refetch: () => {
      tradesQuery.refetch();
      statsQuery.refetch();
      performanceQuery.refetch();
    },
    stats: statsQuery.data,
    performance: performanceQuery.data,
    currentTier
  };
}


