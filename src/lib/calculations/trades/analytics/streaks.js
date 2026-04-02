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
