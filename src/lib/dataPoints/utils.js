/**
 * Data Points — observations of how a Playbook strategy actually resolved,
 * used to judge whether its risk level should be raised, held, or cut.
 *
 * Two sources feed the same view:
 *   - manual points you record while studying/backtesting a setup
 *   - trades you already logged for that setup (read-only here)
 *
 * The flow is one-directional: trades inform Data Points, never the reverse.
 * Nothing here is written back to trades or reaches the Performance page.
 */

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toTrimmedString = (value) => String(value ?? '').trim();

/**
 * Outcomes are recorded against the setup's own exit strategy — the Min /
 * Target / Stretch R ladder configured in the Playbook — answered the same
 * way as Add Trade does it: did this level get reached, yes or no?
 */
export const EXIT_LEVELS = [
  { key: 'min', label: 'Ex1 — Min R', profileKey: 'min' },
  { key: 'target', label: 'Ex2 — Target R', profileKey: 'target' },
  { key: 'stretch', label: 'Ex3 — Stretch R', profileKey: 'stretch' },
];

// Highest rung first, so "what did it actually get to" is a find, not a sort.
const LEVELS_HIGH_TO_LOW = ['stretch', 'target', 'min'];

const EXIT_LEVEL_BY_KEY = new Map(EXIT_LEVELS.map((level) => [level.key, level]));

export function getExitLevel(key) {
  return EXIT_LEVEL_BY_KEY.get(key) || null;
}

/** R that a given exit level is worth for a setup, per its expected R profile. */
export function getExitLevelR(levelKey, expectedRProfile) {
  const level = EXIT_LEVEL_BY_KEY.get(levelKey);
  if (!level) return null;
  return toNumber(expectedRProfile?.[level.profileKey]);
}

/** Exit levels this setup has actually configured, for the questions shown. */
export function getConfiguredExitLevels(expectedRProfile) {
  return EXIT_LEVELS.filter((level) => toNumber(expectedRProfile?.[level.profileKey]) != null);
}

function normalizeLevelsReached(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const result = {};
  for (const { key } of EXIT_LEVELS) {
    result[key] = typeof source[key] === 'boolean' ? source[key] : null;
  }
  return result;
}

/** The furthest rung answered "yes", or null if none were. */
export function getHighestLevelReached(point) {
  const levels = point?.levels_reached;
  if (!levels) return null;
  return LEVELS_HIGH_TO_LOW.find((key) => levels[key] === true) || null;
}

/** True once every configured rung has been answered "no" — i.e. stopped out. */
function wasStoppedOut(point, expectedRProfile) {
  const levels = point?.levels_reached;
  if (!levels) return false;
  const configured = getConfiguredExitLevels(expectedRProfile);
  if (configured.length === 0) return false;
  return configured.every((level) => levels[level.key] === false);
}

export function normalizeDataPoint(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    id: toTrimmedString(source.id),
    strategy: toTrimmedString(source.strategy),
    entry: toNumber(source.entry),
    stop_loss: toNumber(source.stop_loss),
    // Where the observation was actually closed, when it was watched to the
    // end. Context only: R still comes from the exit ladder below.
    exit: toNumber(source.exit),
    levels_reached: normalizeLevelsReached(source.levels_reached),
    mfe_r: toNumber(source.mfe_r),
    note: toTrimmedString(source.note),
    images: Array.isArray(source.images) ? source.images.filter((i) => typeof i === 'string' && i) : [],
    // Charts live in Informative Images, so a point references the gallery
    // entry rather than carrying a second copy of the same base64.
    informative_image_id: toTrimmedString(source.informative_image_id),
    created_date: toTrimmedString(source.created_date),
  };
}

/**
 * Direction is inferred from where the stop sits relative to entry — a stop
 * below entry is a long, above is a short — so there's no extra field to
 * keep in sync with the prices themselves.
 */
export function getDataPointDirection(point) {
  if (point?.direction === 'long' || point?.direction === 'short') return point.direction;
  const entry = toNumber(point?.entry);
  const stop = toNumber(point?.stop_loss);
  if (entry == null || stop == null || entry === stop) return null;
  return stop < entry ? 'long' : 'short';
}

/**
 * R for one observation. A point sourced from a trade carries its own
 * realized R; a manual point resolves its recorded exit level against the
 * setup's expected R profile.
 */
export function calcDataPointR(point, expectedRProfile) {
  if (point?.r_multiple != null) {
    const realized = toNumber(point.r_multiple);
    if (realized != null) return Math.round(realized * 100) / 100;
  }

  const highest = getHighestLevelReached(point);
  if (highest) {
    const r = getExitLevelR(highest, expectedRProfile);
    return r == null ? null : Math.round(r * 100) / 100;
  }

  // Not even the first rung was reached — the stop took it, which is -1R by
  // definition of how risk is sized.
  if (wasStoppedOut(point, expectedRProfile)) return -1;

  return null;
}

/** How far the move ran in your favour, in R, regardless of where it was exited. */
export function calcDataPointMfeR(point) {
  const mfe = toNumber(point?.mfe_r);
  return mfe == null ? null : Math.round(mfe * 100) / 100;
}

/** Converts a logged trade into the shape the Data Points view reads. */
export function tradeToDataPoint(trade) {
  return {
    id: `trade-${trade?.id}`,
    source: 'trade',
    strategy: toTrimmedString(trade?.setup_type),
    entry: toNumber(trade?.entry_price),
    stop_loss: toNumber(trade?.stop_loss),
    exit: toNumber(trade?.exit_price),
    // Add Trade asks the same yes/no per rung, so the answers map straight over.
    levels_reached: normalizeLevelsReached({
      min: trade?.exit_min_r_taken,
      target: trade?.exit_target_r_taken,
      stretch: trade?.exit_stretch_r_taken,
    }),
    r_multiple: toNumber(trade?.r_multiple),
    mfe_r: toNumber(trade?.mfe_r_multiple),
    direction: trade?.direction === 'short' ? 'short' : 'long',
    note: toTrimmedString(trade?.symbol),
    images: [],
    created_date: toTrimmedString(trade?.entry_time || trade?.created_date),
  };
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Math.round(value * 100) / 100;
}

/**
 * Aggregate view of a strategy's observations — what the collected evidence
 * says the setup actually produces.
 */
export function summarizeDataPoints(points = [], expectedRProfile) {
  const scored = points
    .map((point) => ({ point, r: calcDataPointR(point, expectedRProfile) }))
    .filter(({ r }) => r != null);

  const rValues = scored.map(({ r }) => r);
  const manualCount = points.filter((p) => p.source !== 'trade').length;
  const tradeCount = points.filter((p) => p.source === 'trade').length;

  const mfeValues = points
    .map((point) => calcDataPointMfeR(point))
    .filter((r) => r != null);
  const medianMfeR = median(mfeValues);

  if (rValues.length === 0) {
    return {
      count: points.length, scored: 0, manualCount, tradeCount,
      medianR: null, avgR: null, bestR: null, worstR: null, winRate: null, expectancy: null,
      medianMfeR, mfeScored: mfeValues.length, mfeGap: null,
    };
  }

  const sum = rValues.reduce((total, r) => total + r, 0);
  const wins = rValues.filter((r) => r > 0).length;
  const medianR = median(rValues);

  return {
    count: points.length,
    scored: rValues.length,
    manualCount,
    tradeCount,
    medianR,
    avgR: Math.round((sum / rValues.length) * 100) / 100,
    bestR: Math.round(Math.max(...rValues) * 100) / 100,
    worstR: Math.round(Math.min(...rValues) * 100) / 100,
    winRate: Math.round((wins / rValues.length) * 1000) / 10,
    // Average R per observation is the expectancy of the setup as sampled.
    expectancy: Math.round((sum / rValues.length) * 100) / 100,
    medianMfeR,
    mfeScored: mfeValues.length,
    // How much the move typically offered beyond where it was actually
    // closed: a wide gap means exits are early, none means the targets are
    // out of reach for this setup.
    mfeGap: medianMfeR == null ? null : Math.round((medianMfeR - medianR) * 100) / 100,
  };
}

export const MIN_SAMPLES_FOR_VERDICT = 10;

/**
 * Turns the sample into an actionable call on the setup's risk, which is the
 * whole point of collecting these: size up what's working, cut what isn't.
 */
export function getRiskVerdict(summary, expectedRProfile, minSamples = MIN_SAMPLES_FOR_VERDICT) {
  const scored = summary?.scored ?? 0;
  if (scored < minSamples) {
    return {
      key: 'insufficient',
      label: 'Keep collecting',
      detail: `${scored} of ${minSamples} observations — not enough to judge this setup yet.`,
    };
  }

  const expectancy = summary.expectancy;
  const target = toNumber(expectedRProfile?.target);

  if (expectancy <= 0) {
    return {
      key: 'reduce',
      label: 'Cut risk',
      detail: `Expectancy is ${expectancy}R per trade — this setup is losing money as traded. Reduce size or rework it before risking more.`,
    };
  }

  if (target != null && expectancy >= target) {
    return {
      key: 'increase',
      label: 'Risk can be increased',
      detail: `Expectancy of ${expectancy}R is at or above the ${target}R target across ${scored} observations.`,
    };
  }

  if (expectancy < 0.5) {
    return {
      key: 'reduce',
      label: 'Cut risk',
      detail: `Expectancy of only ${expectancy}R barely covers costs — size down until it improves.`,
    };
  }

  return {
    key: 'hold',
    label: 'Hold current risk',
    detail: target != null
      ? `Expectancy of ${expectancy}R is positive but short of the ${target}R target — keep size where it is.`
      : `Expectancy of ${expectancy}R is positive. Set a target R on this setup to judge it against plan.`,
  };
}

/** Groups data points by strategy name, keyed case-insensitively. */
export function groupDataPointsByStrategy(points = []) {
  const groups = new Map();
  for (const point of points) {
    const key = toTrimmedString(point?.strategy).toLowerCase();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(point);
  }
  return groups;
}

/**
 * Stable fingerprint of an observation's content, used to recognise a point
 * that has already been imported. Deliberately ignores id and created_date —
 * two exports of the same observation carry different ids, and re-importing
 * the same file should not duplicate anything.
 */
export function dataPointSignature(point) {
  const p = normalizeDataPoint(point);
  const levels = LEVELS_HIGH_TO_LOW.map((key) => {
    const answer = p.levels_reached[key];
    return answer === true ? 'y' : answer === false ? 'n' : '-';
  }).join('');

  return [
    p.strategy.toLowerCase(),
    p.entry ?? '',
    p.stop_loss ?? '',
    p.mfe_r ?? '',
    levels,
    p.note,
  ].join('|');
}

/**
 * The observations belonging to a given set of strategy names, matched the
 * same case-insensitive way Playbook cards match their own data points.
 */
export function selectDataPointsForStrategies(points = [], strategyNames = []) {
  const wanted = new Set(
    strategyNames.map((name) => String(name || '').trim().toLowerCase()).filter(Boolean)
  );
  if (wanted.size === 0) return [];
  return (Array.isArray(points) ? points : []).filter((point) =>
    wanted.has(String(point?.strategy || '').trim().toLowerCase())
  );
}
