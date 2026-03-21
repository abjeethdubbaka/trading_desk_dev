import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTradeEvents } from '@/components/journal/hooks/useTradeEvents';
import TradingCalendar from '@/components/dashboard/TradingCalendar';
import PerformanceBreakdown from '@/components/dashboard/PerformanceBreakdown';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StreakTracker from '@/components/dashboard/StreakTracker';
import DailyGoalBar from '@/components/dashboard/DailyGoalBar';
import MorningBrief from '@/components/dashboard/MorningBrief';
import DayPanel from '@/components/dashboard/DayPanel';
import { computeCoreStats, getTodayStats, getDailySequence } from '@/lib/performanceMetrics';

export default function Dashboard() {
  useTradeEvents();
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: settings=[] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
    refetchOnWindowFocus: false, staleTime: 5*60*1000,
  });

  const { data: trades=[] } = useQuery({
    queryKey: ['journal-trades'], // shared key — no duplicate cache
    queryFn: () => {
      try {
        const s = window.localStorage.getItem('trades');
        const p = s ? JSON.parse(s) : [];
        return p.sort((a,b)=>new Date(b.entry_time||b.created_date)-new Date(a.entry_time||a.created_date));
      } catch { return []; }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    // NO polling — event bus handles cross-component sync
  });

  const accountSize   = settings?.[0]?.account_size || 50000;
  const targetProfit  = parseFloat(settings?.[0]?.target_profit_dollars) || 500;
  const maxDailyLoss  = -(parseFloat(settings?.[0]?.max_dollars) || 250);

  const allStats   = useMemo(()=>computeCoreStats(trades),[trades]);
  const todayStats = useMemo(()=>getTodayStats(trades),[trades]);
  const sequence   = useMemo(()=>getDailySequence(trades,20),[trades]);

  return (
    <div className="space-y-5">
      <DashboardHeader
        currentBalance={accountSize + allStats.totalPnL}
        totalPnL={allStats.totalPnL}
        todayPnL={todayStats.totalPnL}
        winRate={allStats.winRate}
        avgR={allStats.avgR}
        todayTrades={todayStats.totalTrades}
      />

      <DailyGoalBar
        todayPnL={todayStats.totalPnL}
        targetProfit={targetProfit}
        maxDailyLoss={maxDailyLoss}
      />

      <StreakTracker sequence={sequence} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TradingCalendar trades={trades} onDaySelect={setSelectedDay} />
        </div>
        {selectedDay
          ? <DayPanel day={selectedDay} trades={trades} onClose={()=>setSelectedDay(null)} />
          : <MorningBrief trades={trades} />
        }
      </div>

      <PerformanceBreakdown trades={trades} />
    </div>
  );
}
