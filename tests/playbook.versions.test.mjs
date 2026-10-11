import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_TRADES_FOR_VERSION_VERDICT,
  VERSIONED_FIELDS,
  compareVersions,
  getTradesForVersion,
  summarizeVersionPerformance,
  createVersionRecord,
  diffVersions,
  getCurrentVersions,
  getTradeVersionStamp,
  getVersionHistory,
  getVersionedSnapshot,
  hasVersionableChange,
} from '../src/lib/playbook/versions.js';

const SETUP = {
  id: 's1',
  name: 'Double Top Short',
  direction: 'short',
  entry_criteria: [{ text: 'Second high lower', grade: 'A+' }],
  expected_r_profile: { min: 1, target: 2, stretch: 3 },
  risk_percent: 100,
};

test('a version is cut on the rules, not on how a setup is presented', () => {
  const fields = VERSIONED_FIELDS.map(([field]) => field);
  for (const rule of ['entry_criteria', 'expected_r_profile', 'risk_percent', 'trigger_spec']) {
    assert.ok(fields.includes(rule), `${rule} decides outcomes and must be versioned`);
  }
  for (const presentation of ['name', 'description', 'images', 'journal_template', 'is_active']) {
    assert.ok(!fields.includes(presentation), `${presentation} cannot change an outcome`);
  }
});

test('the snapshot holds every versioned field, present or not', () => {
  const snapshot = getVersionedSnapshot({ id: 's1' });
  assert.deepEqual(Object.keys(snapshot).sort(), VERSIONED_FIELDS.map(([f]) => f).sort());
  assert.equal(snapshot.entry_criteria, null);
});

test('changing a rule is a change; renaming or re-describing is not', () => {
  assert.equal(hasVersionableChange(SETUP, { ...SETUP, risk_percent: 50 }), true);
  assert.equal(hasVersionableChange(SETUP, { ...SETUP, name: 'DT Short', description: 'new' }), false);
  assert.equal(hasVersionableChange(SETUP, { ...SETUP }), false);
});

test('key order is not a change', () => {
  const reordered = { ...SETUP, expected_r_profile: { stretch: 3, target: 2, min: 1 } };
  assert.equal(hasVersionableChange(SETUP, reordered), false);
});

test('the diff names what changed, in words a trader recognises', () => {
  const changes = diffVersions(SETUP, {
    ...SETUP,
    risk_percent: 150,
    expected_r_profile: { min: 1, target: 2.5, stretch: 3 },
  });

  assert.deepEqual(changes.map((c) => c.field).sort(), ['expected_r_profile', 'risk_percent']);
  assert.ok(changes.some((c) => c.label === 'Risk %'));
});

test('the first version records where a setup started', () => {
  const record = createVersionRecord(SETUP, null, new Date('2026-09-20T12:00:00Z'));
  assert.equal(record.version, 1);
  assert.equal(record.summary, 'Created');
  assert.deepEqual(record.changes, []);
  assert.equal(record.setup_id, 's1');
  assert.equal(record.setup_name, 'Double Top Short');
  assert.equal(record.snapshot.risk_percent, 100);
  assert.equal(record.created_date, '2026-09-20T12:00:00.000Z');
});

test('each later version counts up and says what changed from the last', () => {
  const first = createVersionRecord(SETUP, null);
  const second = createVersionRecord({ ...SETUP, risk_percent: 50 }, first);

  assert.equal(second.version, 2);
  assert.equal(second.summary, 'Risk %');
  assert.deepEqual(second.changes.map((c) => c.field), ['risk_percent']);
  // The snapshot stands alone, so a version can be read without replaying edits.
  assert.equal(second.snapshot.risk_percent, 50);
});

test('the live version of each setup is its highest, whatever order they arrive in', () => {
  const versions = [
    { id: 'v2', setup_id: 's1', version: 2 },
    { id: 'v1', setup_id: 's1', version: 1 },
    { id: 'o1', setup_id: 's2', version: 1 },
  ];

  const current = getCurrentVersions(versions);
  assert.equal(current.get('s1').id, 'v2');
  assert.equal(current.get('s2').id, 'o1');
  assert.equal(current.size, 2);
  // A version with no setup belongs to nothing and is ignored.
  assert.equal(getCurrentVersions([{ version: 3 }]).size, 0);
});

test("a setup's history reads oldest first", () => {
  const versions = [
    { setup_id: 's1', version: 3 },
    { setup_id: 's2', version: 1 },
    { setup_id: 's1', version: 1 },
    { setup_id: 's1', version: 2 },
  ];

  assert.deepEqual(getVersionHistory(versions, 's1').map((v) => v.version), [1, 2, 3]);
  assert.deepEqual(getVersionHistory(versions, ''), []);
});

test('a trade is stamped with the version live when it was taken', () => {
  const stamp = getTradeVersionStamp(SETUP, { id: 'v4', version: 4 });
  assert.deepEqual(stamp, { setup_version: 4, setup_version_id: 'v4' });
});

test('a trade on no setup, or a setup with no version yet, carries no stamp', () => {
  assert.deepEqual(getTradeVersionStamp(null, { id: 'v4', version: 4 }), {
    setup_version: null, setup_version_id: null,
  });
  assert.deepEqual(getTradeVersionStamp(SETUP, null), {
    setup_version: null, setup_version_id: null,
  });
});

const scoredVersion = (version, trades, avgR) => ({
  version, trades, avgR, hasEnough: trades >= MIN_TRADES_FOR_VERSION_VERDICT,
});

test('a trade belongs to the version it was stamped with', () => {
  const version = { id: 'v2', setup_id: 's1', version: 2 };
  const trades = [
    { id: 'a', setup_version_id: 'v2' },
    { id: 'b', setup_version_id: 'v1' },
    // Stamped before ids were recorded: matched on setup and number instead.
    { id: 'c', trade_plan_id: 's1', setup_version: 2 },
    { id: 'd', trade_plan_id: 's9', setup_version: 2 },
  ];

  assert.deepEqual(getTradesForVersion(trades, version).map((t) => t.id), ['a', 'c']);
});

test('each version is scored only on the trades it allowed', () => {
  const versions = [
    { id: 'v1', setup_id: 's1', version: 1, summary: 'Created' },
    { id: 'v2', setup_id: 's1', version: 2, summary: 'Risk %' },
  ];
  const trades = [
    { setup_version_id: 'v1', r_multiple: -1, pnl: -100 },
    { setup_version_id: 'v1', r_multiple: 1, pnl: 100 },
    { setup_version_id: 'v2', r_multiple: 2, pnl: 200 },
  ];

  const [first, second] = summarizeVersionPerformance(trades, versions, 's1');
  assert.equal(first.trades, 2);
  assert.equal(first.avgR, 0);
  assert.equal(first.winRate, 50);
  assert.equal(first.isCurrent, false);
  assert.equal(second.avgR, 2);
  assert.equal(second.isCurrent, true);
});

test('a version with too few trades is not judged either way', () => {
  const verdict = compareVersions(scoredVersion(2, 3, 2), scoredVersion(1, 40, 0.1));
  assert.equal(verdict.key, 'insufficient');
  assert.match(verdict.detail, /3 of 10/);
});

test('a rule change is called better or worse only once both versions have a sample', () => {
  assert.equal(compareVersions(scoredVersion(2, 12, 0.8), scoredVersion(1, 20, 0.2)).key, 'better');
  assert.equal(compareVersions(scoredVersion(2, 12, 0.1), scoredVersion(1, 20, 0.9)).key, 'worse');
});

test('a difference inside a tenth of an R is noise, not an improvement', () => {
  assert.equal(compareVersions(scoredVersion(2, 15, 0.55), scoredVersion(1, 15, 0.5)).key, 'similar');
});

test('the first version has nothing to be compared against', () => {
  assert.equal(compareVersions(scoredVersion(1, 20, 0.5), null).key, 'insufficient');
});
