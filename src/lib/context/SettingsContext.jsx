/**
 * Settings Context Provider
 *
 * Provides settings management with debounced auto-save.
 * Adds per-account-type isolation: Demo and Funded each store their own
 * copies of account-scoped fields (account_size, risk_amount, etc.) under
 * settings.demo / settings.funded. All consumers see a merged flat view
 * and write through the same updateFields API — no callers need to change.
 */

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useSettings as useSettingsHook } from '../hooks/useSettings';

// These fields are stored per-account-type (demo / funded).
// Everything else (exit_strategy, float_categories, trading_hours, …) is shared.
const PER_ACCOUNT_TYPE_FIELDS = new Set([
  'account_size',
  'risk_amount',
  'target_profit_dollars',
  'max_dollars',
  'position_sizing_percent',
  'default_stop_loss_percent',
  'max_position_value',
  'account_tier',
]);

function splitUpdates(updates, accountType, currentNamespace) {
  const perType = {};
  const global = {};
  for (const [k, v] of Object.entries(updates)) {
    if (PER_ACCOUNT_TYPE_FIELDS.has(k)) perType[k] = v;
    else global[k] = v;
  }
  const patch = { ...global };
  if (Object.keys(perType).length > 0) {
    patch[accountType] = { ...currentNamespace, ...perType };
  }
  return patch;
}

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

  const isolated = useMemo(() => {
    if (!context) return null;

    const raw = context.settings || {};
    const accountType = raw.account_type || 'demo';
    const namespace = raw[accountType] || {};

    // Merge: per-type namespace overlays root for scoped fields
    const effectiveSettings = { ...raw, ...namespace, account_type: accountType };

    // Wrap updateFields to route per-type fields into the namespace
    const updateFields = (updates) => {
      const patch = splitUpdates(updates, accountType, namespace);
      return context.updateFields(patch);
    };

    const updateField = (field, value) => updateFields({ [field]: value });

    const saveImmediately = (updates) => {
      const patch = splitUpdates(updates, accountType, namespace);
      return context.saveImmediately(patch);
    };

    const updateRiskAmount = (value) => {
      const numericValue = value === '' ? 0 : Number(value);
      return updateFields({ risk_amount: Number.isFinite(numericValue) ? numericValue : 0 });
    };

    return {
      ...context,
      settings: effectiveSettings,
      updateField,
      updateFields,
      saveImmediately,
      // backward-compat aliases
      loading: context.isLoading,
      saving: context.isSaving,
      updateSettings: updateFields,
      updateRiskAmount,
      saveSettings: context.savePending,
    };
  }, [context]);

  if (!isolated) {
    return {
      settings: null,
      isLoading: false,
      isSaving: false,
      loading: false,
      saving: false,
      updateFields: () => Promise.resolve(),
      updateSettings: () => Promise.resolve(),
      updateField: () => Promise.resolve(),
      updateRiskAmount: () => Promise.resolve(),
      refetch: () => Promise.resolve(),
      saveImmediately: () => Promise.resolve(),
      savePending: () => Promise.resolve(),
      saveSettings: () => Promise.resolve(),
      resetSettings: () => Promise.resolve(),
      clearAndReinit: () => Promise.resolve(),
      importSettings: () => Promise.resolve(),
      exportSettings: () => Promise.resolve(),
    };
  }

  return isolated;
}

// Re-export for the old import path
export default SettingsProvider;


