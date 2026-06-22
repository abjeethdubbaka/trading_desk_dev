import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import InfoHint from '@/components/ui/InfoHint';
import { useElementSize } from '@/lib/hooks/useElementSize';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-white/15 bg-[#111827] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-semibold text-white">{label}</p>
      <p className="text-emerald-300">Wins: {row.wins}</p>
      <p className="text-rose-300">Losses: {row.losses}</p>
      <p className="text-white/55">Win rate: {row.winRate}%</p>
      <p className="text-white/55">Avg P&L: {row.avgPnL >= 0 ? '+' : ''}${row.avgPnL?.toFixed(0)}</p>
      <p className={row.totalPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
        Total: {row.totalPnL >= 0 ? '+' : ''}${row.totalPnL?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}

export function WinRateBySetupChart({ data = [] }) {
  const { ref: containerRef, isReady } = useElementSize();
  const chartData = useMemo(() =>
    data
      .filter((r) => r.trades > 0)
      .slice(0, 12)
      .map((r) => {
        const wins = Math.round((r.winRate / 100) * r.trades);
        return {
          ...r,
          setup: r.setup.length > 18 ? `${r.setup.slice(0, 16)}…` : r.setup,
          wins,
          losses: r.trades - wins,
        };
      }),
    [data]
  );

  if (!chartData.length) {
    return (
      <div className="flex h-52 items-center justify-center rounded-2xl border border-white/10 bg-[#13131e] p-6">
        <p className="text-sm text-white/30">No setup data</p>
      </div>
    );
  }

  const chartHeight = Math.max(200, chartData.length * 40);

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#161423] to-[#10131b] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        Win / Loss by Setup
        <InfoHint text="Trade outcomes per setup type. Green = wins, red = losses." />
      </h3>

      <div ref={containerRef} className="w-full min-w-[100px]" style={{ height: chartHeight }}>
        {isReady && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 12, bottom: 0, left: 4 }}
              barSize={13}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="setup"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="wins" stackId="wl" fill="#10b981" name="Wins" radius={[2, 0, 0, 2]} />
              <Bar dataKey="losses" stackId="wl" fill="#f43f5e" name="Losses" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default WinRateBySetupChart;
