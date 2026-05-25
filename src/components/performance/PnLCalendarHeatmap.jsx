import React, { useMemo } from 'react';
import InfoHint from '@/components/ui/InfoHint';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildDayMap(trades) {
  const map = {};
  for (const t of trades) {
    if (!t?.entry_time) continue;
    const key = new Date(t.entry_time).toISOString().slice(0, 10);
    if (!map[key]) map[key] = { pnl: 0, count: 0 };
    map[key].pnl += t?.pnl ?? 0;
    map[key].count += 1;
  }
  return map;
}

function buildWeeks(trades) {
  const dates = trades.filter((t) => t?.entry_time).map((t) => new Date(t.entry_time).getTime());
  if (!dates.length) return [];

  const minTime = Math.min(...dates);
  const maxTime = Math.max(...dates);

  const start = new Date(minTime);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(maxTime);
  end.setDate(end.getDate() + (6 - end.getDay()));

  // Cap at 52 weeks
  const cap = new Date(end.getTime() - 52 * 7 * 24 * 60 * 60 * 1000);
  const effectiveStart = start < cap ? cap : start;

  const weeks = [];
  const cur = new Date(effectiveStart);
  while (cur <= end) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function cellStyle(pnl, maxAbs) {
  if (!maxAbs) return {};
  const alpha = 0.15 + Math.min(Math.abs(pnl) / maxAbs, 1) * 0.75;
  if (pnl > 0) return { backgroundColor: `rgba(16,185,129,${alpha.toFixed(2)})` };
  if (pnl < 0) return { backgroundColor: `rgba(244,63,94,${alpha.toFixed(2)})` };
  return { backgroundColor: 'rgba(255,255,255,0.1)' };
}

export function PnLCalendarHeatmap({ trades = [] }) {
  const dayMap = useMemo(() => buildDayMap(trades), [trades]);
  const weeks = useMemo(() => buildWeeks(trades), [trades]);
  const maxAbs = useMemo(() => {
    const vals = Object.values(dayMap).map((d) => Math.abs(d.pnl));
    return vals.length ? Math.max(...vals) : 0;
  }, [dayMap]);

  if (!weeks.length) {
    return (
      <div className="flex h-36 items-center justify-center rounded-2xl border border-white/10 bg-[#13131e] p-6">
        <p className="text-sm text-white/30">No data for selected period</p>
      </div>
    );
  }

  const monthLabels = weeks.map((week, i) => {
    const m = week[0].getMonth();
    return i === 0 || weeks[i - 1][0].getMonth() !== m ? MONTHS[m] : '';
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#13131e] to-[#101420] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        Daily P&L Calendar
        <InfoHint text="Each cell = one trading day. Green = profit, red = loss. Darker = larger magnitude." />
      </h3>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {/* Row labels */}
        <div className="flex flex-shrink-0 flex-col gap-[3px] pt-5">
          {DAYS_SHORT.map((d, i) => (
            <div key={i} className="flex h-[11px] w-4 items-center text-[9px] text-white/30">
              {[1, 3, 5].includes(i) ? d : ''}
            </div>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              <div className="h-5 text-[9px] leading-5 text-white/35">{monthLabels[wi]}</div>
              {week.map((date, di) => {
                const key = date.toISOString().slice(0, 10);
                const d = dayMap[key];
                return (
                  <div
                    key={di}
                    title={
                      d
                        ? `${key}: ${d.pnl >= 0 ? '+' : ''}$${d.pnl.toFixed(0)} (${d.count} trade${d.count !== 1 ? 's' : ''})`
                        : key
                    }
                    style={d ? cellStyle(d.pnl, maxAbs) : { backgroundColor: 'rgba(255,255,255,0.04)' }}
                    className="h-[11px] w-[11px] cursor-default rounded-[2px] transition-opacity hover:opacity-75"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/35">
        <span>Less</span>
        {[-1, -0.4, 0, 0.4, 1].map((v, i) => (
          <div
            key={i}
            className="h-[11px] w-[11px] rounded-[2px]"
            style={v === 0 ? { backgroundColor: 'rgba(255,255,255,0.04)' } : cellStyle(v, 1)}
          />
        ))}
        <span>More</span>
        <span className="ml-2 text-emerald-400/60">profit</span>
        <span className="text-white/20">/</span>
        <span className="text-rose-400/60">loss</span>
      </div>
    </div>
  );
}

export default PnLCalendarHeatmap;
