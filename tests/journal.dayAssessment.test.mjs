import test from 'node:test';
import assert from 'node:assert/strict';
import { assessDay, getDayQuality } from '../src/lib/journal/dayAssessment.js';

const at = (hour) => new Date(2026, 9, 5, hour, 0).toISOString();
const trade = (hour, pnl, extra = {}) => ({ entry_time: at(hour), pnl, ...extra });

test('quality is the average rating of the rated trades', () => {
  assert.equal(getDayQuality([trade(9, 10, { overall_rating: 8 }), trade(10, -5, { overall_rating: 5 }), trade(11, 1)]), 6.5);
  assert.equal(getDayQuality([trade(9, 10)]), null);
});

test('the most costly broken rule leads, the rest are counted', () => {
  // Seven trades on a four-trade limit, one oversized, one revenge.
  const day = [
    trade(9, 50), trade(9.5, -40), trade(10, -40, { emotions: ['revenge'] }),
    trade(10.5, -30, { is_oversized: true }), trade(11, 20), trade(11.5, -40), trade(12, -41),
  ];
  const { feedback, issues } = assessDay(day, { maxDailyTrades: 4, maxDailyLoss: 300 });
  assert.equal(feedback.key, 'overtraded');
  assert.match(feedback.detail, /7 trades against a limit of 4/);
  assert.deepEqual(issues.map((i) => i.key), ['overtraded', 'revenge', 'oversized', 'losingRun']);
});

test('breaking the daily loss limit outranks overtrading', () => {
  const day = [trade(9, -60), trade(10, -60), trade(11, -60)];
  const { feedback } = assessDay(day, { maxDailyTrades: 2, maxDailyLoss: 150 });
  assert.equal(feedback.key, 'lossLimit');
});

test('a losing run is counted in the order the trades were taken', () => {
  const day = [trade(12, -10), trade(9, 30), trade(10, -10), trade(11, -10)];
  const { feedback } = assessDay(day);
  assert.equal(feedback.key, 'losingRun');
  assert.equal(feedback.title, '3 losses in a row');
});

test('a day that broke nothing says so, green or red', () => {
  assert.equal(assessDay([trade(9, 100, { overall_rating: 8 })], { maxDailyTrades: 4 }).feedback.key, 'clean');
  assert.equal(assessDay([trade(9, -40, { overall_rating: 7 })], { maxDailyTrades: 4, maxDailyLoss: 100 }).feedback.key, 'rulesKept');
});

test('low-rated trades are flagged only when nothing worse happened', () => {
  const { feedback } = assessDay([trade(9, 20, { overall_rating: 3 }), trade(10, 5, { overall_rating: 4 })]);
  assert.equal(feedback.key, 'lowQuality');
});

test('what Guardian saw on Trade Terminal leads the verdict', () => {
  const guardianDay = { date: '2026-10-05', locked: true, lock_reason: 'Daily hard-loss limit reached: -$255.00.', events: [] };
  const { feedback, issues } = assessDay([trade(9, -100)], { maxDailyTrades: 4, maxDailyLoss: 300, guardianDay });
  assert.equal(feedback.key, 'guardianLocked');
  assert.match(feedback.detail, /hard-loss/);
  assert.equal(issues.length, 1);
});
