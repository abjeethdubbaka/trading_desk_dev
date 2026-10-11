/**
 * @file src/lib/playbook/versions.js
 *
 * Strategy version control. A setup's rules change over time, and its
 * performance is only meaningful against the rules that were live when each
 * trade was taken — otherwise a tightened entry rule is judged by trades it
 * would never have allowed.
 *
 * A version is cut whenever a save changes something that could change an
 * outcome. Charts, notes and journal prompts are deliberately not versioned:
 * they cannot make a trade win or lose.
 *
 * Pure module: no React, no database.
 */

const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * The fields a version is cut on, with the label used when describing what
 * changed. The setup's name is not among them: renaming a setup keeps its
 * history rather than starting a new one.
 */
export const VERSIONED_FIELDS = [
  ['direction', 'Direction'],
  ['timeframe', 'Timeframe'],
  ['has_sl_exit_plan', 'Stop-loss & exit plan'],
  ['entry_criteria', 'Entry criteria'],
  ['exit_criteria', 'Exit criteria'],
  ['stop_loss_management', 'Stop loss'],
  ['stop_loss_move', 'Stop loss move'],
  ['invalidations', 'Invalidations'],
  ['setup_conditions', 'Setup conditions'],
  ['grade_criteria', 'Grade criteria'],
  ['trigger_spec', 'Trigger spec'],
  ['expected_r_profile', 'Expected R & exit allocation'],
  ['risk_percent', 'Risk %'],
];

/** Just the parts of a setup that decide how it is traded. */
export function getVersionedSnapshot(entry) {
  const snapshot = {};
  for (const [field] of VERSIONED_FIELDS) {
    snapshot[field] = entry?.[field] ?? null;
  }
  return snapshot;
}

/**
 * Stable comparison of two snapshots. Key order is not a change, so objects
 * are serialized with their keys sorted.
 */
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => (
    `${JSON.stringify(key)}:${stableStringify(value[key])}`
  )).join(',')}}`;
}

/** The fields whose content differs between two versions of a setup. */
export function diffVersions(previousEntry, nextEntry) {
  const before = getVersionedSnapshot(previousEntry);
  const after = getVersionedSnapshot(nextEntry);

  return VERSIONED_FIELDS
    .filter(([field]) => stableStringify(before[field]) !== stableStringify(after[field]))
    .map(([field, label]) => ({ field, label }));
}

/** Whether a save changes anything that could change a trade's outcome. */
export function hasVersionableChange(previousEntry, nextEntry) {
  return diffVersions(previousEntry, nextEntry).length > 0;
}

/**
 * The record written when a setup's rules change. It holds the rules in full,
 * so a version can be read — or restored — without replaying every edit since.
 */
export function createVersionRecord(entry, previousVersion = null, now = new Date()) {
  const version = Number(previousVersion?.version);
  const nextNumber = Number.isFinite(version) && version > 0 ? version + 1 : 1;
  const changes = previousVersion
    ? diffVersions(previousVersion.snapshot, entry)
    : [];

  return {
    setup_id: toTrimmedString(entry?.id),
    // Kept for reading back; a rename does not split a setup's history.
    setup_name: toTrimmedString(entry?.name),
    version: nextNumber,
    snapshot: getVersionedSnapshot(entry),
    changes,
    // The first version is where a setup started, not a change to it.
    summary: nextNumber === 1
      ? 'Created'
      : changes.map((change) => change.label).join(', ') || 'Updated',
    created_date: now.toISOString(),
  };
}

/** The live version of each setup, newest per setup id. */
export function getCurrentVersions(versions = []) {
  const current = new Map();
  for (const record of Array.isArray(versions) ? versions : []) {
    const setupId = toTrimmedString(record?.setup_id);
    if (!setupId) continue;

    const existing = current.get(setupId);
    if (!existing || Number(record?.version) > Number(existing.version)) {
      current.set(setupId, record);
    }
  }
  return current;
}

/** Every version of one setup, oldest first. */
export function getVersionHistory(versions = [], setupId) {
  const wanted = toTrimmedString(setupId);
  if (!wanted) return [];

  return (Array.isArray(versions) ? versions : [])
    .filter((record) => toTrimmedString(record?.setup_id) === wanted)
    .sort((a, b) => Number(a?.version) - Number(b?.version));
}

/**
 * The version stamp a trade carries, so its result can later be credited to
 * the rules that were actually live when it was taken.
 */
export function getTradeVersionStamp(playbookEntry, currentVersion) {
  if (!playbookEntry?.id) return { setup_version: null, setup_version_id: null };

  const version = Number(currentVersion?.version);
  return {
    setup_version: Number.isFinite(version) && version > 0 ? version : null,
    setup_version_id: toTrimmedString(currentVersion?.id) || null,
  };
}

/** Trades a version needs before its numbers are worth comparing. */
export const MIN_TRADES_FOR_VERSION_VERDICT = 10;

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** The trades taken under one version, matched by the stamp they carry. */
export function getTradesForVersion(trades = [], version) {
  const versionId = toTrimmedString(version?.id);
  const versionNumber = toNumber(version?.version);
  const setupId = toTrimmedString(version?.setup_id);

  return (Array.isArray(trades) ? trades : []).filter((trade) => {
    const stampedId = toTrimmedString(trade?.setup_version_id);
    if (stampedId) return stampedId === versionId;
    // Trades logged before ids were stamped still carry the number, which is
    // unique within a setup.
    return toTrimmedString(trade?.trade_plan_id) === setupId
      && toNumber(trade?.setup_version) === versionNumber;
  });
}

/**
 * How each version of a setup actually performed. This is the point of
 * versioning: a rule change can be judged by the trades it allowed, instead
 * of being averaged into the trades it would have refused.
 */
export function summarizeVersionPerformance(
  trades = [],
  versions = [],
  setupId,
  minSamples = MIN_TRADES_FOR_VERSION_VERDICT,
) {
  const history = getVersionHistory(versions, setupId);
  const latest = history.length > 0 ? history[history.length - 1].version : null;

  return history.map((version) => {
    const taken = getTradesForVersion(trades, version);
    const scored = taken.map((trade) => toNumber(trade?.r_multiple)).filter((r) => r != null);
    const wins = taken.filter((trade) => toNumber(trade?.pnl) > 0).length;

    return {
      id: version.id,
      version: version.version,
      summary: version.summary,
      changes: version.changes || [],
      created_date: version.created_date,
      snapshot: version.snapshot,
      isCurrent: version.version === latest,
      trades: taken.length,
      wins,
      winRate: taken.length > 0 ? round((wins / taken.length) * 100, 1) : null,
      avgR: scored.length > 0 ? round(scored.reduce((sum, r) => sum + r, 0) / scored.length) : null,
      scored: scored.length,
      hasEnough: taken.length >= minSamples,
    };
  });
}

/**
 * Whether the change from one version to the next actually helped. Both sides
 * need a real sample: a rule judged on three trades is a coin toss with a
 * verdict attached.
 */
export function compareVersions(current, previous, minSamples = MIN_TRADES_FOR_VERSION_VERDICT) {
  if (!current || !previous) {
    return { key: 'insufficient', label: 'No comparison yet', detail: 'This is the first version of the setup.' };
  }

  if (!current.hasEnough || !previous.hasEnough) {
    const short = !current.hasEnough ? current : previous;
    return {
      key: 'insufficient',
      label: 'Still collecting',
      detail: `v${short.version} has ${short.trades} of ${minSamples} trades needed to judge the change.`,
    };
  }

  if (current.avgR == null || previous.avgR == null) {
    return { key: 'insufficient', label: 'Still collecting', detail: 'Not enough trades carry an R multiple.' };
  }

  const delta = round(current.avgR - previous.avgR);
  // Within a tenth of an R is noise at these sample sizes, not an improvement.
  if (Math.abs(delta) < 0.1) {
    return { key: 'similar', label: 'No real change', detail: `v${current.version} and v${previous.version} are within 0.1R.` };
  }

  return delta > 0
    ? { key: 'better', label: 'Better', detail: `v${current.version} averages ${delta}R more than v${previous.version}.`, delta }
    : { key: 'worse', label: 'Worse', detail: `v${current.version} averages ${Math.abs(delta)}R less than v${previous.version}.`, delta };
}
