/**
 * @file src/lib/services/TradeService/analytics.js
 *
 * Trade analytics and statistics.
 */

import { calcCoreStats } from '../../calculations/trades.js';

export function createTradeAnalytics(service) {
  return {
    async getStats(options = {}) {
      const trades = await service.list(options);
      return calcCoreStats(trades);
    },

    async getStatsByPeriod(period = 'month') {
      const trades = await service.list();
      
      const grouped = trades.reduce((acc, trade) => {
        const date = new Date(trade.entry_time);
        let key;
        
        switch (period) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            key = date.getFullYear().toString();
            break;
          default:
            key = date.toISOString().split('T')[0];
        }
        
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(trade);
        return acc;
      }, {});

      // Calculate stats for each period
      const statsByPeriod = {};
      for (const [period, periodTrades] of Object.entries(grouped)) {
        statsByPeriod[period] = calcCoreStats(periodTrades);
      }

      return statsByPeriod;
    },

    async getPerformanceMetrics() {
      const trades = await service.list();
      
      if (trades.length === 0) {
        return {
          totalTrades: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          totalPnL: 0,
          avgR: 0,
          profitFactor: 0,
          maxDrawdown: 0,
          sharpeRatio: 0
        };
      }

      const stats = calcCoreStats(trades);
      
      // Calculate additional metrics
      const profits = trades
        .filter(t => (t.pnl ?? 0) > 0)
        .map(t => t.pnl ?? 0);
      
      const losses = trades
        .filter(t => (t.pnl ?? 0) < 0)
        .map(t => Math.abs(t.pnl ?? 0));

      const totalProfits = profits.reduce((sum, p) => sum + p, 0);
      const totalLosses = losses.reduce((sum, l) => sum + l, 0);
      
      const profitFactor = totalLosses > 0 ? totalProfits / totalLosses : totalProfits > 0 ? Infinity : 0;
      
      // Calculate running drawdown
      let maxDrawdown = 0;
      let peak = 0;
      let runningPnL = 0;
      
      const sortedTrades = trades.sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time));
      
      for (const trade of sortedTrades) {
        runningPnL += trade.total_pnl || 0;
        peak = Math.max(peak, runningPnL);
        const drawdown = peak - runningPnL;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }

      // Simple Sharpe ratio approximation (assuming 0% risk-free rate)
      const returns = sortedTrades.map(t => (t.total_pnl || 0) / (t.position_value || 1));
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const returnStdDev = Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      );
      const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

      return {
        ...stats,
        profitFactor,
        maxDrawdown,
        sharpeRatio
      };
    }
  };
}


