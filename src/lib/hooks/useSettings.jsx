/**
 * Settings hook with debounced auto-save
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';
import { createSettingsService } from '../services/SettingsService.js';
import { db } from '../db/index.js';

// Create settings service instance
const settingsService = createSettingsService(db);

// Query keys
export const settingsKeys = {
  all: ['settings'],
  detail: () => [...settingsKeys.all, 'detail']
};

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
      console.log('🔍 Settings Save Input:', updates);
      
      // Convert string numeric values to numbers before validation
      const numericFields = ['account_size', 'target_profit_dollars', 'max_dollars', 'risk_amount', 'position_sizing_percent', 'default_stop_loss_percent'];
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
      
      console.log('🔍 Settings Save Converted:', convertedUpdates);
      return settingsService.save(convertedUpdates);
    },
    onSuccess: (newSettings) => {
      // Update cache
      queryClient.setQueryData(settingsKeys.detail(), newSettings);
      
      // Invalidate any dependent queries
      queryClient.invalidateQueries({ queryKey: ['trades'] }); // Trades might depend on settings
      
      options.onSave?.(newSettings);
    },
    onError: (error) => {
      console.error('Settings save error:', error);
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
    console.log('🔍 updateFields called with:', updates);
    console.log('🔍 autoSave is:', autoSave);
    
    if (autoSave) {
      debouncedSave(updates);
    } else {
      // Track pending updates for manual save
      console.log('🔍 Before update, pendingUpdatesRef.current:', pendingUpdatesRef.current);
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates
      };
      console.log('🔍 After update, pendingUpdatesRef.current:', pendingUpdatesRef.current);
      
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
    console.log('🔍 savePending called, pendingUpdatesRef.current:', pendingUpdatesRef.current);
    console.log('🔍 pending updates keys:', Object.keys(pendingUpdatesRef.current));
    
    if (Object.keys(pendingUpdatesRef.current).length > 0) {
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = {}; // Clear pending updates
      console.log('🔍 Calling saveImmediately with:', updates);
      return saveImmediately(updates);
    }
    
    console.log('🔍 No pending updates to save');
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

// Hook for specific setting fields
export function useSettingField(field, defaultValue = null) {
  const { settings, updateField, isSaving } = useSettings();
  
  const value = settings[field] !== undefined ? settings[field] : defaultValue;
  
  const setValue = useCallback((newValue) => {
    return updateField(field, newValue);
  }, [field, updateField]);

  return [value, setValue, isSaving];
}

// Hook for risk settings
export function useRiskSettings() {
  const { settings, updateField, updateFields, isSaving } = useSettings();
  
  const riskSettings = {
    riskAmount: settings.risk_amount,
    positionSizingPercent: settings.position_sizing_percent,
    defaultStopLossPercent: settings.default_stop_loss_percent,
    maxDollars: settings.max_dollars
  };

  const updateRiskSettings = useCallback((updates) => {
    return updateFields(updates);
  }, [updateFields]);

  return {
    riskSettings,
    updateRiskSettings,
    isSaving
  };
}

// Hook for trading hours
export function useTradingHours() {
  const { settings, updateField, isSaving } = useSettings();
  
  const tradingHours = settings.trading_hours || {
    market_open: '09:30',
    market_close: '16:00',
    timezone: 'America/New_York'
  };

  const updateTradingHours = useCallback((hours) => {
    return updateField('trading_hours', hours);
  }, [updateField]);

  const isMarketOpen = useCallback(() => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    return currentTime >= tradingHours.market_open && currentTime <= tradingHours.market_close;
  }, [tradingHours]);

  return {
    tradingHours,
    updateTradingHours,
    isMarketOpen,
    isSaving
  };
}

// Hook for float categories
export function useFloatCategories() {
  const { settings, updateField, isSaving } = useSettings();
  
  const floatCategories = settings.float_categories || {};

  const addFloatCategory = useCallback((name, config) => {
    const updated = { ...floatCategories, [name]: config };
    return updateField('float_categories', updated);
  }, [floatCategories, updateField]);

  const updateFloatCategory = useCallback((name, config) => {
    const updated = { ...floatCategories, [name]: config };
    return updateField('float_categories', updated);
  }, [floatCategories, updateField]);

  const removeFloatCategory = useCallback((name) => {
    const { [name]: removed, ...rest } = floatCategories;
    return updateField('float_categories', rest);
  }, [floatCategories, updateField]);

  return {
    floatCategories,
    addFloatCategory,
    updateFloatCategory,
    removeFloatCategory,
    isSaving
  };
}

// Hook for notification settings
export function useNotificationSettings() {
  const { settings, updateField, isSaving } = useSettings();
  
  const notifications = settings.notifications || {
    trade_alerts: true,
    price_alerts: false,
    daily_summary: false
  };

  const updateNotifications = useCallback((updates) => {
    return updateField('notifications', { ...notifications, ...updates });
  }, [notifications, updateField]);

  return {
    notifications,
    updateNotifications,
    isSaving
  };
}

// Hook for UI preferences
export function useUIPreferences() {
  const { settings, updateField, isSaving } = useSettings();
  
  const uiPreferences = settings.ui_preferences || {
    theme: 'dark',
    compact_mode: false
  };

  const updateUIPreferences = useCallback((updates) => {
    return updateField('ui_preferences', { ...uiPreferences, ...updates });
  }, [uiPreferences, updateField]);

  return {
    uiPreferences,
    updateUIPreferences,
    isSaving
  };
}

// Hook for feature flags
export function useFeatureFlags() {
  const { settings, updateField, isSaving } = useSettings();
  
  const features = settings.features || {};

  const isFeatureEnabled = useCallback((feature) => {
    return features[feature] ?? false;
  }, [features]);

  const setFeatureEnabled = useCallback((feature, enabled) => {
    const updated = { ...features, [feature]: enabled };
    return updateField('features', updated);
  }, [features, updateField]);

  return {
    features,
    isFeatureEnabled,
    setFeatureEnabled,
    isSaving
  };
}

// Hook for settings validation
export function useSettingsValidation() {
  const validateSettings = useCallback((settingsData) => {
    try {
      const validation = settingsService.validate(settingsData);
      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }, []);

  return { validateSettings };
}

// Hook for settings export/import
export function useSettingsData() {
  const queryClient = useQueryClient();

  const exportSettings = useCallback(async () => {
    try {
      return await settingsService.export();
    } catch (error) {
      console.error('Export settings error:', error);
      throw error;
    }
  }, []);

  const importSettings = useCallback(async (settingsJson) => {
    try {
      const result = await settingsService.import(settingsJson);
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: settingsKeys.detail() });
      
      return result;
    } catch (error) {
      console.error('Import settings error:', error);
      throw error;
    }
  }, [queryClient]);

  return {
    exportSettings,
    importSettings
  };
}
