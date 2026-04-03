/**
 * Calc history hooks: useCalcHistory, useMedia
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { createCalcHistoryService } from '../services/CalcHistoryService.js';
import { createMediaService } from '../services/MediaService.js';
import { db } from '../db/index.js';
import { indexedDBAdapter } from '../db/adapters/IndexedDBAdapter.js';

// Create service instances
const calcHistoryService = createCalcHistoryService(db);
const mediaService = createMediaService(db, indexedDBAdapter);

// Query keys
export const calcHistoryKeys = {
  all: ['calcHistory'],
  lists: () => [...calcHistoryKeys.all, 'list'],
  list: (filters) => [...calcHistoryKeys.lists(), filters],
  details: () => [...calcHistoryKeys.all, 'detail'],
  detail: (id) => [...calcHistoryKeys.details(), id],
  stats: () => [...calcHistoryKeys.all, 'stats'],
  search: (query) => [...calcHistoryKeys.all, 'search', query]
};

export const mediaKeys = {
  all: ['media'],
  lists: () => [...mediaKeys.all, 'list'],
  list: (filters) => [...mediaKeys.lists(), filters],
  details: () => [...mediaKeys.all, 'detail'],
  detail: (id) => [...mediaKeys.details(), id],
  stats: () => [...mediaKeys.all, 'stats'],
  search: (query) => [...mediaKeys.all, 'search', query],
  byTrade: (tradeId) => [...mediaKeys.list(), { trade_id: tradeId }]
};

// Calc history hooks
export function useCalcHistoryItem(id, options = {}) {
  return useQuery({
    queryKey: calcHistoryKeys.detail(id),
    queryFn: () => calcHistoryService.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options
  });
}

export function useCalcHistoryByType(calculationType, options = {}) {
  return useQuery({
    queryKey: [...calcHistoryKeys.list(), { calculation_type: calculationType }],
    queryFn: () => calcHistoryService.getByType(calculationType),
    enabled: !!calculationType,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
}

export function useCalcHistoryBySymbol(symbol, options = {}) {
  return useQuery({
    queryKey: [...calcHistoryKeys.list(), { symbol }],
    queryFn: () => calcHistoryService.getBySymbol(symbol),
    enabled: !!symbol,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
}

export function useRecentCalcHistory(limit = 50, options = {}) {
  return useQuery({
    queryKey: [...calcHistoryKeys.list(), { limit, orderBy: 'created_at:desc' }],
    queryFn: () => calcHistoryService.getRecent(limit),
    staleTime: 1000 * 60, // 1 minute
    ...options
  });
}

export function useCalcHistoryStats(options = {}) {
  return useQuery({
    queryKey: calcHistoryKeys.stats(),
    queryFn: () => calcHistoryService.getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

export function useCalcHistorySearch(query, options = {}) {
  return useQuery({
    queryKey: calcHistoryKeys.search(query),
    queryFn: () => calcHistoryService.search(query),
    enabled: !!query && query.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
}

export function useCalcHistory(options = {}) {
  const { filters = {}, ...queryOptions } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: calcHistoryKeys.list(filters),
    queryFn: () => calcHistoryService.list(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...queryOptions
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => calcHistoryService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate calc history list
      queryClient.invalidateQueries({ queryKey: calcHistoryKeys.lists() });
      queryClient.removeQueries({ queryKey: calcHistoryKeys.detail(deletedId) });
    },
    onError: (_error) => {
      
    }
  });

  const clearMutation = useMutation({
    mutationFn: () => calcHistoryService.clear(),
    onSuccess: () => {
      // Invalidate calc history list
      queryClient.invalidateQueries({ queryKey: calcHistoryKeys.lists() });
      queryClient.removeQueries({ queryKey: calcHistoryKeys.details() });
    },
    onError: (_error) => {
      
    }
  });

  const createMutation = useMutation({
    mutationFn: (calcData) => calcHistoryService.create(calcData),
    onSuccess: (newCalc) => {
      // Invalidate calc history list
      queryClient.invalidateQueries({ queryKey: calcHistoryKeys.lists() });
      queryClient.setQueryData(calcHistoryKeys.detail(newCalc.id), newCalc);
    },
    onError: (_error) => {
      
    }
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    deleteItem: deleteMutation.mutateAsync,
    clearHistory: clearMutation.mutateAsync,
    addToHistory: createMutation.mutateAsync, // Add this for the Calculator component
    isDeleting: deleteMutation.isPending,
    isClearing: clearMutation.isPending,
    isCreating: createMutation.isPending,
    deleteError: deleteMutation.error,
    clearError: clearMutation.error,
    createError: createMutation.error
  };
}

export function useCalcHistoryMutation(options = {}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (calcData) => calcHistoryService.create(calcData),
    onSuccess: (newCalc) => {
      // Invalidate calc history list
      queryClient.invalidateQueries({ queryKey: calcHistoryKeys.lists() });
      queryClient.setQueryData(calcHistoryKeys.detail(newCalc.id), newCalc);
      
      options.onSuccess?.(newCalc);
    },
    onError: (error) => {
      
      options.onError?.(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => calcHistoryService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate calc history list
      queryClient.invalidateQueries({ queryKey: calcHistoryKeys.lists() });
      queryClient.removeQueries({ queryKey: calcHistoryKeys.detail(deletedId) });
      
      options.onSuccess?.(deletedId);
    },
    onError: (error) => {
      
      options.onError?.(error);
    }
  });

  return {
    createCalculation: createMutation.mutateAsync,
    deleteCalculation: deleteMutation.mutateAsync,
    
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    createError: createMutation.error,
    deleteError: deleteMutation.error
  };
}

// Media hooks
export function useMedia(options = {}) {
  const { filters = {}, ...queryOptions } = options;

  return useQuery({
    queryKey: mediaKeys.list(filters),
    queryFn: () => mediaService.list(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...queryOptions
  });
}

export function useMediaItem(id, options = {}) {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: () => mediaService.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options
  });
}

export function useMediaByTrade(tradeId, options = {}) {
  return useQuery({
    queryKey: mediaKeys.byTrade(tradeId),
    queryFn: () => mediaService.getByTrade(tradeId),
    enabled: !!tradeId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
}

export function useScreenshotsByTrade(tradeId, options = {}) {
  return useQuery({
    queryKey: [...mediaKeys.list(), { trade_id: tradeId, media_type: 'screenshot' }],
    queryFn: () => mediaService.getScreenshotsByTrade(tradeId),
    enabled: !!tradeId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
}

export function useAllScreenshots(options = {}) {
  return useQuery({
    queryKey: [...mediaKeys.list(), { media_type: 'screenshot' }],
    queryFn: () => mediaService.getScreenshots(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
}

export function useMediaStats(options = {}) {
  return useQuery({
    queryKey: mediaKeys.stats(),
    queryFn: () => mediaService.getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}

export function useMediaSearch(query, options = {}) {
  return useQuery({
    queryKey: mediaKeys.search(query),
    queryFn: () => mediaService.search(query),
    enabled: !!query && query.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options
  });
}

export function useMediaMutation(options = {}) {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ file, metadata }) => mediaService.uploadFile(file, metadata),
    onSuccess: (newMedia) => {
      // Invalidate media list
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.setQueryData(mediaKeys.detail(newMedia.id), newMedia);
      
      options.onSuccess?.(newMedia);
    },
    onError: (error) => {
      
      options.onError?.(error);
    }
  });

  const uploadScreenshotMutation = useMutation({
    mutationFn: ({ imageData, metadata }) => mediaService.uploadScreenshot(imageData, metadata),
    onSuccess: (newMedia) => {
      // Invalidate media list
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.setQueryData(mediaKeys.detail(newMedia.id), newMedia);
      
      options.onSuccess?.(newMedia);
    },
    onError: (error) => {
      
      options.onError?.(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, changes }) => mediaService.update(id, changes),
    onSuccess: (updatedMedia) => {
      // Invalidate media list
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.setQueryData(mediaKeys.detail(updatedMedia.id), updatedMedia);
      
      options.onSuccess?.(updatedMedia);
    },
    onError: (error) => {
      
      options.onError?.(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => mediaService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate media list
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.removeQueries({ queryKey: mediaKeys.detail(deletedId) });
      
      options.onSuccess?.(deletedId);
    },
    onError: (error) => {
      
      options.onError?.(error);
    }
  });

  return {
    uploadFile: uploadMutation.mutateAsync,
    uploadScreenshot: uploadScreenshotMutation.mutateAsync,
    updateMedia: updateMutation.mutateAsync,
    deleteMedia: deleteMutation.mutateAsync,
    
    isUploading: uploadMutation.isPending || uploadScreenshotMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    uploadError: uploadMutation.error || uploadScreenshotMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error
  };
}

// Storage management hooks
export function useStorageUsage() {
  return useQuery({
    queryKey: ['storage', 'usage'],
    queryFn: () => mediaService.getStorageUsage(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useStorageManagement() {
  const queryClient = useQueryClient();

  const cleanupMutation = useMutation({
    mutationFn: (daysOld) => mediaService.cleanupOlderThan(daysOld),
    onSuccess: () => {
      // Invalidate media and storage queries
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['storage', 'usage'] });
    },
    onError: (_error) => {
      
    }
  });

  const optimizeMutation = useMutation({
    mutationFn: () => mediaService.optimizeStorage(),
    onSuccess: () => {
      // Invalidate media and storage queries
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['storage', 'usage'] });
    },
    onError: (_error) => {
      
    }
  });

  return {
    cleanupOlderThan: cleanupMutation.mutateAsync,
    optimizeStorage: optimizeMutation.mutateAsync,
    
    isCleaning: cleanupMutation.isPending,
    isOptimizing: optimizeMutation.isPending,
    
    cleanupError: cleanupMutation.error,
    optimizeError: optimizeMutation.error
  };
}

// Combined hooks
export function useCalcHistoryWithMedia(calculationId, options = {}) {
  const calcQuery = useCalcHistoryItem(calculationId, options);
  const mediaQuery = useMedia({ 
    filters: { calculation_id: calculationId },
    enabled: !!calculationId 
  });

  return {
    calculation: calcQuery.data,
    media: mediaQuery.data || [],
    isLoading: calcQuery.isLoading || mediaQuery.isLoading,
    error: calcQuery.error || mediaQuery.error,
    refetch: () => {
      calcQuery.refetch();
      mediaQuery.refetch();
    }
  };
}

export function useTradeMedia(tradeId, options = {}) {
  const mediaQuery = useMediaByTrade(tradeId, options);
  const screenshotsQuery = useScreenshotsByTrade(tradeId, options);

  return {
    media: mediaQuery.data || [],
    screenshots: screenshotsQuery.data || [],
    isLoading: mediaQuery.isLoading || screenshotsQuery.isLoading,
    error: mediaQuery.error || screenshotsQuery.error,
    refetch: () => {
      mediaQuery.refetch();
      screenshotsQuery.refetch();
    }
  };
}

// Utility hooks
export function useCalcHistoryFilters() {
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

export function useMediaFilters() {
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


