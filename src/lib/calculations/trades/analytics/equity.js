import { formatChartDate, groupByDay, round } from '../shared/helpers.js';

export function buildEquityCurve(trades = [], initialBalance = 50000) {
  if (!trades.length) return [{ date: 'Start', balance: initialBalance, pnl: 0, trade: 0 }];

  const sorted = [...trades]
    .filter((trade) => trade?.entry_time)
    .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));

  let balance = initialBalance;
  const points = sorted.map((trade, index) => {
    balance += trade?.pnl ?? 0;
    return {
      date: formatChartDate(trade.entry_time),
      balance: round(balance, 2),
      pnl: trade?.pnl ?? 0,
      trade: index + 1,
    };
  });

  return [{ date: 'Start', balance: initialBalance, pnl: 0, trade: 0 }, ...points];
}

export function calcMaxDrawdown(curve = []) {
  if (curve.length < 2) return 0;

  let peak = curve[0].balance;
  let maxDrawdown = 0;

  for (const point of curve) {
    if (point.balance > peak) peak = point.balance;
    const drawdown = point.balance - peak;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  }

  return round(maxDrawdown, 2);
}

export function calcDrawdownSeries(curve = []) {
  let peak = curve[0]?.balance ?? 0;

  return curve.map((point) => {
    if (point.balance > peak) peak = point.balance;
    const drawdown = point.balance - peak;
    const drawdownPct = peak > 0 ? (drawdown / peak) * 100 : 0;
    return {
      date: point.date,
      drawdown: round(drawdown, 2),
      drawdownPct: round(drawdownPct, 2),
    };
  });
}

export function calcSharpeRatio(trades = []) {
  const dailyPnL = groupByDay(trades);
  const values = Object.values(dailyPnL).map((day) => day.totalPnL);

  if (values.length < 2) return 0;

  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / values.length
  );

  if (stdDev === 0) return 0;

  return round((mean / stdDev) * Math.sqrt(252), 2);
}
