import { TRADING_HOURS } from '../constants/heatmapConstants';

/**
 * Converts 24-hour format to display hour
 * @param {number} hour - Hour in 24-hour format
 * @returns {string} Display hour
 */
export const formatDisplayHour = (hour) => {
  if (hour === 12) return '12';
  if (hour > 12) return (hour - 12).toString();
  return hour.toString();
};

/**
 * Gets all display hours for the heatmap
 * @returns {string[]} Array of display hours
 */
export const getDisplayHours = () => {
  return TRADING_HOURS.map(hour => formatDisplayHour(hour));
};

/**
 * Validates if a trade should be included in heatmap
 * @param {Date} date - Trade date
 * @returns {boolean} Whether trade is valid
 */
export const isValidTradeTime = (date) => {
  const hour = date.getHours();
  const day = date.getDay();
  return hour >= 9 && hour <= 16 && day >= 1 && day <= 5;
};

/**
 * Gets heatmap key for a trade
 * @param {Date} date - Trade date
 * @returns {string} Heatmap key (day-hour)
 */
export const getHeatmapKey = (date) => {
  return `${date.getDay()}-${date.getHours()}`;
};

/**
 * Filters trades by time period
 * @param {Array} trades - Array of trades
 * @param {string} period - Time period ('all', 'weekly', 'monthly')
 * @returns {Array} Filtered trades
 */
export const filterTradesByPeriod = (trades, period) => {
  if (!trades || period === 'all') return trades;
  
  const now = new Date();
  
  if (period === 'weekly') {
    // Get start of current week (Monday)
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysFromMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.entry_time || trade.created_date);
      return tradeDate >= startOfWeek;
    });
  }
  
  if (period === 'monthly') {
    // Get start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.entry_time || trade.created_date);
      return tradeDate >= startOfMonth;
    });
  }
  
  return trades;
};