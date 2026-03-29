/**
 * @file src/lib/hooks/useSettings/useNotificationSettings.js
 *
 * Hook for notification settings.
 */

import { useCallback } from 'react';
import { useSettings } from './useSettings.js';

export function useNotificationSettings() {
  const { settings, updateField, isSaving } = useSettings();
  
  const notifications = settings.notifications || {
    trade_alerts: true,
    price_alerts: false,
    daily_summary: false
  };

  const updateNotifications = useCallback((updates) => {
    return updateField('notifications', { ...notifications, ...updates });
  }, [notifications, updateField]);

  return {
    notifications,
    updateNotifications,
    isSaving
  };
}


