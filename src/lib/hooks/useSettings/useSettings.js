/**
 * @file src/lib/hooks/useSettings/useSettings.js
 *
 * Main settings hook with debounced auto-save.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';
import { createSettingsService } from '../../services/SettingsService.js';
import { db } from '../../db/index.js';
import { settingsKeys } from '../../utils/queryKeys';
import {
  detectTierFromSettings,
  getTierSettingsFields,
  sanitizeTierSettingsPayload,
  saveTierCustomizations,
} from '../../config/accountTypes.js';

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const areValuesEqual = (left, right) => {
  if (left === right) return true;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if (!areValuesEqual(left[index], right[index])) return false;
    }
    return true;
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;

    for (const key of leftKeys) {
      if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
      if (!areValuesEqual(left[key], right[key])) return false;
    }
    return true;
  }

  return false;
};

// Create settings service instance
const settingsService = createSettingsService(db);

// Main settings hook with debounced auto-save
export function useSettings(options = {}) {
  const { autoSave = true, debounceMs = 1000, ...queryOptions } = options;
  const queryClient = useQueryClient();
  
  // Get current settings
  const {
    data: settings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: () => settingsService.get(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...queryOptions
  });

  // Mutation for saving settings
  const saveMutation = useMutation({
    mutationFn: (updates) => {
      // Convert string numeric values to numbers before validation
      const numericFields = ['account_size', 'target_profit_dollars', 'analysis_timer_seconds', 'max_dollars', 'risk_amount', 'position_sizing_percent', 'default_stop_loss_percent'];
      const convertedUpdates = { ...updates };
      
      numericFields.forEach(field => {
        if (convertedUpdates[field] !== undefined && convertedUpdates[field] !== '') {
          const numValue = parseFloat(convertedUpdates[field]);
          if (!isNaN(numValue)) {
            convertedUpdates[field] = numValue;
          }
        } else if (convertedUpdates[field] === '') {
          convertedUpdates[field] = 0;
        }
      });
      
      return settingsService.save(convertedUpdates);
    },
    onSuccess: (newSettings) => {
      // Update cache
      queryClient.setQueryData(settingsKeys.detail(), newSettings);
      
      // Save custom modifications for the current tier
      const currentTierId = detectTierFromSettings(newSettings);
      if (currentTierId !== 'custom') {
        // Get the base tier settings to identify what was customized
        const baseSettings = getTierSettingsFields(currentTierId);
        const normalizedSettings = sanitizeTierSettingsPayload(newSettings);
        const customizations = {};
        
        // Find fields that differ from base settings
        Object.keys(baseSettings).forEach((key) => {
          if (key === 'account_tier') return;
          if (normalizedSettings[key] !== undefined && !areValuesEqual(normalizedSettings[key], baseSettings[key])) {
            customizations[key] = normalizedSettings[key];
          }
        });
        
        // Save custom modifications if there are any
        if (Object.keys(customizations).length > 0) {
          saveTierCustomizations(currentTierId, customizations);
        }
      }
      
      // Invalidate any dependent queries
      queryClient.invalidateQueries({ queryKey: ['trades'] }); // Trades might depend on settings
      
      options.onSave?.(newSettings);
    },
    onError: (error) => {
      
      options.onError?.(error);
    }
  });

  // Debounced save
  const debouncedSaveRef = useRef(null);
  const pendingUpdatesRef = useRef({});

  const debouncedSave = useCallback((updates) => {
    // Merge with pending updates
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
    
    // Clear existing timeout
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    
    // Set new timeout
    debouncedSaveRef.current = setTimeout(() => {
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        saveMutation.mutate(pendingUpdatesRef.current);
        pendingUpdatesRef.current = {};
      }
    }, debounceMs);
  }, [debounceMs, saveMutation]);

  // Immediate save
  const saveImmediately = useCallback((updates) => {
    // Clear any pending debounced saves
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
      debouncedSaveRef.current = null;
    }
    
    // Clear pending updates
    pendingUpdatesRef.current = {};
    
    // Save immediately
    return saveMutation.mutateAsync(updates);
  }, [saveMutation]);

  // Update single field
  const updateField = useCallback((field, value) => {
    const updates = { [field]: value };
    
    if (autoSave) {
      debouncedSave(updates);
    } else {
      // Update cache immediately for UI responsiveness
      queryClient.setQueryData(settingsKeys.detail(), (prev) => ({
        ...prev,
        ...updates
      }));
    }
    
    return updates;
  }, [autoSave, debouncedSave, queryClient]);

  // Update multiple fields
  const updateFields = useCallback((updates) => {
    if (autoSave) {
      debouncedSave(updates);
    } else {
      // Track pending updates for manual save
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates
      };
      
      // Update cache immediately for UI responsiveness
      queryClient.setQueryData(settingsKeys.detail(), (prev) => ({
        ...prev,
        ...updates
      }));
    }
    
    return updates;
  }, [autoSave, debouncedSave, queryClient]);

  // Save pending changes (for manual save mode)
  const savePending = useCallback(() => {
    if (Object.keys(pendingUpdatesRef.current).length > 0) {
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = {}; // Clear pending updates
      return saveImmediately(updates);
    }
    
    return Promise.resolve(settings);
  }, [saveImmediately, settings]);

  // Reset to defaults
  const reset = useCallback(() => {
    return saveMutation.mutateAsync({});
  }, [saveMutation]);

  // Check if there are pending changes
  const hasPendingChanges = Object.keys(pendingUpdatesRef.current).length > 0;

  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
        if (Object.keys(pendingUpdatesRef.current).length > 0) {
          saveMutation.mutate(pendingUpdatesRef.current);
        }
      }
    };
  }, [saveMutation]);

  return {
    settings: settings || {},
    isLoading,
    error,
    refetch,
    
    // Actions
    updateField,
    updateFields,
    saveImmediately,
    savePending,
    reset,
    
    // State
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    hasPendingChanges,
    
    // Service methods (direct access)
    export: settingsService.export.bind(settingsService),
    import: settingsService.import.bind(settingsService),
    validate: settingsService.validate.bind(settingsService)
  };
}
