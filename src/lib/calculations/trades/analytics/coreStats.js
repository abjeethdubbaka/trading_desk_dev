import { pct, round } from '../shared/helpers.js';
import { getTradePnL, getTradeDate } from '../../../utils/tradeFields.js';

function emptyCoreStats() {
  return {
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalPnL: 0,
    avgPnL: 0,
    avgWin: 0,
    avgLoss: 0,
    avgR: 0,
    profitFactor: 0,
    largestWin: 0,
    largestLoss: 0,
    expectancy: 0,
  };
}

export function calcCoreStats(trades = []) {
  if (!trades.length) return emptyCoreStats();

  let totalPnL = 0;
  let wins = 0, losses = 0;
  let totalWinPnL = 0, totalLossPnL = 0;
  let largestWin = 0, largestLoss = 0;
  let rSum = 0, rCount = 0;

  for (const trade of trades) {
    const p = getTradePnL(trade);
    totalPnL += p;

    if (p > 0) {
      wins++;
      totalWinPnL += p;
      if (p > largestWin) largestWin = p;
    } else if (p < 0) {
      losses++;
      totalLossPnL += p;
      if (p < largestLoss) largestLoss = p;
    }

    const r = Number(trade?.r_multiple);
    if (!isNaN(r) && isFinite(r)) {
      rSum += r;
      rCount++;
    }
  }

  const totalTrades = trades.length;
  const totalLossAbs = Math.abs(totalLossPnL);

  return {
    totalTrades,
    wins,
    losses,
    winRate: pct(wins, totalTrades),
    totalPnL,
    avgPnL: totalPnL / totalTrades,
    avgWin: wins > 0 ? totalWinPnL / wins : 0,
    avgLoss: losses > 0 ? totalLossAbs / losses : 0,
    avgR: rCount > 0 ? (rSum / rCount || 0) : 0,
    profitFactor: totalLossAbs > 0 ? round(totalWinPnL / totalLossAbs, 2) : totalWinPnL > 0 ? Infinity : 0,
    largestWin,
    largestLoss,
    expectancy: totalPnL / totalTrades,
  };
}

export function calcTodayStats(trades = []) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const todayTrades = trades.filter((trade) => {
    const d = getTradeDate(trade);
    return d && d >= start && d <= end;
  });

  return calcCoreStats(todayTrades);
}
