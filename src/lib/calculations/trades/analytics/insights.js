import { calcCoreStats } from './coreStats.js';
import { perfBySetupType } from './performanceBreakdowns.js';
import { round } from '../shared/helpers.js';

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

  const normalizedResults = strategyStepResults
    .map((item) => normalizeBoolean(item?.followed ?? item))
    .filter((value) => value === true || value === false);

  if (normalizedResults.length > 0) {
    const followed = normalizedResults.filter(Boolean).length;
    const total = normalizedResults.length;
    return {
      hasSignal: true,
      score: total > 0 ? round((followed / total) * 100, 1) : 0,
      followed,
      total,
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

  const wrong = toSentenceText(
    reflection?.what_went_wrong
    || reflection?.whatWentWrong
    || reflection?.what_wrong
    || extractLineFromNotes(trade?.notes, 'What went wrong:')
  );

  const learned = toSentenceText(
    reflection?.what_learned
    || reflection?.whatLearned
    || reflection?.what_we_learn
    || reflection?.what_did_you_learn
    || extractLineFromNotes(trade?.notes, 'What did you learn:')
  );

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

export function analyzeMistakePatterns(trades = [], limit = 5) {
  const mistakes = [];
  const fixes = [];

  for (const trade of trades) {
    const { wrong, learned } = extractReflection(trade);
    const date = toTradeDate(trade);

    if (wrong) mistakes.push({ text: wrong, date });
    if (learned) fixes.push({ text: learned, date });
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
