import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { buildEquityCurve, calcMaxDrawdown } from '@/lib/calculations/trades';
import { cn } from '@/lib/utils/general';

const PERIODS = ['1W', '1M', '3M', 'All'];

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-[#1a1a28] border border-white/15 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white/50 mb-1">{d?.date}</p>
      <p className={`font-bold text-base font-mono ${d?.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${d?.balance?.toLocaleString()}</p>
      {d?.drawdown < 0 && <p className="text-red-400/70 mt-0.5">DD: ${d.drawdown.toFixed(0)}</p>}
      <p className={`mt-0.5 ${d?.pnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>{d?.pnl >= 0 ? '+' : ''}${d?.pnl?.toFixed(2)}</p>
    </div>
  );
};

export default function EquityCurve({ trades = [], initialBalance = 50000 }) {
  const [period, setPeriod] = useState('All');
  
  // Simple period filter since filterByPeriod doesn't exist
  const filtered = useMemo(() => {
    if (period === 'All') return trades;
    
    const now = new Date();
    const cutoff = new Date();
    
    switch (period) {
      case '1W':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoff.setMonth(now.getMonth() - 3);
        break;
      default:
        return trades;
    }
    
    return trades.filter(t => new Date(t.entry_time || t.created_date) >= cutoff);
  }, [trades, period]);
  
  const curve = useMemo(() => buildEquityCurve(filtered, initialBalance), [filtered, initialBalance]);
  const maxDD = useMemo(() => calcMaxDrawdown(curve), [curve]);
  const start = curve[0]?.balance ?? initialBalance;
  const end = curve[curve.length - 1]?.balance ?? initialBalance;
  const gain = end - start;

  if (!curve.length) return <div className="bg-[#13131e] border border-white/8 rounded-2xl p-6 text-center text-white/30 text-sm">No trades for this period</div>;

  return (
    <div className="bg-[#13131e] border border-white/8 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Equity curve</p>
          <p className="text-xs text-white/40 mt-0.5">{gain >= 0 ? '+' : ''}${gain.toFixed(0)} · <span className="text-red-400/70">Max DD ${maxDD.toFixed(0)}</span></p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('text-xs px-3 py-1 rounded-md transition-all', period === p ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-white/40 hover:text-white/70')}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="h-52 min-h-[200px] min-w-[200px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={undefined}>
          <AreaChart data={curve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs><linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.25} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} />
            <YAxis stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<Tip />} />
            <ReferenceLine y={initialBalance} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />
            <Area type="monotone" dataKey="balance" stroke="#34d399" strokeWidth={2} fill="url(#eqG)" dot={false} activeDot={{ r: 4, fill: '#34d399' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-xs text-white/30 font-mono">
        <span>Start: ${start.toLocaleString()}</span>
        <span className={gain >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}>{gain >= 0 ? '+' : ''}${gain.toFixed(0)}</span>
        <span className={end >= start ? 'text-emerald-400' : 'text-red-400'}>Now: ${end.toLocaleString()}</span>
      </div>
    </div>
  );
}


