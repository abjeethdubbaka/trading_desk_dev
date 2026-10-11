import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OVERSIZED_TOLERANCE,
  buildCalculatorTrade,
  isPositionOversized,
} from '../src/lib/calculations/calculatorTrade.js';

const BASE = {
  symbol: 'tsla',
  entryPrice: '11',
  exitPrice: 13,
  stopLoss: '10',
  quantity: 100,
  direction: 'long',
  pnl: 200,
  pnlPercent: 18.2,
  rMultiple: 2,
  now: new Date('2026-09-26T14:30:00Z'),
};

test('a calculator trade records its risk, per share and in dollars', () => {
  const trade = buildCalculatorTrade(BASE);
  // Entered at 11 with a stop at 10 risks $1 a share, $100 across 100 shares.
  assert.equal(trade.risk_per_share, 1);
  assert.equal(trade.risk_amount, 100);
});

test('the symbol is stored the way the journal stores it', () => {
  assert.equal(buildCalculatorTrade(BASE).symbol, 'TSLA');
});

test('a trade is attributed to the setup and rule version it was sized against', () => {
  const trade = buildCalculatorTrade({
    ...BASE,
    playbookEntry: { id: 's1', name: 'Double Top Short' },
    playbookVersion: { id: 'v3', version: 3 },
  });

  assert.equal(trade.trade_plan_id, 's1');
  assert.equal(trade.setup_version, 3);
  assert.equal(trade.setup_version_id, 'v3');
});

test('with no setup selected there is nothing to attribute it to', () => {
  const trade = buildCalculatorTrade(BASE);
  assert.equal(trade.trade_plan_id, null);
  assert.equal(trade.setup_version, null);
  assert.equal(trade.setup_version_id, null);
  assert.equal(trade.setup_type, 'Calculator Entry');
});

test('more dollars at risk than the setup intends is oversized', () => {
  assert.equal(buildCalculatorTrade({ ...BASE, expectedRisk: 50 }).is_oversized, true);
  assert.equal(buildCalculatorTrade({ ...BASE, expectedRisk: 100 }).is_oversized, false);
});

test('rounding a share count is not oversized', () => {
  // Just inside the tolerance, as a share count rounded up would be.
  assert.equal(isPositionOversized(100, 100 / OVERSIZED_TOLERANCE), false);
  assert.equal(isPositionOversized(100, 90), true);
});

test('nothing is called oversized when there is no intended risk to compare to', () => {
  assert.equal(buildCalculatorTrade(BASE).is_oversized, false);
  assert.equal(isPositionOversized(100, null), false);
  assert.equal(isPositionOversized(100, 0), false);
  assert.equal(isPositionOversized(null, 50), false);
});

test('a trade saved without an exit is left open rather than closed at zero', () => {
  const trade = buildCalculatorTrade({ ...BASE, exitPrice: null, pnl: 0, rMultiple: null });
  assert.equal(trade.exit_price, null);
  assert.equal(trade.exit_time, null);
  assert.equal(trade.entry_time, '2026-09-26T14:30:00.000Z');
});

test('a trade with no stop still saves, carrying no risk figures', () => {
  const trade = buildCalculatorTrade({ ...BASE, stopLoss: null });
  assert.equal(trade.stop_loss, null);
  assert.equal(trade.risk_per_share, null);
  assert.equal(trade.risk_amount, null);
  assert.equal(trade.is_oversized, false);
});

test('a futures trade counts risk in ticks and carries what a tick is worth', () => {
  // 1 MES, entry 6,800, stop 6,790: 10 points at $5 a point is $50.
  const trade = buildCalculatorTrade({
    ...BASE,
    symbol: 'mes',
    entryPrice: 6800,
    exitPrice: 6820,
    stopLoss: 6790,
    quantity: 1,
    pnl: 100,
    futures: { tickSize: '0.25', tickValue: '1.25', preset: 'MES' },
  });
  assert.equal(trade.risk_amount, 50);
  assert.equal(trade.instrument_type, 'futures');
  assert.equal(trade.tick_size, 0.25);
  assert.equal(trade.tick_value, 1.25);
  assert.equal(trade.futures_preset, 'MES');
});

test('a stock trade carries no futures fields', () => {
  const trade = buildCalculatorTrade(BASE);
  assert.equal(trade.instrument_type, undefined);
  assert.equal(trade.tick_value, undefined);
});
