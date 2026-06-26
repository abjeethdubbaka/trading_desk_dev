/**
 * @file src/pages/Performance.jsx
 *
 * Phase 2 - rebuilt on useTrades() + pure calc functions.
 * No more localStorage reads inside hooks.
 */

import React, { useDeferredValue, useMemo, useState } from 'react';
import { startOfWeek, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { Brain, Clock3, Compass, Layers3, Radar, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmotionMatrix from '@/components/performance/EmotionMatrix';
import PerformanceByDayOfWeek from '@/components/performance/PerformanceByDayOfWeek';
import PerformanceByHoldDurationBuckets from '@/components/performance/PerformanceByHoldDurationBuckets';
import PerformanceByHourOfDay from '@/components/performance/PerformanceByHourOfDay';
import PerformanceByMonthOfYear from '@/components/performance/PerformanceByMonthOfYear';
import { calculatePerformanceByMonthOfYear } from '@/components/performance/utils';
import PerformanceByPrice from '@/components/performance/PerformanceByPrice';
import PerformanceBySetupType from '@/components/performance/PerformanceBySetupType';
import PerformanceByShareFloatRange from '@/components/performance/PerformanceByShareFloatRange';
import WeeklyReviewCard from '@/components/performance/WeeklyReviewCard';
import StrategyEngineCard from '@/components/performance/StrategyEngineCard';
import PnLCalendarHeatmap from '@/components/performance/PnLCalendarHeatmap';
import EquityCurveChart from '@/components/performance/EquityCurveChart';
import CategoricalBreakdownCard from '@/components/performance/CategoricalBreakdownCard';
import AnalysisPanel from '@/components/journal/analysis/AnalysisPanel';
import InfoHint from '@/components/ui/InfoHint';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTrades } from '@/lib/hooks/useTrades';
import { useTradesWithQuality } from '@/lib/hooks/useTradesWithQuality';
import {
  analyzeMistakePatterns,
  buildStrategyEngineSnapshot,
  buildEquityCurve,
  buildWeeklyReview,
  calcCoreStats,
  calcHoldTimeStats,
  calcMaxDrawdown,
  calcMonthlyExpectedReturn,
  calcSharpeRatio,
  computeEmotionStats,
  computeTradeSetupQuality,
  formatHoldDuration,
  perfByCategory,
  perfByDayOfWeek,
  perfByHoldDurationBuckets,
  perfByHourOfDay,
  perfByPriceRange,
  perfBySetupType,
  perfByShareFloatRange,
} from '@/lib/calculations/trades';
import { cn, toFiniteNumber } from '@/lib/utils/general';
import { ACCOUNT_TIERS, ACCOUNT_TIER_IDS } from '@/lib/config/accountTypes';

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

function TabHero({ icon: Icon, title, hint, toneClasses, children }) {
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
              <InfoHint text={hint} />
            </h3>
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

const PERIOD_OPTIONS = [
  { value: 'all',       label: 'All time' },
  { value: 'ytd',       label: 'YTD' },
  { value: '3m',        label: '3 months' },
  { value: 'month',     label: 'This month' },
  { value: 'week',      label: 'This week' },
];

function getPeriodStart(period) {
  const now = new Date();
  switch (period) {
    case 'week':  return startOfWeek(now, { weekStartsOn: 1 });
    case 'month': return startOfMonth(now);
    case '3m':    return startOfMonth(subMonths(now, 2));
    case 'ytd':   return startOfYear(now);
    default:      return null;
  }
}

const TIER_VIEW_OPTIONS = [
  { value: 'overall', label: 'Overall', icon: '⬛' },
  ...ACCOUNT_TIER_IDS.map((id) => ({ value: id, label: ACCOUNT_TIERS[id]?.label ?? id, icon: ACCOUNT_TIERS[id]?.icon ?? '' })),
];

export default function PerformancePage() {
  const [period, setPeriod] = useState('all');
  const [viewTier, setViewTier] = useState('overall');
  const { settings } = useSettings();
  const accountSize = toFiniteNumber(settings?.account_size, 50000);
  const riskLimit = toFiniteNumber(settings?.risk_amount, 0);
  const { data: trades = [], isLoading } = useTrades({
    filters: viewTier === 'overall' ? {} : { account_tier: viewTier },
  });

  const tradesWithQuality = useTradesWithQuality(trades, riskLimit);

  const periodTrades = useMemo(() => {
    const start = getPeriodStart(period);
    if (!start) return tradesWithQuality;
    return tradesWithQuality.filter((t) => {
      const d = new Date(t.entry_time ?? t.created_date ?? 0);
      return d >= start;
    });
  }, [tradesWithQuality, period]);

  // Core metrics — computed immediately so the stat pills appear without waiting
  const stats = useMemo(() => calcCoreStats(periodTrades), [periodTrades]);
  const curve = useMemo(() => buildEquityCurve(periodTrades, accountSize), [periodTrades, accountSize]);
  const maxDD = useMemo(() => calcMaxDrawdown(curve), [curve]);
  const sharpe = useMemo(() => calcSharpeRatio(periodTrades), [periodTrades]);
  const holdStats = useMemo(() => calcHoldTimeStats(periodTrades), [periodTrades]);
  const monthlyExpectedReturn = useMemo(
    () => calcMonthlyExpectedReturn(periodTrades, accountSize),
    [periodTrades, accountSize]
  );
  const qualityScore = useMemo(() => {
    let sum = 0;
    let count = 0;
    periodTrades.forEach((trade) => {
      const score = computeTradeSetupQuality(trade, { riskLimit })?.score;
      if (Number.isFinite(score)) {
        sum += score;
        count += 1;
      }
    });
    return count > 0 ? Math.round(sum / count) : null;
  }, [periodTrades, riskLimit]);

  // Secondary analytics — deferred so React can yield to the core render first
  const deferredTrades = useDeferredValue(periodTrades);
  const deferredSettings = useDeferredValue(settings);

  const byHour = useMemo(() => perfByHourOfDay(deferredTrades), [deferredTrades]);
  const byDay = useMemo(() => perfByDayOfWeek(deferredTrades), [deferredTrades]);
  const byMonth = useMemo(() => calculatePerformanceByMonthOfYear(deferredTrades), [deferredTrades]);
  const bySetup = useMemo(() => perfBySetupType(deferredTrades), [deferredTrades]);
  const byPrice = useMemo(() => perfByPriceRange(deferredTrades), [deferredTrades]);
  const byFloat = useMemo(
    () => perfByShareFloatRange(deferredTrades, { floatCategories: deferredSettings?.float_categories }),
    [deferredTrades, deferredSettings?.float_categories]
  );
  const strategySnapshot = useMemo(
    () => buildStrategyEngineSnapshot(deferredTrades, deferredSettings),
    [deferredSettings, deferredTrades]
  );
  const byHoldBucket = useMemo(() => perfByHoldDurationBuckets(deferredTrades, 5), [deferredTrades]);
  const byExitReason = useMemo(
    () => perfByCategory(deferredTrades, (trade) => trade?.exit_reason),
    [deferredTrades]
  );
  const byStopLossReason = useMemo(
    () => perfByCategory(deferredTrades, (trade) => trade?.stop_loss_reason),
    [deferredTrades]
  );
  const byMarketEnvironment = useMemo(
    () => perfByCategory(deferredTrades, (trade) => trade?.market_condition),
    [deferredTrades]
  );
  const byOverallRating = useMemo(
    () => perfByCategory(deferredTrades, (trade) => (trade?.overall_rating ? `${trade.overall_rating}★` : null)),
    [deferredTrades]
  );
  const byImprovementArea = useMemo(
    () => perfByCategory(deferredTrades, (trade) => trade?.reflection_answers?.improvements),
    [deferredTrades]
  );
  const weeklyReview = useMemo(() => buildWeeklyReview(deferredTrades, [7, 14]), [deferredTrades]);
  const mistakeInsights = useMemo(() => analyzeMistakePatterns(deferredTrades, 4), [deferredTrades]);
  const emotionStats = useMemo(() => computeEmotionStats(deferredTrades), [deferredTrades]);
  const isStale = deferredTrades !== periodTrades;

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
  const driversBestExitReason = byExitReason[0] ?? null;
  const driversWorstExitReason = byExitReason[byExitReason.length - 1] ?? null;
  const driversBestMarketEnvironment = byMarketEnvironment[0] ?? null;
  const driversTopImprovementArea = useMemo(
    () => [...byImprovementArea].sort((a, b) => b.trades - a.trades)[0] ?? null,
    [byImprovementArea]
  );
  const behaviorBestEmotion = useMemo(
    () => (emotionStats.length ? [...emotionStats].sort((a, b) => b.avgPnL - a.avgPnL)[0] : null),
    [emotionStats]
  );
  const behaviorWorstEmotion = useMemo(
    () => (emotionStats.length ? [...emotionStats].sort((a, b) => a.avgPnL - b.avgPnL)[0] : null),
    [emotionStats]
  );
  const behaviorTopMistake = mistakeInsights?.topMistakes?.[0] ?? null;
  const behaviorTopLearning = mistakeInsights?.topFixes?.[0] ?? null;
  if (isLoading) {
    return (
      <div className="space-y-5">
        {/* StatPill row: 8 pills, grid-cols-2 → 4 → 8 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
              <Skeleton className="h-2 w-14 rounded-full" />
              <Skeleton className="h-5 w-18 rounded" />
            </div>
          ))}
        </div>

        {/* WeeklyReviewCard shape */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="rounded-xl border border-white/8 p-3 space-y-2">
                <Skeleton className="h-2 w-12 rounded-full" />
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-2 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Period filter + chart area */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-7 w-14 rounded-lg" />
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <Skeleton className="h-3 w-40 rounded-full" />
          <div className="flex items-end gap-1" style={{ height: 200 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${20 + Math.abs(Math.sin(i * 0.85)) * 80}%` }}
              />
            ))}
          </div>
        </div>
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

      <WeeklyReviewCard reviews={weeklyReview} trades={periodTrades} initialBalance={accountSize} />

      {/* Tier + Period filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TIER_VIEW_OPTIONS.map((opt) => {
            const isActive = viewTier === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setViewTier(opt.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-colors',
                  isActive
                    ? opt.value === 'overall'
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-blue-400/40 bg-blue-500/20 text-blue-200'
                    : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white/65'
                )}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={cn(
                'rounded-lg border px-3 py-1 text-xs font-medium transition-colors',
                period === opt.value
                  ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                  : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/70'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="behavior" className={isStale ? 'opacity-60 transition-opacity' : 'opacity-100 transition-opacity'}>
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
            Setups &amp; Drivers
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="rounded-xl text-xs font-semibold tracking-wide text-white/60 data-[state=active]:border data-[state=active]:border-amber-300/35 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400/25 data-[state=active]:to-orange-500/20 data-[state=active]:text-white"
          >
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="behavior" className="mt-4 space-y-4">
          <TabHero
            icon={Brain}
            title="Behavior & Psychology"
            hint="How your emotional state and self-identified mistakes/fixes actually line up with outcomes."
            toneClasses="bg-emerald-500/25"
          >
            <InsightChip
              label="Best Emotion"
              value={behaviorBestEmotion ? `${behaviorBestEmotion.emotion} (${formatCompactCurrency(behaviorBestEmotion.avgPnL)} avg)` : '--'}
              tone="text-emerald-200"
            />
            <InsightChip
              label="Worst Emotion"
              value={
                behaviorWorstEmotion && behaviorWorstEmotion.emotion !== behaviorBestEmotion?.emotion
                  ? `${behaviorWorstEmotion.emotion} (${formatCompactCurrency(behaviorWorstEmotion.avgPnL)} avg)`
                  : '--'
              }
              tone="text-red-300"
            />
            <InsightChip
              label="Top Mistake"
              value={behaviorTopMistake ? `${behaviorTopMistake.text} (${behaviorTopMistake.count}x)` : '--'}
              tone="text-rose-200"
            />
            <InsightChip
              label="Top Learning"
              value={behaviorTopLearning ? `${behaviorTopLearning.text} (${behaviorTopLearning.count}x)` : '--'}
              tone="text-cyan-200"
            />
          </TabHero>

          <EmotionMatrix trades={periodTrades} />
        </TabsContent>

        <TabsContent value="timing" className="mt-4 space-y-4">
          <TabHero
            icon={Clock3}
            title="Timing Intelligence"
            hint="See when your edge is strongest and which hold windows produce your best outcomes."
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

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <PerformanceByHoldDurationBuckets data={byHoldBucket} />
            <div className="space-y-3">
              <PerformanceByHourOfDay data={byHour} />
              <PerformanceByDayOfWeek data={byDay} />
              <PerformanceByMonthOfYear data={byMonth} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="setups" className="mt-4 space-y-4">
          <TabHero
            icon={Layers3}
            title="Setup Intelligence"
            hint="Compare strategy, price level, and float context to isolate the setups worth repeating."
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
            <InsightChip label="Total Setups" value={String(bySetup.length)} tone="text-white" />
          </TabHero>

          <StrategyEngineCard snapshot={strategySnapshot} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <PerformanceBySetupType data={bySetup} />
            <PerformanceByPrice data={byPrice} />
            <PerformanceByShareFloatRange data={byFloat} />
          </div>

          <TabHero
            icon={Compass}
            title="Win/Loss Drivers"
            hint="See which exit reasons, stop conditions, market environments, and ratings correlate with your best and worst outcomes."
            toneClasses="bg-rose-500/25"
          >
            <InsightChip
              label="Best Exit Reason"
              value={
                driversBestExitReason
                  ? `${driversBestExitReason.category} (${formatCompactCurrency(driversBestExitReason.totalPnL)})`
                  : '--'
              }
              tone="text-emerald-200"
            />
            <InsightChip
              label="Worst Exit Reason"
              value={
                driversWorstExitReason && driversWorstExitReason !== driversBestExitReason
                  ? `${driversWorstExitReason.category} (${formatCompactCurrency(driversWorstExitReason.totalPnL)})`
                  : '--'
              }
              tone="text-red-300"
            />
            <InsightChip
              label="Best Market"
              value={
                driversBestMarketEnvironment
                  ? `${driversBestMarketEnvironment.category} (${formatCompactCurrency(driversBestMarketEnvironment.totalPnL)})`
                  : '--'
              }
              tone="text-rose-200"
            />
            <InsightChip
              label="Top Improvement Area"
              value={
                driversTopImprovementArea
                  ? `${driversTopImprovementArea.category} (${driversTopImprovementArea.trades})`
                  : '--'
              }
              tone="text-pink-200"
            />
          </TabHero>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoricalBreakdownCard
              title="By Exit Reason"
              hint="Which exit triggers make and lose you money."
              data={byExitReason}
              emptyMessage="Log an exit reason on your trades to see this breakdown."
            />
            <CategoricalBreakdownCard
              title="By Stop Loss Reason"
              hint="Why your stops get hit, and how costly each reason is."
              data={byStopLossReason}
              emptyMessage="Log a stop loss reason on your trades to see this breakdown."
            />
            <CategoricalBreakdownCard
              title="By Market Environment"
              hint="Which market conditions you trade best and worst in."
              data={byMarketEnvironment}
              emptyMessage="Log a market environment on your trades to see this breakdown."
            />
            <CategoricalBreakdownCard
              title="By Overall Rating"
              hint="Does how you rated the trade actually line up with the result?"
              data={byOverallRating}
              emptyMessage="Rate your trades to see this breakdown."
            />
            <CategoricalBreakdownCard
              title="By Improvement Area"
              hint="The weaknesses you flag most often, and what they cost you."
              data={byImprovementArea}
              emptyMessage="Log an improvement area on your trades to see this breakdown."
            />
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4 space-y-4">
          <TabHero
            icon={Radar}
            title="Performance Analysis"
            hint="Read your quality indicators with context from risk, consistency, and recent expectancy."
            toneClasses="bg-amber-400/25"
          >
            <InsightChip label="Expectancy" value={formatCompactCurrency(stats.expectancy)} tone="text-amber-200" />
            <InsightChip
              label="Monthly Expected Return"
              value={
                monthlyExpectedReturn.tradingDays > 0
                  ? `${formatCompactCurrency(monthlyExpectedReturn.dollars)} (${monthlyExpectedReturn.percent >= 0 ? '+' : ''}${monthlyExpectedReturn.percent.toFixed(1)}%)`
                  : '--'
              }
              tone={monthlyExpectedReturn.dollars >= 0 ? 'text-emerald-200' : 'text-red-300'}
            />
            <InsightChip
              label="Quality Score"
              value={qualityScore != null ? `${qualityScore}` : '--'}
              tone={qualityScore >= 80 ? 'text-emerald-200' : qualityScore >= 60 ? 'text-amber-200' : 'text-red-300'}
            />
          </TabHero>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#141423] to-[#101016] p-1">
            <AnalysisPanel trades={periodTrades} isCollapsed={false} />
          </div>

          <PnLCalendarHeatmap trades={periodTrades} />
          <EquityCurveChart curve={curve} initialBalance={accountSize} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
