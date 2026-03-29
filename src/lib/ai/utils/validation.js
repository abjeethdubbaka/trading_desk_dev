/**
 * @file src/lib/ai/utils/validation.js
 *
 * Validation utilities for AI analysis results.
 */

export function validateAnalysisResult(result) {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid analysis result: not an object');
  }

  // Validate required fields
  const requiredFields = ['detected_setup', 'trend_direction', 'confidence'];
  for (const field of requiredFields) {
    if (result[field] === undefined || result[field] === null) {
      
    }
  }

  // Validate confidence is a number between 0 and 1
  if (result.confidence !== undefined) {
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      
      result.confidence = Math.max(0, Math.min(1, Number(result.confidence) || 0));
    }
  }

  // Validate entry_quality_score
  if (result.entry_quality_score !== undefined) {
    if (typeof result.entry_quality_score !== 'number' || result.entry_quality_score < 0 || result.entry_quality_score > 10) {
      
      result.entry_quality_score = Math.max(0, Math.min(10, Number(result.entry_quality_score) || 5));
    }
  }

  // Validate arrays
  const arrayFields = ['risk_signals', 'strength_signals'];
  for (const field of arrayFields) {
    if (result[field] !== undefined && !Array.isArray(result[field])) {
      
      result[field] = [];
    }
  }

  return result;
}

export function isValidSetup(setup) {
  const validSetups = [
    'VWAP Pullback', 'Breakout', 'Reversal', 'Continuation', 
    'Range', 'Momentum', 'Consolidation', 'Gap Fill', 'Unknown'
  ];
  return validSetups.includes(setup);
}

export function isValidTrend(trend) {
  const validTrends = ['up', 'down', 'sideways'];
  return validTrends.includes(trend);
}


