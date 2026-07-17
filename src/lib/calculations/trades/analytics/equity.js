import { formatChartDate, groupByDay, round } from '../shared/helpers.js';

export function buildEquityCurve(trades = [], initialBalance = 50000) {
  if (!trades.length) return [{ date: 'Start', balance: initialBalance, pnl: 0, trade: 0, peak: initialBalance, drawdownPct: 0, drawdownAbs: 0 }];

  // P&L is realised at exit — sort by exit_time, fall back to entry_time
  const sorted = [...trades]
    .filter((t) => t?.entry_time || t?.exit_time)
    .sort((a, b) => {
      const ta = new Date(a.exit_time || a.entry_time).getTime();
      const tb = new Date(b.exit_time || b.entry_time).getTime();
      return ta - tb;
    });

  let balance = initialBalance;
  let peak = initialBalance;
  const points = sorted.map((trade, index) => {
    const pnl = trade?.pnl ?? 0;
    balance = round(balance + pnl, 2);
    if (balance > peak) peak = balance;
    const drawdownAbs = round(balance - peak, 2);
    const drawdownPct = peak > 0 ? round((drawdownAbs / peak) * 100, 2) : 0;
    // Use exit_time date label when available
    const dateLabel = formatChartDate(trade.exit_time || trade.entry_time);
    return {
      date: dateLabel,
      balance,
      pnl,
      trade: index + 1,
      peak: round(peak, 2),
      drawdownAbs,
      drawdownPct,
      symbol: trade.symbol ?? null,
      direction: trade.direction ?? null,
      rMultiple: trade.r_multiple ?? null,
    };
  });

  return [
    { date: 'Start', balance: initialBalance, pnl: 0, trade: 0, peak: initialBalance, drawdownAbs: 0, drawdownPct: 0, symbol: null, direction: null, rMultiple: null },
    ...points,
  ];
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
