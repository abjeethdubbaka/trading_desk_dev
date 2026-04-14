import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTradeListOptions,
  applyTradeClientFilters,
  isLikelyFirestoreIndexError,
} from '../src/lib/db/adapters/firebase-simple/trades.js';

test('normalizeTradeListOptions normalizes filter and sort values', () => {
  const normalized = normalizeTradeListOptions({
    symbol: ' aapl ',
    direction: ' LONG ',
    sortBy: 'pnl',
    sortDir: 'asc',
    limit: '25',
  });

  assert.equal(normalized.symbol, 'AAPL');
  assert.equal(normalized.direction, 'long');
  assert.equal(normalized.sortBy, 'pnl');
  assert.equal(normalized.sortDir, 'asc');
  assert.equal(normalized.limit, 25);
});

test('normalizeTradeListOptions uses entry_time sorting when date range is present', () => {
  const normalized = normalizeTradeListOptions({
    sortBy: 'pnl',
    date_from: '2026-03-01',
    date_to: '2026-03-05',
  });

  assert.equal(normalized.sortBy, 'entry_time');
  assert.ok(normalized.date_from.endsWith('Z'));
  assert.ok(normalized.date_to.endsWith('Z'));
});

test('normalizeTradeListOptions normalizes cursor values for pagination', () => {
  const normalized = normalizeTradeListOptions({
    sortBy: 'entry_time',
    after: '2026-03-03',
    limit: 20,
  });

  assert.equal(normalized.limit, 20);
  assert.ok(normalized.after.endsWith('Z'));
});

test('applyTradeClientFilters filters by symbol, setup and date bounds', () => {
  const trades = [
    {
      id: '1',
      symbol: 'AAPL',
      direction: 'long',
      setup_type: 'Breakout',
      entry_time: '2026-03-01T10:00:00.000Z',
    },
    {
      id: '2',
      symbol: 'AAPL',
      direction: 'short',
      setup_type: 'Reversal',
      entry_time: '2026-03-02T10:00:00.000Z',
    },
    {
      id: '3',
      symbol: 'MSFT',
      direction: 'long',
      setup_type: 'Breakout',
      entry_time: '2026-03-02T11:00:00.000Z',
    },
  ];

  const filtered = applyTradeClientFilters(trades, {
    symbol: 'aapl',
    setup_type: 'Reversal',
    date_from: '2026-03-02',
    date_to: '2026-03-02',
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, '2');
});

test('isLikelyFirestoreIndexError detects missing-index failures', () => {
  assert.equal(
    isLikelyFirestoreIndexError({
      code: 'failed-precondition',
      message: 'The query requires an index. You can create it here.',
    }),
    true
  );

  assert.equal(
    isLikelyFirestoreIndexError({
      code: 'permission-denied',
      message: 'Missing or insufficient permissions.',
    }),
    false
  );
});
