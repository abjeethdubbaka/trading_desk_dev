import React, { useMemo, useState } from 'react';
import { addMonths, format, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import {
  ChevronLeft, ChevronRight, FileBarChart,
  CheckCircle2, AlertCircle, Target, Brain,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTrades } from '@/lib/hooks/useTrades';
import { useTradesWithQuality } from '@/lib/hooks/useTradesWithQuality';
import {
  analyzeMistakePatterns,
  calcCoreStats,
  calcDisciplineSavings,
  computePlanAdherence,
  perfBySetupType,
} from '@/lib/calculations/trades';
import { normalizePlaybookEntries, PLAYBOOK_FIELD } from '@/lib/playbook/utils';
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
          {up ? '▲' : '▼'} {formatFn(Math.abs(d))} vs last month
        </p>
      )}
      {hasPrior && flat && <p className="text-[10px] text-white/25">same as last month</p>}
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

function WhatWorkedCard({ bySetup }) {
  const winners = [...bySetup]
    .filter((s) => s.totalPnL > 0 && s.trades >= 1)
    .sort((a, b) => b.totalPnL - a.totalPnL)
    .slice(0, 3);

  if (!winners.length) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <p className="text-sm font-semibold text-white">What worked</p>
      </div>
      <div className="space-y-2">
        {winners.map((s) => (
          <div key={s.setup} className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/[0.03] px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-white/85">{s.setup}</p>
              <p className="text-[11px] text-white/45">
                {s.trades} trade{s.trades !== 1 ? 's' : ''} · {s.winRate.toFixed(0)}% win rate · {s.avgR.toFixed(1)}R avg
              </p>
            </div>
            <p className="font-mono font-bold text-emerald-400 flex-shrink-0">+${s.totalPnL.toFixed(0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatHurtCard({ bySetup, mistakeInsights }) {
  const losers = [...bySetup]
    .filter((s) => s.totalPnL < 0)
    .sort((a, b) => a.totalPnL - b.totalPnL)
    .slice(0, 3);

  const topMistakes = mistakeInsights?.topMistakes?.slice(0, 2) ?? [];
  if (!losers.length && !topMistakes.length) return null;

  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-rose-400" />
        <p className="text-sm font-semibold text-white">What hurt you</p>
      </div>

      {losers.length > 0 && (
        <div className="space-y-2">
          {losers.map((s) => (
            <div key={s.setup} className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/[0.03] px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-white/85">{s.setup}</p>
                <p className="text-[11px] text-white/45">
                  {s.trades} trade{s.trades !== 1 ? 's' : ''} · {s.winRate.toFixed(0)}% win rate · {s.avgR.toFixed(1)}R avg
                </p>
              </div>
              <p className="font-mono font-bold text-rose-400 flex-shrink-0">-${Math.abs(s.totalPnL).toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}

      {topMistakes.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] uppercase tracking-wider text-white/30">Recurring mistakes</p>
          {topMistakes.map((m, i) => (
            <p key={i} className="text-[12px] text-white/60 leading-relaxed">
              <span className="text-rose-300 font-semibold">{m.text}</span>
              {m.count > 1 && <span className="text-white/35"> — {m.count}× this month</span>}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function DisciplineCard({ savings, riskLimit, planAdherence }) {
  const { followed, deviated } = planAdherence ?? {};
  const hasDiscipline = savings?.tradesAnalyzed > 0;
  const hasPlan = (followed?.totalTrades ?? 0) + (deviated?.totalTrades ?? 0) > 0;
  if (!hasDiscipline && !hasPlan) return null;

  const compliant = savings?.totalSaved <= 0;
  const planPct = hasPlan
    ? Math.round((followed.totalTrades / (followed.totalTrades + deviated.totalTrades)) * 100)
    : null;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#13131e] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-violet-400" />
        <p className="text-sm font-semibold text-white">Discipline</p>
      </div>

      {hasDiscipline && (
        <div className={cn('rounded-xl border p-3', compliant ? 'border-emerald-500/25 bg-emerald-500/6' : 'border-violet-500/25 bg-violet-500/6')}>
          {compliant ? (
            <p className="text-sm text-white/80">
              Every loss stayed within your <span className="text-emerald-300 font-bold">${riskLimit.toFixed(0)}</span> risk limit — great discipline.
            </p>
          ) : (
            <p className="text-sm text-white/80">
              If you had cut losses based on your limit, you could have saved{' '}
              <span className="text-violet-300 font-bold">${savings.totalSaved.toFixed(0)}</span>.
              {' '}<span className="text-white/45">{savings.tradesExceeded} trade{savings.tradesExceeded !== 1 ? 's' : ''} over limit.</span>
            </p>
          )}

          {!compliant && savings.bySetup.length > 0 && (
            <div className="mt-2 space-y-1">
              {savings.bySetup.map((row) => (
                <p key={row.setup} className="text-[11px] text-white/50">
                  <span className="text-white/70 font-medium">{row.setup}</span>
                  {' '}— {row.count} breach{row.count !== 1 ? 'es' : ''}, ${row.totalSaved.toFixed(0)} over limit
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {hasPlan && planPct != null && (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/50">Plan adherence</p>
            <p className={cn('text-sm font-bold font-mono', planPct >= 70 ? 'text-emerald-400' : planPct >= 50 ? 'text-amber-400' : 'text-rose-400')}>
              {planPct}%
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn('h-full rounded-full', planPct >= 70 ? 'bg-emerald-400' : planPct >= 50 ? 'bg-amber-400' : 'bg-rose-400')}
              style={{ width: `${planPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-white/50 leading-relaxed">
            {followed.totalTrades} trade{followed.totalTrades !== 1 ? 's' : ''} followed the plan
            {deviated.totalTrades > 0 && `, ${deviated.totalTrades} deviated`}.
            {followed.totalTrades > 0 && deviated.totalTrades > 0 && (
              <span className={cn(followed.totalPnL > deviated.totalPnL ? ' text-emerald-300' : ' text-rose-300')}>
                {followed.totalPnL > deviated.totalPnL
                  ? ' Following the plan made you more money.'
                  : ' Deviating cost you money.'}
              </span>
            )}
          </p>
        </div>
      )}
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
  { key: 'totalTrades', label: 'Trades', fmt: (v) => String(Math.round(v)), color: () => 'text-white/70', higherIsBetter: null },
];

function TrendCard({ months }) {
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
              {months.map((m) => (
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
                {months.map((m, i) => {
                  const val = metric.key === 'totalPnL' ? m.stats[metric.key] :
                    metric.key === 'profitFactor' ? (m.stats[metric.key] === Infinity ? 99 : m.stats[metric.key]) :
                    m.stats[metric.key];
                  const noTrades = m.stats.totalTrades === 0;

                  // trend arrow vs previous month
                  let arrow = null;
                  if (i > 0 && !noTrades && metric.higherIsBetter !== null) {
                    const prev = months[i - 1].stats[metric.key] ?? 0;
                    const d = val - prev;
                    if (Math.abs(d) > 1e-9) {
                      const up = d > 0;
                      const improved = metric.higherIsBetter ? up : !up;
                      arrow = <span className={cn('ml-1 text-[9px]', improved ? 'text-emerald-400' : 'text-rose-400')}>{up ? '▲' : '▼'}</span>;
                    }
                  }

                  return (
                    <td key={m.label} className={cn('py-2 text-center font-mono', m.isCurrent ? 'font-semibold' : 'opacity-50', noTrades ? 'text-white/20' : metric.color(val))}>
                      {noTrades ? '—' : metric.fmt(val)}{arrow}
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
  const playbookEntries = useMemo(() => normalizePlaybookEntries(settings?.[PLAYBOOK_FIELD]), [settings]);
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
        stats: calcCoreStats(t),
      };
    });
  }, [tradesWithQuality, selectedMonth]);
  const bySetup = useMemo(() => perfBySetupType(monthTrades), [monthTrades]);
  const mistakeInsights = useMemo(() => analyzeMistakePatterns(monthTrades, 5), [monthTrades]);
  const planAdherence = useMemo(() => computePlanAdherence(monthTrades), [monthTrades]);
  const disciplineSavings = useMemo(
    () => calcDisciplineSavings(monthTrades, playbookEntries, riskLimit),
    [monthTrades, playbookEntries, riskLimit]
  );

  const monthLabel = format(selectedMonth, 'MMMM yyyy');
  const isCurrentCalendarMonth = isSameMonth(selectedMonth, new Date());
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
          {/* Grade + summary */}
          <SummaryCard stats={stats} priorStats={priorStats} monthLabel={monthLabel} hasPrior={hasPrior} />

          {/* Key metrics with delta vs last month */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            <MetricChip label="Trades"
              value={stats.totalTrades} priorValue={null}
              color="text-white"
              formatFn={(v) => String(Math.round(v))} />
          </div>

          {/* What worked / what hurt — side by side */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WhatWorkedCard bySetup={bySetup} />
            <WhatHurtCard bySetup={bySetup} mistakeInsights={mistakeInsights} />
          </div>

          {/* Discipline */}
          <DisciplineCard savings={disciplineSavings} riskLimit={riskLimit} planAdherence={planAdherence} />

          {/* 3-month trend */}
          <TrendCard months={trendMonths} />

          {/* Mindset */}
          <MindsetCard monthTrades={monthTrades} />
        </div>
      )}
    </div>
  );
}
