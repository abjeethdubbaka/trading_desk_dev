import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcDataPointR,
  calcDataPointMfeR,
  getDataPointDirection,
  getExitLevelR,
  getConfiguredExitLevels,
  getHighestLevelReached,
  getRiskVerdict,
  summarizeDataPoints,
  groupDataPointsByStrategy,
  normalizeDataPoint,
  tradeToDataPoint,
  dataPointSignature,
  selectDataPointsForStrategies,
  MIN_SAMPLES_FOR_VERDICT,
} from '../src/lib/dataPoints/utils.js';

const PROFILE = { min: 1, target: 2, stretch: 3 };

const reached = (levels) => ({ levels_reached: levels });
const stoppedOut = () => reached({ min: false, target: false, stretch: false });

test('getExitLevelR resolves each rung against the setup profile', () => {
  assert.equal(getExitLevelR('min', PROFILE), 1);
  assert.equal(getExitLevelR('target', PROFILE), 2);
  assert.equal(getExitLevelR('stretch', PROFILE), 3);
  assert.equal(getExitLevelR('nonsense', PROFILE), null);
});

test('getExitLevelR returns null for a rung the setup has not configured', () => {
  assert.equal(getExitLevelR('stretch', { min: 1, target: 2 }), null);
});

test('getConfiguredExitLevels asks only about rungs the setup actually defines', () => {
  assert.deepEqual(getConfiguredExitLevels({ target: 2 }).map((l) => l.key), ['target']);
  assert.deepEqual(getConfiguredExitLevels(PROFILE).map((l) => l.key), ['min', 'target', 'stretch']);
  assert.deepEqual(getConfiguredExitLevels(null), []);
});

test('getHighestLevelReached returns the furthest rung answered yes', () => {
  assert.equal(getHighestLevelReached(reached({ min: true, target: true, stretch: false })), 'target');
  assert.equal(getHighestLevelReached(reached({ min: true })), 'min');
  assert.equal(getHighestLevelReached(stoppedOut()), null);
  assert.equal(getHighestLevelReached(reached({})), null);
});

test('calcDataPointR scores a manual point from the highest rung it reached', () => {
  assert.equal(calcDataPointR(reached({ min: true, target: true }), PROFILE), 2);
  assert.equal(calcDataPointR(reached({ min: true }), PROFILE), 1);
  assert.equal(calcDataPointR(reached({ min: true, target: true, stretch: true }), PROFILE), 3);
});

test('calcDataPointR treats "no" on every rung as a stop-out of -1R', () => {
  assert.equal(calcDataPointR(stoppedOut(), PROFILE), -1);
});

test('calcDataPointR returns null while the rungs are still unanswered', () => {
  assert.equal(calcDataPointR(reached({}), PROFILE), null);
  // A partial "no" is not yet a stop-out — the higher rungs are unanswered.
  assert.equal(calcDataPointR(reached({ min: false }), PROFILE), null);
});

test("calcDataPointR prefers a trade's realized R over the rung bucket", () => {
  const point = { source: 'trade', levels_reached: { target: true }, r_multiple: 1.4 };
  assert.equal(calcDataPointR(point, PROFILE), 1.4);
});

test('calcDataPointMfeR reads how far the move ran in your favour', () => {
  assert.equal(calcDataPointMfeR({ mfe_r: 2.55 }), 2.55);
  assert.equal(calcDataPointMfeR({ mfe_r: 'nope' }), null);
  assert.equal(calcDataPointMfeR({}), null);
});

test('getDataPointDirection infers long/short from where the stop sits', () => {
  assert.equal(getDataPointDirection({ entry: 10, stop_loss: 9 }), 'long');
  assert.equal(getDataPointDirection({ entry: 10, stop_loss: 11 }), 'short');
  assert.equal(getDataPointDirection({ entry: 10, stop_loss: 10 }), null);
  // An explicit direction (as trades carry) wins over inference.
  assert.equal(getDataPointDirection({ direction: 'short', entry: 10, stop_loss: 9 }), 'short');
});

test('tradeToDataPoint maps a logged trade onto the data point shape', () => {
  const point = tradeToDataPoint({
    id: 't1',
    setup_type: 'ORB',
    entry_price: 10,
    stop_loss: 9,
    r_multiple: 2.5,
    mfe_r_multiple: 3.2,
    direction: 'long',
    symbol: 'AAPL',
    exit_target_r_taken: true,
  });

  assert.equal(point.source, 'trade');
  assert.equal(point.id, 'trade-t1');
  assert.equal(point.strategy, 'ORB');
  assert.equal(point.r_multiple, 2.5);
  assert.equal(point.mfe_r, 3.2);
  assert.equal(getHighestLevelReached(point), 'target');
});

test("tradeToDataPoint carries each rung's yes/no answer across", () => {
  const point = tradeToDataPoint({
    id: 't', setup_type: 'ORB',
    exit_min_r_taken: true, exit_target_r_taken: false,
  });

  assert.equal(point.levels_reached.min, true);
  assert.equal(point.levels_reached.target, false);
  // Never answered in Add Trade stays unanswered here, not a false.
  assert.equal(point.levels_reached.stretch, null);
});

test('summarizeDataPoints blends study points and trades, tracking each source', () => {
  const summary = summarizeDataPoints([
    reached({ target: true }),           // +2R study
    stoppedOut(),                        // -1R study
    { source: 'trade', r_multiple: 2 },  // +2R trade
  ], PROFILE);

  assert.equal(summary.scored, 3);
  assert.equal(summary.manualCount, 2);
  assert.equal(summary.tradeCount, 1);
  assert.equal(summary.medianR, 2);
  assert.equal(summary.expectancy, 1);
  assert.equal(summary.bestR, 2);
  assert.equal(summary.worstR, -1);
  assert.equal(summary.winRate, 66.7);
});

test('summarizeDataPoints reports median MFE and the gap left on the table', () => {
  const summary = summarizeDataPoints([
    { ...reached({ min: true }), mfe_r: 3 },   // took 1R, offered 3R
    { ...reached({ min: true }), mfe_r: 3 },
  ], PROFILE);

  assert.equal(summary.medianR, 1);
  assert.equal(summary.medianMfeR, 3);
  assert.equal(summary.mfeScored, 2);
  assert.equal(summary.mfeGap, 2);
});

test('summarizeDataPoints leaves MFE null when none was recorded', () => {
  const summary = summarizeDataPoints([reached({ target: true })], PROFILE);
  assert.equal(summary.medianMfeR, null);
  assert.equal(summary.mfeGap, null);
});

test('summarizeDataPoints ignores observations that cannot be scored', () => {
  const summary = summarizeDataPoints([reached({ target: true }), reached({})], PROFILE);
  assert.equal(summary.count, 2);
  assert.equal(summary.scored, 1);
});

test('summarizeDataPoints handles an empty sample without dividing by zero', () => {
  const summary = summarizeDataPoints([], PROFILE);
  assert.equal(summary.scored, 0);
  assert.equal(summary.expectancy, null);
  assert.equal(summary.medianR, null);
});

test('getRiskVerdict withholds a call until there are enough observations', () => {
  const verdict = getRiskVerdict(summarizeDataPoints([reached({ target: true })], PROFILE), PROFILE);
  assert.equal(verdict.key, 'insufficient');
  assert.match(verdict.detail, new RegExp(String(MIN_SAMPLES_FOR_VERDICT)));
});

test('getRiskVerdict says to size up when expectancy meets the target', () => {
  const points = Array.from({ length: 10 }, () => reached({ target: true })); // +2R each
  assert.equal(getRiskVerdict(summarizeDataPoints(points, PROFILE), PROFILE).key, 'increase');
});

test('getRiskVerdict says to cut risk when the setup loses money', () => {
  const points = Array.from({ length: 10 }, () => stoppedOut()); // -1R each
  assert.equal(getRiskVerdict(summarizeDataPoints(points, PROFILE), PROFILE).key, 'reduce');
});

test('getRiskVerdict cuts risk when expectancy is positive but too thin to cover costs', () => {
  // 3 winners at +1R, 7 stop-outs at -1R → expectancy -0.4R
  const points = [
    ...Array.from({ length: 3 }, () => reached({ min: true })),
    ...Array.from({ length: 7 }, () => stoppedOut()),
  ];
  assert.equal(getRiskVerdict(summarizeDataPoints(points, PROFILE), PROFILE).key, 'reduce');
});

test('getRiskVerdict holds when expectancy is healthy but short of target', () => {
  // 8 winners at +1R, 2 stop-outs at -1R → expectancy 0.6R against a 2R target
  const points = [
    ...Array.from({ length: 8 }, () => reached({ min: true })),
    ...Array.from({ length: 2 }, () => stoppedOut()),
  ];
  assert.equal(getRiskVerdict(summarizeDataPoints(points, PROFILE), PROFILE).key, 'hold');
});

test('groupDataPointsByStrategy keys case-insensitively and drops unnamed points', () => {
  const grouped = groupDataPointsByStrategy([
    { strategy: 'ORB', ...reached({ target: true }) },
    { strategy: ' orb ', ...reached({ min: true }) },
    { strategy: '', ...reached({ min: true }) },
  ]);

  assert.equal(grouped.size, 1);
  assert.equal(grouped.get('orb').length, 2);
});

test('normalizeDataPoint coerces numbers, validates answers, and keeps real images', () => {
  const point = normalizeDataPoint({
    strategy: '  ORB  ',
    entry: '10.5',
    stop_loss: 'not-a-number',
    mfe_r: '2.5',
    levels_reached: { min: true, target: 'yes' },
    images: ['data:image/png;base64,abc', '', null, 42],
  });

  assert.equal(point.strategy, 'ORB');
  assert.equal(point.entry, 10.5);
  assert.equal(point.stop_loss, null);
  assert.equal(point.mfe_r, 2.5);
  assert.equal(point.levels_reached.min, true);
  // A non-boolean answer is not trusted as a yes.
  assert.equal(point.levels_reached.target, null);
  assert.deepEqual(point.images, ['data:image/png;base64,abc']);
});

test('dataPointSignature ignores id and date so a re-import is not a duplicate', () => {
  const a = { id: 'a', created_date: '2026-01-01', strategy: 'ORB', entry: 10, stop_loss: 9, mfe_r: 2, note: 'clean' };
  const b = { id: 'b', created_date: '2026-05-05', strategy: 'orb', entry: 10, stop_loss: 9, mfe_r: 2, note: 'clean' };
  assert.equal(dataPointSignature(a), dataPointSignature(b));
});

test('dataPointSignature separates points that differ in what they recorded', () => {
  const base = { strategy: 'ORB', entry: 10, stop_loss: 9 };
  assert.notEqual(dataPointSignature(base), dataPointSignature({ ...base, mfe_r: 2 }));
  assert.notEqual(dataPointSignature(base), dataPointSignature({ ...base, note: 'late' }));
  assert.notEqual(
    dataPointSignature({ ...base, levels_reached: { min: true } }),
    dataPointSignature({ ...base, levels_reached: { min: false } })
  );
});

test('selectDataPointsForStrategies keeps only the exported setups own points', () => {
  const points = [
    { strategy: 'ORB' },
    { strategy: ' orb ' },
    { strategy: 'VWAP Pullback' },
    { strategy: 'Retired Setup' },
  ];

  const picked = selectDataPointsForStrategies(points, ['orb', 'VWAP Pullback']);
  assert.equal(picked.length, 3);
  assert.deepEqual(selectDataPointsForStrategies(points, []), []);
});

test('a data point records where it was closed, alongside entry and stop', () => {
  const point = normalizeDataPoint({ entry: '10.5', stop_loss: '9.8', exit: '12.25' });
  assert.equal(point.entry, 10.5);
  assert.equal(point.stop_loss, 9.8);
  assert.equal(point.exit, 12.25);
  assert.equal(normalizeDataPoint({}).exit, null);
});

test('a trade brings its exit price across with it', () => {
  const point = tradeToDataPoint({ id: 't1', setup_type: 'ORB', entry_price: 10, stop_loss: 9, exit_price: 12 });
  assert.equal(point.exit, 12);
});
