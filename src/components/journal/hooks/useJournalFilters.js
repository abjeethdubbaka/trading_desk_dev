import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function useJournalFilters(trades = []) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Search filter
      const matchesSearch = 
        trade.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.setup_type?.toLowerCase().includes(searchTerm.toLowerCase());

      // P&L/Direction filter
      let matchesFilter = true;
      if (filter === 'winners') matchesFilter = (trade.pnl || 0) > 0;
      if (filter === 'losers') matchesFilter = (trade.pnl || 0) < 0;
      if (filter === 'long') matchesFilter = trade.direction === 'long';
      if (filter === 'short') matchesFilter = trade.direction === 'short';

      // Date range filter
      let matchesDate = true;
      if (dateRange !== 'all') {
        // Convert UTC entry_time to local date for comparison
        const tradeDate = new Date(trade.entry_time || trade.created_date);
        const now = new Date();
        
        // Get start and end of local day in UTC milliseconds
        const getLocalDayRange = (date) => {
          const localStart = new Date(date);
          localStart.setHours(0, 0, 0, 0);
          const localEnd = new Date(date);
          localEnd.setHours(23, 59, 59, 999);
          return { start: localStart.getTime(), end: localEnd.getTime() };
        };
        
        if (dateRange === 'today') {
          const { start, end } = getLocalDayRange(now);
          const tradeTime = tradeDate.getTime();
          matchesDate = tradeTime >= start && tradeTime <= end;
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const { start } = getLocalDayRange(weekAgo);
          matchesDate = tradeDate.getTime() >= start;
        } else if (dateRange === 'month') {
          matchesDate = tradeDate >= startOfMonth(now) && tradeDate <= endOfMonth(now);
        } else if (dateRange === 'lastMonth') {
          const lastMonth = subMonths(now, 1);
          matchesDate = tradeDate >= startOfMonth(lastMonth) && tradeDate <= endOfMonth(lastMonth);
        }
      }

      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [trades, searchTerm, filter, dateRange]);

  return {
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    dateRange,
    setDateRange,
    filteredTrades
  };
}
