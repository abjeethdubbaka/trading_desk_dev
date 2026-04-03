/**
 * Canonical entity shapes, defaults, and query keys
 */

// Trade entity schema
export const TradeSchema = {
  required: [
    'symbol',
    'entry_price', 
    'quantity',
    'entry_time'
  ],
  optional: [
    // Basic Trade Info
    'direction',
    'setup_type',
    'custom_setup_type',
    'account_tier', // Track which account tier was used for this trade
    
    // Risk Management
    'stop_loss',
    'target_price',
    'risk_amount',
    'position_size_percent',
    'risk_reward_ratio',
    
    // Timing
    'exit_time',
    'hold_duration_minutes',
    
    // Financials
    'pnl',
    'pnl_percent',
    'commission',
    'r_multiple',
    
    // Market Context
    'market_condition',
    'float_category',
    'share_float',
    'share_float_range',
    'sector',
    'news_impact',
    
    // Journal & Analysis
    'notes',
    'lessons',
    'reflection_answers',
    'strategy_step_results',
    'dos_donts_rule_ids',
    'emotions',
    'emotion_before',
    'emotion_after',
    'followed_plan',
    'plan_rating',
    'entry_quality',
    'exit_quality',
    
    // Media & Screenshots
    'screenshot_url',
    'entry_screenshot',
    'exit_screenshot',
    
    // Tags & Categorization
    'tags',
    'trade_mistakes',
    'trade_successes',
    
    // AI Analysis
    'ai_analysis',
    'ai_suggestions',
    'improvement_areas',
    
    // Metadata
    'created_date',
    'updated_date'
  ],
  defaults: {
    direction: 'long',
    followed_plan: true,
    commission: 0,
    tags: [],
    emotions: [],
    plan_rating: 3, // 1-5 scale
    entry_quality: 3, // 1-5 scale
    exit_quality: 3, // 1-5 scale
    market_condition: 'neutral',
    news_impact: 'none',
    account_tier: 'custom' // Default to custom if not specified
  }
};

// Settings entity schema
export const SettingsSchema = {
  required: [],
  optional: [
    // Account Configuration
    'account_size',
    'account_tier',
    
    // Risk Management
    'risk_amount',
    'position_sizing_percent', 
    'default_stop_loss_percent',
    'max_dollars',
    'max_positions',
    'max_daily_trades',
    'target_profit_dollars',
    'analysis_timer_seconds',
    'exit_strategy',
    
    // Float-based Risk Management
    'float_categories',
    'float_10m_min_r',
    'float_10m_max_r', 
    'float_10_50m_min_r',
    'float_10_50m_max_r',
    'float_50_200m_min_r',
    'float_50_200m_max_r',
    'float_200m_min_r',
    'float_200m_max_r',
    
    // Trading Schedule & Rules
    'trading_hours',
    'trading_rules',
    'strategy_steps',
    'strategy_steps_by_setup',
    'pdt_status',
    
    // Performance Tracking
    'performance_goals',
    'weekly_targets',
    'monthly_targets',
    
    // Journal Integration
    'journal_preferences',
    'analysis_settings',
    'screenshot_settings',
    
    // Notifications & Alerts
    'notifications',
    
    // UI Preferences
    'ui_preferences',
    
    // Data & Export
    'export_preferences',
    'backup_settings'
  ],
  defaults: {
    // Account Configuration
    account_size: 50000,
    account_tier: 'custom',
    
    // Risk Management
    risk_amount: 500,
    position_sizing_percent: 0.01,  // 1% as decimal
    default_stop_loss_percent: 0.04, // 4% as decimal
    max_dollars: 1000,
    max_positions: 3,
    max_daily_trades: 5,
    target_profit_dollars: 500,
    analysis_timer_seconds: 180,
    exit_strategy: {
      levels: [
        { r: 1, percent: 33, trailingStop: false },
        { r: 2, percent: 33, trailingStop: false },
        { r: 3, percent: 34, trailingStop: true },
      ]
    },
    
    // Float-based Risk Management
    float_categories: {
      micro: { min: 0, max: 10, color: 'red' },
      small: { min: 10, max: 50, color: 'orange' },
      medium: { min: 50, max: 200, color: 'yellow' },
      large: { min: 200, max: 1000, color: 'green' },
      mega: { min: 1000, max: Infinity, color: 'blue' }
    },
    float_10m_min_r: 4,
    float_10m_max_r: 7,
    float_10_50m_min_r: 3,
    float_10_50m_max_r: 5,
    float_50_200m_min_r: 2,
    float_50_200m_max_r: 3,
    float_200m_min_r: 1,
    float_200m_max_r: 2,
    
    // Trading Schedule & Rules
    trading_hours: {
      market_open: '09:30',
      market_close: '16:00',
      timezone: 'America/New_York',
      trading_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    trading_rules: {
      max_consecutive_losses: 2,
      max_daily_loss_percent: 0.02,
      require_stop_loss: true,
      require_position_size_calc: true,
      min_risk_reward_ratio: 1.5
    },
    strategy_steps: [],
    strategy_steps_by_setup: {},
    pdt_status: 'enabled', // 'enabled', 'disabled', 'pattern_day_trader'
    
    // Performance Tracking
    performance_goals: {
      weekly_profit_target: 1000,
      monthly_profit_target: 4000,
      max_weekly_losses: 3,
      win_rate_target: 0.60,
      avg_win_target: 300,
      avg_loss_limit: 200
    },
    weekly_targets: {
      profit_target: 1000,
      max_trades: 20,
      max_losses: 3
    },
    monthly_targets: {
      profit_target: 4000,
      max_trades: 80,
      max_losses: 12
    },
    
    // Journal Integration
    journal_preferences: {
      auto_screenshot: true,
      require_notes: false,
      require_emotion_tracking: true,
      require_plan_rating: true,
      default_setup_types: ['breakout', 'pullback', 'reversal'],
      tag_system: 'enabled' // 'enabled', 'disabled', 'custom'
    },
    analysis_settings: {
      enable_ai_analysis: false,
      analysis_depth: 'basic', // 'basic', 'detailed', 'comprehensive'
      track_entry_exit_quality: true,
      track_emotional_patterns: true,
      track_setup_performance: true
    },
    screenshot_settings: {
      auto_capture: true,
      capture_entry: true,
      capture_exit: true,
      capture_chart_only: false,
      storage_location: 'cloud' // 'local', 'cloud'
    },
    
    // Notifications & Alerts
    notifications: {
      trade_alerts: true,
      price_alerts: false,
      daily_summary: false,
      weekly_report: true,
      monthly_report: true,
      risk_alerts: true,
      goal_achievements: true
    },
    
    // UI Preferences
    ui_preferences: {
      theme: 'dark',
      compact_mode: false,
      default_dashboard_view: 'overview',
      show_advanced_metrics: false,
      chart_preferences: {
        default_timeframe: '1D',
        show_volume: true,
        show_moving_averages: true
      }
    },
    
    // Data & Export
    export_preferences: {
      default_format: 'csv',
      include_screenshots: false,
      include_notes: true,
      date_range: 'current_month'
    },
    backup_settings: {
      auto_backup: true,
      backup_frequency: 'weekly', // 'daily', 'weekly', 'monthly'
      backup_location: 'cloud',
      retention_days: 90
    }
  }
};

// Calc history entity schema
export const CalcHistorySchema = {
  required: [
    'timestamp'
  ],
  optional: [
    'symbol',
    'entryPrice',
    'shares',
    'stopLossPrice',
    'targetPrice',
    'positionValue',
    'actualRisk',
    'potentialProfit',
    'riskLevel',
    'riskRewardRatio',
    'direction',
    'mode',
    'useIntelligentFlow',
    'floatCategory',
    'notes',
    'tags',
    'created_date',
    'created_at'
  ],
  defaults: {
    calculation_type: 'position_size',
    tags: [],
    timestamp: new Date().toISOString()
  }
};

// Media entity schema
export const MediaSchema = {
  required: [
    'file_name',
    'file_type',
    'file_size',
    'created_at'
  ],
  optional: [
    'trade_id',
    'description',
    'tags',
    'metadata'
  ],
  defaults: {
    tags: [],
    metadata: {}
  }
};

// Query keys for React Query
export const QueryKeys = {
  trades: ['trades'],
  trade: (id) => ['trades', id],
  tradeStats: ['trades', 'stats'],
  settings: ['settings'],
  calcHistory: ['calcHistory'],
  calcHistoryByType: (type) => ['calcHistory', type],
  media: ['media'],
  mediaByTrade: (tradeId) => ['media', 'trade', tradeId]
};

// Entity types
export const EntityTypes = {
  TRADE: 'trade',
  SETTINGS: 'settings', 
  CALC_HISTORY: 'calc_history',
  MEDIA: 'media'
};


