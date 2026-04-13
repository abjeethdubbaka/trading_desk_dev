/**
 * @file src/pages/Dashboard.jsx
 *
 * Phase 2 — wired to useTrades() + useSettings() (Firebase).
 * All analytics use src/lib/calculations/trades.js pure functions.
 */

import React, { lazy, Suspense, useState, useMemo } from 'react';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings }      from '@/lib/context/SettingsContext';
import { useTradeEvents }   from '@/components/journal';
import {
  calcCoreStats,
  calcTodayStats,
  getDailySequence,
  buildEquityCurve,
} from '@/lib/calculations/trades';
import { buildDisciplineSnapshot } from '@/lib/calculations/discipline';

import DashboardHeader    from '@/components/dashboard/DashboardHeader';
import DailyImprovements   from '@/components/dashboard/DailyImprovements';
import DayPanel            from '@/components/dashboard/DayPanel';
import TradingCalendar from '@/components/dashboard/TradingCalendar';
import DisciplineCoachCard from '@/components/dashboard/DisciplineCoachCard';

const MorningBrief = lazy(() => import('@/components/dashboard/MorningBrief'));
const AIModelScorecard = lazy(() => import('@/components/dashboard/AIModelScorecard'));
const PerformanceBreakdown = lazy(() => import('@/components/dashboard/PerformanceBreakdown'));

const toFiniteNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export default function Dashboard() {
  useTradeEvents();
  const [selectedDay, setSelectedDay] = useState(null);

  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const { data: trades = [], isLoading } = useTrades({
    filters: {
      account_tier: currentTier,
      sortBy: 'entry_time',
      sortDir: 'desc',
    },
  });

  const accountSize = toFiniteNumber(settings?.account_size, 50000);
  const targetProfitDollars = toFiniteNumber(settings?.target_profit_dollars, 500);
  const maxDollars = toFiniteNumber(settings?.max_dollars, 250);

  // ── Analytics (pure functions, no extra queries) ──────────────────────────
  const allStats   = useMemo(() => calcCoreStats(trades),          [trades]);
  const todayStats = useMemo(() => calcTodayStats(trades),         [trades]);
  const fourteenDaySequence = useMemo(() => getDailySequence(trades, 14), [trades]);
  const curve      = useMemo(() => buildEquityCurve(trades, accountSize), [trades, accountSize]);
  const disciplineSnapshot = useMemo(
    () => buildDisciplineSnapshot(trades, settings),
    [trades, settings]
  );
  const avg14DayPnl = useMemo(() => {
    if (!fourteenDaySequence.length) return 0;
    const total = fourteenDaySequence.reduce((sum, day) => sum + toFiniteNumber(day?.pnl, 0), 0);
    return total / fourteenDaySequence.length;
  }, [fourteenDaySequence]);
  const avg14DayResult = avg14DayPnl >= 0 ? 'W' : 'L';

  const currentBalance = accountSize + toFiniteNumber(allStats.totalPnL, 0);
  const maxDailyLoss = -Math.abs(maxDollars);

  if (isLoading) {
    return (
      <div className="space-y-5">
        {[1,2,3].map(i => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DashboardHeader
        currentBalance={currentBalance}
        totalPnL={allStats.totalPnL}
        winRate={allStats.winRate}
        avgR={allStats.avgR}
        avg14DayResult={avg14DayResult}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <DisciplineCoachCard
            snapshot={disciplineSnapshot}
            dailyGoal={{
              todayPnL: todayStats.totalPnL,
              targetProfit: targetProfitDollars,
              maxDailyLoss,
            }}
          />
          <TradingCalendar trades={trades} onDaySelect={setSelectedDay} />
        </div>
        {selectedDay ? (
          <DayPanel day={selectedDay} trades={trades} onClose={() => setSelectedDay(null)} />
        ) : (
          <div className="space-y-5">
            <Suspense
              fallback={<div className="h-[210px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />}
            >
              <MorningBrief trades={trades} />
            </Suspense>
            <Suspense
              fallback={<div className="h-[200px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />}
            >
              <AIModelScorecard />
            </Suspense>
            <DailyImprovements />
          </div>
        )}
      </div>

      <Suspense
        fallback={<div className="h-[300px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />}
      >
        <PerformanceBreakdown data={curve} />
      </Suspense>
    </div>
  );
}


