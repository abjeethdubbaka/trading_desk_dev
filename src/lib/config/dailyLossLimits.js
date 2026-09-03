/**
 * Max daily loss ($) limits, scoped per account tier and broken down Mon–Fri
 * (mirrors dailyTargets.js). Each tier can cap losses differently per day.
 */
import { ACCOUNT_TIERS } from '@/lib/config/accountTypes';
import { resolveTierKey } from '@/lib/config/dailyTargets';

export { resolveTierKey };

export function getDefaultDailyLossLimitsForTier(tierId) {
  const base = Number(ACCOUNT_TIERS[tierId]?.max_dollars);
  const value = Number.isFinite(base) && base > 0 ? base : 250;
  return [value, value, value, value, value];
}

export function getDailyLossLimitsWeek1(settings, tierId = resolveTierKey(settings)) {
  const perTier = settings?.daily_loss_limits?.[tierId]?.week1;
  if (Array.isArray(perTier)) return perTier;
  return getDefaultDailyLossLimitsForTier(tierId);
}

/**
 * Resolves the loss limit that applies right now: today's Mon–Fri value for
 * the account's current tier. Falls back to the legacy flat `max_dollars`
 * field (pre-tier-scoping), then to Monday's limit, on weekends or gaps.
 */
export function getTodayMaxDailyLoss(settings, tierId = resolveTierKey(settings)) {
  const dow = new Date().getDay(); // 0=Sun, 6=Sat
  const dayIndex = dow === 0 || dow === 6 ? null : dow - 1;
  const limits = getDailyLossLimitsWeek1(settings, tierId);
  const todayLimit = dayIndex != null ? Number(limits[dayIndex]) : NaN;
  if (Number.isFinite(todayLimit) && todayLimit > 0) return todayLimit;

  const legacyFlat = Number(settings?.max_dollars);
  if (Number.isFinite(legacyFlat) && legacyFlat > 0) return legacyFlat;

  return Number(limits[0]) || 0;
}
