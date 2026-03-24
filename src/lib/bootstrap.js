/**
 * @file src/lib/bootstrap.js
 *
 * One-time migration runner
 */

import { db, DB_BACKEND } from './db/index.js';
import { createTradeService } from './services/TradeService.js';
import { createSettingsService } from './services/SettingsService.js';
import { createCalcHistoryService } from './services/CalcHistoryService.js';

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
        
      } else {
        
      }
      
      // Show migration status
      const status = migrationRunner.getStatus();
      
    } else {
      
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
    console.error('❌ Bootstrap failed:', error);
    
    return {
      success: false,
      error: error.message,
      backend: DB_BACKEND
    };
  }
}

// Migration versions
const MIGRATIONS = {
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

// Migration storage key
const MIGRATION_KEY = 'tradedesk_migrations';

class MigrationRunner {
  constructor() {
    this.db = db;
    this.completedMigrations = this._getCompletedMigrations();
  }

  // Get completed migrations from storage
  _getCompletedMigrations() {
    try {
      const stored = localStorage.getItem(MIGRATION_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load migration history:', error);
      return [];
    }
  }

  // Save completed migrations to storage
  _saveCompletedMigrations(migrations) {
    try {
      localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));
    } catch (error) {
      console.error('Failed to save migration history:', error);
    }
  }

  // Get pending migrations
  _getPendingMigrations() {
    const allVersions = Object.keys(MIGRATIONS).sort();
    return allVersions.filter(version => !this.completedMigrations.includes(version));
  }

  // Run a single migration
  async _runMigration(version) {
    const migration = MIGRATIONS[version];
    
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    
    
    try {
      await migration.up();
      
      // Mark as completed
      this.completedMigrations.push(version);
      this._saveCompletedMigrations(this.completedMigrations);
      
      
    } catch (error) {
      console.error(`❌ Migration ${version} failed:`, error);
      throw error;
    }
  }

  // Run all pending migrations
  async run() {
    const pending = this._getPendingMigrations();
    
    if (pending.length === 0) {
      
      return { completed: [], skipped: true };
    }

    
    
    const completed = [];
    
    for (const version of pending) {
      await this._runMigration(version);
      completed.push(version);
    }

    
    
    return { completed, skipped: false };
  }

  // Get migration status
  getStatus() {
    const allVersions = Object.keys(MIGRATIONS).sort();
    const pending = this._getPendingMigrations();
    
    return {
      current: this.completedMigrations.length > 0 ? 
        this.completedMigrations[this.completedMigrations.length - 1] : 
        '0.0.0',
      completed: this.completedMigrations,
      pending,
      total: allVersions.length,
      upToDate: pending.length === 0
    };
  }

  // Reset migration history (for development)
  reset() {
    this.completedMigrations = [];
    this._saveCompletedMigrations([]);
    
  }
}

// Sample data loader (for development)
async function loadSampleData() {
  const tradeService = createTradeService(db);
  
  const sampleTrades = [
    {
      symbol: 'AAPL',
      entry_price: 150.25,
      exit_price: 152.80,
      quantity: 100,
      entry_time: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
      exit_time: new Date(Date.now() - 86400000 * 5).toISOString(),
      direction: 'long',
      setup_type: 'breakout',
      emotions: ['confident', 'patient'],
      followed_plan: true,
      notes: 'Good breakout from consolidation',
      stop_loss: 148.50,
      target_price: 155.00
    },
    {
      symbol: 'TSLA',
      entry_price: 245.60,
      exit_price: 242.10,
      quantity: 50,
      entry_time: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
      exit_time: new Date(Date.now() - 86400000 * 3).toISOString(),
      direction: 'long',
      setup_type: 'support',
      emotions: ['hesitant', 'rushed'],
      followed_plan: false,
      notes: 'Exited too early, should have held',
      stop_loss: 242.00,
      target_price: 252.00
    }
  ];
  
  for (const trade of sampleTrades) {
    try {
      await tradeService.create(trade);
    } catch (error) {
      console.error('Failed to create sample trade:', error);
    }
  }
}
