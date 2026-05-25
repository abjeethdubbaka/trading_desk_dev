/**
 * @file src/components/journal/shared/hooks/useJournalFilters.js
 *
 * Client-side filter + search on an array of trades.
 * Works the same regardless of whether trades came from Firebase or localStorage.
 */

import { useState, useMemo, useCallback } from 'react';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { getTradeNotesText } from '../../utils/notes';
import { getTradePnL, getTradeDate } from '@/lib/utils/tradeFields';

export function useJournalFilters(trades = []) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter,     setFilter]     = useState('all');
  const [dateRange,  setDateRange]  = useState('all');
  const [tagFilter,  setTagFilter]  = useState([]);

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // ── Search ──────────────────────────────────────────────────────────
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const notesText = getTradeNotesText(trade).toLowerCase();
        const match =
          trade.symbol?.toLowerCase().includes(q) ||
          notesText.includes(q) ||
          trade.setup_type?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // ── Tag filter ───────────────────────────────────────────────────────
      if (tagFilter.length > 0) {
        const tradeTags = Array.isArray(trade.tags) ? trade.tags : [];
        const hasMatch = tagFilter.some((t) => tradeTags.includes(t));
        if (!hasMatch) return false;
      }

      // ── Direction / outcome filter ───────────────────────────────────────
      const tradePnL = getTradePnL(trade);
      if (filter === 'winners' && tradePnL <= 0)  return false;
      if (filter === 'losers'  && tradePnL >= 0)  return false;
      if (filter === 'long'    && trade.direction !== 'long')  return false;
      if (filter === 'short'   && trade.direction !== 'short') return false;

      // ── Date range ───────────────────────────────────────────────────────
      if (dateRange !== 'all') {
        const tradeDate = getTradeDate(trade) ?? new Date(0);
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
  }, [trades, searchTerm, filter, dateRange, tagFilter]);

  // Expose a batch-apply for preset loading
  const applyFilterState = useCallback(({ searchTerm: s, filter: f, dateRange: d, tagFilter: t }) => {
    if (s !== undefined) setSearchTerm(s ?? '');
    if (f !== undefined) setFilter(f ?? 'all');
    if (d !== undefined) setDateRange(d ?? 'all');
    if (t !== undefined) setTagFilter(Array.isArray(t) ? t : []);
  }, []);

  return {
    searchTerm, setSearchTerm,
    filter,     setFilter,
    dateRange,  setDateRange,
    tagFilter,  setTagFilter,
    filteredTrades,
    applyFilterState,
  };
}


