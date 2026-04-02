import { average, formatHour, median, pct, round } from '../shared/helpers.js';
import {
  getShareFloatRangeByKey,
  getShareFloatRanges,
  getUnknownShareFloatRange,
  resolveShareFloatRange,
} from '../shared/shareFloat.js';
import { getTradeHoldDurationMinutes } from './holdDuration.js';

function extractFloatCategories(options = null) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) return null;

  if (options.floatCategories && typeof options.floatCategories === 'object') {
    return options.floatCategories;
  }

  const looksLikeFloatCategories = Object.values(options).some((value) => {
    if (!value || typeof value !== 'object') return false;
    return Object.prototype.hasOwnProperty.call(value, 'min') || Object.prototype.hasOwnProperty.call(value, 'max');
  });

  return looksLikeFloatCategories ? options : null;
}

export function perfByDayOfWeek(trades = []) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const groups = Array.from({ length: 7 }, (_, index) => ({
    day: days[index],
    short: short[index],
    totalPnL: 0,
    trades: 0,
    wins: 0,
  }));

  for (const trade of trades) {
    if (!trade?.entry_time) continue;
    const dow = new Date(trade.entry_time).getDay();
    groups[dow].totalPnL += trade?.pnl ?? 0;
    groups[dow].trades += 1;
    if ((trade?.pnl ?? 0) > 0) groups[dow].wins += 1;
  }

  return groups.map((group) => ({
    ...group,
    totalPnL: round(group.totalPnL, 2),
    winRate: pct(group.wins, group.trades),
    avgPnL: group.trades > 0 ? round(group.totalPnL / group.trades, 2) : 0,
  }));
}

export function perfByHourOfDay(trades = []) {
  const groups = Array.from({ length: 24 }, (_, hour24) => ({
    hour24,
    hour: formatHour(hour24),
    totalPnL: 0,
    trades: 0,
    wins: 0,
  }));

  for (const trade of trades) {
    if (!trade?.entry_time) continue;
    const hour24 = new Date(trade.entry_time).getHours();
    groups[hour24].totalPnL += trade?.pnl ?? 0;
    groups[hour24].trades += 1;
    if ((trade?.pnl ?? 0) > 0) groups[hour24].wins += 1;
  }

  return groups.map((group) => ({
    ...group,
    totalPnL: round(group.totalPnL, 2),
    winRate: pct(group.wins, group.trades),
    avgPnL: group.trades > 0 ? round(group.totalPnL / group.trades, 2) : 0,
  }));
}

export function perfBySetupType(trades = []) {
  const groups = {};

  for (const trade of trades) {
    const key = trade?.setup_type || 'Unknown';
    if (!groups[key]) {
      groups[key] = {
        setup: key,
        totalPnL: 0,
        trades: 0,
        wins: 0,
        rSum: 0,
        rCount: 0,
      };
    }

    groups[key].totalPnL += trade?.pnl ?? 0;
    groups[key].trades += 1;
    if ((trade?.pnl ?? 0) > 0) groups[key].wins += 1;

    if (trade?.r_multiple != null) {
      groups[key].rSum += trade.r_multiple;
      groups[key].rCount += 1;
    }
  }

  return Object.values(groups)
    .map((group) => ({
      setup: group.setup,
      totalPnL: round(group.totalPnL, 2),
      trades: group.trades,
      winRate: pct(group.wins, group.trades),
      avgR: group.rCount > 0 ? round(group.rSum / group.rCount, 2) : 0,
      avgPnL: group.trades > 0 ? round(group.totalPnL / group.trades, 2) : 0,
    }))
    .sort((a, b) => b.trades - a.trades);
}

export function perfByPriceRange(trades = []) {
  const ranges = [
    { label: '$0-$2', min: 0, max: 2 },
    { label: '$2-$5', min: 2, max: 5 },
    { label: '$5-$10', min: 5, max: 10 },
    { label: '$10-$20', min: 10, max: 20 },
    { label: '$20-$50', min: 20, max: 50 },
    { label: '$50-$100', min: 50, max: 100 },
    { label: '$100-$200', min: 100, max: 200 },
    { label: '$200+', min: 200, max: Infinity },
  ];

  const groups = ranges.map((range) => ({
    ...range,
    range: range.label,
    totalPnL: 0,
    trades: 0,
    wins: 0,
  }));

  for (const trade of trades) {
    const entryPrice = trade?.entry_price ?? 0;
    const group = groups.find((candidate) => entryPrice >= candidate.min && entryPrice < candidate.max);
    if (!group) continue;

    group.totalPnL += trade?.pnl ?? 0;
    group.trades += 1;
    if ((trade?.pnl ?? 0) > 0) group.wins += 1;
  }

  return groups.map((group) => ({
    range: group.range,
    totalPnL: round(group.totalPnL, 2),
    trades: group.trades,
    winRate: pct(group.wins, group.trades),
    avgPnL: group.trades > 0 ? round(group.totalPnL / group.trades, 2) : 0,
  }));
}

export function perfByShareFloatRange(trades = [], options = null) {
  const floatCategories = extractFloatCategories(options);
  const shareFloatRanges = getShareFloatRanges(floatCategories);
  const unknownRange = getUnknownShareFloatRange();
  const groups = new Map();

  shareFloatRanges.forEach((range) => {
    groups.set(range.key, {
      key: range.key,
      range: range.label,
      trades: 0,
      winners: 0,
      losses: 0,
      totalPnL: 0,
      pnlValues: [],
    });
  });

  groups.set(unknownRange.key, {
    key: unknownRange.key,
    range: unknownRange.label,
    trades: 0,
    winners: 0,
    losses: 0,
    totalPnL: 0,
    pnlValues: [],
  });

  for (const trade of trades) {
    const range = resolveShareFloatRange(
      trade?.share_float,
      trade?.float_category,
      trade?.share_float_range,
      floatCategories
    );
    const bucket = groups.get(range.key) || groups.get(unknownRange.key);
    if (!bucket) continue;

    const pnl = Number(trade?.pnl ?? 0);
    bucket.totalPnL += pnl;
    bucket.trades += 1;
    bucket.pnlValues.push(pnl);
    if (pnl > 0) bucket.winners += 1;
    if (pnl < 0) bucket.losses += 1;
  }

  const orderedKeys = [...shareFloatRanges.map((range) => range.key), unknownRange.key];

  return orderedKeys
    .map((key) => groups.get(key))
    .filter(Boolean)
    .map((bucket) => ({
      key: bucket.key,
      range: bucket.range,
      trades: bucket.trades,
      winners: bucket.winners,
      losses: bucket.losses,
      winRate: pct(bucket.winners, bucket.trades),
      totalPnL: round(bucket.totalPnL, 2),
      avgPnL: bucket.trades > 0 ? round(bucket.totalPnL / bucket.trades, 2) : 0,
      medianPnL: bucket.pnlValues.length > 0 ? round(median(bucket.pnlValues), 2) : 0,
    }))
    .filter((bucket) => bucket.trades > 0);
}

export function perfBySetupTimeFloatHeatmap(trades = [], options = {}) {
  const setupLimit = Math.max(3, Math.min(14, Math.round(Number(options?.setupLimit) || 8)));
  const hourLimit = Math.max(4, Math.min(24, Math.round(Number(options?.hourLimit) || 8)));
  const includeUnknownFloat = options?.includeUnknownFloat ?? true;
  const floatCategories = extractFloatCategories(options);

  const shareFloatRanges = getShareFloatRanges(floatCategories);
  const unknownRange = getUnknownShareFloatRange();
  const rangeByKey = getShareFloatRangeByKey(floatCategories);

  const preparedTrades = [];
  const setupCounts = new Map();
  const hourCounts = new Map();

  for (const trade of trades) {
    if (!trade?.entry_time) continue;
    const entryDate = new Date(trade.entry_time);
    if (!Number.isFinite(entryDate.getTime())) continue;

    const setup = String(trade?.setup_type || 'Unknown').trim() || 'Unknown';
    const hour24 = entryDate.getHours();
    const pnl = Number(trade?.pnl ?? 0);
    const numericPnL = Number.isFinite(pnl) ? pnl : 0;
    const floatRange = resolveShareFloatRange(
      trade?.share_float,
      trade?.float_category,
      trade?.share_float_range,
      floatCategories
    );

    preparedTrades.push({
      setup,
      hour24,
      hour: formatHour(hour24),
      floatKey: floatRange.key,
      floatRange: floatRange.label,
      pnl: numericPnL,
    });

    setupCounts.set(setup, (setupCounts.get(setup) || 0) + 1);
    hourCounts.set(hour24, (hourCounts.get(hour24) || 0) + 1);
  }

  if (preparedTrades.length === 0) {
    return {
      setups: [],
      hours: [],
      floatRanges: [],
      cells: [],
      maxAbsAvgPnL: 1,
      maxTrades: 1,
      topCombos: [],
    };
  }

  const selectedSetups = [...setupCounts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, setupLimit)
    .map(([setup]) => setup);

  const selectedSetupSet = new Set(selectedSetups);
  const candidateHourCounts = new Map();
  for (const trade of preparedTrades) {
    if (!selectedSetupSet.has(trade.setup)) continue;
    candidateHourCounts.set(trade.hour24, (candidateHourCounts.get(trade.hour24) || 0) + 1);
  }

  const selectedHours = [...candidateHourCounts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0] - b[0];
    })
    .slice(0, hourLimit)
    .map(([hour]) => hour)
    .sort((a, b) => a - b);

  const selectedHourSet = new Set(selectedHours);
  const orderedFloatKeys = [
    ...shareFloatRanges.map((range) => range.key),
    ...(includeUnknownFloat ? [unknownRange.key] : []),
  ];
  const allowedFloatKeys = new Set(orderedFloatKeys);

  const floatStats = new Map();
  orderedFloatKeys.forEach((floatKey) => {
    const definition = rangeByKey[floatKey] || unknownRange;
    floatStats.set(floatKey, {
      key: floatKey,
      label: definition.label,
      trades: 0,
      winners: 0,
      totalPnL: 0,
    });
  });

  const cellMap = new Map();
  for (const trade of preparedTrades) {
    if (!selectedSetupSet.has(trade.setup)) continue;
    if (!selectedHourSet.has(trade.hour24)) continue;
    if (!allowedFloatKeys.has(trade.floatKey)) continue;

    const floatStat = floatStats.get(trade.floatKey);
    if (floatStat) {
      floatStat.trades += 1;
      floatStat.totalPnL += trade.pnl;
      if (trade.pnl > 0) floatStat.winners += 1;
    }

    const cellKey = `${trade.setup}|${trade.hour24}|${trade.floatKey}`;
    if (!cellMap.has(cellKey)) {
      cellMap.set(cellKey, {
        setup: trade.setup,
        hour24: trade.hour24,
        hour: trade.hour,
        floatKey: trade.floatKey,
        floatRange: trade.floatRange,
        trades: 0,
        winners: 0,
        losses: 0,
        totalPnL: 0,
      });
    }

    const cell = cellMap.get(cellKey);
    if (!cell) continue;
    cell.trades += 1;
    cell.totalPnL += trade.pnl;
    if (trade.pnl > 0) cell.winners += 1;
    if (trade.pnl < 0) cell.losses += 1;
  }

  const cells = [...cellMap.values()].map((cell) => ({
    ...cell,
    winRate: pct(cell.winners, cell.trades),
    totalPnL: round(cell.totalPnL, 2),
    avgPnL: cell.trades > 0 ? round(cell.totalPnL / cell.trades, 2) : 0,
  }));

  if (cells.length === 0) {
    return {
      setups: [],
      hours: [],
      floatRanges: [],
      cells: [],
      maxAbsAvgPnL: 1,
      maxTrades: 1,
      topCombos: [],
    };
  }

  const activeSetupSet = new Set(cells.map((cell) => cell.setup));
  const activeHourSet = new Set(cells.map((cell) => cell.hour24));
  const activeFloatSet = new Set(cells.map((cell) => cell.floatKey));

  const setups = selectedSetups.filter((setup) => activeSetupSet.has(setup));
  const hours = selectedHours
    .filter((hour24) => activeHourSet.has(hour24))
    .map((hour24) => ({
      hour24,
      hour: formatHour(hour24),
      trades: candidateHourCounts.get(hour24) || hourCounts.get(hour24) || 0,
    }));

  const floatRanges = orderedFloatKeys
    .filter((floatKey) => activeFloatSet.has(floatKey))
    .map((floatKey) => {
      const stat = floatStats.get(floatKey);
      if (!stat) return null;
      return {
        key: stat.key,
        label: stat.label,
        trades: stat.trades,
        totalPnL: round(stat.totalPnL, 2),
        winRate: pct(stat.winners, stat.trades),
      };
    })
    .filter(Boolean);

  const maxAbsAvgPnL = Math.max(...cells.map((cell) => Math.abs(cell.avgPnL || 0)), 1);
  const maxTrades = Math.max(...cells.map((cell) => cell.trades || 0), 1);
  const topCombos = [...cells]
    .sort((a, b) => {
      if (b.totalPnL !== a.totalPnL) return b.totalPnL - a.totalPnL;
      if (b.avgPnL !== a.avgPnL) return b.avgPnL - a.avgPnL;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.trades - a.trades;
    })
    .slice(0, 8);

  return {
    setups,
    hours,
    floatRanges,
    cells,
    maxAbsAvgPnL,
    maxTrades,
    topCombos,
  };
}

export function perfByHoldDurationBuckets(trades = [], bucketMinutes = 5) {
  const step = Math.max(1, Math.round(Number(bucketMinutes) || 5));
  const groups = new Map();

  for (const trade of trades) {
    const holdMinutes = getTradeHoldDurationMinutes(trade);
    if (!Number.isFinite(holdMinutes) || holdMinutes < 0) continue;

    const bucketStart = Math.floor(holdMinutes / step) * step;
    const bucketEnd = bucketStart + step - 1;
    const key = String(bucketStart);

    if (!groups.has(key)) {
      groups.set(key, {
        label: `${bucketStart}-${bucketEnd}m`,
        bucketStart,
        bucketEnd,
        trades: 0,
        winners: 0,
        losses: 0,
        totalPnL: 0,
        pnlValues: [],
        holdValues: [],
      });
    }

    const bucket = groups.get(key);
    if (!bucket) continue;

    const pnl = Number(trade?.pnl ?? 0);
    bucket.trades += 1;
    bucket.totalPnL += pnl;
    bucket.pnlValues.push(pnl);
    bucket.holdValues.push(holdMinutes);
    if (pnl > 0) bucket.winners += 1;
    if (pnl < 0) bucket.losses += 1;
  }

  return [...groups.values()]
    .sort((a, b) => a.bucketStart - b.bucketStart)
    .map((bucket) => ({
      label: bucket.label,
      bucketStart: bucket.bucketStart,
      bucketEnd: bucket.bucketEnd,
      trades: bucket.trades,
      winners: bucket.winners,
      losses: bucket.losses,
      winRate: pct(bucket.winners, bucket.trades),
      totalPnL: round(bucket.totalPnL, 2),
      avgPnL: bucket.trades > 0 ? round(bucket.totalPnL / bucket.trades, 2) : 0,
      medianPnL: bucket.pnlValues.length > 0 ? round(median(bucket.pnlValues), 2) : 0,
      avgHoldMinutes: round(average(bucket.holdValues), 1),
    }));
}
