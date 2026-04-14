/**
 * Append-only calc history service
 */

import { validateSchema } from '../schema/validation.js';
import { CalcHistorySchema } from '../schema/index.js';

export class CalcHistoryService {
  constructor(dbAdapter) {
    this.db = dbAdapter;
    // Use localStorage directly for calc history
    this.storageKey = 'calcHistory';
  }

  // Helper to read from localStorage
  _readFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Helper to write to localStorage
  _writeToStorage(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  // Create calculation record
  async create(calcData) {
    try {
      // Enrich first so required defaults (like timestamp) are present before validation.
      const enrichedCalc = this._enrichCalculation(calcData);

      // Validate the calculation data
      const validation = validateSchema(CalcHistorySchema, enrichedCalc);
      
      if (!validation.isValid) {
        throw new Error(`Calculation validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate ID and timestamp
      const record = {
        ...enrichedCalc,
        id: enrichedCalc.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: enrichedCalc.timestamp || new Date().toISOString()
      };
      
      // Save to localStorage directly
      const existing = this._readFromStorage();
      const updated = [record, ...existing].slice(0, 100); // Keep only 100 most recent
      this._writeToStorage(updated);
      
      // Broadcast change
      this._broadcast('calc-history-updated', { action: 'create', calculation: record });
      
      return record;
    } catch (error) {
      throw error;
    }
  }

  async getByType(calculationType, options = {}) {
    if (!calculationType) return [];
    return this.list({ ...options, calculation_type: calculationType });
  }

  async getBySymbol(symbol, options = {}) {
    if (!symbol) return [];
    return this.list({ ...options, symbol });
  }

  async getRecent(limit = 50, options = {}) {
    return this.list({ ...options, limit });
  }

  // Get calculation by ID
  async get(id) {
    try {
      const all = this._readFromStorage();
      return all.find(item => item.id === id) || null;
    } catch (error) {
      throw error;
    }
  }

  // List all calculations
  async list(options = {}) {
    try {
      const normalizedOptions = this._normalizeListOptions(options);
      let calculations = this._readFromStorage();
      
      // Apply filters if provided
      if (normalizedOptions.symbol) {
        calculations = calculations.filter(calc => 
          String(calc.symbol || '').toLowerCase() === normalizedOptions.symbol
        );
      }

      if (normalizedOptions.calculation_type) {
        calculations = calculations.filter(calc =>
          String(calc.calculation_type || '').toLowerCase() === normalizedOptions.calculation_type
        );
      }
      
      if (normalizedOptions.from) {
        const fromDate = new Date(normalizedOptions.from);
        calculations = calculations.filter(calc => {
          const calcDate = new Date(calc.timestamp || calc.created_at || 0);
          return calcDate >= fromDate;
        });
      }
      
      if (normalizedOptions.to) {
        const toDate = new Date(normalizedOptions.to);
        calculations = calculations.filter(calc => {
          const calcDate = new Date(calc.timestamp || calc.created_at || 0);
          return calcDate <= toDate;
        });
      }
      
      // Sort by timestamp descending (newest first)
      calculations.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created_at || 0);
        const dateB = new Date(b.timestamp || b.created_at || 0);
        return dateB - dateA;
      });
      
      // Apply limit if provided
      if (normalizedOptions.limit) {
        calculations = calculations.slice(0, normalizedOptions.limit);
      }
      
      return calculations;
    } catch (error) {
      throw error;
    }
  }

  // Delete calculation
  async delete(id) {
    try {
      const all = this._readFromStorage();
      const filtered = all.filter(item => item.id !== id);
      this._writeToStorage(filtered);
      
      // Broadcast change
      this._broadcast('calc-history-updated', { action: 'delete', calculationId: id });
      
      return { id };
    } catch (error) {
      throw error;
    }
  }

  // Search calculations
  async search(query) {
    try {
      const calculations = await this.list();
      const lowerQuery = query.toLowerCase();
      
      return calculations.filter(calc => 
        calc.symbol?.toLowerCase().includes(lowerQuery) ||
        calc.notes?.toLowerCase().includes(lowerQuery) ||
        calc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      throw error;
    }
  }

  // Get calculation statistics
  async getStats(options = {}) {
    try {
      const calculations = await this.list(options);
      
      const stats = {
        total: calculations.length,
        byType: {},
        bySymbol: {},
        byDate: {},
        recentCount: 0,
        oldestCalc: null,
        newestCalc: null
      };
      
      if (calculations.length === 0) {
        return stats;
      }
      
      // Group by type
      calculations.forEach(calc => {
        const type = calc.calculation_type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });
      
      // Group by symbol
      calculations.forEach(calc => {
        if (calc.symbol) {
          stats.bySymbol[calc.symbol] = (stats.bySymbol[calc.symbol] || 0) + 1;
        }
      });
      
      // Group by date
      calculations.forEach(calc => {
        const date = new Date(calc.timestamp || calc.created_at).toISOString().split('T')[0];
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;
      });
      
      // Recent calculations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      stats.recentCount = calculations.filter(calc => {
        const calcDate = new Date(calc.timestamp || calc.created_at);
        return calcDate >= sevenDaysAgo;
      }).length;
      
      // Oldest and newest
      const sortedByDate = calculations.sort((a, b) => {
        const aDate = new Date(a.timestamp || a.created_at);
        const bDate = new Date(b.timestamp || b.created_at);
        return aDate - bDate;
      });
      
      stats.oldestCalc = sortedByDate[0];
      stats.newestCalc = sortedByDate[sortedByDate.length - 1];
      
      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Bulk delete old calculations (cleanup)
  async cleanupOlderThan(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const oldCalculations = await this.list({
        to: cutoffDate.toISOString()
      });
      
      const deletedCount = oldCalculations.length;
      
      for (const calc of oldCalculations) {
        await this.delete(calc.id);
      }
      
      return deletedCount;
    } catch (error) {
      throw error;
    }
  }

  // Export calculations
  async export(options = {}) {
    try {
      const calculations = await this.list(options);
      
      return JSON.stringify({
        exported_at: new Date().toISOString(),
        count: calculations.length,
        calculations
      }, null, 2);
    } catch (error) {
      throw error;
    }
  }

  // Import calculations
  async import(calculationsJson) {
    try {
      const data = JSON.parse(calculationsJson);
      const calculations = data.calculations || [];
      
      const results = [];
      
      for (const calc of calculations) {
        try {
          const result = await this.create(calc);
          results.push(result);
        } catch {
          // Continue with other calculations
          results.push({ error: 'Failed to import calculation' });
        }
      }
      
      return results;
    } catch (error) {
      throw error;
    }
  }

  // Clear all calculations
  async clear() {
    try {
      this._writeToStorage([]);
      this._broadcast('calc-history-cleared', {});
      return [];
    } catch (error) {
      throw error;
    }
  }

  // Private helper methods
  _enrichCalculation(calcData) {
    const enriched = { ...calcData };
    const defaults = CalcHistorySchema.defaults || {};

    // Apply schema defaults without overriding explicit user values.
    for (const [key, value] of Object.entries(defaults)) {
      if (enriched[key] === undefined || enriched[key] === null) {
        enriched[key] = value;
      }
    }
    
    // Add timestamps if missing (support both timestamp and created_at)
    if (!enriched.timestamp && !enriched.created_at) {
      enriched.timestamp = new Date().toISOString();
      enriched.created_at = enriched.timestamp;
    } else if (enriched.timestamp && !enriched.created_at) {
      enriched.created_at = enriched.timestamp;
    } else if (enriched.created_at && !enriched.timestamp) {
      enriched.timestamp = enriched.created_at;
    }
    
    // Add default tags if missing
    if (!enriched.tags) {
      enriched.tags = [];
    }
    
    // Add calculation metadata
    enriched.metadata = {
      ...enriched.metadata,
      version: '1.0',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
    };
    
    return enriched;
  }

  _normalizeListOptions(options = {}) {
    const symbol = String(options.symbol || '').trim().toLowerCase();
    const calculationType = String(options.calculation_type || '').trim().toLowerCase();

    const from = this._normalizeDateOption(options.from || options.date_from, { endOfDay: false });
    const to = this._normalizeDateOption(options.to || options.date_to, { endOfDay: true });

    const numericLimit = Number.parseInt(options.limit, 10);
    const limit = Number.isFinite(numericLimit) && numericLimit > 0 ? numericLimit : null;

    return {
      symbol: symbol || null,
      calculation_type: calculationType || null,
      from,
      to,
      limit
    };
  }

  _normalizeDateOption(value, { endOfDay = false } = {}) {
    if (value === undefined || value === null || value === '') return null;

    const normalized = String(value).trim();
    if (!normalized) return null;

    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(normalized);
    const date = isDateOnly
      ? new Date(`${normalized}T00:00:00`)
      : new Date(normalized);

    if (!Number.isFinite(date.getTime())) return null;

    if (isDateOnly) {
      if (endOfDay) {
        date.setHours(23, 59, 59, 999);
      } else {
        date.setHours(0, 0, 0, 0);
      }
    }

    return date.toISOString();
  }

  _broadcast(event, detail) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event, { detail }));
    }
  }
}

// Factory function
export function createCalcHistoryService(dbAdapter) {
  return new CalcHistoryService(dbAdapter);
}


