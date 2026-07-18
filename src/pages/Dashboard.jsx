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
  calcGreenDayStats,
  calcStreaks,
} from '@/lib/calculations/trades';
import { buildDisciplineSnapshot } from '@/lib/calculations/discipline';
import { ACCOUNT_TIERS } from '@/lib/config/accountTypes';
import { toFiniteNumber } from '@/lib/utils/general';

import { Skeleton } from '@/components/ui/skeleton';
import DashboardHeader    from '@/components/dashboard/DashboardHeader';
import DailyImprovements   from '@/components/dashboard/DailyImprovements';
import DayPanel            from '@/components/dashboard/DayPanel';
import TradingCalendar from '@/components/dashboard/TradingCalendar';
import DisciplineCoachCard from '@/components/dashboard/DisciplineCoachCard';

const MorningBrief = lazy(() => import('@/components/dashboard/MorningBrief'));
const AIModelScorecard = lazy(() => import('@/components/dashboard/AIModelScorecard'));


export default function Dashboard() {
  useTradeEvents();
  const [selectedDay, setSelectedDay] = useState(null);

  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const currentAccountType = settings?.account_type || 'demo';
  const currentTradingType = settings?.trading_type || 'stocks';
  const { data: trades = [], isLoading } = useTrades({
    filters: { account_tier: currentTier, account_type: currentAccountType, trading_type: currentTradingType },
  });

  const accountSize = toFiniteNumber(settings?.account_size, 50000);
  const targetProfitDollars = toFiniteNumber(settings?.target_profit_dollars, 500);
  const maxDollars = toFiniteNumber(settings?.max_dollars, 250);

  // ── Analytics (pure functions, no extra queries) ──────────────────────────
  const allStats      = useMemo(() => calcCoreStats(trades),     [trades]);
  const todayStats    = useMemo(() => calcTodayStats(trades),    [trades]);
  const greenDayStats = useMemo(() => calcGreenDayStats(trades), [trades]);
  const streaks       = useMemo(() => calcStreaks(trades),        [trades]);
  const disciplineSnapshot = useMemo(
    () => buildDisciplineSnapshot(trades, settings),
    [trades, settings]
  );
  const currentBalance = accountSize + toFiniteNumber(allStats.totalPnL, 0);
  const maxDailyLoss = -Math.abs(maxDollars);
  const accountType = settings?.account_type || 'demo';
  const tierSizeLabel = ACCOUNT_TIERS[currentTier]?.label ?? (currentTier === 'custom' ? 'Custom' : currentTier);
  const tierLabel = `${accountType === 'funded' ? 'Funded' : 'Demo'} · ${tierSizeLabel}`;

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
        wins={allStats.wins}
        totalTrades={allStats.totalTrades}
        avgWin={allStats.avgWin}
        avgLoss={allStats.avgLoss}
        profitFactor={allStats.profitFactor}
        todayPnL={todayStats.totalPnL}
        todayTrades={todayStats.totalTrades}
        trades={trades}
        tierLabel={tierLabel}
        greenDayPct={greenDayStats.greenDayPct}
        greenDays={greenDayStats.greenDays}
        totalTradingDays={greenDayStats.totalDays}
        currentStreak={streaks.currentStreak}
        currentStreakType={streaks.currentType}
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
            <DailyImprovements />
            <Suspense fallback={null}>
              <AIModelScorecard />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}


