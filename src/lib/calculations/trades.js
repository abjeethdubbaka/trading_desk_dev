/**
 * @file src/lib/calculations/trades.js
 *
 * Pure calculation functions for trade math.
 * No React, no UI, no side effects — easy to unit test.
 */

// ─── P&L ─────────────────────────────────────────────────────────────────────

/**
 * Calculate gross and net P&L for a trade.
 * @param {object} p
 * @param {number} p.entryPrice
 * @param {number} p.exitPrice
 * @param {number} p.positionSize  shares
 * @param {'long'|'short'} p.direction
 * @param {number} [p.fee]         total commission in dollars
 * @returns {{ grossPnl, netPnl, riskPerShare, rMultiple }}
 */
export function calcPnL({ entryPrice, exitPrice, positionSize, direction, fee = 0 }) {
  const entry = Number(entryPrice) || 0;
  const exit  = Number(exitPrice)  || 0;
  const size  = Number(positionSize) || 0;
  const f     = Number(fee) || 0;

  if (!entry || !size) return { grossPnl: 0, netPnl: 0, riskPerShare: 0, rMultiple: 0 };

  const grossPnl    = direction === 'long' ? (exit - entry) * size : (entry - exit) * size;
  const netPnl      = grossPnl - f;
  const riskPerShare = Math.abs(entry - exit);
  const rMultiple    = riskPerShare > 0 ? netPnl / (riskPerShare * size) : 0;

  return { grossPnl, netPnl, riskPerShare, rMultiple };
}

// ─── Position sizing ──────────────────────────────────────────────────────────

/**
 * Basic position size from risk amount and stop distance.
 */
export function calcSharesByRisk({ riskAmount, entryPrice, stopLossPrice }) {
  const riskPerShare = Math.abs(Number(entryPrice) - Number(stopLossPrice));
  if (riskPerShare <= 0) return 0;
  return Math.floor(Number(riskAmount) / riskPerShare);
}

/**
 * Position size as percentage of account.
 */
export function calcSharesByAccountPct({ accountSize, positionPct, entryPrice }) {
  const positionValue = Number(accountSize) * (Number(positionPct) / 100);
  return Math.floor(positionValue / Number(entryPrice));
}

/**
 * Derive stop loss price from a percentage.
 */
export function calcStopPrice({ entryPrice, stopPct, direction }) {
  const e = Number(entryPrice);
  const p = Number(stopPct) / 100;
  return direction === 'long' ? e * (1 - p) : e * (1 + p);
}

/**
 * Derive target price from risk:reward ratio.
 */
export function calcTargetPrice({ entryPrice, stopLossPrice, direction, rrRatio = 3 }) {
  const entry   = Number(entryPrice);
  const stop    = Number(stopLossPrice);
  const rps     = Math.abs(entry - stop);
  const sign    = direction === 'long' ? 1 : -1;
  return entry + sign * rps * rrRatio;
}

/**
 * Full position calculation — covers all three calculator modes.
 *
 * Mode 1 — entry only:          entryPrice + accountSize + positionPct + stopPct
 * Mode 2 — entry + custom stop: entryPrice + stopLossPrice + riskAmount
 * Mode 3 — float-aware:         entryPrice + shareFloat + floatCategory + settings
 *
 * Returns a calculation result object consumed by ResultsDisplay.
 */
export function calcPosition({
  entryPrice,
  direction      = 'long',
  accountSize,
  positionPct    = 1,
  stopPct,
  stopLossPrice: customStop,
  riskAmount,
  shareFloat,
  floatCategory,
  floatCategories = {},
  maxDollars      = 0,
  targetProfitDollars = 500,
  riskRewardRatio = 3,
}) {
  const entry = Number(entryPrice);
  const acct  = Number(accountSize);
  if (!entry || !acct) throw new Error('Entry price and account size are required');

  let stopPrice, shares, positionValue, actualRisk, stopPctUsed;

  // ── Mode 2: custom stop price ──────────────────────────────────────────────
  if (customStop) {
    stopPrice   = Number(customStop);
    const rps   = Math.abs(entry - stopPrice);
    if (rps <= 0) throw new Error('Stop loss must differ from entry price');

    const risk  = Number(riskAmount) || acct * (positionPct / 100) * 0.04;
    shares      = Math.max(1, Math.round(risk / rps));
    positionValue = shares * entry;
    actualRisk    = shares * rps;
    stopPctUsed   = (rps / entry) * 100;
  }

  // ── Mode 3: float-aware ────────────────────────────────────────────────────
  else if (shareFloat && floatCategory && floatCategories[floatCategory]) {
    const cat   = floatCategories[floatCategory];
    stopPctUsed = cat.stopLossPercent ?? stopPct ?? 4;
    stopPrice   = calcStopPrice({ entryPrice: entry, stopPct: stopPctUsed, direction });
    const rps   = Math.abs(entry - stopPrice);

    const baseValue   = acct * (positionPct / 100);
    const capped      = maxDollars > 0 ? Math.min(baseValue, maxDollars) : baseValue;
    const baseShares  = Math.floor(capped / entry);
    const adjusted    = Math.floor(baseShares * (cat.positionMultiplier ?? 1));
    const maxByFloat  = Math.floor(shareFloat * ((cat.maxFloatPercent ?? 0.5) / 100));
    shares            = Math.max(1, Math.min(adjusted, maxByFloat));
    positionValue     = shares * entry;
    actualRisk        = shares * rps;
  }

  // ── Mode 1: entry only ─────────────────────────────────────────────────────
  else {
    stopPctUsed = Number(stopPct) || 4;
    stopPrice   = calcStopPrice({ entryPrice: entry, stopPct: stopPctUsed, direction });
    const rps   = Math.abs(entry - stopPrice);

    const baseValue = acct * (positionPct / 100);
    const capped    = maxDollars > 0 ? Math.min(baseValue, maxDollars) : baseValue;
    shares          = Math.max(1, Math.floor(capped / entry));
    positionValue   = shares * entry;
    actualRisk      = shares * rps;
  }

  const targetPrice  = calcTargetPrice({ entryPrice: entry, stopLossPrice: stopPrice, direction, rrRatio: riskRewardRatio });
  const targetProfit = Math.max(actualRisk * riskRewardRatio, targetProfitDollars);
  const pctOfAccount = (positionValue / acct) * 100;
  const riskPct      = (actualRisk / acct) * 100;
  const riskLevel    = riskPct > 2 ? 'High' : riskPct > 1 ? 'Medium' : 'Low';

  return {
    entryPrice:    entry,
    stopLossPrice: stopPrice,
    stopLossPercent: stopPctUsed,
    targetPrice,
    targetProfit,
    shares,
    positionValue,
    actualRisk,
    riskPercent:   positionPct,
    actualRiskPercent: riskPct,
    percentOfAccount: pctOfAccount,
    riskLevel,
    riskRewardRatio,
    direction,
    shareFloat:    shareFloat ?? null,
    floatCategory: floatCategory ?? null,
    calculatedAt:  new Date().toISOString(),
    mode:
      customStop        ? 'entry-stop'  :
      shareFloat        ? 'float-aware' :
                          'entry-only',
  };
}

// ─── Exit targets ─────────────────────────────────────────────────────────────

/**
 * Build an exit strategy with multiple partial-profit targets.
 * Standard breakdown: 33% at 1R, 33% at 2R, 34% trail at 3R.
 */
export function calcExitTargets({ shares, entryPrice, stopLossPrice, direction, splits = [0.33, 0.33, 0.34] }) {
  const entry  = Number(entryPrice);
  const stop   = Number(stopLossPrice);
  const rps    = Math.abs(entry - stop);
  const sign   = direction === 'long' ? 1 : -1;

  let remaining = shares;
  return splits.map((pct, i) => {
    const r      = i + 1;
    const sh     = i === splits.length - 1 ? remaining : Math.floor(shares * pct);
    remaining   -= sh;
    const price  = entry + sign * rps * r;
    const profit = sh * rps * r;
    return { r, shares: sh, price: +price.toFixed(4), profit: +profit.toFixed(2), isTrail: i === splits.length - 1 };
  });
}

// ─── Performance metrics ──────────────────────────────────────────────────────

/** Core stats from an array of trade objects. */
export function calcCoreStats(trades = []) {
  if (!trades.length) return {
    totalPnL: 0, winRate: 0, avgR: 0, wins: 0, losses: 0,
    totalTrades: 0, avgWin: 0, avgLoss: 0, profitFactor: 0,
  };

  const winners = trades.filter(t => (t.pnl ?? 0) > 0);
  const losers  = trades.filter(t => (t.pnl ?? 0) < 0);
  const totalPnL = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalWon = winners.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalLost = Math.abs(losers.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const avgR     = trades.filter(t => t.r_multiple != null).reduce((s, t) => s + (t.r_multiple ?? 0), 0) /
                   (trades.filter(t => t.r_multiple != null).length || 1);

  return {
    totalTrades:  trades.length,
    wins:         winners.length,
    losses:       losers.length,
    totalPnL:     +totalPnL.toFixed(2),
    winRate:      +(winners.length / trades.length * 100).toFixed(1),
    avgR:         +avgR.toFixed(2),
    avgWin:       winners.length ? +(totalWon / winners.length).toFixed(2) : 0,
    avgLoss:      losers.length  ? +(totalLost / losers.length).toFixed(2) : 0,
    profitFactor: totalLost > 0 ? +(totalWon / totalLost).toFixed(2) : totalWon > 0 ? Infinity : 0,
  };
}

/** Today's trades and stats. */
export function calcTodayStats(trades = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTrades = trades.filter(t => {
    const d = new Date(t.entry_time ?? t.created_date ?? 0);
    return d >= today;
  });
  return { ...calcCoreStats(todayTrades), totalTrades: todayTrades.length };
}

/** Build cumulative equity curve [{date, balance, pnl}]. */
export function buildEquityCurve(trades = [], initialBalance = 50000) {
  const sorted = [...trades]
    .filter(t => t.entry_time)
    .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));

  let balance = initialBalance;
  return sorted.map(t => {
    balance += t.pnl ?? 0;
    return {
      date:    t.entry_time.slice(0, 10),
      balance: +balance.toFixed(2),
      pnl:     t.pnl ?? 0,
    };
  });
}

/** Maximum drawdown from equity curve array. */
export function calcMaxDrawdown(curve = []) {
  let peak = -Infinity, maxDD = 0;
  for (const { balance } of curve) {
    if (balance > peak) peak = balance;
    const dd = peak - balance;
    if (dd > maxDD) maxDD = dd;
  }
  return -maxDD;
}

/** Sharpe ratio (annualised, assumes 252 trading days). */
export function calcSharpeRatio(trades = [], riskFreeRate = 0) {
  const pnls = trades.map(t => t.pnl ?? 0).filter(p => p !== 0);
  if (pnls.length < 2) return 0;
  const mean = pnls.reduce((s, p) => s + p, 0) / pnls.length;
  const variance = pnls.reduce((s, p) => s + (p - mean) ** 2, 0) / (pnls.length - 1);
  const std = Math.sqrt(variance);
  return std === 0 ? 0 : +((mean - riskFreeRate) / std * Math.sqrt(252)).toFixed(2);
}

/** Win/loss streaks. */
export function calcStreaks(trades = []) {
  let currentStreak = 0, currentType = null, bestWin = 0, bestLoss = 0;
  for (const t of trades) {
    const type = (t.pnl ?? 0) > 0 ? 'win' : 'loss';
    if (type === currentType) {
      currentStreak++;
    } else {
      currentType   = type;
      currentStreak = 1;
    }
    if (type === 'win'  && currentStreak > bestWin)  bestWin  = currentStreak;
    if (type === 'loss' && currentStreak > bestLoss) bestLoss = currentStreak;
  }
  return { currentStreak, currentType, bestWin, bestLoss };
}

/** Last N trading days as [{date, result, pnl}]. */
export function getDailySequence(trades = [], days = 20) {
  const byDay = {};
  for (const t of trades) {
    const key = (t.entry_time ?? t.created_date ?? '').slice(0, 10);
    if (!key) continue;
    if (!byDay[key]) byDay[key] = 0;
    byDay[key] += t.pnl ?? 0;
  }
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-days)
    .map(([date, pnl]) => ({
      date,
      pnl: +pnl.toFixed(2),
      result: pnl > 0 ? 'W' : pnl < 0 ? 'L' : 'B',
    }));
}

// ─── Performance breakdowns ───────────────────────────────────────────────────

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function groupBy(trades, keyFn) {
  return trades.reduce((acc, t) => {
    const k = keyFn(t);
    if (k == null) return acc;
    if (!acc[k]) acc[k] = [];
    acc[k].push(t);
    return acc;
  }, {});
}

function statsFromGroup(group) {
  const wins  = group.filter(t => (t.pnl ?? 0) > 0);
  const total = group.reduce((s, t) => s + (t.pnl ?? 0), 0);
  return {
    trades:   group.length,
    wins:     wins.length,
    totalPnL: +total.toFixed(2),
    winRate:  +(wins.length / group.length * 100).toFixed(1),
    avgPnL:   +(total / group.length).toFixed(2),
  };
}

export function perfByDayOfWeek(trades) {
  const groups = groupBy(trades, t => t.entry_time ? new Date(t.entry_time).getDay() : null);
  return DAYS.map((day, i) => ({ day, short: day.slice(0, 3), ...(groups[i] ? statsFromGroup(groups[i]) : { trades:0, wins:0, totalPnL:0, winRate:0, avgPnL:0 }) }));
}

export function perfByHourOfDay(trades) {
  const groups = groupBy(trades, t => t.entry_time ? new Date(t.entry_time).getHours() : null);
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`,
    ...(groups[h] ? statsFromGroup(groups[h]) : { trades:0, wins:0, totalPnL:0, winRate:0, avgPnL:0 }),
  })).filter(h => h.trades > 0);
}

export function perfByMonth(trades) {
  const groups = groupBy(trades, t => t.entry_time ? new Date(t.entry_time).getMonth() : null);
  return MONTHS.map((short, i) => ({ month: short, ...(groups[i] ? statsFromGroup(groups[i]) : { trades:0, wins:0, totalPnL:0, winRate:0, avgPnL:0 }) }));
}

export function perfBySetupType(trades) {
  const groups = groupBy(trades, t => t.setup_type || 'Unknown');
  return Object.entries(groups)
    .map(([setup, g]) => ({ setup, ...statsFromGroup(g) }))
    .sort((a, b) => b.trades - a.trades);
}

export function perfByPriceRange(trades) {
  const ranges = [
    { label: '$0–$2',      min: 0,   max: 2    },
    { label: '$2–$5',      min: 2,   max: 5    },
    { label: '$5–$10',     min: 5,   max: 10   },
    { label: '$10–$20',    min: 10,  max: 20   },
    { label: '$20–$50',    min: 20,  max: 50   },
    { label: '$50–$100',   min: 50,  max: 100  },
    { label: '$100–$200',  min: 100, max: 200  },
    { label: '$200+',      min: 200, max: Infinity },
  ];
  return ranges.map(r => {
    const group = trades.filter(t => {
      const p = t.entry_price ?? 0;
      return p >= r.min && p < r.max;
    });
    return { ...r, ...(group.length ? statsFromGroup(group) : { trades:0, wins:0, totalPnL:0, winRate:0, avgPnL:0 }) };
  }).filter(r => r.trades > 0);
}

/** Calculate emotion-based statistics from trades. */
export function computeEmotionStats(trades = []) {
  const emotions = {};
  
  // Group trades by emotion
  trades.forEach(trade => {
    const emotion = trade.emotion_before || 'neutral';
    if (!emotions[emotion]) {
      emotions[emotion] = {
        emotion,
        trades: 0,
        wins: 0,
        totalPnL: 0,
        totalR: 0,
        rCount: 0
      };
    }
    
    const group = emotions[emotion];
    group.trades++;
    group.totalPnL += trade.pnl || 0;
    
    if ((trade.pnl || 0) > 0) {
      group.wins++;
    }
    
    if (trade.r_multiple != null) {
      group.totalR += trade.r_multiple;
      group.rCount++;
    }
  });
  
  // Calculate stats for each emotion
  return Object.values(emotions).map(group => ({
    emotion: group.emotion,
    trades: group.trades,
    wins: group.wins,
    winRate: group.trades > 0 ? (group.wins / group.trades * 100) : 0,
    avgPnL: group.trades > 0 ? group.totalPnL / group.trades : 0,
    avgR: group.rCount > 0 ? group.totalR / group.rCount : 0
  })).filter(stat => stat.trades > 0);
}

/** Calculate plan adherence statistics from trades. */
export function computePlanAdherence(trades = []) {
  const followed = trades.filter(t => t.plan_followed === true);
  const deviated = trades.filter(t => t.plan_followed === false);
  
  const calcStats = (tradeList) => {
    if (!tradeList.length) {
      return {
        totalTrades: 0,
        wins: 0,
        totalPnL: 0,
        totalR: 0,
        rCount: 0,
        winRate: 0,
        avgPnL: 0,
        avgR: 0
      };
    }
    
    const wins = tradeList.filter(t => (t.pnl || 0) > 0);
    const totalPnL = tradeList.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const rValues = tradeList.filter(t => t.r_multiple != null);
    const totalR = rValues.reduce((sum, t) => sum + t.r_multiple, 0);
    
    return {
      totalTrades: tradeList.length,
      wins: wins.length,
      totalPnL,
      totalR,
      rCount: rValues.length,
      winRate: (wins.length / tradeList.length) * 100,
      avgPnL: totalPnL / tradeList.length,
      avgR: rValues.length > 0 ? totalR / rValues.length : 0
    };
  };
  
  return {
    followed: calcStats(followed),
    deviated: calcStats(deviated)
  };
}
