import React from 'react';
import { formatCurrency } from './utils';
import InfoHint from '@/components/ui/InfoHint';

export default function PerformanceByHoldDurationBuckets({ data = [] }) {
  const resolvedData = Array.isArray(data) ? data : [];
  const hasData = resolvedData.length > 0;
  const maxTrades = hasData ? Math.max(...resolvedData.map((item) => item.trades || 0), 1) : 1;
  const maxAbsPnL = hasData ? Math.max(...resolvedData.map((item) => Math.abs(item.totalPnL || 0)), 1) : 1;

  return (
    <div className="glass-card rounded-xl border border-white/10 bg-gradient-to-br from-[#141b21] to-[#101317] p-4">
      <div className="mb-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
          Hold Duration Buckets (5m)
          <InfoHint text="Trade quality by 5-minute hold windows" />
        </h3>
      </div>

      {!hasData ? (
        <div className="text-center py-6">
          <p className="text-xs text-gray-400">No closed trades with entry and exit times yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {resolvedData.map((bucket) => (
            <div key={bucket.label} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
              <div className="mb-1 flex items-baseline gap-1.5 whitespace-nowrap overflow-x-auto text-[11px]">
                <p className="font-medium text-white">{bucket.label}</p>
                <p className="text-white/45">
                  ({bucket.trades} trade{bucket.trades === 1 ? '' : 's'})
                  <span className="ml-1.5 text-emerald-300/70">WT: {bucket.winners}</span>
                  <span className="ml-1.5 text-red-300/70">LT: {bucket.losses}</span>
                  <span className="ml-1.5 text-emerald-300/80">Win: {formatCurrency(bucket.winPnL)}</span>
                  <span className="ml-1.5 text-red-300/80">Loss: {formatCurrency(bucket.lossPnL)}</span>
                </p>
              </div>

              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
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
