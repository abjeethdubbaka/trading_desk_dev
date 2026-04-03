import React from 'react';
import { cn } from '@/lib/utils/general';
import AnimatedStat from '@/components/ui/AnimatedStat';

function InlineMetric({
  label,
  value,
  format,
  color = 'text-white',
  staticValue = null,
}) {
  return (
    <div className="min-w-[170px] px-4 first:pl-0 last:pr-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      {staticValue == null ? (
        <AnimatedStat
          value={value}
          format={format}
          colorize={false}
          className={cn('mt-1 truncate font-mono text-xl font-bold leading-none', color)}
        />
      ) : (
        <p className={cn('mt-1 truncate font-mono text-xl font-bold leading-none', color)}>
          {staticValue}
        </p>
      )}
    </div>
  );
}

export default function DashboardHeader({
  currentBalance,
  totalPnL,
  winRate,
  avgR,
  avg14DayResult = 'W',
}) {
  const pnlPos = totalPnL >= 0;
  const winColor = winRate >= 50 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-rose-400';
  const rColor = avgR >= 1.5 ? 'text-purple-400' : avgR >= 1 ? 'text-amber-400' : 'text-rose-400';
  const avg14Color = avg14DayResult === 'W' ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="rounded-2xl border border-white/8 bg-[#13131e] p-4">
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center">
          <InlineMetric
            label="$ Balance"
            value={currentBalance}
            format={(n) => `$${Math.round(n).toLocaleString()}`}
            color="text-white"
          />

          <div className="h-10 w-px bg-white/10" />

          <InlineMetric
            label="All-time P&L"
            value={totalPnL}
            format={(n) => `${n >= 0 ? '+' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`}
            color={pnlPos ? 'text-emerald-400' : 'text-rose-400'}
          />

          <div className="h-10 w-px bg-white/10" />

          <InlineMetric
            label="Win Rate"
            value={winRate}
            format={(n) => `${n.toFixed(0)}%`}
            color={winColor}
          />

          <div className="h-10 w-px bg-white/10" />

          <InlineMetric
            label="Avg R"
            value={avgR}
            format={(n) => `${n.toFixed(1)}R`}
            color={rColor}
          />

          <div className="h-10 w-px bg-white/10" />

          <InlineMetric
            label="14D Avg"
            staticValue={avg14DayResult}
            color={avg14Color}
          />
        </div>
      </div>
    </div>
  );
}
