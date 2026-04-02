import React from 'react';
import { formatCurrency, formatPercentage } from './utils';

export default function PerformanceByHoldDurationBuckets({ data = [] }) {
  const resolvedData = Array.isArray(data) ? data : [];
  const hasData = resolvedData.length > 0;
  const maxTrades = hasData ? Math.max(...resolvedData.map((item) => item.trades || 0), 1) : 1;
  const maxAbsPnL = hasData ? Math.max(...resolvedData.map((item) => Math.abs(item.totalPnL || 0)), 1) : 1;

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-[#141b21] to-[#101317] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Hold Duration Buckets (5m)</h3>
        <p className="text-xs text-white/45 mt-1">Trade quality by 5-minute hold windows</p>
      </div>

      {!hasData ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No closed trades with entry and exit times yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {resolvedData.map((bucket) => (
            <div key={bucket.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="flex justify-between items-center mb-2 gap-3">
                <div>
                  <p className="font-medium text-white">{bucket.label}</p>
                  <p className="text-[11px] text-white/45">{bucket.trades} trade{bucket.trades === 1 ? '' : 's'}</p>
                </div>
                <div className="text-sm text-right">
                  <span className={bucket.totalPnL >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                    {formatCurrency(bucket.totalPnL)}
                  </span>
                  <span className="text-gray-400 ml-2">
                    <span className={bucket.winRate >= 50 ? 'text-emerald-300 font-bold' : 'text-red-300'}>
                      {formatPercentage(bucket.winRate)}
                    </span>
                    <span className="font-bold ml-2">{bucket.winners}/{bucket.trades}</span>
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-white/55 mb-2">
                Avg {formatCurrency(bucket.avgPnL)} | Median {formatCurrency(bucket.medianPnL)} | Avg Hold {bucket.avgHoldMinutes.toFixed(1)}m
              </p>

              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    bucket.totalPnL >= 0
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : 'bg-gradient-to-r from-rose-500 to-orange-400'
                  }`}
                  style={{
                    width: `${Math.max(4, Math.max(
                      (bucket.trades / maxTrades) * 100,
                      (Math.abs(bucket.totalPnL || 0) / maxAbsPnL) * 100
                    ))}%`
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
