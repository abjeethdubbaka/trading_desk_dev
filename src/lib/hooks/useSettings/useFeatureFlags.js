/**
 * @file src/lib/hooks/useSettings/useFeatureFlags.js
 *
 * Hook for feature flags.
 */

import { useCallback } from 'react';
import { useSettings } from './useSettings.js';

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


