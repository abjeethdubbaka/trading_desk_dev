import React from 'react';
import { Clock3 } from 'lucide-react';
import { formatHoldDuration } from '@/lib/calculations/trades';
import { cn } from '@/lib/utils/general';

function HoldMetric({ label, value, tone = 'text-white' }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-1">{label}</p>
      <p className={cn('text-lg font-bold font-mono', tone)}>{value}</p>
    </div>
  );
}

export default function HoldDurationSummary({ stats }) {
  if (!stats?.closedTrades) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
            <Clock3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Hold Duration</h3>
            <p className="text-xs text-white/45">Needs both entry and exit time</p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
          <p className="text-sm text-white/65">No closed trades with entry and exit times yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Hold Duration</h3>
        </div>

        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/15 flex items-center justify-center text-sky-300">
          <Clock3 className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <HoldMetric label="Average" value={formatHoldDuration(stats.avgMinutes)} tone="text-sky-300" />
        <HoldMetric label="Median" value={formatHoldDuration(stats.medianMinutes)} tone="text-white" />
        <HoldMetric label="Winners" value={formatHoldDuration(stats.avgWinningMinutes)} tone="text-emerald-300" />
        <HoldMetric label="Losers" value={formatHoldDuration(stats.avgLosingMinutes)} tone="text-red-300" />
        <HoldMetric label="Shortest" value={formatHoldDuration(stats.shortestMinutes)} tone="text-white/90" />
        <HoldMetric label="Longest" value={formatHoldDuration(stats.longestMinutes)} tone="text-amber-300" />
      </div>
    </div>
  );
}
