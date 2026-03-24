/**
 * @file src/lib/migration.js
 *
 * Migration utilities for moving data between storage backends.
 * Handles localStorage → Firebase migration with conflict resolution.
 */

import { db, IS_REMOTE } from '@/lib/db';
import { localStorageAdapter } from '@/lib/db/adapters/localStorage';

/**
 * Migrate all data from localStorage to Firebase
 * @param {Object} options - Migration options
 * @param {boolean} options.clearLocal - Whether to clear localStorage after migration (default: true)
 * @param {boolean} options.skipExisting - Skip trades that already exist in Firebase (default: true)
 * @returns {Promise<Object>} Migration results
 */
export async function migrateToFirebase(options = {}) {
  const { clearLocal = true, skipExisting = true } = options;

  if (!IS_REMOTE) {
    throw new Error('Firebase is not the active backend. Set adapter to firebase in src/lib/db/index.js');
  }

  const results = {
    trades: { migrated: 0, skipped: 0, errors: [] },
    settings: { migrated: false, error: null },
    totalErrors: 0
  };

  try {
    // ─── Migrate Trades ────────────────────────────────────────────────────────
    
    
    const localTrades = await localStorageAdapter.trades.list();
    if (!localTrades.length) {
      
    } else {
      

      // Get existing Firebase trades to check for duplicates
      let existingTradeIds = new Set();
      if (skipExisting) {
        try {
          const firebaseTrades = await db.trades.list();
          existingTradeIds = new Set(firebaseTrades.map(t => t.id));
        } catch (e) {
          console.warn('⚠️ Could not fetch existing Firebase trades:', e.message);
        }
      }

      // Migrate each trade
      for (const trade of localTrades) {
        try {
          // Skip if trade already exists (by ID or by timestamp+symbol)
          if (skipExisting && existingTradeIds.has(trade.id)) {
            results.trades.skipped++;
            continue;
          }

          // Create trade in Firebase (let Firebase generate new ID)
          const { id, ...tradeData } = trade; // Remove local ID
          await db.trades.create(tradeData);
          results.trades.migrated++;
          
        } catch (error) {
          const errorMsg = `Failed to migrate trade ${trade.id || 'unknown'}: ${error.message}`;
          results.trades.errors.push(errorMsg);
          results.totalErrors++;
          console.error('❌', errorMsg);
        }
      }

      
    }

    // ─── Migrate Settings ─────────────────────────────────────────────────────
    
    
    try {
      const localSettings = await localStorageAdapter.settings.get();
      if (localSettings) {
        await db.settings.save(localSettings);
        results.settings.migrated = true;
        
      } else {
        
      }
    } catch (error) {
      results.settings.error = error.message;
      results.totalErrors++;
      console.error('❌ Settings migration failed:', error.message);
    }

    // ─── Cleanup ────────────────────────────────────────────────────────────
    if (clearLocal && results.totalErrors === 0) {
      try {
        localStorage.clear();
        
      } catch (error) {
        console.warn('⚠️ Failed to clear local storage:', error.message);
      }
    } else if (results.totalErrors > 0) {
      console.warn('⚠️ Skipping local storage cleanup due to errors');
    }

    // ─── Summary ────────────────────────────────────────────────────────────

    return results;

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

/**
 * Check if migration is needed (has local data but using Firebase backend)
 * @returns {Promise<boolean>}
 */
export async function needsMigration() {
  if (!IS_REMOTE) return false; // Not using Firebase, no migration needed

  try {
    const localTrades = await localStorageAdapter.trades.list();
    const localSettings = await localStorageAdapter.settings.get();
    
    return localTrades.length > 0 || localSettings;
  } catch (error) {
    console.warn('⚠️ Could not check migration status:', error.message);
    return false;
  }
}

/**
 * Get migration preview without actually migrating
 * @returns {Promise<Object>} Preview of what would be migrated
 */
export async function getMigrationPreview() {
  try {
    const localTrades = await localStorageAdapter.trades.list();
    const localSettings = await localStorageAdapter.settings.get();
    
    // Check for potential duplicates
    let existingTrades = [];
    if (IS_REMOTE) {
      try {
        existingTrades = await db.trades.list();
      } catch (e) {
        // Firebase might not be accessible
      }
    }

    const duplicateSymbols = localTrades
      .filter(localTrade => 
        existingTrades.some(firebaseTrade => 
          firebaseTrade.symbol === localTrade.symbol &&
          Math.abs(new Date(firebaseTrade.entry_time) - new Date(localTrade.entry_time)) < 60000 // Within 1 minute
        )
      )
      .map(t => ({ id: t.id, symbol: t.symbol, entry_time: t.entry_time }));

    return {
      trades: {
        count: localTrades.length,
        duplicates: duplicateSymbols.length,
        duplicateDetails: duplicateSymbols
      },
      settings: !!localSettings,
      totalItems: localTrades.length + (localSettings ? 1 : 0)
    };
  } catch (error) {
    console.warn('⚠️ Could not generate migration preview:', error.message);
    return { trades: { count: 0, duplicates: 0 }, settings: false, totalItems: 0 };
  }
}
