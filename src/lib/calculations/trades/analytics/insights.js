import { calcCoreStats } from './coreStats.js';
import { perfBySetupType } from './performanceBreakdowns.js';
import { pct, round } from '../shared/helpers.js';
import { getTradePnL } from '../../../utils/tradeFields.js';

const LEGACY_STEP_KEYS = [
  'smoothVWAPPullback',
  'controlledRedCandles',
  'holdsAboveVWAP',
  'lowerWicksDipBuyers',
  'tightRange3to6Candles',
  'volumeDriesUp',
  'higherLowsForming',
  'vwapSlopesUpward',
  'breakAboveBaseHigh',
  'volumeIncreases',
  'vwapRising',
];

const normalizeBoolean = (value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
};

const normalizeStepGrade = (value) => {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (!normalized) return '';
  if (normalized === 'A++' || normalized === 'A+' || ['A', 'B', 'C', 'D', 'F'].includes(normalized)) return normalized;
  return '';
};

const STEP_GRADE_POINTS_MAP = {
  'A++': 10,
  'A+': 9,
  'A': 8,
  'B': 6,
  'C': 4,
  'D': 2,
  'F': 0,
};
const STEP_MAX_POINTS = 10;
const STEP_FOLLOWED_POINTS = 10;
const STEP_PASS_POINTS_THRESHOLD = 6;

const toFiniteNumber = (value, fallback = null) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toTradeDate = (trade) => {
  const raw = trade?.entry_time ?? trade?.created_date ?? trade?.created_at;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getTradeDayKey = (trade) => {
  const date = toTradeDate(trade);
  return date ? date.toISOString().slice(0, 10) : null;
};

const getPlanScore = (trade) => {
  const followed = normalizeBoolean(trade?.followed_plan);
  if (followed === true) return { score: 100, followedPlan: true };
  if (followed === false) return { score: 20, followedPlan: false };
  return { score: 55, followedPlan: null };
};

const getStepScore = (trade) => {
  const strategyStepResults = Array.isArray(trade?.strategy_step_results)
    ? trade.strategy_step_results
    : [];

  const normalizedResults = strategyStepResults.map((item) => {
    const followed = normalizeBoolean(item?.followed ?? item);
    const grade = normalizeStepGrade(item?.grade);
    const gradePoints = grade ? STEP_GRADE_POINTS_MAP[grade] : null;
    const hasGradePoints = Number.isFinite(gradePoints);
    const hasFollowedSignal = followed === true || followed === false;
    const points = hasGradePoints
      ? gradePoints
      : followed === true
        ? STEP_FOLLOWED_POINTS
        : followed === false
          ? 0
          : 0;

    return {
      followed,
      grade,
      points,
      isRated: hasGradePoints || hasFollowedSignal,
    };
  });

  if (normalizedResults.length > 0) {
    const total = normalizedResults.length;
    const maxPoints = total * STEP_MAX_POINTS;
    const earnedPoints = normalizedResults.reduce((sum, item) => sum + (item.points || 0), 0);
    const score = maxPoints > 0 ? round((earnedPoints / maxPoints) * 100, 1) : 0;
    const followed = normalizedResults.filter((item) => (item.points || 0) >= STEP_PASS_POINTS_THRESHOLD).length;
    return {
      hasSignal: true,
      score,
      followed,
      total,
      pointsEarned: earnedPoints,
      pointsMax: maxPoints,
    };
  }

  const breakoutChecklist = trade?.breakout_checklist;
  if (!breakoutChecklist || typeof breakoutChecklist !== 'object') {
    return { hasSignal: false, score: null, followed: 0, total: 0 };
  }

  const collected = LEGACY_STEP_KEYS
    .map((key) => normalizeBoolean(
      breakoutChecklist?.step1?.[key]
      ?? breakoutChecklist?.step2?.[key]
      ?? breakoutChecklist?.step3?.[key]
    ))
    .filter((value) => value === true || value === false);

  if (collected.length === 0) {
    return { hasSignal: false, score: null, followed: 0, total: 0 };
  }

  const followed = collected.filter(Boolean).length;
  const total = collected.length;

  return {
    hasSignal: true,
    score: total > 0 ? round((followed / total) * 100, 1) : 0,
    followed,
    total,
    pointsEarned: null,
    pointsMax: null,
  };
};

const estimateRiskAmount = (trade) => {
  const directRisk = toFiniteNumber(trade?.risk_amount, null);
  if (directRisk != null && directRisk >= 0) return directRisk;

  const entry = toFiniteNumber(trade?.entry_price, null);
  const stop = toFiniteNumber(trade?.stop_loss, null);
  const quantity = toFiniteNumber(trade?.quantity ?? trade?.position_size, null);

  if (entry == null || stop == null || quantity == null || quantity <= 0) return null;
  return Math.abs(entry - stop) * quantity;
};

const getRiskScore = (trade, options = {}) => {
  const riskLimit = toFiniteNumber(options?.riskLimit, null);
  const riskAmount = estimateRiskAmount(trade);

  if (riskLimit != null && riskLimit > 0 && riskAmount != null && riskAmount >= 0) {
    const ratio = riskAmount / riskLimit;
    if (ratio <= 1) {
      return { score: 100, riskAmount, riskLimit, riskRatio: ratio, riskCompliant: true };
    }
    if (ratio <= 1.1) {
      return { score: 85, riskAmount, riskLimit, riskRatio: ratio, riskCompliant: false };
    }
    if (ratio <= 1.25) {
      return { score: 70, riskAmount, riskLimit, riskRatio: ratio, riskCompliant: false };
    }
    if (ratio <= 1.5) {
      return { score: 45, riskAmount, riskLimit, riskRatio: ratio, riskCompliant: false };
    }
    return { score: 20, riskAmount, riskLimit, riskRatio: ratio, riskCompliant: false };
  }

  return {
    score: 60,
    riskAmount,
    riskLimit,
    riskRatio: null,
    riskCompliant: null,
  };
};

const getGradeFromScore = (score) => {
  if (!Number.isFinite(score)) return null;
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
};

export function computeTradeSetupQuality(trade = {}, options = {}) {
  const step = getStepScore(trade);
  const plan = getPlanScore(trade);
  const risk = getRiskScore(trade, options);

  const components = [];
  if (step.hasSignal && Number.isFinite(step.score)) {
    components.push({ name: 'steps', value: step.score, weight: 50 });
  }
  components.push({ name: 'plan', value: plan.score, weight: 25 });
  components.push({ name: 'risk', value: risk.score, weight: 25 });

  const totalWeight = components.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = components.reduce((sum, item) => sum + (item.value * item.weight), 0);
  const score = totalWeight > 0 ? round(weightedSum / totalWeight, 1) : null;
  const grade = getGradeFromScore(score);

  return {
    score,
    grade,
    hasSignal: totalWeight > 0,
    breakdown: {
      stepScore: step.score,
      stepsFollowed: step.followed,
      stepsTotal: step.total,
      stepPointsEarned: step.pointsEarned,
      stepPointsMax: step.pointsMax,
      planScore: plan.score,
      followedPlan: plan.followedPlan,
      riskScore: risk.score,
      riskAmount: risk.riskAmount,
      riskLimit: risk.riskLimit,
      riskRatio: risk.riskRatio,
      riskCompliant: risk.riskCompliant,
    },
  };
}

const groupTradesByDay = (trades = []) => {
  const grouped = new Map();

  for (const trade of trades) {
    const key = getTradeDayKey(trade);
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(trade);
  }

  return grouped;
};

const collectTradesForKeys = (grouped, keys = []) => keys.flatMap((key) => grouped.get(key) || []);

const resolveTopSetup = (trades = []) => {
  const setups = perfBySetupType(trades)
    .filter((item) => item.trades > 0)
    .sort((a, b) => {
      if (b.totalPnL !== a.totalPnL) return b.totalPnL - a.totalPnL;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.trades - a.trades;
    });

  return setups[0] || null;
};

export function buildWeeklyReview(trades = [], windows = [7, 14]) {
  const grouped = groupTradesByDay(trades);
  const dayKeys = [...grouped.keys()].sort();

  if (dayKeys.length === 0) {
    return windows.map((days) => ({
      days,
      currentTrades: 0,
      priorTrades: 0,
      currentStats: calcCoreStats([]),
      priorStats: calcCoreStats([]),
      deltas: {
        pnl: null,
        winRate: null,
        avgR: null,
      },
      topSetup: {
        current: null,
        prior: null,
        changed: false,
      },
    }));
  }

  return windows.map((days) => {
    const span = Math.max(1, Math.round(Number(days) || 7));
    const currentKeys = dayKeys.slice(-span);
    const priorKeys = dayKeys.slice(-span * 2, -span);

    const currentTrades = collectTradesForKeys(grouped, currentKeys);
    const priorTrades = collectTradesForKeys(grouped, priorKeys);

    const currentStats = calcCoreStats(currentTrades);
    const priorStats = calcCoreStats(priorTrades);
    const hasPrior = priorTrades.length > 0;

    const currentTopSetup = resolveTopSetup(currentTrades);
    const priorTopSetup = resolveTopSetup(priorTrades);

    return {
      days: span,
      currentTrades: currentTrades.length,
      priorTrades: priorTrades.length,
      currentStats,
      priorStats,
      deltas: {
        pnl: hasPrior ? round(currentStats.totalPnL - priorStats.totalPnL, 2) : null,
        winRate: hasPrior ? round(currentStats.winRate - priorStats.winRate, 1) : null,
        avgR: hasPrior ? round(currentStats.avgR - priorStats.avgR, 2) : null,
      },
      topSetup: {
        current: currentTopSetup,
        prior: priorTopSetup,
        changed: Boolean(
          currentTopSetup?.setup
          && priorTopSetup?.setup
          && currentTopSetup.setup !== priorTopSetup.setup
        ),
      },
    };
  });
}

const normalizeInsightText = (value) => String(value ?? '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const toSentenceText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const toSentenceList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => toSentenceText(item)).filter(Boolean);
  }
  const text = toSentenceText(value);
  return text ? [text] : [];
};

const pickReflectionList = (candidates) => {
  for (const candidate of candidates) {
    const list = toSentenceList(candidate);
    if (list.length) return list;
  }
  return [];
};

const extractLineFromNotes = (notes, prefix) => {
  if (!notes) return '';
  const lines = String(notes).split('\n');
  const target = String(prefix).toLowerCase();
  const line = lines.find((entry) => entry.toLowerCase().startsWith(target));
  if (!line) return '';
  return line.slice(prefix.length).trim();
};

const extractReflection = (trade) => {
  const reflection = trade?.reflection_answers || {};

  const wrong = pickReflectionList([
    reflection?.what_went_wrong,
    reflection?.whatWentWrong,
    reflection?.what_wrong,
    extractLineFromNotes(trade?.notes, 'What went wrong:'),
  ]);

  const learned = pickReflectionList([
    reflection?.what_learned,
    reflection?.whatLearned,
    reflection?.what_we_learn,
    reflection?.what_did_you_learn,
    extractLineFromNotes(trade?.notes, 'What did you learn:'),
  ]);

  return { wrong, learned };
};

const collectPatternCounts = (values = []) => {
  const map = new Map();

  values.forEach(({ text, date }) => {
    const normalized = normalizeInsightText(text);
    if (!normalized) return;

    if (!map.has(normalized)) {
      map.set(normalized, {
        normalized,
        text,
        count: 0,
        lastSeen: date ? date.toISOString() : null,
      });
    }

    const current = map.get(normalized);
    current.count += 1;
    if (date && (!current.lastSeen || date.toISOString() > current.lastSeen)) {
      current.lastSeen = date.toISOString();
    }
  });

  return [...map.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return String(b.lastSeen || '').localeCompare(String(a.lastSeen || ''));
  });
};

export function analyzeWhatWorked(trades = [], limit = 6) {
  if (!trades.length) return { topWorked: [], totalEntries: 0 };

  const entries = [];
  for (const trade of trades) {
    const worked = pickReflectionList([trade?.reflection_answers?.what_worked]);
    const date = toTradeDate(trade);
    const pnl = trade?.pnl ?? 0;
    worked.forEach((text) => entries.push({ text, date, pnl, win: pnl > 0 }));
  }

  const map = new Map();
  entries.forEach(({ text, date, pnl, win }) => {
    const normalized = normalizeInsightText(text);
    if (!normalized) return;
    if (!map.has(normalized)) {
      map.set(normalized, { text, count: 0, wins: 0, totalPnL: 0, lastSeen: null });
    }
    const e = map.get(normalized);
    e.count++;
    if (win) e.wins++;
    e.totalPnL += pnl;
    if (date && (!e.lastSeen || date.toISOString() > e.lastSeen)) e.lastSeen = date.toISOString();
  });

  const topWorked = [...map.values()]
    .map((e) => ({
      text: e.text,
      count: e.count,
      winRate: e.count > 0 ? Math.round((e.wins / e.count) * 100) : 0,
      avgPnL: e.count > 0 ? Math.round(e.totalPnL / e.count) : 0,
      lastSeen: e.lastSeen,
    }))
    .sort((a, b) => b.count - a.count || b.winRate - a.winRate)
    .slice(0, limit);

  return { topWorked, totalEntries: entries.length };
}

export function analyzeMistakePatterns(trades = [], limit = 5) {
  const mistakes = [];
  const fixes = [];

  for (const trade of trades) {
    const { wrong, learned } = extractReflection(trade);
    const date = toTradeDate(trade);

    wrong.forEach((text) => mistakes.push({ text, date }));
    learned.forEach((text) => fixes.push({ text, date }));
  }

  const topMistakes = collectPatternCounts(mistakes).slice(0, limit);
  const topFixes = collectPatternCounts(fixes).slice(0, limit);

  return {
    totalMistakeEntries: mistakes.length,
    totalFixEntries: fixes.length,
    topMistakes,
    topFixes,
  };
}

const RISK_LEVEL_MULTIPLIER = { half: 0.5, normal: 1.0, oneandahalf: 1.5, double: 2.0 };

/**
 * For each losing trade, compares the actual loss against the max allowed loss
 * for that setup (base risk × setup risk_level multiplier). Accumulates how much
 * would have been saved had the trader respected the setup's risk limit.
 *
 * @param {Array}  trades           - trades array (already filtered to period)
 * @param {Array}  playbookEntries  - from usePlaybook() / settings.strategy_playbook
 * @param {number} baseRiskAmount   - settings.risk_amount (dollars)
 * @returns {{ totalSaved, bySetup: Array, tradesAnalyzed, tradesExceeded }}
 */
export function calcDisciplineSavings(trades = [], playbookEntries = [], baseRiskAmount = 0) {
  const base = Number(baseRiskAmount);
  if (!base || base <= 0) return { totalSaved: 0, bySetup: [], tradesAnalyzed: 0, tradesExceeded: 0 };

  const setupMap = new Map();
  playbookEntries.forEach((e) => {
    if (e?.name) setupMap.set(e.name.trim().toLowerCase(), e);
  });

  const bySetup = new Map(); // key → { setup, allowedLoss, totalSaved, count, trades }
  let totalSaved = 0;
  let tradesAnalyzed = 0;
  let tradesExceeded = 0;

  for (const trade of trades) {
    const pnl = Number(trade?.pnl ?? 0);
    if (!Number.isFinite(pnl) || pnl >= 0) continue; // only losses

    const setupName = String(trade?.setup_type || '').trim();
    const entry = setupName ? setupMap.get(setupName.toLowerCase()) : null;
    const multiplier = RISK_LEVEL_MULTIPLIER[entry?.risk_level] ?? 1.0;
    const allowedLoss = round(base * multiplier, 2);
    const actualLoss = Math.abs(pnl);

    tradesAnalyzed++;

    if (actualLoss <= allowedLoss) continue; // within limit — no savings

    const saved = round(actualLoss - allowedLoss, 2);
    totalSaved += saved;
    tradesExceeded++;

    const key = setupName || 'Unknown';
    if (!bySetup.has(key)) {
      bySetup.set(key, {
        setup: key,
        riskLevel: entry?.risk_level ?? 'normal',
        multiplier,
        allowedLoss,
        totalSaved: 0,
        count: 0,
        worstSingle: 0,
      });
    }
    const bucket = bySetup.get(key);
    bucket.totalSaved = round(bucket.totalSaved + saved, 2);
    bucket.count++;
    if (saved > bucket.worstSingle) bucket.worstSingle = round(saved, 2);
  }

  const bySetupArray = [...bySetup.values()].sort((a, b) => b.totalSaved - a.totalSaved);

  return {
    totalSaved: round(totalSaved, 2),
    bySetup: bySetupArray,
    tradesAnalyzed,
    tradesExceeded,
  };
}

/**
 * Win rate on trades entered within windowMinutes after a losing trade.
 * Identifies "revenge trading" patterns.
 */
export function calcRevengeTrades(trades = [], windowMinutes = 20) {
  if (trades.length < 2) {
    return { total: 0, wins: 0, losses: 0, winRate: 0, windowMinutes };
  }

  const sorted = [...trades]
    .filter((t) => t?.entry_time)
    .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));

  let total = 0;
  let wins = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prevPnL = getTradePnL(sorted[i - 1]);
    if (prevPnL >= 0) continue;

    const prevMs = new Date(sorted[i - 1].entry_time).getTime();
    const currMs = new Date(sorted[i].entry_time).getTime();
    const mins   = (currMs - prevMs) / 60000;

    if (mins >= 0 && mins <= windowMinutes) {
      total++;
      if (getTradePnL(sorted[i]) > 0) wins++;
    }
  }

  return {
    total,
    wins,
    losses: total - wins,
    winRate: total > 0 ? round(pct(wins, total), 1) : 0,
    windowMinutes,
  };
}
