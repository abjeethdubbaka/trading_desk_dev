/**
 * Settings Context Provider
 * 
 * Provides settings management with debounced auto-save
 * while internally using the new Firebase-backed hook.
 */

import React, { createContext, useContext } from 'react';
import { useSettings as useSettingsHook } from './hooks/useSettings';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const value = useSettingsHook();
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Re-export for the old import path
export default SettingsProvider;
