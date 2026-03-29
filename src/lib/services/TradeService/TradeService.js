/**
 * @file src/lib/services/TradeService/TradeService.js
 *
 * Main TradeService class.
 */

import { validateSchema } from '../../schema/validation.js';
import { TradeSchema } from '../../schema/index.js';
import { ValidationError } from '../ValidationError.js';
import { validateTrade } from './validation.js';
import { createTradeCRUD } from './crud.js';
import { createTradeAnalytics } from './analytics.js';
import { createTradeSearch } from './search.js';
import { createTradeCalculations } from './calculations.js';
import { enrichTrade } from './enrichment.js';

export class TradeService {
  constructor(dbAdapter) {
    this.db = dbAdapter;
    this.crud = createTradeCRUD(this);
    this.analytics = createTradeAnalytics(this);
    this.search = createTradeSearch(this);
    this.calculations = createTradeCalculations(this);
  }

  // Validation
  validate(tradeData) {
    return validateTrade(tradeData);
  }

  // Migration: Update existing trades to have 25K account tier
  async migrateTradesToAccountTier() {
    try {
      const allTrades = await this.db.trades.list();
      const tradesWithoutTier = allTrades.filter(trade => !trade.account_tier);
      
      if (tradesWithoutTier.length === 0) {
        return;
      }
      
      for (const trade of tradesWithoutTier) {
        await this.db.trades.update(trade.id, { account_tier: '25K' });
      }
    } catch (error) {
      
      throw error;
    }
  }

  // CRUD operations - delegate to CRUD module
  async create(tradeData) {
    return this.crud.create(tradeData);
  }

  async get(id) {
    return this.crud.get(id);
  }

  async list(options = {}) {
    return this.crud.list(options);
  }

  async update(id, changes) {
    return this.crud.update(id, changes);
  }

  async delete(id) {
    return this.crud.delete(id);
  }

  async bulkCreate(tradesArray) {
    return this.crud.bulkCreate(tradesArray);
  }

  // Analytics operations - delegate to analytics module
  async getStats(options = {}) {
    return this.analytics.getStats(options);
  }

  async getStatsByPeriod(period = 'month') {
    return this.analytics.getStatsByPeriod(period);
  }

  async getPerformanceMetrics() {
    return this.analytics.getPerformanceMetrics();
  }

  // Search operations - delegate to search module
  async search(query) {
    return this.search.search(query);
  }

  async getBySymbol(symbol) {
    return this.search.getBySymbol(symbol);
  }

  async getBySetup(setupType) {
    return this.search.getBySetup(setupType);
  }

  async getByDateRange(startDate, endDate) {
    return this.search.getByDateRange(startDate, endDate);
  }

  // Calculation operations - delegate to calculations module
  async calculatePositionSize(params) {
    return this.calculations.calculatePositionSize(params);
  }

  // Private helper method
  _enrichTrade(trade) {
    return enrichTrade(trade);
  }

  async saveCalculation(calcData) {
    try {
      return await this.db.calcHistory.create(calcData);
    } catch (error) {
      
      // Don't throw - calculation saving is not critical
    }
  }
}

// Factory function
export function createTradeService(dbAdapter) {
  return new TradeService(dbAdapter);
}


