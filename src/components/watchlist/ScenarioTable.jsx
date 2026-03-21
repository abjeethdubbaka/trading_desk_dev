import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

function scenario(entry, stop, riskAmount, direction, label, highlight) {
  if (!entry||!stop||entry===stop) return null;
  const rps    = Math.abs(entry-stop);
  const shares = Math.floor(riskAmount/rps);
  const risk   = shares*rps;
  const stopPct= (rps/entry*100).toFixed(1);
  return { label, shares, risk, r2:`$${(risk*2).toFixed(0)}`, r3:`$${(risk*3).toFixed(0)}`, stopPct, highlight };
}

export default function ScenarioTable({ entryPrice, stopLossPrice, riskAmount=1000, direction='long' }) {
  const entry = parseFloat(entryPrice), stop = parseFloat(stopLossPrice);
  const rps   = Math.abs(entry-stop);

  const scenarios = useMemo(()=>{
    if (!entry||!stop||!rps) return [];
    const tight = direction==='long' ? stop+rps*0.35 : stop-rps*0.35;
    const wide  = direction==='long' ? stop-rps*0.35 : stop+rps*0.35;
    return [
      scenario(entry,tight,riskAmount,direction,'Tight stop',false),
      scenario(entry,stop, riskAmount,direction,'Your stop ✓',true),
      scenario(entry,wide, riskAmount,direction,'Wide stop',false),
    ].filter(Boolean);
  },[entry,stop,rps,riskAmount,direction]);

  if (!scenarios.length) return null;

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/6">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Scenario comparison</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/6">
        {scenarios.map(s=>(
          <div key={s.label} className={cn('p-3 space-y-2',s.highlight&&'bg-purple-500/6')}>
            <p className={cn('text-xs font-semibold',s.highlight?'text-purple-300':'text-white/40')}>{s.label}</p>
            {[['Shares',s.shares,'text-white/70'],['Stop %',`${s.stopPct}%`,'text-white/50'],['Risk $',`$${s.risk.toFixed(0)}`,'text-red-400'],['2R',s.r2,'text-emerald-400'],['3R',s.r3,'text-emerald-300']].map(([l,v,c])=>(
              <div key={l} className="flex justify-between text-[11px]">
                <span className="text-white/30">{l}</span>
                <span className={cn('font-mono font-semibold',c)}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
