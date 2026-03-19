/**
 * Validate a single trade for data consistency
 */
export const validateTrade = (trade) => {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!trade.symbol) {
    errors.push('Symbol is required');
  }

  if (!trade.entry_price && !trade.price) {
    errors.push('Entry price is required');
  }

  // Direction validation
  if (trade.direction) {
    const validDirections = ['long', 'short'];
    if (!validDirections.includes(trade.direction)) {
      errors.push('Direction must be either "long" or "short"');
    }
  }

  // Price logic validation
  if (trade.entry_price && trade.exit_price) {
    const entry = parseFloat(trade.entry_price);
    const exit = parseFloat(trade.exit_price);
    const isLong = trade.direction === 'long';
    
    if (isLong && exit < entry) {
      warnings.push('Long trade shows loss - verify exit price is correct');
    }
    
    if (!isLong && exit > entry) {
      warnings.push('Short trade shows loss - verify exit price is correct');
    }
  }

  // P&L consistency check
  if (trade.pnl && trade.entry_price && trade.position_size && !trade.exit_price) {
    warnings.push('Trade has P&L but no exit price');
  }

  if (trade.pnl && !trade.exit_price && !trade.pnl_calculated) {
    warnings.push('P&L provided without exit price - may be manual entry');
  }

  // Position size validation
  if (trade.position_size && trade.position_size <= 0) {
    errors.push('Position size must be greater than 0');
  }

  // R multiple validation
  if (trade.r_multiple) {
    const r = parseFloat(trade.r_multiple);
    if (isNaN(r)) {
      warnings.push('R-multiple should be a number');
    }
  }

  // Date validation
  if (trade.entry_time) {
    const entryDate = new Date(trade.entry_time);
    if (isNaN(entryDate.getTime())) {
      errors.push('Invalid entry date/time format');
    }
  }

  if (trade.exit_time) {
    const exitDate = new Date(trade.exit_time);
    if (isNaN(exitDate.getTime())) {
      errors.push('Invalid exit date/time format');
    }
  }

  if (trade.entry_time && trade.exit_time) {
    const entryDate = new Date(trade.entry_time);
    const exitDate = new Date(trade.exit_time);
    if (exitDate < entryDate) {
      warnings.push('Exit time is before entry time');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0
  };
};

/**
 * Validate multiple trades at once
 */
export const validateTrades = (trades) => {
  const results = trades.map((trade, index) => ({
    index,
    ...validateTrade(trade)
  }));

  return {
    trades: results,
    summary: {
      total: trades.length,
      valid: results.filter(r => r.isValid && !r.hasWarnings).length,
      validWithWarnings: results.filter(r => r.isValid && r.hasWarnings).length,
      invalid: results.filter(r => !r.isValid).length,
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
    }
  };
};

/**
 * Check if trade is a duplicate
 */
export const isDuplicateTrade = (trade, existingTrades) => {
  return existingTrades.some(existing => 
    existing.symbol === trade.symbol &&
    existing.entry_price === trade.entry_price &&
    existing.entry_time === trade.entry_time &&
    existing.direction === trade.direction
  );
};

/**
 * Sanitize trade data before saving
 */
export const sanitizeTrade = (trade) => {
  const sanitized = { ...trade };

  // Convert string numbers to actual numbers
  if (sanitized.entry_price) sanitized.entry_price = parseFloat(sanitized.entry_price);
  if (sanitized.exit_price) sanitized.exit_price = parseFloat(sanitized.exit_price);
  if (sanitized.position_size) sanitized.position_size = parseInt(sanitized.position_size, 10);
  if (sanitized.pnl) sanitized.pnl = parseFloat(sanitized.pnl);
  if (sanitized.r_multiple) sanitized.r_multiple = parseFloat(sanitized.r_multiple);

  // Standardize direction values
  if (sanitized.direction && typeof sanitized.direction === 'string') {
    const direction = sanitized.direction.toLowerCase();
    // Map 'buy'/'sell' to 'long'/'short'
    if (direction === 'buy') {
      sanitized.direction = 'long';
    } else if (direction === 'sell') {
      sanitized.direction = 'short';
    } else {
      sanitized.direction = direction;
    }
  }

  // Remove empty strings
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === '' || sanitized[key] === null || sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });

  // Add timestamps
  sanitized.updated_date = new Date().toISOString();
  if (!sanitized.created_date) {
    sanitized.created_date = new Date().toISOString();
  }

  return sanitized;
};

/**
 * Calculate missing trade fields
 */
export const calculateMissingFields = (trade) => {
  const calculated = { ...trade };

  // Calculate P&L if missing but we have entry, exit, and size
  if (!calculated.pnl && calculated.entry_price && calculated.exit_price && calculated.position_size) {
    const entry = parseFloat(calculated.entry_price);
    const exit = parseFloat(calculated.exit_price);
    const size = parseInt(calculated.position_size, 10);
    const multiplier = calculated.direction === 'long' ? 1 : -1;
    
    calculated.pnl = (exit - entry) * size * multiplier;
    calculated.pnl_calculated = true;
  }

  // Calculate P&L percentage
  if (calculated.pnl && calculated.entry_price && calculated.position_size) {
    const entry = parseFloat(calculated.entry_price);
    const size = parseInt(calculated.position_size, 10);
    const cost = entry * size;
    if (cost > 0) {
      calculated.pnl_percent = (calculated.pnl / cost) * 100;
    }
  }

  // Calculate R-multiple if missing but we have risk amount
  if (!calculated.r_multiple && calculated.pnl && calculated.risk_amount) {
    const risk = parseFloat(calculated.risk_amount);
    if (risk > 0) {
      calculated.r_multiple = calculated.pnl / risk;
    }
  }

  return calculated;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (validation) => {
  const messages = [];

  if (validation.errors.length > 0) {
    messages.push(`❌ Errors: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    messages.push(`⚠️ Warnings: ${validation.warnings.join(', ')}`);
  }

  return messages.join('\n');
};