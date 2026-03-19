import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import TradingCalendar from '@/components/dashboard/TradingCalendar';
import ImproveSection from '@/components/dashboard/ImproveSection';
import PerformanceBreakdown from '@/components/dashboard/PerformanceBreakdown';
import { useTradeEvents } from '@/components/journal/hooks/useTradeEvents';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

export default function Dashboard() {
  // Set up cross-tab sync for dashboard
  useTradeEvents();

  // Get account settings
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['dashboard-trades'],
    queryFn: () => {
      // Load trades from localStorage (same as Journal)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = window.localStorage.getItem('trades');
          const trades = stored ? JSON.parse(stored) : [];
          
          // Sort trades by date for calendar
          return trades.sort((a, b) => 
            new Date(b.entry_time || b.created_date) - new Date(a.entry_time || a.created_date)
          );
        }
      } catch (e) {
        console.error('Failed to load trades from localStorage:', e);
        return [];
      }
    },
    staleTime: 0, // Always check for fresh data
    refetchOnWindowFocus: true, // Refresh when window gains focus
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate current balance and metrics
  const balanceMetrics = React.useMemo(() => {
    const initialBalance = settings?.[0]?.account_size || 50000;
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const currentBalance = initialBalance + totalPnL;
    const balanceChange = totalPnL;
    const balanceChangePercent = initialBalance > 0 ? (balanceChange / initialBalance) * 100 : 0;
    
    return {
      initialBalance,
      currentBalance,
      totalPnL,
      balanceChange,
      balanceChangePercent
    };
  }, [settings, trades]);

  return (
    <div className="space-y-6">
      {/* Compact header with balance boxes */}
      <div className="flex justify-end gap-2 mb-2">
        <div className="flex items-center gap-4">
          {/* Compact Balance Boxes */}
          <div className="flex gap-4">
            <div className="glass-card rounded-lg px-4 py-3">
              <p className="text-2xl font-bold text-white">
                ${balanceMetrics.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="glass-card rounded-lg px-4 py-3">
              <p className={`text-2xl font-bold ${balanceMetrics.balanceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {balanceMetrics.balanceChange >= 0 ? '+' : ''}${balanceMetrics.balanceChange.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(), 'EEE, MMM d')}</span>
          </div>
        </div>
      </div>

      {/* Trading Calendar and Improve Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TradingCalendar trades={trades} />
        </div>
        <ImproveSection trades={trades} />
      </div>

      {/* Performance Breakdown (Full Width) */}
      <PerformanceBreakdown trades={trades} />
    </div>
  );
}