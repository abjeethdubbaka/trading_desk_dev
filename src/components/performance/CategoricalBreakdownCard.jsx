import React from 'react';
import { cn } from '@/lib/utils/general';
import InfoHint from '@/components/ui/InfoHint';

/**
 * Generic "why am I winning/losing" breakdown — shows win/loss $ and trade
 * counts per category for any categorical trade field (exit reason, stop loss
 * reason, market environment, overall rating, improvement area, etc).
 */
export default function CategoricalBreakdownCard({ title, hint, data = [], emptyMessage = 'No data yet' }) {
  const hasData = data.length > 0;
  const maxAbsPnL = hasData ? Math.max(...data.map((row) => Math.abs(row.totalPnL || 0)), 1) : 1;

  return (
    <div className="glass-card rounded-xl border border-white/10 bg-gradient-to-br from-[#151522] to-[#10131b] p-4">
      <div className="mb-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
          {title}
          {hint && <InfoHint text={hint} />}
        </h3>
      </div>

      {!hasData ? (
        <div className="text-center py-6">
          <p className="text-xs text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {data.map((row) => (
            <div key={row.category} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
              <div className="mb-1 flex items-baseline gap-1.5 text-[11px]">
                <p className="font-medium text-white truncate">{row.category}</p>
                <span className={cn(
                  'ml-auto flex-shrink-0 font-mono font-semibold',
                  row.totalPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'
                )}>
                  {row.totalPnL >= 0 ? '+' : ''}${Math.abs(row.totalPnL).toFixed(0)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap overflow-x-auto text-[10px] text-white/45">
                <span>({row.trades} trade{row.trades === 1 ? '' : 's'})</span>
                <span className="text-emerald-300/70">WT: {row.winners}</span>
                <span className="text-red-300/70">LT: {row.losses}</span>
                <span className={cn(row.winRate >= 50 ? 'text-emerald-300/80' : 'text-amber-300/80')}>
                  {row.winRate.toFixed(0)}% win
                </span>
              </div>

              <div className="mt-1.5 w-full bg-white/10 rounded-full h-1.5">
                <div
                  className={cn(
                    'h-1.5 rounded-full',
                    row.totalPnL >= 0
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : 'bg-gradient-to-r from-rose-500 to-orange-400'
                  )}
                  style={{ width: `${Math.max(4, (Math.abs(row.totalPnL || 0) / maxAbsPnL) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
