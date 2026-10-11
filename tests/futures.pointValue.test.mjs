import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FUTURES_CONTRACTS,
  calcFuturesPosition,
  toPointValue,
  toTickValue,
} from '../src/lib/calculations/trades/calculators/position.js';

const MES = FUTURES_CONTRACTS.MES;

test('MES is $5 a point and $1.25 a tick', () => {
  assert.equal(toPointValue(MES.tickSize, MES.tickValue), 5);
  assert.equal(toTickValue(0.25, 5), 1.25);
  assert.equal(toPointValue(FUTURES_CONTRACTS.ES.tickSize, FUTURES_CONTRACTS.ES.tickValue), 50);
});

test('entry 6,800, stop 6,790: 10 points is $50 of risk on 1 MES', () => {
  const result = calcFuturesPosition({
    entryPrice: 6800,
    stopLossPrice: 6790,
    riskAmount: 50,
    accountSize: 25000,
    tickSize: MES.tickSize,
    tickValue: toTickValue(MES.tickSize, 5),
    riskRewardRatio: 2,
  });
  assert.equal(result.contracts, 1);
  assert.equal(result.stopTicks, 40);
  assert.equal(result.actualRisk, 50);
  // 2R: target 6,820 for +$100.
  assert.equal(result.targetPrice, 6820);
  assert.equal(result.targetProfit, 100);
});

test('a 2.50 point stop is 10 ticks, $12.50 a contract', () => {
  const result = calcFuturesPosition({
    entryPrice: 6800,
    stopLossPrice: 6797.5,
    riskAmount: 50,
    accountSize: 25000,
    tickSize: 0.25,
    tickValue: 1.25,
  });
  assert.equal(result.stopTicks, 10);
  assert.equal(result.riskPerContract, 12.5);
  assert.equal(result.contracts, 4); // $50 of risk buys four $12.50 contracts
  assert.equal(result.actualRisk, 50);
});

test('the stop-loss table: points × $5 per contract', () => {
  for (const [points, dollars] of [[2, 10], [4, 20], [8, 40], [15, 75], [30, 150]]) {
    const result = calcFuturesPosition({
      entryPrice: 6800,
      stopLossPrice: 6800 - points,
      riskAmount: dollars,
      accountSize: 25000,
      tickSize: 0.25,
      tickValue: 1.25,
    });
    assert.equal(result.riskPerContract, dollars, `${points} points`);
    assert.equal(result.contracts, 1, `${points} points`);
  }
});
