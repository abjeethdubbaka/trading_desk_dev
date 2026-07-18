import React from 'react';
import { cn } from '@/lib/utils/general';

export default function TradeSequenceCard({ data = [] }) {
  if (!data.length) return null;

  const baseWinRate = data[0]?.winRate ?? 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#13131e] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-0.5">
        Win Rate by Trade in Session
      </p>
      <p className="text-[11px] text-white/30 mb-4">
        Does your edge hold as you take more trades per day?
      </p>

      <div className="space-y-2.5">
        {data.map((row) => {
          const delta = row.winRate - baseWinRate;
          const isFirst = row.tradeNum === 1;
          const pnlPos = row.avgPnL >= 0;

          return (
            <div key={row.tradeNum} className="flex items-center gap-3">
              <div className="w-9 flex-shrink-0 text-right text-xs font-mono font-semibold text-white/50">
                {row.label}
              </div>

              <div className="relative flex-1 h-7 rounded-lg bg-white/5 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-lg transition-all',
                    row.winRate >= 55 ? 'bg-emerald-500/25' :
                    row.winRate >= 45 ? 'bg-amber-500/20' : 'bg-rose-500/25'
                  )}
                  style={{ width: `${Math.min(100, row.winRate)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-2.5">
                  <span className={cn(
                    'text-xs font-bold',
                    row.winRate >= 55 ? 'text-emerald-300' :
                    row.winRate >= 45 ? 'text-amber-300' : 'text-rose-300'
                  )}>
                    {row.winRate.toFixed(0)}%
                  </span>
                  {!isFirst && (
                    <span className={cn(
                      'text-[10px] font-mono',
                      delta >= 0 ? 'text-emerald-400/60' : 'text-rose-400/60'
                    )}>
                      {delta >= 0 ? '+' : ''}{delta.toFixed(0)}pp
                    </span>
                  )}
                </div>
              </div>

              <div className="w-28 flex-shrink-0 flex items-center justify-end gap-2">
                <span className={cn(
                  'text-xs font-mono',
                  pnlPos ? 'text-emerald-400/70' : 'text-rose-400/70'
                )}>
                  {pnlPos ? '+' : ''}${row.avgPnL}
                </span>
                <span className="text-[10px] text-white/25 font-mono">{row.trades}t</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-white/20">
        pp = percentage points vs first trade of session
      </p>
    </div>
  );
}
