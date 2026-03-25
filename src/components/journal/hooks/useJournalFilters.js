/**
 * @file src/components/journal/hooks/useJournalFilters.js
 *
 * Client-side filter + search on an array of trades.
 * Works the same regardless of whether trades came from Firebase or localStorage.
 */

import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function useJournalFilters(trades = []) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter,     setFilter]     = useState('all');
  const [dateRange,  setDateRange]  = useState('all');

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // ── Search ──────────────────────────────────────────────────────────
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          trade.symbol?.toLowerCase().includes(q) ||
          trade.notes?.toLowerCase().includes(q)  ||
          trade.setup_type?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // ── Direction / outcome filter ───────────────────────────────────────
      const tradePnL = trade.pnl ?? trade.total_pnl ?? 0;  // Support both field names
      if (filter === 'winners' && tradePnL <= 0)  return false;
      if (filter === 'losers'  && tradePnL >= 0)  return false;
      if (filter === 'long'    && trade.direction !== 'long')  return false;
      if (filter === 'short'   && trade.direction !== 'short') return false;

      // ── Date range ───────────────────────────────────────────────────────
      if (dateRange !== 'all') {
        const tradeDate = new Date(trade.entry_time ?? trade.created_date ?? 0);
        const now = new Date();

        if (dateRange === 'today') {
          const start = new Date(now); start.setHours(0, 0, 0, 0);
          const end   = new Date(now); end.setHours(23, 59, 59, 999);
          if (tradeDate < start || tradeDate > end) return false;
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 86400_000);
          if (tradeDate < weekAgo) return false;
        } else if (dateRange === 'month') {
          if (tradeDate < startOfMonth(now) || tradeDate > endOfMonth(now)) return false;
        } else if (dateRange === 'lastMonth') {
          const lm = subMonths(now, 1);
          if (tradeDate < startOfMonth(lm) || tradeDate > endOfMonth(lm)) return false;
        }
      }

      return true;
    });
  }, [trades, searchTerm, filter, dateRange]);

  return {
    searchTerm, setSearchTerm,
    filter,     setFilter,
    dateRange,  setDateRange,
    filteredTrades,
  };
}
