import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { calculatePnL } from '../utils/calculationUtils';

const MetricBadge = ({ icon: Icon, label, value, trend }) => {
  const isPositive = parseFloat(value) > 0;
  const isNegative = parseFloat(value) < 0;
  
  return (
    <div className={cn(
      "rounded-lg p-3 transition-all",
      isPositive ? "bg-emerald-500/10 border border-emerald-500/20" : 
      isNegative ? "bg-red-500/10 border border-red-500/20" : 
      "bg-white/5 border border-white/10"
    )}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn(
          "w-4 h-4",
          isPositive && "text-emerald-400",
          isNegative && "text-red-400"
        )} />
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <div className={cn(
        "text-lg font-semibold",
        isPositive && "text-emerald-400",
        isNegative && "text-red-400"
      )}>
        ${Math.abs(parseFloat(value) || 0).toFixed(2)}
      </div>
    </div>
  );
};

const TradeMetrics = ({ entry_price, exit_price, stop_loss, position_size, direction, fee }) => {
  // Calculate values internally
  const { pnl, pnlPercent, rMultiple } = calculatePnL({
    entryPrice: entry_price,
    exitPrice: exit_price,
    stopLoss: stop_loss,
    positionSize: position_size,
    direction: direction,
    fee: fee
  });

  const pnlValue = parseFloat(pnl) || 0;
  const rValue = parseFloat(rMultiple) || 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricBadge
        icon={pnlValue >= 0 ? TrendingUp : TrendingDown}
        label="P&L"
        value={pnlValue.toString()}
      />
      <div className="rounded-lg bg-white/5 border border-white/10 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-white/40">R-Multiple</span>
        </div>
        <div className={cn(
          "text-lg font-semibold",
          rValue >= 1 && "text-emerald-400",
          rValue < 1 && rValue > 0 && "text-amber-400",
          rValue <= 0 && "text-red-400"
        )}>
          {rValue > 0 ? `${rValue}:1` : '-'}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TradeMetrics);


