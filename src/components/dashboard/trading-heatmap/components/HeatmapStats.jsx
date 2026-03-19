import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, className }) => (
  <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
    <Icon className={`w-5 h-5 ${className}`} />
    <div>
      <div className="text-xs text-white/40">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  </div>
);

const HeatmapStats = ({ statistics }) => {
  if (!statistics || statistics.totalTrades === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      <StatCard
        icon={BarChart3}
        label="Total Trades"
        value={statistics.totalTrades}
        className="text-blue-400"
      />
      <StatCard
        icon={TrendingUp}
        label="Total P&L"
        value={`$${statistics.totalPnL.toFixed(2)}`}
        className={statistics.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}
      />
      {statistics.bestHour && (
        <StatCard
          icon={TrendingUp}
          label="Best Hour"
          value={`$${statistics.bestHour.pnl.toFixed(0)}`}
          className="text-emerald-400"
        />
      )}
      {statistics.worstHour && (
        <StatCard
          icon={TrendingDown}
          label="Worst Hour"
          value={`$${statistics.worstHour.pnl.toFixed(0)}`}
          className="text-red-400"
        />
      )}
    </div>
  );
};

export default React.memo(HeatmapStats);