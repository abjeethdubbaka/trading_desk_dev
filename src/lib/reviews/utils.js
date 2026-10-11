/**
 * @file src/lib/reviews/utils.js
 *
 * Daily Report Card — which day a card belongs to, and how the list is split
 * into today's card and the ones before it.
 *
 * The day is always the trader's own local day. Stamping cards in UTC filed
 * an evening card under tomorrow, which both hid it from today and pushed it
 * into the past list under the wrong date.
 *
 * Pure module: no React, no database.
 */

/** Today as YYYY-MM-DD in the trader's own timezone. */
export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Splits saved cards into today's and the rest, newest first. A card with no
 * date is history that predates dating them, not today's work.
 */
export function partitionReviews(reviews = [], todayKey = getLocalDateKey()) {
  const all = Array.isArray(reviews) ? reviews : [];
  const today = all.filter((review) => review?.date === todayKey);
  const past = all
    .filter((review) => review?.date !== todayKey)
    .sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')));

  return { today, past };
}

/** The trades taken on one local day, newest first. */
export function getTradesForDay(trades = [], dateKey) {
  const wanted = String(dateKey || '').trim();
  if (!wanted) return [];

  return (Array.isArray(trades) ? trades : [])
    .filter((trade) => {
      const when = trade?.entry_time || trade?.created_date;
      if (!when) return false;
      const date = new Date(when);
      return !Number.isNaN(date.getTime()) && getLocalDateKey(date) === wanted;
    })
    .sort((a, b) => Date.parse(b?.entry_time || b?.created_date || 0)
      - Date.parse(a?.entry_time || a?.created_date || 0));
}

/**
 * How a trade reads in a picker or on a saved card: symbol, entry time, and
 * what it made, which is enough to recognise it without opening the journal.
 */
export function describeTrade(trade) {
  if (!trade) return '';

  const symbol = String(trade.symbol || '').trim().toUpperCase() || 'Trade';
  const when = trade.entry_time || trade.created_date;
  const time = when && !Number.isNaN(new Date(when).getTime())
    ? new Date(when).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const pnl = Number(trade.pnl);
  const result = Number.isFinite(pnl)
    ? `${pnl >= 0 ? '+' : '-'}$${Math.abs(Math.round(pnl))}`
    : '';

  const r = Number(trade.r_multiple);
  const rLabel = Number.isFinite(r) ? `${r > 0 ? '+' : ''}${r}R` : '';

  return [symbol, time, result, rLabel].filter(Boolean).join(' · ');
}
