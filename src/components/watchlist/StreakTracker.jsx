import React from 'react';
import { cn } from '@/lib/utils';
import { computeStreaks } from '@/lib/performanceMetrics';

export default function StreakTracker({ sequence = [] }) {
  const trades = sequence.map(d=>({pnl:d.pnl,entry_time:d.date}));
  const { currentStreak, currentType, bestWin } = computeStreaks(trades);
  if (!sequence.length) return null;
  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Last {sequence.length} trading days</span>
        <div className="flex items-center gap-4 text-xs">
          {currentStreak>1&&currentType==='win'&&<span className="text-emerald-400 font-bold">{currentStreak} day streak 🔥</span>}
          {currentStreak>1&&currentType==='loss'&&<span className="text-red-400 font-bold">{currentStreak} day losing streak</span>}
          <span className="text-white/30">Best: <span className="text-amber-400 font-semibold">{bestWin}W</span></span>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {sequence.map((day,i)=>(
          <div key={i} title={`${day.date}: ${day.pnl>=0?'+':''}$${Math.round(day.pnl)}`}
            className={cn('w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold cursor-default transition-transform hover:scale-110',
              day.result==='W'&&'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
              day.result==='L'&&'bg-red-500/20 text-red-400 border border-red-500/30',
              day.result==='B'&&'bg-white/5 text-white/20 border border-white/8',
              i===sequence.length-1&&currentStreak>1&&currentType==='win'&&'ring-1 ring-emerald-400',
              i===sequence.length-1&&currentStreak>1&&currentType==='loss'&&'ring-1 ring-red-400',
            )}>{day.result}</div>
        ))}
      </div>
    </div>
  );
}
