/**
 * Calculate net P&L after fees
 * @param {Object} params - Calculation parameters
 * @returns {Object} Calculated values
 */
export const calculatePnL = ({
  entryPrice,
  exitPrice,
  positionSize,
  direction,
  fee
}) => {
  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const size = parseInt(positionSize) || 0;
  const feeAmount = parseFloat(fee) || 0;
  
  if (entry === 0 || size === 0) {
    return { pnl: 0, stopLoss: 0, rMultiple: 0 };
  }
  
  // Calculate gross P&L
  const grossPnl = direction === 'long'
    ? (exit - entry) * size
    : (entry - exit) * size;
  
  // Calculate net P&L after fees
  const netPnl = grossPnl - feeAmount;
  
  // Calculate stop loss distance
  const stopLoss = Math.abs(entry - exit);
  
  // Calculate R-multiple based on net P&L
  const rMultiple = size > 0 && stopLoss > 0 
    ? (netPnl / (stopLoss * size)) 
    : 0;
  
  return {
    pnl: netPnl,
    stopLoss,
    rMultiple
  };
};