import React, { useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHeatmapData } from './hooks/useHeatmapData';
import HeatmapHeader from './components/HeatmapHeader';
import HeatmapRow from './components/HeatmapRow';
import HeatmapLegend from './components/HeatmapLegend';
import HeatmapStats from './components/HeatmapStats';
import HeatmapFilters from './components/HeatmapFilters';
import { getDisplayHours } from './utils/timeUtils';
import { TRADING_DAYS, TIME_PERIODS } from './constants/heatmapConstants';

const TradingHeatMap = ({ 
  trades, 
  userId = 'user-123',
  className,
  onCellClick,
  showStats = true,
  isLoading: externalLoading 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState(TIME_PERIODS.ALL);
  const hours = getDisplayHours();
  
  const { 
    heatmapData, 
    minPnl, 
    maxPnl, 
    statistics,
    isLoading, 
    error,
    hasData,
    filteredTradesCount,
    totalTradesCount
  } = useHeatmapData(trades, userId, timePeriod);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger refetch logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
  };

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6 gradient-border">
        <div className="text-red-400 text-center py-8">
          Error loading heatmap data: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card rounded-2xl p-6 gradient-border h-full flex flex-col", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Trading Heat Map</h3>
        </div>
        
        {(isLoading || refreshing) && (
          <RefreshCw className="w-4 h-4 text-white/40 animate-spin" />
        )}
      </div>

      <HeatmapFilters 
        timePeriod={timePeriod}
        onPeriodChange={handlePeriodChange}
        filteredCount={filteredTradesCount}
        totalCount={totalTradesCount}
      />

      {showStats && <HeatmapStats statistics={statistics} />}

      {!hasData && !isLoading ? (
        <div className="text-center py-12 text-white/40 flex-1 flex items-center justify-center">
          No trading data available for heatmap
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="space-y-2 flex-1">
            <HeatmapHeader hours={hours} />
            
            {TRADING_DAYS.map((day, index) => (
              <HeatmapRow
                key={day}
                day={day}
                dayIndex={index}
                hours={hours}
                heatmapData={heatmapData}
                minPnl={minPnl}
                maxPnl={maxPnl}
                onCellClick={onCellClick}
              />
            ))}
          </div>

          <HeatmapLegend />
        </div>
      )}
    </div>
  );
};

export default React.memo(TradingHeatMap);
