import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isValidTradeTime, getHeatmapKey, filterTradesByPeriod } from '../utils/timeUtils';

export const useHeatmapData = (trades, userId, timePeriod = 'all') => {
  // Fetch trades from database if not provided
  const { data: dbTrades, isLoading, error } = useQuery({
    queryKey: ['trading-heatmap-data', userId],
    queryFn: () => base44.entities.Trade.list('-entry_time'),
    enabled: !trades && !!userId,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const sourceTrades = trades || dbTrades || [];
  
  // Filter trades by time period
  const filteredTrades = useMemo(() => {
    return filterTradesByPeriod(sourceTrades, timePeriod);
  }, [sourceTrades, timePeriod]);

  // Calculate P&L by hour and day
  const heatmapData = useMemo(() => {
    const data = {};
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.entry_time || trade.created_date);
      
      if (isValidTradeTime(date)) {
        const key = getHeatmapKey(date);
        
        if (!data[key]) {
          data[key] = { 
            pnl: 0, 
            count: 0,
            trades: [] // Store individual trades for detailed analysis
          };
        }
        
        data[key].pnl += trade.pnl || 0;
        data[key].count += 1;
        data[key].trades.push(trade);
      }
    });

    return data;
  }, [filteredTrades]);

  // Find min/max for color scaling
  const { minPnl, maxPnl } = useMemo(() => {
    const pnls = Object.values(heatmapData).map(d => d.pnl);
    return {
      minPnl: Math.min(...pnls, 0),
      maxPnl: Math.max(...pnls, 0)
    };
  }, [heatmapData]);

  // Get statistics
  const statistics = useMemo(() => {
    const totalPnL = Object.values(heatmapData).reduce((sum, d) => sum + d.pnl, 0);
    const totalTrades = Object.values(heatmapData).reduce((sum, d) => sum + d.count, 0);
    const bestHour = Object.entries(heatmapData).reduce((best, [key, data]) => 
      data.pnl > (best?.pnl || -Infinity) ? { key, ...data } : best, null);
    const worstHour = Object.entries(heatmapData).reduce((worst, [key, data]) => 
      data.pnl < (worst?.pnl || Infinity) ? { key, ...data } : worst, null);

    return {
      totalPnL,
      totalTrades,
      bestHour,
      worstHour,
      averagePnL: totalTrades > 0 ? totalPnL / totalTrades : 0
    };
  }, [heatmapData]);

  return {
    heatmapData,
    minPnl,
    maxPnl,
    statistics,
    isLoading,
    error,
    hasData: filteredTrades.length > 0,
    filteredTradesCount: filteredTrades.length,
    totalTradesCount: sourceTrades.length
  };
};


