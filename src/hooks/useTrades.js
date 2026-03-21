/**
 * @file src/hooks/useTrades.js
 *
 * Single hook for all trade CRUD + analytics.
 * Replaces the scattered useJournalTrades / base44 calls.
 *
 * Built on React Query — automatic caching, background refresh, optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { sanitizeTrade, validateTrade } from '@/lib/validation/trades';

export const TRADES_KEY = ['trades'];

// ─── List / read ──────────────────────────────────────────────────────────────

/**
 * @param {object} [options] - filter/sort options forwarded to db.trades.list()
 */
export function useTrades(options = {}) {
  return useQuery({
    queryKey: [...TRADES_KEY, options],
    queryFn:  () => db.trades.list(options),
    staleTime: 30_000,
  });
}

export function useTrade(id) {
  return useQuery({
    queryKey: [...TRADES_KEY, id],
    queryFn:  () => db.trades.get(id),
    enabled:  !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const clean = sanitizeTrade(data);
      const { isValid, errors } = validateTrade(clean);
      if (!isValid) throw new Error(errors.join(', '));
      return db.trades.create(clean);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TRADES_KEY }),
  });
}

export function useUpdateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => db.trades.update(id, sanitizeTrade(data)),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: TRADES_KEY });
      qc.invalidateQueries({ queryKey: [...TRADES_KEY, id] });
    },
  });
}

export function useDeleteTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => db.trades.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TRADES_KEY }),
  });
}

export function useBulkCreateTrades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows) => db.trades.bulkCreate(rows.map(sanitizeTrade)),
    onSuccess:  () => qc.invalidateQueries({ queryKey: TRADES_KEY }),
  });
}

// ─── Compound hook for the Journal page ──────────────────────────────────────

/**
 * Everything the Journal page needs in one call.
 */
export function useJournal(filterOptions = {}) {
  const query   = useTrades(filterOptions);
  const create  = useCreateTrade();
  const update  = useUpdateTrade();
  const remove  = useDeleteTrade();

  return {
    trades:      query.data ?? [],
    isLoading:   query.isLoading,
    error:       query.error,
    createTrade: create.mutateAsync,
    updateTrade: (id, data) => update.mutateAsync({ id, data }),
    deleteTrade: remove.mutate,
    isSaving:    create.isPending || update.isPending,
  };
}
