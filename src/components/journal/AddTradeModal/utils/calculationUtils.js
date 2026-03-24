/**
 * Calculate net P&L after fees and R:R ratio
 * @param {Object} params - Calculation parameters
 * @returns {Object} Calculated values
 */
export const calculatePnL = ({
  entryPrice,
  exitPrice,
  stopLoss,
  positionSize,
  direction,
  fee
}) => {
  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const stop = parseFloat(stopLoss) || 0;
  const size = parseInt(positionSize) || 0;
  const feeAmount = parseFloat(fee) || 0;
  
  if (entry === 0 || size === 0) {
    return { pnl: 0, pnlPercent: 0, rMultiple: 0 };
  }
  
  // Calculate gross P&L
  const grossPnl = direction === 'long'
    ? (exit - entry) * size
    : (entry - exit) * size;
  
  // Calculate net P&L after fees
  const netPnl = grossPnl - feeAmount;
  
  // Calculate P&L percentage
  const pnlPercent = entry > 0 ? (netPnl / (entry * size)) * 100 : 0;
  
  // Calculate R-multiple using actual stop loss
  const riskPerShare = stop > 0 ? Math.abs(entry - stop) : 0;
  const totalRisk = riskPerShare * size;
  const rMultiple = totalRisk > 0 ? netPnl / totalRisk : 0;
  
  return {
    pnl: netPnl,
    pnlPercent,
    rMultiple: rMultiple > 0 ? rMultiple.toFixed(2) : null
  };
};
