import test from 'node:test';
import assert from 'node:assert/strict';
import { describeTrade, getLocalDateKey, getTradesForDay, partitionReviews } from '../src/lib/reviews/utils.js';

test('the day is the trader\'s own, not UTC', () => {
  // 9pm on the 21st is still the 21st, even though UTC has moved on in a
  // negative-offset timezone.
  const evening = new Date(2026, 8, 21, 21, 30);
  assert.equal(getLocalDateKey(evening), '2026-09-21');
  assert.equal(getLocalDateKey(new Date(2026, 0, 5, 0, 30)), '2026-01-05');
});

test("today's cards and the earlier ones are kept apart", () => {
  const reviews = [
    { id: 'a', date: '2026-09-21' },
    { id: 'b', date: '2026-09-18' },
    { id: 'c', date: '2026-09-21' },
    { id: 'd', date: '2026-09-20' },
  ];

  const { today, past } = partitionReviews(reviews, '2026-09-21');
  assert.deepEqual(today.map((r) => r.id), ['a', 'c']);
  assert.deepEqual(past.map((r) => r.id), ['d', 'b']);
});

test('cards saved before the day was recorded are still shown, as history', () => {
  const { today, past } = partitionReviews([{ id: 'old' }, { id: 'now', date: '2026-09-21' }], '2026-09-21');
  assert.deepEqual(today.map((r) => r.id), ['now']);
  assert.deepEqual(past.map((r) => r.id), ['old']);
});

test('an empty journal splits into nothing without complaint', () => {
  assert.deepEqual(partitionReviews([], '2026-09-21'), { today: [], past: [] });
  assert.deepEqual(partitionReviews(null, '2026-09-21'), { today: [], past: [] });
});

test('the picker offers the trades taken that day, newest first', () => {
  const trades = [
    { id: 'a', symbol: 'TSLA', entry_time: new Date(2026, 8, 26, 9, 45).toISOString() },
    { id: 'b', symbol: 'NVDA', entry_time: new Date(2026, 8, 26, 14, 10).toISOString() },
    { id: 'c', symbol: 'AAPL', entry_time: new Date(2026, 8, 25, 10, 0).toISOString() },
    { id: 'd', symbol: 'MU' },
  ];

  assert.deepEqual(getTradesForDay(trades, '2026-09-26').map((t) => t.id), ['b', 'a']);
  assert.deepEqual(getTradesForDay(trades, ''), []);
});

test('a trade created without an entry time falls back to when it was logged', () => {
  const trades = [{ id: 'a', created_date: new Date(2026, 8, 26, 11, 0).toISOString() }];
  assert.equal(getTradesForDay(trades, '2026-09-26').length, 1);
});

test('a referenced trade reads as something recognisable months later', () => {
  const label = describeTrade({
    symbol: 'tsla',
    entry_time: new Date(2026, 8, 26, 9, 45).toISOString(),
    pnl: 240.4,
    r_multiple: 2,
  });

  assert.match(label, /^TSLA · /);
  assert.match(label, /\+\$240/);
  assert.match(label, /\+2R/);
});

test('a trade with nothing but a symbol still reads', () => {
  assert.equal(describeTrade({ symbol: 'mu' }), 'MU');
  assert.equal(describeTrade(null), '');
});
