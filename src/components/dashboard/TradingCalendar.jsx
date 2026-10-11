import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { getTradePnL, getTradeDate } from '@/lib/utils/tradeFields';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const money = (n) => `${n >= 0 ? '+' : '-'}$${Math.abs(Math.round(n)).toLocaleString()}`;

/** Cell shading scales with the day's result relative to the month's biggest day. */
function dayTone(pnl, scale) {
  if (!pnl) return 'bg-white/[0.04] hover:bg-white/[0.08]';
  const strength = scale > 0 ? Math.abs(pnl) / scale : 0;
  if (pnl > 0) {
    if (strength > 0.66) return 'bg-emerald-500/30 hover:bg-emerald-500/40';
    if (strength > 0.33) return 'bg-emerald-500/20 hover:bg-emerald-500/30';
    return 'bg-emerald-500/10 hover:bg-emerald-500/20';
  }
  if (strength > 0.66) return 'bg-rose-500/30 hover:bg-rose-500/40';
  if (strength > 0.33) return 'bg-rose-500/20 hover:bg-rose-500/30';
  return 'bg-rose-500/10 hover:bg-rose-500/20';
}

/**
 * The month as trading weeks: Monday to Friday, with the week's total at the
 * end of each row. A tick marks a day whose Daily Report Card is written.
 */
export default function TradingCalendar({ trades, onDaySelect, selectedDay = null, reviewedDates = new Set() }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const tradesByDay = useMemo(() => {
    const map = new Map();
    for (const trade of trades ?? []) {
      const d = getTradeDate(trade);
      if (!d || Number.isNaN(d.getTime())) continue;
      const key = format(d, 'yyyy-MM-dd');
      const day = map.get(key) || { pnl: 0, count: 0, wins: 0, losses: 0 };
      const pnl = getTradePnL(trade);
      day.pnl += pnl;
      day.count += 1;
      if (pnl > 0) day.wins += 1;
      else if (pnl < 0) day.losses += 1;
      map.set(key, day);
    }
    return map;
  }, [trades]);

  const { weeks, monthPnL, monthDays, greenDays, scale } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const rows = [];
    let total = 0;
    let traded = 0;
    let green = 0;
    let biggest = 0;

    for (let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 }); weekStart <= monthEnd; weekStart = addDays(weekStart, 7)) {
      let weekPnL = 0;
      let weekTrades = 0;
      // All seven days count toward the week, so a weekend trade is not lost.
      for (let i = 0; i < 7; i += 1) {
        const day = addDays(weekStart, i);
        if (!isSameMonth(day, currentMonth)) continue;
        const metrics = tradesByDay.get(format(day, 'yyyy-MM-dd'));
        if (!metrics) continue;
        weekPnL += metrics.pnl;
        weekTrades += metrics.count;
        total += metrics.pnl;
        traded += 1;
        if (metrics.pnl > 0) green += 1;
        biggest = Math.max(biggest, Math.abs(metrics.pnl));
      }

      const days = WEEKDAY_LABELS.map((_, i) => {
        const day = addDays(weekStart, i);
        const key = format(day, 'yyyy-MM-dd');
        return { day, key, inMonth: isSameMonth(day, currentMonth), metrics: tradesByDay.get(key) || null };
      });

      // Skip a leading or trailing row whose weekdays all fall in another month.
      if (days.some((d) => d.inMonth)) rows.push({ key: format(weekStart, 'yyyy-MM-dd'), days, weekPnL, weekTrades });
    }

    return { weeks: rows, monthPnL: total, monthDays: traded, greenDays: green, scale: biggest };
  }, [currentMonth, tradesByDay]);

  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  return (
    <div className="rounded-2xl border border-white/10 bg-[#13131e] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <h3 className="text-sm font-semibold text-white/90">{format(currentMonth, 'MMMM yyyy')}</h3>
          {monthDays > 0 && (
            <>
              <span className={cn('font-mono text-sm font-semibold', monthPnL >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                {money(monthPnL)}
              </span>
              <span className="text-[11px] text-white/35">{greenDays}/{monthDays} green days</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date())}
              className="mr-1 rounded-md px-2 py-1 text-[11px] text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-md p-1.5 transition-colors hover:bg-white/10"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4 text-white/60" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-md p-1.5 transition-colors hover:bg-white/10"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4 text-white/60" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,0.9fr)] gap-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-white/35">{label}</div>
        ))}
        <div className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-white/35">Week</div>

        {weeks.map((week) => (
          <React.Fragment key={week.key}>
            {week.days.map(({ day, key, inMonth, metrics }) => {
              if (!inMonth) return <div key={key} className="min-h-[64px] rounded-lg bg-white/[0.01]" />;
              const selected = selectedDay && isSameDay(day, selectedDay);
              const reviewed = reviewedDates.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onDaySelect?.(day, metrics)}
                  title={metrics
                    ? `${format(day, 'EEE, MMM d')} · ${metrics.count} trade${metrics.count === 1 ? '' : 's'} · ${money(metrics.pnl)}${reviewed ? ' · report card written' : ''}`
                    : format(day, 'EEE, MMM d')}
                  className={cn(
                    'relative flex min-h-[64px] flex-col items-start justify-between rounded-lg p-2 text-left transition-colors',
                    dayTone(metrics?.pnl, scale),
                    isToday(day) && 'ring-1 ring-cyan-400/70',
                    selected && 'ring-2 ring-white/60',
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={cn('text-[11px] font-medium', metrics ? 'text-white/75' : 'text-white/35')}>{format(day, 'd')}</span>
                    {metrics && reviewed && <CheckCircle2 className="h-3 w-3 text-emerald-300/70" aria-label="Report card written" />}
                  </div>
                  {metrics && (
                    <div className="w-full min-w-0">
                      <p className={cn('truncate font-mono text-xs font-bold', metrics.pnl >= 0 ? 'text-emerald-200' : 'text-rose-200')}>
                        {money(metrics.pnl)}
                      </p>
                      <p className="truncate text-[10px] text-white/45">
                        {metrics.count} trade{metrics.count === 1 ? '' : 's'}
                        {metrics.count > 0 && <span className="text-white/30"> · {metrics.wins}W {metrics.losses}L</span>}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}

            <div className="flex min-h-[64px] flex-col justify-end rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
              {week.weekTrades > 0 ? (
                <>
                  <p className={cn('truncate font-mono text-xs font-bold', week.weekPnL >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                    {money(week.weekPnL)}
                  </p>
                  <p className="truncate text-[10px] text-white/35">{week.weekTrades} trade{week.weekTrades === 1 ? '' : 's'}</p>
                </>
              ) : (
                <p className="text-[10px] text-white/20">—</p>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
