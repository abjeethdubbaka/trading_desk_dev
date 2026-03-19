import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResultsDisplay({ calculation }) {
  if (!calculation) return null;
  const { shares=0, positionValue=0, actualRisk=0, riskRewardRatio=3,
    entryPrice=0, stopLossPrice=0, targetProfit=0, maxDollars=0, direction='long' } = calculation;

  const rps    = Math.abs(entryPrice - stopLossPrice);
  const t1sh   = Math.floor(shares*0.33);
  const t2sh   = Math.floor(shares*0.33);
  const t3sh   = Math.max(0, shares - t1sh - t2sh);
  const sign   = direction==='long' ? 1 : -1;

  const targets = [
    { r:1, sh:t1sh, price:entryPrice+sign*rps,   profit:t1sh*rps },
    { r:2, sh:t2sh, price:entryPrice+sign*rps*2, profit:t2sh*rps*2 },
    { r:3, sh:t3sh, price:entryPrice+sign*rps*3, profit:t3sh*rps*3, trail:true },
  ].filter(t=>t.sh>0&&t.profit>0);

  const total = actualRisk * riskRewardRatio;

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-xl p-5 border border-emerald-500/20">
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[['Position size',`${shares.toLocaleString()}`,'shares','text-white'],
          ['Total cost',`$${Math.round(positionValue).toLocaleString()}`,'','text-white'],
          ['Risk amount',`$${actualRisk.toFixed(0)}`,'','text-red-400'],
          ['Reward',`$${total.toFixed(0)}`,`${riskRewardRatio}R`,'text-emerald-400'],
        ].map(([lbl,val,sub,col])=>(
          <div key={lbl} className="text-center">
            <p className="text-xs text-white/40 mb-1">{lbl}</p>
            <p className={cn('text-2xl font-bold',col)}>{val}</p>
            {sub&&<p className="text-xs text-white/40">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-emerald-400">Exit strategy</h4>
        </div>
        <div className="space-y-2">
          {targets.map((t,i)=>(
            <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Badge className={cn('border-0',t.trail?'bg-purple-500/20 text-purple-400':'bg-emerald-500/20 text-emerald-400')}>{t.r}R{t.trail?' (Trail)':''}</Badge>
                <span className="text-sm text-white/70">Sell {t.sh} @ ${t.price.toFixed(2)}</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">+${t.profit.toFixed(0)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg p-3 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-300 border-0">Total ({riskRewardRatio}R)</Badge>
              <span className="text-sm text-white/80">All {shares.toLocaleString()} shares</span>
            </div>
            <span className="text-lg font-bold text-emerald-300">+${total.toFixed(0)}</span>
          </div>
          {maxDollars>0&&(
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-3 border border-amber-500/20">
              <Badge className="bg-amber-500/20 text-amber-300 border-0">Max $ target</Badge>
              <span className="text-lg font-bold text-amber-300">${targetProfit.toFixed(0)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
