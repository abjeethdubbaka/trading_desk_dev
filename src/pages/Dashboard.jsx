/**
 * @file src/pages/Dashboard.jsx
 *
 * Phase 2 — wired to useTrades() + useSettings() (Firebase).
 * All analytics use src/lib/calculations/trades.js pure functions.
 */

import React, { useState, useMemo } from 'react';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings }      from '@/lib/SettingsContext';
import { useTradeEvents }   from '@/components/journal/hooks/useTradeEvents';
import {
  calcCoreStats,
  calcTodayStats,
  getDailySequence,
  buildEquityCurve,
  calcMaxDrawdown,
  calcSharpeRatio,
} from '@/lib/calculations/trades';

import TradingCalendar    from '@/components/dashboard/TradingCalendar';
import PerformanceBreakdown from '@/components/dashboard/PerformanceBreakdown';
import DashboardHeader    from '@/components/dashboard/DashboardHeader';
import StreakTracker       from '@/components/dashboard/StreakTracker';
import DailyGoalBar        from '@/components/dashboard/DailyGoalBar';
import MorningBrief        from '@/components/dashboard/MorningBrief';
import DayPanel            from '@/components/dashboard/DayPanel';

export default function Dashboard() {
  useTradeEvents();
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: trades = [], isLoading } = useTrades({ sortBy: 'entry_time', sortDir: 'desc' });
  const settingsData = useSettings();
  const {
    settings,
  } = settingsData;
  
  const accountSize = settings?.account_size;
  const targetProfitDollars = settings?.target_profit_dollars;
  const maxDollars = settings?.max_dollars;

  // ── Analytics (pure functions, no extra queries) ──────────────────────────
  const allStats   = useMemo(() => calcCoreStats(trades),          [trades]);
  const todayStats = useMemo(() => calcTodayStats(trades),         [trades]);
  const sequence   = useMemo(() => getDailySequence(trades, 20),   [trades]);
  const curve      = useMemo(() => buildEquityCurve(trades, accountSize), [trades, accountSize]);
  const maxDD      = useMemo(() => calcMaxDrawdown(curve),         [curve]);
  const sharpe     = useMemo(() => calcSharpeRatio(trades),        [trades]);

  const currentBalance = (Number(accountSize) || 0) + (Number(allStats.totalPnL) || 0);
  const maxDailyLoss   = -(maxDollars || 250);

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
        todayPnL={todayStats.totalPnL}
        winRate={allStats.winRate}
        avgR={allStats.avgR}
        todayTrades={todayStats.totalTrades}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <DailyGoalBar
            todayPnL={todayStats.totalPnL}
            targetProfit={targetProfitDollars}
            maxDailyLoss={maxDailyLoss}
          />
          <StreakTracker sequence={sequence} />
          <TradingCalendar trades={trades} onDaySelect={setSelectedDay} />
        </div>
        {selectedDay
          ? <DayPanel day={selectedDay} trades={trades} onClose={() => setSelectedDay(null)} />
          : <MorningBrief trades={trades} />
        }
      </div>

      <PerformanceBreakdown trades={trades} />
    </div>
  );
}
