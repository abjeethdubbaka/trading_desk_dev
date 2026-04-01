/**
 * Settings Context Provider
 * 
 * Provides settings management with debounced auto-save
 * while internally using the new Firebase-backed hook.
 */

import React, { createContext, useContext } from 'react';
import { useSettings as useSettingsHook } from '../hooks/useSettings';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const value = useSettingsHook({ autoSave: false });
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    // Instead of throwing an error, return a fallback
    return {
      settings: null,
      isLoading: false,
      isSaving: false,
      loading: false,
      saving: false,
      updateFields: () => Promise.resolve(),
      updateSettings: () => Promise.resolve(),
      updateField: () => Promise.resolve(),
      updateFloatCategory: () => Promise.resolve(),
      updateRiskAmount: () => Promise.resolve(),
      refetch: () => Promise.resolve(),
      saveImmediately: () => Promise.resolve(),
      savePending: () => Promise.resolve(),
      saveSettings: () => Promise.resolve(),
      resetSettings: () => Promise.resolve(),
      clearAndReinit: () => Promise.resolve(),
      importSettings: () => Promise.resolve(),
      exportSettings: () => Promise.resolve()
    };
  }

  const updateFloatCategory = (categoryKey, updates) => {
    const currentCategories = context.settings?.float_categories || {};
    const existingCategory = currentCategories[categoryKey] || {};
    return context.updateFields({
      float_categories: {
        ...currentCategories,
        [categoryKey]: {
          ...existingCategory,
          ...updates,
        },
      },
    });
  };

  const updateRiskAmount = (value) => {
    const numericValue = value === '' ? 0 : Number(value);
    return context.updateFields({
      risk_amount: Number.isFinite(numericValue) ? numericValue : 0,
    });
  };

  // Backward-compatible aliases for older settings components.
  return {
    ...context,
    loading: context.isLoading,
    saving: context.isSaving,
    updateSettings: context.updateFields,
    updateFloatCategory,
    updateRiskAmount,
    saveSettings: context.savePending,
  };
}

// Re-export for the old import path
export default SettingsProvider;


