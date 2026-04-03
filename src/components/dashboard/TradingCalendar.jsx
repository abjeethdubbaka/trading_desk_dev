import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function TradingCalendar({ trades }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Memoize trades processing for performance
  const processedTrades = useMemo(() => {
    return trades.map(trade => ({
      ...trade,
      tradeDate: trade.entry_time ? parseISO(trade.entry_time) : 
                trade.created_date ? parseISO(trade.created_date) : 
                new Date(),
      pnl: trade.pnl || 0
    }));
  }, [trades]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get trades for each day
  const getTradesForDay = (day) => {
    return processedTrades.filter(trade => 
      isSameDay(trade.tradeDate, day)
    );
  };

  // Calculate day metrics
  const getDayMetrics = (day) => {
    const dayTrades = getTradesForDay(day);
    if (dayTrades.length === 0) return null;
    
    const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const wins = dayTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const losses = dayTrades.filter(trade => (trade.pnl || 0) < 0).length;
    
    return {
      totalPnL,
      wins,
      losses,
      trades: dayTrades.length
    };
  };

  // Get color for day based on performance
  const getDayColor = (metrics) => {
    if (!metrics) return 'bg-white/5 hover:bg-white/10';
    
    if (metrics.totalPnL > 0) {
      if (metrics.totalPnL > 1000) return 'bg-emerald-500/30 hover:bg-emerald-500/40';
      if (metrics.totalPnL > 500) return 'bg-emerald-500/20 hover:bg-emerald-500/30';
      return 'bg-emerald-500/10 hover:bg-emerald-500/20';
    } else if (metrics.totalPnL < 0) {
      if (metrics.totalPnL < -1000) return 'bg-red-500/30 hover:bg-red-500/40';
      if (metrics.totalPnL < -500) return 'bg-red-500/20 hover:bg-red-500/30';
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
          
          return (
            <div
              key={index}
              className={`
                aspect-[2/1] rounded p-0.5 cursor-pointer transition-all
                ${getDayColor(metrics)}
                ${!isCurrentMonth ? 'opacity-30' : ''}
                relative flex flex-col justify-between
              `}
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
            </div>
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


