export function sum(arr, field) {
  return arr.reduce((total, item) => total + (item?.[field] ?? 0), 0);
}

export function avg(arr, field) {
  if (!arr.length) return 0;
  return sum(arr, field) / arr.length;
}

export function average(values) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[midpoint - 1] + sorted[midpoint]) / 2;
  }
  return sorted[midpoint];
}

export function pct(num, denom) {
  return denom > 0 ? round((num / denom) * 100, 1) : 0;
}

export function round(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatHour(hour24) {
  if (hour24 === 0) return '12 AM';
  if (hour24 < 12) return `${hour24} AM`;
  if (hour24 === 12) return '12 PM';
  return `${hour24 - 12} PM`;
}

export function formatChartDate(isoDateString) {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function groupByDay(trades = []) {
  const grouped = {};
  for (const trade of trades) {
    if (!trade?.entry_time) continue;
    const key = new Date(trade.entry_time).toISOString().slice(0, 10);
    if (!grouped[key]) grouped[key] = { totalPnL: 0, trades: 0 };
    grouped[key].totalPnL += trade?.pnl ?? 0;
    grouped[key].trades += 1;
  }
  return grouped;
}
