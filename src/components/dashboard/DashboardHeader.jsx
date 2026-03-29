import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Activity,
  Target, BarChart2, DollarSign,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/general';
import AnimatedStat, { TrendArrow, MiniSparkline } from '@/components/ui/AnimatedStat';

/* ─── Individual KPI card ──────────────────────────────────────────────── */
function KPI({
  label,
  value,
  rawValue,
  color,
  subtext,
  icon: Icon,
  glow,
  sparkBars,
  trend,
  animateValue,
  animFormat,
  delay = 0,
}) {
  return (
    <div
      className={cn(
        'stat-card relative overflow-hidden px-4 py-3.5 flex flex-col gap-1 min-w-0',
        'animate-fade-up',
        glow,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Subtle corner accent */}
      <div
        className="absolute top-0 right-0 w-16 h-16 opacity-[0.04] rounded-full blur-2xl pointer-events-none"
        style={{ background: glow ? 'currentColor' : 'white', transform: 'translate(30%, -30%)' }}
        aria-hidden="true"
      />

      {/* Label row */}
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3 text-white/25 flex-shrink-0" />}
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/35 truncate">
          {label}
        </span>
      </div>

      {/* Value row */}
      <div className="flex items-end justify-between gap-2 mt-0.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          {animateValue != null ? (
            <AnimatedStat
              value={animateValue}
              format={animFormat}
              colorize={rawValue != null}
              className={cn('text-[1.35rem] font-bold font-mono leading-none', color)}
            />
          ) : (
            <span className={cn('text-[1.35rem] font-bold font-mono leading-none truncate', color)}>
              {value}
            </span>
          )}
          {subtext && (
            <span className="text-[10px] text-white/30 leading-tight">{subtext}</span>
          )}
        </div>

        {/* Sparkline or trend arrow */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {sparkBars && sparkBars.length > 0 && (
            <MiniSparkline bars={sparkBars} height={18} />
          )}
          {trend != null && <TrendArrow delta={trend} />}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */
export default function DashboardHeader({
  currentBalance,
  totalPnL,
  todayPnL,
  winRate,
  avgR,
  todayTrades,
  recentDailyPnL = [],   // number[] — last ~8 days P&L for sparklines
  prevWinRate,           // number | null — for trend delta
  prevAvgR,              // number | null
}) {
  const pnlPos   = totalPnL  >= 0;
  const todayPos = todayPnL  >= 0;
  const winColor = winRate >= 50 ? 'text-emerald-400'
                 : winRate >= 40 ? 'text-amber-400'
                 : 'text-rose-400';
  const rColor   = avgR >= 1.5 ? 'text-purple-400'
                 : avgR >= 1   ? 'text-amber-400'
                 : 'text-rose-400';

  // Derive sparkline buckets (last 8 days)
  const sparkBars = useMemo(() => recentDailyPnL.slice(-8), [recentDailyPnL]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {/* Balance */}
      <KPI
        label="Balance"
        animateValue={currentBalance}
        animFormat={(n) => `$${Math.round(n).toLocaleString()}`}
        color="text-white"
        icon={DollarSign}
        delay={0}
      />

      {/* All-time P&L */}
      <KPI
        label="All-time P&L"
        animateValue={totalPnL}
        animFormat={(n) => `${n >= 0 ? '+' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`}
        rawValue={totalPnL}
        color={pnlPos ? 'text-profit-gradient' : 'text-loss-gradient'}
        icon={pnlPos ? TrendingUp : TrendingDown}
        glow={pnlPos ? 'glow-green' : 'glow-red'}
        sparkBars={sparkBars}
        delay={50}
      />

      {/* Today */}
      <KPI
        label="Today"
        animateValue={todayPnL}
        animFormat={(n) => `${n >= 0 ? '+' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`}
        rawValue={todayPnL}
        color={todayPos ? 'text-emerald-400' : 'text-rose-400'}
        icon={Activity}
        subtext={`${todayTrades} trade${todayTrades !== 1 ? 's' : ''}`}
        delay={100}
      />

      {/* Win rate */}
      <KPI
        label="Win rate"
        animateValue={winRate}
        animFormat={(n) => `${n.toFixed(0)}%`}
        rawValue={null}
        color={winColor}
        icon={Target}
        trend={prevWinRate != null ? winRate - prevWinRate : null}
        delay={150}
      />

      {/* Avg R */}
      <KPI
        label="Avg R"
        animateValue={avgR}
        animFormat={(n) => `${n.toFixed(1)}R`}
        rawValue={null}
        color={rColor}
        icon={BarChart2}
        trend={prevAvgR != null ? ((avgR - prevAvgR) / Math.abs(prevAvgR)) * 100 : null}
        delay={200}
      />
    </div>
  );
}


