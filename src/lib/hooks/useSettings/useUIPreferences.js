/**
 * @file src/lib/hooks/useSettings/useUIPreferences.js
 *
 * Hook for UI preferences.
 */

import { useCallback } from 'react';
import { useSettings } from './useSettings.js';

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


