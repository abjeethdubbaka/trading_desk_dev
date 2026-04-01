export const PERFORMANCE_METRICS = {
  DAY_OF_WEEK: 'day_of_week',
  PRICE_LEVEL: 'price_level',
  HOUR_OF_DAY: 'hour_of_day',
  MONTH_OF_YEAR: 'month_of_year',
  SETUP_TYPE: 'setup_type'
};

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
];

export const MONTHS_OF_YEAR = [
  { value: 0, label: 'January', short: 'Jan' },
  { value: 1, label: 'February', short: 'Feb' },
  { value: 2, label: 'March', short: 'Mar' },
  { value: 3, label: 'April', short: 'Apr' },
  { value: 4, label: 'May', short: 'May' },
  { value: 5, label: 'June', short: 'Jun' },
  { value: 6, label: 'July', short: 'Jul' },
  { value: 7, label: 'August', short: 'Aug' },
  { value: 8, label: 'September', short: 'Sep' },
  { value: 9, label: 'October', short: 'Oct' },
  { value: 10, label: 'November', short: 'Nov' },
  { value: 11, label: 'December', short: 'Dec' }
];

export const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
  hour24: i
}));

export const CHART_COLORS = {
  positive: '#10B981',
  negative: '#EF4444',
  neutral: '#6B7280',
  grid: '#374151',
  text: '#9CA3AF',
  background: '#1F2937'
};

export const CHART_CONFIG = {
  height: 300,
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  barRadius: 4
};


