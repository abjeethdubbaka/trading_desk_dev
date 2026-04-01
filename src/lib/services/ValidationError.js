/**
 * @file src/lib/services/ValidationError.js
 *
 * Custom validation error class for structured error handling.
 */

export class ValidationError extends Error {
  constructor(errors, data = null) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
    this.errors = errors;      // Array of error messages
    this.data = data;          // Original data that failed validation
    this.timestamp = new Date().toISOString();
  }

  /**
   * Get errors as a formatted string
   */
  getErrorString() {
    return this.errors.join('; ');
  }

  /**
   * Check if a specific field has an error
   */
  hasFieldError(field) {
    return this.errors.some(error => 
      error.toLowerCase().includes(field.toLowerCase())
    );
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field) {
    return this.errors.filter(error => 
      error.toLowerCase().includes(field.toLowerCase())
    );
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors,
      data: this.data,
      timestamp: this.timestamp
    };
  }

  /**
   * Create from a plain object (useful for API responses)
   */
  static fromObject(obj) {
    const error = new ValidationError(obj.errors || [], obj.data);
    error.timestamp = obj.timestamp || error.timestamp;
    return error;
  }
}

/**
 * Helper function to create validation errors
 */
export function createValidationError(errors, data) {
  return new ValidationError(
    Array.isArray(errors) ? errors : [errors],
    data
  );
}

/**
 * Helper function to check if an error is a ValidationError
 */
export function isValidationError(error) {
  return error instanceof ValidationError;
}


