import React from 'react';
import {
  calculatePerformanceByMonthOfYear,
  formatCurrency,
} from '../utils';
import InfoHint from '@/components/ui/InfoHint';

export function PerformanceByMonthOfYear({ data, trades = [] }) {
  const resolvedData = Array.isArray(data)
    ? data
    : calculatePerformanceByMonthOfYear(Array.isArray(trades) ? trades : []);
  const activeRows = resolvedData.filter((row) => row.trades > 0);
  const maxAbsPnL = activeRows.length > 0
    ? Math.max(...activeRows.map((row) => Math.abs(row.totalPnL || 0)), 1)
    : 1;

  return (
    <div className="glass-card rounded-xl border border-white/10 bg-gradient-to-br from-[#151522] to-[#10131b] p-4">
      <div className="mb-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
          Month of Year
          <InfoHint text="Seasonality snapshot — which months have produced your best and worst results" />
        </h3>
      </div>

      {resolvedData.length === 0 || resolvedData.every((month) => month.trades === 0) ? (
        <div className="text-center py-6">
          <p className="text-xs text-gray-400">No trade data available</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {activeRows.map((month) => (
            <div key={month.month} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
              <div className="mb-1 flex items-baseline gap-1.5 whitespace-nowrap overflow-x-auto text-[11px]">
                <p className="font-medium text-white">{month.month}</p>
                <p className="text-white/45">
                  ({month.trades} trade{month.trades === 1 ? '' : 's'})
                  <span className="ml-1.5 text-emerald-300/70">WT: {month.wins}</span>
                  <span className="ml-1.5 text-red-300/70">LT: {month.losses}</span>
                  <span className="ml-1.5 text-emerald-300/80">Win: {formatCurrency(month.winPnL)}</span>
                  <span className="ml-1.5 text-red-300/80">Loss: {formatCurrency(month.lossPnL)}</span>
                </p>
              </div>

              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    month.totalPnL >= 0
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : 'bg-gradient-to-r from-rose-500 to-orange-400'
                  }`}
                  style={{
                    width: `${Math.max(4, (Math.abs(month.totalPnL || 0) / maxAbsPnL) * 100)}%`
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

export default PerformanceByMonthOfYear;
