/**
 * Trade validation and sanitization utilities
 */

/**
 * Sanitizes trade data by cleaning and normalizing fields
 * @param {object} trade - Raw trade data
 * @returns {object} Sanitized trade object
 */
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

/**
 * Validates trade data and returns validation result
 * @param {object} trade - Trade data to validate
 * @returns {object} Validation result with isValid and errors
 */
export function validateTrade(trade = {}) {
  const errors = [];
  const warnings = [];
  
  // First sanitize the trade
  const sanitizedTrade = sanitizeTrade(trade);
  
  // Use sanitized trade for validation
  const tradeToValidate = sanitizedTrade;
  
  // Required fields
  if (!tradeToValidate.symbol || tradeToValidate.symbol.trim() === '') {
    errors.push('Symbol is required');
  }
  
  if (tradeToValidate.entry_price === undefined || tradeToValidate.entry_price === null || isNaN(tradeToValidate.entry_price)) {
    errors.push('Entry price is required and must be a number');
  }
  
  if (trade.exit_price === undefined || trade.exit_price === null || isNaN(trade.exit_price)) {
    errors.push('Exit price is required and must be a number');
  }
  
  if (tradeToValidate.quantity === undefined || tradeToValidate.quantity === null || isNaN(tradeToValidate.quantity) || tradeToValidate.quantity <= 0) {
    errors.push('Quantity is required and must be a positive number');
  }
  
  // Logical validations
  if (tradeToValidate.entry_price && tradeToValidate.exit_price && tradeToValidate.entry_price <= 0) {
    errors.push('Entry price must be greater than 0');
  }
  
  if (tradeToValidate.exit_price && tradeToValidate.exit_price <= 0) {
    errors.push('Exit price must be greater than 0');
  }
  
  // Stop loss and take profit validations
  if (tradeToValidate.stop_loss !== null && tradeToValidate.stop_loss !== undefined) {
    if (isNaN(tradeToValidate.stop_loss)) {
      errors.push('Stop loss must be a valid number');
    } else if (tradeToValidate.entry_price && tradeToValidate.stop_loss <= 0) {
      errors.push('Stop loss must be greater than 0');
    }
  }
  
  if (tradeToValidate.take_profit !== null && tradeToValidate.take_profit !== undefined) {
    if (isNaN(tradeToValidate.take_profit)) {
      errors.push('Take profit must be a valid number');
    } else if (tradeToValidate.take_profit <= 0) {
      errors.push('Take profit must be greater than 0');
    }
  }
  
  // Time validations
  if (tradeToValidate.entry_time && !isValidDate(tradeToValidate.entry_time)) {
    errors.push('Entry time must be a valid date');
  }
  
  if (tradeToValidate.exit_time && !isValidDate(tradeToValidate.exit_time)) {
    errors.push('Exit time must be a valid date');
  }
  
  if (tradeToValidate.entry_time && tradeToValidate.exit_time && new Date(tradeToValidate.entry_time) >= new Date(tradeToValidate.exit_time)) {
    errors.push('Exit time must be after entry time');
  }
  
  // P&L validation
  if (tradeToValidate.pnl !== undefined && tradeToValidate.pnl !== null && isNaN(tradeToValidate.pnl)) {
    errors.push('P&L must be a valid number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to validate date strings
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Whether the date is valid
 */
function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validates and sanitizes trade data in one step
 * @param {object} trade - Raw trade data
 * @returns {object} { isValid, errors, sanitizedTrade }
 */
export function processTrade(trade = {}) {
  const sanitized = sanitizeTrade(trade);
  const validation = validateTrade(sanitized);
  
  return {
    ...validation,
    sanitizedTrade: sanitized
  };
}
