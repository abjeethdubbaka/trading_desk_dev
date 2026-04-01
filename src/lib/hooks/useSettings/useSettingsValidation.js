/**
 * @file src/lib/hooks/useSettings/useSettingsValidation.js
 *
 * Hook for settings validation.
 */

import { useCallback } from 'react';
import { createSettingsService } from '../../services/SettingsService.js';
import { db } from '../../db/index.js';

const settingsService = createSettingsService(db);

export function useSettingsValidation() {
  const validateSettings = useCallback((settingsData) => {
    try {
      const validation = settingsService.validate(settingsData);
      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }, []);

  return { validateSettings };
}


