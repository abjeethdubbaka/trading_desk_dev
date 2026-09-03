import React, { useMemo } from 'react';
import { cn } from '@/lib/utils/general';
import AnimatedStat from '@/components/ui/AnimatedStat';
import { getTradePnL, getTradeDate } from '@/lib/utils/tradeFields';

function Sep() {
  return <div className="h-10 w-px flex-shrink-0 bg-white/10" />;
}

function Metric({ label, children, minWidth = 'min-w-[130px]' }) {
  return (
    <div className={cn('px-4 first:pl-0 last:pr-0', minWidth)}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      <div className="mt-1 leading-none">{children}</div>
    </div>
  );
}

function StreakDots({ trades, count = 7 }) {
  const last = useMemo(() =>
    [...trades]
      .sort((a, b) => (getTradeDate(b) ?? 0) - (getTradeDate(a) ?? 0))
      .slice(0, count)
      .reverse(),
  [trades, count]);

  if (!last.length) return <span className="font-mono text-xl font-bold text-white/20">—</span>;

  return (
    <div className="flex items-center gap-[4px] mt-1">
      {last.map((t, i) => {
        const win = getTradePnL(t) > 0;
        return (
          <div
            key={t.id ?? i}
            className={cn('w-2 h-2 rounded-full flex-shrink-0', win ? 'bg-emerald-400' : 'bg-rose-400')}
            style={{ opacity: 0.4 + (i / count) * 0.6 }}
          />
        );
      })}
    </div>
  );
}

export default function DashboardHeader({
  currentBalance,
  totalPnL,
  winRate,
  wins = 0,
  totalTrades = 0,
  avgWin = 0,
  avgLoss = 0,
  profitFactor = 0,
  todayPnL = 0,
  todayTrades = 0,
  trades = [],
  tierLabel = '',
  greenDayPct = 0,
  greenDays = 0,
  totalTradingDays = 0,
  currentStreak = 0,
  currentStreakType = null,
  bestWinStreak = 0,
  bestLossStreak = 0,
}) {
  const pnlPos   = totalPnL >= 0;
  const todayPos = todayPnL >= 0;
  const winColor = winRate >= 50 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-rose-400';
  const pfColor  = profitFactor >= 1.5 ? 'text-emerald-400' : profitFactor >= 1 ? 'text-amber-400' : 'text-rose-400';
  const wlRatio  = avgLoss > 0 ? avgWin / avgLoss : null;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#13131e] p-4">
      {tierLabel && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Viewing</span>
          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
            {tierLabel}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center">

          <Metric label="Balance">
            <AnimatedStat value={currentBalance} format={(n) => `$${Math.round(n).toLocaleString()}`} colorize={false} className="font-mono text-xl font-bold text-white" />
          </Metric>
          <Sep />

          <Metric label="All-time P&L">
            <AnimatedStat value={totalPnL} format={(n) => `${n >= 0 ? '+' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`} colorize={false} className={cn('font-mono text-xl font-bold', pnlPos ? 'text-emerald-400' : 'text-rose-400')} />
          </Metric>
          <Sep />

          <Metric label="Win Rate" minWidth="min-w-[110px]">
            <span className={cn('font-mono text-xl font-bold', winColor)}>{winRate.toFixed(0)}%</span>
            <div className="mt-0.5 text-[10px] font-mono text-white/35">{wins}W / {totalTrades - wins}L</div>
          </Metric>
          <Sep />

          <Metric label="Avg Win : Loss" minWidth="min-w-[160px]">
            {avgWin > 0 || avgLoss > 0 ? (
              <div className="flex items-baseline gap-1.5 font-mono text-xl font-bold">
                <span className="text-emerald-400">${Math.round(avgWin).toLocaleString()}</span>
                <span className="text-white/25 text-base">:</span>
                <span className="text-rose-400">${Math.round(avgLoss).toLocaleString()}</span>
                {wlRatio !== null && (
                  <span className="ml-1 text-sm font-semibold text-white/40">({wlRatio.toFixed(1)}x)</span>
                )}
              </div>
            ) : (
              <span className="font-mono text-xl font-bold text-white/20">—</span>
            )}
          </Metric>
          <Sep />

          <Metric label="Profit Factor" minWidth="min-w-[110px]">
            <span className={cn('font-mono text-xl font-bold', pfColor)}>
              {profitFactor === Infinity ? '∞' : profitFactor.toFixed(1)}
            </span>
          </Metric>
          <Sep />

          <Metric label="Green Days" minWidth="min-w-[110px]">
            {totalTradingDays > 0 ? (
              <>
                <span className={cn('font-mono text-xl font-bold', greenDayPct >= 60 ? 'text-emerald-400' : greenDayPct >= 45 ? 'text-amber-400' : 'text-rose-400')}>
                  {greenDayPct.toFixed(0)}%
                </span>
                <div className="mt-0.5 text-[10px] font-mono text-white/35">{greenDays}G / {totalTradingDays - greenDays}R</div>
              </>
            ) : (
              <span className="font-mono text-xl font-bold text-white/20">—</span>
            )}
          </Metric>
          <Sep />

          <Metric label="Today" minWidth="min-w-[110px]">
            <AnimatedStat value={todayPnL} format={(n) => `${n >= 0 ? '+' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`} colorize={false} className={cn('font-mono text-xl font-bold', todayPos ? 'text-emerald-400' : 'text-rose-400')} />
            <div className="mt-0.5 text-[10px] text-white/35">{todayTrades} trade{todayTrades !== 1 ? 's' : ''}</div>
          </Metric>
          <Sep />

          <Metric label="Trades" minWidth="min-w-[80px]">
            <span className="font-mono text-xl font-bold text-white/60">{totalTrades}</span>
          </Metric>
          <Sep />

          <Metric label="Streak" minWidth="min-w-[110px]">
            {currentStreak > 0 && currentStreakType ? (
              <>
                <span className={cn('font-mono text-xl font-bold', currentStreakType === 'win' ? 'text-emerald-400' : 'text-rose-400')}>
                  {currentStreak}{currentStreakType === 'win' ? 'W' : 'L'}
                </span>
                <div className="mt-0.5 text-[10px] text-white/35">
                  {currentStreakType === 'win' ? 'on fire' : 'step back?'}
                  {bestWinStreak > 0 && <span className="ml-1.5 text-white/20">best {bestWinStreak}W / {bestLossStreak}L</span>}
                </div>
              </>
            ) : (
              <span className="font-mono text-xl font-bold text-white/20">—</span>
            )}
          </Metric>
          <Sep />

          <Metric label="Recent" minWidth="min-w-[100px]">
            <StreakDots trades={trades} count={7} />
          </Metric>

        </div>
      </div>
    </div>
  );
}
