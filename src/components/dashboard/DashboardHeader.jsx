import React from 'react';
import { cn } from '@/lib/utils/general';
import AnimatedStat from '@/components/ui/AnimatedStat';

function Stat({ label, children, sub }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-white/35">{label}</p>
      <div className="mt-1.5 truncate font-mono text-lg font-bold leading-none tabular-nums">{children}</div>
      {sub && <p className="mt-1 truncate font-mono text-[10px] text-white/30">{sub}</p>}
    </div>
  );
}

const Empty = () => <span className="text-white/20">—</span>;

/**
 * The account's standing over its whole history. Today's numbers live in the
 * Today card above, so these stay about the long run.
 */
export default function DashboardHeader({
  currentBalance,
  totalPnL,
  winRate,
  wins = 0,
  totalTrades = 0,
  avgWin = 0,
  avgLoss = 0,
  profitFactor = 0,
  tierLabel = '',
  greenDayPct = 0,
  greenDays = 0,
  totalTradingDays = 0,
}) {
  const winColor = winRate >= 50 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-rose-400';
  const pfColor = profitFactor >= 1.5 ? 'text-emerald-400' : profitFactor >= 1 ? 'text-amber-400' : 'text-rose-400';
  const greenColor = greenDayPct >= 60 ? 'text-emerald-400' : greenDayPct >= 45 ? 'text-amber-400' : 'text-rose-400';
  const wlRatio = avgLoss > 0 ? avgWin / avgLoss : null;

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-white/35">All time</h2>
        {tierLabel && (
          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
            {tierLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Balance">
          <AnimatedStat value={currentBalance} format={(n) => `$${Math.round(n).toLocaleString()}`} colorize={false} className="text-white" />
        </Stat>

        <Stat label="P&L" sub={`${totalTrades} trade${totalTrades === 1 ? '' : 's'}`}>
          <AnimatedStat
            value={totalPnL}
            format={(n) => `${n >= 0 ? '+' : '-'}$${Math.abs(Math.round(n)).toLocaleString()}`}
            colorize={false}
            className={totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          />
        </Stat>

        <Stat label="Win rate" sub={totalTrades > 0 ? `${wins}W / ${totalTrades - wins}L` : null}>
          {totalTrades > 0 ? <span className={winColor}>{winRate.toFixed(0)}%</span> : <Empty />}
        </Stat>

        <Stat label="Profit factor">
          {totalTrades > 0
            ? <span className={pfColor}>{profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}</span>
            : <Empty />}
        </Stat>

        <Stat
          label="Avg win : loss"
          sub={avgWin > 0 || avgLoss > 0 ? `$${Math.round(avgWin).toLocaleString()} : $${Math.round(avgLoss).toLocaleString()}` : null}
        >
          {wlRatio !== null
            ? <span className={cn(wlRatio >= 1.5 ? 'text-emerald-400' : wlRatio >= 1 ? 'text-amber-400' : 'text-rose-400')}>{wlRatio.toFixed(2)}x</span>
            : <Empty />}
        </Stat>

        <Stat label="Green days" sub={totalTradingDays > 0 ? `${greenDays} of ${totalTradingDays} days` : null}>
          {totalTradingDays > 0 ? <span className={greenColor}>{greenDayPct.toFixed(0)}%</span> : <Empty />}
        </Stat>
      </div>
    </section>
  );
}
