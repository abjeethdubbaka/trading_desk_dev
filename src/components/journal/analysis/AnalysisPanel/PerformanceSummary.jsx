import React from 'react';
import { cn } from '@/lib/utils/general';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import MetricCard from './MetricCard';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Activity,
  Award,
  ChevronRight 
} from 'lucide-react';

const PerformanceSummary = ({ 
  overallPerformance, 
  additionalMetrics, 
  isExpanded, 
  onToggle 
}) => {
  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 hover:text-white/80 transition-colors"
      >
        <Award className="w-4 h-4 text-purple-400" />
        Performance Summary
        <ChevronRight 
          className={`w-3 h-3 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`} 
        />
      </button>
      
      {isExpanded && (
        <div className="grid grid-cols-2 gap-2">
          <MetricCard 
            label="Total P&L"
            value={formatCurrency(overallPerformance.totalPnL)}
            icon={overallPerformance.totalPnL >= 0 ? TrendingUp : TrendingDown}
            color={overallPerformance.totalPnL >= 0 ? 'emerald' : 'red'}
          />
          <MetricCard 
            label="Win Rate"
            value={`${overallPerformance.winRate.toFixed(1)}%`}
            icon={Target}
            color="purple"
          />
          <MetricCard 
            label="Total Trades"
            value={formatNumber(overallPerformance.totalTrades)}
            icon={BarChart3}
            color="blue"
          />
          <MetricCard 
            label="Avg/Trade"
            value={formatCurrency(overallPerformance.avgPerTrade)}
            icon={Activity}
            color={overallPerformance.avgPerTrade >= 0 ? 'emerald' : 'red'}
          />

          {/* Additional Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 col-span-2">
            <div className="text-center">
              <div className="text-xs text-white/50">Profit Factor</div>
              <div className={cn(
                "text-sm font-bold",
                additionalMetrics.profitFactor >= 1.5 ? "text-emerald-400" : 
                additionalMetrics.profitFactor >= 1 ? "text-yellow-400" : "text-red-400"
              )}>
                {additionalMetrics.profitFactor === Infinity ? '∞' : additionalMetrics.profitFactor.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/50">Expectancy</div>
              <div className={cn(
                "text-sm font-bold",
                additionalMetrics.expectancy >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {formatCurrency(additionalMetrics.expectancy)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/50">Max Consec</div>
              <div className="text-sm font-bold text-white">
                {additionalMetrics.consecutiveWins}W / {additionalMetrics.consecutiveLosses}L
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceSummary;


