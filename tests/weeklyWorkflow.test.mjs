import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveFocusLines,
  getIsoWeekKey,
  toWorkflowEntry,
} from '../src/lib/review/weeklyWorkflow.js';

test('a week is identified by its ISO week key', () => {
  assert.equal(getIsoWeekKey(new Date(2026, 8, 21)), '2026-W39');
  // Sunday belongs to the week that is ending, not the one starting.
  assert.equal(getIsoWeekKey(new Date(2026, 8, 20)), '2026-W38');
});

test('a stored workflow reads back with every field, whatever was saved', () => {
  const entry = toWorkflowEntry({ nextFocus: 'Wait for confirmation' });
  assert.equal(entry.nextFocus, 'Wait for confirmation');
  assert.equal(entry.wins, '');
  assert.equal(toWorkflowEntry().improvements, '');
});

test('this week reads the goals it set for itself', () => {
  const store = { '2026-W39': { nextFocus: 'Size for the stop\nNo trades before 9:45' } };
  assert.deepEqual(getActiveFocusLines(store, '2026-W39'), ['Size for the stop', 'No trades before 9:45']);
});

test("last week's Next Week Focus is this week's focus", () => {
  const store = {
    '2026-W37': { nextFocus: 'Stale goal' },
    '2026-W38': { nextFocus: 'Cut losers at the stop' },
    '2026-W39': { nextFocus: '' },
  };
  assert.deepEqual(getActiveFocusLines(store, '2026-W39'), ['Cut losers at the stop']);
});

test('goals are read however they were typed: bullets, numbers or semicolons', () => {
  const store = { '2026-W39': { nextFocus: '- Wait for the retest\n2) Respect the daily max; Journal every trade' } };
  assert.deepEqual(getActiveFocusLines(store, '2026-W39'), [
    'Wait for the retest', 'Respect the daily max', 'Journal every trade',
  ]);
});

test('no goals written means nothing to show', () => {
  assert.deepEqual(getActiveFocusLines({}, '2026-W39'), []);
  assert.deepEqual(getActiveFocusLines({ '2026-W39': { nextFocus: '   ' } }, '2026-W39'), []);
  // A later week's goals are not this week's.
  assert.deepEqual(getActiveFocusLines({ '2026-W40': { nextFocus: 'Future' } }, '2026-W39'), []);
});
