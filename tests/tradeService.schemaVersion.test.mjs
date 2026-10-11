import test from 'node:test';
import assert from 'node:assert/strict';
import { createTradeCRUD } from '../src/lib/services/TradeService/crud.js';
import { CURRENT_TRADE_SCHEMA_VERSION } from '../src/lib/schema/index.js';

function buildFakeService() {
  let created = null;
  const service = {
    validate: () => ({ isValid: true, errors: [] }),
    getFloatCategories: async () => null,
    getRiskLimit: async () => null,
    db: {
      trades: {
        create: async (trade) => {
          created = trade;
          return { id: 'trade-1', ...trade };
        },
      },
    },
  };
  return { service, getCreated: () => created };
}

test('create() stamps the current schema_version regardless of client-supplied value', async () => {
  const { service, getCreated } = buildFakeService();
  const crud = createTradeCRUD(service);

  await crud.create({
    symbol: 'AAPL',
    entry_price: 100,
    quantity: 10,
    entry_time: '2026-01-01T00:00:00.000Z',
    schema_version: 999, // a client shouldn't be able to spoof this
  });

  assert.equal(getCreated().schema_version, CURRENT_TRADE_SCHEMA_VERSION);
});

test('create() stamps schema_version even when the client omits it entirely', async () => {
  const { service, getCreated } = buildFakeService();
  const crud = createTradeCRUD(service);

  await crud.create({
    symbol: 'MSFT',
    entry_price: 50,
    quantity: 5,
    entry_time: '2026-01-01T00:00:00.000Z',
  });

  assert.equal(getCreated().schema_version, CURRENT_TRADE_SCHEMA_VERSION);
});
