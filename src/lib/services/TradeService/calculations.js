/**
 * @file src/lib/services/TradeService/calculations.js
 *
 * Trade calculation operations.
 */

import { calcPosition } from '../../calculations/trades.js';

export function createTradeCalculations(service) {
  return {
    async calculatePositionSize(params) {
      try {
        const calculation = calcPosition(params);
        
        // Save to calc history
        await service.saveCalculation({
          calculation_type: 'position_size',
          input_data: params,
          result_data: calculation,
          symbol: params.symbol
        });
        
        return calculation;
      } catch (error) {
        
        throw error;
      }
    }
  };
}


