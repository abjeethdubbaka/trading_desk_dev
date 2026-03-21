/**
 * Canonical entity shapes, defaults, and query keys
 */

// Trade entity schema
export const TradeSchema = {
  required: [
    'symbol',
    'entry_price', 
    'exit_price',
    'quantity',
    'entry_time'
  ],
  optional: [
    'direction',
    'setup_type',
    'emotions',
    'followed_plan',
    'notes',
    'lessons',
    'reflection_answers',
    'screenshot_url',
    'stop_loss',
    'target_price',
    'exit_time',
    'commission',
    'tags'
  ],
  defaults: {
    direction: 'long',
    followed_plan: true,
    commission: 0,
    tags: []
  }
};

// Settings entity schema
export const SettingsSchema = {
  required: [],
  optional: [
    'risk_amount',
    'position_sizing_percent',
    'default_stop_loss_percent',
    'target_profit_dollars',
    'max_dollars',
    'float_categories',
    'trading_hours',
    'notifications',
    'ui_preferences'
  ],
  defaults: {
    risk_amount: 1500,
    position_sizing_percent: 1,
    default_stop_loss_percent: 0.02,
    target_profit_dollars: 500,
    max_dollars: 5000,
    float_categories: {},
    trading_hours: {
      market_open: '09:30',
      market_close: '16:00',
      timezone: 'America/New_York'
    },
    notifications: {
      trade_alerts: true,
      price_alerts: false,
      daily_summary: false
    },
    ui_preferences: {
      theme: 'dark',
      compact_mode: false
    }
  }
};

// Calc history entity schema
export const CalcHistorySchema = {
  required: [
    'calculation_type',
    'input_data',
    'result_data',
    'created_at'
  ],
  optional: [
    'symbol',
    'notes',
    'tags'
  ],
  defaults: {
    calculation_type: 'position_size',
    tags: []
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
