import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DayPanel({ day, trades=[], onClose }) {
  const dayTrades = useMemo(()=>trades.filter(t=>{try{return isSameDay(new Date(t.entry_time||t.created_date),day);}catch{return false;}}), [trades,day]);
  const totalPnL  = dayTrades.reduce((s,t)=>s+(t.pnl||0),0);
  const wins      = dayTrades.filter(t=>(t.pnl||0)>0).length;
  return (
    <div className="bg-[#13131e] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{format(day,'EEEE, MMM d')}</p>
          <p className={cn('text-lg font-bold font-mono',totalPnL>=0?'text-emerald-400':'text-red-400')}>{totalPnL>=0?'+':''}${totalPnL.toFixed(2)}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-white/50" /></button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[['Trades',dayTrades.length,'text-white'],['Wins',wins,'text-emerald-400'],['Losses',dayTrades.length-wins,'text-red-400']].map(([l,v,c])=>(
          <div key={l} className="bg-white/5 rounded-lg p-2 text-center"><p className="text-white/40">{l}</p><p className={cn('font-bold text-sm',c)}>{v}</p></div>
        ))}
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto max-h-72">
        {!dayTrades.length ? <p className="text-white/30 text-sm text-center py-4">No trades</p> : dayTrades.map(t=>(
          <div key={t.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded',t.direction==='long'?'bg-emerald-500/20 text-emerald-400':'bg-red-500/20 text-red-400')}>{t.direction==='long'?'L':'S'}</span>
              <div><p className="text-sm font-semibold leading-none">{t.symbol}</p><p className="text-[10px] text-white/40 mt-0.5">{t.setup_type||'—'}</p></div>
            </div>
            <div className="text-right">
              <p className={cn('text-sm font-bold font-mono',(t.pnl||0)>=0?'text-emerald-400':'text-red-400')}>{(t.pnl||0)>=0?'+':''}${(t.pnl||0).toFixed(2)}</p>
              {t.r_multiple!=null&&<p className="text-[10px] text-white/40">{parseFloat(t.r_multiple).toFixed(1)}R</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
