import React from 'react';
import { cn } from '@/lib/utils';

export default function PriceLadder({ calculation }) {
  if (!calculation?.entryPrice || !calculation?.stopLossPrice) return null;

  const { entryPrice, stopLossPrice, actualRisk, direction, shares } = calculation;
  const entry = parseFloat(entryPrice);
  const stop  = parseFloat(stopLossPrice);
  const rps   = Math.abs(entry - stop);

  const levels = [
    { key:'sl',    price: stop,                                                    label:'Stop',   color:'bg-red-500',     text:'text-red-400',     desc:`-$${(actualRisk||0).toFixed(0)}` },
    { key:'entry', price: entry,                                                   label:'Entry',  color:'bg-white/80',    text:'text-white',       desc:`${shares||0} sh` },
    { key:'t2',    price: direction==='long' ? entry+rps*2 : entry-rps*2,         label:'2R',     color:'bg-emerald-400', text:'text-emerald-400', desc:`+$${((actualRisk||0)*2).toFixed(0)}` },
    { key:'t3',    price: direction==='long' ? entry+rps*3 : entry-rps*3,         label:'3R',     color:'bg-emerald-500', text:'text-emerald-300', desc:`+$${((actualRisk||0)*3).toFixed(0)}` },
    { key:'trail', price: direction==='long' ? entry+rps*5 : entry-rps*5,         label:'Trail',  color:'bg-purple-400',  text:'text-purple-300',  desc:'runner' },
  ];

  const prices = levels.map(l=>l.price);
  const minP   = Math.min(...prices), maxP = Math.max(...prices), range = maxP-minP||1;
  const pct    = p => ((p-minP)/range*88+6);

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-xl p-4 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Price ladder</p>

      {/* Track */}
      <div className="relative h-7 bg-white/4 rounded-lg mx-1">
        {/* Red zone */}
        <div className="absolute top-0 bottom-0 rounded-l-lg bg-red-500/10"
          style={{left:`${pct(stop)}%`, width:`${pct(entry)-pct(stop)}%`}} />
        {/* Green zone */}
        <div className="absolute top-0 bottom-0 bg-emerald-500/10"
          style={{left:`${pct(entry)}%`, width:`${pct(levels[levels.length-1].price)-pct(entry)}%`}} />
        {/* Markers */}
        {levels.map(l => (
          <div key={l.key} className="absolute top-0 bottom-0" style={{left:`${pct(l.price)}%`,transform:'translateX(-50%)'}}>
            <div className={cn('w-0.5 h-full', l.color)} />
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="relative h-10">
        {levels.map(l => (
          <div key={l.key} className="absolute flex flex-col items-center gap-0.5" style={{left:`${pct(l.price)}%`,transform:'translateX(-50%)'}}>
            <span className={cn('text-[10px] font-bold font-mono whitespace-nowrap', l.text)}>${l.price.toFixed(2)}</span>
            <span className="text-[9px] text-white/30 whitespace-nowrap">{l.label}</span>
            <span className={cn('text-[9px] whitespace-nowrap', l.text, 'opacity-60')}>{l.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
