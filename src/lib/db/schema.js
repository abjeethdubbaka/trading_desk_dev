/**
 * @file src/lib/db/schema.js
 * Single source of truth for all data shapes in TradeDesk.
 * Used for validation, default values, and documentation.
 * When you move to Supabase, these map directly to table columns.
 */

// ─── Trade ───────────────────────────────────────────────────────────────────

export const TRADE_DEFAULTS = {
  symbol: '',
  direction: 'long',           // 'long' | 'short'
  entry_price: null,
  exit_price: null,
  position_size: null,
  entry_time: null,
  exit_time: null,
  pnl: null,
  r_multiple: null,
  fee: null,
  setup_type: null,
  setup_grade: null,
  emotions: 'neutral',         // 'confident'|'nervous'|'fomo'|'revenge'|'disciplined'|'neutral'
  followed_plan: true,
  mistakes: [],
  lessons: null,
  notes: null,
  screenshots: [],
  breakout_checklist: null,
  reflection_answers: null,
  trade_plan_id: null,
  strategy_preset_id: null,
  dos_donts_rule_ids: [],
};

/**
 * Minimal required fields to create a trade.
 * Everything else has a default or is optional.
 */
export const TRADE_REQUIRED = ['symbol', 'direction', 'entry_price', 'position_size'];

// ─── Settings ─────────────────────────────────────────────────────────────────

export const SETTINGS_DEFAULTS = {
  account_size: 50000,
  position_sizing_percent: 1,
  default_stop_loss_percent: 4,
  target_profit_dollars: 500,
  analysis_timer_seconds: 180,
  max_dollars: 0,              // 0 = disabled
  risk_amount: 1000,
  exit_strategy: {
    levels: [
      { r: 1, percent: 33, trailingStop: false },
      { r: 2, percent: 33, trailingStop: false },
      { r: 3, percent: 34, trailingStop: true },
    ],
  },
  float_categories: {
    micro: { min: 0,          max: 20_000_000,    label: 'Micro',  color: 'text-red-400',     positionMultiplier: 0.3, stopLossPercent: 3.0, maxFloatPercent: 0.1  },
    small: { min: 20_000_000, max: 50_000_000,    label: 'Small',  color: 'text-orange-400',  positionMultiplier: 0.5, stopLossPercent: 3.5, maxFloatPercent: 0.25 },
    medium:{ min: 50_000_000, max: 200_000_000,   label: 'Medium', color: 'text-yellow-400',  positionMultiplier: 0.8, stopLossPercent: 4.0, maxFloatPercent: 0.5  },
    large: { min: 200_000_000,max: 1_000_000_000, label: 'Large',  color: 'text-blue-400',    positionMultiplier: 1.2, stopLossPercent: 5.0, maxFloatPercent: 0.75 },
    mega:  { min: 1_000_000_000, max: Infinity,   label: 'Mega',   color: 'text-emerald-400', positionMultiplier: 1.5, stopLossPercent: 6.0, maxFloatPercent: 1.0  },
  },
  // Float R:R ratios
  float_10m_min_r: 4,
  float_10m_max_r: 7,
  float_10_50m_min_r: 3,
  float_10_50m_max_r: 5,
  float_50_200m_min_r: 2,
  float_50_200m_max_r: 3,
  float_200m_min_r: 1,
  float_200m_max_r: 2,
};

// ─── Watchlist ─────────────────────────────────────────────────────────────────

export const WATCHLIST_DEFAULTS = {
  symbol: '',
  catalyst: null,
  notes: null,
  premarket_high: null,
  premarket_low: null,
  premarket_volume: null,
  float_size: null,            // 'micro'|'small'|'mid'|'large'
  sector: null,
  priority: 'medium',          // 'high'|'medium'|'low'
  status: 'watching',          // 'watching'|'ready'|'triggered'|'passed'
};

// ─── Notification ─────────────────────────────────────────────────────────────

export const NOTIFICATION_DEFAULTS = {
  title: '',
  message: '',
  type: 'reminder',            // 'time_block'|'rule_alert'|'trade_alert'|'reminder'
  trigger_time: null,
  is_recurring: false,
  recurrence_pattern: null,    // 'daily'|'weekly'|'custom'
  is_active: true,
  is_read: false,
  related_symbol: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Merge partial data with defaults, stripping undefined values. */
export function withDefaults(defaults, data = {}) {
  return Object.fromEntries(
    Object.entries({ ...defaults, ...data }).filter(([, v]) => v !== undefined)
  );
}

/** Strip fields that shouldn't be persisted (e.g. computed UI state). */
export function sanitizeForStorage(obj) {
  const clean = { ...obj };
  // Never persist empty strings — use null
  for (const [k, v] of Object.entries(clean)) {
    if (v === '') clean[k] = null;
  }
  return clean;
}


