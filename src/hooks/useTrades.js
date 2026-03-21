/**
 * @file src/hooks/useTrades.js
 *
 * Re-exports from the canonical hook location.
 * Pages that import from '@/hooks/useTrades' will get the same hooks
 * as pages that import from '@/lib/hooks/useTrades'.
 *
 * This file exists for backward compatibility — new code should import
 * directly from '@/lib/hooks/useTrades'.
 */

export {
  useTrades,
  useTrade,
  useTradeStats,
  useTodayStats,
  useTradesMutation,
  useJournal,
} from '../lib/hooks/useTrades.js';
