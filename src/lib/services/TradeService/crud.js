/**
 * @file src/lib/services/TradeService/crud.js
 *
 * Trade CRUD operations.
 */

import { TradeSchema } from '../../schema/index.js';
import { ValidationError } from '../ValidationError.js';
import { enrichTrade } from './enrichment.js';
import {
  hydrateTradeShareFloat,
  shouldResetShareFloatForSymbolChange,
} from './shareFloatEnrichment.js';

export function createTradeCRUD(service) {
  return {
    async create(tradeData) {
      const validation = service.validate(tradeData);
      
      if (!validation.isValid) {
        throw new ValidationError(validation.errors, tradeData);
      }

      // Apply defaults
      const tradeWithDefaults = {
        ...TradeSchema.defaults,
        ...tradeData
      };

      const tradeWithShareFloat = await hydrateTradeShareFloat(tradeWithDefaults);
      const floatCategories = await service.getFloatCategories();
      const riskLimit = await service.getRiskLimit();

      // Calculate derived fields
      const enrichedTrade = enrichTrade(tradeWithShareFloat, { floatCategories, riskLimit });

      return await service.db.trades.create(enrichedTrade);
    },

    async get(id) {
      const trade = await service.db.trades.get(id);
      if (!trade) return trade;

      const floatCategories = await service.getFloatCategories();
      const riskLimit = await service.getRiskLimit();
      return enrichTrade(trade, { floatCategories, riskLimit });
    },

    async list(options = {}) {
      const trades = await service.db.trades.list(options);
      if (!Array.isArray(trades) || trades.length === 0) return [];

      const floatCategories = await service.getFloatCategories();
      const riskLimit = await service.getRiskLimit();
      return trades.map((trade) => enrichTrade(trade, { floatCategories, riskLimit }));
    },

    async update(id, changes) {
      // Validate changes
      const validation = service.validate(changes);
      
      if (!validation.isValid) {
        throw new ValidationError(validation.errors, changes);
      }

      // Enrich updated trade
      const existingTrade = await this.get(id);
      if (!existingTrade) {
        throw new Error(`Trade ${id} not found`);
      }

      let updatedTrade = {
        ...existingTrade,
        ...changes
      };

      if (shouldResetShareFloatForSymbolChange(existingTrade, changes, updatedTrade)) {
        updatedTrade = {
          ...updatedTrade,
          share_float: null,
          float_category: null,
          share_float_range: null,
        };
      }

      updatedTrade = await hydrateTradeShareFloat(updatedTrade);
      const floatCategories = await service.getFloatCategories();
      const riskLimit = await service.getRiskLimit();

      const enrichedTrade = enrichTrade(updatedTrade, { floatCategories, riskLimit });

      return await service.db.trades.update(id, enrichedTrade);
    },

    async delete(id) {
      return await service.db.trades.delete(id);
    },

    async bulkCreate(tradesArray) {
      const results = [];
      
      for (const tradeData of tradesArray) {
        try {
          const result = await this.create(tradeData);
          results.push(result);
        } catch {
          
          // Continue with other trades
        }
      }
      
      return results;
    }
  };
}


