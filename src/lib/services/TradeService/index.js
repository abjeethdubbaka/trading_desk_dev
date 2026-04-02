/**
 * @file src/lib/services/TradeService/index.js
 *
 * Trade service - main class and factory.
 */

import { TradeService } from './TradeService.js';
import { createTradeService } from './TradeService.js';

export { TradeService, createTradeService };

// Re-export all functionality for backward compatibility
export * from './validation.js';
export * from './crud.js';
export * from './analytics.js';
export * from './search.js';
export * from './calculations.js';
export * from './enrichment.js';
export * from './shareFloatEnrichment.js';


