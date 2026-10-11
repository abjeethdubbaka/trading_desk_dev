/**
 * @file src/lib/guardian/days.js
 *
 * What Trading Guardian saw each day, as the journal reads it: the stored
 * record built from Guardian's live state, and the verdicts it adds to a
 * day — a lock, a trade taken inside the cooldown, a green day given back.
 * These come from Trade Terminal itself, so they hold even for trades never
 * logged in the journal.
 *
 * Pure module: no React, no database.
 */

/** The record kept for a day, from Guardian's status. Null when there is nothing to keep. */
export function toGuardianDayRecord(status) {
  const day = status?.day;
  if (!day?.date) return null;
  const events = Array.isArray(day.events) ? day.events : [];
  if (events.length === 0 && !day.locked && !day.warningMode) return null;
  const account = day.account || null;
  return {
    date: day.date,
    account,
    start_balance: account ? day.startBalances?.[account]?.value ?? null : null,
    locked: Boolean(day.locked),
    lock_reason: day.lockReason || '',
    warning_reached: Boolean(day.warningMode),
    final_trade_taken: Boolean(day.finalTradeStarted),
    peak_daily_pnl: Number.isFinite(day.peakDailyPnl) ? day.peakDailyPnl : null,
    trades: Number.isFinite(day.tradesToday) ? day.tradesToday : null,
    events: events.map((event) => ({ at: event.at, key: event.key, text: event.text })),
  };
}

/** A stable fingerprint, so a record is only saved again when it has changed. */
export function guardianDayKey(record) {
  if (!record) return '';
  return JSON.stringify([record.date, record.locked, record.lock_reason, record.trades, record.events.length, record.events[record.events.length - 1]?.key]);
}

const isCooldownBreak = (event) => String(event?.key || '').startsWith('cooldown_');
const isGiveback = (event) => ['giveback', 'giveback_position_open'].includes(event?.key);

/**
 * What Guardian adds to the journal's verdict on a day, most serious first,
 * in the shape the day assessment uses.
 */
export function getGuardianIssues(record) {
  if (!record) return [];
  const events = Array.isArray(record.events) ? record.events : [];
  const cooldownBreaks = events.filter(isCooldownBreak).length;
  return [
    record.locked && {
      key: 'guardianLocked',
      tone: 'danger',
      title: 'Guardian locked the day',
      detail: record.lock_reason || 'The session was locked.',
    },
    !record.locked && record.final_trade_taken && {
      key: 'guardianFinalTrade',
      tone: 'warning',
      title: 'Down to the final trade',
      detail: 'Reached the warning level and took the one final trade.',
    },
    !record.locked && !record.final_trade_taken && record.warning_reached && {
      key: 'guardianWarning',
      tone: 'warning',
      title: 'Hit the warning level',
      detail: 'Guardian warned at the daily warning level.',
    },
    cooldownBreaks > 0 && {
      key: 'guardianCooldown',
      tone: 'warning',
      title: 'Traded in the cooldown',
      detail: `${cooldownBreaks} trade${cooldownBreaks === 1 ? '' : 's'} opened right after a loss.`,
    },
    events.some(isGiveback) && {
      key: 'guardianGiveback',
      tone: 'warning',
      title: 'Gave back the green day',
      detail: 'Gave back too much of the day’s peak.',
    },
  ].filter(Boolean);
}

/** The timeline as lines of text: "10:42 Warning 1 of 3". */
export function formatGuardianTimeline(record, formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) {
  const events = Array.isArray(record?.events) ? record.events : [];
  return events.map((event) => `${formatTime(event.at)} ${event.text}`);
}
