/**
 * Trade hooks: useTrades, useTrade, useTradeStats, useJournal, useTradesMutation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { createTradeService } from '../services/TradeService.js';
import { db } from '../db/index.js';
import { useSettings } from '../SettingsContext.jsx';

// Create trade service instance
const tradeService = createTradeService(db);

// Query keys
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

// Hook for getting all trades
export function useTrades(options = {}) {
  const { filters = {}, ...queryOptions } = options;

  return useQuery({
    queryKey: tradeKeys.list(filters),
    queryFn: () => tradeService.list(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...queryOptions
  });
}

// Hook for getting a single trade
export function useTrade(id, options = {}) {
  return useQuery({
    queryKey: tradeKeys.detail(id),
    queryFn: () => tradeService.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options
  });
}

// Hook for getting trade statistics
export function useTradeStats(options = {}) {
  const { filters = {}, ...queryOptions } = options;

  return useQuery({
    queryKey: tradeKeys.stats(),
    queryFn: () => tradeService.getStats(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...queryOptions
  });
}

// Hook for getting stats by period
export function useTradeStatsByPeriod(period = 'month', options = {}) {
  return useQuery({
    queryKey: tradeKeys.statsByPeriod(period),
    queryFn: () => tradeService.getStatsByPeriod(period),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

// Hook for getting performance metrics
export function useTradePerformance(options = {}) {
  return useQuery({
    queryKey: tradeKeys.performance(),
    queryFn: () => tradeService.getPerformanceMetrics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

// Hook for searching trades
export function useTradeSearch(query, options = {}) {
  return useQuery({
    queryKey: tradeKeys.search(query),
    queryFn: () => tradeService.search(query),
    enabled: !!query && query.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
}

// Hook for trades by symbol
export function useTradesBySymbol(symbol, options = {}) {
  return useQuery({
    queryKey: [...tradeKeys.list(), { symbol }],
    queryFn: () => tradeService.getBySymbol(symbol),
    enabled: !!symbol,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

// Hook for trades by setup type
export function useTradesBySetup(setupType, options = {}) {
  return useQuery({
    queryKey: [...tradeKeys.list(), { setup_type: setupType }],
    queryFn: () => tradeService.getBySetup(setupType),
    enabled: !!setupType,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

// Hook for trades by date range
export function useTradesByDateRange(startDate, endDate, options = {}) {
  return useQuery({
    queryKey: [...tradeKeys.list(), { date_from: startDate, date_to: endDate }],
    queryFn: () => tradeService.getByDateRange(startDate, endDate),
    enabled: !!(startDate && endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

// Combined hook for journal functionality
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

// Mutation hooks
export function useTradesMutation(options = {}) {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const currentTier = settings.account_tier || 'custom';

  const createMutation = useMutation({
    mutationFn: (tradeData) => {
      // Add current account tier to trade data
      const tradeWithTier = {
        ...tradeData,
        account_tier: currentTier
      };
      return tradeService.create(tradeWithTier);
    },
    onSuccess: (newTrade) => {
      // Invalidate trades list
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.setQueryData(tradeKeys.detail(newTrade.id), newTrade);
      
      options.onSuccess?.(newTrade);
    },
    onError: (error) => {
      console.error('Create trade error:', error);
      options.onError?.(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tradeService.update(id, data),
    onSuccess: (updatedTrade) => {
      // Invalidate trades list
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.setQueryData(tradeKeys.detail(updatedTrade.id), updatedTrade);
      
      options.onSuccess?.(updatedTrade);
    },
    onError: (error) => {
      console.error('Update trade error:', error);
      options.onError?.(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tradeService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate trades list
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.removeQueries({ queryKey: tradeKeys.detail(deletedId) });
      
      options.onSuccess?.(deletedId);
    },
    onError: (error) => {
      console.error('Delete trade error:', error);
      options.onError?.(error);
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (tradesArray) => tradeService.bulkCreate(tradesArray),
    onSuccess: (newTrades) => {
      // Invalidate trades list
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      
      // Add new trades to cache
      newTrades.forEach(trade => {
        queryClient.setQueryData(tradeKeys.detail(trade.id), trade);
      });
      
      options.onSuccess?.(newTrades);
    },
    onError: (error) => {
      console.error('Bulk create trades error:', error);
      options.onError?.(error);
    }
  });

  return {
    createTrade: createMutation.mutateAsync,
    updateTrade: updateMutation.mutateAsync,
    deleteTrade: deleteMutation.mutateAsync,
    bulkCreateTrades: bulkCreateMutation.mutateAsync,
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
    
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    bulkCreateError: bulkCreateMutation.error
  };
}

// Hook for position size calculation
export function usePositionSizeCalculation(options = {}) {
  const queryClient = useQueryClient();

  const calculateMutation = useMutation({
    mutationFn: (params) => tradeService.calculatePositionSize(params),
    onSuccess: (result) => {
      // Invalidate calc history
      queryClient.invalidateQueries({ queryKey: ['calcHistory'] });
      
      options.onSuccess?.(result);
    },
    onError: (error) => {
      console.error('Position size calculation error:', error);
      options.onError?.(error);
    }
  });

  return {
    calculatePositionSize: calculateMutation.mutateAsync,
    isCalculating: calculateMutation.isPending,
    calculationError: calculateMutation.error,
    calculation: calculateMutation.data
  };
}

// Utility hooks
export function useTradeFilters() {
  const [filters, setFilters] = React.useState({});

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    filters,
    updateFilter,
    clearFilters,
    removeFilter,
    hasFilters: Object.keys(filters).length > 0
  };
}

// Hook for trade validation
export function useTradeValidation() {
  const validateTrade = useCallback((tradeData) => {
    try {
      const validation = tradeService.validate(tradeData);
      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }, []);

  return { validateTrade };
}

// Hook for trade export/import
export function useTradeData() {
  const queryClient = useQueryClient();

  const exportTrades = useCallback(async (filters = {}) => {
    try {
      const trades = await tradeService.list(filters);
      return JSON.stringify({
        exported_at: new Date().toISOString(),
        count: trades.length,
        trades
      }, null, 2);
    } catch (error) {
      console.error('Export trades error:', error);
      throw error;
    }
  }, []);

  const importTrades = useCallback(async (tradesJson) => {
    try {
      const data = JSON.parse(tradesJson);
      const trades = data.trades || [];
      
      const results = await tradeService.bulkCreate(trades);
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      
      return results;
    } catch (error) {
      console.error('Import trades error:', error);
      throw error;
    }
  }, [queryClient]);

  return {
    exportTrades,
    importTrades
  };
}
