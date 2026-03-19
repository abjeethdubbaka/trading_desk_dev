import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { format, subDays, startOfDay } from 'date-fns';

export default function PerformanceChart({ data, timeRange = '30d', userId = 'user-123' }) {
  // Fetch performance metrics from database if no data provided
  const { data: dbData, isLoading } = useQuery({
    queryKey: ['performance-chart-data', userId, timeRange],
    queryFn: async () => {
      // Fetch trades to calculate performance data
      const tradesResponse = await base44.database.Trades.findMany({
        where: { user_id: userId },
        orderBy: { entry_time: 'asc' }
      });
      
      if (!tradesResponse.data) return [];
      
      // Filter by time range
      const filteredTrades = tradesResponse.data.filter(trade => {
        if (!trade.entry_time) return false;
        const tradeDate = new Date(trade.entry_time);
        const now = new Date();
        
        switch (timeRange) {
          case '7d':
            return tradeDate >= subDays(now, 7);
          case '30d':
            return tradeDate >= subDays(now, 30);
          case '90d':
            return tradeDate >= subDays(now, 90);
          default:
            return true;
        }
      });
      
      // Calculate cumulative P&L
      let cumulativePnl = 0;
      const chartData = [];
      
      filteredTrades.forEach((trade, index) => {
        cumulativePnl += trade.pnl || 0;
        chartData.push({
          date: format(new Date(trade.entry_time), 'MMM d'),
          pnl: parseFloat(cumulativePnl.toFixed(2)),
          tradeNumber: index + 1
        });
      });
      
      return chartData;
    },
    enabled: !data && !!userId
  });
  
  const chartData = data || dbData || [];
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a24] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-white/50 text-xs mb-1">{label}</p>
          <p className={`text-lg font-bold ${payload[0].value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${payload[0].value?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full min-h-[300px] min-w-[200px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPnlNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke={chartData.some(d => d.pnl < 0) ? "#ef4444" : "#22c55e"}
            strokeWidth={2}
            fillOpacity={1}
            fill={chartData.some(d => d.pnl < 0) ? "url(#colorPnlNegative)" : "url(#colorPnl)"}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}