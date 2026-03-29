/**
 * @file src/lib/accountTypes.js
 *
 * Account type presets for TradeDesk Pro.
 * Each tier defines sensible defaults for every risk parameter.
 * Users can select a tier and override individual fields.
 */

export const ACCOUNT_TIERS = {
  '25K': {
    id:           '25K',
    label:        '$25K',
    display:      '$25,000',
    account_size: 25000,
    color:        'blue',
    colorClass:   'text-blue-400',
    bgClass:      'bg-blue-500/10',
    borderClass:  'border-blue-500/30',
    icon:         '🔵',
    badge:        'Starter',
    description:  'PDT rule applies — up to 3 day trades per week. Focus on 1–2 high-quality A+ setups only.',

    // Daily limits
    daily_profit_target:  250,    // 1% of account
    max_dollars:          500,    // 2% max loss per day (stored as positive, UI shows as negative)

    // Per-trade risk
    risk_amount:               250,   // $250 flat risk per trade
    position_sizing_percent:   0.01,  // 1% of account (as decimal)
    default_stop_loss_percent: 0.04, // 4% (as decimal)

    // Position limits
    max_position_value:  5000,   // max 20% in one trade
    max_positions:       2,
    max_daily_trades:    3,

    // Float targets (R:R ratios per float size)
    float_10m_min_r:    4,
    float_10m_max_r:    7,
    float_10_50m_min_r: 3,
    float_10_50m_max_r: 5,
    float_50_200m_min_r:2,
    float_50_200m_max_r:3,
    float_200m_min_r:   1,
    float_200m_max_r:   2,

    // Journal Integration Settings
    journal_preferences: {
      auto_screenshot: true,
      require_notes: true,        // 25K traders need discipline
      require_emotion_tracking: true,
      require_plan_rating: true,
      default_setup_types: ['breakout', 'pullback'], // Focus on basic setups
      tag_system: 'enabled',
      min_notes_length: 50,      // Require meaningful notes
      require_setup_grade: true   // Must grade setup quality
    },
    
    analysis_settings: {
      enable_ai_analysis: false,  // Disabled for starter tier
      analysis_depth: 'basic',
      track_entry_exit_quality: true,
      track_emotional_patterns: true,
      track_setup_performance: true,
      focus_areas: ['risk_management', 'setup_quality', 'emotional_discipline']
    },
    
    screenshot_settings: {
      auto_capture: true,
      capture_entry: true,
      capture_exit: true,
      capture_chart_only: false,
      storage_location: 'local',  // Local storage for starter tier
      max_screenshots_per_trade: 2
    },

    // Performance Tracking (25K appropriate targets)
    performance_goals: {
      weekly_profit_target: 250,   // 1% weekly
      monthly_profit_target: 1000,  // 4% monthly
      max_weekly_losses: 2,       // Very strict loss limit
      win_rate_target: 0.55,       // 55% win rate (realistic for beginners)
      avg_win_target: 150,         // $150 average win
      avg_loss_limit: 100          // $100 max average loss
    },
    
    weekly_targets: {
      profit_target: 250,
      max_trades: 8,               // Limited trades for focus
      max_losses: 2,
      required_setup_types: ['breakout', 'pullback'],
      min_setup_grade: 3           // Minimum B grade setups
    },
    
    monthly_targets: {
      profit_target: 1000,
      max_trades: 32,
      max_losses: 8,
      avg_r_multiple: 1.5          // Minimum R:R ratio
    },

    // Trading Rules (stricter for 25K)
    trading_rules: {
      max_consecutive_losses: 2,
      max_daily_loss_percent: 0.02,
      require_stop_loss: true,
      require_position_size_calc: true,
      min_risk_reward_ratio: 1.5,
      max_risk_per_trade: 250,
      require_setup_analysis: true,
      no_revenge_trading: true,
      no_overtrading: true,
      focus_on_a_setups_only: true
    },
    
    pdt_status: 'enabled', // PDT applies to 25K accounts

    // Notification Settings
    notifications: {
      trade_alerts: true,
      price_alerts: false,
      daily_summary: true,
      weekly_report: true,
      monthly_report: true,
      risk_alerts: true,
      goal_achievements: true,
      loss_limit_alerts: true,
      setup_quality_alerts: true
    },

    rules: [], // Removed tier rules
  },

  '50K': {
    id:           '50K',
    label:        '$50K',
    display:      '$50,000',
    account_size: 50000,
    color:        'emerald',
    colorClass:   'text-emerald-400',
    bgClass:      'bg-emerald-500/10',
    borderClass:  'border-emerald-500/30',
    icon:         '🟢',
    badge:        'Standard',
    description:  'Full day trading — no PDT restriction. Balanced risk with 1% per trade and a 2% daily loss cap.',

    daily_profit_target:  500,
    max_dollars:          1000,

    risk_amount:               500,
    position_sizing_percent:   0.01,  // 1% of account (as decimal)
    default_stop_loss_percent: 0.04, // 4% (as decimal)

    max_position_value:  10000,
    max_positions:       3,
    max_daily_trades:    5,

    float_10m_min_r:    4,
    float_10m_max_r:    7,
    float_10_50m_min_r: 3,
    float_10_50m_max_r: 5,
    float_50_200m_min_r:2,
    float_50_200m_max_r:3,
    float_200m_min_r:   1,
    float_200m_max_r:   2,

    rules: [], // Removed tier rules
  },

  '100K': {
    id:           '100K',
    label:        '$100K',
    display:      '$100,000',
    account_size: 100000,
    color:        'purple',
    colorClass:   'text-purple-400',
    bgClass:      'bg-purple-500/10',
    borderClass:  'border-purple-500/30',
    icon:         '🟣',
    badge:        'Professional',
    description:  'Professional-level capital. Wider position flexibility, tighter loss controls, higher targets.',

    daily_profit_target:  1000,
    max_dollars:          2000,

    risk_amount:               1000,
    position_sizing_percent:   0.01,  // 1% of account (as decimal)
    default_stop_loss_percent: 0.035, // 3.5% (as decimal)

    max_position_value:  20000,
    max_positions:       4,
    max_daily_trades:    8,

    float_10m_min_r:    5,
    float_10m_max_r:    8,
    float_10_50m_min_r: 3,
    float_10_50m_max_r: 5,
    float_50_200m_min_r:2,
    float_50_200m_max_r:4,
    float_200m_min_r:   1.5,
    float_200m_max_r:   3,

    rules: [], // Removed tier rules
  },

  '200K': {
    id:           '200K',
    label:        '$200K',
    display:      '$200,000',
    account_size: 200000,
    color:        'amber',
    colorClass:   'text-amber-400',
    bgClass:      'bg-amber-500/10',
    borderClass:  'border-amber-500/30',
    icon:         '🟡',
    badge:        'Elite',
    description:  'Elite capital. Lower risk % for capital preservation. Focus on larger R:R setups with float-based sizing.',

    daily_profit_target:  2000,
    max_dollars:          4000,

    risk_amount:               1500,
    position_sizing_percent:   0.0075, // 0.75% of account (as decimal)
    default_stop_loss_percent: 0.03, // 3% (as decimal)

    max_position_value:  40000,
    max_positions:       5,
    max_daily_trades:    10,

    float_10m_min_r:    6,
    float_10m_max_r:    10,
    float_10_50m_min_r: 4,
    float_10_50m_max_r: 6,
    float_50_200m_min_r:2.5,
    float_50_200m_max_r:4,
    float_200m_min_r:   1.5,
    float_200m_max_r:   3,

    rules: [], // Removed tier rules
  },

  'custom': {
    id:           'custom',
    label:        'Custom',
    display:      'Custom',
    account_size: null,
    color:        'white',
    colorClass:   'text-white/60',
    bgClass:      'bg-white/5',
    borderClass:  'border-white/20',
    icon:         '⚙️',
    badge:        'Custom',
    description:  'Manually configure every parameter to match your exact trading plan.',

    daily_profit_target:  null,
    max_dollars:          null,

    risk_amount:               null,
    position_sizing_percent:   0.01,  // 1% of account (as decimal)
    default_stop_loss_percent: 0.04, // 4% (as decimal)

    max_position_value:  null,
    max_positions:       null,
    max_daily_trades:    null,

    float_10m_min_r:    4,
    float_10m_max_r:    7,
    float_10_50m_min_r: 3,
    float_10_50m_max_r: 5,
    float_50_200m_min_r:2,
    float_50_200m_max_r:3,
    float_200m_min_r:   1,
    float_200m_max_r:   2,

    rules: [],
  },
};

export const ACCOUNT_TIER_IDS = ['25K', '50K', '100K', '200K', 'custom'];

// Store for custom tier modifications
const TIER_CUSTOMIZATIONS = {};

/**
 * Get custom modifications for a specific tier
 */
export function getTierCustomizations(tierId) {
  return TIER_CUSTOMIZATIONS[tierId] || {};
}

/**
 * Save custom modifications for a specific tier
 */
export function saveTierCustomizations(tierId, customizations) {
  TIER_CUSTOMIZATIONS[tierId] = { ...customizations };
}

/**
 * Get tier settings with custom modifications applied
 */
export function getTierSettingsWithCustomizations(tierId) {
  const baseSettings = getTierSettingsFields(tierId);
  const customizations = getTierCustomizations(tierId);
  
  // Merge base settings with custom modifications
  const mergedSettings = { ...baseSettings, ...customizations };
  
  return mergedSettings;
}

/**
 * Get the fields from a tier that should be synced to settings.
 * Excludes UI-only metadata like label, color, etc.
 */
export function getTierSettingsFields(tierId) {
  const tier = ACCOUNT_TIERS[tierId];
  if (!tier) return {};

  return {
    // Account Configuration
    account_size:              tier.account_size,
    account_tier:              tierId,
    
    // Risk Management
    target_profit_dollars:     tier.daily_profit_target,
    max_dollars:               tier.max_dollars,
    risk_amount:               tier.risk_amount,
    position_sizing_percent:   tier.position_sizing_percent,
    default_stop_loss_percent: tier.default_stop_loss_percent,
    max_positions:             tier.max_positions,
    max_daily_trades:          tier.max_daily_trades,
    
    // Float-based Risk Management
    float_10m_min_r:           tier.float_10m_min_r,
    float_10m_max_r:           tier.float_10m_max_r,
    float_10_50m_min_r:        tier.float_10_50m_min_r,
    float_10_50m_max_r:        tier.float_10_50m_max_r,
    float_50_200m_min_r:       tier.float_50_200m_min_r,
    float_50_200m_max_r:       tier.float_50_200m_max_r,
    float_200m_min_r:          tier.float_200m_min_r,
    float_200m_max_r:          tier.float_200m_max_r,
    
    // Journal Integration
    journal_preferences:        tier.journal_preferences,
    analysis_settings:         tier.analysis_settings,
    screenshot_settings:       tier.screenshot_settings,
    
    // Performance Tracking
    performance_goals:        tier.performance_goals,
    weekly_targets:            tier.weekly_targets,
    monthly_targets:           tier.monthly_targets,
    
    // Trading Rules & Schedule
    trading_rules:             tier.trading_rules,
    pdt_status:                tier.pdt_status,
    
    // Notifications
    notifications:             tier.notifications,
  };
}

/**
 * Detect which tier best matches the current settings (for display purposes).
 * Returns the tier ID or 'custom' if no match.
 */
export function detectTierFromSettings(settings) {
  if (!settings?.account_size) return 'custom';

  for (const id of ['25K', '50K', '100K', '200K']) {
    const tier = ACCOUNT_TIERS[id];
    if (tier.account_size === Number(settings.account_size)) return id;
  }

  return 'custom';
}


