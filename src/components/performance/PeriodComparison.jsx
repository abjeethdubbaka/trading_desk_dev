import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { calcCoreStats, buildEquityCurve, calcMaxDrawdown } from '@/lib/calculations/trades';
import { cn } from '@/lib/utils/general';

function Delta({ diff, fmt, higherIsBetter = true }) {
  if (diff == null || Math.abs(diff) < 0.01) return <span className="text-white/30 text-[10px]">—</span>;
  const pos = higherIsBetter ? diff > 0 : diff < 0;
  return (
    <span className={cn('text-[10px] font-semibold flex items-center gap-0.5 mt-0.5', pos ? 'text-emerald-400' : 'text-red-400')}>
      {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {fmt(diff)} vs last mo.
    </span>
  );
}

function Metric({ label, current, prev, fmt, higherIsBetter = true, color }) {
  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-3">
      <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className={cn('text-lg font-bold font-mono', color)}>{fmt(current)}</p>
      <Delta diff={prev != null ? current - prev : null} fmt={fmt} higherIsBetter={higherIsBetter} />
    </div>
  );
}

export default function PeriodComparison({ trades = [], initialBalance = 50000 }) {
  const curr = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return trades.filter(t => new Date(t.entry_time || t.created_date) >= oneMonthAgo);
  }, [trades]);
  
  const prev = useMemo(() => {
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return trades.filter(t => {
      const date = new Date(t.entry_time || t.created_date);
      return date >= twoMonthsAgo && date < oneMonthAgo;
    });
  }, [trades]);

  const cS = useMemo(() => calcCoreStats(curr), [curr]);
  const pS = useMemo(() => calcCoreStats(prev), [prev]);
  const cDD = useMemo(() => calcMaxDrawdown(buildEquityCurve(curr, initialBalance)), [curr, initialBalance]);
  const pDD = useMemo(() => calcMaxDrawdown(buildEquityCurve(prev, initialBalance)), [prev, initialBalance]);

  if (!curr.length) return null;

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-2xl p-5 space-y-4">
      <div><p className="text-sm font-semibold">This month vs last month</p><p className="text-xs text-white/40 mt-0.5">Are you improving?</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="Win rate" current={cS.winRate} prev={pS.winRate} fmt={(v) => `${v.toFixed(0)}%`} color={cS.winRate >= 50 ? 'text-emerald-400' : cS.winRate >= 40 ? 'text-amber-400' : 'text-red-400'} />
        <Metric label="Avg R" current={cS.avgR} prev={pS.avgR} fmt={(v) => `${v.toFixed(1)}R`} color={cS.avgR >= 1.5 ? 'text-purple-400' : cS.avgR >= 1 ? 'text-amber-400' : 'text-red-400'} />
        <Metric label="Total P&L" current={cS.totalPnL} prev={pS.totalPnL} fmt={(v) => `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(0)}`} color={cS.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        <Metric label="Max drawdown" current={Math.abs(cDD)} prev={Math.abs(pDD)} fmt={(v) => `-$${v.toFixed(0)}`} higherIsBetter={false} color="text-amber-400" />
      </div>
    </div>
  );
}


