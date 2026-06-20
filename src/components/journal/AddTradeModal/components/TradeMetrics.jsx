import React from 'react';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ShieldAlert, Target } from 'lucide-react';
import { calculatePnL } from '../utils/calculationUtils';

const TradeMetrics = ({ entry_price, exit_price, stop_loss, position_size, direction, fee }) => {
  const entry = parseFloat(entry_price) || 0;
  const exit  = parseFloat(exit_price)  || 0;
  const stop  = parseFloat(stop_loss)   || 0;
  const size  = parseInt(position_size) || 0;

  const { pnl, rMultiple } = calculatePnL({
    entryPrice: entry_price,
    exitPrice: exit_price,
    stopLoss: stop_loss,
    positionSize: position_size,
    direction,
    fee,
  });

  const pnlValue = parseFloat(pnl) || 0;
  const rValue   = rMultiple != null && rMultiple !== '' ? parseFloat(rMultiple) : null;

  // Risk: entry → stop loss (per share and total)
  const riskPerShare   = entry > 0 && stop > 0 ? Math.abs(entry - stop) : 0;
  const totalRisk      = riskPerShare * size;

  // Reward: entry → exit (per share and total)
  const rewardPerShare = entry > 0 && exit > 0
    ? (direction === 'short' ? entry - exit : exit - entry)
    : 0;
  const totalReward    = rewardPerShare * size;

  const pnlPos = pnlValue >= 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* P&L */}
      <div className={cn(
        'rounded-lg border p-3',
        pnlPos ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-rose-500/20 bg-rose-500/10',
      )}>
        <div className="flex items-center gap-1.5 mb-1">
          {pnlPos
            ? <TrendingUp  className="w-3.5 h-3.5 text-emerald-400" />
            : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
          <span className="text-[10px] text-white/40 uppercase tracking-wider">P&L</span>
        </div>
        <div className={cn('text-lg font-bold font-mono', pnlPos ? 'text-emerald-400' : 'text-rose-400')}>
          {pnlPos ? '+' : '-'}${Math.abs(pnlValue).toFixed(2)}
        </div>
        {rValue !== null && (
          <div className={cn(
            'mt-0.5 text-[11px] font-mono font-semibold',
            rValue >= 1 ? 'text-emerald-300' : rValue > 0 ? 'text-amber-300' : 'text-rose-300',
          )}>
            {rValue >= 0 ? '+' : ''}{rValue.toFixed(2)}R
          </div>
        )}
      </div>

      {/* Risk : Reward */}
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Risk : Reward</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-sm font-semibold">
          {totalRisk > 0 ? (
            <span className="text-rose-400">${totalRisk.toFixed(0)}</span>
          ) : (
            <span className="text-white/25">—</span>
          )}
          <span className="text-white/20">:</span>
          {Math.abs(totalReward) > 0 ? (
            <span className={totalReward >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              ${Math.abs(totalReward).toFixed(0)}
            </span>
          ) : (
            <span className="text-white/25">—</span>
          )}
        </div>

        <div className="mt-1 flex gap-2 text-[10px] text-white/30">
          {riskPerShare > 0 && (
            <span>Stop ${riskPerShare.toFixed(2)}/sh</span>
          )}
          {rewardPerShare !== 0 && (
            <span>Move ${Math.abs(rewardPerShare).toFixed(2)}/sh</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TradeMetrics);
