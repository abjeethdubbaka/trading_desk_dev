/**
 * All trade logic (validate, compute, CRUD)
 */

import { validateSchema } from '../schema/validation.js';
import { TradeSchema } from '../schema/index.js';
import { calcCoreStats, calcPosition } from '../calculations/trades.js';
import { ValidationError } from './ValidationError.js';

export class TradeService {
  constructor(dbAdapter) {
    this.db = dbAdapter;
  }

  // Validation
  validate(tradeData) {
    return validateSchema(TradeSchema, tradeData);
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
      console.error('Migration failed:', error);
      throw error;
    }
  }

  // CRUD operations
  async create(tradeData) {
    const validation = this.validate(tradeData);
    
    if (!validation.isValid) {
      throw new ValidationError(validation.errors, tradeData);
    }

    // Apply defaults
    const tradeWithDefaults = {
      ...TradeSchema.defaults,
      ...tradeData
    };

    // Calculate derived fields
    const enrichedTrade = this._enrichTrade(tradeWithDefaults);

    return await this.db.trades.create(enrichedTrade);
  }

  async get(id) {
    return await this.db.trades.get(id);
  }

  async list(options = {}) {
    return await this.db.trades.list(options);
  }

  async update(id, changes) {
    // Validate changes
    const validation = this.validate(changes);
    
    if (!validation.isValid) {
      throw new ValidationError(validation.errors, changes);
    }

    // Enrich updated trade
    const existingTrade = await this.get(id);
    if (!existingTrade) {
      throw new Error(`Trade ${id} not found`);
    }

    const updatedTrade = {
      ...existingTrade,
      ...changes
    };

    const enrichedTrade = this._enrichTrade(updatedTrade);

    return await this.db.trades.update(id, enrichedTrade);
  }

  async delete(id) {
    return await this.db.trades.delete(id);
  }

  async bulkCreate(tradesArray) {
    const results = [];
    
    for (const tradeData of tradesArray) {
      try {
        const result = await this.create(tradeData);
        results.push(result);
      } catch (error) {
        console.error('Failed to create trade:', error);
        // Continue with other trades
      }
    }
    
    return results;
  }

  // Computed operations
  async getStats(options = {}) {
    const trades = await this.list(options);
    return calcCoreStats(trades);
  }

  async getStatsByPeriod(period = 'month') {
    const trades = await this.list();
    
    const grouped = trades.reduce((acc, trade) => {
      const date = new Date(trade.entry_time);
      let key;
      
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(trade);
      return acc;
    }, {});

    // Calculate stats for each period
    const statsByPeriod = {};
    for (const [period, periodTrades] of Object.entries(grouped)) {
      statsByPeriod[period] = calcCoreStats(periodTrades);
    }

    return statsByPeriod;
  }

  async getPerformanceMetrics() {
    const trades = await this.list();
    
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        totalPnL: 0,
        avgR: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        sharpeRatio: 0
      };
    }

    const stats = calcCoreStats(trades);
    
    // Calculate additional metrics
    const profits = trades
      .filter(t => (t.pnl ?? 0) > 0)  // Changed from total_pnl to pnl
      .map(t => t.pnl ?? 0);           // Changed from total_pnl to pnl
    
    const losses = trades
      .filter(t => (t.pnl ?? 0) < 0)   // Changed from total_pnl to pnl
      .map(t => Math.abs(t.pnl ?? 0)); // Changed from total_pnl to pnl

    const totalProfits = profits.reduce((sum, p) => sum + p, 0);
    const totalLosses = losses.reduce((sum, l) => sum + l, 0);
    
    const profitFactor = totalLosses > 0 ? totalProfits / totalLosses : totalProfits > 0 ? Infinity : 0;
    
    // Calculate running drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let runningPnL = 0;
    
    const sortedTrades = trades.sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));
    
    for (const trade of sortedTrades) {
      runningPnL += trade.total_pnl || 0;
      peak = Math.max(peak, runningPnL);
      const drawdown = peak - runningPnL;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Simple Sharpe ratio approximation (assuming 0% risk-free rate)
    const returns = sortedTrades.map(t => (t.total_pnl || 0) / (t.position_value || 1));
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnStdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

    return {
      ...stats,
      profitFactor,
      maxDrawdown,
      sharpeRatio
    };
  }

  // Search and filtering
  async search(query) {
    const trades = await this.list();
    
    const lowerQuery = query.toLowerCase();
    
    return trades.filter(trade => 
      trade.symbol?.toLowerCase().includes(lowerQuery) ||
      trade.setup_type?.toLowerCase().includes(lowerQuery) ||
      trade.notes?.toLowerCase().includes(lowerQuery) ||
      trade.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async getBySymbol(symbol) {
    const trades = await this.list();
    return trades.filter(trade => trade.symbol === symbol);
  }

  async getBySetup(setupType) {
    const trades = await this.list();
    return trades.filter(trade => trade.setup_type === setupType);
  }

  async getByDateRange(startDate, endDate) {
    const trades = await this.list();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.entry_time);
      return tradeDate >= start && tradeDate <= end;
    });
  }

  // Position sizing calculations
  async calculatePositionSize(params) {
    try {
      const calculation = calcPosition(params);
      
      // Save to calc history
      await this.saveCalculation({
        calculation_type: 'position_size',
        input_data: params,
        result_data: calculation,
        symbol: params.symbol
      });
      
      return calculation;
    } catch (error) {
      console.error('Position size calculation error:', error);
      throw error;
    }
  }

  // Private helper methods
  _enrichTrade(trade) {
    const enriched = { ...trade };

    // Calculate P&L if not present
    if (trade.entry_price && trade.exit_price && trade.quantity) {
      const priceDiff = trade.direction === 'short' ? 
        trade.entry_price - trade.exit_price : 
        trade.exit_price - trade.entry_price;
      
      const grossPnL = priceDiff * trade.quantity;
      const commission = trade.commission || 0;
      const netPnL = grossPnL - commission;
      
      enriched.pnl = netPnL;  // Changed from total_pnl to pnl
      enriched.total_pnl = netPnL;  // Keep for backward compatibility
      enriched.gross_pnl = grossPnL;
      enriched.pnl_percent = ((netPnL / (trade.entry_price * trade.quantity)) * 100);
    }

    // Calculate position value
    if (trade.entry_price && trade.quantity) {
      enriched.position_value = trade.entry_price * trade.quantity;
    }

    // Calculate risk if stop loss is present
    if (trade.entry_price && trade.stop_loss && trade.quantity) {
      const riskPerShare = Math.abs(trade.entry_price - trade.stop_loss);
      enriched.risk_amount = riskPerShare * trade.quantity;
      enriched.risk_percent = (riskPerShare / trade.entry_price) * 100;
    }

    // Add timestamps if missing
    if (!enriched.created_date) {
      enriched.created_date = new Date().toISOString();
    }
    if (!enriched.updated_date) {
      enriched.updated_date = new Date().toISOString();
    }

    return enriched;
  }

  async saveCalculation(calcData) {
    try {
      return await this.db.calcHistory.create(calcData);
    } catch (error) {
      console.error('Failed to save calculation:', error);
      // Don't throw - calculation saving is not critical
    }
  }
}

// Factory function
export function createTradeService(dbAdapter) {
  return new TradeService(dbAdapter);
}
