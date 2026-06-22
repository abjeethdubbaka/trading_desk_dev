import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils/general';
import InfoHint from '@/components/ui/InfoHint';
import { useElementSize } from '@/lib/hooks/useElementSize';

const fmtAxis = (v) => {
  const abs = Math.abs(v);
  return abs >= 1000 ? `$${(abs / 1000).toFixed(0)}k` : `$${abs}`;
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl border border-white/15 bg-[#111827] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-white/50">{d.date} · Trade #{d.trade}</p>
      <p className="font-semibold text-white">
        ${d.balance?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>
      {d.pnl !== 0 && (
        <p className={d.pnl > 0 ? 'text-emerald-300' : 'text-rose-300'}>
          {d.pnl > 0 ? '+' : ''}${Math.abs(d.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })} this trade
        </p>
      )}
    </div>
  );
}

export function EquityCurveChart({ curve = [], initialBalance = 50000 }) {
  const { ref: containerRef, isReady } = useElementSize();

  if (!curve?.length || curve.length <= 1) {
    return (
      <div className="flex h-52 items-center justify-center rounded-2xl border border-white/10 bg-[#13131e] p-6">
        <p className="text-sm text-white/30">No trades to chart</p>
      </div>
    );
  }

  const finalBalance = curve[curve.length - 1]?.balance ?? initialBalance;
  const totalPnL = finalBalance - initialBalance;
  const isProfit = totalPnL >= 0;
  const color = isProfit ? '#10b981' : '#f43f5e';

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#13131e] to-[#101420] p-5">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          Equity Curve
          <InfoHint text="Running account balance after each trade. Dashed line = starting balance." />
        </h3>
        <p className={cn('mt-1 font-mono text-2xl font-bold', isProfit ? 'text-emerald-400' : 'text-rose-400')}>
          {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>

      <div ref={containerRef} className="h-[200px] w-full min-h-[200px] min-w-[100px]">
        {isReady && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <AreaChart data={curve} margin={{ top: 5, right: 8, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="ecGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtAxis}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={initialBalance} stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={color}
                strokeWidth={2}
                fill="url(#ecGrad)"
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default EquityCurveChart;
