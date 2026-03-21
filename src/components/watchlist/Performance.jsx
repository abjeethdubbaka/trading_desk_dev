import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import EquityCurve from '@/components/performance/EquityCurve';
import EmotionMatrix from '@/components/performance/EmotionMatrix';
import PlanAdherenceCard from '@/components/performance/PlanAdherenceCard';
import PeriodComparison from '@/components/performance/PeriodComparison';
import PerformanceByHourOfDay from '@/components/performance/PerformanceByHourOfDay';
import PerformanceByDayOfWeek from '@/components/performance/PerformanceByDayOfWeek';
import PerformanceBySetupType from '@/components/performance/PerformanceBySetupType';
import PerformanceByPrice from '@/components/performance/PerformanceByPrice';
import { computeCoreStats, computeSharpeRatio, buildEquityCurve, computeMaxDrawdown } from '@/lib/performanceMetrics';
import { cn } from '@/lib/utils';

function StatPill({ label, value, color }) {
  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">{label}</p>
      <p className={cn('text-xl font-bold font-mono', color)}>{value}</p>
    </div>
  );
}

export default function PerformancePage() {
  const { data: settings=[] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
    staleTime: 5*60*1000,
  });

  const { data: trades=[], isLoading } = useQuery({
    queryKey: ['journal-trades'],
    queryFn: () => { try { return JSON.parse(window.localStorage.getItem('trades')||'[]'); } catch { return []; } },
    staleTime: 0, refetchOnWindowFocus: true,
  });

  const initialBalance = settings?.[0]?.account_size || 50000;
  const stats  = useMemo(()=>computeCoreStats(trades),[trades]);
  const curve  = useMemo(()=>buildEquityCurve(trades,initialBalance),[trades,initialBalance]);
  const maxDD  = useMemo(()=>computeMaxDrawdown(curve),[curve]);
  const sharpe = useMemo(()=>computeSharpeRatio(trades),[trades]);

  if (isLoading) return <div className="text-white/30 text-sm p-8">Loading…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Performance</h1>
        <p className="text-white/40 text-sm mt-1">Deep analytics across all your trades</p>
      </div>

      {/* KPI strip — all real data, no mocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatPill label="Total P&L"    value={`${stats.totalPnL>=0?'+':''}$${Math.abs(stats.totalPnL).toFixed(0)}`}             color={stats.totalPnL>=0?'text-emerald-400':'text-red-400'} />
        <StatPill label="Win rate"     value={`${stats.winRate.toFixed(0)}%`}        color={stats.winRate>=50?'text-emerald-400':stats.winRate>=40?'text-amber-400':'text-red-400'} />
        <StatPill label="Avg R"        value={`${stats.avgR.toFixed(1)}R`}           color={stats.avgR>=1.5?'text-purple-400':'text-amber-400'} />
        <StatPill label="Trades"       value={stats.totalTrades}                      color="text-white" />
        <StatPill label="Profit factor" value={stats.profitFactor===Infinity?'∞':stats.profitFactor.toFixed(1)} color={stats.profitFactor>=1.5?'text-emerald-400':'text-amber-400'} />
        <StatPill label="Max drawdown" value={`-$${Math.abs(maxDD).toFixed(0)}`}     color="text-red-400" />
        <StatPill label="Sharpe"       value={sharpe.toFixed(2)}                      color={sharpe>=1.5?'text-emerald-400':sharpe>=1?'text-amber-400':'text-red-400'} />
      </div>

      <PeriodComparison trades={trades} initialBalance={initialBalance} />
      <EquityCurve trades={trades} initialBalance={initialBalance} />

      <Tabs defaultValue="behavior">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="setups">Setups</TabsTrigger>
        </TabsList>

        <TabsContent value="behavior" className="space-y-4 mt-4">
          <EmotionMatrix trades={trades} />
          <PlanAdherenceCard trades={trades} />
        </TabsContent>

        <TabsContent value="timing" className="space-y-4 mt-4">
          <PerformanceByHourOfDay trades={trades} />
          <PerformanceByDayOfWeek trades={trades} />
        </TabsContent>

        <TabsContent value="setups" className="space-y-4 mt-4">
          <PerformanceBySetupType trades={trades} />
          <PerformanceByPrice trades={trades} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
