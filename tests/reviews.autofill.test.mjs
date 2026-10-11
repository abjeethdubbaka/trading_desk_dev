import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestReportCard } from '../src/lib/reviews/autofill.js';

const at = (hh, mm) => new Date(Date.UTC(2026, 9, 8, hh + 4, mm)).toISOString(); // Toronto time
const ev = (hh, mm, key) => ({ at: at(hh, mm), key, text: key });

const ROUGH_DAY = {
  date: '2026-10-08',
  peak_daily_pnl: 120,
  events: [
    ev(9, 52, 'cooldown'),
    ev(9, 53, 'cooldown_1791467851459'),
    ev(10, 14, 'max_trades_position_open'),
    ev(10, 52, 'hard_position_open'),
    ev(11, 2, 'locked'),
  ],
};

const TRADES = [
  { id: 'a', pnl: 80, setup_type: 'VWAP REJ', mistakes: [], entry_time: at(9, 35) },
  { id: 'b', pnl: -32, setup_type: 'BL', mistakes: ['Chased entry'], entry_time: at(9, 45) },
  { id: 'c', pnl: -40, setup_type: 'BL', mistakes: ['Chased entry'], entry_time: at(9, 53) },
  { id: 'd', pnl: -60, setup_type: 'BL', mistakes: [], entry_time: at(10, 14) },
];

const MISTAKES = ['Chased entry', 'Overtrading', 'Revenge trade', 'Moved stop'];
const SETUPS = ['VWAP REJ', 'BL'];

test('a day that broke the limits answers the discipline questions honestly', () => {
  const s = suggestReportCard({ guardianDay: ROUGH_DAY, dailyPnl: -52, trades: TRADES, mistakeOptions: MISTAKES, setupOptions: SETUPS });
  assert.equal(s.followed_risk_plan.value, false);
  assert.match(s.followed_risk_plan.reason, /max trades.*hard loss limit/);
  assert.equal(s.traded_off_plan.value, true);
  assert.equal(s.worse_after_loss.value, true);
  assert.equal(s.gave_back_profits.value, true); // peaked +120, now -52
});

test('the trades fill best, worst, forced, setup and repeated mistake', () => {
  const s = suggestReportCard({ guardianDay: ROUGH_DAY, dailyPnl: -52, trades: TRADES, mistakeOptions: MISTAKES, setupOptions: SETUPS });
  assert.equal(s.best_trade_id.value, 'a');
  assert.equal(s.worst_trade_id.value, 'd');
  assert.equal(s.forced_trade_id.value, 'c'); // opened at the cooldown break
  assert.equal(s.setup_that_worked.value, 'VWAP REJ');
  assert.equal(s.repeated_mistake.value, 'Chased entry');
  assert.equal(s.biggest_mistake.value, 'Overtrading');
});

test('a clean day says so, and leaves alone what it cannot know', () => {
  const clean = { date: '2026-10-08', peak_daily_pnl: 150, events: [ev(9, 40, 'target')] };
  const s = suggestReportCard({ guardianDay: clean, dailyPnl: 140, trades: [TRADES[0]], mistakeOptions: MISTAKES, setupOptions: SETUPS });
  assert.equal(s.followed_risk_plan.value, true);
  assert.equal(s.gave_back_profits.value, false);
  assert.equal(s.traded_off_plan, undefined);
  assert.equal(s.worse_after_loss, undefined); // no losses: nothing to say
  assert.equal(s.worst_trade_id, undefined); // no losing trade
  assert.equal(s.followed_plan, undefined); // the trader's own answer
});

test('the Morning Brief answers whether tiredness hurt', () => {
  const tired = suggestReportCard({ guardianDay: ROUGH_DAY, dailyPnl: -52, brief: { sleep: 3, focus: 5 } });
  assert.equal(tired.worse_when_tired.value, true);
  const rested = suggestReportCard({ dailyPnl: 50, brief: { sleep: 8, focus: 7 } });
  assert.equal(rested.worse_when_tired.value, false);
});

test('without Guardian or trades there is nothing to suggest', () => {
  assert.deepEqual(suggestReportCard({}), {});
});
