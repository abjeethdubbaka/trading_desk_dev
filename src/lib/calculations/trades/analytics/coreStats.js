import { avg, pct, round, sum } from '../shared/helpers.js';

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

  const wins = trades.filter((trade) => (trade?.pnl ?? 0) > 0);
  const losses = trades.filter((trade) => (trade?.pnl ?? 0) < 0);

  const totalPnL = sum(trades, 'pnl');
  const totalWins = sum(wins, 'pnl');
  const totalLosses = Math.abs(sum(losses, 'pnl'));
  const rValues = trades.map((trade) => trade?.r_multiple).filter((r) => r != null && isFinite(r));

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: pct(wins.length, trades.length),
    totalPnL,
    avgPnL: avg(trades, 'pnl'),
    avgWin: wins.length > 0 ? totalWins / wins.length : 0,
    avgLoss: losses.length > 0 ? totalLosses / losses.length : 0,
    avgR: rValues.length > 0 ? rValues.reduce((acc, r) => acc + r, 0) / rValues.length : 0,
    profitFactor: totalLosses > 0 ? round(totalWins / totalLosses, 2) : totalWins > 0 ? Infinity : 0,
    largestWin: wins.length > 0 ? Math.max(...wins.map((trade) => trade.pnl)) : 0,
    largestLoss: losses.length > 0 ? Math.min(...losses.map((trade) => trade.pnl)) : 0,
    expectancy: trades.length > 0 ? totalPnL / trades.length : 0,
  };
}

export function calcTodayStats(trades = []) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const todayTrades = trades.filter((trade) => {
    const entryDate = new Date(trade?.entry_time ?? trade?.created_at ?? 0);
    return entryDate >= start && entryDate <= end;
  });

  return calcCoreStats(todayTrades);
}
