/**
 * @file src/lib/SettingsContext.jsx
 *
 * Thin React context wrapper around useSettings().
 * Keeps the old useSettings() import path working for existing components
 * while internally using the new Firebase-backed hook.
 *
 * Existing code that does:
 *   import { useSettings } from '@/components/settings/SettingsProvider';
 * should be migrated to:
 *   import { useSettings } from '@/lib/SettingsContext';
 * but both work during the transition.
 */

import React, { createContext, useContext } from 'react';
import { useSettings as useSettingsHook }  from '@/hooks/useSettings';

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
  const ctx = useContext(SettingsContext);
  // Fallback: if used outside provider or Firebase not ready, return defaults
  if (!ctx) {
    console.warn('⚠️ useSettings used outside provider or Firebase not ready - using defaults');
    return {
      settings: {
        account_size: 25000,
        position_sizing_percent: 1,
        default_stop_loss_percent: 3,
        target_profit_dollars: 500,
        max_dollars: 5000,
        risk_amount: 1000,
        float_categories: {
          micro: { min: 0, max: 20000000, label: 'Micro', color: 'text-red-400', positionMultiplier: 0.3, stopLossPercent: 3.0, maxFloatPercent: 0.1 },
          small: { min: 20000000, max: 50000000, label: 'Small', color: 'text-orange-400', positionMultiplier: 0.5, stopLossPercent: 3.5, maxFloatPercent: 0.25 },
          medium: { min: 50000000, max: 500000000, label: 'Medium', color: 'text-yellow-400', positionMultiplier: 0.8, stopLossPercent: 4.0, maxFloatPercent: 0.5 },
          large: { min: 500000000, max: 2000000000, label: 'Large', color: 'text-blue-400', positionMultiplier: 1.2, stopLossPercent: 5.0, maxFloatPercent: 0.75 },
          mega: { min: 2000000000, max: Infinity, label: 'Mega', color: 'text-emerald-400', positionMultiplier: 1.5, stopLossPercent: 6.0, maxFloatPercent: 1.0 }
        }
      },
      isLoading: false,
      isSaving: false,
      updateSettings: () => {},
      updateFloatCategory: () => {},
      saveNow: () => Promise.resolve(),
      // Convenience getters
      accountSize: 25000,
      riskAmount: 1000,
      positionSizingPct: 1,
      defaultStopLossPct: 3,
      targetProfitDollars: 500,
      maxDollars: 5000,
      floatCategories: {
        micro: { min: 0, max: 20000000, label: 'Micro', color: 'text-red-400', positionMultiplier: 0.3, stopLossPercent: 3.0, maxFloatPercent: 0.1 },
        small: { min: 20000000, max: 50000000, label: 'Small', color: 'text-orange-400', positionMultiplier: 0.5, stopLossPercent: 3.5, maxFloatPercent: 0.25 },
        medium: { min: 50000000, max: 500000000, label: 'Medium', color: 'text-yellow-400', positionMultiplier: 0.8, stopLossPercent: 4.0, maxFloatPercent: 0.5 },
        large: { min: 500000000, max: 2000000000, label: 'Large', color: 'text-blue-400', positionMultiplier: 1.2, stopLossPercent: 5.0, maxFloatPercent: 0.75 },
        mega: { min: 2000000000, max: Infinity, label: 'Mega', color: 'text-emerald-400', positionMultiplier: 1.5, stopLossPercent: 6.0, maxFloatPercent: 1.0 }
      }
    };
  }
  return ctx;
}

// Re-export for the old import path
export default SettingsProvider;
