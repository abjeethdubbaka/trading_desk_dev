import test from 'node:test';
import assert from 'node:assert/strict';
import engine from '../public/guardian/engine.cjs';

const {
  step, parseMoney, parsePositions, matchAccount, zonedClock, planTick, setStartBalance,
  WARNING_INTERVAL_MS, UNREADABLE_ALERT_MS,
} = engine;

const CONFIG = {
  timeZone: 'America/Toronto',
  unlockTime: '16:30',
  stopTime: '16:35',
  confirmReads: 3,
  fillsPerTrade: 2,
  accounts: [
    { match: 'MAX', label: 'MAX50', warning: 200, hard: 250, finalTradeLoss: 50, maxTrades: 4 },
    { match: 'FLEX', label: 'FLEX25', warning: 100, hard: 150, finalTradeLoss: 50, maxTrades: 0 },
  ],
};

const START = 25000;

// 7 Oct 2026 is EDT (UTC-4): 14:00Z is 10:00 in Toronto.
const toronto = (hh, mm = 0, ss = 0) => new Date(Date.UTC(2026, 9, 7, hh + 4, mm, ss));

/**
 * A reading of Trade Terminal's header. `pnl` is the day's realized P&L,
 * `open` the open trade's P&L; both become balances, as on screen.
 */
const r = (pnl, positions, open = 0, extra = {}) => ({
  accountText: 'MAX2532704',
  balance: START + pnl,
  projectedBalance: START + pnl + open,
  positions,
  filledOrders: 0,
  ...extra,
});

/** Three identical reads at the start, so the day's balance is known. */
const OPEN_DAY = [r(0, 0), r(0, 0), r(0, 0)];

/** Feeds readings through the engine, collecting every action. */
function run(readings, { state = null, runtime = null, start = toronto(10) } = {}) {
  let current = { state, runtime };
  const actions = [];
  let last;
  readings.forEach((reading, i) => {
    const now = reading.at || new Date(start.getTime() + i * 1000);
    last = step({ ...current, config: CONFIG, reading: { running: true, ...reading }, now });
    current = { state: last.state, runtime: last.runtime };
    actions.push(...last.actions);
  });
  return { ...last, actions, current };
}

test('reads Trade Terminal header text', () => {
  assert.equal(parseMoney('BALANCE 24,995.47 USD'), 24995.47);
  assert.equal(parseMoney('−212.50 USD'), -212.5);
  assert.equal(parseMoney('(45.25)'), -45.25);
  assert.equal(parseMoney('---'), null);
  assert.equal(parsePositions('Positions (2)'), 2);
  assert.equal(parsePositions('Filled orders (10)'), 10);
  assert.equal(matchAccount('MAX2532704', CONFIG.accounts).label, 'MAX50');
  assert.equal(matchAccount('SIM101', CONFIG.accounts), null);
});

test('the clock is Toronto time whatever the machine says', () => {
  assert.deepEqual(zonedClock(toronto(16, 30), 'America/Toronto'), { dateKey: '2026-10-07', minutes: 990 });
});

test('the day starts at the first balance that reads the same three times', () => {
  const unsure = run([r(0, 0), r(5, 0)]);
  assert.equal(unsure.phase, 'starting');
  const sure = run(OPEN_DAY);
  assert.equal(sure.state.startBalances.MAX50.value, START);
  assert.equal(sure.state.startBalances.MAX50.source, 'auto');
  // Daily P&L and open P&L come from the balances.
  const later = run([...OPEN_DAY, r(-35, 1, -12)]);
  assert.equal(later.computed.dailyPnl, -35);
  assert.equal(later.computed.unrealizedPnl, -12);
});

test('a starting balance set by hand wins over the automatic one', () => {
  const day = run(OPEN_DAY);
  const corrected = setStartBalance(day.state, 'MAX50', 25150);
  const next = step({ state: corrected, runtime: day.runtime, config: CONFIG, reading: { running: true, ...r(0, 0) }, now: toronto(10, 1) });
  assert.equal(next.computed.dailyPnl, -150);
  assert.equal(next.state.startBalances.MAX50.source, 'manual');
});

test('the warning level shows three warnings, five minutes apart, then stops', () => {
  const start = toronto(10);
  const at = (ms) => new Date(start.getTime() + ms);
  const { actions, state } = run([
    ...OPEN_DAY.map((reading, i) => ({ ...reading, at: at(i * 1000) })),
    { ...r(-205, 0), at: at(5_000) },
    { ...r(-205, 0), at: at(60_000) },
    { ...r(-205, 0), at: at(5_000 + WARNING_INTERVAL_MS) },
    { ...r(-205, 0), at: at(5_000 + 2 * WARNING_INTERVAL_MS) },
    { ...r(-205, 0), at: at(5_000 + 3 * WARNING_INTERVAL_MS) },
  ]);
  const warnings = actions.filter((a) => a.type === 'alert').map((a) => a.key);
  assert.deepEqual(warnings, ['daily_warning_1', 'daily_warning_2', 'daily_warning_3']);
  assert.equal(state.warningCount, 3);
  assert.equal(state.locked, false);
});

test('after the warning, the next trade is the final one, and closing it locks the session', () => {
  const { actions, state } = run([
    ...OPEN_DAY,
    r(-205, 0), // warning
    r(-205, 1, -10), // final trade opens
    r(-205, 1, 20),
    r(-180, 0), // closed at a profit: the session still ends
  ]);
  assert.equal(state.finalTradeStarted, true);
  assert.equal(state.locked, true);
  assert.ok(actions.some((a) => a.type === 'close'));
  assert.match(state.lockReason, /final trade/);
});

test('the final trade must read -$50 open three times before the loss warning', () => {
  const base = [...OPEN_DAY, r(-205, 0), r(-205, 1, -10)];
  const twice = run([...base, r(-205, 1, -55), r(-205, 1, -55)]);
  assert.ok(!twice.actions.some((a) => a.key === 'final_loss_warning'));
  const thrice = run([...base, r(-205, 1, -55), r(-205, 1, -55), r(-205, 1, -55)]);
  assert.ok(thrice.actions.some((a) => a.key === 'final_loss_warning'));
  assert.equal(thrice.state.locked, false); // never closed with a position open
});

test('the hard limit with a position open says flatten, and locks only once flat', () => {
  const open = run([...OPEN_DAY, r(-260, 1), r(-260, 1), r(-260, 1)]);
  assert.ok(open.actions.some((a) => a.key === 'hard_position_open'));
  assert.equal(open.state.locked, false);
  assert.ok(!open.actions.some((a) => a.type === 'close'));

  const flat = run([...OPEN_DAY, r(-260, 0), r(-260, 0), r(-260, 0)]);
  assert.equal(flat.state.locked, true);
  assert.ok(flat.actions.some((a) => a.type === 'close'));
});

test('one misread value never acts: the same figure must repeat', () => {
  const { state } = run([...OPEN_DAY, r(-260, 0), r(-26, 0), r(-260, 0), r(-26, 0)]);
  assert.equal(state.locked, false);
});

test('max trades: a warning before the last one, then a lock once it is done and flat', () => {
  const fills = (n, positions = 0) => r(10, positions, 0, { filledOrders: n });
  const third = run([...OPEN_DAY, fills(6), fills(6), fills(6)]);
  assert.ok(third.actions.some((a) => a.key === 'last_trade'));
  assert.equal(third.state.locked, false);

  const fourth = run([...OPEN_DAY, fills(6), fills(6), fills(6), fills(7, 1), fills(8), fills(8), fills(8)]);
  assert.equal(fourth.state.locked, true);
  assert.match(fourth.state.lockReason, /4 of 4/);
});

test('max trades set to warn only says stop, once, and never closes the terminal', () => {
  const fills = (n) => r(10, 0, 0, { filledOrders: n });
  let current = { state: null, runtime: null };
  const actions = [];
  [...OPEN_DAY, fills(8), fills(8), fills(8), fills(10), fills(10), fills(10)].forEach((reading, i) => {
    const out = step({ ...current, config: { ...CONFIG, maxTradesAction: 'warn' }, reading: { running: true, ...reading }, now: new Date(toronto(10).getTime() + i * 1000) });
    current = { state: out.state, runtime: out.runtime };
    actions.push(...out.actions);
  });
  assert.equal(actions.filter((a) => a.key === 'max_trades_reached').length, 1);
  assert.ok(!actions.some((a) => a.type === 'close'));
  assert.equal(current.state.locked, false);
});

test('max trades with another position open says flatten first', () => {
  const { actions, state } = run([...OPEN_DAY, ...Array(3).fill(r(10, 1, 0, { filledOrders: 9 }))]);
  assert.ok(actions.some((a) => a.key === 'max_trades_position_open'));
  assert.equal(state.locked, false);
});

test('an account without a trade limit is never locked for trade count', () => {
  const flex = (n) => r(0, 0, 0, { accountText: 'FLEX123', filledOrders: n });
  const { state } = run([flex(0), flex(0), flex(0), flex(40), flex(40), flex(40)]);
  assert.equal(state.locked, false);
});

test('30 seconds of not reading the account or balance raises an alert, once', () => {
  const start = toronto(10);
  const blind = (s) => ({ accountText: '', balance: null, positions: 0, at: new Date(start.getTime() + s * 1000) });
  const early = run([blind(0), blind(10), blind(20)]);
  assert.equal(early.phase, 'unreadable');
  assert.ok(!early.actions.some((a) => a.key === 'unreadable'));

  const late = run([blind(0), blind(15), blind(UNREADABLE_ALERT_MS / 1000), blind(45)]);
  assert.equal(late.actions.filter((a) => a.key === 'unreadable').length, 1);
  assert.match(late.actions.find((a) => a.key === 'unreadable').message, /NOT PROTECTED/);
});

test('while locked, a reopened terminal is closed again; at 4:30 the lock lifts', () => {
  const locked = run([...OPEN_DAY, r(-260, 0), r(-260, 0), r(-260, 0)]);
  const reopened = step({ ...locked.current, config: CONFIG, reading: { running: true }, now: toronto(15) });
  assert.equal(reopened.phase, 'locked');
  assert.ok(reopened.actions.some((a) => a.type === 'close'));

  const unlocked = step({ ...locked.current, config: CONFIG, reading: { running: true }, now: toronto(16, 30) });
  assert.equal(unlocked.phase, 'unlocked');
  assert.equal(unlocked.state.locked, false);
  assert.ok(!unlocked.actions.some((a) => a.type === 'close'));
});

test('at 4:35 Guardian finishes for the day, once', () => {
  const morning = run(OPEN_DAY);
  const first = step({ ...morning.current, config: CONFIG, reading: { running: true }, now: toronto(16, 35) });
  assert.equal(first.phase, 'finished');
  assert.equal(first.actions.filter((a) => a.key === 'finished').length, 1);
  const again = step({ state: first.state, runtime: first.runtime, config: CONFIG, reading: {}, now: toronto(16, 40) });
  assert.equal(again.actions.length, 0);
});

test('opening the app in the evening says nothing: Guardian did not guard that day', () => {
  const evening = step({ state: null, runtime: null, config: CONFIG, reading: { running: true }, now: toronto(19) });
  assert.equal(evening.phase, 'finished');
  assert.equal(evening.actions.length, 0);
});

test('a new day starts fresh, with a new starting balance', () => {
  const locked = run([...OPEN_DAY, r(-260, 0), r(-260, 0), r(-260, 0)]);
  const tomorrow = new Date(toronto(10).getTime() + 24 * 3600 * 1000);
  const next = step({ ...locked.current, config: CONFIG, reading: { running: true, ...r(-260, 0) }, now: tomorrow });
  assert.equal(next.state.locked, false);
  assert.equal(next.state.date, '2026-10-08');
  assert.deepEqual(next.state.startBalances, {});
});

test('screen reading is skipped when no rule could act', () => {
  assert.equal(planTick({ state: null, config: CONFIG, now: toronto(10) }).read, true);
  assert.equal(planTick({ state: null, config: CONFIG, now: toronto(16, 31) }).read, false);
  const locked = run([...OPEN_DAY, r(-260, 0), r(-260, 0), r(-260, 0)]);
  assert.equal(planTick({ state: locked.state, config: CONFIG, now: toronto(11) }).read, false);
});

test('with limits from Trade Desk settings, any account number on screen is guarded', () => {
  const limits = { hard: 250, warning: 125, finalTradeLoss: 125, maxTrades: 4 };
  const config = { ...CONFIG, accounts: [], limits };
  assert.equal(engine.resolveAccount('MAX2532704', config).label, 'MAX2532704');
  assert.equal(engine.resolveAccount('Demo', config), null); // no digits: not an account number
  assert.equal(engine.resolveAccount('', config), null);

  let current = { state: null, runtime: null };
  const actions = [];
  const reads = [r(0, 0), r(0, 0), r(0, 0), r(-130, 0)];
  reads.forEach((reading, i) => {
    const out = step({ ...current, config, reading: { running: true, ...reading }, now: new Date(toronto(10).getTime() + i * 1000) });
    current = { state: out.state, runtime: out.runtime };
    actions.push(...out.actions);
  });
  assert.equal(current.state.startBalances.MAX2532704.value, START);
  assert.ok(actions.some((a) => a.key === 'daily_warning_1'));
});
