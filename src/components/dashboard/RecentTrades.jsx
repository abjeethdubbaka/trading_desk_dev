import React from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';

export default function RecentTrades({ trades, userId = 'user-123', limit = 5 }) {
  // Fetch recent trades from database if no trades provided
  const { data: dbTrades, isLoading } = useQuery({
    queryKey: ['recent-trades', userId, limit],
    queryFn: () => base44.entities.Trade.list('-entry_time', limit),
    enabled: !trades && !!userId
  });
  
  const recentTrades = trades || dbTrades || [];
  if (isLoading && !trades) {
    return (
      <div className="glass-card rounded-2xl p-6 gradient-border">
        <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
        <div className="text-center py-8 text-white/40">
          <p>Loading recent trades...</p>
        </div>
      </div>
    );
  }
  
  if (!recentTrades || recentTrades.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 gradient-border">
        <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
        <div className="text-center py-8 text-white/40">
          <p>No trades recorded yet</p>
          <p className="text-sm mt-1">Start logging your trades in the Journal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 gradient-border">
      <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
      <div className="space-y-3">
        {recentTrades.slice(0, limit).map((trade) => (
          <div
            key={trade.id}
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                trade.direction === 'long' ? 'bg-emerald-500/20' : 'bg-red-500/20'
              )}>
                {trade.direction === 'long' ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div>
                <p className="font-semibold">{trade.symbol}</p>
                <p className="text-xs text-white/40">
                  {trade.entry_time 
                    ? format(new Date(trade.entry_time), 'MMM d, h:mm a')
                    : trade.created_date
                      ? format(new Date(trade.created_date), 'MMM d')
                      : 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-bold",
                trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2) || '0.00'}
              </p>
              <p className={cn(
                "text-xs",
                trade.r_multiple >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'
              )}>
                {trade.r_multiple?.toFixed(1) || '0'}R
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


