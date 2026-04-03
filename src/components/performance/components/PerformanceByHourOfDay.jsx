import React from 'react';
import {
  calculatePerformanceByHourOfDay,
  formatCurrency,
  formatPercentage
} from '../utils';
import InfoHint from '@/components/ui/InfoHint';

export function PerformanceByHourOfDay({ data, trades = [] }) {
  const resolvedData = Array.isArray(data)
    ? data
    : calculatePerformanceByHourOfDay(Array.isArray(trades) ? trades : []);
  const activeRows = resolvedData.filter((row) => row.trades > 0);
  const maxAbsPnL = activeRows.length > 0
    ? Math.max(...activeRows.map((row) => Math.abs(row.totalPnL || 0)), 1)
    : 1;

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-[#151522] to-[#10131b] p-6">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          Hour of Day
          <InfoHint text="Best trade windows by net outcome and win rate" />
        </h3>
      </div>
      
      {resolvedData.length === 0 || resolvedData.every(d => d.trades === 0) ? (
        <div className="h-64 mb-4">
          <div className="text-center py-8">
            <p className="text-gray-400">No trade data available</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeRows.map((hour) => (
            <div key={hour.hour24} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="flex justify-between items-center mb-2 gap-3">
                <div>
                  <p className="font-medium text-white">{hour.hour}</p>
                  <p className="text-[11px] text-white/45">{hour.trades} trade{hour.trades === 1 ? '' : 's'}</p>
                </div>
                <div className="text-sm text-right">
                  <p className={hour.totalPnL >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                    {formatCurrency(hour.totalPnL)}
                  </p>
                  <p className={hour.winRate >= 50 ? 'text-emerald-300 text-[11px] font-semibold' : 'text-red-300 text-[11px] font-semibold'}>
                    {formatPercentage(hour.winRate)}
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    hour.totalPnL >= 0
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : 'bg-gradient-to-r from-rose-500 to-orange-400'
                  }`}
                  style={{
                    width: `${Math.max(4, (Math.abs(hour.totalPnL || 0) / maxAbsPnL) * 100)}%`
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

export default PerformanceByHourOfDay;


