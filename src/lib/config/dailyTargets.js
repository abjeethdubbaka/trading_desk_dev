/**
 * Daily P&L targets (Mon–Fri), scoped per account tier so a $25K account and a
 * $100K account can carry different goals under the same settings key.
 */
import { ACCOUNT_TIERS } from '@/lib/config/accountTypes';

export const DAILY_TARGETS_BASE_WEEK1 = [500, 210, 210, 250, 250];
export const DAILY_TARGET_PURPOSES_BASE_WEEK1 = [
  'Room rent', 'Regular expenses', 'Regular expenses', 'Regular expenses', 'Regular expenses',
];

const BASE_TIER_DAILY_PROFIT_TARGET = ACCOUNT_TIERS['25K']?.daily_profit_target || 250;

function tierMultiplier(tierId) {
  const tierTarget = Number(ACCOUNT_TIERS[tierId]?.daily_profit_target);
  if (!Number.isFinite(tierTarget) || tierTarget <= 0) return 1;
  return tierTarget / BASE_TIER_DAILY_PROFIT_TARGET;
}

export function resolveTierKey(settings) {
  return settings?.account_tier || 'custom';
}

export function getDefaultDailyTargetsForTier(tierId) {
  const multiplier = tierMultiplier(tierId);
  return DAILY_TARGETS_BASE_WEEK1.map((value) => Math.round((value * multiplier) / 5) * 5);
}

export function getDefaultDailyTargetPurposesForTier() {
  return [...DAILY_TARGET_PURPOSES_BASE_WEEK1];
}

export function getDailyTargetsWeek1(settings, tierId = resolveTierKey(settings)) {
  const perTier = settings?.daily_targets?.[tierId]?.week1;
  if (Array.isArray(perTier)) return perTier;
  // Legacy shape (pre-tier-scoping): a single flat week1 array shared by all tiers.
  if (Array.isArray(settings?.daily_targets?.week1)) return settings.daily_targets.week1;
  return getDefaultDailyTargetsForTier(tierId);
}

export function getDailyTargetPurposesWeek1(settings, tierId = resolveTierKey(settings)) {
  const perTier = settings?.daily_target_purposes?.[tierId]?.week1;
  if (Array.isArray(perTier)) return perTier;
  if (Array.isArray(settings?.daily_target_purposes?.week1)) return settings.daily_target_purposes.week1;
  return getDefaultDailyTargetPurposesForTier();
}
