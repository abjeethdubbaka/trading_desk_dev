/**
 * @file src/lib/hooks/useTrades/useTradeFilters.js
 *
 * Hook for trade filters.
 */

import { useCallback, useState } from 'react';

export function useTradeFilters() {
  const [filters, setFilters] = useState({});

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters(prev => {
      const { [key]: _removed, ...rest } = prev;
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


