import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE_SLOTS,
  getGradeLetters,
  groupTradesByDay,
  isInPeriod,
  matchesTradeFilters,
  parseFilterKeys,
  serializeFilterKeys,
  summarizeDay,
  toDayKey,
} from '../src/lib/journal/dayGroups.js';

const at = (y, m, d, h = 10) => new Date(y, m - 1, d, h).toISOString();

test('a day key is the trader\'s local day', () => {
  assert.equal(toDayKey(new Date(2026, 8, 26, 21, 30)), '2026-09-26');
  assert.equal(toDayKey(new Date('nonsense')), '');
  assert.equal(toDayKey(null), '');
});

test('trades group by day in the order they arrive, each day carrying its result', () => {
  const groups = groupTradesByDay([
    { id: 'a', entry_time: at(2026, 9, 26, 9), pnl: 120, r_multiple: 2 },
    { id: 'b', entry_time: at(2026, 9, 26, 11), pnl: -60, r_multiple: -1 },
    { id: 'c', entry_time: at(2026, 9, 25, 10), pnl: 40, r_multiple: 0.5 },
  ]);

  assert.deepEqual(groups.map((g) => g.key), ['2026-09-26', '2026-09-25']);
  assert.deepEqual(groups[0].trades.map((t) => t.id), ['a', 'b']);
  assert.equal(groups[0].pnl, 60);
  assert.equal(groups[0].wins, 1);
  assert.equal(groups[0].avgR, 0.5);
  assert.equal(groups[1].count, 1);
});

test('a sort by something other than date still groups by day', () => {
  // Sorted by P&L descending: days interleave, but each day is one group.
  const groups = groupTradesByDay([
    { id: 'a', entry_time: at(2026, 9, 26), pnl: 300 },
    { id: 'c', entry_time: at(2026, 9, 25), pnl: 200 },
    { id: 'b', entry_time: at(2026, 9, 26), pnl: 100 },
  ]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].trades.map((t) => t.id), ['a', 'b']);
});

test('a trade with no date is kept, under its own heading', () => {
  const groups = groupTradesByDay([{ id: 'x', pnl: 10 }]);
  assert.equal(groups[0].key, 'undated');
  assert.equal(groups[0].date, null);
});

test('a day with no R multiples reports no average rather than zero', () => {
  assert.equal(summarizeDay([{ pnl: 10 }, { pnl: -5 }]).avgR, null);
  assert.deepEqual(summarizeDay([]), { count: 0, pnl: 0, wins: 0, avgR: null });
});

test('grades come out as one row of letters in a fixed order, gaps kept', () => {
  const letters = getGradeLetters({ entry_grade: 'A+', exit_grade: 'B' });
  assert.deepEqual(letters.map((l) => l.grade), ['A+', null, 'B', null]);
  assert.equal(GRADE_SLOTS.length, 4);
});

test('filters combine, and a dropdown-era preset still loads', () => {
  const trades = [
    { id: 'w', pnl: 50, direction: 'long' },
    { id: 'l', pnl: -50, direction: 'short', is_oversized: true },
    { id: 'n', pnl: 20, direction: 'short' },
  ];
  const journaled = new Set(['w']);

  const pick = (keys) => trades.filter((t) => matchesTradeFilters(t, parseFilterKeys(keys), journaled)).map((t) => t.id);
  assert.deepEqual(pick('all'), ['w', 'l', 'n']);
  assert.deepEqual(pick('winners'), ['w', 'n']);
  assert.deepEqual(pick('losers,short'), ['l']);
  assert.deepEqual(pick('oversized'), ['l']);
  assert.deepEqual(pick('notDebriefed'), ['l', 'n']);
  assert.deepEqual(pick(['short', 'winners']), ['n']);
});

test('filter keys round-trip through the string presets store', () => {
  assert.equal(serializeFilterKeys(new Set()), 'all');
  assert.equal(serializeFilterKeys(new Set(['losers', 'short'])), 'losers,short');
  assert.deepEqual([...parseFilterKeys('losers,short,bogus')], ['losers', 'short']);
  assert.equal(parseFilterKeys('all').size, 0);
});

test('periods are measured from now, with the week starting on Monday', () => {
  const now = new Date(2026, 8, 23, 12); // Wednesday 23 Sep 2026
  const d = (y, m, day) => new Date(y, m - 1, day, 10);

  assert.equal(isInPeriod(d(2026, 9, 23), 'today', now), true);
  assert.equal(isInPeriod(d(2026, 9, 22), 'today', now), false);
  assert.equal(isInPeriod(d(2026, 9, 21), 'week', now), true);   // Monday
  assert.equal(isInPeriod(d(2026, 9, 20), 'week', now), false);  // Sunday before
  assert.equal(isInPeriod(d(2026, 9, 1), 'month', now), true);
  assert.equal(isInPeriod(d(2026, 8, 31), 'month', now), false);
  assert.equal(isInPeriod(d(2026, 7, 1), '3m', now), true);
  assert.equal(isInPeriod(d(2026, 6, 1), '3m', now), false);
  assert.equal(isInPeriod(d(2026, 1, 2), 'ytd', now), true);
  assert.equal(isInPeriod(d(2025, 12, 31), 'ytd', now), false);
  assert.equal(isInPeriod(d(2026, 8, 15), 'lastMonth', now), true);
  assert.equal(isInPeriod(d(2026, 8, 15), 'all', now), true);
  assert.equal(isInPeriod(null, 'today', now), false);
});
