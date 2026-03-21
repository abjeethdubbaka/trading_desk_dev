import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { computeCoreStats } from '@/lib/performanceMetrics';
import { cn } from '@/lib/utils';

export default function EdgePanel({ symbol, setupType }) {
  const { data: trades=[] } = useQuery({
    queryKey: ['journal-trades'],
    queryFn: () => { try { return JSON.parse(localStorage.getItem('trades')||'[]'); } catch { return []; } },
    staleTime: 0,
  });

  const symTrades   = useMemo(()=>trades.filter(t=>t.symbol?.toUpperCase()===symbol?.toUpperCase()),[trades,symbol]);
  const setupTrades = useMemo(()=>trades.filter(t=>setupType&&t.setup_type?.toLowerCase()===setupType?.toLowerCase()),[trades,setupType]);
  const symStats    = useMemo(()=>computeCoreStats(symTrades),[symTrades]);
  const setupStats  = useMemo(()=>computeCoreStats(setupTrades),[setupTrades]);

  if (!symbol||!symTrades.length) return null;

  const insight = symStats.winRate>=60
    ? `Strong edge — ${symStats.wins}/${symStats.totalTrades} wins on ${symbol}. Size normally.`
    : symStats.winRate>=40
    ? `Mixed history on ${symbol}. Be selective with your entry.`
    : `Caution — ${symbol} has been tough for you. Consider sizing down.`;

  const insightColor = symStats.winRate>=60
    ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300/80'
    : symStats.winRate>=40
    ? 'bg-amber-500/8 border-amber-500/20 text-amber-300/80'
    : 'bg-red-500/8 border-red-500/20 text-red-300/80';

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-300/80">Your edge on {symbol}</p>
        <span className="text-[10px] text-white/30">{symStats.totalTrades} trades</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          ['Win rate',`${symStats.winRate.toFixed(0)}%`, symStats.winRate>=50?'text-emerald-400':'text-red-400'],
          ['Avg R',   `${symStats.avgR.toFixed(1)}R`,   symStats.avgR>=1?'text-purple-400':'text-amber-400'],
          ['Avg P&L', `${symStats.avgPnL>=0?'+':''}$${Math.abs(symStats.avgPnL).toFixed(0)}`, symStats.avgPnL>=0?'text-emerald-400':'text-red-400'],
          ['Total',   `${symStats.totalPnL>=0?'+':''}$${Math.abs(symStats.totalPnL).toFixed(0)}`, symStats.totalPnL>=0?'text-emerald-400/70':'text-red-400/70'],
        ].map(([l,v,c])=>(
          <div key={l}><p className="text-[9px] text-white/30 uppercase tracking-wider">{l}</p><p className={cn('text-sm font-bold font-mono',c)}>{v}</p></div>
        ))}
      </div>

      {/* Recent bar */}
      {symTrades.slice(0,8).length>0&&(
        <div className="space-y-1">
          <p className="text-[9px] text-white/25 uppercase tracking-wider">Last {Math.min(8,symTrades.length)} trades</p>
          <div className="flex gap-1">
            {symTrades.slice(0,8).map((t,i)=>(
              <div key={i} title={`$${(t.pnl||0).toFixed(0)}`}
                className={cn('flex-1 h-1.5 rounded-full',(t.pnl||0)>=0?'bg-emerald-500/50':'bg-red-500/50')} />
            ))}
          </div>
        </div>
      )}

      <div className={cn('rounded-lg px-3 py-2 text-xs border', insightColor)}>{insight}</div>

      {setupType&&setupTrades.length>0&&(
        <div className="pt-2 border-t border-white/5">
          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Edge on {setupType}</p>
          <div className="flex gap-4 text-xs">
            <span className="text-white/40">{setupStats.totalTrades} trades</span>
            <span className={setupStats.winRate>=50?'text-emerald-400':'text-red-400'}>{setupStats.winRate.toFixed(0)}% win</span>
            <span className={setupStats.avgR>=1?'text-purple-400':'text-amber-400'}>{setupStats.avgR.toFixed(1)}R avg</span>
          </div>
        </div>
      )}
    </div>
  );
}
