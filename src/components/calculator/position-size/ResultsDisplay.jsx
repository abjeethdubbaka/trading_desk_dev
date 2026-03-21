import React, { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Target } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ResultsDisplay({ 
  entryPrice,
  stopLossPrice,
  targetPrice,
  targetProfit,
  shares,
  positionValue,
  actualRisk,
  riskRewardRatio,
  direction,
  shareFloat,
  floatCategory,
  calculatedAt,
  mode
}) {


  // Generate exit targets
  const targets = shares && stopLossPrice ? [
    { r: 1, shares: Math.floor(shares * 0.33), price: entryPrice + (direction === 'long' ? 1 : -1) * Math.abs(entryPrice - stopLossPrice) * 1, profit: Math.floor(shares * 0.33) * Math.abs(entryPrice - stopLossPrice) * 1, isTrailingStop: false },
    { r: 2, shares: Math.floor(shares * 0.33), price: entryPrice + (direction === 'long' ? 1 : -1) * Math.abs(entryPrice - stopLossPrice) * 2, profit: Math.floor(shares * 0.33) * Math.abs(entryPrice - stopLossPrice) * 2, isTrailingStop: false },
    { r: 3, shares: shares - Math.floor(shares * 0.66), price: entryPrice + (direction === 'long' ? 1 : -1) * Math.abs(entryPrice - stopLossPrice) * 3, profit: (shares - Math.floor(shares * 0.66)) * Math.abs(entryPrice - stopLossPrice) * 3, isTrailingStop: true }
  ] : [];

  const overallProfit = targets.reduce((sum, target) => sum + (target.profit || 0), 0);
  const maxProfit = overallProfit;
  const maxProfitExitPrice = targets.length > 0 ? targets[targets.length - 1].price : null;

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-xl p-5 border border-emerald-500/20">
      {/* Calculation Summary */}
      <div className="mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Position Analysis</h3>
            <p className="text-xs text-white/60">
              Entry: <span className="text-emerald-400">${entryPrice != null ? entryPrice.toFixed(2) : 'N/A'}</span> | 
              Stop: <span className="text-red-400">${stopLossPrice != null ? stopLossPrice.toFixed(2) : 'N/A'}</span> | 
              Target: <span className="text-blue-400">${targetPrice != null ? targetPrice.toFixed(2) : 'N/A'}</span> | 
              <span className="text-yellow-400">{direction?.toUpperCase()}</span>
            </p>
          </div>
          {mode && (
            <Badge className="bg-blue-500/20 text-blue-400 border-0">
              {mode.replace('-', ' ')}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Position Size</p>
          <p className="text-2xl font-bold text-white">{shares}</p>
          <p className="text-xs text-white/40">shares</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Entry Price</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${entryPrice != null ? entryPrice.toFixed(2) : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Stop Loss</p>
          <p className="text-2xl font-bold text-red-400">
            ${stopLossPrice != null ? stopLossPrice.toFixed(2) : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-white">
            {positionValue != null ? `$${positionValue.toFixed(0)}` : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Risk Amount</p>
          <p className="text-2xl font-bold text-red-400">
            {actualRisk != null ? `$${actualRisk.toFixed(2)}` : '-'}
          </p>
        </div>
      </div>
      
      {/* Secondary Row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Reward ({riskRewardRatio || '-'}R)</p>
          <p className="text-2xl font-bold text-emerald-400">
            {actualRisk != null && riskRewardRatio != null ? `$${(actualRisk * riskRewardRatio).toFixed(2)}` : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Target Price</p>
          <p className="text-2xl font-bold text-blue-400">
            ${targetPrice != null ? targetPrice.toFixed(2) : '-'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Risk Level</p>
          <p className="text-2xl font-bold text-amber-400">
            {actualRisk && positionValue ? 
              ((actualRisk / positionValue) * 100).toFixed(1) + '%' : 
              '-'
            }
          </p>
        </div>
      </div>

      {/* Exit Strategy */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-emerald-400">Exit Strategy</h4>
        </div>
        <div className="space-y-2">
          {(targets || []).map((target, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "border-0",
                  target.isTrailingStop ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"
                )}>
                  {target.r}R {target.isTrailingStop ? '(Trailing Stop)' : ''}
                </Badge>
                <span className="text-sm text-white/70">
                  Sell {target.shares || 0} shares @ ${target.price != null ? target.price.toFixed(2) : '0.00'}
                </span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                +${target.profit != null ? target.profit.toFixed(2) : '0.00'}
              </span>
            </div>
          ))}
          
          {/* Total Profit (6R) */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg p-3 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-300 border-0">
                Total Profit (6R)
              </Badge>
              <span className="text-sm font-semibold text-white/80">
                All {shares} shares
              </span>
            </div>
            <span className="text-lg font-bold text-emerald-300">
              +${overallProfit != null ? overallProfit.toFixed(2) : '0.00'}
            </span>
          </div>

          {/* Max $ Target */}
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-3 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-0">
                Max $ Target
              </Badge>
              <span className="text-sm font-semibold text-white/80">
                {maxProfit != null && maxProfitExitPrice != null 
                  ? `Exit @ $${maxProfitExitPrice.toFixed(2)} to reach $${maxProfit.toFixed(2)}` 
                  : 'Enter values to calculate Max $ target'}
              </span>
            </div>
            <span className="text-lg font-bold text-amber-300">
              {maxProfit != null ? `$${maxProfit.toFixed(2)}` : '$0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
