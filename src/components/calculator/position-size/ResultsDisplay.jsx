import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Target } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ResultsDisplay({ 
  shares, 
  positionCost, 
  riskAmount, 
  rrRatio, 
  targets, 
  overallProfit, 
  maxProfit, 
  maxProfitExitPrice 
}) {
  // Debug logging - Force immediate render tracking
  const renderId = Math.random().toString(36).substr(2, 9);
  console.log(`🔍 ResultsDisplay RENDER #${renderId} - Component Rendered with props:`, {
    renderId,
    shares,
    positionCost,
    riskAmount,
    rrRatio,
    targets,
    overallProfit,
    maxProfit,
    maxProfitExitPrice,
    hasMaxProfit: !!maxProfit,
    hasMaxProfitExitPrice: !!maxProfitExitPrice,
    timestamp: new Date().toISOString()
  });

  // Force a re-render check every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(`🔍 ResultsDisplay CHECK #${renderId} - Still mounted, props check:`, {
        currentMaxProfit: maxProfit,
        currentMaxProfitExitPrice: maxProfitExitPrice,
        timestamp: new Date().toISOString()
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [maxProfit, maxProfitExitPrice]);

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-xl p-5 border border-emerald-500/20">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Position Size</p>
          <p className="text-2xl font-bold text-white">{shares}</p>
          <p className="text-xs text-white/40">shares</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-white">${positionCost.toFixed(0)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Risk Amount</p>
          <p className="text-2xl font-bold text-red-400">${riskAmount.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40 mb-1">Reward ({rrRatio}R)</p>
          <p className="text-2xl font-bold text-emerald-400">${(riskAmount * rrRatio).toFixed(2)}</p>
        </div>
      </div>

      {/* Exit Strategy */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-emerald-400">Exit Strategy</h4>
        </div>
        <div className="space-y-2">
          {targets.map((target, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "border-0",
                  target.isTrailingStop ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"
                )}>
                  {target.r}R {target.isTrailingStop ? '(Trailing Stop)' : ''}
                </Badge>
                <span className="text-sm text-white/70">
                  Sell {target.shares} shares @ ${target.price.toFixed(2)}
                </span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                +${target.profit.toFixed(2)}
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
              +${overallProfit.toFixed(2)}
            </span>
          </div>

          {/* Max $ Target */}
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-3 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-0">
                Max $ Target
              </Badge>
              <span className="text-sm font-semibold text-white/80">
                {maxProfit ? `Exit @ $${maxProfitExitPrice.toFixed(2)} to reach $${maxProfit.toFixed(2)}` : 'Enter values to calculate Max $ target'}
              </span>
            </div>
            <span className="text-lg font-bold text-amber-300">
              {maxProfit ? `$${maxProfit.toFixed(2)}` : '$0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
