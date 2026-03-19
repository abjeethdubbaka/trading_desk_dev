import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { TIME_PERIODS, TIME_PERIOD_LABELS } from '../constants/heatmapConstants';

const HeatmapFilters = ({ timePeriod, onPeriodChange, filteredCount, totalCount }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-400" />
        <div className="flex bg-white/5 rounded-lg p-1">
          {Object.entries(TIME_PERIODS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => onPeriodChange(value)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                timePeriod === value 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {TIME_PERIOD_LABELS[value]}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-white/40">
        {filteredCount !== totalCount && (
          <span>
            Showing {filteredCount} of {totalCount} trades
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(HeatmapFilters);
