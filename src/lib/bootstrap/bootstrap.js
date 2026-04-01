/**
 * @file src/lib/bootstrap/bootstrap.js
 *
 * Main bootstrap function.
 */

import { db, DB_BACKEND } from '../db/index.js';
import { createTradeService } from '../services/TradeService.js';
import { createSettingsService } from '../services/SettingsService.js';
import { createCalcHistoryService } from '../services/CalcHistoryService.js';
import { MigrationRunner } from './MigrationRunner.js';
import { loadSampleData } from './sampleData.js';

/**
 * Initialize the data layer and run migrations
 */
export async function bootstrap(options = {}) {
  const { force = false, skipMigrations = false } = options;
  
  try {
    // Test database connection
    // Try to access settings to test connection
    const settingsService = createSettingsService(db);
    await settingsService.get();
    
    // Run migrations if not skipped
    if (!skipMigrations) {
      const migrationRunner = new MigrationRunner();
      
      if (force) {
        migrationRunner.reset();
      }
      
      const migrationResult = await migrationRunner.run();
      
      if (migrationResult.skipped) {
        // Migrations were skipped
      } else {
        // Migrations completed
      }
      
      // Show migration status
      const status = migrationRunner.getStatus();
    } else {
      // Migrations explicitly skipped
    }
    
    // Initialize services
    const tradeService = createTradeService(db);
    const calcHistoryService = createCalcHistoryService(db);
    
    // Test services
    await tradeService.getStats();
    await calcHistoryService.getStats();
    
    // Load initial data if needed
    if (options.loadSampleData && DB_BACKEND === 'localStorage') {
      await loadSampleData();
    }
    
    return {
      success: true,
      backend: DB_BACKEND,
      migrations: skipMigrations ? 'skipped' : 'completed',
      services: 'initialized'
    };
    
  } catch (error) {
    
    
    return {
      success: false,
      error: error.message,
      backend: DB_BACKEND
    };
  }
}


