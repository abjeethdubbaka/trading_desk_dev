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
import { toFiniteNumber } from '@/lib/utils/general';

import { Skeleton } from '@/components/ui/skeleton';
import DashboardHeader    from '@/components/dashboard/DashboardHeader';
import DailyImprovements   from '@/components/dashboard/DailyImprovements';
import DayPanel            from '@/components/dashboard/DayPanel';
import TradingCalendar from '@/components/dashboard/TradingCalendar';
import DisciplineCoachCard from '@/components/dashboard/DisciplineCoachCard';

const MorningBrief = lazy(() => import('@/components/dashboard/MorningBrief'));
const AIModelScorecard = lazy(() => import('@/components/dashboard/AIModelScorecard'));
const PerformanceBreakdown = lazy(() => import('@/components/dashboard/PerformanceBreakdown'));


export default function Dashboard() {
  useTradeEvents();
  const [selectedDay, setSelectedDay] = useState(null);

  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const { data: trades = [], isLoading } = useTrades({
    filters: { account_tier: currentTier },
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
        {/* DashboardHeader shape: row of 4 inline metrics separated by dividers */}
        <div className="rounded-2xl border border-white/8 bg-[#13131e] p-4">
          <div className="flex items-center">
            {[1, 2, 3, 4].map((i) => (
              <React.Fragment key={i}>
                <div className="space-y-2 px-4 first:pl-0">
                  <Skeleton className="h-2 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded" />
                </div>
                {i < 4 && <div className="mx-1 h-10 w-px flex-shrink-0 bg-white/10" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main grid: 2/3 column (discipline + calendar) + 1/3 sidebar */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {/* DisciplineCoachCard shape */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-36 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-2 rounded-xl border border-white/8 p-3">
                    <Skeleton className="h-2 w-12 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
            {/* TradingCalendar shape */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <Skeleton className="h-3 w-24 rounded-full" />
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 35 }).map((_, k) => (
                  <Skeleton key={k} className="h-8 rounded-lg" />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Skeleton className="h-[210px] rounded-2xl" />
            <Skeleton className="h-[200px] rounded-2xl" />
          </div>
        </div>
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
              fallback={
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3" style={{ height: 210 }}>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-3 w-32 rounded-full" />
                  </div>
                  <div className="space-y-2 pt-1">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-2.5 w-full rounded-full" />)}
                    <Skeleton className="h-2.5 w-3/4 rounded-full" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              }
            >
              <MorningBrief trades={trades} />
            </Suspense>
            <Suspense
              fallback={
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3" style={{ height: 200 }}>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-28 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-lg border border-white/8 p-2.5 space-y-1.5">
                        <Skeleton className="h-2 w-14 rounded-full" />
                        <Skeleton className="h-4 w-10 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <AIModelScorecard />
            </Suspense>
            <DailyImprovements />
          </div>
        )}
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4" style={{ height: 300 }}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-36 rounded-full" />
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-5 w-12 rounded-full" />)}
              </div>
            </div>
            {/* Chart area */}
            <div className="flex items-end gap-1 pt-2" style={{ height: 180 }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t"
                  style={{ height: `${25 + Math.abs(Math.sin(i * 0.7)) * 75}%` }}
                />
              ))}
            </div>
          </div>
        }
      >
        <PerformanceBreakdown data={curve} />
      </Suspense>
    </div>
  );
}


