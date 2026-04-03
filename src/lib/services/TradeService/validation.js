/**
 * @file src/lib/services/TradeService/validation.js
 *
 * Trade validation logic.
 */

import { validateSchema } from '../../schema/validation.js';
import { TradeSchema } from '../../schema/index.js';

export function validateTrade(tradeData) {
  return validateSchema(TradeSchema, tradeData);
}

export function validateTradeForUpdate(changes) {
  return validateSchema(TradeSchema, changes);
}


