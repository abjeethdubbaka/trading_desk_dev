/**
 * @file src/components/journal/hooks/useJournalFilters.js
 *
 * Search, filter chips and period for the journal list. The rules live in
 * lib/journal/dayGroups so they can be tested; this hook only holds state.
 *
 * Chips combine — Losers and Short shows losing shorts — and are kept as a
 * Set. For saved presets they serialize to the same string the old single
 * dropdown stored, so a preset saved as 'winners' still loads.
 */

import { useState, useMemo, useCallback } from 'react';
import { getTradeNotesText } from '../utils/notes';
import { getTradeDate } from '@/lib/utils/tradeFields';
import {
  isInPeriod,
  matchesTradeFilters,
  parseFilterKeys,
  serializeFilterKeys,
} from '@/lib/journal/dayGroups';

const EMPTY_SET = new Set();

export function useJournalFilters(trades = [], { journaledTradeIds = EMPTY_SET } = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKeys, setFilterKeys] = useState(() => new Set());
  const [dateRange, setDateRange] = useState('all');

  const toggleFilterKey = useCallback((key) => {
    setFilterKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      // Opposites cannot both hold, so picking one releases the other.
      const opposite = { winners: 'losers', losers: 'winners', long: 'short', short: 'long' }[key];
      if (opposite && next.has(key)) next.delete(opposite);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterKeys(new Set());
    setDateRange('all');
  }, []);

  const filteredTrades = useMemo(() => {
    const rawSearch = searchTerm.trim().toLowerCase();
    const now = new Date();

    return trades.filter((trade) => {
      if (rawSearch) {
        const haystack = [
          trade.symbol,
          trade.setup_type,
          getTradeNotesText(trade),
        ].map((part) => String(part || '').toLowerCase());
        if (!haystack.some((part) => part.includes(rawSearch))) return false;
      }

      if (!matchesTradeFilters(trade, filterKeys, journaledTradeIds)) return false;

      return isInPeriod(getTradeDate(trade), dateRange, now);
    });
  }, [trades, searchTerm, filterKeys, dateRange, journaledTradeIds]);

  // Presets store the filter as a string; this is the bridge in both directions.
  const filter = useMemo(() => serializeFilterKeys(filterKeys), [filterKeys]);
  const setFilter = useCallback((value) => setFilterKeys(parseFilterKeys(value)), []);

  const applyFilterState = useCallback(({ searchTerm: s, filter: f, dateRange: d }) => {
    if (s !== undefined) setSearchTerm(s ?? '');
    if (f !== undefined) setFilterKeys(parseFilterKeys(f ?? 'all'));
    if (d !== undefined) setDateRange(d ?? 'all');
  }, []);

  const hasActiveFilters = Boolean(searchTerm.trim()) || filterKeys.size > 0 || dateRange !== 'all';

  return {
    searchTerm, setSearchTerm,
    filterKeys, toggleFilterKey,
    filter, setFilter,
    dateRange, setDateRange,
    clearFilters,
    hasActiveFilters,
    filteredTrades,
    applyFilterState,
  };
}
