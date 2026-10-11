import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUndebriefedTrades,
  getUnreviewedDays,
  toLocalDateKey,
} from '../src/lib/dashboard/attention.js';

// Local times, so the tests hold in any timezone.
const NOW = new Date(2026, 8, 25, 15, 0); // Fri 25 Sep 2026
const at = (day, hour = 10) => new Date(2026, 8, day, hour, 0).toISOString();

const TRADES = [
  { id: 't1', entry_time: at(25), setup_type: 'ORB', pnl: 50 }, // today
  { id: 't2', entry_time: at(24), setup_type: 'ORB', pnl: -20 },
  { id: 't3', entry_time: at(24, 11), setup_type: '', pnl: 70 },
  { id: 't4', entry_time: at(22), setup_type: 'VWAP', pnl: 10 },
  { id: 't5', entry_time: at(1), setup_type: 'ORB', pnl: 99 }, // outside the window
];

test('unreviewed days are past days in the window with no report card', () => {
  const days = getUnreviewedDays(TRADES, new Set(['2026-09-22']), { now: NOW });
  assert.deepEqual(days.map((d) => d.key), ['2026-09-24']);
  assert.equal(days[0].count, 2);
  assert.equal(days[0].pnl, 50);
});

test('today is never listed as unreviewed while it is still being traded', () => {
  const days = getUnreviewedDays(TRADES, new Set(), { now: NOW });
  assert.ok(!days.some((d) => d.key === toLocalDateKey(NOW)));
  assert.deepEqual(days.map((d) => d.key), ['2026-09-24', '2026-09-22']);
});

test('trades owe a debrief only when they have a setup and none is written', () => {
  const owed = getUndebriefedTrades(TRADES, new Set(['t2']), { now: NOW });
  assert.deepEqual(owed.map((t) => t.id), ['t1', 't4']);
});

test('nothing is owed on an empty or undated history', () => {
  assert.deepEqual(getUnreviewedDays([], new Set(), { now: NOW }), []);
  assert.deepEqual(getUndebriefedTrades([{ id: 'x', setup_type: 'ORB' }], new Set(), { now: NOW }), []);
});
