/**
 * @file src/lib/backup/schedule.js
 *
 * Weekly backup scheduling. A backup is written once a week, on Friday —
 * after the trading week closes — and if the app was not opened that day it
 * is written on the next launch instead. Missing a week is therefore not
 * possible while the app is used at all.
 *
 * Pure module: no React, no Electron, no filesystem.
 */

/** Friday, in JavaScript's 0 = Sunday weekday numbering. */
export const BACKUP_WEEKDAY = 5;

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * The most recent Friday at midnight, counting today when today is a Friday.
 * This is the line a backup has to be newer than to count as done.
 */
export function getMostRecentBackupDay(now = new Date(), weekday = BACKUP_WEEKDAY) {
  const day = startOfDay(now);
  const daysSince = (day.getDay() - weekday + 7) % 7;
  day.setDate(day.getDate() - daysSince);
  return day;
}

function toTime(value) {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/**
 * Whether this tier is owed a backup. True when none was ever written, or
 * when the last one predates the most recent Friday — which covers both
 * "it is Friday now" and "Friday was missed and the app is opening after".
 */
export function isBackupDue(lastRunAt, now = new Date(), weekday = BACKUP_WEEKDAY) {
  const lastRun = toTime(lastRunAt);
  if (lastRun == null) return true;
  // A clock that reports a backup from the future is not trustworthy, but it
  // is also not a reason to overwrite: treat it as done.
  return lastRun < getMostRecentBackupDay(now, weekday).getTime();
}

/** When the next backup will be written, given one has just been done. */
export function getNextBackupDay(now = new Date(), weekday = BACKUP_WEEKDAY) {
  const next = startOfDay(now);
  const daysUntil = (weekday - next.getDay() + 7) % 7 || 7;
  next.setDate(next.getDate() + daysUntil);
  return next;
}

/** One file per account tier, overwritten each week. */
export function getBackupFileName(accountType) {
  const tier = String(accountType || 'demo').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  return `tradedesk-backup-${tier || 'demo'}.json`;
}
