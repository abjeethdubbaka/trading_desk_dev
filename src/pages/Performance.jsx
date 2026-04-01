/**
 * @file src/pages/Performance.jsx
 *
 * Phase 2 — rebuilt on useTrades() + pure calc functions.
 * No more localStorage reads inside hooks.
 */

import React, { useMemo }    from 'react';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSettings }        from '@/lib/context/SettingsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  calcCoreStats,
  calcSharpeRatio,
  buildEquityCurve,
  calcMaxDrawdown,
  perfByDayOfWeek,
  perfByHourOfDay,
  perfBySetupType,
  perfByPriceRange,
} from '@/lib/calculations/trades';
import { cn } from '@/lib/utils/general';

// Existing chart components (unchanged)
import EmotionMatrix      from '@/components/performance/EmotionMatrix';
import PlanAdherenceCard  from '@/components/performance/PlanAdherenceCard';
import PeriodComparison   from '@/components/performance/PeriodComparison';
import PerformanceByHourOfDay  from '@/components/performance/PerformanceByHourOfDay';
import PerformanceByDayOfWeek  from '@/components/performance/PerformanceByDayOfWeek';
import PerformanceBySetupType  from '@/components/performance/PerformanceBySetupType';
import PerformanceByPrice      from '@/components/performance/PerformanceByPrice';
import AnalysisPanel           from '@/components/journal/analysis/AnalysisPanel';

const toFiniteNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

function StatPill({ label, value, color }) {
  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">{label}</p>
      <p className={cn('text-xl font-bold font-mono', color)}>{value}</p>
    </div>
  );
}

export default function PerformancePage() {
  const { settings } = useSettings();
  const currentTier = settings?.account_tier || 'custom';
  const accountSize = toFiniteNumber(settings?.account_size, 50000);
  const { data: trades = [], isLoading } = useTrades({
    filters: { account_tier: currentTier },
  });

  const stats  = useMemo(() => calcCoreStats(trades),                   [trades]);
  const curve  = useMemo(() => buildEquityCurve(trades, accountSize),   [trades, accountSize]);
  const maxDD  = useMemo(() => calcMaxDrawdown(curve),                  [curve]);
  const sharpe = useMemo(() => calcSharpeRatio(trades),                 [trades]);

  // Pre-compute breakdowns so chart components receive clean data
  const byHour  = useMemo(() => perfByHourOfDay(trades),   [trades]);
  const byDay   = useMemo(() => perfByDayOfWeek(trades),   [trades]);
  const bySetup = useMemo(() => perfBySetupType(trades),   [trades]);
  const byPrice = useMemo(() => perfByPriceRange(trades),  [trades]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-8">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatPill label="Total P&L"
          value={`${stats.totalPnL >= 0 ? '+' : ''}$${Math.abs(stats.totalPnL).toFixed(0)}`}
          color={stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        <StatPill label="Win rate"
          value={`${stats.winRate.toFixed(0)}%`}
          color={stats.winRate >= 50 ? 'text-emerald-400' : stats.winRate >= 40 ? 'text-amber-400' : 'text-red-400'} />
        <StatPill label="Avg R"
          value={`${stats.avgR.toFixed(1)}R`}
          color={stats.avgR >= 1.5 ? 'text-purple-400' : 'text-amber-400'} />
        <StatPill label="Trades"   value={stats.totalTrades} color="text-white" />
        <StatPill label="Profit factor"
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(1)}
          color={stats.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400'} />
        <StatPill label="Max drawdown"
          value={`-$${Math.abs(maxDD).toFixed(0)}`}
          color="text-red-400" />
        <StatPill label="Sharpe"
          value={sharpe.toFixed(2)}
          color={sharpe >= 1.5 ? 'text-emerald-400' : sharpe >= 1 ? 'text-amber-400' : 'text-red-400'} />
      </div>

      <PeriodComparison trades={trades} initialBalance={accountSize} />

      <Tabs defaultValue="behavior">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="setups">Setups</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="behavior" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EmotionMatrix    trades={trades} />
            <PlanAdherenceCard trades={trades} />
          </div>
        </TabsContent>

        <TabsContent value="timing" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PerformanceByHourOfDay data={byHour}  />
            <PerformanceByDayOfWeek data={byDay}   />
          </div>
        </TabsContent>

        <TabsContent value="setups" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PerformanceBySetupType data={bySetup} />
            <PerformanceByPrice     data={byPrice} />
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <AnalysisPanel trades={trades} isCollapsed={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


