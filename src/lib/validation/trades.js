/**
 * @file src/lib/validation/trades.js
 *
 * Re-exports trade validation from the schema layer.
 * Exists so pages can import from '@/lib/validation/trades'
 * which is a more discoverable path than '@/lib/schema/validation'.
 */

export {
  validateTrade,
  validateSettings,
  validateCalcHistoryItem,
  stripUnknownFields,
  sanitizeTrade,
} from '../schema/validation.js';


