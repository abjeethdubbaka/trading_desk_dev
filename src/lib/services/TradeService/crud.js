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
        console.error('[TradeService] create validation failed', {
          errors: validation.errors,
          symbol: tradeData?.symbol,
          quantity: tradeData?.quantity,
          direction: tradeData?.direction,
        });
        throw new ValidationError(validation.errors, tradeData);
      }

      // Apply defaults
      const tradeWithDefaults = {
        ...TradeSchema.defaults,
        ...tradeData
      };

      const tradeWithShareFloat = await hydrateTradeShareFloat(tradeWithDefaults);
      const floatCategories = await service.getFloatCategories();

      // Calculate derived fields
      const enrichedTrade = enrichTrade(tradeWithShareFloat, { floatCategories });
      console.info('[TradeService] create share-float enrichment', {
        symbol: enrichedTrade.symbol,
        share_float: enrichedTrade.share_float ?? null,
        float_category: enrichedTrade.float_category ?? null,
        share_float_range: enrichedTrade.share_float_range ?? null,
      });
      console.info('[TradeService] create validation passed', {
        symbol: enrichedTrade.symbol,
        quantity: enrichedTrade.quantity,
        direction: enrichedTrade.direction,
      });

      return await service.db.trades.create(enrichedTrade);
    },

    async get(id) {
      return await service.db.trades.get(id);
    },

    async list(options = {}) {
      return await service.db.trades.list(options);
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

      const enrichedTrade = enrichTrade(updatedTrade, { floatCategories });
      console.info('[TradeService] update share-float enrichment', {
        id,
        symbol: enrichedTrade.symbol,
        share_float: enrichedTrade.share_float ?? null,
        float_category: enrichedTrade.float_category ?? null,
        share_float_range: enrichedTrade.share_float_range ?? null,
      });

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
        } catch (error) {
          
          // Continue with other trades
        }
      }
      
      return results;
    }
  };
}


