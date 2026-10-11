import test from 'node:test';
import assert from 'node:assert/strict';
import { selectTrades } from '../src/lib/db/adapters/firebase-simple/trades.js';

// As the collection is read: newest entry first.
const TRADES = [
  { id: 'a', entry_time: '2026-09-25T14:00:00Z', account_tier: '25K', account_type: 'live', symbol: 'AAPL', pnl: 120 },
  { id: 'b', entry_time: '2026-09-24T14:00:00Z', account_tier: '25K', symbol: 'TSLA', pnl: -80 },
  { id: 'c', entry_time: '2026-09-23T14:00:00Z', account_tier: '5K', account_type: 'live', symbol: 'AAPL', pnl: 40 },
  { id: 'd', entry_time: '2026-09-22T14:00:00Z', account_tier: '25K', account_type: 'live', symbol: 'NVDA' },
];

const ids = (trades) => trades.map((t) => t.id);

test('no filters returns the list as read, newest first', () => {
  assert.deepEqual(ids(selectTrades(TRADES)), ['a', 'b', 'c', 'd']);
});

test('tier, account type and symbol narrow the shared list', () => {
  assert.deepEqual(ids(selectTrades(TRADES, { account_tier: '25K' })), ['a', 'b', 'd']);
  // A trade with no account type is a demo trade.
  assert.deepEqual(ids(selectTrades(TRADES, { account_type: 'demo' })), ['b']);
  assert.deepEqual(ids(selectTrades(TRADES, { symbol: 'aapl', account_type: 'live' })), ['a', 'c']);
});

test('another sort reorders, with blank values kept last either way', () => {
  assert.deepEqual(ids(selectTrades(TRADES, { sortBy: 'pnl', sortDir: 'desc' })), ['a', 'c', 'b', 'd']);
  assert.deepEqual(ids(selectTrades(TRADES, { sortBy: 'pnl', sortDir: 'asc' })), ['b', 'c', 'a', 'd']);
  assert.deepEqual(ids(selectTrades(TRADES, { sortDir: 'asc' })), ['d', 'c', 'b', 'a']);
});

test('limit and date range apply after filtering', () => {
  assert.deepEqual(ids(selectTrades(TRADES, { account_tier: '25K', limit: 2 })), ['a', 'b']);
  assert.deepEqual(ids(selectTrades(TRADES, { date_from: '2026-09-23T00:00:00Z', date_to: '2026-09-24T23:00:00Z' })), ['b', 'c']);
});

test('the shared list is never modified by a view of it', () => {
  const before = ids(TRADES);
  selectTrades(TRADES, { sortBy: 'pnl', sortDir: 'asc' });
  assert.deepEqual(ids(TRADES), before);
});
