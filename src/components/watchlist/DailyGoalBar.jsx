import React from 'react';
import { cn } from '@/lib/utils';

export default function DailyGoalBar({ todayPnL, targetProfit, maxDailyLoss }) {
  const pct       = targetProfit>0 ? Math.min(100,Math.max(0,(todayPnL/targetProfit)*100)) : 0;
  const hitTarget = todayPnL >= targetProfit;
  const hitMax    = todayPnL <= maxDailyLoss;
  const barColor  = hitMax?'bg-red-500':hitTarget?'bg-emerald-500':pct>=50?'bg-amber-400':'bg-blue-500';
  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40 font-medium">Daily goal</span>
        <div className="flex items-center gap-3">
          {hitMax && <span className="text-red-400 font-semibold animate-pulse">⚠ Stop trading — max loss hit</span>}
          {hitTarget&&!hitMax && <span className="text-emerald-400 font-semibold">✓ Goal reached!</span>}
          <span className={cn('font-mono font-bold',todayPnL>=0?'text-emerald-400':'text-red-400')}>{todayPnL>=0?'+':''}${Math.abs(todayPnL).toFixed(0)}</span>
          <span className="text-white/30">/ ${targetProfit.toFixed(0)}</span>
          <span className={cn('font-semibold',hitTarget?'text-emerald-400':'text-white/50')}>{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500',barColor)} style={{width:`${todayPnL<0?0:pct}%`}} />
      </div>
      <div className="flex justify-between text-[10px] text-white/25">
        <span>Max loss: ${Math.abs(maxDailyLoss).toFixed(0)}</span>
        <span>Target: ${targetProfit.toFixed(0)}</span>
      </div>
    </div>
  );
}
