/**
 * @file src/lib/dashboard/attention.js
 *
 * What the Dashboard asks the trader to finish: days traded without a Daily
 * Report Card, and trades not yet debriefed in the Setup Journal. Both look
 * back over a short window — a list of every gap since the account opened
 * stops being a to-do list and becomes noise.
 *
 * Pure module: no React, no database.
 */

export const ATTENTION_WINDOW_DAYS = 14;

/** A date as YYYY-MM-DD in the trader's own timezone. */
export function toLocalDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function tradeDate(trade) {
  const raw = trade?.entry_time ?? trade?.created_date ?? null;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function tradePnL(trade) {
  const value = Number(trade?.pnl ?? trade?.total_pnl ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function windowStart(now, windowDays) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (windowDays - 1));
}

/**
 * Past days in the window with trades but no Report Card, newest first.
 * Today is left out: the day is not over, and the Today card already says
 * whether its card is written.
 */
export function getUnreviewedDays(trades = [], reviewedDates = new Set(), {
  now = new Date(),
  windowDays = ATTENTION_WINDOW_DAYS,
} = {}) {
  const start = windowStart(now, windowDays);
  const todayKey = toLocalDateKey(now);
  const days = new Map();

  for (const trade of Array.isArray(trades) ? trades : []) {
    const date = tradeDate(trade);
    if (!date || date < start) continue;
    const key = toLocalDateKey(date);
    if (key === todayKey || reviewedDates.has(key)) continue;

    const day = days.get(key) || { key, date: new Date(date.getFullYear(), date.getMonth(), date.getDate()), count: 0, pnl: 0 };
    day.count += 1;
    day.pnl += tradePnL(trade);
    days.set(key, day);
  }

  return [...days.values()].sort((a, b) => b.date - a.date);
}

/**
 * Trades in the window with a setup but no Setup Journal debrief, newest
 * first. A trade with no setup has no template to be debriefed against, so
 * it is never owed one.
 */
export function getUndebriefedTrades(trades = [], journaledTradeIds = new Set(), {
  now = new Date(),
  windowDays = ATTENTION_WINDOW_DAYS,
} = {}) {
  const start = windowStart(now, windowDays);

  return (Array.isArray(trades) ? trades : [])
    .filter((trade) => {
      const date = tradeDate(trade);
      if (!date || date < start) return false;
      if (!String(trade?.setup_type || '').trim()) return false;
      return !journaledTradeIds.has(String(trade?.id));
    })
    .sort((a, b) => tradeDate(b) - tradeDate(a));
}
