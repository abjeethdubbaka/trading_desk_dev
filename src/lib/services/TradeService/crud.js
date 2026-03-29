/**
 * @file src/lib/services/TradeService/crud.js
 *
 * Trade CRUD operations.
 */

import { TradeSchema } from '../../schema/index.js';
import { ValidationError } from '../ValidationError.js';
import { enrichTrade } from './enrichment.js';

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

      // Calculate derived fields
      const enrichedTrade = enrichTrade(tradeWithDefaults);

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

      const updatedTrade = {
        ...existingTrade,
        ...changes
      };

      const enrichedTrade = enrichTrade(updatedTrade);

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


