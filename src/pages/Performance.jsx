/**
 * @file src/pages/Performance.jsx
 *
 * Phase 2 - rebuilt on useTrades() + pure calc functions.
 * No more localStorage reads inside hooks.
 */

import React, { useDeferredValue, useMemo, useState } from 'react';
import { startOfWeek, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { Brain, Clock3, Compass, Layers3, Radar, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { analyzeEdgeFactors } from '@/lib/ml/winPredictor';
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
import TradeSequenceCard from '@/components/performance/TradeSequenceCard';
import StrategyEngineCard from '@/components/performance/StrategyEngineCard';
import CategoricalBreakdownCard from '@/components/performance/CategoricalBreakdownCard';
import AnalysisPanel from '@/components/journal/analysis/AnalysisPanel';
import InfoHint from '@/components/ui/InfoHint';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTrades } from '@/lib/hooks/useTrades';
import { useTradesWithQuality } from '@/lib/hooks/useTradesWithQuality';
import {
  analyzeMistakePatterns,
  analyzeWhatWorked,
  buildEquityCurve,
  buildStrategyEngineSnapshot,
  buildWeeklyReview,
  calcCoreStats,
  calcDisciplineSavings,
  calcGreenDayStats,
  calcHoldTimeStats,
  calcMaxDrawdown,
  calcMonthlyExpectedReturn,
  calcRevengeTrades,
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
  perfByTradeInSession,
} from '@/lib/calculations/trades';
import { normalizePlaybookEntries, PLAYBOOK_FIELD } from '@/lib/playbook/utils';
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

const RISK_LEVEL_LABEL_PERF = { half: '½ Risk', normal: 'Normal', double: '2× Risk' };
const RISK_LEVEL_COLOR_PERF = { half: 'text-amber-300', normal: 'text-emerald-300', double: 'text-rose-300' };

function DisciplineSavingsCard({ savings, riskLimit, label }) {
  if (!savings || savings.tradesAnalyzed === 0) return null;

  const compliant = savings.totalSaved <= 0;
  const headerLabel = label ?? `Risk Discipline · $${riskLimit.toFixed(0)}/trade limit`;

  return (
    <div className={cn(
      'rounded-2xl border p-5 space-y-4',
      compliant ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-violet-500/25 bg-violet-500/5'
    )}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={cn('text-[10px] font-semibold uppercase tracking-widest', compliant ? 'text-emerald-300/70' : 'text-violet-300/70')}>
            {headerLabel}
          </p>
          {compliant ? (
            <p className="mt-0.5 text-sm font-semibold text-white/80">
              Every loss stayed within your{' '}
              <span className="text-emerald-300 font-bold">${riskLimit.toFixed(0)}</span>
              {' '}risk limit — great discipline this period.
            </p>
          ) : (
            <p className="mt-0.5 text-sm font-semibold text-white/80">
              If you had cut losses based on your limit, you could have saved{' '}
              <span className="text-violet-300 font-bold text-base">${savings.totalSaved.toFixed(0)}</span>
            </p>
          )}
        </div>
        <div className="flex gap-3 text-center">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] text-white/40 uppercase">Over limit</p>
            <p className={cn('font-bold text-lg', savings.tradesExceeded > 0 ? 'text-rose-400' : 'text-emerald-400')}>
              {savings.tradesExceeded}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] text-white/40 uppercase">Within limit</p>
            <p className="font-bold text-emerald-400 text-lg">{savings.tradesAnalyzed - savings.tradesExceeded}</p>
          </div>
          {!compliant && (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2">
              <p className="text-[10px] text-violet-300/60 uppercase">Would save</p>
              <p className="font-bold text-violet-300 text-lg">${savings.totalSaved.toFixed(0)}</p>
            </div>
          )}
        </div>
      </div>

      {!compliant && savings.bySetup.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-white/35">Breakdown by setup</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {savings.bySetup.map((row) => (
              <div key={row.setup} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80 truncate">{row.setup}</p>
                  <p className={cn('text-[10px]', RISK_LEVEL_COLOR_PERF[row.riskLevel] ?? 'text-white/40')}>
                    {RISK_LEVEL_LABEL_PERF[row.riskLevel] ?? 'Normal'} · limit ${row.allowedLoss.toFixed(0)}/trade · {row.count} breach{row.count !== 1 ? 'es' : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-violet-300">saved ${row.totalSaved.toFixed(0)}</p>
                  <p className="text-[10px] text-white/30">worst ${row.worstSingle.toFixed(0)} over</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TIER_VIEW_OPTIONS = [
  { value: 'overall', label: 'Overall', icon: '' },
  ...ACCOUNT_TIER_IDS.map((id) => ({ value: id, label: ACCOUNT_TIERS[id]?.label ?? id, icon: ACCOUNT_TIERS[id]?.icon ?? '' })),
];

export default function PerformancePage() {
  const [period, setPeriod] = useState('all');
  const [viewTier, setViewTier] = useState('overall');
  const { settings, updateFields } = useSettings();
  const accountSize = toFiniteNumber(settings?.account_size, 50000);
  const tierPreset = viewTier !== 'overall' ? ACCOUNT_TIERS[viewTier] : null;
  const tierRiskAmounts = settings?.tier_risk_amounts || {};
  // Overall: use current settings risk_amount; specific tier: use saved tier amount, fall back to settings
  const riskLimit = viewTier !== 'overall' && tierRiskAmounts[viewTier] != null
    ? toFiniteNumber(tierRiskAmounts[viewTier], 0)
    : toFiniteNumber(settings?.risk_amount, 0);
  const currentAccountType = settings?.account_type || 'demo';
  const currentTradingType = settings?.trading_type || 'stocks';
  const { data: trades = [], isLoading } = useTrades({
    filters: viewTier === 'overall'
      ? { account_type: currentAccountType, trading_type: currentTradingType }
      : { account_tier: viewTier, account_type: currentAccountType, trading_type: currentTradingType },
  });

  const tradesWithQuality = useTradesWithQuality(trades, riskLimit);
  const playbookEntries = useMemo(() => normalizePlaybookEntries(settings?.[PLAYBOOK_FIELD]), [settings]);

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

  const byOverallRating = useMemo(
    () => perfByCategory(deferredTrades, (trade) => (trade?.overall_rating ? `${trade.overall_rating}★` : null)),
    [deferredTrades]
  );
  const byImprovementArea = useMemo(
    () => perfByCategory(deferredTrades, (trade) => trade?.reflection_answers?.improvements),
    [deferredTrades]
  );
  const weeklyReview = useMemo(() => buildWeeklyReview(deferredTrades, [7, 14]), [deferredTrades]);
  const mistakeInsights   = useMemo(() => analyzeMistakePatterns(deferredTrades, 4), [deferredTrades]);
  const whatWorkedInsights = useMemo(() => analyzeWhatWorked(deferredTrades, 6),     [deferredTrades]);
  const edgeFactors        = useMemo(() => analyzeEdgeFactors(deferredTrades, 5),    [deferredTrades]);
  const disciplineSavings = useMemo(() => {
    if (viewTier !== 'overall') {
      return calcDisciplineSavings(periodTrades, playbookEntries, riskLimit);
    }
    // Overall: combine discipline savings across each tier using that tier's saved risk limit
    const allTierIds = ACCOUNT_TIER_IDS.filter((id) => id !== 'custom');
    let totalSaved = 0;
    let tradesAnalyzed = 0;
    let tradesExceeded = 0;
    const bySetupMap = new Map();

    allTierIds.forEach((tierId) => {
      const tierLimit = toFiniteNumber(tierRiskAmounts[tierId], 0);
      if (tierLimit <= 0) return;
      const tierTrades = periodTrades.filter((t) => t?.account_tier === tierId);
      if (!tierTrades.length) return;
      const result = calcDisciplineSavings(tierTrades, playbookEntries, tierLimit);
      totalSaved += result.totalSaved;
      tradesAnalyzed += result.tradesAnalyzed;
      tradesExceeded += result.tradesExceeded;
      result.bySetup.forEach((row) => {
        const key = `${tierId}:${row.setup}`;
        if (bySetupMap.has(key)) {
          const existing = bySetupMap.get(key);
          existing.totalSaved += row.totalSaved;
          existing.count += row.count;
          existing.worstSingle = Math.max(existing.worstSingle, row.worstSingle);
        } else {
          bySetupMap.set(key, { ...row, setup: `${row.setup} (${ACCOUNT_TIERS[tierId]?.label ?? tierId})` });
        }
      });
    });

    // Also include trades with no tier or unknown tier using current riskLimit
    const tieredIds = new Set(allTierIds);
    const untiedTrades = periodTrades.filter((t) => !t?.account_tier || !tieredIds.has(t.account_tier));
    const fallbackLimit = toFiniteNumber(settings?.risk_amount, 0);
    if (untiedTrades.length && fallbackLimit > 0) {
      const result = calcDisciplineSavings(untiedTrades, playbookEntries, fallbackLimit);
      totalSaved += result.totalSaved;
      tradesAnalyzed += result.tradesAnalyzed;
      tradesExceeded += result.tradesExceeded;
    }

    return {
      totalSaved: Math.round(totalSaved * 100) / 100,
      bySetup: [...bySetupMap.values()].sort((a, b) => b.totalSaved - a.totalSaved),
      tradesAnalyzed,
      tradesExceeded,
    };
  }, [viewTier, periodTrades, playbookEntries, riskLimit, tierRiskAmounts, settings?.risk_amount]);
  const emotionStats    = useMemo(() => computeEmotionStats(deferredTrades),    [deferredTrades]);
  const greenDayStats   = useMemo(() => calcGreenDayStats(periodTrades),         [periodTrades]);
  const revengeTrades   = useMemo(() => calcRevengeTrades(deferredTrades, 20),   [deferredTrades]);
  const byTradeInSession = useMemo(() => perfByTradeInSession(deferredTrades, 5), [deferredTrades]);
  const isStale = deferredTrades !== periodTrades;

  const timingTopHour = useMemo(
    () => [...byHour].filter((row) => row.trades > 0).sort((a, b) => b.totalPnL - a.totalPnL)[0] ?? null,
    [byHour]
  );
  const timingTopDay = useMemo(
    () => [...byDay].filter((row) => row.trades > 0).sort((a, b) => b.totalPnL - a.totalPnL)[0] ?? null,
    [byDay]
  );
  const bestDayOfWeek = useMemo(
    () => [...byDay].filter((row) => row.trades >= 3).sort((a, b) => b.winRate - a.winRate)[0] ?? null,
    [byDay]
  );
  const worstDayOfWeek = useMemo(
    () => [...byDay].filter((row) => row.trades >= 3).sort((a, b) => a.winRate - b.winRate)[0] ?? null,
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
        {/* StatPill row: 11 pills, grid-cols-2 → 3 → 11 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-11">
          {Array.from({ length: 11 }).map((_, i) => (
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-11">
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
        <StatPill
          label="Green Days"
          value={greenDayStats.totalDays > 0 ? `${greenDayStats.greenDayPct.toFixed(0)}%` : '--'}
          color={greenDayStats.greenDayPct >= 60 ? 'text-emerald-400' : greenDayStats.greenDayPct >= 45 ? 'text-amber-400' : 'text-rose-400'}
        />
        <StatPill
          label="Best Day"
          value={bestDayOfWeek ? `${bestDayOfWeek.short} ${bestDayOfWeek.winRate.toFixed(0)}%` : '--'}
          color="text-emerald-400"
        />
        <StatPill
          label="Worst Day"
          value={worstDayOfWeek ? `${worstDayOfWeek.short} ${worstDayOfWeek.winRate.toFixed(0)}%` : '--'}
          color="text-rose-400"
        />
      </div>

      <WeeklyReviewCard reviews={weeklyReview} trades={periodTrades} initialBalance={accountSize} />

      {/* Account type toggle (Demo / Funded) */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Account</span>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
          {[
            { value: 'demo', label: 'Demo', activeClass: 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/30' },
            { value: 'funded', label: 'Funded', activeClass: 'bg-amber-500/15 text-amber-200 border border-amber-400/30' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateFields({ account_type: opt.value })}
              className={cn(
                'rounded px-4 py-1 text-xs font-semibold transition-colors',
                currentAccountType === opt.value
                  ? opt.activeClass
                  : 'text-white/35 hover:text-white/60'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tier + Period filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
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
                {opt.icon && <span>{opt.icon}</span>}
                {opt.label}
              </button>
            );
          })}
          {tierPreset && riskLimit > 0 && (
            <span className="ml-1 rounded-lg border border-blue-400/25 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300">
              Your risk limit: ${riskLimit.toLocaleString()}/trade
            </span>
          )}
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
            <InsightChip
              label="Revenge Win Rate"
              value={revengeTrades.total >= 3
                ? `${revengeTrades.winRate.toFixed(0)}% (${revengeTrades.total} trades)`
                : revengeTrades.total > 0 ? `${revengeTrades.total} trades (small sample)` : 'no data'}
              tone={revengeTrades.total >= 3 && revengeTrades.winRate < 40 ? 'text-rose-300' : 'text-white/70'}
            />
          </TabHero>

          <EmotionMatrix trades={periodTrades} />

          <DisciplineSavingsCard
            savings={disciplineSavings}
            riskLimit={riskLimit}
            label={viewTier === 'overall' ? 'Risk Discipline · All tiers combined' : undefined}
          />

          {/* What Worked patterns */}
          {whatWorkedInsights.topWorked.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-semibold text-white">What Worked</p>
                <span className="ml-auto text-[10px] text-white/30">{whatWorkedInsights.totalEntries} tags across {periodTrades.length} trades</span>
              </div>
              <div className="space-y-2">
                {whatWorkedInsights.topWorked.map((item) => (
                  <div key={item.text} className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/85 truncate">{item.text}</p>
                      <p className="text-[10px] text-white/35">{item.count}× tagged</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                      <div>
                        <p className={cn('text-sm font-bold font-mono', item.winRate >= 60 ? 'text-emerald-400' : item.winRate >= 45 ? 'text-amber-400' : 'text-rose-400')}>
                          {item.winRate}%
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-white/30">win rate</p>
                      </div>
                      <div>
                        <p className={cn('text-sm font-bold font-mono', item.avgPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                          {item.avgPnL >= 0 ? '+' : ''}${item.avgPnL}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-white/30">avg P&L</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ML edge factor analysis */}
          {edgeFactors && (edgeFactors.edges.length > 0 || edgeFactors.risks.length > 0) && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-400" />
                <p className="text-sm font-semibold text-white">Edge Analysis · Your Data</p>
                <span className="ml-auto text-[10px] text-white/30">baseline {edgeFactors.baseline}% WR · {edgeFactors.totalTrades} trades</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {edgeFactors.edges.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">Edge Boosters</p>
                    </div>
                    {edgeFactors.edges.map((e) => (
                      <div key={`${e.label}:${e.value}`} className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-white/80 truncate">{e.value}</p>
                          <p className="text-[9px] text-white/35">{e.label} · {e.count} trades</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-bold text-emerald-400 font-mono">{e.winRate}%</p>
                          <p className="text-[9px] text-emerald-500/60">+{e.delta}pp</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {edgeFactors.risks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="h-3 w-3 text-rose-400" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400/70">Risk Signals</p>
                    </div>
                    {edgeFactors.risks.map((e) => (
                      <div key={`${e.label}:${e.value}`} className="flex items-center justify-between gap-2 rounded-lg border border-rose-500/15 bg-rose-500/[0.06] px-2.5 py-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-white/80 truncate">{e.value}</p>
                          <p className="text-[9px] text-white/35">{e.label} · {e.count} trades</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-bold text-rose-400 font-mono">{e.winRate}%</p>
                          <p className="text-[9px] text-rose-500/60">{e.delta}pp</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
            <InsightChip
              label="Winner Hold"
              value={holdStats.avgWinningMinutes != null ? formatHoldDuration(holdStats.avgWinningMinutes) : '--'}
              tone="text-emerald-200"
            />
            <InsightChip
              label="Loser Hold"
              value={holdStats.avgLosingMinutes != null ? formatHoldDuration(holdStats.avgLosingMinutes) : '--'}
              tone={holdStats.avgLosingMinutes != null && holdStats.avgWinningMinutes != null && holdStats.avgLosingMinutes > holdStats.avgWinningMinutes ? 'text-rose-300' : 'text-white/70'}
            />
          </TabHero>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <PerformanceByHoldDurationBuckets data={byHoldBucket} />
            <div className="space-y-3">
              <TradeSequenceCard data={byTradeInSession} />
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

        </TabsContent>
      </Tabs>
    </div>
  );
}
