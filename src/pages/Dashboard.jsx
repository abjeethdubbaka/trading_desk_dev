/**
 * @file src/pages/Dashboard.jsx
 *
 * Phase 2 — wired to useTrades() + useSettings() (Firebase).
 * All analytics use src/lib/calculations/trades.js pure functions.
 *
 * Read top to bottom: today, the account over all time, then the month on
 * the calendar beside the discipline verdict and what is left to review.
 */

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings }      from '@/lib/context/SettingsContext';
import { useTradeEvents }   from '@/components/journal';
import { useDailyReviews }  from '@/lib/hooks/useDailyReviews';
import { useSetupJournal }  from '@/lib/hooks/useSetupJournal';
import { getJournaledTradeIds } from '@/lib/setupJournal/utils';
import { getUndebriefedTrades, getUnreviewedDays, toLocalDateKey } from '@/lib/dashboard/attention';
import { useGuardian } from '@/lib/hooks/useGuardian';
import {
  calcCoreStats,
  calcTodayStats,
  calcGreenDayStats,
  calcStreaks,
} from '@/lib/calculations/trades';
import { buildDisciplineSnapshot } from '@/lib/calculations/discipline';
import { ACCOUNT_TIERS } from '@/lib/config/accountTypes';
import { getDailyTargetsWeek1, getDailyTargetPurposesWeek1 } from '@/lib/config/dailyTargets';
import { getTodayMaxDailyLoss } from '@/lib/config/dailyLossLimits';
import { toFiniteNumber } from '@/lib/utils/general';

import { Skeleton } from '@/components/ui/skeleton';
import DashboardHeader    from '@/components/dashboard/DashboardHeader';
import DayPanel            from '@/components/dashboard/DayPanel';
import TradingCalendar from '@/components/dashboard/TradingCalendar';
import DisciplineCoachCard from '@/components/dashboard/DisciplineCoachCard';
import TodayCard from '@/components/dashboard/TodayCard';
import NeedsAttention from '@/components/dashboard/NeedsAttention';

// Morning Brief — replaced by Needs Attention, kept for a possible return.
// const MorningBrief = lazy(() => import('@/components/dashboard/MorningBrief'));
// AI Model Scorecard — retired from the Dashboard, kept for a possible return.
// const AIModelScorecard = lazy(() => import('@/components/dashboard/AIModelScorecard'));

// ── Daily target schedule ─────────────────────────────────────────────────────
const DOW_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function getTodayTarget(settings) {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun, 6=Sat
  if (dow === 0 || dow === 6) return null;
  const dayIndex = dow - 1; // 0=Mon … 4=Fri
  const targets  = getDailyTargetsWeek1(settings);
  const purposes = getDailyTargetPurposesWeek1(settings);
  return { amount: targets[dayIndex] ?? 0, purpose: purposes[dayIndex] ?? '', dayLabel: DOW_LABELS[dayIndex] };
}

export default function Dashboard() {
  useTradeEvents();
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: dailyReviews = [] } = useDailyReviews();
  const reviewedDates = useMemo(
    () => new Set(dailyReviews.map((r) => r.date).filter(Boolean)),
    [dailyReviews]
  );

  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const currentAccountType = settings?.account_type || 'demo';
  const currentTradingType = settings?.trading_type || 'stocks';
  const { data: trades = [], isLoading } = useTrades({
    filters: { account_tier: currentTier, account_type: currentAccountType, trading_type: currentTradingType },
  });

  const accountSize = toFiniteNumber(settings?.account_size, 50000);
  const targetProfitDollars = toFiniteNumber(settings?.target_profit_dollars, 500);
  const maxDollars = toFiniteNumber(getTodayMaxDailyLoss(settings), 250);

  // ── Analytics (pure functions, no extra queries) ──────────────────────────
  const allStats      = useMemo(() => calcCoreStats(trades),     [trades]);
  const todayStats    = useMemo(() => calcTodayStats(trades),    [trades]);
  const thisWeekPnL   = useMemo(() => {
    const now = new Date();
    const dow = now.getDay(); // 0=Sun
    const daysFromMonday = dow === 0 ? 6 : dow - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday);
    return trades
      .filter((t) => t.entry_time && new Date(t.entry_time) >= monday)
      .reduce((sum, t) => sum + Number(t.pnl ?? t.total_pnl ?? 0), 0);
  }, [trades]);
  const greenDayStats = useMemo(() => calcGreenDayStats(trades), [trades]);
  const streaks       = useMemo(() => calcStreaks(trades),        [trades]);
  const disciplineSnapshot = useMemo(
    () => buildDisciplineSnapshot(trades, settings),
    [trades, settings]
  );
  const todayTarget = useMemo(() => getTodayTarget(settings), [settings]);

  const { journalEntries } = useSetupJournal();
  const attention = useMemo(() => ({
    unreviewedDays: getUnreviewedDays(trades, reviewedDates),
    undebriefedTrades: getUndebriefedTrades(trades, getJournaledTradeIds(journalEntries)),
  }), [trades, reviewedDates, journalEntries]);

  const currentBalance = accountSize + toFiniteNumber(allStats.totalPnL, 0);

  // Trade Terminal's own numbers, when Guardian is reading them today.
  const { status: guardianStatus } = useGuardian();
  const live = useMemo(() => {
    const reading = guardianStatus?.reading;
    if (!guardianStatus?.enabled || !reading || !Number.isFinite(reading.dailyPnl)) return null;
    if (guardianStatus.day?.date !== toLocalDateKey(new Date())) return null;
    return {
      dailyPnl: reading.dailyPnl,
      unrealizedPnl: reading.unrealizedPnl,
      positions: reading.positions,
      trades: reading.trades,
    };
  }, [guardianStatus]);
  const accountType = settings?.account_type || 'demo';
  const tierSizeLabel = ACCOUNT_TIERS[currentTier]?.label ?? (currentTier === 'custom' ? 'Custom' : currentTier);
  const tierLabel = `${accountType === 'funded' ? 'Funded' : 'Demo'} · ${tierSizeLabel}`;

  if (isLoading) {
    return (
      <div className="space-y-5">
        {/* TodayCard shape */}
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <Skeleton className="h-2.5 w-32 rounded-full" />
          <Skeleton className="h-9 w-40 rounded" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 rounded" />)}
          </div>
        </div>

        {/* All-time stats */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-[70px] rounded-xl" />)}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Calendar */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:col-span-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 30 }).map((_, k) => <Skeleton key={k} className="h-16 rounded-lg" />)}
            </div>
          </div>
          <div className="space-y-5">
            <Skeleton className="h-[190px] rounded-2xl" />
            <Skeleton className="h-[170px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TodayCard
        todayPnL={todayStats.totalPnL}
        todayTrades={todayStats.totalTrades}
        target={todayTarget}
        maxDailyTrades={disciplineSnapshot?.metrics?.maxDailyTrades ?? 0}
        maxDailyLoss={Math.abs(maxDollars)}
        weekPnL={thisWeekPnL}
        weeklyTarget={targetProfitDollars}
        trades={trades}
        currentStreak={streaks.currentStreak}
        currentStreakType={streaks.currentType}
        reviewedToday={reviewedDates.has(toLocalDateKey(new Date()))}
        live={live}
      />

      <DashboardHeader
        currentBalance={currentBalance}
        totalPnL={allStats.totalPnL}
        winRate={allStats.winRate}
        wins={allStats.wins}
        totalTrades={allStats.totalTrades}
        avgWin={allStats.avgWin}
        avgLoss={allStats.avgLoss}
        profitFactor={allStats.profitFactor}
        tierLabel={tierLabel}
        greenDayPct={greenDayStats.greenDayPct}
        greenDays={greenDayStats.greenDays}
        totalTradingDays={greenDayStats.totalDays}
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TradingCalendar
            trades={trades}
            selectedDay={selectedDay}
            reviewedDates={reviewedDates}
            onDaySelect={(day) => setSelectedDay((current) => (
              current && format(current, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') ? null : day
            ))}
          />
        </div>
        <div className="space-y-5">
          {selectedDay ? (
            <DayPanel
              day={selectedDay}
              trades={trades}
              onClose={() => setSelectedDay(null)}
              reviewed={reviewedDates.has(format(selectedDay, 'yyyy-MM-dd'))}
            />
          ) : (
            <>
              <DisciplineCoachCard snapshot={disciplineSnapshot} />
              <NeedsAttention
                unreviewedDays={attention.unreviewedDays}
                undebriefedTrades={attention.undebriefedTrades}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
