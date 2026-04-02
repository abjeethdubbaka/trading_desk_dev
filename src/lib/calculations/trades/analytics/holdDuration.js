import { average, median, round } from '../shared/helpers.js';

export function getTradeHoldDurationMinutes(trade) {
  const storedDuration = Number(trade?.hold_duration_minutes);
  if (Number.isFinite(storedDuration) && storedDuration >= 0) {
    return storedDuration;
  }

  if (!trade?.entry_time || !trade?.exit_time) return null;

  const entryTimeMs = new Date(trade.entry_time).getTime();
  const exitTimeMs = new Date(trade.exit_time).getTime();

  if (!Number.isFinite(entryTimeMs) || !Number.isFinite(exitTimeMs)) return null;
  if (exitTimeMs < entryTimeMs) return null;

  return Math.round((exitTimeMs - entryTimeMs) / 60000);
}

export function formatHoldDuration(minutes) {
  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes) || numericMinutes < 0) return '--';

  const totalMinutes = Math.round(numericMinutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours <= 0) return `${totalMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function calcHoldTimeStats(trades = []) {
  const durations = trades
    .map((trade) => ({
      pnl: Number(trade?.pnl ?? 0),
      minutes: getTradeHoldDurationMinutes(trade),
    }))
    .filter((trade) => Number.isFinite(trade.minutes) && trade.minutes >= 0);

  if (durations.length === 0) {
    return {
      closedTrades: 0,
      avgMinutes: 0,
      medianMinutes: 0,
      shortestMinutes: null,
      longestMinutes: null,
      avgWinningMinutes: null,
      avgLosingMinutes: null,
    };
  }

  const minuteValues = durations.map((trade) => trade.minutes);
  const sortedDurations = [...minuteValues].sort((a, b) => a - b);
  const winningDurations = durations.filter((trade) => trade.pnl > 0).map((trade) => trade.minutes);
  const losingDurations = durations.filter((trade) => trade.pnl < 0).map((trade) => trade.minutes);

  return {
    closedTrades: durations.length,
    avgMinutes: round(average(minuteValues), 1),
    medianMinutes: round(median(sortedDurations), 1),
    shortestMinutes: sortedDurations[0] ?? null,
    longestMinutes: sortedDurations[sortedDurations.length - 1] ?? null,
    avgWinningMinutes: winningDurations.length > 0 ? round(average(winningDurations), 1) : null,
    avgLosingMinutes: losingDurations.length > 0 ? round(average(losingDurations), 1) : null,
  };
}
