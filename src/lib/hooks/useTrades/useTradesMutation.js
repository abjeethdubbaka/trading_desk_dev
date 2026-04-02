/**
 * @file src/lib/hooks/useTrades/useTradesMutation.js
 *
 * Mutation hooks for trades.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '../../context/SettingsContext.jsx';
import { createTradeService } from '../../services/TradeService.js';
import { db } from '../../db/index.js';
import { tradeKeys } from './queryKeys.js';

// Create trade service instance
const tradeService = createTradeService(db);

export function useTradesMutation(options = {}) {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';

  const createMutation = useMutation({
    mutationFn: (tradeData) => {
      // Add current account tier to trade data
      const tradeWithTier = {
        ...tradeData,
        account_tier: currentTier
      };
      console.info('[TradesMutation] createTrade called', {
        symbol: tradeWithTier.symbol,
        entry_price: tradeWithTier.entry_price,
        quantity: tradeWithTier.quantity,
        direction: tradeWithTier.direction,
        account_tier: tradeWithTier.account_tier,
      });
      return tradeService.create(tradeWithTier);
    },
    onSuccess: (newTrade) => {
      // Invalidate only specific queries instead of all
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.setQueryData(tradeKeys.detail(newTrade.id), newTrade);
      
      options.onSuccess?.(newTrade);
    },
    onError: (error) => {
      console.error('[TradesMutation] createTrade failed', {
        name: error?.name,
        code: error?.code,
        message: error?.message,
        errors: error?.errors,
      });
      options.onError?.(error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tradeService.update(id, data),
    onSuccess: (updatedTrade) => {
      // Invalidate only specific queries instead of all
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.setQueryData(tradeKeys.detail(updatedTrade.id), updatedTrade);
      
      options.onSuccess?.(updatedTrade);
    },
    onError: (error) => {
      options.onError?.(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tradeService.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate only specific queries instead of all
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.removeQueries({ queryKey: tradeKeys.detail(deletedId) });
      
      options.onSuccess?.(deletedId);
    },
    onError: (error) => {
      options.onError?.(error);
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (tradesArray) => tradeService.bulkCreate(tradesArray),
    onSuccess: (newTrades) => {
      // Invalidate trades list
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      
      // Add new trades to cache
      newTrades.forEach(trade => {
        queryClient.setQueryData(tradeKeys.detail(trade.id), trade);
      });
      
      options.onSuccess?.(newTrades);
    },
    onError: (error) => {
      options.onError?.(error);
    }
  });

  return {
    createTrade: createMutation.mutateAsync,
    updateTrade: updateMutation.mutateAsync,
    deleteTrade: deleteMutation.mutateAsync,
    bulkCreateTrades: bulkCreateMutation.mutateAsync,
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
    
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    bulkCreateError: bulkCreateMutation.error
  };
}
