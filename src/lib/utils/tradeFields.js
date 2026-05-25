/**
 * Canonical accessors for trade field names that vary between legacy and new records.
 *
 * Legacy records store PnL as `total_pnl`; newer records use `pnl`.
 * Legacy records use `created_date` for timestamp; newer records use `entry_time`.
 * All consumers should go through these helpers so the rest of the codebase stays clean.
 */

export function getTradePnL(trade) {
  return Number(trade?.pnl ?? trade?.total_pnl ?? 0);
}

export function getTradeDate(trade) {
  const raw = trade?.entry_time ?? trade?.created_date ?? null;
  return raw ? new Date(raw) : null;
}

export function sumPnL(trades) {
  return trades.reduce((total, trade) => total + getTradePnL(trade), 0);
}
