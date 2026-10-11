/**
 * @file src/lib/journal/dayAssessment.js
 *
 * A trading day's verdict for the journal's day heading: its quality — the
 * average of the day's trade ratings — and the single most important thing
 * to say about it.
 *
 * Every rule the day broke is found, then ranked by how much it costs a
 * trader to keep doing it: breaking the daily loss limit outranks
 * overtrading, which outranks one oversized position. The heading shows the
 * top one and how many more there are. A day that broke nothing gets a note
 * that says so — keeping the rules on a red day is worth hearing too.
 *
 * Pure module: no React, no database.
 */

import { getTradeDate, getTradePnL } from '../utils/tradeFields.js';
import { getGuardianIssues } from '../guardian/days.js';

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const money = (n) => `$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function emotionsOf(trade) {
  const raw = Array.isArray(trade?.emotions) ? trade.emotions : [trade?.emotions];
  return raw.map((e) => String(e || '').trim().toLowerCase()).filter(Boolean);
}

/** The longest run of consecutive losing trades, in the order they were taken. */
function longestLosingRun(trades) {
  const ordered = [...trades].sort((a, b) => (getTradeDate(a) ?? 0) - (getTradeDate(b) ?? 0));
  let run = 0;
  let longest = 0;
  for (const trade of ordered) {
    run = getTradePnL(trade) < 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}

/** The day's quality out of 10: the average of its rated trades. */
export function getDayQuality(trades = []) {
  const ratings = (Array.isArray(trades) ? trades : [])
    .map((trade) => toNumber(trade?.overall_rating))
    .filter((rating) => rating != null);
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10;
}

export const LOSING_RUN_WARNING = 3;
export const LOW_QUALITY_BELOW = 5;

/**
 * @param {object[]} trades the day's trades
 * @param {{ maxDailyTrades?: number, maxDailyLoss?: number, guardianDay?: object }} limits
 *   the rules for that day, and Trading Guardian's record of it if any;
 *   the rules for that day; 0 or missing means no rule.
 * @returns {{ quality: number|null, feedback: { tone, title, detail },
 *   issues: { key, tone, title, detail }[] }}
 */
export function assessDay(trades = [], { maxDailyTrades = 0, maxDailyLoss = 0, guardianDay = null } = {}) {
  const list = Array.isArray(trades) ? trades : [];
  const count = list.length;
  const pnl = list.reduce((sum, trade) => sum + getTradePnL(trade), 0);
  const quality = getDayQuality(list);
  const tradeLimit = Number(maxDailyTrades) || 0;
  const lossLimit = Math.abs(Number(maxDailyLoss) || 0);

  const emotions = list.flatMap(emotionsOf);
  const oversized = list.filter((trade) => trade?.is_oversized === true).length;
  const offPlan = list.filter((trade) => trade?.followed_plan === false).length;
  const losingRun = longestLosingRun(list);

  // Most costly first. Each entry is only kept if it actually happened.
  // What Guardian saw on Trade Terminal leads: it holds even for trades
  // that were never logged.
  const issues = [
    ...getGuardianIssues(guardianDay),
    lossLimit > 0 && pnl <= -lossLimit && {
      key: 'lossLimit',
      tone: 'danger',
      title: 'Max loss broken',
      detail: `Lost ${money(pnl)} against a ${money(lossLimit)} daily limit.`,
    },
    tradeLimit > 0 && count > tradeLimit && {
      key: 'overtraded',
      tone: 'danger',
      title: 'Overtraded',
      detail: `${plural(count, 'trade')} against a limit of ${tradeLimit}.`,
    },
    emotions.includes('revenge') && {
      key: 'revenge',
      tone: 'danger',
      title: 'Revenge trading',
      detail: 'At least one trade was logged as revenge.',
    },
    oversized > 0 && {
      key: 'oversized',
      tone: 'warning',
      title: 'Oversized',
      detail: `${plural(oversized, 'trade')} risked more than the setup allows.`,
    },
    offPlan > 0 && {
      key: 'offPlan',
      tone: 'warning',
      title: 'Off plan',
      detail: `${plural(offPlan, 'trade')} did not follow the plan.`,
    },
    losingRun >= LOSING_RUN_WARNING && {
      key: 'losingRun',
      tone: 'warning',
      title: `${losingRun} losses in a row`,
      detail: 'Kept trading through a losing streak.',
    },
    emotions.includes('fomo') && {
      key: 'fomo',
      tone: 'warning',
      title: 'FOMO entry',
      detail: 'At least one trade was chased.',
    },
    quality != null && quality < LOW_QUALITY_BELOW && {
      key: 'lowQuality',
      tone: 'warning',
      title: 'Low-quality trades',
      detail: `Trades averaged ${quality}/10.`,
    },
  ].filter(Boolean);

  if (issues.length > 0) return { quality, feedback: issues[0], issues };

  // Nothing broken: say what went right.
  const feedback = pnl > 0 && (quality == null || quality >= 7)
    ? { key: 'clean', tone: 'positive', title: 'Clean day', detail: 'Green and every rule kept.' }
    : pnl < 0
      ? { key: 'rulesKept', tone: 'positive', title: 'Rules kept', detail: 'A red day, but no rule was broken.' }
      : { key: 'withinRules', tone: 'neutral', title: 'Within the rules', detail: 'No rule was broken.' };

  return { quality, feedback, issues };
}
