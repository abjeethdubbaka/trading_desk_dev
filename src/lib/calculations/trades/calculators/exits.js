import { round } from '../shared/helpers.js';

export function calcExitTargets({
  entryPrice,
  direction = 'long',
  stopLossPct = 4,
  riskRewardRatio = 3,
  customStopLoss,
  customTakeProfit,
}) {
  const entry = Number(entryPrice);
  if (!entry || entry <= 0) {
    throw new Error('Entry price must be a positive number');
  }

  let stopLossPrice;
  let takeProfitPrice;

  if (customStopLoss) {
    stopLossPrice = Number(customStopLoss);
    if (direction === 'long' && stopLossPrice >= entry) {
      throw new Error('Stop loss must be below entry price for long positions');
    }
    if (direction === 'short' && stopLossPrice <= entry) {
      throw new Error('Stop loss must be above entry price for short positions');
    }
  } else {
    const stopPct = stopLossPct / 100;
    stopLossPrice = direction === 'long' ? entry * (1 - stopPct) : entry * (1 + stopPct);
  }

  const riskPerShare = Math.abs(entry - stopLossPrice);

  if (customTakeProfit) {
    takeProfitPrice = Number(customTakeProfit);
    if (direction === 'long' && takeProfitPrice <= entry) {
      throw new Error('Take profit must be above entry price for long positions');
    }
    if (direction === 'short' && takeProfitPrice >= entry) {
      throw new Error('Take profit must be below entry price for short positions');
    }
  } else {
    takeProfitPrice =
      direction === 'long'
        ? entry + riskPerShare * riskRewardRatio
        : entry - riskPerShare * riskRewardRatio;
  }

  const rewardPerShare = Math.abs(takeProfitPrice - entry);
  const stopLossPctActual = (riskPerShare / entry) * 100;
  const takeProfitPct = (rewardPerShare / entry) * 100;
  const actualRiskReward = rewardPerShare / riskPerShare;

  return {
    entryPrice: round(entry, 2),
    stopLossPrice: round(stopLossPrice, 2),
    takeProfitPrice: round(takeProfitPrice, 2),
    direction,
    riskPerShare: round(riskPerShare, 2),
    rewardPerShare: round(rewardPerShare, 2),
    stopLossPct: round(stopLossPctActual, 2),
    takeProfitPct: round(takeProfitPct, 2),
    riskRewardRatio: round(actualRiskReward, 2),
    riskAmount: round(riskPerShare, 2),
    profitTarget: round(rewardPerShare, 2),
    calculatedAt: new Date().toLocaleString(),
  };
}
