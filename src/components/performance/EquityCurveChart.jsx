import React from 'react';
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Bar, Cell,
} from 'recharts';
import { cn } from '@/lib/utils/general';
import InfoHint from '@/components/ui/InfoHint';
import { useElementSize } from '@/lib/hooks/useElementSize';

const fmtMoney = (v) => {
  const abs = Math.abs(v);
  return abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(0)}`;
};

const fmtPct = (v) => `${v.toFixed(1)}%`;

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d || d.trade === 0) return null;

  const ddPct = d.drawdownPct ?? 0;
  const ddAbs = d.drawdownAbs ?? 0;
  const r = d.rMultiple != null ? Number(d.rMultiple) : null;

  return (
    <div className="rounded-xl border border-white/15 bg-[#0d1117] px-3 py-2.5 text-xs shadow-2xl space-y-1 min-w-[160px]">
      <div className="flex items-center justify-between gap-4 mb-1">
        <span className="text-white/40">{d.date}</span>
        <span className="text-white/40">#{d.trade}</span>
      </div>

      {d.symbol && (
        <p className="font-semibold text-white/80">
          {d.symbol}
          {d.direction && <span className="ml-1.5 text-[10px] text-white/40 uppercase">{d.direction}</span>}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className="text-white/50">Balance</span>
        <span className="font-mono font-semibold text-white">
          ${d.balance?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>

      {d.pnl !== 0 && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/50">P&amp;L</span>
          <span className={cn('font-mono font-semibold', d.pnl > 0 ? 'text-emerald-300' : 'text-rose-300')}>
            {d.pnl > 0 ? '+' : ''}${Math.abs(d.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}

      {r != null && Number.isFinite(r) && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/50">R</span>
          <span className={cn('font-mono font-semibold', r >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
            {r >= 0 ? '+' : ''}{r}R
          </span>
        </div>
      )}

      {ddPct < 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-1 mt-1">
          <span className="text-white/40">Drawdown</span>
          <span className="font-mono text-rose-400">
            {ddPct.toFixed(1)}% (${Math.abs(ddAbs).toLocaleString(undefined, { maximumFractionDigits: 0 })})
          </span>
        </div>
      )}
    </div>
  );
}

function MonthlyBarsTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  return (
    <div className="rounded-xl border border-white/15 bg-[#0d1117] px-3 py-2 text-xs shadow-xl">
      <p className="font-mono font-semibold" style={{ color: v >= 0 ? '#10b981' : '#f43f5e' }}>
        {v >= 0 ? '+' : ''}${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}

export function EquityCurveChart({ curve = [], initialBalance = 50000, monthlyBars = [], selectedMonth = null }) {
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
  const totalPct = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;
  const isProfit = totalPnL >= 0;
  const equityColor = isProfit ? '#10b981' : '#f43f5e';

  const peakBalance = Math.max(...curve.map((p) => p.peak ?? p.balance));
  const worstDrawdownPct = Math.min(...curve.map((p) => p.drawdownPct ?? 0));
  const hasDrawdown = worstDrawdownPct < -0.01;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#13131e] to-[#101420] p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            Equity Curve
            <InfoHint text="Balance plotted at trade exit (when P&L is realized). Peak line shows the highest balance reached." />
          </h3>
          <p className={cn('mt-1 font-mono text-2xl font-bold', isProfit ? 'text-emerald-400' : 'text-rose-400')}>
            {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="ml-2 text-sm font-normal opacity-60">
              ({totalPct >= 0 ? '+' : ''}{totalPct.toFixed(1)}%)
            </span>
          </p>
        </div>
        {hasDrawdown && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/8 px-3 py-1.5 text-right">
            <p className="text-[10px] text-white/40 uppercase">Max drawdown</p>
            <p className="font-mono text-sm font-semibold text-rose-400">{worstDrawdownPct.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {/* Main equity chart */}
      <div ref={containerRef} className="h-[200px] w-full min-h-[200px] min-w-[100px]">
        {isReady && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <ComposedChart data={curve} margin={{ top: 5, right: 8, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="ecGradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="ecGradLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
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
                tickFormatter={fmtMoney}
                width={46}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Starting balance reference */}
              <ReferenceLine
                y={initialBalance}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="4 4"
                label={{ value: 'Start', position: 'insideTopLeft', fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
              />

              {/* Peak balance reference */}
              {peakBalance > initialBalance && (
                <ReferenceLine
                  y={peakBalance}
                  stroke="rgba(251,191,36,0.35)"
                  strokeDasharray="2 4"
                  label={{ value: `Peak ${fmtMoney(peakBalance)}`, position: 'insideTopRight', fill: 'rgba(251,191,36,0.5)', fontSize: 9 }}
                />
              )}

              {/* Equity area */}
              <Area
                type="monotone"
                dataKey="balance"
                stroke={equityColor}
                strokeWidth={2}
                fill={`url(#ecGrad${isProfit ? 'Profit' : 'Loss'})`}
                dot={false}
                activeDot={{ r: 4, fill: equityColor, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Month-over-month P&L bars */}
      {monthlyBars.length > 1 && (
        <div className="mt-4 border-t border-white/8 pt-4">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-white/35">Monthly P&amp;L</p>
          <div className="h-[90px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyBars} margin={{ top: 14, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                <Tooltip content={<MonthlyBarsTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={32}>
                  {monthlyBars.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'}
                      fillOpacity={entry.label === selectedMonth ? 1 : 0.45}
                      stroke={entry.label === selectedMonth ? (entry.pnl >= 0 ? '#10b981' : '#f43f5e') : 'none'}
                      strokeWidth={entry.label === selectedMonth ? 1.5 : 0}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Drawdown sub-chart */}
      {hasDrawdown && (
        <div className="mt-3 h-[60px] w-full">
          {isReady && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={curve} margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
                <XAxis dataKey="date" hide />
                <YAxis
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={fmtPct}
                  width={46}
                  domain={[Math.min(worstDrawdownPct * 1.1, -1), 0]}
                />
                <Tooltip content={() => null} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Area
                  type="monotone"
                  dataKey="drawdownPct"
                  stroke="#f43f5e"
                  strokeWidth={1}
                  fill="rgba(244,63,94,0.15)"
                  dot={false}
                  activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
          <p className="text-[9px] text-white/25 text-right mt-0.5 pr-1">drawdown %</p>
        </div>
      )}
    </div>
  );
}

export default EquityCurveChart;
