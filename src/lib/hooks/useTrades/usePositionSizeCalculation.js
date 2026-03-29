/**
 * @file src/lib/hooks/useTrades/usePositionSizeCalculation.js
 *
 * Hook for position size calculation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function usePositionSizeCalculation(options = {}) {
  const queryClient = useQueryClient();

  const calculateMutation = useMutation({
    mutationFn: (params) => tradeService.calculatePositionSize(params),
    onSuccess: (result) => {
      // Invalidate calc history
      queryClient.invalidateQueries({ queryKey: ['calcHistory'] });
      
      options.onSuccess?.(result);
    },
    onError: (error) => {
      
      options.onError?.(error);
    }
  });

  return {
    calculatePositionSize: calculateMutation.mutateAsync,
    isCalculating: calculateMutation.isPending,
    calculationError: calculateMutation.error,
    calculation: calculateMutation.data
  };
}


