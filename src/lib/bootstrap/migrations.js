/**
 * @file src/lib/bootstrap/migrations.js
 *
 * Database migration definitions.
 */

import { db } from '../db/index.js';
import { createSettingsService } from '../services/SettingsService.js';

export const MIGRATIONS = {
  '1.0.0': {
    description: 'Initial setup',
    up: async () => {
      // Create default settings if they don't exist
      const settingsService = createSettingsService(db);
      await settingsService.get(); // This will create defaults if needed
    },
    down: async () => {
      // Clear all data
      if (db.clearAll) {
        await db.clearAll();
      }
    }
  },
  '1.1.0': {
    description: 'Add float categories to settings',
    up: async () => {
      const settingsService = createSettingsService(db);
      const settings = await settingsService.get();
      
      // Add float categories if not present
      if (!settings.float_categories) {
        await settingsService.save({
          float_categories: {
            'micro': { min: 0, max: 10000000, label: 'Micro Cap (<$10M)' },
            'small': { min: 10000000, max: 300000000, label: 'Small Cap ($10M-$300M)' },
            'mid': { min: 300000000, max: 10000000000, label: 'Mid Cap ($300M-$10B)' },
            'large': { min: 10000000000, max: 200000000000, label: 'Large Cap ($10B-$200B)' },
            'mega': { min: 200000000000, max: Infinity, label: 'Mega Cap (>$200B)' }
          }
        });
      }
    },
    down: async () => {
      const settingsService = createSettingsService(db);
      const settings = await settingsService.get();
      
      if (settings.float_categories) {
        const { float_categories, ...rest } = settings;
        await settingsService.save(rest);
      }
    }
  }
};


