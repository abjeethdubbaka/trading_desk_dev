export { FUTURES_CONTRACTS } from '@/lib/calculations/trades';

/**
 * Calculate net P&L after fees and R:R ratio.
 * Supports both stocks (shares-based) and futures (tick-based) modes.
 */
export const calculatePnL = ({
  entryPrice,
  exitPrice,
  stopLoss,
  positionSize,
  direction,
  fee,
  // futures fields
  isFutures = false,
  tickSize,
  tickValue,
  contracts,
}) => {
  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const stop = parseFloat(stopLoss) || 0;
  const feeAmount = parseFloat(fee) || 0;

  if (isFutures) {
    const tSize = parseFloat(tickSize) || 0;
    const tValue = parseFloat(tickValue) || 0;
    const numContracts = parseInt(contracts) || 0;

    if (!entry || !exit || !tSize || !tValue || !numContracts) {
      return { pnl: 0, pnlPercent: 0, rMultiple: null };
    }

    const rawPriceDiff = direction === 'long' ? exit - entry : entry - exit;
    const ticksMoved = rawPriceDiff / tSize;
    const grossPnl = ticksMoved * tValue * numContracts;
    const netPnl = grossPnl - feeAmount;

    const stopTicks = stop > 0 ? Math.abs(entry - stop) / tSize : 0;
    const totalRisk = stopTicks * tValue * numContracts;
    const rMultiple = totalRisk > 0 ? netPnl / totalRisk : 0;

    return {
      pnl: netPnl,
      pnlPercent: 0,
      rMultiple: totalRisk > 0 ? rMultiple.toFixed(2) : null,
    };
  }

  // Stocks path
  const size = parseInt(positionSize) || 0;

  if (entry === 0 || size === 0) {
    return { pnl: 0, pnlPercent: 0, rMultiple: 0 };
  }

  const grossPnl = direction === 'long'
    ? (exit - entry) * size
    : (entry - exit) * size;

  const netPnl = grossPnl - feeAmount;
  const pnlPercent = entry > 0 ? (netPnl / (entry * size)) * 100 : 0;

  const riskPerShare = stop > 0 ? Math.abs(entry - stop) : 0;
  const totalRisk = riskPerShare * size;
  const rMultiple = totalRisk > 0 ? netPnl / totalRisk : 0;

  return {
    pnl: netPnl,
    pnlPercent,
    rMultiple: totalRisk > 0 ? rMultiple.toFixed(2) : null,
  };
};


