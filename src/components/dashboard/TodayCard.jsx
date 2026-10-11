import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { createPageUrl } from '@/utils';
import AnimatedStat from '@/components/ui/AnimatedStat';
import { getTradePnL, getTradeDate } from '@/lib/utils/tradeFields';

const money = (n) => `${n >= 0 ? '+' : '-'}$${Math.abs(Math.round(n)).toLocaleString()}`;

function RecentDots({ trades, count = 7 }) {
  const last = useMemo(() =>
    [...trades]
      .sort((a, b) => (getTradeDate(b) ?? 0) - (getTradeDate(a) ?? 0))
      .slice(0, count)
      .reverse(),
  [trades, count]);

  if (!last.length) return null;

  return (
    <div className="flex items-center gap-1" title="Last trades, oldest to newest">
      {last.map((t, i) => (
        <span
          key={t.id ?? i}
          className={cn('h-2 w-2 flex-shrink-0 rounded-full', getTradePnL(t) > 0 ? 'bg-emerald-400' : 'bg-rose-400')}
          style={{ opacity: 0.4 + (i / count) * 0.6 }}
        />
      ))}
    </div>
  );
}

/** A small labelled figure in the card's lower row. */
function Gauge({ label, value, tone = 'text-white/80', hint }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">{label}</p>
      <p className={cn('mt-1 font-mono text-sm font-semibold tabular-nums', tone)}>{value}</p>
      {hint && <p className="mt-0.5 truncate text-[10px] text-white/30">{hint}</p>}
    </div>
  );
}

/**
 * Everything about today in one place: the P&L against the day's target,
 * how much of the day's allowance of trades and loss is spent, the week so
 * far, and whether today's Report Card is written.
 */
export default function TodayCard({
  todayPnL: loggedPnL = 0,
  todayTrades: loggedTrades = 0,
  // Trade Terminal's own figures while Trading Guardian reads them:
  // { dailyPnl, unrealizedPnl, positions, trades }. They win over the
  // journal, which only knows what has been logged.
  live = null,
  target = null, // { amount, purpose, dayLabel } | null on weekends or with no target
  maxDailyTrades = 0,
  maxDailyLoss = 0, // positive dollars
  weekPnL = 0,
  weeklyTarget = 0,
  trades = [],
  currentStreak = 0,
  currentStreakType = null,
  reviewedToday = false,
}) {
  const isLive = Boolean(live && Number.isFinite(live.dailyPnl));
  const todayPnL = isLive ? live.dailyPnl : loggedPnL;
  const todayTrades = isLive && Number.isFinite(live.trades) ? live.trades : loggedTrades;
  const unlogged = isLive && Number.isFinite(live.trades) ? Math.max(0, live.trades - loggedTrades) : 0;
  const hasTarget = Boolean(target && target.amount > 0);
  const pct = hasTarget ? Math.min(100, Math.max(0, (todayPnL / target.amount) * 100)) : 0;
  const isHit = hasTarget && todayPnL >= target.amount;
  const lossHit = maxDailyLoss > 0 && todayPnL <= -maxDailyLoss;
  const lossUsedPct = maxDailyLoss > 0 && todayPnL < 0 ? Math.min(100, (-todayPnL / maxDailyLoss) * 100) : 0;
  const tradesMaxed = maxDailyTrades > 0 && todayTrades >= maxDailyTrades;
  const weekPct = weeklyTarget > 0 ? Math.max(0, Math.round((weekPnL / weeklyTarget) * 100)) : null;

  const barColor = lossHit ? 'bg-rose-500' : isHit ? 'bg-emerald-500' : todayPnL < 0 ? 'bg-rose-500/60' : 'bg-violet-500';

  return (
    <div className={cn(
      'rounded-2xl border p-5',
      lossHit
        ? 'border-rose-500/30 bg-gradient-to-r from-rose-500/[0.08] to-transparent'
        : isHit
          ? 'border-emerald-400/25 bg-gradient-to-r from-emerald-500/[0.07] to-transparent'
          : 'border-white/10 bg-gradient-to-r from-violet-500/[0.06] to-transparent',
    )}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
            Today{target?.dayLabel ? ` · ${target.dayLabel}` : ''}
            {isLive && (
              <span className="ml-1.5 inline-flex items-center gap-1 normal-case tracking-normal text-emerald-300/80" title="Read live from Trade Terminal by Trading Guardian">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                live from Trade Terminal
              </span>
            )}
            {hasTarget && target.purpose ? <span className="normal-case tracking-normal text-white/30"> · {target.purpose}</span> : null}
          </p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <AnimatedStat
              value={todayPnL}
              format={money}
              colorize={false}
              className={cn('font-mono text-4xl font-bold tracking-tight', todayPnL > 0 ? 'text-emerald-400' : todayPnL < 0 ? 'text-rose-400' : 'text-white/70')}
            />
            {hasTarget && (
              <span className="text-sm text-white/35">
                of ${target.amount.toLocaleString()} target
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {isLive && live.positions > 0 && Number.isFinite(live.unrealizedPnl) && (
            <span className={cn('rounded-lg border px-2 py-1 font-mono text-xs font-semibold', live.unrealizedPnl >= 0 ? 'border-emerald-500/25 text-emerald-300' : 'border-rose-500/30 text-rose-300')}>
              Open {money(live.unrealizedPnl)}
            </span>
          )}
          <RecentDots trades={trades} />
          {currentStreak > 1 && currentStreakType && (
            <span className={cn('text-[11px] font-medium', currentStreakType === 'win' ? 'text-emerald-300/80' : 'text-rose-300/80')}>
              {currentStreak} {currentStreakType === 'win' ? 'wins' : 'losses'} in a row
            </span>
          )}
        </div>
      </div>

      {hasTarget && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-right text-[10px] text-white/30">
            {isHit ? 'Target reached' : `$${Math.max(0, Math.round(target.amount - todayPnL)).toLocaleString()} to go · ${Math.round(pct)}%`}
          </p>
        </div>
      )}

      {lossHit && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          Max daily loss hit. Stop trading for today.
        </div>
      )}

      {unlogged > 0 && (
        <Link
          to={createPageUrl('Journal')}
          className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 transition-colors hover:bg-amber-500/15"
        >
          <ClipboardList className="h-3.5 w-3.5 flex-shrink-0" />
          {unlogged} trade{unlogged === 1 ? '' : 's'} on Trade Terminal not logged in the journal yet
        </Link>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
        <Gauge
          label="Trades"
          value={maxDailyTrades > 0 ? `${todayTrades} / ${maxDailyTrades}` : todayTrades}
          tone={tradesMaxed ? 'text-amber-300' : 'text-white/80'}
          hint={tradesMaxed ? 'Daily limit reached' : null}
        />
        <Gauge
          label="Loss limit used"
          value={maxDailyLoss > 0 ? `${Math.round(lossUsedPct)}%` : '—'}
          tone={lossUsedPct >= 75 ? 'text-rose-300' : lossUsedPct >= 40 ? 'text-amber-300' : 'text-white/80'}
          hint={maxDailyLoss > 0 ? `of $${Math.round(maxDailyLoss).toLocaleString()}` : null}
        />
        <Gauge
          label="This week"
          value={money(weekPnL)}
          tone={weekPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'}
          hint={weekPct !== null ? `${weekPct}% of $${Math.round(weeklyTarget).toLocaleString()} goal` : null}
        />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Report card</p>
          {reviewedToday ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Written
            </p>
          ) : (
            <Link
              to={createPageUrl('DailyTradeReview')}
              className={cn(
                'mt-1 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors',
                todayTrades > 0 ? 'text-amber-300 hover:text-amber-200' : 'text-white/45 hover:text-white/70',
              )}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {todayTrades > 0 ? 'Write it' : 'Not yet'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
