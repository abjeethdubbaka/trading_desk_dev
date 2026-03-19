import React from 'react';
import {
  calculatePerformanceByPrice,
  formatCurrency,
  formatPercentage
} from '../utils';
import { CHART_COLORS } from '../constants';

export function PerformanceByPrice({ data, trades = [] }) {
  const resolvedData = Array.isArray(data)
    ? data
    : calculatePerformanceByPrice(Array.isArray(trades) ? trades : []);

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Price Level</h3>
      
      {resolvedData.length === 0 || resolvedData.every(d => d.trades === 0) ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No trade data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resolvedData.filter(d => d.trades > 0).map((range, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-white">{range.range}</div>
                <div className="text-sm">
                  <span className={range.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatCurrency(range.totalPnL)}
                  </span>
                  <span className="text-gray-400 ml-2">
                    <span className={range.winRate >= 50 ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                      {formatPercentage(range.winRate)}
                    </span>
                    <span className="font-bold ml-2">{range.trades}</span>
                  </span>
                </div>
              </div>
              
              {/* P&L Bar */}
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    range.totalPnL >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(range.totalPnL) / 1000 * 100, 100)}%`
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

export default PerformanceByPrice;
