export const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'winners', label: 'Winners' },
  { value: 'losers', label: 'Losers' },
  { value: 'long', label: 'Long' },
  { value: 'short', label: 'Short' }
];

export const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' }
];

export const TRADE_DIRECTIONS = {
  LONG: 'long',
  SHORT: 'short'
};

export const STORAGE_KEYS = {
  TRADES: 'trades',
  SETTINGS: 'journal-settings',
  TEMPLATES: 'trade-templates'
};

export const DEFAULT_SETUP_TYPES = [
  'Breakout',
  'Reversal',
  'Earnings',
  'Gap',
  'Pullback',
  'Scalp',
  'Swing',
  'Other'
];


