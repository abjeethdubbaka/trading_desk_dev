import { useState, useMemo, useCallback } from 'react';
import { getTradePnL, getTradeDate } from '@/lib/utils/tradeFields';

const STORAGE_KEY = 'journal.sort.v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sortKey: null, sortDir: 'asc' };
    const parsed = JSON.parse(raw);
    return { sortKey: parsed.sortKey ?? null, sortDir: parsed.sortDir ?? 'asc' };
  } catch {
    return { sortKey: null, sortDir: 'asc' };
  }
}

function save(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function getTradeValue(trade, key) {
  switch (key) {
    case 'date': {
      const d = getTradeDate(trade);
      return d ? d.getTime() : null;
    }
    case 'symbol':    return trade.symbol ?? null;
    case 'direction': return trade.direction ?? null;
    case 'setup':     return trade.setup_type ?? null;
    case 'r_multiple': {
      const v = trade.r_multiple;
      return v != null ? Number(v) : null;
    }
    case 'pnl':       return getTradePnL(trade);
    case 'duration': {
      const entry = getTradeDate(trade);
      const exitRaw = trade.exit_time;
      if (!entry || !exitRaw) return null;
      return new Date(exitRaw).getTime() - entry.getTime();
    }
    default:          return null;
  }
}

function stableCompare(a, b, sortKey, sortDir) {
  const av = getTradeValue(a, sortKey);
  const bv = getTradeValue(b, sortKey);

  // Nulls always last regardless of direction
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;

  let cmp;
  if (typeof av === 'string' && typeof bv === 'string') {
    cmp = av.localeCompare(bv, undefined, { sensitivity: 'base' });
  } else {
    cmp = av < bv ? -1 : av > bv ? 1 : 0;
  }

  return sortDir === 'desc' ? -cmp : cmp;
}

export function useJournalSort(trades = []) {
  const [state, setState] = useState(() => load());

  const onSortChange = useCallback((key) => {
    setState((prev) => {
      let nextKey, nextDir;
      if (prev.sortKey !== key) {
        nextKey = key;
        nextDir = 'asc';
      } else if (prev.sortDir === 'asc') {
        nextKey = key;
        nextDir = 'desc';
      } else {
        // third click → clear
        nextKey = null;
        nextDir = 'asc';
      }
      const next = { sortKey: nextKey, sortDir: nextDir };
      save(next);
      return next;
    });
  }, []);

  const setSort = useCallback((key, dir = 'asc') => {
    const next = { sortKey: key ?? null, sortDir: dir ?? 'asc' };
    save(next);
    setState(next);
  }, []);

  const sortedTrades = useMemo(() => {
    if (!state.sortKey) return trades;
    return [...trades].sort((a, b) => stableCompare(a, b, state.sortKey, state.sortDir));
  }, [trades, state.sortKey, state.sortDir]);

  return {
    sortKey: state.sortKey,
    sortDir: state.sortDir,
    sortedTrades,
    onSortChange,
    setSort,
  };
}
