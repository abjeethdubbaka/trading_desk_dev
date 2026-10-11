import test from 'node:test';
import assert from 'node:assert/strict';
import { formatGuardianTimeline, getGuardianIssues, guardianDayKey, toGuardianDayRecord } from '../src/lib/guardian/days.js';

const STATUS = {
  day: {
    date: '2026-10-07',
    account: 'MAX2532704',
    startBalances: { MAX2532704: { value: 25000, source: 'auto' } },
    warningMode: true,
    finalTradeStarted: true,
    locked: true,
    lockReason: 'Your one final trade after the warning level has ended.',
    peakDailyPnl: 40,
    tradesToday: 3,
    events: [
      { at: '2026-10-07T14:42:00Z', key: 'daily_warning_1', text: 'Warning 1 of 3' },
      { at: '2026-10-07T14:50:00Z', key: 'cooldown_123', text: 'Inside your cooldown' },
      { at: '2026-10-07T15:15:00Z', key: 'locked', text: 'Session locked' },
    ],
  },
};

test('a guarded day becomes a record the journal can keep', () => {
  const record = toGuardianDayRecord(STATUS);
  assert.equal(record.date, '2026-10-07');
  assert.equal(record.start_balance, 25000);
  assert.equal(record.locked, true);
  assert.equal(record.events.length, 3);
});

test('a quiet day leaves nothing to keep', () => {
  assert.equal(toGuardianDayRecord({ day: { date: '2026-10-07', events: [] } }), null);
  assert.equal(toGuardianDayRecord(null), null);
});

test('the record is only saved again when it changes', () => {
  const record = toGuardianDayRecord(STATUS);
  assert.equal(guardianDayKey(record), guardianDayKey(toGuardianDayRecord(STATUS)));
  const more = toGuardianDayRecord({ day: { ...STATUS.day, events: [...STATUS.day.events, { at: 'x', key: 'giveback', text: 'Protect' }] } });
  assert.notEqual(guardianDayKey(record), guardianDayKey(more));
});

test('a lock and a cooldown break become journal verdicts, the lock first', () => {
  const issues = getGuardianIssues(toGuardianDayRecord(STATUS));
  assert.deepEqual(issues.map((i) => i.key), ['guardianLocked', 'guardianCooldown']);
  assert.match(issues[0].detail, /final trade/);
});

test('a warned day without a lock says how far it went', () => {
  const record = toGuardianDayRecord({ day: { ...STATUS.day, locked: false, finalTradeStarted: false, events: [STATUS.day.events[0]] } });
  assert.deepEqual(getGuardianIssues(record).map((i) => i.key), ['guardianWarning']);
});

test('the timeline reads as times and what happened', () => {
  const lines = formatGuardianTimeline(toGuardianDayRecord(STATUS), (iso) => iso.slice(11, 16));
  assert.deepEqual(lines, ['14:42 Warning 1 of 3', '14:50 Inside your cooldown', '15:15 Session locked']);
});
