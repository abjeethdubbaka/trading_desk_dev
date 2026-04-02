/**
 * @file src/pages/Performance.jsx
 *
 * Phase 2 - rebuilt on useTrades() + pure calc functions.
 * No more localStorage reads inside hooks.
 */

import React, { useMemo } from 'react';
import { Clock3, Layers3, Radar, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmotionMatrix from '@/components/performance/EmotionMatrix';
import HoldDurationSummary from '@/components/performance/HoldDurationSummary';
import PerformanceByDayOfWeek from '@/components/performance/PerformanceByDayOfWeek';
import PerformanceByHoldDurationBuckets from '@/components/performance/PerformanceByHoldDurationBuckets';
import PerformanceByHourOfDay from '@/components/performance/PerformanceByHourOfDay';
import PerformanceByPrice from '@/components/performance/PerformanceByPrice';
import PerformanceBySetupType from '@/components/performance/PerformanceBySetupType';
import PerformanceByShareFloatRange from '@/components/performance/PerformanceByShareFloatRange';
import SetupTimeFloatHeatmap from '@/components/performance/SetupTimeFloatHeatmap';
import PeriodComparison from '@/components/performance/PeriodComparison';
import PlanAdherenceCard from '@/components/performance/PlanAdherenceCard';
import AnalysisPanel from '@/components/journal/analysis/AnalysisPanel';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTrades } from '@/lib/hooks/useTrades';
import {
  buildEquityCurve,
  calcCoreStats,
  calcHoldTimeStats,
  calcMaxDrawdown,
  calcSharpeRatio,
  formatHoldDuration,
  perfByDayOfWeek,
  perfByHoldDurationBuckets,
  perfByHourOfDay,
  perfByPriceRange,
  perfBySetupType,
  perfBySetupTimeFloatHeatmap,
  perfByShareFloatRange,
} from '@/lib/calculations/trades';
import { cn } from '@/lib/utils/general';

const toFiniteNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

function StatPill({ label, value, color }) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#13131e] px-4 py-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className={cn('font-mono text-xl font-bold', color)}>{value}</p>
    </div>
  );
}

function InsightChip({ label, value, tone = 'text-white' }) {
  return (
    <div className="min-w-[140px] rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold', tone)}>{value}</p>
    </div>
  );
}

function TabHero({ icon: Icon, title, subtitle, toneClasses, children }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 md:p-5',
        'border-white/10 bg-gradient-to-r from-[#13131e] to-[#101420]'
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full blur-3xl',
          toneClasses
        )}
      />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-white md:text-lg">
              <Icon className="h-4 w-4 text-white/80" />
              {title}
            </h3>
            <p className="mt-1 text-xs text-white/55">{subtitle}</p>
          </div>
          <Sparkles className="mt-1 h-4 w-4 text-white/35" />
        </div>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    </div>
  );
}

const formatCompactCurrency = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  const sign = numeric > 0 ? '+' : numeric < 0 ? '-' : '';
  return `${sign}$${Math.abs(numeric).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export default function PerformancePage() {
  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const accountSize = toFiniteNumber(settings?.account_size, 50000);
  const { data: trades = [], isLoading } = useTrades({
    filters: { account_tier: currentTier },
  });

  const stats = useMemo(() => calcCoreStats(trades), [trades]);
  const curve = useMemo(() => buildEquityCurve(trades, accountSize), [trades, accountSize]);
  const maxDD = useMemo(() => calcMaxDrawdown(curve), [curve]);
  const sharpe = useMemo(() => calcSharpeRatio(trades), [trades]);
  const holdStats = useMemo(() => calcHoldTimeStats(trades), [trades]);

  const byHour = useMemo(() => perfByHourOfDay(trades), [trades]);
  const byDay = useMemo(() => perfByDayOfWeek(trades), [trades]);
  const bySetup = useMemo(() => perfBySetupType(trades), [trades]);
  const byPrice = useMemo(() => perfByPriceRange(trades), [trades]);
  const byFloat = useMemo(
    () => perfByShareFloatRange(trades, { floatCategories: settings?.float_categories }),
    [trades, settings?.float_categories]
  );
  const setupTimeFloatHeatmap = useMemo(
    () => perfBySetupTimeFloatHeatmap(trades, {
      setupLimit: 8,
      hourLimit: 8,
      floatCategories: settings?.float_categories,
    }),
    [trades, settings?.float_categories]
  );
  const byHoldBucket = useMemo(() => perfByHoldDurationBuckets(trades, 5), [trades]);

  const timingTopHour = useMemo(
    () => [...byHour].filter((row) => row.trades > 0).sort((a, b) => b.totalPnL - a.totalPnL)[0] ?? null,
    [byHour]
  );
  const timingTopDay = useMemo(
    () => [...byDay].filter((row) => row.trades > 0).sort((a, b) => b.totalPnL - a.totalPnL)[0] ?? null,
    [byDay]
  );
  const timingTopBucket = useMemo(
    () =>
      [...byHoldBucket].filter((row) => row.trades > 0).sort((a, b) => b.totalPnL - a.totalPnL)[0] ??
      null,
    [byHoldBucket]
  );
  const setupsTopSetup = useMemo(
    () => [...bySetup].filter((row) => row.trades > 0).sort((a, b) => b.totalPnL - a.totalPnL)[0] ?? null,
    [bySetup]
  );
  const setupsTopFloat = useMemo(
    () => [...byFloat].filter((row) => row.trades > 0).sort((a, b) => b.totalPnL - a.totalPnL)[0] ?? null,
    [byFloat]
  );
  const setupsTopPrice = useMemo(
    () => [...byPrice].filter((row) => row.trades > 0).sort((a, b) => b.totalPnL - a.totalPnL)[0] ?? null,
    [byPrice]
  );
  const setupsTopCombo = useMemo(
    () => setupTimeFloatHeatmap?.topCombos?.[0] ?? null,
    [setupTimeFloatHeatmap]
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
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
        <StatPill
          label="Avg Hold"
          value={holdStats.closedTrades > 0 ? formatHoldDuration(holdStats.avgMinutes) : '--'}
          color={holdStats.closedTrades > 0 ? 'text-sky-300' : 'text-white/40'}
        />
      </div>

      <PeriodComparison trades={trades} initialBalance={accountSize} />

      <Tabs defaultValue="behavior">
        <TabsList className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-[#13131e]/90 p-1.5 sm:grid-cols-4">
          <TabsTrigger
            value="behavior"
            className="rounded-xl text-xs font-semibold tracking-wide text-white/60 data-[state=active]:border data-[state=active]:border-emerald-400/30 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/25 data-[state=active]:to-blue-500/20 data-[state=active]:text-white"
          >
            Behavior
          </TabsTrigger>
          <TabsTrigger
            value="timing"
            className="rounded-xl text-xs font-semibold tracking-wide text-white/60 data-[state=active]:border data-[state=active]:border-sky-400/30 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500/25 data-[state=active]:to-cyan-500/20 data-[state=active]:text-white"
          >
            Timing
          </TabsTrigger>
          <TabsTrigger
            value="setups"
            className="rounded-xl text-xs font-semibold tracking-wide text-white/60 data-[state=active]:border data-[state=active]:border-violet-400/30 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/25 data-[state=active]:to-indigo-500/20 data-[state=active]:text-white"
          >
            Setups
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="rounded-xl text-xs font-semibold tracking-wide text-white/60 data-[state=active]:border data-[state=active]:border-amber-300/35 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400/25 data-[state=active]:to-orange-500/20 data-[state=active]:text-white"
          >
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="behavior" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <EmotionMatrix trades={trades} />
            <PlanAdherenceCard trades={trades} />
          </div>
        </TabsContent>

        <TabsContent value="timing" className="mt-4 space-y-4">
          <TabHero
            icon={Clock3}
            title="Timing Intelligence"
            subtitle="See when your edge is strongest and which hold windows produce your best outcomes."
            toneClasses="bg-sky-500/25"
          >
            <InsightChip
              label="Best Hour"
              value={timingTopHour ? `${timingTopHour.hour} (${formatCompactCurrency(timingTopHour.totalPnL)})` : '--'}
              tone="text-sky-200"
            />
            <InsightChip
              label="Best Day"
              value={timingTopDay ? `${timingTopDay.day} (${formatCompactCurrency(timingTopDay.totalPnL)})` : '--'}
              tone="text-cyan-200"
            />
            <InsightChip
              label="Best 5m Bucket"
              value={
                timingTopBucket
                  ? `${timingTopBucket.label} (${formatCompactCurrency(timingTopBucket.totalPnL)})`
                  : '--'
              }
              tone="text-emerald-200"
            />
            <InsightChip
              label="Median Hold"
              value={holdStats.closedTrades > 0 ? formatHoldDuration(holdStats.medianMinutes) : '--'}
              tone="text-white"
            />
          </TabHero>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <PerformanceByHourOfDay data={byHour} />
            <PerformanceByDayOfWeek data={byDay} />
            <HoldDurationSummary stats={holdStats} />
          </div>
          <PerformanceByHoldDurationBuckets data={byHoldBucket} />
        </TabsContent>

        <TabsContent value="setups" className="mt-4 space-y-4">
          <TabHero
            icon={Layers3}
            title="Setup Intelligence"
            subtitle="Compare strategy, price level, and float context to isolate the setups worth repeating."
            toneClasses="bg-violet-500/25"
          >
            <InsightChip
              label="Top Setup"
              value={setupsTopSetup ? `${setupsTopSetup.setup} (${formatCompactCurrency(setupsTopSetup.totalPnL)})` : '--'}
              tone="text-violet-200"
            />
            <InsightChip
              label="Top Float Range"
              value={setupsTopFloat ? `${setupsTopFloat.range} (${formatCompactCurrency(setupsTopFloat.totalPnL)})` : '--'}
              tone="text-indigo-200"
            />
            <InsightChip
              label="Top Price Band"
              value={setupsTopPrice ? `${setupsTopPrice.range} (${formatCompactCurrency(setupsTopPrice.totalPnL)})` : '--'}
              tone="text-sky-200"
            />
            <InsightChip
              label="Top Combo"
              value={
                setupsTopCombo
                  ? `${setupsTopCombo.setup} @ ${setupsTopCombo.hour} [${setupsTopCombo.floatKey}]`
                  : '--'
              }
              tone="text-emerald-200"
            />
            <InsightChip label="Total Setups" value={String(bySetup.length)} tone="text-white" />
          </TabHero>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <PerformanceBySetupType data={bySetup} />
            <PerformanceByPrice data={byPrice} />
            <PerformanceByShareFloatRange data={byFloat} />
          </div>
          <SetupTimeFloatHeatmap data={setupTimeFloatHeatmap} />
        </TabsContent>

        <TabsContent value="analysis" className="mt-4 space-y-4">
          <TabHero
            icon={Radar}
            title="Performance Analysis"
            subtitle="Read your quality indicators with context from risk, consistency, and recent expectancy."
            toneClasses="bg-amber-400/25"
          >
            <InsightChip label="Expectancy" value={formatCompactCurrency(stats.expectancy)} tone="text-amber-200" />
            <InsightChip
              label="Profit Factor"
              value={stats.profitFactor === Infinity ? 'inf' : stats.profitFactor.toFixed(2)}
              tone="text-emerald-200"
            />
            <InsightChip label="Sharpe" value={sharpe.toFixed(2)} tone="text-sky-200" />
            <InsightChip label="Max Drawdown" value={`-$${Math.abs(maxDD).toFixed(0)}`} tone="text-red-300" />
          </TabHero>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#141423] to-[#101016] p-1">
            <AnalysisPanel trades={trades} isCollapsed={false} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
