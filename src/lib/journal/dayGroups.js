/**
 * @file src/lib/journal/dayGroups.js
 *
 * How the journal is read: by day, with the day's result at the top, and
 * filtered by what a trader actually asks of a list of trades — winners,
 * shorts, oversized positions, trades still owed a debrief.
 *
 * Pure module: no React, no database. The date is always the trader's local
 * day, matching the Daily Report Card.
 */

import { getTradeDate, getTradePnL } from '../utils/tradeFields.js';

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** YYYY-MM-DD in the trader's own timezone. */
export function toDayKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Splits an already-sorted list into days, keeping the order the trades
 * arrived in — so a sort by P&L still groups by day, with days ordered by
 * where their first trade landed. Each group carries the day's totals.
 */
export function groupTradesByDay(trades = []) {
  const groups = new Map();

  for (const trade of Array.isArray(trades) ? trades : []) {
    const date = getTradeDate(trade);
    const key = toDayKey(date) || 'undated';

    if (!groups.has(key)) {
      groups.set(key, { key, date: date && key !== 'undated' ? date : null, trades: [] });
    }
    groups.get(key).trades.push(trade);
  }

  return [...groups.values()].map((group) => ({ ...group, ...summarizeDay(group.trades) }));
}

/** The day's result: what it made, how many won, and the average R. */
export function summarizeDay(trades = []) {
  const list = Array.isArray(trades) ? trades : [];
  const pnl = list.reduce((sum, trade) => sum + getTradePnL(trade), 0);
  const wins = list.filter((trade) => getTradePnL(trade) > 0).length;
  const rValues = list.map((trade) => toNumber(trade?.r_multiple)).filter((r) => r != null);

  return {
    count: list.length,
    pnl: round(pnl),
    wins,
    avgR: rValues.length > 0 ? round(rValues.reduce((sum, r) => sum + r, 0) / rValues.length) : null,
  };
}

/** The four graded parts of a trade, in the order Add Trade asks for them. */
export const GRADE_SLOTS = [
  { key: 'entry_grade', label: 'Entry', short: 'E' },
  { key: 'sl_grade', label: 'Stop', short: 'S' },
  { key: 'exit_grade', label: 'Exit', short: 'X' },
  { key: 'size_grade', label: 'Size', short: 'Z' },
];

/** The trade's grades as one row of letters, empty slots kept so the columns line up. */
export function getGradeLetters(trade) {
  return GRADE_SLOTS.map((slot) => ({ ...slot, grade: String(trade?.[slot.key] || '').trim() || null }));
}

/**
 * The chips a list can be narrowed by. They combine: Losers and Short shows
 * losing shorts. `notDebriefed` needs the set of trade ids that have a
 * Setup Journal entry.
 */
export const TRADE_FILTERS = [
  { key: 'winners', label: 'Winners' },
  { key: 'losers', label: 'Losers' },
  { key: 'long', label: 'Long' },
  { key: 'short', label: 'Short' },
  { key: 'oversized', label: 'Oversized' },
  { key: 'notDebriefed', label: 'Not debriefed' },
];

const FILTER_KEYS = new Set(TRADE_FILTERS.map((filter) => filter.key));

/**
 * Filters are stored as a comma-separated string, so saved presets from the
 * single-dropdown days still load: 'winners' is one chip, 'all' is none.
 */
export function parseFilterKeys(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(',');
  return new Set(raw.map((key) => String(key).trim()).filter((key) => FILTER_KEYS.has(key)));
}

export function serializeFilterKeys(keys) {
  const list = [...(keys instanceof Set ? keys : new Set(keys || []))].filter((key) => FILTER_KEYS.has(key));
  return list.length > 0 ? list.join(',') : 'all';
}

/** Whether one trade passes every active chip. */
export function matchesTradeFilters(trade, activeKeys, journaledTradeIds = new Set()) {
  const keys = activeKeys instanceof Set ? activeKeys : parseFilterKeys(activeKeys);
  if (keys.size === 0) return true;

  const pnl = getTradePnL(trade);
  if (keys.has('winners') && pnl <= 0) return false;
  if (keys.has('losers') && pnl >= 0) return false;
  if (keys.has('long') && trade?.direction !== 'long') return false;
  if (keys.has('short') && trade?.direction !== 'short') return false;
  if (keys.has('oversized') && !trade?.is_oversized) return false;
  if (keys.has('notDebriefed') && journaledTradeIds.has(String(trade?.id))) return false;
  return true;
}

/** The periods a list can be narrowed to, in the order Performance shows them. */
export const PERIODS = [
  { key: 'all', label: 'All time' },
  { key: 'ytd', label: 'YTD' },
  { key: '3m', label: '3 months' },
  { key: 'month', label: 'This month' },
  { key: 'week', label: 'This week' },
  { key: 'today', label: 'Today' },
];

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Whether a date falls inside a period, measured from `now`. The week starts
 * on Monday, the way a trading week does. `lastMonth` survives for presets
 * saved before the periods were aligned with Performance.
 */
export function isInPeriod(date, period, now = new Date()) {
  if (!period || period === 'all') return true;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;

  const today = startOfDay(now);

  switch (period) {
    case 'today':
      return date >= today && date < new Date(today.getTime() + 86400000);
    case 'week': {
      const weekday = (today.getDay() + 6) % 7; // Monday = 0
      const monday = new Date(today);
      monday.setDate(today.getDate() - weekday);
      return date >= monday;
    }
    case 'month':
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    case '3m': {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 3);
      return date >= start;
    }
    case 'ytd':
      return date.getFullYear() === now.getFullYear();
    case 'lastMonth': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const next = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= first && date < next;
    }
    default:
      return true;
  }
}
