/**
 * @file src/pages/Reports.jsx
 *
 * Monthly Reports — pick a month, see the full breakdown for it: core stats,
 * best/worst setups & conditions, behavior recap, and a comparison against
 * the prior month.
 */

import React, { useMemo, useState } from 'react';
import { addMonths, format, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, FileBarChart } from 'lucide-react';
import EquityCurveChart from '@/components/performance/EquityCurveChart';
import PerformanceBySetupType from '@/components/performance/PerformanceBySetupType';
import CategoricalBreakdownCard from '@/components/performance/CategoricalBreakdownCard';
import EmotionMatrix from '@/components/performance/EmotionMatrix';
import MonthOverMonthCard from '@/components/reports/MonthOverMonthCard';
import BehaviorRecapCard from '@/components/reports/BehaviorRecapCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTrades } from '@/lib/hooks/useTrades';
import { useTradesWithQuality } from '@/lib/hooks/useTradesWithQuality';
import {
  analyzeMistakePatterns,
  buildEquityCurve,
  calcCoreStats,
  calcMaxDrawdown,
  calcSharpeRatio,
  computePlanAdherence,
  perfByCategory,
  perfBySetupType,
} from '@/lib/calculations/trades';
import { cn, toFiniteNumber } from '@/lib/utils/general';

function StatPill({ label, value, color }) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#13131e] px-4 py-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className={cn('font-mono text-xl font-bold', color)}>{value}</p>
    </div>
  );
}

function getTradesInMonth(trades, monthDate) {
  const start = startOfMonth(monthDate);
  const end = startOfMonth(addMonths(monthDate, 1));
  return trades.filter((trade) => {
    const d = new Date(trade?.entry_time ?? trade?.created_date ?? 0);
    return d >= start && d < end;
  });
}

export default function ReportsPage() {
  const { settings } = useSettings();
  const accountSize = toFiniteNumber(settings?.account_size, 50000);
  const riskLimit = toFiniteNumber(settings?.risk_amount, 0);
  const { data: trades = [], isLoading } = useTrades();
  const tradesWithQuality = useTradesWithQuality(trades, riskLimit);

  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));

  const earliestMonth = useMemo(() => {
    const dated = tradesWithQuality
      .map((trade) => new Date(trade?.entry_time ?? trade?.created_date ?? 0))
      .filter((d) => !Number.isNaN(d.getTime()));
    if (!dated.length) return startOfMonth(new Date());
    return startOfMonth(new Date(Math.min(...dated.map((d) => d.getTime()))));
  }, [tradesWithQuality]);

  const currentMonth = startOfMonth(new Date());
  const canGoPrev = selectedMonth > earliestMonth;
  const canGoNext = selectedMonth < currentMonth;

  const priorMonth = useMemo(() => subMonths(selectedMonth, 1), [selectedMonth]);

  const monthTrades = useMemo(() => getTradesInMonth(tradesWithQuality, selectedMonth), [tradesWithQuality, selectedMonth]);
  const priorMonthTrades = useMemo(() => getTradesInMonth(tradesWithQuality, priorMonth), [tradesWithQuality, priorMonth]);

  const stats = useMemo(() => calcCoreStats(monthTrades), [monthTrades]);
  const priorStats = useMemo(() => calcCoreStats(priorMonthTrades), [priorMonthTrades]);
  const curve = useMemo(() => buildEquityCurve(monthTrades, accountSize), [monthTrades, accountSize]);
  const maxDD = useMemo(() => calcMaxDrawdown(curve), [curve]);
  const sharpe = useMemo(() => calcSharpeRatio(monthTrades), [monthTrades]);

  const bySetup = useMemo(() => perfBySetupType(monthTrades), [monthTrades]);
  const byExitReason = useMemo(() => perfByCategory(monthTrades, (trade) => trade?.exit_reason), [monthTrades]);
  const byMarketEnvironment = useMemo(
    () => perfByCategory(monthTrades, (trade) => trade?.market_condition),
    [monthTrades]
  );
  const planAdherence = useMemo(() => computePlanAdherence(monthTrades), [monthTrades]);
  const mistakeInsights = useMemo(() => analyzeMistakePatterns(monthTrades, 5), [monthTrades]);

  const monthLabel = format(selectedMonth, 'MMMM yyyy');
  const priorMonthLabel = format(priorMonth, 'MMM yyyy');
  const isCurrentCalendarMonth = isSameMonth(selectedMonth, new Date());

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
              <Skeleton className="h-2 w-14 rounded-full" />
              <Skeleton className="h-5 w-18 rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
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
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <p className="text-sm text-white/50">No trades logged in {monthLabel}.</p>
          <p className="text-xs text-white/30">Pick a different month, or log some trades for this one.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
            <StatPill
              label="Total P&L"
              value={`${stats.totalPnL >= 0 ? '+' : ''}$${Math.abs(stats.totalPnL).toFixed(0)}`}
              color={stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />
            <StatPill
              label="Win rate"
              value={`${stats.winRate.toFixed(0)}%`}
              color={stats.winRate >= 50 ? 'text-emerald-400' : stats.winRate >= 40 ? 'text-amber-400' : 'text-red-400'}
            />
            <StatPill
              label="Avg R"
              value={`${stats.avgR.toFixed(1)}R`}
              color={stats.avgR >= 1.5 ? 'text-purple-400' : 'text-amber-400'}
            />
            <StatPill label="Trades" value={stats.totalTrades} color="text-white" />
            <StatPill
              label="Profit factor"
              value={stats.profitFactor === Infinity ? 'inf' : stats.profitFactor.toFixed(1)}
              color={stats.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}
            />
            <StatPill label="Max drawdown" value={`-$${Math.abs(maxDD).toFixed(0)}`} color="text-red-400" />
            <StatPill
              label="Sharpe"
              value={sharpe.toFixed(2)}
              color={sharpe >= 1.5 ? 'text-emerald-400' : sharpe >= 1 ? 'text-amber-400' : 'text-red-400'}
            />
          </div>

          <MonthOverMonthCard
            currentLabel={format(selectedMonth, 'MMM yyyy')}
            priorLabel={priorMonthLabel}
            current={stats}
            prior={priorStats}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <EquityCurveChart curve={curve} initialBalance={accountSize} />
            <PerformanceBySetupType data={bySetup} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoricalBreakdownCard
              title="By Exit Reason"
              hint="Which exit triggers made and lost you money this month."
              data={byExitReason}
              emptyMessage="No exit reasons logged this month."
            />
            <CategoricalBreakdownCard
              title="By Market Environment"
              hint="Which market conditions you traded best and worst in this month."
              data={byMarketEnvironment}
              emptyMessage="No market environments logged this month."
            />
          </div>

          <EmotionMatrix trades={monthTrades} />

          <BehaviorRecapCard mistakeInsights={mistakeInsights} planAdherence={planAdherence} />
        </>
      )}
    </div>
  );
}
