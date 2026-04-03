import React, { useMemo } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { buildEquityCurve, calcCoreStats, calcMaxDrawdown } from '@/lib/calculations/trades';
import { cn } from '@/lib/utils/general';
import InfoHint from '@/components/ui/InfoHint';

function Delta({ diff, fmt, higherIsBetter = true }) {
  if (diff == null || Math.abs(diff) < 0.01) {
    return <span className="text-[10px] text-white/30">--</span>;
  }

  const positive = higherIsBetter ? diff > 0 : diff < 0;
  return (
    <span
      className={cn(
        'mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold',
        positive ? 'text-emerald-400' : 'text-red-400'
      )}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {fmt(diff)} vs last mo.
    </span>
  );
}

function Metric({ label, current, prev, fmt, higherIsBetter = true, color }) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/4 p-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className={cn('font-mono text-lg font-bold', color)}>{fmt(current)}</p>
      <Delta diff={prev != null ? current - prev : null} fmt={fmt} higherIsBetter={higherIsBetter} />
    </div>
  );
}

export default function PeriodComparison({ trades = [], initialBalance = 50000 }) {
  const curr = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return trades.filter((trade) => new Date(trade.entry_time || trade.created_date) >= oneMonthAgo);
  }, [trades]);

  const prev = useMemo(() => {
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return trades.filter((trade) => {
      const date = new Date(trade.entry_time || trade.created_date);
      return date >= twoMonthsAgo && date < oneMonthAgo;
    });
  }, [trades]);

  const cS = useMemo(() => calcCoreStats(curr), [curr]);
  const pS = useMemo(() => calcCoreStats(prev), [prev]);
  const cDD = useMemo(() => calcMaxDrawdown(buildEquityCurve(curr, initialBalance)), [curr, initialBalance]);
  const pDD = useMemo(() => calcMaxDrawdown(buildEquityCurve(prev, initialBalance)), [prev, initialBalance]);

  if (!curr.length) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-white/8 bg-[#13131e] p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">This month vs last month</p>
        <InfoHint text="Are you improving?" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="Win rate"
          current={cS.winRate}
          prev={pS.winRate}
          fmt={(value) => `${value.toFixed(0)}%`}
          color={cS.winRate >= 50 ? 'text-emerald-400' : cS.winRate >= 40 ? 'text-amber-400' : 'text-red-400'}
        />
        <Metric
          label="Avg R"
          current={cS.avgR}
          prev={pS.avgR}
          fmt={(value) => `${value.toFixed(1)}R`}
          color={cS.avgR >= 1.5 ? 'text-purple-400' : cS.avgR >= 1 ? 'text-amber-400' : 'text-red-400'}
        />
        <Metric
          label="Total P&L"
          current={cS.totalPnL}
          prev={pS.totalPnL}
          fmt={(value) => `${value >= 0 ? '+' : ''}$${Math.abs(value).toFixed(0)}`}
          color={cS.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <Metric
          label="Max drawdown"
          current={Math.abs(cDD)}
          prev={Math.abs(pDD)}
          fmt={(value) => `-$${value.toFixed(0)}`}
          higherIsBetter={false}
          color="text-amber-400"
        />
      </div>
    </div>
  );
}
