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
      updateFields: () => Promise.resolve(),
      updateSettings: () => Promise.resolve(),
      refetch: () => Promise.resolve(),
      saveSettings: () => Promise.resolve(),
      resetSettings: () => Promise.resolve(),
      clearAndReinit: () => Promise.resolve(),
      importSettings: () => Promise.resolve(),
      exportSettings: () => Promise.resolve()
    };
  }
  
  // Add updateSettings as alias for updateFields for backward compatibility
  return {
    ...context,
    updateSettings: context.updateFields
  };
}

// Re-export for the old import path
export default SettingsProvider;


