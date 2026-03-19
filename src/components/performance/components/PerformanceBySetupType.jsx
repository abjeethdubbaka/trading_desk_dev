import React from 'react';
import {
  calculatePerformanceBySetupType,
  formatCurrency,
  formatPercentage
} from '../utils';
import { CHART_COLORS } from '../constants';

export function PerformanceBySetupType({ data, trades = [] }) {
  const resolvedData = Array.isArray(data)
    ? data
    : calculatePerformanceBySetupType(Array.isArray(trades) ? trades : []);

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Setup Type</h3>
      
      {resolvedData.length === 0 || resolvedData.every(d => d.trades === 0) ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No trade data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resolvedData.filter(d => d.trades > 0).map((setup, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-white truncate" title={setup.setup}>
                  {setup.setup}
                </div>
                <div className="text-sm">
                  <span className={setup.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatCurrency(setup.totalPnL)}
                  </span>
                  <span className="text-gray-400 ml-2">
                    <span className={setup.winRate >= 50 ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                      {formatPercentage(setup.winRate)}
                    </span>
                    <span className="font-bold ml-2">{setup.trades}</span>
                  </span>
                </div>
              </div>
              
              {/* P&L Bar */}
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    setup.totalPnL >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(setup.totalPnL) / 1000 * 100, 100)}%`
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

export default PerformanceBySetupType;
