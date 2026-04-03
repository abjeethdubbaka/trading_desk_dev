/**
 * @file src/lib/hooks/useSettings/useFloatCategories.js
 *
 * Hook for float categories.
 */

import { useCallback } from 'react';
import { useSettings } from './useSettings.js';

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
    const { [name]: _removed, ...rest } = floatCategories;
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


