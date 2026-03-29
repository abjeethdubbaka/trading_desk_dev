import { useMemo } from 'react';

export function useJournalAnalytics(trades = []) {
  const overallPerformance = useMemo(() => {
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalTrades = trades.length;
    const wins = trades.filter(trade => (trade.pnl || 0) > 0).length;
    const losses = trades.filter(trade => (trade.pnl || 0) < 0).length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const avgPerTrade = totalTrades > 0 ? totalPnL / totalTrades : 0;
    
    return {
      totalPnL,
      totalTrades,
      wins,
      losses,
      winRate,
      avgPerTrade
    };
  }, [trades]);

  const timePerformance = useMemo(() => {
    // Group trades by hourly periods (8-9, 9-10, 10-11, etc.)
    const periodData = {};
    let totalPnL = 0;
    let totalTrades = 0;
    
    trades.forEach(trade => {
      if (!trade.entry_time) return;
      
      const entryDate = new Date(trade.entry_time);
      const entryHour = entryDate.getHours();
      
      // Determine which period this trade belongs to
      const periodKey = `${entryHour}-${entryHour + 1}`; // e.g., "9-10", "10-11"
      
      // Initialize period data if not exists
      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          totalPnL: 0,
          tradeCount: 0,
          wins: 0,
          losses: 0,
          startHour: entryHour,
          endHour: entryHour + 1
        };
      }
      
      // Add trade data to period
      const pnl = trade.pnl || 0;
      periodData[periodKey].totalPnL += pnl;
      periodData[periodKey].tradeCount += 1;
      
      // Add to overall totals
      totalPnL += pnl;
      totalTrades += 1;
      
      if (pnl > 0) {
        periodData[periodKey].wins += 1;
      } else if (pnl < 0) {
        periodData[periodKey].losses += 1;
      }
    });
    
    // Find the best performing period
    let bestPeriod = null;
    let bestPnL = -Infinity;
    
    Object.entries(periodData).forEach(([period, data]) => {
      if (data.tradeCount >= 2 && data.totalPnL > bestPnL) { // At least 2 trades to be significant
        bestPnL = data.totalPnL;
        bestPeriod = period;
      }
    });
    
    // Return data for best period, or overall averages if no significant period data
    if (bestPeriod !== null) {
      const bestData = periodData[bestPeriod];
      return {
        totalPnL: bestData.totalPnL,
        tradeCount: bestData.tradeCount,
        avgPerTrade: bestData.tradeCount > 0 ? bestData.totalPnL / bestData.tradeCount : 0,
        timeRange: `${bestData.startHour}:00-${bestData.endHour}:00`,
        startHour: bestData.startHour,
        endHour: bestData.endHour,
        // Also include overall averages for comparison
        overallAvgPerTrade: totalTrades > 0 ? totalPnL / totalTrades : 0,
        // Include all periods for display (not just top 5)
        periods: Object.entries(periodData)
          .filter(([, data]) => data.tradeCount >= 1)
          .map(([period, data]) => ({
            period,
            ...data,
            avgPerTrade: data.tradeCount > 0 ? data.totalPnL / data.tradeCount : 0
          }))
          .sort((a, b) => b.totalPnL - a.totalPnL)
      };
    }
    
    // Fallback to overall averages if no significant period data
    return {
      totalPnL,
      tradeCount: totalTrades,
      avgPerTrade: totalTrades > 0 ? totalPnL / totalTrades : 0,
      timeRange: 'All Periods',
      overallAvgPerTrade: totalTrades > 0 ? totalPnL / totalTrades : 0,
      periods: Object.entries(periodData)
        .filter(([, data]) => data.tradeCount >= 1)
        .map(([period, data]) => ({
          period,
          ...data,
          avgPerTrade: data.tradeCount > 0 ? data.totalPnL / data.tradeCount : 0
        }))
        .sort((a, b) => b.totalPnL - a.totalPnL)
    };
  }, [trades]);

  const setupAnalysis = useMemo(() => {
    const setupGroups = {};
    
    trades.forEach(trade => {
      const setup = trade.setup_type || 'Unknown';
      if (!setupGroups[setup]) {
        setupGroups[setup] = {
          totalPnL: 0,
          tradeCount: 0,
          wins: 0,
          losses: 0,
          totalR: 0
        };
      }
      
      const pnl = trade.pnl || 0;
      const rMultiple = parseFloat(trade.r_multiple) || 0;
      
      setupGroups[setup].totalPnL += pnl;
      setupGroups[setup].tradeCount += 1;
      setupGroups[setup].totalR += rMultiple;
      
      if (pnl > 0) setupGroups[setup].wins += 1;
      else if (pnl < 0) setupGroups[setup].losses += 1;
    });
    
    Object.keys(setupGroups).forEach(setup => {
      const group = setupGroups[setup];
      group.winRate = group.tradeCount > 0 ? (group.wins / group.tradeCount) * 100 : 0;
      group.avgR = group.tradeCount > 0 ? group.totalR / group.tradeCount : 0;
    });
    
    return setupGroups;
  }, [trades]);

  return {
    overallPerformance,
    timePerformance,
    setupAnalysis
  };
}


