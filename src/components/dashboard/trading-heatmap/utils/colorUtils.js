import { COLOR_INTENSITY, COLOR_CLASSES } from '../constants/heatmapConstants';

/**
 * Calculates color intensity based on P&L value
 * @param {number} pnl - Profit/Loss value
 * @param {number} maxPnl - Maximum positive P&L
 * @param {number} minPnl - Minimum negative P&L
 * @returns {string} CSS class for color
 */
export const getColorIntensity = (pnl, maxPnl, minPnl) => {
  if (pnl === 0) return COLOR_CLASSES.PROFIT.NONE;
  
  if (pnl > 0) {
    const intensity = Math.min(pnl / maxPnl, 1);
    return getProfitColor(intensity);
  } else {
    const intensity = Math.min(Math.abs(pnl) / Math.abs(minPnl), 1);
    return getLossColor(intensity);
  }
};

const getProfitColor = (intensity) => {
  if (intensity > COLOR_INTENSITY.HIGH) return COLOR_CLASSES.PROFIT.HIGH;
  if (intensity > COLOR_INTENSITY.MEDIUM) return COLOR_CLASSES.PROFIT.MEDIUM;
  return COLOR_CLASSES.PROFIT.LOW;
};

const getLossColor = (intensity) => {
  if (intensity > COLOR_INTENSITY.HIGH) return COLOR_CLASSES.LOSS.HIGH;
  if (intensity > COLOR_INTENSITY.MEDIUM) return COLOR_CLASSES.LOSS.MEDIUM;
  return COLOR_CLASSES.LOSS.LOW;
};

/**
 * Formats tooltip text for heatmap cell
 * @param {Object} data - Cell data
 * @returns {Object} Formatted tooltip content
 */
export const formatTooltipContent = (data) => {
  if (!data || data.count === 0) {
    return { title: 'No trades', lines: [] };
  }
  
  return {
    title: `$${data.pnl.toFixed(0)}`,
    lines: [
      `${data.count} trade${data.count !== 1 ? 's' : ''}`,
      `Avg: $${(data.pnl / data.count).toFixed(2)}`
    ]
  };
};


