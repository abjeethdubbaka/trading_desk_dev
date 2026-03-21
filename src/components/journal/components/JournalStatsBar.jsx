/**
 * JournalStatsBar — always-visible performance summary above the trade list.
 * Uses calcCoreStats + calcTodayStats from calculations/trades.js.
 */

import React, { useMemo } from 'react';
import { calcCoreStats, calcTodayStats } from '@/lib/calculations/trades';
import { cn } from '@/lib/utils';
import AnimatedStat from '@/components/ui/AnimatedStat';

/* ─── Vertical divider ─────────────────────────────────────────────────── */
function Sep() {
  return (
    <div className="hidden sm:block w-px self-stretch bg-white/[0.06] flex-shrink-0 mx-0.5" />
  );
}

/* ─── Single stat pill ─────────────────────────────────────────────────── */
function Pill({ label, children, className }) {
  return (
    <div className={cn('flex flex-col gap-0.5 min-w-0', className)}>
      <span className="text-[9px] font-semibold uppercase tracking-widest text-white/28 whitespace-nowrap">
        {label}
      </span>
      <div className="leading-tight">{children}</div>
    </div>
  );
}

/* ─── Streak indicator ─────────────────────────────────────────────────── */
function StreakDots({ trades, count = 6 }) {
  const last = useMemo(() =>
    [...trades]
      .sort((a, b) => new Date(b.entry_time || b.created_date) - new Date(a.entry_time || a.created_date))
      .slice(0, count),
  [trades, count]);

  if (!last.length) return null;

  return (
    <div className="flex items-center gap-[3px]">
      {last.reverse().map((t, i) => {
        const win = (t.pnl || 0) > 0;
        return (
          <div
            key={t.id ?? i}
            title={`${win ? '+' : ''}$${(t.pnl || 0).toFixed(0)}`}
            className={cn(
              'w-[5px] h-[5px] rounded-full flex-shrink-0 transition-opacity',
              win ? 'bg-emerald-400' : 'bg-rose-400',
            )}
            style={{ opacity: 0.4 + (i / count) * 0.6 }}
          />
        );
      })}
    </div>
  );
}

/* ─── Win/loss bar ─────────────────────────────────────────────────────── */
function WinBar({ wins, total }) {
  const pct = total > 0 ? (wins / total) * 100 : 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="progress-track h-[3px] w-16 flex-shrink-0">
        <div
          className="progress-fill progress-fill-profit animate-bar-grow"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-white/35">
        {wins}W/{total - wins}L
      </span>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */
export default function JournalStatsBar({ trades = [] }) {
  const stats = useMemo(() => calcCoreStats(trades), [trades]);
  const today = useMemo(() => calcTodayStats(trades),  [trades]);

  if (!trades.length) return null;

  const pnlColor      = stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400';
  const todayColor    = today.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400';
  const winRateColor  = stats.winRate  >= 50 ? 'text-emerald-400'
                      : stats.winRate  >= 40 ? 'text-amber-400'
                      : 'text-rose-400';
  const rColor        = stats.avgR >= 1.5 ? 'text-purple-400'
                      : stats.avgR >= 1   ? 'text-amber-400'
                      : 'text-rose-400';
  const pfColor       = stats.profitFactor >= 1.5 ? 'text-emerald-400'
                      : stats.profitFactor >= 1   ? 'text-amber-400'
                      : 'text-rose-400';

  return (
    <div
      className={cn(
        'bg-[var(--surface-1)] border border-[var(--border-subtle)]',
        'rounded-xl px-4 py-2.5',
        'flex flex-wrap items-center gap-x-4 gap-y-2',
        'animate-fade-in',
      )}
    >
      {/* Total P&L */}
      <Pill label="Total P&L">
        <AnimatedStat
          value={stats.totalPnL}
          format={(n) => `${n >= 0 ? '+' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`}
          colorize={false}
          className={cn('text-sm font-bold font-mono', pnlColor)}
        />
      </Pill>
      <Sep />

      {/* Win rate + bar */}
      <Pill label="Win rate">
        <div className="flex flex-col gap-0.5">
          <span className={cn('text-sm font-bold font-mono', winRateColor)}>
            {stats.winRate.toFixed(0)}%
          </span>
          <WinBar wins={stats.wins} total={stats.totalTrades} />
        </div>
      </Pill>
      <Sep />

      {/* Avg R */}
      <Pill label="Avg R">
        <AnimatedStat
          value={stats.avgR}
          format={(n) => `${n.toFixed(1)}R`}
          colorize={false}
          className={cn('text-sm font-bold font-mono', rColor)}
        />
      </Pill>
      <Sep />

      {/* Profit factor */}
      <Pill label="Profit factor">
        <span className={cn('text-sm font-bold font-mono', pfColor)}>
          {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(1)}
        </span>
      </Pill>
      <Sep />

      {/* Today */}
      <Pill label="Today">
        <div className="flex flex-col gap-0.5">
          <AnimatedStat
            value={today.totalPnL}
            format={(n) => `${n >= 0 ? '+' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`}
            colorize={false}
            className={cn('text-sm font-bold font-mono', todayColor)}
          />
          <span className="text-[9px] text-white/25">
            {today.totalTrades} trade{today.totalTrades !== 1 ? 's' : ''}
          </span>
        </div>
      </Pill>
      <Sep />

      {/* Trades */}
      <Pill label="Trades">
        <span className="text-sm font-bold font-mono text-white/55">
          {stats.totalTrades}
        </span>
      </Pill>
      <Sep />

      {/* Recent streak dots */}
      <Pill label="Recent" className="hidden md:flex">
        <StreakDots trades={trades} count={7} />
      </Pill>
    </div>
  );
}