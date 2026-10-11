/**
 * @file src/lib/calculations/calculatorTrade.js
 *
 * The trade record the calculator writes when a sized position is saved to
 * the journal. Kept apart from the calculator's own code, and free of any
 * path aliases, so the shape of a saved trade can be tested directly.
 *
 * A trade logged here must carry what a trade logged in Add Trade carries —
 * its risk, the setup it was sized against, and the version of that setup's
 * rules — or it cannot be judged alongside the others later.
 *
 * Pure module: no React, no database. P&L is computed by the caller and
 * passed in, since that calculation is shared with Add Trade.
 */

import { calcRiskPerShare, calcTradeRisk } from './tradeRisk.js';
import { getTradeVersionStamp } from '../playbook/versions.js';

/** Tolerance on the intended risk, so rounding a share count is not "oversized". */
export const OVERSIZED_TOLERANCE = 1.1;

const toNumber = (value) => {
  // Number(null) and Number('') are 0, which would store a missing stop as a
  // stop at zero — and make risk per share equal the entry price.
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * More dollars at risk than the setup intends. Judged on the same terms as
 * Add Trade, and never claimed when there is no intended risk to compare to.
 */
export function isPositionOversized(actualRisk, expectedRisk, tolerance = OVERSIZED_TOLERANCE) {
  const actual = toNumber(actualRisk);
  const intended = toNumber(expectedRisk);
  if (actual == null || intended == null || intended <= 0) return false;
  return actual > intended * tolerance;
}

/**
 * Builds the trade record. `pnl`, `pnlPercent` and `rMultiple` come from the
 * shared P&L calculation; everything else is derived here.
 */
export function buildCalculatorTrade({
  symbol,
  entryPrice,
  exitPrice,
  stopLoss,
  quantity,
  direction = 'long',
  comment = '',
  setupType = null,
  pnl = 0,
  pnlPercent = 0,
  rMultiple = null,
  playbookEntry = null,
  playbookVersion = null,
  expectedRisk = null,
  // { tickSize, tickValue, preset } for a futures contract, else null.
  futures = null,
  userId = null,
  now = new Date(),
}) {
  const entry = toNumber(entryPrice);
  const exit = toNumber(exitPrice);
  const stop = toNumber(stopLoss);
  const size = toNumber(quantity);
  const hasExit = exit != null && exit > 0;

  const futuresFields = futures
    ? {
        instrument_type: 'futures',
        tick_size: toNumber(futures.tickSize),
        tick_value: toNumber(futures.tickValue),
        futures_preset: futures.preset || null,
      }
    : null;
  // Futures risk is counted in ticks, so the record carries what a tick is worth.
  const riskShape = { entry_price: entry, stop_loss: stop, position_size: size, ...futuresFields };
  const riskPerShare = calcRiskPerShare(riskShape);
  const actualRisk = calcTradeRisk(riskShape);
  const timestamp = now.toISOString();

  return {
    symbol: String(symbol || '').trim().toUpperCase(),
    direction,
    entry_price: entry,
    exit_price: hasExit ? exit : null,
    position_size: size,
    quantity: size,
    entry_time: timestamp,
    exit_time: hasExit ? timestamp : null,
    pnl,
    pnl_percent: pnlPercent,
    r_multiple: rMultiple,
    stop_loss: stop,
    // Risk is never typed: entry to stop is what one share had at risk, and
    // that times size is what the trade did.
    risk_per_share: riskPerShare,
    risk_amount: actualRisk,
    is_oversized: isPositionOversized(actualRisk, expectedRisk),
    ...futuresFields,
    share_float: null,
    float_category: null,
    share_float_range: null,
    fee: 0,
    setup_type: setupType || 'Calculator Entry',
    notes: String(comment || '').trim(),
    // Shape kept aligned with the journal's own submission.
    emotions: ['neutral'],
    followed_plan: true,
    mistakes: [],
    lessons: '',
    screenshots: [],
    trade_plan_id: playbookEntry?.id || null,
    ...getTradeVersionStamp(playbookEntry, playbookVersion),
    strategy_preset_id: null,
    user_id: userId,
  };
}
