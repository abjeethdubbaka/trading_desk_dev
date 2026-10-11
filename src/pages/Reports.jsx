import React, { useMemo, useState } from 'react';
import { addMonths, format, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import {
  ChevronLeft, ChevronRight, FileBarChart,
  Brain, Trophy,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTrades } from '@/lib/hooks/useTrades';
import { useTradesWithQuality } from '@/lib/hooks/useTradesWithQuality';
import { calcCoreStats } from '@/lib/calculations/trades';
import { cn, toFiniteNumber } from '@/lib/utils/general';

// ─── helpers ────────────────────────────────────────────────────────────────

function getTradesInMonth(trades, monthDate) {
  const start = startOfMonth(monthDate);
  const end = startOfMonth(addMonths(monthDate, 1));
  return trades.filter((t) => {
    // Use exit_time as the canonical date — P&L is realized at exit
    const d = new Date(t?.exit_time ?? t?.entry_time ?? t?.created_date ?? 0);
    return d >= start && d < end;
  });
}

// Self-contained per-month discipline score (0-100) — unlike the dashboard's
// buildDisciplineSnapshot (which is anchored to "today"), this only looks at
// the given month's own trades: plan adherence, position sizing discipline,
// emotional-trade rate, and the longest losing streak within that month.
function calcMonthlyDisciplineScore(trades = []) {
  if (!trades.length) return null;

  const total = trades.length;

  const followedCount = trades.filter((t) => t?.followed_plan === true || t?.followed_plan === 'true').length;
  const deviatedCount = trades.filter((t) => t?.followed_plan === false || t?.followed_plan === 'false').length;
  const trackedPlan = followedCount + deviatedCount;
  const planAdherencePct = trackedPlan > 0 ? (followedCount / trackedPlan) * 100 : null;

  const oversizedCount = trades.filter((t) => t?.is_oversized === true).length;
  const sizingTracked = trades.filter((t) => t?.is_oversized != null).length;
  const oversizedPct = sizingTracked > 0 ? (oversizedCount / sizingTracked) * 100 : null;

  const emotionalCount = trades.filter((t) => {
    const emotions = Array.isArray(t?.emotions) ? t.emotions : (t?.emotions ? [t.emotions] : []);
    return emotions.map((e) => String(e).toLowerCase()).some((e) => ['fomo', 'revenge', 'nervous'].includes(e));
  }).length;
  const emotionalPct = (emotionalCount / total) * 100;

  const sorted = [...trades].sort(
    (a, b) => new Date(a?.exit_time ?? a?.entry_time ?? a?.created_date ?? 0) - new Date(b?.exit_time ?? b?.entry_time ?? b?.created_date ?? 0)
  );
  let maxLossStreak = 0;
  let currentStreak = 0;
  sorted.forEach((t) => {
    if (Number(t?.pnl ?? 0) < 0) {
      currentStreak += 1;
      maxLossStreak = Math.max(maxLossStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  let score = 100;
  if (planAdherencePct != null) {
    if (planAdherencePct < 70) score -= 20;
    else if (planAdherencePct < 85) score -= 10;
  }
  if (oversizedPct != null) {
    if (oversizedPct >= 30) score -= 20;
    else if (oversizedPct >= 15) score -= 10;
  }
  if (emotionalPct >= 30) score -= 15;
  else if (emotionalPct >= 15) score -= 8;
  if (maxLossStreak >= 5) score -= 20;
  else if (maxLossStreak >= 3) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function grade(stats) {
  let score = 0;
  if (stats.winRate >= 60) score += 2;
  else if (stats.winRate >= 50) score += 1;
  if (stats.avgR >= 2) score += 2;
  else if (stats.avgR >= 1) score += 1;
  if (stats.profitFactor >= 2) score += 2;
  else if (stats.profitFactor >= 1.5) score += 1;
  if (stats.totalPnL > 0) score += 1;
  if (score >= 6) return { letter: 'A', color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-500/8' };
  if (score >= 4) return { letter: 'B', color: 'text-sky-400', bg: 'border-sky-500/30 bg-sky-500/8' };
  if (score >= 2) return { letter: 'C', color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-500/8' };
  return { letter: 'D', color: 'text-rose-400', bg: 'border-rose-500/30 bg-rose-500/8' };
}

function delta(curr, prev) {
  const d = curr - prev;
  return { d, up: d > 0, flat: Math.abs(d) < 1e-9 };
}

// ─── sub-components ─────────────────────────────────────────────────────────

function MetricChip({ label, value, color, priorValue, formatFn, higherIsBetter = true }) {
  const hasPrior = priorValue != null;
  const { d, up, flat } = hasPrior ? delta(value, priorValue) : { d: 0, up: false, flat: true };
  const improved = higherIsBetter ? up : !up;

  return (
    <div className="rounded-xl border border-white/8 bg-[#13131e] px-4 py-3 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className={cn('font-mono text-xl font-bold', color)}>{formatFn(value)}</p>
      {hasPrior && !flat && (
        <p className={cn('text-[10px] font-medium flex items-center gap-0.5', improved ? 'text-emerald-400' : 'text-rose-400')}>
          {up ? '▲' : '▼'} {formatFn(d)} vs last month
        </p>
      )}
      {hasPrior && flat && <p className="text-[10px] text-white/25">same as last month</p>}
    </div>
  );
}

function MonthlyTargetCard({ totalPnL, monthlyTarget, isCurrentCalendarMonth }) {
  if (!(monthlyTarget > 0)) return null;

  const pct = Math.min(100, Math.max(0, (totalPnL / monthlyTarget) * 100));
  const reached = totalPnL >= monthlyTarget;
  const remaining = Math.max(0, monthlyTarget - totalPnL);

  return (
    <div className={cn(
      'rounded-2xl border p-5',
      reached
        ? 'border-emerald-400/25 bg-gradient-to-r from-emerald-500/[0.08] to-transparent'
        : 'border-white/8 bg-[#13131e]',
    )}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {reached ? (
            <Trophy className="h-4 w-4 text-emerald-400" />
          ) : (
            <FileBarChart className="h-4 w-4 text-white/40" />
          )}
          <div>
            <p className="text-sm font-semibold text-white">
              {reached ? 'Monthly Target Reached' : 'Monthly Target'}
            </p>
            <p className="text-[11px] text-white/40">
              ${totalPnL.toFixed(0)} of ${monthlyTarget.toLocaleString()}
              {!reached && isCurrentCalendarMonth && ` · $${remaining.toFixed(0)} to go`}
            </p>
          </div>
        </div>
        <p className={cn('font-mono text-xl font-bold', reached ? 'text-emerald-400' : 'text-white/60')}>
          {pct.toFixed(0)}%
        </p>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={cn('h-full rounded-full transition-all duration-500', reached ? 'bg-emerald-500' : 'bg-cyan-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SummaryCard({ stats, priorStats, monthLabel, hasPrior }) {
  const g = grade(stats);
  const pnlUp = stats.totalPnL > 0;
  const wrGood = stats.winRate >= 50;
  const rGood = stats.avgR >= 1;

  const lines = [];
  if (pnlUp) {
    lines.push(`You made $${stats.totalPnL.toFixed(0)} across ${stats.totalTrades} trade${stats.totalTrades !== 1 ? 's' : ''} in ${monthLabel}.`);
  } else {
    lines.push(`You finished ${monthLabel} down $${Math.abs(stats.totalPnL).toFixed(0)} across ${stats.totalTrades} trade${stats.totalTrades !== 1 ? 's' : ''}.`);
  }

  if (wrGood && rGood) {
    lines.push(`Win rate was ${stats.winRate.toFixed(0)}% with a ${stats.avgR.toFixed(1)}R average — solid execution.`);
  } else if (!wrGood && !rGood) {
    lines.push(`Win rate was ${stats.winRate.toFixed(0)}% and avg R only ${stats.avgR.toFixed(1)} — both need work.`);
  } else if (!wrGood) {
    lines.push(`Win rate was ${stats.winRate.toFixed(0)}% — you're winning when you win (${stats.avgR.toFixed(1)}R avg), but losing too often.`);
  } else {
    lines.push(`Win rate was ${stats.winRate.toFixed(0)}%, but avg R was only ${stats.avgR.toFixed(1)} — keep more of your winners.`);
  }

  if (hasPrior) {
    const pnlDelta = stats.totalPnL - priorStats.totalPnL;
    if (Math.abs(pnlDelta) > 10) {
      lines.push(pnlDelta > 0
        ? `That's $${pnlDelta.toFixed(0)} better than last month.`
        : `That's $${Math.abs(pnlDelta).toFixed(0)} worse than last month.`);
    }
  }

  return (
    <div className={cn('rounded-2xl border p-5 flex gap-5 items-start', g.bg)}>
      <div className={cn('text-5xl font-black font-mono leading-none pt-1 flex-shrink-0', g.color)}>
        {g.letter}
      </div>
      <div className="space-y-1.5">
        <p className={cn('text-[10px] font-bold uppercase tracking-widest', g.color)}>Monthly grade</p>
        {lines.map((l, i) => (
          <p key={i} className="text-sm text-white/80 leading-relaxed">{l}</p>
        ))}
      </div>
    </div>
  );
}

function MindsetCard({ monthTrades }) {
  const emotions = useMemo(() => {
    const map = {};
    monthTrades.forEach((t) => {
      const e = t?.emotion;
      if (!e) return;
      if (!map[e]) map[e] = { emotion: e, count: 0, pnl: 0 };
      map[e].count++;
      map[e].pnl += t?.pnl ?? 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [monthTrades]);

  if (!emotions.length) return null;

  const top = emotions[0];
  const topPositive = emotions.filter((e) => e.pnl > 0)[0];
  const topNegative = emotions.filter((e) => e.pnl < 0)[0];

  return (
    <div className="rounded-2xl border border-white/8 bg-[#13131e] p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-sky-400" />
        <p className="text-sm font-semibold text-white">Mindset</p>
      </div>
      <p className="text-sm text-white/70 leading-relaxed">
        Your most common emotional state was <span className="text-white font-semibold">{top.emotion}</span> ({top.count}×).
        {topPositive && (
          <> Trading <span className="text-emerald-300 font-semibold">{topPositive.emotion}</span> made you the most (+${topPositive.pnl.toFixed(0)}).</>
        )}
        {topNegative && (
          <> Trading <span className="text-rose-300 font-semibold">{topNegative.emotion}</span> cost you the most (-${Math.abs(topNegative.pnl).toFixed(0)}).</>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {emotions.slice(0, 6).map((e) => (
          <span
            key={e.emotion}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium',
              e.pnl > 0 ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300' : e.pnl < 0 ? 'border-rose-500/25 bg-rose-500/8 text-rose-300' : 'border-white/10 bg-white/5 text-white/50'
            )}
          >
            {e.emotion} · {e.count}×
          </span>
        ))}
      </div>
    </div>
  );
}

const TREND_METRICS = [
  { key: 'totalPnL', label: 'P&L', fmt: (v) => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(0)}`, color: (v) => v >= 0 ? 'text-emerald-400' : 'text-rose-400', higherIsBetter: true },
  { key: 'winRate', label: 'Win %', fmt: (v) => `${v.toFixed(0)}%`, color: (v) => v >= 50 ? 'text-emerald-400' : 'text-amber-400', higherIsBetter: true },
  { key: 'avgR', label: 'Avg R', fmt: (v) => `${v.toFixed(1)}R`, color: (v) => v >= 1 ? 'text-purple-400' : 'text-amber-400', higherIsBetter: true },
  { key: 'profitFactor', label: 'PF', fmt: (v) => v >= 99 ? '∞' : v.toFixed(1), color: (v) => v >= 1.5 ? 'text-emerald-400' : v >= 1 ? 'text-amber-400' : 'text-rose-400', higherIsBetter: true },
  { key: 'totalTrades', label: 'Trades', fmt: (v) => String(Math.round(v)), color: () => 'text-white/70', higherIsBetter: null },
  { key: 'disciplineScore', label: 'Discipline', fmt: (v) => `${Math.round(v)}`, color: (v) => v >= 80 ? 'text-emerald-400' : v >= 60 ? 'text-amber-400' : 'text-rose-400', higherIsBetter: true },
];

function TrendCard({ months }) {
  // Only months with actual trades are shown — an empty pre-history month
  // (e.g. before the trader started logging) would otherwise pad the table
  // with a meaningless "—" column.
  const active = months.filter((m) => m.stats.totalTrades > 0);
  if (active.length < 2) return null;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#13131e] p-5 space-y-4">
      <p className="text-[10px] uppercase tracking-wider text-white/35">Recent months trend</p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <td className="pb-2 text-white/30 pr-4 w-16"></td>
              {active.map((m) => (
                <td key={m.label} className={cn('pb-2 text-center font-semibold', m.isCurrent ? 'text-white' : 'text-white/40')}>
                  {m.label}
                  {m.isCurrent && <span className="ml-1 text-[9px] text-emerald-400/70 uppercase">now</span>}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {TREND_METRICS.map((metric) => (
              <tr key={metric.key} className="border-t border-white/5">
                <td className="py-2 text-white/40 pr-4">{metric.label}</td>
                {active.map((m, i) => {
                  const val = metric.key === 'totalPnL' ? m.stats[metric.key] :
                    metric.key === 'profitFactor' ? (m.stats[metric.key] === Infinity ? 99 : m.stats[metric.key]) :
                    m.stats[metric.key];

                  // trend arrow vs previous available month
                  let arrow = null;
                  if (i > 0 && metric.higherIsBetter !== null) {
                    const prev = active[i - 1].stats[metric.key] ?? 0;
                    const d = val - prev;
                    if (Math.abs(d) > 1e-9) {
                      const up = d > 0;
                      const improved = metric.higherIsBetter ? up : !up;
                      arrow = <span className={cn('ml-1 text-[9px]', improved ? 'text-emerald-400' : 'text-rose-400')}>{up ? '▲' : '▼'}</span>;
                    }
                  }

                  return (
                    <td key={m.label} className={cn('py-2 text-center font-mono', m.isCurrent ? 'font-semibold' : 'opacity-50', metric.color(val))}>
                      {metric.fmt(val)}{arrow}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { settings } = useSettings();
  const riskLimit = toFiniteNumber(settings?.risk_amount, 0);
  const currentAccountType = settings?.account_type || 'demo';
  const currentTradingType = settings?.trading_type || 'stocks';

  const { data: trades = [], isLoading } = useTrades({
    filters: { account_type: currentAccountType, trading_type: currentTradingType },
  });
  const tradesWithQuality = useTradesWithQuality(trades, riskLimit);

  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));

  const earliestMonth = useMemo(() => {
    const dated = tradesWithQuality
      .map((t) => new Date(t?.entry_time ?? t?.created_date ?? 0))
      .filter((d) => !Number.isNaN(d.getTime()));
    if (!dated.length) return startOfMonth(new Date());
    return startOfMonth(new Date(Math.min(...dated.map((d) => d.getTime()))));
  }, [tradesWithQuality]);

  const currentMonth = startOfMonth(new Date());
  const canGoPrev = selectedMonth > earliestMonth;
  const canGoNext = selectedMonth < currentMonth;

  const monthTrades = useMemo(() => getTradesInMonth(tradesWithQuality, selectedMonth), [tradesWithQuality, selectedMonth]);
  const stats = useMemo(() => calcCoreStats(monthTrades), [monthTrades]);

  // Build 3-month trend: 3 months ago → 2 months ago → 1 month ago → selected
  const trendMonths = useMemo(() => {
    return [3, 2, 1, 0].map((n) => {
      const m = subMonths(selectedMonth, n);
      const t = getTradesInMonth(tradesWithQuality, m);
      return {
        label: format(m, 'MMM yy'),
        isCurrent: n === 0,
        stats: { ...calcCoreStats(t), disciplineScore: calcMonthlyDisciplineScore(t) },
      };
    });
  }, [tradesWithQuality, selectedMonth]);
  const monthLabel = format(selectedMonth, 'MMMM yyyy');
  const isCurrentCalendarMonth = isSameMonth(selectedMonth, new Date());
  // Same derivation as the "Monthly Target" shown in Settings → Account
  // (weekly target x avg weeks/month), so the two stay consistent.
  const monthlyTarget = Math.round(toFiniteNumber(settings?.target_profit_dollars, 0) * (52 / 12));
  const priorStats = trendMonths[2]?.stats; // 1 month ago
  const hasPrior = (priorStats?.totalTrades ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5 text-emerald-400" />
          <h1 className="text-lg font-semibold text-white">Monthly Report</h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#13131e] px-2 py-1.5">
          <button
            type="button"
            onClick={() => canGoPrev && setSelectedMonth((prev) => subMonths(prev, 1))}
            disabled={!canGoPrev}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-white">{monthLabel}</span>
          <button
            type="button"
            onClick={() => canGoNext && setSelectedMonth((prev) => addMonths(prev, 1))}
            disabled={!canGoNext}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isCurrentCalendarMonth && (
            <button
              type="button"
              onClick={() => setSelectedMonth(currentMonth)}
              className="ml-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-medium text-white/45 hover:text-white/75"
            >
              This month
            </button>
          )}
        </div>
      </div>

      {!monthTrades.length ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] py-20 text-center">
          <p className="text-sm text-white/50">No trades logged in {monthLabel}.</p>
          <p className="text-xs text-white/30">Pick a different month, or log some trades for this one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Monthly target progress */}
          <MonthlyTargetCard
            totalPnL={stats.totalPnL}
            monthlyTarget={monthlyTarget}
            isCurrentCalendarMonth={isCurrentCalendarMonth}
          />

          {/* Grade + summary */}
          <SummaryCard stats={stats} priorStats={priorStats} monthLabel={monthLabel} hasPrior={hasPrior} />

          {/* Key metrics with delta vs last month */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricChip label="Total P&L"
              value={stats.totalPnL} priorValue={hasPrior ? priorStats.totalPnL : null}
              color={stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}
              formatFn={(v) => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(0)}`} />
            <MetricChip label="Win rate"
              value={stats.winRate} priorValue={hasPrior ? priorStats.winRate : null}
              color={stats.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}
              formatFn={(v) => `${v.toFixed(0)}%`} />
            <MetricChip label="Avg R"
              value={stats.avgR} priorValue={hasPrior ? priorStats.avgR : null}
              color={stats.avgR >= 1 ? 'text-purple-400' : 'text-amber-400'}
              formatFn={(v) => `${v.toFixed(1)}R`} />
          </div>

          {/* 3-month trend */}
          <TrendCard months={trendMonths} />

          {/* Mindset */}
          <MindsetCard monthTrades={monthTrades} />
        </div>
      )}
    </div>
  );
}
