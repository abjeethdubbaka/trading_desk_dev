/**
 * @file src/lib/calculations/trades.js
 *
 * Pure functions for all trade analytics.
 * No side effects, no external dependencies, no React.
 * Input: array of trade objects. Output: numbers, arrays, plain objects.
 *
 * All functions are safe with empty arrays — never throw, never return NaN.
 * Components memoize these with useMemo() — don't call them inside render loops.
 */

// ---------------------------------------------------------------------------
// Core stats — the numbers every page needs
// ---------------------------------------------------------------------------

/**
 * Compute aggregate stats across a trade array.
 *
 * @param {object[]} trades
 * @returns {CoreStats}
 */
export function calcCoreStats(trades = []) {
  if (!trades.length) return emptyCoreStats();

  const wins   = trades.filter(t => (t.pnl ?? 0) > 0);
  const losses = trades.filter(t => (t.pnl ?? 0) < 0);

  const totalPnL    = sum(trades, 'pnl');
  const totalWins   = sum(wins,   'pnl');
  const totalLosses = Math.abs(sum(losses, 'pnl'));

  const rValues = trades.map(t => t.r_multiple).filter(r => r != null && isFinite(r));

  return {
    totalTrades:   trades.length,
    wins:          wins.length,
    losses:        losses.length,
    winRate:       pct(wins.length, trades.length),
    totalPnL,
    avgPnL:        avg(trades, 'pnl'),
    avgWin:        wins.length   > 0 ? totalWins   / wins.length   : 0,
    avgLoss:       losses.length > 0 ? totalLosses / losses.length : 0,
    avgR:          rValues.length > 0 ? rValues.reduce((s, r) => s + r, 0) / rValues.length : 0,
    profitFactor:  totalLosses > 0 ? round(totalWins / totalLosses, 2)
                 : totalWins   > 0 ? Infinity : 0,
    largestWin:    wins.length   > 0 ? Math.max(...wins.map(t => t.pnl))   : 0,
    largestLoss:   losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0,
    expectancy:    trades.length > 0 ? totalPnL / trades.length : 0,
  };
}

function emptyCoreStats() {
  return {
    totalTrades: 0, wins: 0, losses: 0, winRate: 0,
    totalPnL: 0, avgPnL: 0, avgWin: 0, avgLoss: 0,
    avgR: 0, profitFactor: 0, largestWin: 0, largestLoss: 0, expectancy: 0,
  };
}

// ---------------------------------------------------------------------------
// Today's stats
// ---------------------------------------------------------------------------

/**
 * Stats for trades entered today (local time).
 *
 * @param {object[]} trades
 * @returns {CoreStats}
 */
export function calcTodayStats(trades = []) {
  const now   = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end   = new Date(now); end.setHours(23, 59, 59, 999);

  const today = trades.filter(t => {
    const d = new Date(t.entry_time ?? t.created_at ?? 0);
    return d >= start && d <= end;
  });

  return calcCoreStats(today);
}

// ---------------------------------------------------------------------------
// Equity curve — for the performance chart
// ---------------------------------------------------------------------------

/**
 * Builds a cumulative equity curve sorted by entry_time.
 * Each point represents the account value after each trade.
 *
 * @param {object[]} trades
 * @param {number}   initialBalance
 * @returns {Array<{ date: string, balance: number, pnl: number, trade: number }>}
 */
export function buildEquityCurve(trades = [], initialBalance = 50000) {
  if (!trades.length) return [{ date: 'Start', balance: initialBalance, pnl: 0, trade: 0 }];

  const sorted = [...trades]
    .filter(t => t.entry_time)
    .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));

  let balance = initialBalance;

  const points = sorted.map((t, i) => {
    balance += (t.pnl ?? 0);
    return {
      date:    formatChartDate(t.entry_time),
      balance: round(balance, 2),
      pnl:     t.pnl ?? 0,
      trade:   i + 1,
    };
  });

  return [
    { date: 'Start', balance: initialBalance, pnl: 0, trade: 0 },
    ...points,
  ];
}

// ---------------------------------------------------------------------------
// Drawdown
// ---------------------------------------------------------------------------

/**
 * Maximum drawdown from peak to trough in the equity curve.
 * Returns the dollar amount of the deepest drawdown (negative number).
 *
 * @param {Array<{ balance: number }>} curve  output of buildEquityCurve()
 * @returns {number}  0 or negative
 */
export function calcMaxDrawdown(curve = []) {
  if (curve.length < 2) return 0;

  let peak       = curve[0].balance;
  let maxDD      = 0;

  for (const point of curve) {
    if (point.balance > peak) peak = point.balance;
    const dd = point.balance - peak;
    if (dd < maxDD) maxDD = dd;
  }

  return round(maxDD, 2);
}

/**
 * Drawdown series — the drawdown at each point in the curve.
 * Useful for overlaying on the equity chart.
 *
 * @param {Array<{ balance: number, date: string }>} curve
 * @returns {Array<{ date: string, drawdown: number, drawdownPct: number }>}
 */
export function calcDrawdownSeries(curve = []) {
  let peak = curve[0]?.balance ?? 0;

  return curve.map(point => {
    if (point.balance > peak) peak = point.balance;
    const dd    = point.balance - peak;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    return {
      date:        point.date,
      drawdown:    round(dd, 2),
      drawdownPct: round(ddPct, 2),
    };
  });
}

// ---------------------------------------------------------------------------
// Sharpe ratio
// ---------------------------------------------------------------------------

/**
 * Annualized Sharpe ratio based on daily P&L.
 * Uses 252 trading days per year. Risk-free rate treated as 0.
 *
 * @param {object[]} trades
 * @returns {number}
 */
export function calcSharpeRatio(trades = []) {
  const dailyPnL = groupByDay(trades);
  const values   = Object.values(dailyPnL).map(d => d.totalPnL);

  if (values.length < 2) return 0;

  const mean   = values.reduce((s, v) => s + v, 0) / values.length;
  const stddev = Math.sqrt(
    values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
  );

  if (stddev === 0) return 0;

  return round((mean / stddev) * Math.sqrt(252), 2);
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

/**
 * Calculate win/loss streak info.
 *
 * @param {object[]} trades  sorted by entry_time ascending
 * @returns {{ currentStreak: number, currentType: 'win'|'loss'|null, bestWin: number, bestLoss: number }}
 */
export function calcStreaks(trades = []) {
  if (!trades.length) return { currentStreak: 0, currentType: null, bestWin: 0, bestLoss: 0 };

  const sorted = [...trades].sort(
    (a, b) => new Date(a.entry_time ?? 0) - new Date(b.entry_time ?? 0)
  );

  let current     = 0;
  let currentType = null;
  let bestWin     = 0;
  let bestLoss    = 0;
  let runWin      = 0;
  let runLoss     = 0;

  for (const t of sorted) {
    const isWin = (t.pnl ?? 0) > 0;

    if (isWin) {
      runWin++;
      runLoss = 0;
      if (runWin > bestWin) bestWin = runWin;
    } else {
      runLoss++;
      runWin = 0;
      if (runLoss > bestLoss) bestLoss = runLoss;
    }
  }

  // Current streak is the last run
  const last = sorted[sorted.length - 1];
  if (last) {
    currentType   = (last.pnl ?? 0) > 0 ? 'win' : 'loss';
    current       = currentType === 'win' ? runWin : runLoss;
  }

  return {
    currentStreak: current,
    currentType,
    bestWin,
    bestLoss,
  };
}

// ---------------------------------------------------------------------------
// Daily sequence — for the StreakTracker component
// ---------------------------------------------------------------------------

/**
 * Returns the last N trading days as an array of { date, pnl, result } objects.
 * 'W' = profit day, 'L' = loss day, 'B' = breakeven/no trades.
 *
 * @param {object[]} trades
 * @param {number}   n        how many days to return
 * @returns {Array<{ date: string, pnl: number, result: 'W'|'L'|'B' }>}
 */
export function getDailySequence(trades = [], n = 20) {
  const byDay = groupByDay(trades);
  const days  = Object.keys(byDay).sort().slice(-n);

  return days.map(date => {
    const pnl    = byDay[date].totalPnL;
    const result = pnl > 0 ? 'W' : pnl < 0 ? 'L' : 'B';
    return { date, pnl: round(pnl, 2), result };
  });
}

// ---------------------------------------------------------------------------
// Breakdown analytics — for Performance page
// ---------------------------------------------------------------------------

/**
 * P&L grouped by day of week.
 *
 * @param {object[]} trades
 * @returns {Array<{ day: string, short: string, totalPnL: number, trades: number, winRate: number }>}
 */
export function perfByDayOfWeek(trades = []) {
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const groups = Array.from({ length: 7 }, (_, i) => ({
    day:       DAYS[i],
    short:     SHORT[i],
    totalPnL:  0,
    trades:    0,
    wins:      0,
  }));

  for (const t of trades) {
    if (!t.entry_time) continue;
    const dow = new Date(t.entry_time).getDay();
    groups[dow].totalPnL += t.pnl ?? 0;
    groups[dow].trades++;
    if ((t.pnl ?? 0) > 0) groups[dow].wins++;
  }

  return groups.map(g => ({
    ...g,
    totalPnL: round(g.totalPnL, 2),
    winRate:  pct(g.wins, g.trades),
    avgPnL:   g.trades > 0 ? round(g.totalPnL / g.trades, 2) : 0,
  }));
}

/**
 * P&L grouped by hour of day (0–23).
 *
 * @param {object[]} trades
 * @returns {Array<{ hour: string, hour24: number, totalPnL: number, trades: number, winRate: number }>}
 */
export function perfByHourOfDay(trades = []) {
  const groups = Array.from({ length: 24 }, (_, i) => ({
    hour24:   i,
    hour:     formatHour(i),
    totalPnL:  0,
    trades:   0,
    wins:     0,
  }));

  for (const t of trades) {
    if (!t.entry_time) continue;
    const h = new Date(t.entry_time).getHours();
    groups[h].totalPnL += t.pnl ?? 0;
    groups[h].trades++;
    if ((t.pnl ?? 0) > 0) groups[h].wins++;
  }

  return groups.map(g => ({
    ...g,
    totalPnL: round(g.totalPnL, 2),
    winRate:  pct(g.wins, g.trades),
    avgPnL:   g.trades > 0 ? round(g.totalPnL / g.trades, 2) : 0,
  }));
}

/**
 * P&L grouped by setup type.
 *
 * @param {object[]} trades
 * @returns {Array<{ setup: string, totalPnL: number, trades: number, winRate: number, avgR: number }>}
 */
export function perfBySetupType(trades = []) {
  const groups = {};

  for (const t of trades) {
    const key = t.setup_type || 'Unknown';
    if (!groups[key]) {
      groups[key] = { setup: key, totalPnL: 0, trades: 0, wins: 0, rSum: 0, rCount: 0 };
    }
    groups[key].totalPnL += t.pnl ?? 0;
    groups[key].trades++;
    if ((t.pnl ?? 0) > 0) groups[key].wins++;
    if (t.r_multiple != null) { groups[key].rSum += t.r_multiple; groups[key].rCount++; }
  }

  return Object.values(groups)
    .map(g => ({
      setup:    g.setup,
      totalPnL: round(g.totalPnL, 2),
      trades:   g.trades,
      winRate:  pct(g.wins, g.trades),
      avgR:     g.rCount > 0 ? round(g.rSum / g.rCount, 2) : 0,
      avgPnL:   g.trades > 0 ? round(g.totalPnL / g.trades, 2) : 0,
    }))
    .sort((a, b) => b.trades - a.trades);
}

/**
 * P&L grouped by entry price range.
 *
 * @param {object[]} trades
 * @returns {Array<{ range: string, totalPnL: number, trades: number, winRate: number }>}
 */
export function perfByPriceRange(trades = []) {
  const RANGES = [
    { label: '$0–$2',      min: 0,   max: 2    },
    { label: '$2–$5',      min: 2,   max: 5    },
    { label: '$5–$10',     min: 5,   max: 10   },
    { label: '$10–$20',    min: 10,  max: 20   },
    { label: '$20–$50',    min: 20,  max: 50   },
    { label: '$50–$100',   min: 50,  max: 100  },
    { label: '$100–$200',  min: 100, max: 200  },
    { label: '$200+',      min: 200, max: Infinity },
  ];

  const groups = RANGES.map(r => ({ ...r, range: r.label, totalPnL: 0, trades: 0, wins: 0 }));

  for (const t of trades) {
    const price = t.entry_price ?? 0;
    const g     = groups.find(r => price >= r.min && price < r.max);
    if (!g) continue;
    g.totalPnL += t.pnl ?? 0;
    g.trades++;
    if ((t.pnl ?? 0) > 0) g.wins++;
  }

  return groups.map(g => ({
    range:    g.range,
    totalPnL: round(g.totalPnL, 2),
    trades:   g.trades,
    winRate:  pct(g.wins, g.trades),
    avgPnL:   g.trades > 0 ? round(g.totalPnL / g.trades, 2) : 0,
  }));
}

// ---------------------------------------------------------------------------
// Emotion analysis
// ---------------------------------------------------------------------------

/**
 * Compute emotion-based statistics from trade data.
 * Analyzes how different emotions affect trading performance.
 *
 * @param {object[]} trades
 * @returns {Array<{ emotion: string, count: number, winRate: number, avgPnL: number, totalPnL: number, avgR: number }>}
 */
export function computeEmotionStats(trades = []) {
  const order = ['confident', 'disciplined', 'neutral', 'nervous', 'fomo', 'revenge'];
  const groups = {};
  
  trades.forEach(t => {
    // Handle emotions as array or string
    let emotion = 'neutral';
    if (t.emotions) {
      if (Array.isArray(t.emotions)) {
        emotion = t.emotions[0] || 'neutral';
      } else {
        emotion = t.emotions;
      }
    }
    emotion = emotion.toLowerCase();
    
    if (!groups[emotion]) {
      groups[emotion] = { trades: [], pnl: 0, wins: 0 };
    }
    groups[emotion].trades.push(t);
    groups[emotion].pnl += (t.pnl || 0);
    if ((t.pnl || 0) > 0) groups[emotion].wins++;
  });
  
  return order.filter(emotion => groups[emotion]).map(emotion => {
    const group = groups[emotion];
    const count = group.trades.length;
    const tradesWithR = group.trades.filter(t => t.r_multiple != null);
    const avgR = tradesWithR.length ? 
      tradesWithR.reduce((s, t) => s + (parseFloat(t.r_multiple) || 0), 0) / tradesWithR.length : 
      0;
    
    return {
      emotion,
      count,
      winRate: count ? (group.wins / count) * 100 : 0,
      avgPnL: count ? group.pnl / count : 0,
      totalPnL: group.pnl,
      avgR: round(avgR, 2)
    };
  });
}

/**
 * Compute plan adherence statistics.
 * Compares performance between trades that followed the plan vs those that didn't.
 *
 * @param {object[]} trades
 * @returns {{ followed: CoreStats, deviated: CoreStats }}
 */
export function computePlanAdherence(trades = []) {
  const followed = trades.filter(t => 
    t.followed_plan === true || t.followed_plan === 'true'
  );
  const deviated = trades.filter(t => 
    t.followed_plan === false || t.followed_plan === 'false'
  );
  
  return {
    followed: {
      trades: followed,
      ...calcCoreStats(followed)
    },
    deviated: {
      trades: deviated,
      ...calcCoreStats(deviated)
    }
  };
}

// ---------------------------------------------------------------------------
// Exit targets calculator
// ---------------------------------------------------------------------------

/**
 * Calculate exit targets (stop loss and take profit prices) for a trade.
 * 
 * @param {object} params
 * @param {number} params.entryPrice - Entry price
 * @param {'long'|'short'} params.direction - Trade direction
 * @param {number} params.stopLossPct - Stop loss percentage (default 4%)
 * @param {number} params.riskRewardRatio - Risk/reward ratio (default 3:1)
 * @param {number} params.customStopLoss - Custom stop loss price (optional)
 * @param {number} params.customTakeProfit - Custom take profit price (optional)
 * @returns {object} Exit targets with prices and risk information
 */
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

  let stopLossPrice, takeProfitPrice, riskPerShare, rewardPerShare;

  // Calculate stop loss
  if (customStopLoss) {
    stopLossPrice = Number(customStopLoss);
    if (direction === 'long' && stopLossPrice >= entry) {
      throw new Error('Stop loss must be below entry price for long positions');
    }
    if (direction === 'short' && stopLossPrice <= entry) {
      throw new Error('Stop loss must be above entry price for short positions');
    }
  } else {
    const pct = stopLossPct / 100;
    stopLossPrice = direction === 'long' 
      ? entry * (1 - pct) 
      : entry * (1 + pct);
  }

  // Calculate risk per share
  riskPerShare = Math.abs(entry - stopLossPrice);

  // Calculate take profit
  if (customTakeProfit) {
    takeProfitPrice = Number(customTakeProfit);
    if (direction === 'long' && takeProfitPrice <= entry) {
      throw new Error('Take profit must be above entry price for long positions');
    }
    if (direction === 'short' && takeProfitPrice >= entry) {
      throw new Error('Take profit must be below entry price for short positions');
    }
  } else {
    takeProfitPrice = direction === 'long'
      ? entry + (riskPerShare * riskRewardRatio)
      : entry - (riskPerShare * riskRewardRatio);
  }

  // Calculate reward per share
  rewardPerShare = Math.abs(takeProfitPrice - entry);

  // Calculate percentages
  const stopLossPctActual = (riskPerShare / entry) * 100;
  const takeProfitPct = (rewardPerShare / entry) * 100;
  const actualRiskReward = rewardPerShare / riskPerShare;

  return {
    entryPrice: round(entry, 2),
    stopLossPrice: round(stopLossPrice, 2),
    takeProfitPrice: round(takeProfitPrice, 2),
    direction,
    
    // Risk metrics
    riskPerShare: round(riskPerShare, 2),
    rewardPerShare: round(rewardPerShare, 2),
    stopLossPct: round(stopLossPctActual, 2),
    takeProfitPct: round(takeProfitPct, 2),
    riskRewardRatio: round(actualRiskReward, 2),
    
    // Price levels
    riskAmount: round(riskPerShare, 2),
    profitTarget: round(rewardPerShare, 2),
    
    // Metadata
    calculatedAt: new Date().toLocaleString(),
  };
}

// ---------------------------------------------------------------------------
// Position calculator helper
// ---------------------------------------------------------------------------

/**
 * Calculates position size and related values.
 * Used by FloatPositionSizer — centralized here so UI math stays in one place.
 *
 * @param {object} params
 * @returns {CalcResult}
 */
export function calcPosition({
  entryPrice,
  direction       = 'long',
  accountSize     = 50000,
  positionPct     = 1,
  stopPct         = 4,
  stopLossPrice,
  riskAmount,
  shareFloat,
  floatCategory,
  floatCategories = {},
  maxDollars      = 0,
  targetProfitDollars = 500,
  riskRewardRatio = 3,
}) {
  const entry = Number(entryPrice);
  const acct = Number(accountSize);
  if (!entry || !acct) throw new Error('Entry price and account size are required');

  const isLong = direction === 'long';
  const maxSharesByBalance = Math.floor(acct / entry);
  const accountPositionValue = (acct * positionPct) / 100;

  let stop;
  let riskPerShare;
  let shares;
  let mode;

  // Mode 1: custom stop loss price provided
  if (stopLossPrice) {
    stop = Number(stopLossPrice);
    riskPerShare = isLong ? entry - stop : stop - entry;
    if (riskPerShare <= 0) {
      throw new Error('Stop loss must be below entry for long, above for short');
    }

    const risk = riskAmount ?? accountPositionValue;
    const riskShares = Math.max(1, Math.round(risk / riskPerShare));
    shares = Math.min(riskShares, maxSharesByBalance);
    mode = 'custom-stop';
  } else {
    const isFloatAware = shareFloat && floatCategory && floatCategories[floatCategory];
    const cat = isFloatAware ? floatCategories[floatCategory] : null;
    const stopPctValue = (isFloatAware ? (cat.stop_loss_percent ?? stopPct) : stopPct) / 100;
    stop = isLong ? entry * (1 - stopPctValue) : entry * (1 + stopPctValue);
    riskPerShare = Math.abs(entry - stop);

    const riskShares = Math.floor((riskAmount || 1500) / riskPerShare);

    if (isFloatAware) {
      const baseShares = Math.floor(accountPositionValue / entry);
      const adjustedShares = Math.floor(baseShares * (cat.position_multiplier ?? 1));
      const maxByFloat = Math.floor(shareFloat * ((cat.max_float_percent ?? 0.5) / 100));
      const maxByAccountDollars = maxDollars > 0 ? Math.floor(maxDollars / entry) : Infinity;

      shares = Math.max(
        1,
        Math.min(riskShares, adjustedShares, maxByFloat, maxByAccountDollars, maxSharesByBalance)
      );
      mode = 'float-aware';
    } else {
      const maxPositionValue = maxDollars > 0 ? Math.min(accountPositionValue, maxDollars) : accountPositionValue;
      const maxSharesByPosition = Math.floor(maxPositionValue / entry);
      shares = Math.max(1, Math.min(riskShares, maxSharesByPosition, maxSharesByBalance));
      mode = 'entry-only';
    }
  }

  const positionValue = shares * entry;
  const actualRisk = shares * riskPerShare;
  const target = isLong ? entry + (riskPerShare * riskRewardRatio) : entry - (riskPerShare * riskRewardRatio);
  const targetProfit = shares * riskPerShare * riskRewardRatio;
  const actualRiskPct = acct > 0 ? (actualRisk / acct) * 100 : 0;
  const riskLevel = actualRiskPct >= 2 ? 'High' : actualRiskPct >= 1 ? 'Medium' : 'Low';

  return {
    entryPrice: round(entry, 2),
    stopLossPrice: round(stop, 2),
    targetPrice: round(target, 2),
    direction,
    shares,
    positionValue: round(positionValue, 2),
    actualRisk: round(actualRisk, 2),
    actualRiskPct: round(actualRiskPct, 2),
    riskLevel,
    targetProfit: round(targetProfit, 2),
    riskRewardRatio,
    floatCategory: floatCategory ?? null,
    mode,
    calculatedAt: new Date().toLocaleString(),
  };
}
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sum(arr, field) {
  return arr.reduce((s, t) => s + (t[field] ?? 0), 0);
}

function avg(arr, field) {
  if (!arr.length) return 0;
  return sum(arr, field) / arr.length;
}

function pct(num, denom) {
  return denom > 0 ? round((num / denom) * 100, 1) : 0;
}

function round(n, decimals = 2) {
  const f = Math.pow(10, decimals);
  return Math.round((n + Number.EPSILON) * f) / f;
}

function formatHour(h) {
  if (h === 0)  return '12 AM';
  if (h < 12)   return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function formatChartDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function groupByDay(trades) {
  const groups = {};
  for (const t of trades) {
    if (!t.entry_time) continue;
    const key = new Date(t.entry_time).toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = { totalPnL: 0, trades: 0 };
    groups[key].totalPnL += t.pnl ?? 0;
    groups[key].trades++;
  }
  return groups;
}

