export const TRADING_HOURS = [9, 10, 11, 12, 13, 14, 15, 16];
export const TRADING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export const DAY_INDICES = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5
};

export const TIME_PERIODS = {
  ALL: 'all',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

export const TIME_PERIOD_LABELS = {
  [TIME_PERIODS.ALL]: 'All Time',
  [TIME_PERIODS.WEEKLY]: 'This Week',
  [TIME_PERIODS.MONTHLY]: 'This Month'
};

export const COLOR_INTENSITY = {
  HIGH: 0.7,
  MEDIUM: 0.4,
  LOW: 0.1
};

export const COLOR_CLASSES = {
  PROFIT: {
    HIGH: 'bg-emerald-500/40 hover:bg-emerald-500/50',
    MEDIUM: 'bg-emerald-500/25 hover:bg-emerald-500/35',
    LOW: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    NONE: 'bg-white/5'
  },
  LOSS: {
    HIGH: 'bg-red-500/40 hover:bg-red-500/50',
    MEDIUM: 'bg-red-500/25 hover:bg-red-500/35',
    LOW: 'bg-red-500/10 hover:bg-red-500/20',
    NONE: 'bg-white/5'
  }
};

export const GRID_COLUMNS = 9; // 1 day label + 8 hours
