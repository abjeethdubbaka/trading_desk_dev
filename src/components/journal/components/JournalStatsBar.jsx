/**
 * @file src/components/journal/components/JournalStatsBar.jsx
 *
 * Phase 2 — uses calcCoreStats + calcTodayStats from calculations/trades.js.
 */

import React, { useMemo } from 'react';
import { calcCoreStats, calcTodayStats } from '@/lib/calculations/trades';
import { cn } from '@/lib/utils';

function Stat({ label, value, color, sub }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{label}</span>
      <span className={cn('text-base font-bold font-mono leading-tight', color)}>{value}</span>
      {sub && <span className="text-[10px] text-white/25 leading-tight">{sub}</span>}
    </div>
  );
}

function Divider() {
  return <div className="w-px h-8 bg-white/8 hidden sm:block flex-shrink-0" />;
}

export default function JournalStatsBar({ trades = [] }) {
  const stats = useMemo(() => calcCoreStats(trades),    [trades]);
  const today = useMemo(() => calcTodayStats(trades),   [trades]);

  if (!trades.length) return null;

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <Stat
        label="Total P&L"
        value={`${stats.totalPnL >= 0 ? '+' : ''}$${Math.abs(stats.totalPnL).toFixed(0)}`}
        color={stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}
      />
      <Divider />
      <Stat
        label="Win rate"
        value={`${stats.winRate.toFixed(0)}%`}
        color={stats.winRate >= 50 ? 'text-emerald-400' : stats.winRate >= 40 ? 'text-amber-400' : 'text-red-400'}
        sub={`${stats.wins}W / ${stats.losses}L`}
      />
      <Divider />
      <Stat
        label="Avg R"
        value={`${stats.avgR.toFixed(1)}R`}
        color={stats.avgR >= 1.5 ? 'text-purple-400' : stats.avgR >= 1 ? 'text-amber-400' : 'text-red-400'}
      />
      <Divider />
      <Stat
        label="Profit factor"
        value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(1)}
        color={stats.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}
      />
      <Divider />
      <Stat
        label="Today"
        value={`${today.totalPnL >= 0 ? '+' : ''}$${Math.abs(today.totalPnL).toFixed(0)}`}
        color={today.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}
        sub={`${today.totalTrades} trade${today.totalTrades !== 1 ? 's' : ''}`}
      />
      <Divider />
      <Stat label="Trades" value={stats.totalTrades} color="text-white/60" />
    </div>
  );
}