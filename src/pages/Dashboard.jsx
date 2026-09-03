/**
 * @file src/pages/Dashboard.jsx
 *
 * Phase 2 — wired to useTrades() + useSettings() (Firebase).
 * All analytics use src/lib/calculations/trades.js pure functions.
 */

import React, { lazy, Suspense, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
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
import { getDailyTargetsWeek1, getDailyTargetPurposesWeek1 } from '@/lib/config/dailyTargets';
import { getTodayMaxDailyLoss } from '@/lib/config/dailyLossLimits';
import { toFiniteNumber } from '@/lib/utils/general';

import { Skeleton } from '@/components/ui/skeleton';
import DashboardHeader    from '@/components/dashboard/DashboardHeader';
import DailyImprovements   from '@/components/dashboard/DailyImprovements';
import DayPanel            from '@/components/dashboard/DayPanel';
import TradingCalendar from '@/components/dashboard/TradingCalendar';
import DisciplineCoachCard from '@/components/dashboard/DisciplineCoachCard';

const MorningBrief = lazy(() => import('@/components/dashboard/MorningBrief'));
const AIModelScorecard = lazy(() => import('@/components/dashboard/AIModelScorecard'));

// ── Daily target schedule ─────────────────────────────────────────────────────
const DOW_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function getTodayTarget(settings) {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun, 6=Sat
  if (dow === 0 || dow === 6) return null;
  const dayIndex = dow - 1; // 0=Mon … 4=Fri
  const targets  = getDailyTargetsWeek1(settings);
  const purposes = getDailyTargetPurposesWeek1(settings);
  return { amount: targets[dayIndex] ?? 0, purpose: purposes[dayIndex] ?? '', dayIndex };
}

function DailyTargetBanner({ todayPnL = 0, settings }) {
  const target = getTodayTarget(settings);
  if (!target || target.amount === 0) return null;

  const { amount, purpose, dayIndex } = target;
  const pct       = amount > 0 ? Math.min(100, Math.max(0, (todayPnL / amount) * 100)) : 0;
  const isHit     = todayPnL >= amount;
  const isNeg     = todayPnL < 0;
  const remaining = Math.max(0, amount - todayPnL);

  return (
    <div className={cn(
      'rounded-2xl border p-5',
      isHit
        ? 'border-emerald-400/25 bg-gradient-to-r from-emerald-500/[0.07] to-transparent'
        : 'border-violet-500/20 bg-gradient-to-r from-violet-500/[0.06] to-transparent',
    )}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
            Today's Target · {DOW_LABELS[dayIndex]}
          </p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-bold tracking-tight text-white/90">
              ${amount.toLocaleString()}
            </span>
            {purpose && (
              <span className="text-sm text-white/35">{purpose}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            'text-2xl font-bold tabular-nums',
            isHit ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-white/55',
          )}>
            {todayPnL >= 0 ? '+' : ''}${Math.abs(todayPnL).toFixed(0)}
          </p>
          <p className="mt-0.5 text-xs text-white/30">
            {isHit ? 'Target reached!' : `$${remaining.toFixed(0)} to go`}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isHit ? 'bg-emerald-500' : isNeg ? 'bg-rose-500/60' : 'bg-violet-500',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-right text-[10px] text-white/25">{Math.round(pct)}% of daily goal</p>
      </div>
    </div>
  );
}

function TodayFocusCard({ todayStats, weekPnL = 0, targetProfit, maxDailyLoss, streaks, alerts }) {
  const { totalPnL: todayPnL, totalTrades: todayTrades } = todayStats;
  const pnlPct = targetProfit > 0 ? Math.min(100, Math.max(0, (weekPnL / targetProfit) * 100)) : 0;
  const isGreen = weekPnL > 0;
  const isAtMax = todayPnL <= maxDailyLoss;

  const topAlert = alerts?.[0] ?? null;

  let streakLine = null;
  if (streaks.currentStreak > 0 && streaks.currentType) {
    const type = streaks.currentType;
    streakLine = type === 'win'
      ? `${streaks.currentStreak}-trade win streak — keep the discipline.`
      : `${streaks.currentStreak}-trade loss streak — confirm criteria before the next entry.`;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Today's Focus</p>

      {/* P&L progress toward weekly target */}
      {targetProfit > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`font-mono text-base font-bold ${isGreen ? 'text-emerald-400' : weekPnL < 0 ? 'text-rose-400' : 'text-white/40'}`}>
              {weekPnL >= 0 ? '+' : ''}${Math.round(Math.abs(weekPnL)).toLocaleString()}
            </span>
            <span className="text-[10px] text-white/30">weekly goal ${Math.round(targetProfit).toLocaleString()}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className={`h-full rounded-full transition-all ${isAtMax ? 'bg-rose-500' : isGreen ? 'bg-emerald-500' : 'bg-rose-500/60'}`}
              style={{ width: isAtMax ? '100%' : `${pnlPct}%` }}
            />
          </div>
          <p className="text-[10px] text-white/30">
            {todayTrades} trade{todayTrades !== 1 ? 's' : ''} today
            {isAtMax && ' · daily loss limit hit'}
          </p>
        </div>
      )}

      {/* Streak context */}
      {streakLine && (
        <p className={`text-[11px] leading-relaxed ${streaks.currentType === 'win' ? 'text-emerald-300/70' : 'text-amber-300/70'}`}>
          {streakLine}
        </p>
      )}

      {/* Top discipline alert */}
      {topAlert && (
        <div className={`rounded-lg border px-2.5 py-2 ${topAlert.type === 'warning' ? 'border-rose-400/20 bg-rose-500/[0.06]' : 'border-amber-400/20 bg-amber-500/[0.06]'}`}>
          <p className={`text-[11px] leading-relaxed font-semibold ${topAlert.type === 'warning' ? 'text-rose-200/80' : 'text-amber-200/80'}`}>{topAlert.title}</p>
          <p className="text-[11px] text-white/45 mt-0.5">{topAlert.message}</p>
        </div>
      )}
    </div>
  );
}


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
      <DailyTargetBanner todayPnL={todayStats.totalPnL} settings={settings} />
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
        bestWinStreak={streaks.bestWin}
        bestLossStreak={streaks.bestLoss}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <DisciplineCoachCard
            snapshot={disciplineSnapshot}
            dailyGoal={{
              todayPnL: thisWeekPnL,
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
            <TodayFocusCard
              todayStats={todayStats}
              weekPnL={thisWeekPnL}
              targetProfit={targetProfitDollars}
              maxDailyLoss={maxDailyLoss}
              streaks={streaks}
              alerts={disciplineSnapshot.alerts ?? []}
            />
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


