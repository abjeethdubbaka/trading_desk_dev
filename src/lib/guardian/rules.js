/**
 * @file src/lib/guardian/rules.js
 *
 * Trading Guardian's limits, taken from what Trade Desk already holds rather
 * than entered a second time:
 *
 *   Hard limit        today's max daily loss for the current tier
 *   Final-trade loss  the risk amount: half of today's max daily loss
 *   Warning level     the hard limit less one trade's risk — after one full
 *                     loss you are warned, the one final trade may lose one
 *                     more, and that lands exactly on the hard limit
 *   Max trades        max trades per day
 *   Daily target      today's target from the daily targets
 *   Green day         protected once up one trade's risk
 *
 * They apply to whichever account Trade Terminal shows. Change them where
 * they live — the Account and Defaults tabs — and Guardian follows.
 *
 * A Morning Brief score under 5 ("consider sitting out") tightens the day:
 * the warning comes at half the loss, max trades are halved and the cooldown
 * after a loss doubles.
 */

import { getTodayMaxDailyLoss, getTodayRiskAmount } from '@/lib/config/dailyLossLimits';
import { getDailyTargetsWeek1 } from '@/lib/config/dailyTargets';
import { ACCOUNT_TIERS } from '@/lib/config/accountTypes';

export const DEFAULT_GUARDIAN_TIMES = {
  timeZone: 'America/Toronto',
  unlockTime: '16:30',
  stopTime: '16:35',
};

export const TIGHTEN_BELOW_SCORE = 5;

export function getGuardianTimes(settings) {
  return {
    timeZone: settings?.guardian_time_zone || DEFAULT_GUARDIAN_TIMES.timeZone,
    unlockTime: settings?.guardian_unlock_time || DEFAULT_GUARDIAN_TIMES.unlockTime,
    stopTime: settings?.guardian_stop_time || DEFAULT_GUARDIAN_TIMES.stopTime,
  };
}

/** How trades are counted from Trade Terminal's filled orders, and what the limit does. */
export function getGuardianTradeRules(settings) {
  const fills = Math.floor(Number(settings?.guardian_fills_per_trade));
  return {
    fillsPerTrade: fills >= 1 ? fills : 2,
    maxTradesAction: settings?.guardian_max_trades_action === 'warn' ? 'warn' : 'lock',
  };
}

/** The protections with no existing setting to borrow, with their defaults. */
export function getGuardianProtection(settings) {
  const cooldown = Number(settings?.guardian_cooldown_minutes);
  const giveback = Number(settings?.guardian_giveback_percent);
  return {
    cooldownMinutes: Number.isFinite(cooldown) && cooldown >= 0 ? cooldown : 5,
    givebackPercent: Number.isFinite(giveback) && giveback >= 0 ? Math.min(100, giveback) : 50,
    givebackAction: settings?.guardian_giveback_action === 'lock' ? 'lock' : 'warn',
    tightenOnLowScore: settings?.guardian_tighten_low_score !== false,
  };
}

function todayTarget(settings) {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return 0;
  return Math.max(0, Number(getDailyTargetsWeek1(settings)?.[day - 1]) || 0);
}

/**
 * Today's limits, from the Account and Defaults tabs, tightened when the
 * morning's mental score is low.
 */
export function getGuardianLimits(settings, { mentalScore = null } = {}) {
  const tier = settings?.account_tier || 'custom';
  const hard = Math.abs(Number(getTodayMaxDailyLoss(settings)) || 0);
  const risk = Math.min(hard, Math.abs(Number(getTodayRiskAmount(settings)) || 0));
  const protection = getGuardianProtection(settings);
  const base = {
    tier,
    tierLabel: ACCOUNT_TIERS[tier]?.label || tier,
    hard,
    finalTradeLoss: risk,
    warning: Math.max(0, Math.round((hard - risk) * 100) / 100),
    maxTrades: Math.max(0, Math.floor(Number(settings?.max_daily_trades) || 0)),
    cooldownMinutes: protection.cooldownMinutes,
    dailyTarget: todayTarget(settings),
    gainProtectFrom: risk,
    givebackPercent: protection.givebackPercent,
    givebackAction: protection.givebackAction,
    tightened: false,
    tightenReason: '',
  };

  const score = Number(mentalScore);
  if (!protection.tightenOnLowScore || mentalScore == null || !Number.isFinite(score) || score >= TIGHTEN_BELOW_SCORE) {
    return base;
  }
  return {
    ...base,
    warning: Math.round((base.warning / 2) * 100) / 100,
    maxTrades: base.maxTrades > 0 ? Math.max(1, Math.ceil(base.maxTrades / 2)) : 0,
    cooldownMinutes: base.cooldownMinutes * 2,
    tightened: true,
    tightenReason: `Morning Brief score ${score}/10`,
  };
}

/** What the desktop Guardian runs on. Rebuilt whenever Settings, the weekday or the morning change. */
export function buildGuardianRules(settings, options = {}) {
  const { tierLabel: _label, tightenReason: _reason, ...limits } = getGuardianLimits(settings, options);
  return {
    ...getGuardianTimes(settings),
    ...getGuardianTradeRules(settings),
    confirmReads: 3,
    limits,
    accounts: [],
  };
}
