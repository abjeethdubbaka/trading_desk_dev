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
  const currentTier = settings?.account_tier || 'custom';
  const currentAccountType = settings?.account_type || 'demo';
  const currentTradingType = settings?.trading_type || 'stocks';
  const { filters = {}, includeStats = false, includePerformance = false, ...queryOptions } = options;

  const filtersWithTier = {
    ...filters,
    account_tier: currentTier,
    account_type: currentAccountType,
    trading_type: currentTradingType,
  };
  const filtersForStats = { ...filters };

  const tradesQuery = useTrades({ filters: filtersWithTier, ...queryOptions });
  const statsQuery = useTradeStats({ filters: filtersForStats, enabled: includeStats });
  const performanceQuery = useTradePerformance({ enabled: includePerformance });

  return {
    trades: tradesQuery.data || [],
    isLoading: tradesQuery.isLoading,
    error: tradesQuery.error,
    refetch: () => {
      tradesQuery.refetch();
      if (includeStats) statsQuery.refetch();
      if (includePerformance) performanceQuery.refetch();
    },
    stats: statsQuery.data,
    performance: performanceQuery.data,
    currentTier
  };
}

