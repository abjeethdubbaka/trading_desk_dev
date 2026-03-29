/**
 * @file src/lib/hooks/useSettings/useSettingsData.js
 *
 * Hook for settings export/import.
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSettingsService } from '../../services/SettingsService.js';
import { db } from '../../db/index.js';
import { settingsKeys } from '../../utils/queryKeys';

const settingsService = createSettingsService(db);

export function useSettingsData() {
  const queryClient = useQueryClient();

  const exportSettings = useCallback(async () => {
    try {
      return await settingsService.export();
    } catch (error) {
      
      throw error;
    }
  }, []);

  const importSettings = useCallback(async (settingsJson) => {
    try {
      const result = await settingsService.import(settingsJson);
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: settingsKeys.detail() });
      
      return result;
    } catch (error) {
      
      throw error;
    }
  }, [queryClient]);

  return {
    exportSettings,
    importSettings
  };
}


