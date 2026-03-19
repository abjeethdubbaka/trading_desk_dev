import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../../utils/formatters';
import ProgressBar from './ProgressBar';

const TimePeriodItem = ({ period, data = {}, maxPnL = 0, isSelected = false, onClick }) => {
  const barWidth = maxPnL > 0 ? (Math.abs(data.totalPnL || 0) / maxPnL) * 100 : 0;
  const safeData = {
    totalPnL: data.totalPnL || 0,
    tradeCount: data.tradeCount || 0,
    avgPerTrade: data.avgPerTrade || 0
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left space-y-1 p-2 rounded-lg transition-colors",
        isSelected ? "bg-white/10" : "hover:bg-white/5"
      )}
    >
      <div className="flex justify-between items-center">
        <span className="font-medium text-white text-sm">{period}</span>
        <span className={cn(
          "font-medium text-sm",
          safeData.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
        )}>
          {formatCurrency(safeData.totalPnL)}
        </span>
      </div>
      
      <ProgressBar 
        value={safeData.totalPnL}
        max={maxPnL}
        color={safeData.totalPnL >= 0 ? 'emerald' : 'red'}
        showValue={false}
      />
      
      <div className="flex justify-between text-xs text-white/50">
        <span>{safeData.tradeCount} trades</span>
        <span>{formatCurrency(safeData.avgPerTrade)} avg</span>
      </div>
    </button>
  );
};

export default TimePeriodItem;
