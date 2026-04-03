import { formatHour, pct, round } from '../shared/helpers.js';
import { resolveShareFloatRange } from '../shared/shareFloat.js';

const STATUS = {
  APPROVED: 'approved',
  CAUTION: 'caution',
  AVOID: 'avoid',
  DEVELOPING: 'developing',
  UNKNOWN: 'unknown',
};

const WINDOW_DEFINITIONS = [
  { key: 'open', label: 'Open (9-10)', startHour: 9, endHour: 10 },
  { key: 'midday', label: 'Midday (11-13)', startHour: 11, endHour: 13 },
  { key: 'power', label: 'Power Hour (14-16)', startHour: 14, endHour: 16 },
  { key: 'off-hours', label: 'Off Hours', startHour: null, endHour: null },
];

const DEFAULT_THRESHOLDS = {
  minSampleTrades: 6,
  strongSampleTrades: 12,
  minExpectancy: 0,
  minWinRate: 45,
  minProfitFactor: 1.1,
  avoidExpectancy: -25,
  avoidProfitFactor: 0.85,
  minWindowSample: 2,
  minFloatSample: 2,
};

function toFinite(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toEntryDate(trade) {
  return new Date(trade?.entry_time ?? trade?.created_date ?? trade?.created_at ?? 0);
}

function normalizeSetupName(value) {
  const normalized = String(value || '').trim();
  return normalized || 'Unknown';
}

function resolveSetupName(trade) {
  return normalizeSetupName(trade?.setup_type || trade?.custom_setup_type || 'Unknown');
}

function getWindowDefinitionByKey(windowKey) {
  return WINDOW_DEFINITIONS.find((window) => window.key === windowKey) || WINDOW_DEFINITIONS[3];
}

function resolveWindowKey(hour24) {
  if (!Number.isFinite(hour24)) return 'off-hours';
  if (hour24 >= 9 && hour24 <= 10) return 'open';
  if (hour24 >= 11 && hour24 <= 13) return 'midday';
  if (hour24 >= 14 && hour24 <= 16) return 'power';
  return 'off-hours';
}

function getWindowLabel(windowKey) {
  return getWindowDefinitionByKey(windowKey).label;
}

function createBucket() {
  return {
    trades: 0,
    wins: 0,
    losses: 0,
    totalPnL: 0,
    grossWins: 0,
    grossLosses: 0,
    rSum: 0,
    rCount: 0,
  };
}

function updateBucket(bucket, trade) {
  const pnl = toFinite(trade?.pnl, 0);
  bucket.trades += 1;
  bucket.totalPnL += pnl;

  if (pnl > 0) {
    bucket.wins += 1;
    bucket.grossWins += pnl;
  } else if (pnl < 0) {
    bucket.losses += 1;
    bucket.grossLosses += Math.abs(pnl);
  }

  const rMultiple = Number(trade?.r_multiple);
  if (Number.isFinite(rMultiple)) {
    bucket.rSum += rMultiple;
    bucket.rCount += 1;
  }
}

function finalizeBucket(bucket) {
  const expectancy = bucket.trades > 0 ? bucket.totalPnL / bucket.trades : 0;
  const avgR = bucket.rCount > 0 ? bucket.rSum / bucket.rCount : 0;
  const profitFactor = bucket.grossLosses > 0
    ? bucket.grossWins / bucket.grossLosses
    : bucket.grossWins > 0
      ? Infinity
      : 0;

  return {
    trades: bucket.trades,
    wins: bucket.wins,
    losses: bucket.losses,
    winRate: pct(bucket.wins, bucket.trades),
    totalPnL: round(bucket.totalPnL, 2),
    expectancy: round(expectancy, 2),
    avgR: round(avgR, 2),
    profitFactor: profitFactor === Infinity ? Infinity : round(profitFactor, 2),
  };
}

function classifySetup(metrics, thresholds) {
  if (metrics.trades < thresholds.minSampleTrades) {
    return STATUS.DEVELOPING;
  }

  if (
    metrics.expectancy <= thresholds.avoidExpectancy
    || (metrics.profitFactor !== Infinity && metrics.profitFactor < thresholds.avoidProfitFactor)
  ) {
    return STATUS.AVOID;
  }

  const passesEdgeGate = (
    metrics.expectancy >= thresholds.minExpectancy
    && metrics.winRate >= thresholds.minWinRate
    && (metrics.profitFactor === Infinity || metrics.profitFactor >= thresholds.minProfitFactor)
  );

  return passesEdgeGate ? STATUS.APPROVED : STATUS.CAUTION;
}

function computeConfidence(metrics, status, thresholds) {
  const sampleScore = clamp(metrics.trades / thresholds.strongSampleTrades, 0, 1);
  const expectancyScore = clamp((metrics.expectancy + 50) / 100, 0, 1);
  const winRateScore = clamp(metrics.winRate / 100, 0, 1);
  const profitFactorScore = metrics.profitFactor === Infinity
    ? 1
    : clamp(metrics.profitFactor / 2, 0, 1);

  const statusBase = status === STATUS.APPROVED
    ? 15
    : status === STATUS.CAUTION
      ? 10
      : status === STATUS.AVOID
        ? 5
        : 8;

  const weighted = (
    sampleScore * 34
    + expectancyScore * 28
    + winRateScore * 18
    + profitFactorScore * 20
  );

  return Math.round(clamp(statusBase + weighted, 0, 100));
}

function chooseBestContext(items = [], minSample = 2) {
  return items
    .filter((item) => item.trades >= minSample)
    .sort((a, b) => {
      if (b.expectancy !== a.expectancy) return b.expectancy - a.expectancy;
      if (b.profitFactor !== a.profitFactor) return b.profitFactor - a.profitFactor;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.trades - a.trades;
    })[0] || null;
}

function resolveConfiguredSetups(settings) {
  const configured = Array.isArray(settings?.journal_preferences?.default_setup_types)
    ? settings.journal_preferences.default_setup_types
    : [];

  return configured
    .map((setup) => normalizeSetupName(setup))
    .filter(Boolean);
}

function resolveActiveWindow(options = {}) {
  const entryCandidate = options?.candidateEntryTime;
  const entryDate = entryCandidate ? new Date(entryCandidate) : new Date();
  const date = Number.isFinite(entryDate.getTime()) ? entryDate : new Date();
  const hour24 = date.getHours();
  const key = resolveWindowKey(hour24);
  return {
    key,
    label: getWindowLabel(key),
    hour24,
    hour: formatHour(hour24),
  };
}

function buildCandidateRecommendation(candidateSetup, rowsBySetup, activeWindow) {
  const rawCandidate = String(candidateSetup || '').trim();
  if (!rawCandidate) return null;
  const normalized = normalizeSetupName(rawCandidate);

  const row = rowsBySetup.get(normalized.toLowerCase());
  if (!row) {
    return {
      setup: normalized,
      status: STATUS.UNKNOWN,
      title: 'No strategy history for this setup yet',
      message: 'Log at least 6 trades for this setup before trusting its edge stats.',
      metrics: null,
      contextMessage: null,
    };
  }

  const statusTitles = {
    [STATUS.APPROVED]: 'Setup currently has positive edge',
    [STATUS.CAUTION]: 'Setup edge is mixed right now',
    [STATUS.AVOID]: 'Setup is underperforming - high caution',
    [STATUS.DEVELOPING]: 'Setup still needs more sample size',
  };

  const statusMessages = {
    [STATUS.APPROVED]: 'Execution is statistically favorable if your checklist is fully met.',
    [STATUS.CAUTION]: 'Only take A+ versions of this setup and keep risk size tight.',
    [STATUS.AVOID]: 'Pause this setup for now or trade it at reduced size until edge recovers.',
    [STATUS.DEVELOPING]: 'Collect more trades before deciding if this setup belongs in your core playbook.',
  };

  const activeWindowStats = row.windowStats.find((item) => item.key === activeWindow.key) || null;
  let contextMessage = null;

  if (activeWindowStats && activeWindowStats.trades >= 2) {
    if (activeWindowStats.expectancy > 0) {
      contextMessage = `This setup performs well in ${activeWindow.label} (+$${Math.abs(activeWindowStats.expectancy).toFixed(0)} expectancy).`;
    } else if (activeWindowStats.expectancy < 0) {
      contextMessage = `This setup is weak in ${activeWindow.label} (-$${Math.abs(activeWindowStats.expectancy).toFixed(0)} expectancy).`;
    } else {
      contextMessage = `This setup is flat in ${activeWindow.label}.`;
    }
  }

  return {
    setup: row.setup,
    status: row.status,
    title: statusTitles[row.status] || 'Strategy signal unavailable',
    message: statusMessages[row.status] || 'No guidance available.',
    metrics: {
      trades: row.trades,
      winRate: row.winRate,
      expectancy: row.expectancy,
      profitFactor: row.profitFactor,
      confidence: row.confidence,
    },
    contextMessage,
  };
}

export function buildStrategyEngineSnapshot(trades = [], settings = {}, options = {}) {
  const thresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(options?.thresholds || {}),
  };

  const setupBuckets = new Map();
  const setupWindowBuckets = new Map();
  const setupFloatBuckets = new Map();
  const configuredSetups = resolveConfiguredSetups(settings);

  for (const trade of Array.isArray(trades) ? trades : []) {
    const setup = resolveSetupName(trade);
    const setupKey = setup.toLowerCase();
    const entryDate = toEntryDate(trade);
    const hour24 = Number.isFinite(entryDate.getTime()) ? entryDate.getHours() : null;
    const windowKey = resolveWindowKey(hour24);
    const floatRange = resolveShareFloatRange(
      trade?.share_float,
      trade?.float_category,
      trade?.share_float_range,
      settings?.float_categories
    );
    const floatKey = String(floatRange?.key || 'unknown');

    if (!setupBuckets.has(setupKey)) {
      setupBuckets.set(setupKey, { setup, bucket: createBucket() });
    }
    updateBucket(setupBuckets.get(setupKey).bucket, trade);

    const setupWindowKey = `${setupKey}|${windowKey}`;
    if (!setupWindowBuckets.has(setupWindowKey)) {
      setupWindowBuckets.set(setupWindowKey, {
        setup,
        setupKey,
        key: windowKey,
        label: getWindowLabel(windowKey),
        bucket: createBucket(),
      });
    }
    updateBucket(setupWindowBuckets.get(setupWindowKey).bucket, trade);

    const setupFloatKey = `${setupKey}|${floatKey}`;
    if (!setupFloatBuckets.has(setupFloatKey)) {
      setupFloatBuckets.set(setupFloatKey, {
        setup,
        setupKey,
        key: floatKey,
        label: String(floatRange?.label || floatKey),
        bucket: createBucket(),
      });
    }
    updateBucket(setupFloatBuckets.get(setupFloatKey).bucket, trade);
  }

  for (const configuredSetup of configuredSetups) {
    const key = configuredSetup.toLowerCase();
    if (!setupBuckets.has(key)) {
      setupBuckets.set(key, { setup: configuredSetup, bucket: createBucket() });
    }
  }

  const rows = [...setupBuckets.values()].map((item) => {
    const setupMetrics = finalizeBucket(item.bucket);
    const status = classifySetup(setupMetrics, thresholds);
    const confidence = computeConfidence(setupMetrics, status, thresholds);

    const windowStats = [...setupWindowBuckets.values()]
      .filter((entry) => entry.setupKey === item.setup.toLowerCase())
      .map((entry) => ({
        key: entry.key,
        label: entry.label,
        ...finalizeBucket(entry.bucket),
      }))
      .sort((a, b) => b.trades - a.trades);

    const floatStats = [...setupFloatBuckets.values()]
      .filter((entry) => entry.setupKey === item.setup.toLowerCase())
      .map((entry) => ({
        key: entry.key,
        label: entry.label,
        ...finalizeBucket(entry.bucket),
      }))
      .sort((a, b) => b.trades - a.trades);

    return {
      setup: item.setup,
      status,
      confidence,
      ...setupMetrics,
      bestWindow: chooseBestContext(windowStats, thresholds.minWindowSample),
      bestFloatRange: chooseBestContext(floatStats, thresholds.minFloatSample),
      windowStats,
      floatStats,
    };
  });

  const activeWindow = resolveActiveWindow(options);
  const rowsBySetup = new Map(rows.map((row) => [row.setup.toLowerCase(), row]));

  const sortByEdge = (a, b) => {
    if (b.expectancy !== a.expectancy) return b.expectancy - a.expectancy;
    if (b.profitFactor !== a.profitFactor) return b.profitFactor - a.profitFactor;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return b.trades - a.trades;
  };

  const recommendedSetups = rows
    .filter((row) => row.status === STATUS.APPROVED)
    .sort(sortByEdge);

  const cautionSetups = rows
    .filter((row) => row.status === STATUS.CAUTION)
    .sort(sortByEdge);

  const blockedSetups = rows
    .filter((row) => row.status === STATUS.AVOID)
    .sort((a, b) => {
      if (a.expectancy !== b.expectancy) return a.expectancy - b.expectancy;
      if (a.profitFactor !== b.profitFactor) return a.profitFactor - b.profitFactor;
      return b.trades - a.trades;
    });

  const developingSetups = rows
    .filter((row) => row.status === STATUS.DEVELOPING)
    .sort((a, b) => b.trades - a.trades);

  const recommendedNow = recommendedSetups
    .filter((row) => {
      const activeStats = row.windowStats.find((stat) => stat.key === activeWindow.key);
      if (!activeStats) return false;
      return activeStats.trades >= thresholds.minWindowSample && activeStats.expectancy > 0;
    })
    .slice(0, 3);

  const fallbackRecommendedNow = recommendedNow.length > 0
    ? recommendedNow
    : recommendedSetups.slice(0, 3);

  const candidate = buildCandidateRecommendation(options?.candidateSetup, rowsBySetup, activeWindow);

  return {
    generatedAt: new Date().toISOString(),
    activeWindow,
    thresholds,
    summary: {
      totalTrades: Array.isArray(trades) ? trades.length : 0,
      trackedSetups: rows.length,
      approved: recommendedSetups.length,
      caution: cautionSetups.length,
      avoid: blockedSetups.length,
      developing: developingSetups.length,
    },
    setups: rows.sort((a, b) => {
      const statusRank = {
        [STATUS.APPROVED]: 0,
        [STATUS.CAUTION]: 1,
        [STATUS.DEVELOPING]: 2,
        [STATUS.AVOID]: 3,
      };
      const rankDiff = (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99);
      if (rankDiff !== 0) return rankDiff;
      return sortByEdge(a, b);
    }),
    recommendedSetups,
    cautionSetups,
    blockedSetups,
    developingSetups,
    recommendedNow: fallbackRecommendedNow,
    candidate,
  };
}
