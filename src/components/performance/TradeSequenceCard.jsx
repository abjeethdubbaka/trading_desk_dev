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
      <p className="text-[11px] text-white/30 mb-5">
        Does your edge hold as you take more trades per day?
      </p>

      <div className="space-y-4">
        {data.map((row) => {
          const delta = row.winRate - baseWinRate;
          const isFirst = row.tradeNum === 1;
          const pnlPos = row.avgPnL >= 0;
          const winColor =
            row.winRate >= 55 ? 'emerald' :
            row.winRate >= 45 ? 'amber' : 'rose';

          return (
            <div key={row.tradeNum} className="space-y-1.5">
              {/* Header row: label · win rate · delta chip · spacer · stats */}
              <div className="flex items-center gap-2">
                <span className="w-8 flex-shrink-0 text-right text-[11px] font-mono font-semibold text-white/40">
                  {row.label}
                </span>

                <span className={cn(
                  'text-lg font-bold tabular-nums leading-none',
                  winColor === 'emerald' ? 'text-emerald-300' :
                  winColor === 'amber'   ? 'text-amber-300'   : 'text-rose-300'
                )}>
                  {row.winRate.toFixed(0)}%
                </span>

                {isFirst ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-white/10 text-white/25 font-medium">
                    baseline
                  </span>
                ) : (
                  <span className={cn(
                    'flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full border',
                    delta > 0  ? 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20' :
                    delta < 0  ? 'text-rose-300 bg-rose-500/10 border-rose-400/20'         :
                                 'text-white/30 bg-white/5 border-white/10'
                  )}>
                    {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'}
                    {' '}{Math.abs(delta).toFixed(0)} pp
                  </span>
                )}

                <div className="flex-1" />

                <span className={cn(
                  'text-[11px] font-mono',
                  pnlPos ? 'text-emerald-400/70' : 'text-rose-400/70'
                )}>
                  avg {pnlPos ? '+' : ''}${Number(row.avgPnL).toFixed(2)}
                </span>
                <span className="text-[10px] text-white/25 font-mono">
                  {row.trades}t
                </span>
              </div>

              {/* Bar: full 0–100 scale with a 50% reference marker */}
              <div className="relative ml-10 h-2 rounded-full bg-white/[0.06] overflow-visible">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    winColor === 'emerald' ? 'bg-emerald-500/55' :
                    winColor === 'amber'   ? 'bg-amber-500/50'   : 'bg-rose-500/50'
                  )}
                  style={{ width: `${Math.min(100, row.winRate)}%` }}
                />
                {/* 50% reference line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-px -translate-y-1/2 w-px h-3.5 bg-white/20 rounded-full" />
              </div>

              {/* Scale labels — only under the last row */}
              {row.tradeNum === data[data.length - 1].tradeNum && (
                <div className="ml-10 flex justify-between">
                  <span className="text-[9px] text-white/15 font-mono">0%</span>
                  <span className="text-[9px] text-white/25 font-mono">50%</span>
                  <span className="text-[9px] text-white/15 font-mono">100%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
