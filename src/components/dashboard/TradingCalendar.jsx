import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTradePnL, getTradeDate } from '@/lib/utils/tradeFields';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
// getDay() returns 0=Sun … 6=Sat; index 0 and 6 are weekends
const WEEKEND = new Set([0, 6]);

export default function TradingCalendar({ trades, onDaySelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const tradesByDay = useMemo(() => {
    const map = new Map();
    for (const trade of trades ?? []) {
      const d = getTradeDate(trade);
      if (!d) continue;
      const key = format(d, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(trade);
    }
    return map;
  }, [trades]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Number of blank cells before day 1 so it lands in the right column
  const startOffset = getDay(startOfMonth(currentMonth)); // 0=Sun … 6=Sat

  const getDayMetrics = (day) => {
    const dayTrades = tradesByDay.get(format(day, 'yyyy-MM-dd'));
    if (!dayTrades?.length) return null;
    let totalPnL = 0, wins = 0, losses = 0;
    for (const t of dayTrades) {
      const p = getTradePnL(t);
      totalPnL += p;
      if (p > 0) wins++;
      else if (p < 0) losses++;
    }
    return { totalPnL, wins, losses, trades: dayTrades.length };
  };

  const getDayColor = (metrics, isWeekend) => {
    if (isWeekend) return 'bg-white/[0.02] cursor-default';
    if (!metrics) return 'bg-white/5 hover:bg-white/10';
    if (metrics.totalPnL > 0) {
      if (metrics.totalPnL > 1000) return 'bg-emerald-500/30 hover:bg-emerald-500/40';
      if (metrics.totalPnL > 500)  return 'bg-emerald-500/20 hover:bg-emerald-500/30';
      return 'bg-emerald-500/10 hover:bg-emerald-500/20';
    }
    if (metrics.totalPnL < 0) {
      if (metrics.totalPnL < -1000) return 'bg-red-500/30 hover:bg-red-500/40';
      if (metrics.totalPnL < -500)  return 'bg-red-500/20 hover:bg-red-500/30';
      return 'bg-red-500/10 hover:bg-red-500/20';
    }
    return 'bg-white/5 hover:bg-white/10';
  };

  return (
    <div className="glass-card rounded-2xl p-2 gradient-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold">Trading Calendar</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-medium min-w-[54px] text-center">
            {format(currentMonth, 'MMM yy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Day-of-week headers */}
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={i}
            className={`text-center text-[9px] font-medium py-0.5 ${
              WEEKEND.has(i) ? 'text-white/25' : 'text-white/50'
            }`}
          >
            {label}
          </div>
        ))}

        {/* Leading blank cells so day 1 lands on the correct weekday column */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {/* Month days */}
        {monthDays.map((day, index) => {
          const isWeekend = WEEKEND.has(getDay(day));
          const metrics = isWeekend ? null : getDayMetrics(day);
          const todayRing = isToday(day);
          const pnlPositive = metrics && metrics.totalPnL >= 0;
          const label = metrics
            ? `${format(day, 'MMM d')} · ${metrics.trades} trade${metrics.trades !== 1 ? 's' : ''} · ${metrics.totalPnL >= 0 ? '+' : ''}$${metrics.totalPnL.toFixed(0)}`
            : format(day, 'MMM d, yyyy');

          return (
            <button
              key={index}
              type="button"
              title={label}
              disabled={isWeekend}
              onClick={() => !isWeekend && onDaySelect?.(day, metrics)}
              className={[
                'rounded py-px px-0 transition-all flex flex-col items-center justify-start gap-px',
                'aspect-[2/1]',
                getDayColor(metrics, isWeekend),
                isWeekend ? 'opacity-30' : '',
                todayRing ? 'ring-1 ring-cyan-400' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className={`text-[7px] leading-none font-medium ${isWeekend ? 'text-white/30' : 'text-white/60'}`}>
                {format(day, 'd')}
              </span>

              {metrics && (
                <>
                  <span className={`text-[7px] font-bold leading-none ${pnlPositive ? 'text-emerald-300' : 'text-red-300'}`}>
                    {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(0)}
                  </span>
                  <div className="flex items-center gap-px leading-none">
                    {metrics.wins > 0 && (
                      <span className="text-[6px] text-emerald-400 font-medium">{metrics.wins}W</span>
                    )}
                    {metrics.losses > 0 && (
                      <span className="text-[6px] text-red-400 font-medium">{metrics.losses}L</span>
                    )}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-3 text-[10px] text-white/50">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-emerald-500/30" />Profit</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-red-500/30" />Loss</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-white/5" />No trades</span>
      </div>
    </div>
  );
}
