import React, { useMemo } from 'react';
import { cn } from '@/lib/utils/general';

const formatCompactCurrency = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '--';
  const sign = numericValue > 0 ? '+' : numericValue < 0 ? '-' : '';
  return `${sign}$${Math.abs(numericValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const buildCellKey = (setup, hour24, floatKey) => `${setup}|${hour24}|${floatKey}`;

const getCellTitle = (setup, hour, floatRange, cell) => {
  if (!cell || cell.trades === 0) {
    return `${setup} | ${hour} | ${floatRange}: no trades`;
  }

  return [
    `${setup} | ${hour} | ${floatRange}`,
    `${cell.trades} trade${cell.trades === 1 ? '' : 's'}`,
    `Total: ${formatCompactCurrency(cell.totalPnL)}`,
    `Avg: ${formatCompactCurrency(cell.avgPnL)}`,
    `Win rate: ${cell.winRate.toFixed(1)}%`,
  ].join('\n');
};

const getCellStyle = (cell, maxAbsAvgPnL, maxTrades) => {
  if (!cell || cell.trades === 0) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      color: 'rgba(255, 255, 255, 0.45)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    };
  }

  const pnlRatio = Math.min(1, Math.abs(cell.avgPnL || 0) / Math.max(1, maxAbsAvgPnL));
  const tradeRatio = Math.min(1, cell.trades / Math.max(1, maxTrades));
  const alpha = Math.min(0.92, 0.18 + pnlRatio * 0.56 + tradeRatio * 0.18);
  const isPositive = (cell.avgPnL || 0) >= 0;

  if (isPositive) {
    return {
      backgroundColor: `rgba(16, 185, 129, ${alpha})`,
      borderColor: `rgba(52, 211, 153, ${Math.min(0.96, alpha + 0.18)})`,
      color: pnlRatio > 0.66 ? 'rgba(5, 22, 17, 0.95)' : 'rgba(255, 255, 255, 0.94)',
      boxShadow: `0 8px 18px rgba(16, 185, 129, ${0.16 + pnlRatio * 0.24})`,
    };
  }

  return {
    backgroundColor: `rgba(244, 63, 94, ${alpha})`,
    borderColor: `rgba(251, 113, 133, ${Math.min(0.96, alpha + 0.18)})`,
    color: pnlRatio > 0.66 ? 'rgba(36, 5, 14, 0.95)' : 'rgba(255, 255, 255, 0.94)',
    boxShadow: `0 8px 18px rgba(244, 63, 94, ${0.16 + pnlRatio * 0.24})`,
  };
};

export default function SetupTimeFloatHeatmap({ data }) {
  const setups = Array.isArray(data?.setups) ? data.setups : [];
  const hours = Array.isArray(data?.hours) ? data.hours : [];
  const floatRanges = Array.isArray(data?.floatRanges) ? data.floatRanges : [];
  const cells = Array.isArray(data?.cells) ? data.cells : [];
  const topCombos = Array.isArray(data?.topCombos) ? data.topCombos : [];
  const maxAbsAvgPnL = Number.isFinite(data?.maxAbsAvgPnL) ? Math.max(1, data.maxAbsAvgPnL) : 1;
  const maxTrades = Number.isFinite(data?.maxTrades) ? Math.max(1, data.maxTrades) : 1;

  const cellMap = useMemo(() => {
    const map = new Map();
    for (const cell of cells) {
      map.set(buildCellKey(cell.setup, cell.hour24, cell.floatKey), cell);
    }
    return map;
  }, [cells]);

  const hasData = setups.length > 0 && hours.length > 0 && floatRanges.length > 0 && cells.length > 0;

  if (!hasData) {
    return (
      <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-[#161423] to-[#10131b] p-6">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white">Setup x Time x Float Heatmap (3D)</h3>
          <p className="mt-1 text-xs text-white/45">
            Add more tagged trades with entry time and share-float enrichment to unlock multi-axis combos.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/55">
          Not enough multi-dimensional trade data yet.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-[#161423] to-[#10131b] p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Setup x Time x Float Heatmap (3D)</h3>
          <p className="mt-1 text-xs text-white/45">
            Layered view of combo strength. Cell color tracks average P&L; depth layer is share-float range.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-right text-[11px] text-white/65">
          <p>{setups.length} setups</p>
          <p>{hours.length} entry-hour windows</p>
          <p>{floatRanges.length} float layers</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px]">
        <span className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 text-white/70">
          Legend
        </span>
        <span className="rounded-md border border-rose-400/30 bg-rose-500/15 px-2 py-1 text-rose-200">
          Negative Avg P&L
        </span>
        <span className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-white/70">Neutral</span>
        <span className="rounded-md border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-emerald-200">
          Positive Avg P&L
        </span>
      </div>

      {topCombos.length > 0 && (
        <div className="mb-4 grid gap-2 md:grid-cols-3">
          {topCombos.slice(0, 3).map((combo, idx) => (
            <div
              key={`${combo.setup}-${combo.hour24}-${combo.floatKey}`}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Top #{idx + 1}</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">
                {combo.setup} | {combo.hour}
              </p>
              <p className="mt-1 text-[11px] text-white/65">{combo.floatRange}</p>
              <p className="mt-1 text-[11px] text-emerald-200">
                {formatCompactCurrency(combo.totalPnL)} | {combo.winRate.toFixed(0)}% W | {combo.trades}T
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto pb-3">
        <div className="min-w-[920px] pr-10 pt-1">
          {floatRanges.map((floatRange, layerIndex) => {
            const layerDepth = floatRanges.length - layerIndex - 1;

            return (
              <div
                key={floatRange.key}
                className={cn(
                  'relative rounded-xl border bg-black/20 backdrop-blur-[2px]',
                  floatRange.totalPnL >= 0 ? 'border-emerald-400/25' : 'border-rose-400/25',
                  layerIndex > 0 ? '-mt-10' : ''
                )}
                style={{
                  marginLeft: `${layerDepth * 14}px`,
                  transform: 'perspective(1200px) rotateX(7deg)',
                  zIndex: layerIndex + 1,
                }}
              >
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                  <p className="text-xs font-semibold text-white">
                    {floatRange.label}
                  </p>
                  <p className={cn('text-[11px] font-medium', floatRange.totalPnL >= 0 ? 'text-emerald-200' : 'text-rose-200')}>
                    {formatCompactCurrency(floatRange.totalPnL)} | {floatRange.winRate.toFixed(0)}% W | {floatRange.trades}T
                  </p>
                </div>

                <div
                  className="grid gap-1.5 p-2"
                  style={{
                    gridTemplateColumns: `220px repeat(${hours.length}, minmax(96px, 1fr))`,
                  }}
                >
                  <div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
                    Setup / Entry Hour
                  </div>
                  {hours.map((hour) => (
                    <div
                      key={`hour-${floatRange.key}-${hour.hour24}`}
                      className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-1 text-center text-[10px] font-semibold text-white/65"
                    >
                      {hour.hour}
                    </div>
                  ))}

                  {setups.map((setup) => (
                    <React.Fragment key={`${floatRange.key}-${setup}`}>
                      <div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-2">
                        <p className="truncate text-[11px] font-medium text-white/85" title={setup}>
                          {setup}
                        </p>
                      </div>

                      {hours.map((hour) => {
                        const cell = cellMap.get(buildCellKey(setup, hour.hour24, floatRange.key));

                        return (
                          <div
                            key={`${setup}-${hour.hour24}-${floatRange.key}`}
                            title={getCellTitle(setup, hour.hour, floatRange.label, cell)}
                            className="h-16 rounded-md border px-1.5 py-1.5 transition-transform hover:-translate-y-[1px]"
                            style={getCellStyle(cell, maxAbsAvgPnL, maxTrades)}
                          >
                            <p className="text-[9px] uppercase tracking-[0.1em]">
                              {cell?.trades ? `${cell.trades}T` : '0T'}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold">
                              {cell?.trades ? formatCompactCurrency(cell.avgPnL) : '--'}
                            </p>
                            <p className="mt-0.5 text-[9px]">
                              {cell?.trades ? `${cell.winRate.toFixed(0)}% W` : 'No data'}
                            </p>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
