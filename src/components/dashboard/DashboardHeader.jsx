import React from 'react';
import { TrendingUp, TrendingDown, Activity, Target, BarChart2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

function KPI({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl px-4 py-3 flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="w-3 h-3 text-white/30" />}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</span>
      </div>
      <span className={cn('text-xl font-bold font-mono leading-none truncate', color)}>{value}</span>
      {sub && <span className="text-[10px] text-white/30 mt-0.5">{sub}</span>}
    </div>
  );
}

export default function DashboardHeader({ currentBalance, totalPnL, todayPnL, winRate, avgR, todayTrades }) {
  const pnlPos = totalPnL >= 0;
  const todayPos = todayPnL >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <KPI label="Balance" value={`$${Math.round(currentBalance).toLocaleString()}`} color="text-white" icon={DollarSign} />
      <KPI label="All-time P&L" value={`${pnlPos ? '+' : ''}$${Math.abs(Math.round(totalPnL)).toLocaleString()}`} color={pnlPos ? 'text-emerald-400' : 'text-red-400'} icon={pnlPos ? TrendingUp : TrendingDown} />
      <KPI label="Today" value={`${todayPos ? '+' : ''}$${Math.abs(Math.round(todayPnL)).toLocaleString()}`} color={todayPos ? 'text-emerald-400' : 'text-red-400'} icon={Activity} sub={`${todayTrades} trade${todayTrades !== 1 ? 's' : ''}`} />
      <KPI label="Win rate" value={`${winRate.toFixed(0)}%`} color={winRate >= 50 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-red-400'} icon={Target} />
      <KPI label="Avg R" value={`${avgR.toFixed(1)}R`} color={avgR >= 1.5 ? 'text-purple-400' : avgR >= 1 ? 'text-amber-400' : 'text-red-400'} icon={BarChart2} />
    </div>
  );
}
