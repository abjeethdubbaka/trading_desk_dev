import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKUP_WEEKDAY,
  getBackupFileName,
  getMostRecentBackupDay,
  getNextBackupDay,
  isBackupDue,
} from '../src/lib/backup/schedule.js';

// Local dates on purpose: the schedule is about the trader's own week.
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0);

const FRIDAY = at(2026, 9, 11);
const SATURDAY = at(2026, 9, 12);
const MONDAY = at(2026, 9, 14);

test('the backup day is Friday, when the trading week closes', () => {
  assert.equal(BACKUP_WEEKDAY, 5);
  assert.equal(FRIDAY.getDay(), BACKUP_WEEKDAY);
});

test('the most recent backup day counts today when today is Friday', () => {
  assert.equal(getMostRecentBackupDay(FRIDAY).getDate(), 11);
  assert.equal(getMostRecentBackupDay(SATURDAY).getDate(), 11);
  assert.equal(getMostRecentBackupDay(MONDAY).getDate(), 11);
  // Midnight, so a backup written any time that Friday counts.
  assert.equal(getMostRecentBackupDay(MONDAY).getHours(), 0);
});

test('a tier that has never been backed up is due immediately', () => {
  assert.equal(isBackupDue(null, MONDAY), true);
  assert.equal(isBackupDue('', MONDAY), true);
  assert.equal(isBackupDue('not-a-date', MONDAY), true);
});

test('a missed Friday is caught on the next launch', () => {
  // Last written the Friday before; it is now the following Monday.
  assert.equal(isBackupDue(at(2026, 9, 4).toISOString(), MONDAY), true);
});

test('a backup written this Friday holds until the next one', () => {
  const writtenFriday = at(2026, 9, 11, 9).toISOString();
  assert.equal(isBackupDue(writtenFriday, FRIDAY), false);
  assert.equal(isBackupDue(writtenFriday, SATURDAY), false);
  assert.equal(isBackupDue(writtenFriday, MONDAY), false);
  // Due again once the next Friday arrives.
  assert.equal(isBackupDue(writtenFriday, at(2026, 9, 18)), true);
});

test('it is due on Friday itself, before that day has been backed up', () => {
  assert.equal(isBackupDue(at(2026, 9, 10).toISOString(), FRIDAY), true);
});

test('getNextBackupDay always looks forward, never at today', () => {
  assert.equal(getNextBackupDay(FRIDAY).getDate(), 18);
  assert.equal(getNextBackupDay(SATURDAY).getDate(), 18);
  assert.equal(getNextBackupDay(MONDAY).getDate(), 18);
});

test('each account tier writes its own file, named safely', () => {
  assert.equal(getBackupFileName('live'), 'tradedesk-backup-live.json');
  assert.equal(getBackupFileName('Demo'), 'tradedesk-backup-demo.json');
  assert.equal(getBackupFileName(''), 'tradedesk-backup-demo.json');
  // Nothing in the name can point outside the backup folder.
  assert.equal(getBackupFileName('../../etc'), 'tradedesk-backup--etc.json');
});
