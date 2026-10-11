import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcRiskPerShare,
  calcStopDistance,
  calcTradeRisk,
  suggestStopPrice,
  summarizeSymbolStops,
} from '../src/lib/calculations/tradeRisk.js';

test('stop distance reads the gap and which side of entry the stop sits on', () => {
  assert.deepEqual(calcStopDistance({ entry_price: 200, stop_loss: 198 }), {
    distance: 2, percent: 1, direction: 'long',
  });
  assert.equal(calcStopDistance({ entry_price: 200, stop_loss: 202 }).direction, 'short');
});

test('a trade with no stop, or a stop at entry, has no measurable risk', () => {
  assert.equal(calcStopDistance({ entry_price: 200 }).distance, null);
  assert.equal(calcStopDistance({ entry_price: 200, stop_loss: 200 }).distance, null);
  assert.equal(calcTradeRisk({ entry_price: 200, stop_loss: 198 }), null);
});

test('risk is the distance to the stop times the size', () => {
  assert.equal(calcTradeRisk({ entry_price: 200, stop_loss: 198, position_size: 150 }), 300);
});

test('futures risk is counted in ticks, not points', () => {
  const risk = calcTradeRisk({
    entry_price: 5890, stop_loss: 5888, position_size: 2,
    instrument_type: 'futures', tick_size: 0.25, tick_value: 12.5,
  });
  // 2 points = 8 ticks × $12.50 × 2 contracts
  assert.equal(risk, 200);
  assert.equal(calcTradeRisk({
    entry_price: 5890, stop_loss: 5888, position_size: 2, instrument_type: 'futures',
  }), null);
});

test('a symbol summary averages the stops used on that name', () => {
  const trades = [
    { symbol: 'TSLA', entry_price: 200, stop_loss: 199, position_size: 100, entry_time: '2026-01-02' },
    { symbol: 'tsla', entry_price: 210, stop_loss: 208, position_size: 50, entry_time: '2026-02-02' },
    { symbol: 'AAPL', entry_price: 100, stop_loss: 99, position_size: 10 },
  ];

  const summary = summarizeSymbolStops(trades, 'tsla');
  assert.equal(summary.symbol, 'TSLA');
  assert.equal(summary.count, 2);
  assert.equal(summary.avgDistance, 1.5);
  assert.equal(summary.avgRisk, 100);
  // The most recent trade on the name, not the largest.
  assert.equal(summary.lastDistance, 2);
});

test('a symbol never traded reports nothing rather than a zero', () => {
  const summary = summarizeSymbolStops([], 'NVDA');
  assert.equal(summary.count, 0);
  assert.equal(summary.avgDistance, null);
  assert.equal(summarizeSymbolStops([], '').symbol, '');
});

test('the suggested stop sits below entry for a long and above for a short', () => {
  const summary = { avgDistance: 1.5 };
  assert.equal(suggestStopPrice(220, summary), 218.5);
  assert.equal(suggestStopPrice(220, summary, 'short'), 221.5);
});

test('no history, or an entry that would put the stop at zero, suggests nothing', () => {
  assert.equal(suggestStopPrice(220, { avgDistance: null }), null);
  assert.equal(suggestStopPrice(0, { avgDistance: 1.5 }), null);
  assert.equal(suggestStopPrice(1, { avgDistance: 5 }), null);
});

test('risk per share is the entry-to-stop gap, whatever the size', () => {
  assert.equal(calcRiskPerShare({ entry_price: 11, stop_loss: 10 }), 1);
  assert.equal(calcRiskPerShare({ entry_price: 11, stop_loss: 10, position_size: 500 }), 1);
  assert.equal(calcRiskPerShare({ entry_price: 10, stop_loss: 11 }), 1);
  assert.equal(calcRiskPerShare({ entry_price: 11 }), null);
});
