/**
 * All validation rules and schemas
 */

import { TradeSchema, SettingsSchema, CalcHistorySchema, MediaSchema } from './index.js';

// Validation rule types
export const ValidationTypes = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
  DATE: 'date',
  EMAIL: 'email',
  URL: 'url',
  POSITIVE_NUMBER: 'positive_number',
  NON_NEGATIVE_NUMBER: 'non_negative_number',
  PERCENTAGE: 'percentage',
  CURRENCY: 'currency',
  SYMBOL: 'symbol',
  TIME: 'time'
};

// Validation rule definitions
export const ValidationRules = {
  [ValidationTypes.REQUIRED]: {
    validate: (value) => value !== undefined && value !== null && value !== '',
    message: 'This field is required'
  },
  
  [ValidationTypes.STRING]: {
    validate: (value) => typeof value === 'string',
    message: 'Must be a string'
  },
  
  [ValidationTypes.NUMBER]: {
    validate: (value) => typeof value === 'number' && !isNaN(value),
    message: 'Must be a number'
  },
  
  [ValidationTypes.BOOLEAN]: {
    validate: (value) => typeof value === 'boolean',
    message: 'Must be true or false'
  },
  
  [ValidationTypes.ARRAY]: {
    validate: (value) => Array.isArray(value),
    message: 'Must be an array'
  },
  
  [ValidationTypes.OBJECT]: {
    validate: (value) => typeof value === 'object' && !Array.isArray(value),
    message: 'Must be an object'
  },
  
  [ValidationTypes.DATE]: {
    validate: (value) => {
      // Allow null/undefined for optional date fields
      if (value === null || value === undefined || value === '') {
        return true;
      }
      return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
    },
    message: 'Must be a valid date'
  },
  
  [ValidationTypes.EMAIL]: {
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Must be a valid email address'
  },
  
  [ValidationTypes.URL]: {
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Must be a valid URL'
  },
  
  [ValidationTypes.POSITIVE_NUMBER]: {
    validate: (value) => typeof value === 'number' && !isNaN(value) && value > 0,
    message: 'Must be a positive number'
  },
  
  [ValidationTypes.NON_NEGATIVE_NUMBER]: {
    validate: (value) => typeof value === 'number' && !isNaN(value) && value >= 0,
    message: 'Must be zero or greater'
  },
  
  [ValidationTypes.PERCENTAGE]: {
    validate: (value) => typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 1,
    message: 'Must be between 0 and 1 (0-100%)'
  },
  
  [ValidationTypes.CURRENCY]: {
    validate: (value) => typeof value === 'number' && !isNaN(value) && value >= 0,
    message: 'Must be a valid currency amount'
  },
  
  [ValidationTypes.SYMBOL]: {
    validate: (value) => !value || value === 'N/A' || (typeof value === 'string' && /^[A-Z]{1,5}$/.test(value)),
    message: 'Must be a valid stock symbol (1-5 uppercase letters)'
  },
  
  [ValidationTypes.TIME]: {
    validate: (value) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value),
    message: 'Must be a valid time (HH:MM format)'
  }
};

// Field validation configurations
export const FieldValidations = {
  // Trade fields
  symbol: [ValidationTypes.REQUIRED, ValidationTypes.SYMBOL],
  entry_price: [ValidationTypes.REQUIRED, ValidationTypes.POSITIVE_NUMBER],
  exit_price: [ValidationTypes.POSITIVE_NUMBER],
  quantity: [ValidationTypes.REQUIRED, ValidationTypes.POSITIVE_NUMBER],
  entry_time: [ValidationTypes.REQUIRED, ValidationTypes.DATE],
  exit_time: [ValidationTypes.DATE],
  hold_duration_minutes: [ValidationTypes.NON_NEGATIVE_NUMBER],
  direction: [ValidationTypes.STRING],
  setup_type: [ValidationTypes.STRING],
  float_category: [ValidationTypes.STRING],
  share_float: [ValidationTypes.NON_NEGATIVE_NUMBER],
  share_float_range: [ValidationTypes.STRING],
  emotions: [ValidationTypes.ARRAY],
  followed_plan: [ValidationTypes.BOOLEAN],
  notes: [ValidationTypes.STRING],
  dos_donts_rule_ids: [ValidationTypes.ARRAY],
  screenshot_url: [ValidationTypes.URL],
  stop_loss: [ValidationTypes.NON_NEGATIVE_NUMBER],
  target_price: [ValidationTypes.POSITIVE_NUMBER],
  commission: [ValidationTypes.NON_NEGATIVE_NUMBER],
  tags: [ValidationTypes.ARRAY],
  
  // Settings fields
  risk_amount: [ValidationTypes.CURRENCY],
  position_sizing_percent: [ValidationTypes.PERCENTAGE],
  default_stop_loss_percent: [ValidationTypes.PERCENTAGE],
  analysis_timer_seconds: [ValidationTypes.NON_NEGATIVE_NUMBER],
  target_profit_dollars: [ValidationTypes.CURRENCY],
  max_dollars: [ValidationTypes.CURRENCY],
  exit_strategy: [ValidationTypes.OBJECT],
  
  // Media fields
  file_name: [ValidationTypes.REQUIRED, ValidationTypes.STRING],
  file_type: [ValidationTypes.REQUIRED, ValidationTypes.STRING],
  file_size: [ValidationTypes.REQUIRED, ValidationTypes.NON_NEGATIVE_NUMBER],
  created_at: [ValidationTypes.REQUIRED, ValidationTypes.DATE],
  trade_id: [ValidationTypes.STRING],
  description: [ValidationTypes.STRING],
  tags: [ValidationTypes.ARRAY],
  metadata: [ValidationTypes.OBJECT]
};

// Validation function
export function validateField(fieldName, value) {
  const rules = FieldValidations[fieldName] || [];
  const errors = [];
  const isEmpty = value === undefined || value === null || value === '';
  const isRequired = rules.includes(ValidationTypes.REQUIRED);

  // Optional fields should accept empty values.
  if (isEmpty && !isRequired) {
    return {
      isValid: true,
      errors: []
    };
  }
  
  for (const ruleType of rules) {
    const rule = ValidationRules[ruleType];
    if (rule && !rule.validate(value)) {
      errors.push(rule.message);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Schema validation function
export function validateSchema(schema, data) {
  const errors = [];
  const warnings = [];
  
  // Check if data is defined
  if (!data || typeof data !== 'object') {
    errors.push('Invalid data: data must be an object');
    return { isValid: errors.length === 0, errors, warnings };
  }
  
  // Check required fields
  for (const field of schema.required) {
    if (!(field in data) || data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} is required`);
    }
  }
  
  // Validate all present fields
  for (const [field, value] of Object.entries(data)) {
    const validation = validateField(field, value);
    if (!validation.isValid) {
      errors.push(...validation.errors.map(error => `${field}: ${error}`));
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Convenience functions for specific schemas
export function validateTrade(data) {
  return validateSchema(TradeSchema, data);
}

export function validateSettings(data) {
  return validateSchema(SettingsSchema, data);
}

export function validateCalcHistoryItem(data) {
  return validateSchema(CalcHistorySchema, data);
}

export function stripUnknownFields(schema, data) {
  const result = {};
  
  // Keep only fields that exist in the schema
  const allFields = [...schema.required, ...Object.keys(schema.fields || {})];
  
  for (const field of allFields) {
    if (field in data) {
      result[field] = data[field];
    }
  }
  
  return result;
}

export function sanitizeTrade(trade = {}) {
  return {
    // Core fields
    symbol: String(trade.symbol || '').trim().toUpperCase(),
    entry_price: parseFloat(trade.entry_price) || 0,
    exit_price: parseFloat(trade.exit_price) || 0,
    quantity: parseInt(trade.quantity || trade.position_size || 0), // Accept both quantity and position_size
    
    // P&L calculation
    pnl: parseFloat(trade.pnl) || 0,
    
    // Timing
    entry_time: trade.entry_time ? new Date(trade.entry_time).toISOString() : null,
    exit_time: trade.exit_time ? new Date(trade.exit_time).toISOString() : null,
    
    // Setup and strategy
    setup_type: String(trade.setup_type || '').trim(),
    custom_setup_type: String(trade.custom_setup_type || '').trim(),
    
    // Risk management
    stop_loss: parseFloat(trade.stop_loss) || null,
    take_profit: parseFloat(trade.take_profit) || null,
    
    // Notes and metadata
    notes: String(trade.notes || '').trim(),
    tags: Array.isArray(trade.tags) ? trade.tags.filter(Boolean) : [],
    
    // Emotion and psychology
    emotion_before: String(trade.emotion_before || '').trim(),
    emotion_after: String(trade.emotion_after || '').trim(),
    
    // Plan adherence
    plan_followed: Boolean(trade.plan_followed),
    
    // Metadata
    created_at: trade.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}


