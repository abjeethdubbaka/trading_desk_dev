/**
 * @file src/lib/hooks/useTrades/index.js
 *
 * Trade hooks - re-export from split files.
 */

export { tradeKeys } from './queryKeys.js';

// Query hooks
export { useTrades } from './useTrades.js';
export { useTrade } from './useTrade.js';
export { useTradeStats } from './useTradeStats.js';
export { useTradeStatsByPeriod } from './useTradeStatsByPeriod.js';
export { useTradePerformance } from './useTradePerformance.js';
export { useTradeSearch } from './useTradeSearch.js';
export { useTradesBySymbol } from './useTradesBySymbol.js';
export { useTradesBySetup } from './useTradesBySetup.js';
export { useTradesByDateRange } from './useTradesByDateRange.js';
export { useJournal } from './useJournal.js';

// Mutation hooks
export { useTradesMutation } from './useTradesMutation.js';
export { usePositionSizeCalculation } from './usePositionSizeCalculation.js';

// Utility hooks
export { useTradeFilters } from './useTradeFilters.js';
export { useTradeValidation } from './useTradeValidation.js';
export { useTradeData } from './useTradeData.js';


