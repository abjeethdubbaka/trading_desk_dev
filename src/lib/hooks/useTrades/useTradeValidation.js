/**
 * @file src/lib/hooks/useTrades/useTradeValidation.js
 *
 * Hook for trade validation.
 */

import { useCallback } from 'react';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTradeValidation() {
  const validateTrade = useCallback((tradeData) => {
    try {
      const validation = tradeService.validate(tradeData);
      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }, []);

  return { validateTrade };
}


