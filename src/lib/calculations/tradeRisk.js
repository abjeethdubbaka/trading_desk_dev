/**
 * @file src/lib/calculations/tradeRisk.js
 *
 * What a trade actually put at risk, and what a symbol's stops have
 * historically looked like.
 *
 * Risk is never typed: it follows from where the trade was entered, where it
 * was wrong, and how big it was. Reading it back per symbol turns a pile of
 * trades into a usable prior — "my stop on this name is normally 40 cents".
 *
 * Pure module: no React, no database.
 */

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** How far the stop sits from the entry, in price and as a percentage of it. */
export function calcStopDistance(trade) {
  const entry = toNumber(trade?.entry_price);
  const stop = toNumber(trade?.stop_loss);
  if (entry == null || stop == null || entry <= 0 || stop <= 0 || entry === stop) {
    return { distance: null, percent: null, direction: null };
  }

  const distance = Math.abs(entry - stop);
  return {
    distance: round(distance, 4),
    percent: round((distance / entry) * 100, 2),
    // A stop below entry is a long, above is a short.
    direction: stop < entry ? 'long' : 'short',
  };
}

/** What one share (or contract) of this trade had at risk: entry minus stop. */
export function calcRiskPerShare(trade) {
  return calcStopDistance(trade).distance;
}

/**
 * The dollars a trade put at risk. Futures risk is counted in ticks, since a
 * contract's move is worth a fixed amount per tick rather than per point.
 */
export function calcTradeRisk(trade) {
  const { distance } = calcStopDistance(trade);
  const size = toNumber(trade?.position_size);
  if (distance == null || size == null || size <= 0) return null;

  if (trade?.instrument_type === 'futures') {
    const tickSize = toNumber(trade?.tick_size);
    const tickValue = toNumber(trade?.tick_value);
    if (!tickSize || !tickValue || tickSize <= 0) return null;
    return round((distance / tickSize) * tickValue * size);
  }

  return round(distance * size);
}

const mean = (values) => (values.length > 0
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : null);

/**
 * How this symbol has been traded before: the stop distance normally used,
 * and what that normally costs. One trade is a data point, not a habit, so
 * the count is reported alongside for the caller to judge.
 */
export function summarizeSymbolStops(trades = [], symbol) {
  const wanted = String(symbol || '').trim().toUpperCase();
  if (!wanted) return { symbol: '', count: 0, avgDistance: null, avgPercent: null, lastDistance: null, avgRisk: null };

  const matching = (Array.isArray(trades) ? trades : [])
    .filter((trade) => String(trade?.symbol || '').trim().toUpperCase() === wanted)
    .map((trade) => ({ trade, ...calcStopDistance(trade) }))
    .filter((row) => row.distance != null);

  if (matching.length === 0) {
    return { symbol: wanted, count: 0, avgDistance: null, avgPercent: null, lastDistance: null, avgRisk: null };
  }

  // Newest first, so "last" means the most recent trade on this name.
  const byRecency = [...matching].sort((a, b) => (
    Date.parse(b.trade?.entry_time || b.trade?.created_date || 0)
    - Date.parse(a.trade?.entry_time || a.trade?.created_date || 0)
  ));

  const risks = matching.map((row) => calcTradeRisk(row.trade)).filter((risk) => risk != null);

  return {
    symbol: wanted,
    count: matching.length,
    avgDistance: round(mean(matching.map((row) => row.distance)), 4),
    avgPercent: round(mean(matching.map((row) => row.percent)), 2),
    lastDistance: byRecency[0].distance,
    avgRisk: risks.length > 0 ? round(mean(risks)) : null,
  };
}

/**
 * The stop price this history suggests for a given entry. Direction comes
 * from the caller's own stop when they have typed one, so a short is not
 * handed a long's stop.
 */
export function suggestStopPrice(entryPrice, summary, direction = 'long') {
  const entry = toNumber(entryPrice);
  const distance = toNumber(summary?.avgDistance);
  if (entry == null || entry <= 0 || distance == null || distance <= 0) return null;

  const suggested = direction === 'short' ? entry + distance : entry - distance;
  return suggested > 0 ? round(suggested) : null;
}
