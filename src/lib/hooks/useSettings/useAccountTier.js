/**
 * @file src/lib/hooks/useSettings/useAccountTier.js
 *
 * Hook for account tier management.
 */

import { useCallback } from 'react';
import { useSettings } from './useSettings.js';
import { detectTierFromSettings, getTierSettingsWithCustomizations } from '../../config/accountTypes.js';
import { ACCOUNT_TIERS } from '../../config/accountTypes.js';

export function useAccountTier() {
  const { settings, updateFields, saveImmediately, isSaving } = useSettings();
  
  // Detect current tier
  const currentTierId = detectTierFromSettings(settings);
  const currentTier = ACCOUNT_TIERS[currentTierId];
  
  // Apply tier settings
  const applyTier = useCallback(async (tierId) => {
    const updates = tierId === 'custom'
      ? { account_tier: 'custom' }
      : getTierSettingsWithCustomizations(tierId);

    updateFields(updates);
    return saveImmediately(updates);
  }, [updateFields, saveImmediately]);
  
  // Check if settings match a tier
  const isTierMatched = currentTierId !== 'custom';
  
  // Get available tiers
  const availableTiers = ACCOUNT_TIERS;
  
  return {
    currentTierId,
    currentTier,
    availableTiers,
    applyTier,
    isTierMatched,
    isSaving
  };
}

