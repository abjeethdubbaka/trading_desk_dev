import React from 'react';
import InfoHint from '@/components/ui/InfoHint';

function PatternList({ title, items = [], emptyText = 'No data yet.' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-white/45">{emptyText}</p>
      ) : (
        <div className="mt-2 space-y-1.5">
          {items.map((item) => (
            <div key={`${title}-${item.normalized}`} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-white/80">{item.text}</p>
                <span className="rounded-full border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] text-white/65">
                  {item.count}x
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MistakePatternInsights({ insights }) {
  const topMistakes = Array.isArray(insights?.topMistakes) ? insights.topMistakes : [];
  const topFixes = Array.isArray(insights?.topFixes) ? insights.topFixes : [];
  const totalMistakes = Number(insights?.totalMistakeEntries || 0);
  const totalFixes = Number(insights?.totalFixEntries || 0);

  return (
    <div className="space-y-3 rounded-2xl border border-white/8 bg-[#13131e] p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-white">Mistake Pattern Insights</p>
        <InfoHint text="Repeated patterns pulled from 'What went wrong' and 'What did you learn' reflections." />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-rose-200/80">Mistake entries</p>
          <p className="mt-1 font-mono text-lg font-bold text-rose-300">{totalMistakes}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-200/80">Fix entries</p>
          <p className="mt-1 font-mono text-lg font-bold text-emerald-300">{totalFixes}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <PatternList
          title="Top Repeated Mistakes"
          items={topMistakes}
          emptyText="Add reflection entries to surface repeated mistakes."
        />
        <PatternList
          title="Top Repeated Fixes"
          items={topFixes}
          emptyText="Log what you learned to track recurring fixes."
        />
      </div>
    </div>
  );
}
