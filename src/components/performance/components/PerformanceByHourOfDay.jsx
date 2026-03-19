import React from 'react';
import { formatCurrency, formatPercentage } from '../utils';
import { CHART_COLORS } from '../constants';

export function PerformanceByHourOfDay({ data }) {
  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Hour of Day</h3>
      
      {data.length === 0 || data.every(d => d.trades === 0) ? (
        <div className="h-64 mb-4">
          <div className="text-center py-8">
            <p className="text-gray-400">No trade data available</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.filter(d => d.trades > 0).map((hour, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-white">{hour.hour}</div>
                <div className="text-sm">
                  <span className={hour.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatCurrency(hour.totalPnL)}
                  </span>
                  <span className="text-gray-400 ml-2">
                    <span className={hour.winRate >= 50 ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                      {formatPercentage(hour.winRate)}
                    </span>
                    <span className="font-bold ml-2">{hour.trades}</span>
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    hour.totalPnL >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(hour.totalPnL) / 1000 * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
