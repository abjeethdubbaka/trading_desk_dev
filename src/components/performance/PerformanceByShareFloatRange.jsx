import React from 'react';
import { formatCurrency, formatPercentage } from './utils';

export default function PerformanceByShareFloatRange({ data = [] }) {
  const resolvedData = Array.isArray(data) ? data : [];
  const activeRows = resolvedData.filter((row) => row.trades > 0);
  const hasData = activeRows.length > 0;
  const maxAbsPnL =
    hasData
      ? Math.max(...activeRows.map((row) => Math.abs(row.totalPnL || 0)), 1)
      : 1;

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-[#161423] to-[#10131b] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Share Float Range</h3>
        <p className="mt-1 text-xs text-white/45">How float context impacts consistency and edge quality</p>
      </div>

      {!hasData ? (
        <div className="py-8 text-center">
          <p className="text-gray-400">No share-float performance data available</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeRows.map((bucket) => (
            <div
              key={bucket.key || bucket.range}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{bucket.range}</p>
                  <p className="text-[11px] text-white/45">{bucket.trades} trade{bucket.trades === 1 ? '' : 's'}</p>
                </div>
                <div className="text-right text-sm">
                  <p className={bucket.totalPnL >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                    {formatCurrency(bucket.totalPnL)}
                  </p>
                  <p
                    className={
                      bucket.winRate >= 50
                        ? 'text-[11px] font-semibold text-emerald-300'
                        : 'text-[11px] font-semibold text-red-300'
                    }
                  >
                    {formatPercentage(bucket.winRate)}
                  </p>
                </div>
              </div>

              <p className="mb-2 text-[11px] text-white/55">
                Avg {formatCurrency(bucket.avgPnL)} | Median {formatCurrency(bucket.medianPnL)} | Winners {bucket.winners}
                /{bucket.trades}
              </p>

              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className={`h-2 rounded-full ${
                    bucket.totalPnL >= 0
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : 'bg-gradient-to-r from-rose-500 to-orange-400'
                  }`}
                  style={{
                    width: `${Math.max(4, (Math.abs(bucket.totalPnL || 0) / maxAbsPnL) * 100)}%`,
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
