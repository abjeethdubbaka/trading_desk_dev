import React from 'react';
import { cn } from '@/lib/utils/general';

export default function BehaviorRecapCard({ mistakeInsights, planAdherence }) {
  const topMistakes = mistakeInsights?.topMistakes?.slice(0, 3) ?? [];
  const topFixes = mistakeInsights?.topFixes?.slice(0, 3) ?? [];
  const followed = planAdherence?.followed ?? { totalTrades: 0, avgPnL: 0 };
  const deviated = planAdherence?.deviated ?? { totalTrades: 0, avgPnL: 0 };
  const hasPlanData = followed.totalTrades > 0 || deviated.totalTrades > 0;
  const diff = followed.avgPnL - deviated.avgPnL;

  return (
    <div className="space-y-4 rounded-2xl border border-white/8 bg-[#13131e] p-5">
      <p className="text-sm font-semibold text-white">Behavior recap</p>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-rose-200/70">Top mistakes</p>
          {topMistakes.length ? (
            <div className="space-y-1.5">
              {topMistakes.map((item) => (
                <div key={item.normalized} className="flex items-center justify-between text-xs">
                  <span className="text-white/75">{item.text}</span>
                  <span className="font-mono text-white/40">{item.count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/35">No mistakes logged this month.</p>
          )}
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-emerald-200/70">Top learnings</p>
          {topFixes.length ? (
            <div className="space-y-1.5">
              {topFixes.map((item) => (
                <div key={item.normalized} className="flex items-center justify-between text-xs">
                  <span className="text-white/75">{item.text}</span>
                  <span className="font-mono text-white/40">{item.count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/35">No learnings logged this month.</p>
          )}
        </div>
      </div>

      {hasPlanData && (
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-xs',
            diff > 0
              ? 'border border-emerald-500/20 bg-emerald-500/8 text-emerald-300/80'
              : diff < 0
                ? 'border border-red-500/20 bg-red-500/8 text-red-300/80'
                : 'border border-white/10 bg-white/5 text-white/60'
          )}
        >
          Followed plan on {followed.totalTrades} trade{followed.totalTrades === 1 ? '' : 's'} this month
          {deviated.totalTrades > 0 ? `, deviated on ${deviated.totalTrades}` : ''}.
          {followed.totalTrades > 0 && deviated.totalTrades > 0 && diff !== 0 && (
            diff > 0
              ? ` Following your plan earned $${diff.toFixed(0)} more per trade.`
              : ` Deviating cost $${Math.abs(diff).toFixed(0)} per trade.`
          )}
        </div>
      )}
    </div>
  );
}
