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
import { hydrateTradeShareFloat } from './shareFloatEnrichment.js';

const BACKFILL_DEBUG_ROW_LIMIT = 1000;

function normalizeFloatCategoriesForLog(floatCategories) {
  if (!floatCategories || typeof floatCategories !== 'object') return null;

  const normalized = {};
  for (const [key, category] of Object.entries(floatCategories)) {
    normalized[key] = {
      min: category?.min ?? null,
      max: category?.max ?? null,
      label: category?.label ?? null,
    };
  }

  return normalized;
}

function pushBackfillDebugRow(summary, row) {
  if (!Array.isArray(summary?.debugRows)) return;
  if (summary.debugRows.length >= BACKFILL_DEBUG_ROW_LIMIT) return;
  summary.debugRows.push(row);
}

export class TradeService {
  constructor(dbAdapter) {
    this.db = dbAdapter;
    this.crud = createTradeCRUD(this);
    this.analytics = createTradeAnalytics(this);
    this.search = createTradeSearch(this);
    this.calculations = createTradeCalculations(this);
  }

  async getFloatCategories() {
    try {
      const settingsGetter = this.db?.settings?.get;
      if (typeof settingsGetter !== 'function') return null;
      const settings = await settingsGetter.call(this.db.settings);
      return settings?.float_categories || null;
    } catch {
      return null;
    }
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

  /**
   * Backfill share-float fields on existing trades so performance analytics can
   * rely on complete float segmentation.
   *
   * @returns {Promise<{scanned:number, eligible:number, updated:number, skipped:number, failed:number, failures:Array<{id:string, symbol:string, message:string}>, debugRows:Array<object>, debugMeta:object}>}
   */
  async backfillShareFloatEnrichment() {
    const summary = {
      scanned: 0,
      eligible: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      failures: [],
      debugRows: [],
      debugMeta: {
        startedAt: new Date().toISOString(),
        floatCategories: null,
        debugRowLimit: BACKFILL_DEBUG_ROW_LIMIT,
      },
    };

    const allTrades = await this.db.trades.list();
    const floatCategories = await this.getFloatCategories();
    summary.debugMeta.floatCategories = normalizeFloatCategoriesForLog(floatCategories);

    for (const trade of allTrades) {
      summary.scanned += 1;

      const parsedShareFloat = Number(trade?.share_float);
      const hasShareFloat = Number.isFinite(parsedShareFloat) && parsedShareFloat > 0;
      const hasSymbol = Boolean(String(trade?.symbol ?? '').trim());
      const tradeDebugBase = {
        id: trade?.id ?? 'unknown',
        symbol: trade?.symbol ?? null,
        existingShareFloat: hasShareFloat ? Math.round(parsedShareFloat) : null,
        existingShareFloatRange: trade?.share_float_range ?? null,
        existingFloatCategory: trade?.float_category ?? null,
      };

      // Skip only trades we cannot enrich at all.
      if (!hasShareFloat && !hasSymbol) {
        summary.skipped += 1;
        pushBackfillDebugRow(summary, {
          ...tradeDebugBase,
          action: 'skipped',
          reason: 'missing_symbol_and_share_float',
          hydratedShareFloat: null,
          hydratedShareFloatRange: null,
          updates: null,
        });
        continue;
      }

      summary.eligible += 1;

      try {
        const hydratedTrade = await hydrateTradeShareFloat(trade);
        const enrichedTrade = enrichTrade(hydratedTrade, { floatCategories });

        const updates = {};
        const normalizedExistingShareFloat = hasShareFloat ? Math.round(parsedShareFloat) : null;
        const normalizedEnrichedShareFloat = Number.isFinite(Number(enrichedTrade?.share_float))
          ? Math.round(Number(enrichedTrade.share_float))
          : null;
        const normalizedExistingShareFloatRange = trade?.share_float_range ?? null;
        const normalizedEnrichedShareFloatRange = enrichedTrade?.share_float_range ?? null;

        if (normalizedExistingShareFloat !== normalizedEnrichedShareFloat) {
          updates.share_float = normalizedEnrichedShareFloat;
        }

        if (normalizedExistingShareFloatRange !== normalizedEnrichedShareFloatRange) {
          updates.share_float_range = normalizedEnrichedShareFloatRange;
        }

        if (Object.keys(updates).length === 0) {
          summary.skipped += 1;
          pushBackfillDebugRow(summary, {
            ...tradeDebugBase,
            action: 'skipped',
            reason: 'no_changes_after_enrichment',
            hydratedShareFloat: Number.isFinite(Number(hydratedTrade?.share_float))
              ? Math.round(Number(hydratedTrade?.share_float))
              : null,
            hydratedShareFloatRange: enrichedTrade?.share_float_range ?? null,
            updates: null,
          });
          continue;
        }

        await this.db.trades.update(trade.id, updates);
        summary.updated += 1;
        pushBackfillDebugRow(summary, {
          ...tradeDebugBase,
          action: 'updated',
          reason: Object.keys(updates).join('+'),
          hydratedShareFloat: Number.isFinite(Number(hydratedTrade?.share_float))
            ? Math.round(Number(hydratedTrade?.share_float))
            : null,
          hydratedShareFloatRange: enrichedTrade?.share_float_range ?? null,
          updates,
        });
      } catch (error) {
        summary.failed += 1;
        summary.failures.push({
          id: trade?.id ?? 'unknown',
          symbol: trade?.symbol ?? 'unknown',
          message: error?.message ?? 'Unknown error',
        });
        pushBackfillDebugRow(summary, {
          ...tradeDebugBase,
          action: 'failed',
          reason: error?.message ?? 'Unknown error',
          hydratedShareFloat: null,
          hydratedShareFloatRange: null,
          updates: null,
        });
      }
    }

    summary.debugMeta.finishedAt = new Date().toISOString();
    summary.debugMeta.loggedRows = summary.debugRows.length;

    return summary;
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
  _enrichTrade(trade, options = {}) {
    return enrichTrade(trade, options);
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


