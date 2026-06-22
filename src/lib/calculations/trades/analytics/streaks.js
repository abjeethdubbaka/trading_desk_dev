import { groupByDay, round } from '../shared/helpers.js';

export function calcStreaks(trades = []) {
  if (!trades.length) {
    return { currentStreak: 0, currentType: null, bestWin: 0, bestLoss: 0 };
  }

  const sorted = [...trades].sort(
    (a, b) => new Date(a?.entry_time ?? 0) - new Date(b?.entry_time ?? 0)
  );

  let currentType = null;
  let runWin = 0;
  let runLoss = 0;
  let bestWin = 0;
  let bestLoss = 0;

  for (const trade of sorted) {
    const isWin = (trade?.pnl ?? 0) > 0;
    if (isWin) {
      runWin += 1;
      runLoss = 0;
      if (runWin > bestWin) bestWin = runWin;
    } else {
      runLoss += 1;
      runWin = 0;
      if (runLoss > bestLoss) bestLoss = runLoss;
    }
  }

  const lastTrade = sorted[sorted.length - 1];
  let currentStreak = 0;

  if (lastTrade) {
    currentType = (lastTrade?.pnl ?? 0) > 0 ? 'win' : 'loss';
    currentStreak = currentType === 'win' ? runWin : runLoss;
  }

  return {
    currentStreak,
    currentType,
    bestWin,
    bestLoss,
  };
}

export function getDailySequence(trades = [], n = 20) {
  const groupedByDay = groupByDay(trades);
  const days = Object.keys(groupedByDay).sort().slice(-n);

  return days.map((date) => {
    const pnl = groupedByDay[date].totalPnL;
    const result = pnl > 0 ? 'W' : pnl < 0 ? 'L' : 'B';
    return { date, pnl: round(pnl, 2), result };
  });
}

const TRADING_DAYS_PER_MONTH = 21;

/**
 * Projects a monthly expected return by extrapolating the average daily P&L
 * (over days that actually had trades) across a standard 21 trading-day month.
 */
export function calcMonthlyExpectedReturn(trades = [], accountSize = 0) {
  const groupedByDay = groupByDay(trades);
  const tradingDays = Object.keys(groupedByDay).length;

  if (!tradingDays) {
    return { avgDailyPnL: 0, dollars: 0, percent: 0, tradingDays: 0 };
  }

  const totalPnL = Object.values(groupedByDay).reduce((sum, day) => sum + (day?.totalPnL ?? 0), 0);
  const avgDailyPnL = totalPnL / tradingDays;
  const dollars = avgDailyPnL * TRADING_DAYS_PER_MONTH;
  const percent = accountSize > 0 ? (dollars / accountSize) * 100 : 0;

  return {
    avgDailyPnL: round(avgDailyPnL, 2),
    dollars: round(dollars, 2),
    percent: round(percent, 2),
    tradingDays,
  };
}
