import React, { useState } from 'react';
import { PieChart, ChevronRight } from 'lucide-react';
import SetupItem from './SetupItem';

const SetupAnalysis = ({ 
  setupAnalysis, 
  expandedSetups, 
  onToggleSetup,
  selectedTimePeriod,
  timePerformance,
  onTimePeriodSelect 
}) => {
  const [isTimePerformanceExpanded, setIsTimePerformanceExpanded] = useState(false);
  const [isSetupPerformanceExpanded, setIsSetupPerformanceExpanded] = useState(false);
  
  // Debug logging
  
  
  
  
  const tradesData = JSON.parse(localStorage.getItem('trades') || '[]');
  
  
  
  
  const sortedSetups = Object.entries(setupAnalysis)
    .sort(([,a], [,b]) => Math.abs(b.totalPnL) - Math.abs(a.totalPnL));

  const maxAbsPnL = Math.max(...sortedSetups.map(([,d]) => Math.abs(d.totalPnL)));

  if (sortedSetups.length === 0) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsSetupPerformanceExpanded(!isSetupPerformanceExpanded)}
        className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 hover:text-white/80 transition-colors"
      >
        <PieChart className="w-4 h-4 text-amber-400" />
        Setup Performance
        <ChevronRight 
          className={`w-3 h-3 transition-transform ${
            isSetupPerformanceExpanded ? 'rotate-90' : ''
          }`} 
        />
      </button>
      
      {isSetupPerformanceExpanded && (
        <div className="space-y-2">
          {sortedSetups.map(([setup, data]) => (
            <SetupItem
              key={setup}
              setup={setup}
              data={data}
              maxPnL={maxAbsPnL}
              isExpanded={expandedSetups.has(setup)}
              onToggle={() => onToggleSetup(setup)}
            />
          ))}
        </div>
      )}

      {/* Time Period Analysis */}
      <div className="pt-2 border-t border-white/10">
        <button
          onClick={() => setIsTimePerformanceExpanded(!isTimePerformanceExpanded)}
          className="w-full flex items-center justify-between text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 hover:text-white/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-400" />
            Time Performance
          </div>
          <ChevronRight 
            className={`w-3 h-3 transition-transform ${
              isTimePerformanceExpanded ? 'rotate-90' : ''
            }`} 
          />
        </button>
        
        {isTimePerformanceExpanded && (
          timePerformance && timePerformance.periods && timePerformance.periods.length > 0 ? (
            <div className="space-y-1">
              {timePerformance.periods.map((period) => (
                <SetupItem
                  key={period.period}
                  setup={period.period}
                  data={period}
                  maxPnL={Math.max(...timePerformance.periods.map(p => Math.abs(p.totalPnL)))}
                  isExpanded={selectedTimePeriod === period.period}
                  onToggle={() => onTimePeriodSelect(
                    selectedTimePeriod === period.period ? null : period.period
                  )}
                />
              ))}
            </div>
          ) : (
            <div className="p-3 border border border-white/10 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-white/70 mb-1">
                  No time data available
                </div>
                <div className="text-xs text-white/50">
                  Add trades with entry times to see hourly performance analysis
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SetupAnalysis;


