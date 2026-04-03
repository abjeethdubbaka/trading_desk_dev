export const DIRECTION_OPTIONS = {
  LONG: 'long',
  SHORT: 'short'
};

export const EMOTION_OPTIONS = [
  { value: 'confident', label: 'Confident', color: 'emerald' },
  { value: 'disciplined', label: 'Disciplined', color: 'blue' },
  { value: 'neutral', label: 'Neutral', color: 'gray' },
  { value: 'nervous', label: 'Nervous', color: 'amber' },
  { value: 'fomo', label: 'FOMO', color: 'orange' },
  { value: 'revenge', label: 'Revenge', color: 'red' }
];

export const MISTAKE_OPTIONS = [
  'Chase',
  'No Stop Loss',
  'Moved Stop Loss',
  'Overtrading',
  'Revenge Trading',
  'FOMO Entry',
  'Too Large Size',
  'Exited Early',
  'Held Too Long',
  'Did Not Follow Plan'
];

export const DEFAULT_SETUP_TYPES = [
  'VWAP Pullback',
  'Breakout',
  'Pullback',
  'Trend Continuation',
  'Reversal',
  'Range Break',
  'Momentum',
  'Scalp',
  'Swing'
];

export const MANUAL_SETUP_TYPE = 'Manual';

export const sanitizeSetupTypes = (setupTypes, fallback = DEFAULT_SETUP_TYPES) => {
  const source = Array.isArray(setupTypes) && setupTypes.length > 0
    ? setupTypes
    : fallback;

  const seen = new Set();
  const sanitized = [];

  source.forEach((setup) => {
    const normalized = String(setup ?? '').trim();
    if (!normalized) return;
    if (normalized.toLowerCase() === MANUAL_SETUP_TYPE.toLowerCase()) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    sanitized.push(normalized);
  });

  return sanitized.length > 0 ? sanitized : [...fallback];
};

export const buildSetupTypeOptions = (setupTypes) => [
  ...sanitizeSetupTypes(setupTypes),
];

// Backward-compatible default export used by Add Trade form.
export const SETUP_TYPE_OPTIONS = buildSetupTypeOptions(DEFAULT_SETUP_TYPES);

