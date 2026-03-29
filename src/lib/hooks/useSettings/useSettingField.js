/**
 * @file src/lib/hooks/useSettings/useSettingField.js
 *
 * Hook for specific setting fields.
 */

import { useCallback } from 'react';
import { useSettings } from './useSettings.js';

export function useSettingField(field, defaultValue = null) {
  const { settings, updateField, isSaving } = useSettings();
  
  const value = settings[field] !== undefined ? settings[field] : defaultValue;
  
  const setValue = useCallback((newValue) => {
    return updateField(field, newValue);
  }, [field, updateField]);

  return [value, setValue, isSaving];
}


