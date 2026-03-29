import React from 'react';
import { cn } from '@/lib/utils/general';
import { formatCurrency } from '../../utils/formatters';
import { ChevronUp, ChevronDown } from 'lucide-react';
import ProgressBar from './ProgressBar';

const SetupItem = ({ setup, data = {}, maxPnL = 0, isExpanded = false, onToggle }) => {
  const barWidth = maxPnL > 0 ? (Math.abs(data.totalPnL || 0) / maxPnL) * 100 : 0;
  
  // Ensure all required properties have default values
  const safeData = {
    totalPnL: data.totalPnL || 0,
    tradeCount: data.tradeCount || 0,
    winRate: data.winRate || 0,
    avgR: data.avgR || 0
  };
  
  return (
    <div className="space-y-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex justify-between items-center">
        <button
          onClick={onToggle}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <h4 className="font-medium text-white text-sm truncate flex-1">{setup}</h4>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-white/50" />
          ) : (
            <ChevronDown className="w-3 h-3 text-white/50" />
          )}
        </button>
        <div className={cn(
          "text-sm font-medium ml-2",
          safeData.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
        )}>
          {formatCurrency(safeData.totalPnL)}
        </div>
      </div>
      
      <ProgressBar 
        value={safeData.totalPnL}
        max={maxPnL}
        color={safeData.totalPnL >= 0 ? 'emerald' : 'red'}
        showValue={false}
      />
      
      {isExpanded && (
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10">
          <div className="text-center">
            <div className="text-xs text-white/50">Trades</div>
            <div className="text-sm font-medium text-white">{safeData.tradeCount}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/50">Win Rate</div>
            <div className="text-sm font-medium text-emerald-400">
              {safeData.winRate.toFixed(0)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/50">Avg R</div>
            <div className="text-sm font-medium text-blue-400">
              {safeData.avgR.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupItem;


