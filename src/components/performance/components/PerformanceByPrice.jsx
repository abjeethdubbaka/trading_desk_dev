import React from 'react';
import {
  calculatePerformanceByPrice,
  formatCurrency,
  formatPercentage
} from '../utils';

export function PerformanceByPrice({ data, trades = [] }) {
  const resolvedData = Array.isArray(data)
    ? data
    : calculatePerformanceByPrice(Array.isArray(trades) ? trades : []);
  const activeRows = resolvedData.filter((row) => row.trades > 0);
  const maxAbsPnL = activeRows.length > 0
    ? Math.max(...activeRows.map((row) => Math.abs(row.totalPnL || 0)), 1)
    : 1;

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-[#151522] to-[#10131b] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Price Level</h3>
        <p className="text-xs text-white/45 mt-1">Performance split by entry price ranges</p>
      </div>

      {resolvedData.length === 0 || resolvedData.every((range) => range.trades === 0) ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No trade data available</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeRows.map((range) => (
            <div key={range.range} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="flex justify-between items-center mb-2 gap-3">
                <div>
                  <p className="font-medium text-white">{range.range}</p>
                  <p className="text-[11px] text-white/45">{range.trades} trade{range.trades === 1 ? '' : 's'}</p>
                </div>
                <div className="text-sm text-right">
                  <p className={range.totalPnL >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                    {formatCurrency(range.totalPnL)}
                  </p>
                  <p className={range.winRate >= 50 ? 'text-emerald-300 text-[11px] font-semibold' : 'text-red-300 text-[11px] font-semibold'}>
                    {formatPercentage(range.winRate)}
                  </p>
                </div>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    range.totalPnL >= 0
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : 'bg-gradient-to-r from-rose-500 to-orange-400'
                  }`}
                  style={{
                    width: `${Math.max(4, (Math.abs(range.totalPnL || 0) / maxAbsPnL) * 100)}%`
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


