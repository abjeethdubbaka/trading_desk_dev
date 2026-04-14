import test from 'node:test';
import assert from 'node:assert/strict';
import { CalcHistoryService } from '../src/lib/services/CalcHistoryService.js';

function createLocalStorageMock() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

test.beforeEach(() => {
  globalThis.localStorage = createLocalStorageMock();
});

test.afterEach(() => {
  delete globalThis.localStorage;
});

test('create enriches and validates calc history records', async () => {
  const service = new CalcHistoryService({});

  const created = await service.create({
    symbol: 'AAPL',
  });

  assert.ok(created.id);
  assert.equal(created.symbol, 'AAPL');
  assert.equal(created.calculation_type, 'position_size');
  assert.ok(Number.isFinite(Date.parse(created.timestamp)));
  assert.ok(Number.isFinite(Date.parse(created.created_at)));

  const all = await service.list();
  assert.equal(all.length, 1);
});

test('supports getByType, getBySymbol, getRecent and date aliases', async () => {
  const service = new CalcHistoryService({});

  await service.create({
    symbol: 'AAPL',
    calculation_type: 'position_size',
    timestamp: '2026-02-01T10:30:00.000Z',
  });

  await service.create({
    symbol: 'MSFT',
    calculation_type: 'risk_plan',
    timestamp: '2026-02-02T11:00:00.000Z',
  });

  const byType = await service.getByType('position_size');
  assert.equal(byType.length, 1);
  assert.equal(byType[0].symbol, 'AAPL');

  const bySymbol = await service.getBySymbol('msft');
  assert.equal(bySymbol.length, 1);
  assert.equal(bySymbol[0].calculation_type, 'risk_plan');

  const recent = await service.getRecent(1);
  assert.equal(recent.length, 1);
  assert.equal(recent[0].symbol, 'MSFT');

  const inDateRange = await service.list({
    date_from: '2026-02-01',
    date_to: '2026-02-01',
  });
  assert.equal(inDateRange.length, 1);
  assert.equal(inDateRange[0].symbol, 'AAPL');
});
