/**
 * Append-only calc history service
 */

import { validateSchema } from '../schema/validation.js';
import { CalcHistorySchema } from '../schema/index.js';

export class CalcHistoryService {
  constructor(dbAdapter) {
    this.db = dbAdapter;
  }

  // Create calculation record
  async create(calcData) {
    try {
      // Validate the calculation data
      const validation = validateSchema(CalcHistorySchema, calcData);
      
      if (!validation.isValid) {
        throw new Error(`Calculation validation failed: ${validation.errors.join(', ')}`);
      }

      // Enrich with metadata
      const enrichedCalc = this._enrichCalculation(calcData);
      
      // Save to database
      const result = await this.db.calcHistory.create(enrichedCalc);
      
      // Broadcast change
      this._broadcast('calc-history-updated', { action: 'create', calculation: result });
      
      return result;
    } catch (error) {
      console.error('CalcHistoryService - Create error:', error);
      throw error;
    }
  }

  // Get calculation by ID
  async get(id) {
    try {
      return await this.db.calcHistory.get(id);
    } catch (error) {
      console.error(`CalcHistoryService - Get error for ${id}:`, error);
      throw error;
    }
  }

  // List calculations with filtering
  async list(options = {}) {
    try {
      let calculations = await this.db.calcHistory.list(options);
      
      // Apply additional filtering
      if (options.calculation_type) {
        calculations = calculations.filter(calc => calc.calculation_type === options.calculation_type);
      }
      
      if (options.symbol) {
        calculations = calculations.filter(calc => calc.symbol === options.symbol);
      }
      
      if (options.date_from) {
        const fromDate = new Date(options.date_from);
        calculations = calculations.filter(calc => new Date(calc.created_at) >= fromDate);
      }
      
      if (options.date_to) {
        const toDate = new Date(options.date_to);
        calculations = calculations.filter(calc => new Date(calc.created_at) <= toDate);
      }
      
      if (options.tags && options.tags.length > 0) {
        calculations = calculations.filter(calc => 
          calc.tags && calc.tags.some(tag => options.tags.includes(tag))
        );
      }
      
      return calculations;
    } catch (error) {
      console.error('CalcHistoryService - List error:', error);
      throw error;
    }
  }

  // Get calculations by type
  async getByType(calculationType, options = {}) {
    return await this.list({ ...options, calculation_type });
  }

  // Get calculations by symbol
  async getBySymbol(symbol, options = {}) {
    return await this.list({ ...options, symbol });
  }

  // Get calculations by date range
  async getByDateRange(startDate, endDate, options = {}) {
    return await this.list({ 
      ...options, 
      date_from: startDate, 
      date_to: endDate 
    });
  }

  // Get recent calculations
  async getRecent(limit = 50) {
    return await this.list({ 
      limit,
      orderBy: 'created_at:desc'
    });
  }

  // Search calculations
  async search(query) {
    try {
      const calculations = await this.list();
      const lowerQuery = query.toLowerCase();
      
      return calculations.filter(calc => 
        calc.symbol?.toLowerCase().includes(lowerQuery) ||
        calc.calculation_type?.toLowerCase().includes(lowerQuery) ||
        calc.notes?.toLowerCase().includes(lowerQuery) ||
        calc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('CalcHistoryService - Search error:', error);
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
        const date = new Date(calc.created_at).toISOString().split('T')[0];
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;
      });
      
      // Recent calculations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      stats.recentCount = calculations.filter(calc => 
        new Date(calc.created_at) >= sevenDaysAgo
      ).length;
      
      // Oldest and newest
      const sortedByDate = calculations.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      
      stats.oldestCalc = sortedByDate[0];
      stats.newestCalc = sortedByDate[sortedByDate.length - 1];
      
      return stats;
    } catch (error) {
      console.error('CalcHistoryService - Stats error:', error);
      throw error;
    }
  }

  // Delete calculation (if needed for cleanup)
  async delete(id) {
    try {
      const result = await this.db.calcHistory.delete(id);
      
      // Broadcast change
      this._broadcast('calc-history-updated', { action: 'delete', calculationId: id });
      
      return result;
    } catch (error) {
      console.error(`CalcHistoryService - Delete error for ${id}:`, error);
      throw error;
    }
  }

  // Bulk delete old calculations (cleanup)
  async cleanupOlderThan(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const oldCalculations = await this.list({
        date_to: cutoffDate.toISOString()
      });
      
      const deletedCount = oldCalculations.length;
      
      for (const calc of oldCalculations) {
        await this.delete(calc.id);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('CalcHistoryService - Cleanup error:', error);
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
      console.error('CalcHistoryService - Export error:', error);
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
        } catch (error) {
          console.error('Failed to import calculation:', error);
          // Continue with other calculations
        }
      }
      
      return results;
    } catch (error) {
      console.error('CalcHistoryService - Import error:', error);
      throw error;
    }
  }

  // Private helper methods
  _enrichCalculation(calcData) {
    const enriched = { ...calcData };
    
    // Add timestamps if missing
    if (!enriched.created_at) {
      enriched.created_at = new Date().toISOString();
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

  _broadcast(channel, detail) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(channel, { detail }));
    }
  }
}

// Factory function
export function createCalcHistoryService(dbAdapter) {
  return new CalcHistoryService(dbAdapter);
}
