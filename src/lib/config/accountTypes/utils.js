import { ACCOUNT_TIERS } from './tiers.js';
import { getTierCustomizations } from './customizations.js';

export function getTierSettingsFields(tierId) {
  const tier = ACCOUNT_TIERS[tierId];
  if (!tier) return {};

  return {
    account_size:              tier.account_size,
    account_tier:              tierId,

    target_profit_dollars:     tier.daily_profit_target,
    max_dollars:               tier.max_dollars,
    risk_amount:               tier.risk_amount,
    position_sizing_percent:   tier.position_sizing_percent,
    default_stop_loss_percent: tier.default_stop_loss_percent,
    max_positions:             tier.max_positions,
    max_daily_trades:          tier.max_daily_trades,

    float_10m_min_r:           tier.float_10m_min_r,
    float_10m_max_r:           tier.float_10m_max_r,
    float_10_50m_min_r:        tier.float_10_50m_min_r,
    float_10_50m_max_r:        tier.float_10_50m_max_r,
    float_50_200m_min_r:       tier.float_50_200m_min_r,
    float_50_200m_max_r:       tier.float_50_200m_max_r,
    float_200m_min_r:          tier.float_200m_min_r,
    float_200m_max_r:          tier.float_200m_max_r,

    journal_preferences:       tier.journal_preferences,
    analysis_settings:         tier.analysis_settings,
    screenshot_settings:       tier.screenshot_settings,

    performance_goals:         tier.performance_goals,
    weekly_targets:            tier.weekly_targets,
    monthly_targets:           tier.monthly_targets,

    trading_rules:             tier.trading_rules,
    pdt_status:                tier.pdt_status,

    notifications:             tier.notifications,
  };
}

export function getTierSettingsWithCustomizations(tierId) {
  const baseSettings = getTierSettingsFields(tierId);
  const customizations = getTierCustomizations(tierId);

  return { ...baseSettings, ...customizations };
}

export function detectTierFromSettings(settings) {
  if (settings?.account_tier && ACCOUNT_TIERS[settings.account_tier]) {
    return settings.account_tier;
  }

  if (!settings?.account_size) return 'custom';

  for (const id of ['25K', '50K', '100K', '200K']) {
    const tier = ACCOUNT_TIERS[id];
    if (tier.account_size === Number(settings.account_size)) return id;
  }

  return 'custom';
}
