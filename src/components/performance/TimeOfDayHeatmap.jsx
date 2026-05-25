import React, { useMemo } from 'react';
import InfoHint from '@/components/ui/InfoHint';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtHour(h) {
  if (h === 0) return '12a';
  if (h < 12) return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
}

function buildGrid(trades) {
  // grid[hour][dow] = { pnl, count, wins }
  const grid = Array.from({ length: 24 }, () =>
    Array.from({ length: 7 }, () => ({ pnl: 0, count: 0, wins: 0 }))
  );
  for (const t of trades) {
    if (!t?.entry_time) continue;
    const d = new Date(t.entry_time);
    const hour = d.getHours();
    const dow = d.getDay();
    grid[hour][dow].pnl += t?.pnl ?? 0;
    grid[hour][dow].count += 1;
    if ((t?.pnl ?? 0) > 0) grid[hour][dow].wins += 1;
  }
  return grid;
}

function activeHourRange(grid) {
  const active = [];
  for (let h = 0; h < 24; h++) {
    if (grid[h].some((c) => c.count > 0)) active.push(h);
  }
  if (!active.length) return [];
  const min = Math.max(0, active[0] - 1);
  const max = Math.min(23, active[active.length - 1] + 1);
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

function maxAbsPnL(grid) {
  let max = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (Math.abs(cell.pnl) > max) max = Math.abs(cell.pnl);
    }
  }
  return max;
}

function cellStyle(cell, maxAbs) {
  if (!cell.count || !maxAbs) return {};
  const alpha = 0.15 + (Math.min(Math.abs(cell.pnl) / maxAbs, 1) * 0.75);
  return cell.pnl >= 0
    ? { backgroundColor: `rgba(16,185,129,${alpha.toFixed(2)})` }
    : { backgroundColor: `rgba(244,63,94,${alpha.toFixed(2)})` };
}

export function TimeOfDayHeatmap({ trades = [] }) {
  const grid = useMemo(() => buildGrid(trades), [trades]);
  const hours = useMemo(() => activeHourRange(grid), [grid]);
  const maxAbs = useMemo(() => maxAbsPnL(grid), [grid]);

  if (!trades.length || !hours.length) {
    return (
      <div className="flex h-36 items-center justify-center rounded-2xl border border-white/10 bg-[#13131e] p-6">
        <p className="text-sm text-white/30">No data for selected period</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#151522] to-[#10131b] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        Time-of-Day Heatmap
        <InfoHint text="Total P&L by entry hour and day of week. Darker = stronger outcome. Number = trade count." />
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-9 pb-2" />
              {DOW_LABELS.map((d) => (
                <th key={d} className="min-w-[44px] pb-2 text-center text-[10px] font-normal text-white/40">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td className="pr-2 text-right text-[10px] text-white/35">{fmtHour(hour)}</td>
                {grid[hour].map((cell, dow) => {
                  const avg = cell.count > 0 ? cell.pnl / cell.count : 0;
                  const title = cell.count > 0
                    ? `${DOW_LABELS[dow]} ${fmtHour(hour)}: ${cell.pnl >= 0 ? '+' : ''}$${cell.pnl.toFixed(0)} total · $${avg.toFixed(0)}/trade · ${cell.count} trade${cell.count !== 1 ? 's' : ''}`
                    : '';
                  return (
                    <td key={dow} className="p-0.5">
                      <div
                        title={title}
                        style={cellStyle(cell, maxAbs)}
                        className="flex h-8 w-full min-w-[40px] cursor-default items-center justify-center rounded-md bg-white/[0.03] transition-opacity hover:opacity-75"
                      >
                        {cell.count > 0 && (
                          <span className="font-mono text-[9px] text-white/55">{cell.count}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TimeOfDayHeatmap;
