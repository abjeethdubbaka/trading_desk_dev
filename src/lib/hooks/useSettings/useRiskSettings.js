/**
 * @file src/lib/hooks/useSettings/useRiskSettings.js
 *
 * Hook for risk settings.
 */

import { useCallback } from 'react';
import { useSettings } from './useSettings.js';

export function useRiskSettings() {
  const { settings, updateFields, isSaving } = useSettings();
  
  const riskSettings = {
    riskAmount: settings.risk_amount,
    positionSizingPercent: settings.position_sizing_percent,
    defaultStopLossPercent: settings.default_stop_loss_percent,
    maxDollars: settings.max_dollars
  };

  const updateRiskSettings = useCallback((updates) => {
    return updateFields(updates);
  }, [updateFields]);

  return {
    riskSettings,
    updateRiskSettings,
    isSaving
  };
}


