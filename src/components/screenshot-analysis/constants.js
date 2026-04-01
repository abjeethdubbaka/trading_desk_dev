export const STORAGE_KEY = 'screenshotAnalysisSessions';

export const SETUP_OPTIONS = [
  'vwap_pullback',
  'breakout',
  'reversal',
  'trend_continuation',
  'fakeout',
  'base_build',
  'unknown'
];

export const STATUS_OPTIONS = [
  'suggested',
  'confirmed',
  'edited',
  'rejected',
  'learning_point',
  'needs_review'
];

export const ENTRY_TIMING_OPTIONS = [
  { value: 'perfect', label: 'Perfect' },
  { value: 'too_early', label: 'Too early' },
  { value: 'too_late', label: 'Too late' },
  { value: 'chased', label: 'Chased' }
];

export const EXIT_TIMING_OPTIONS = [
  { value: 'perfect', label: 'Perfect' },
  { value: 'cut_early', label: 'Cut too early' },
  { value: 'held_long', label: 'Held too long' },
  { value: 'panic', label: 'Panic exit' }
];


