/**
 * @file src/lib/ai/utils/parsers.js
 *
 * Parsing utilities for AI analysis data.
 */

export function parseDollarAmount(amountString) {
  if (!amountString || typeof amountString !== 'string') {
    return 0;
  }

  // Remove $ and commas, then parse as number
  const cleaned = amountString.replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

export function parseTimeframe(timeframeString) {
  if (!timeframeString || typeof timeframeString !== 'string') {
    return null;
  }

  // Normalize timeframe format
  const normalized = timeframeString.toLowerCase().trim();
  
  // Common timeframe mappings
  const timeframeMap = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': 'daily',
    'daily': 'daily',
    '1w': 'weekly',
    'weekly': 'weekly',
    '1mn': '1m',
    '5mn': '5m',
    '15mn': '15m',
    '30mn': '30m',
    '1hr': '1h',
    '4hr': '4h',
    '1day': 'daily',
    '1week': 'weekly'
  };

  return timeframeMap[normalized] || normalized;
}

export function parseGrade(gradeString) {
  if (!gradeString || typeof gradeString !== 'string') {
    return 'C'; // Default grade
  }

  const grade = gradeString.toUpperCase().trim();
  const validGrades = ['A', 'B', 'C', 'D', 'F'];
  
  return validGrades.includes(grade) ? grade : 'C';
}

export function parsePriority(priorityString) {
  if (!priorityString || typeof priorityString !== 'string') {
    return 'medium'; // Default priority
  }

  const priority = priorityString.toLowerCase().trim();
  const validPriorities = ['high', 'medium', 'low'];
  
  return validPriorities.includes(priority) ? priority : 'medium';
}


