import test from 'node:test';
import assert from 'node:assert/strict';
import engine from '../public/guardian/engine.cjs';

const { step } = engine;

const LIMITS = {
  hard: 250,
  warning: 125,
  finalTradeLoss: 125,
  maxTrades: 0,
  cooldownMinutes: 5,
  dailyTarget: 300,
  gainProtectFrom: 125,
  givebackPercent: 50,
  givebackAction: 'warn',
};
const config = (limits = {}) => ({
  timeZone: 'America/Toronto',
  unlockTime: '16:30',
  stopTime: '16:35',
  confirmReads: 3,
  accounts: [],
  limits: { ...LIMITS, ...limits },
});

const START = 25000;
const T0 = new Date(Date.UTC(2026, 9, 7, 14, 0, 0)); // 10:00 Toronto
const r = (pnl, positions, open = 0) => ({
  accountText: 'MAX2532704', balance: START + pnl, projectedBalance: START + pnl + open, positions, filledOrders: 0,
});

/** Readings at given seconds after 10:00, through the engine. */
function run(steps, limits) {
  let current = { state: null, runtime: null };
  const actions = [];
  for (const [seconds, reading] of steps) {
    const out = step({ ...current, config: config(limits), reading: { running: true, ...reading }, now: new Date(T0.getTime() + seconds * 1000) });
    current = { state: out.state, runtime: out.runtime };
    actions.push(...out.actions);
  }
  return { actions, state: current.state };
}

const OPEN_DAY = [[0, r(0, 0)], [1, r(0, 0)], [2, r(0, 0)]];

test('a trade opened inside the cooldown after a loss raises an alert', () => {
  const { actions } = run([
    ...OPEN_DAY,
    [10, r(0, 1, -20)], // open
    [60, r(-40, 0)], // closed at a loss: cooldown starts
    [120, r(-40, 1)], // reopened one minute later
  ]);
  const alert = actions.find((a) => a.key?.startsWith('cooldown_'));
  assert.ok(alert);
  assert.match(alert.message, /4 minutes/);
});

test('a trade after the cooldown, or after a win, is left alone', () => {
  const late = run([...OPEN_DAY, [10, r(0, 1)], [60, r(-40, 0)], [60 + 301, r(-40, 1)]]);
  assert.ok(!late.actions.some((a) => a.key?.startsWith('cooldown_')));
  const afterWin = run([...OPEN_DAY, [10, r(0, 1)], [60, r(40, 0)], [70, r(40, 1)]]);
  assert.ok(!afterWin.actions.some((a) => a.key?.startsWith('cooldown_')));
});

test('reaching the daily target says so once', () => {
  const { actions } = run([...OPEN_DAY, [10, r(310, 0)], [11, r(320, 0)]]);
  assert.equal(actions.filter((a) => a.key === 'target').length, 1);
});

test('giving back half of the peak warns once, after it reads the same three times', () => {
  const { actions, state } = run([...OPEN_DAY, [10, r(300, 0)], [11, r(140, 0)], [12, r(140, 0)], [13, r(140, 0)], [14, r(130, 0)], [15, r(130, 0)], [16, r(130, 0)]]);
  assert.equal(actions.filter((a) => a.key === 'giveback').length, 1);
  assert.equal(state.locked, false);
});

test('green-day protection set to lock closes the session once flat', () => {
  const { state } = run([...OPEN_DAY, [10, r(300, 0)], [11, r(140, 0)], [12, r(140, 0)], [13, r(140, 0)]], { givebackAction: 'lock' });
  assert.equal(state.locked, true);
  assert.match(state.lockReason, /Gave back 53%/);
});

test('a small gain is not protected until it passes one trade of risk', () => {
  const { actions } = run([...OPEN_DAY, [10, r(100, 0)], [11, r(20, 0)], [12, r(20, 0)], [13, r(20, 0)]]);
  assert.ok(!actions.some((a) => a.key === 'giveback'));
});

test('the day is kept as a timeline for the journal', () => {
  const { state } = run([
    ...OPEN_DAY,
    [10, r(-130, 0)], // warning
    [20, r(-130, 1, -10)], // final trade
    [30, r(-180, 0)], // closed: locked
  ]);
  const keys = state.events.map((e) => e.key);
  assert.deepEqual(keys, ['day_start', 'daily_warning_1', 'final_trade', 'cooldown', 'locked']);
  assert.ok(state.events.every((e) => e.at && e.text));
});

test('an alert repeating while a position stays open is recorded once, not every time', () => {
  const steps = [...OPEN_DAY];
  // Past the hard limit with a position open, for two minutes.
  for (let t = 10; t < 130; t += 1) steps.push([t, r(-260, 1)]);
  const { actions, state } = run(steps);
  assert.ok(actions.filter((a) => a.key === 'hard_position_open').length > 1);
  assert.equal(state.events.filter((e) => e.key === 'hard_position_open').length, 1);
  assert.equal(state.events[0].key, 'day_start'); // the morning is not pushed out
});
