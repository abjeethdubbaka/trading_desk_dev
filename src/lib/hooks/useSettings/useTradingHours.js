/**
 * @file src/lib/hooks/useSettings/useTradingHours.js
 *
 * Hook for trading hours.
 */

import { useCallback } from 'react';
import { useSettings } from './useSettings.js';

export function useTradingHours() {
  const { settings, updateField, isSaving } = useSettings();
  
  const tradingHours = settings.trading_hours || {
    market_open: '09:30',
    market_close: '16:00',
    timezone: 'America/New_York'
  };

  const updateTradingHours = useCallback((hours) => {
    return updateField('trading_hours', hours);
  }, [updateField]);

  const isMarketOpen = useCallback(() => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    return currentTime >= tradingHours.market_open && currentTime <= tradingHours.market_close;
  }, [tradingHours]);

  return {
    tradingHours,
    updateTradingHours,
    isMarketOpen,
    isSaving
  };
}


