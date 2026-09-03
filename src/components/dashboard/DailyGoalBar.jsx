import React from 'react';
import { cn } from '@/lib/utils/general';

const toFiniteNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export default function DailyGoalBar({
  todayPnL,
  targetProfit,
  maxDailyLoss,
  embedded = false,
}) {
  const safeTodayPnL = toFiniteNumber(todayPnL, 0);
  const safeTargetProfit = Math.max(0, toFiniteNumber(targetProfit, 100));
  const safeMaxDailyLoss = Math.min(0, toFiniteNumber(maxDailyLoss, -100));

  const pct = safeTargetProfit > 0 ? Math.min(100, Math.max(0, (safeTodayPnL / safeTargetProfit) * 100)) : 0;
  const hitTarget = safeTodayPnL >= safeTargetProfit;
  const hitMax = safeTodayPnL <= safeMaxDailyLoss;
  const barColor = hitMax
    ? 'bg-red-500'
    : hitTarget
      ? 'bg-emerald-500'
      : pct >= 50
        ? 'bg-amber-400'
        : 'bg-blue-500';

  return (
    <div
      className={cn(
        'space-y-2 rounded-xl border px-4 py-3',
        embedded
          ? 'border-white/10 bg-[#101018]'
          : 'border-white/8 bg-[#13131e]'
      )}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-white/45">Weekly goal</span>
        <div className="flex items-center gap-3">
          {hitMax ? <span className="animate-pulse font-semibold text-red-400">Stop trading - max loss hit</span> : null}
          {!hitMax && hitTarget ? <span className="font-semibold text-emerald-400">Goal reached</span> : null}
          <span className={cn('font-mono font-bold', safeTodayPnL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {safeTodayPnL >= 0 ? '+' : ''}${Math.abs(safeTodayPnL).toFixed(0)}
          </span>
          <span className="text-white/30">/ ${safeTargetProfit.toFixed(0)}</span>
          <span className={cn('font-semibold', hitTarget ? 'text-emerald-400' : 'text-white/50')}>{pct.toFixed(0)}%</span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${safeTodayPnL < 0 ? 0 : pct}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-white/25">
        <span>Max loss: ${Math.abs(safeMaxDailyLoss).toFixed(0)}</span>
        <span>Target: ${safeTargetProfit.toFixed(0)}</span>
      </div>
    </div>
  );
}
