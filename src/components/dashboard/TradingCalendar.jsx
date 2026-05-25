import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { getTradePnL, getTradeDate } from '@/lib/utils/tradeFields';

export default function TradingCalendar({ trades, onDaySelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group all trades by YYYY-MM-DD once — O(n) instead of O(days × n)
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

  const getDayColor = (metrics) => {
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

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="glass-card rounded-2xl p-2 gradient-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold">Trading Calendar</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-2 h-2" />
          </button>
          <span className="text-[10px] font-medium min-w-[70px] text-center">
            {format(currentMonth, 'MMM yy')}
          </span>
          <button
            onClick={nextMonth}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-2 h-2" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Weekday headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className="text-center text-[9px] text-white/50 font-medium p-0.5">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {monthDays.map((day, index) => {
          const metrics = getDayMetrics(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const todayRing = isToday(day);
          const label = metrics
            ? `${format(day, 'MMM d, yyyy')} / ${metrics.trades} trade${metrics.trades !== 1 ? 's' : ''} / Net $${metrics.totalPnL.toFixed(0)}`
            : format(day, 'MMM d, yyyy');

          return (
            <button
              key={index}
              type="button"
              title={label}
              onClick={() => onDaySelect?.(day, metrics)}
              className={[
                'aspect-[2/1] rounded p-0.5 transition-all text-left',
                getDayColor(metrics),
                !isCurrentMonth ? 'opacity-30' : '',
                todayRing ? 'ring-1 ring-cyan-400' : '',
                'relative flex flex-col justify-between',
              ].join(' ')}
            >
              <div className="text-[9px] text-white/80 text-center leading-tight">
                {format(day, 'd')}
              </div>

              {metrics && (
                <div className="flex flex-col items-center">
                  <div className="text-[9px] font-bold text-white leading-tight">
                    ${metrics.totalPnL.toFixed(0)}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {metrics.wins > 0 && (
                      <div className="flex items-center gap-0.5">
                        <TrendingUp className="w-1 h-1 text-emerald-400" />
                        <span className="text-[9px] text-emerald-400">{metrics.wins}</span>
                      </div>
                    )}
                    {metrics.losses > 0 && (
                      <div className="flex items-center gap-0.5">
                        <TrendingDown className="w-1 h-1 text-red-400" />
                        <span className="text-[9px] text-red-400">{metrics.losses}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[8px] text-white/60">
                    {metrics.trades}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500/30"></div>
            <span className="text-white/60">Profit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/30"></div>
            <span className="text-white/60">Loss</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-white/5"></div>
            <span className="text-white/60">No trades</span>
          </div>
        </div>
      </div>
    </div>
  );
}
