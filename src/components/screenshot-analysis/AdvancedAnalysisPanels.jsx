import React from 'react';

export function ExecutionTimeline({ entry, exit }) {
  const entryGrade = entry?.grade || '';
  const exitGrade = exit?.grade || '';

  return (
    <div className="space-y-2">
      <div className="relative h-16 bg-white/5 rounded-lg">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />

        <div className="absolute left-1/4 top-1/2 -translate-y-1/2">
          <div className={`w-3 h-3 rounded-full ${entryGrade === 'A' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <p className="text-xs mt-2">Entry {entry?.timing?.actual || '--'}</p>
          {entry?.timing?.deviation_type === 'early' && (
            <p className="text-xs text-red-400">-{entry?.timing?.deviation_minutes || 0}min</p>
          )}
        </div>

        <div className="absolute right-1/4 top-1/2 -translate-y-1/2">
          <div className={`w-3 h-3 rounded-full ${exitGrade === 'A' ? 'bg-green-500' : exitGrade === 'F' ? 'bg-red-500' : 'bg-yellow-500'}`} />
          <p className="text-xs mt-2">Exit {exit?.timing?.actual || '--'}</p>
          {exit?.timing?.deviation_type === 'early' && (
            <p className="text-xs text-red-400">-{exit?.timing?.deviation_minutes || 0}min</p>
          )}
        </div>

        <div className="absolute left-1/3 top-0 h-full w-12 bg-green-500/10 border-l border-r border-green-500/30">
          <p className="text-[10px] text-green-400 text-center">Ideal</p>
        </div>
      </div>
    </div>
  );
}

export function MistakeCostCard({ analysis }) {
  if (!analysis) return null;

  const totalMistakeCost =
    (analysis.execution?.entry?.timing?.cost_of_deviation || 0) +
    (analysis.execution?.exit?.timing?.cost_of_deviation || 0) +
    (analysis.execution?.position?.cost_of_size_mistake || 0);

  return (
    <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
      <h3 className="text-sm font-medium mb-3">Mistake Cost Breakdown</h3>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-white/70">Entry timing:</span>
          <span className="text-red-400">-${analysis.execution?.entry?.timing?.cost_of_deviation || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/70">Exit timing:</span>
          <span className="text-red-400">-${analysis.execution?.exit?.timing?.cost_of_deviation || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/70">Position size:</span>
          <span className="text-red-400">-${analysis.execution?.position?.cost_of_size_mistake || 0}</span>
        </div>
        <div className="border-t border-white/10 my-2 pt-2 flex justify-between font-bold">
          <span>Total cost:</span>
          <span className="text-red-400">-${totalMistakeCost}</span>
        </div>
      </div>

      <div className="mt-3 p-2 bg-white/5 rounded text-sm">
        <p className="text-xs text-white/50">If done correctly:</p>
        <p className="text-green-400">+${analysis.improvement_analysis?.rewind?.projected_pnl || 0}</p>
        <p className="text-xs text-white/50 mt-1">Difference: ${analysis.improvement_analysis?.rewind?.actual_vs_projected || 0}</p>
      </div>
    </div>
  );
}

export function PatternAlert({ pattern }) {
  if (!pattern || pattern.similar_trades_count === 0) return null;

  const isBadPattern = pattern.similar_trades_win_rate < 40;

  return (
    <div className={`rounded-lg p-3 ${isBadPattern ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'} border`}>
      <div className="flex items-start gap-2">
        <span className={isBadPattern ? 'text-red-400' : 'text-green-400'}>{isBadPattern ? '!' : 'i'}</span>
        <div>
          <p className="text-sm font-medium">{isBadPattern ? 'Pattern Warning' : 'Pattern Match'}</p>
          <p className="text-xs text-white/70 mt-1">{pattern.similar_trades_count} similar trades found</p>
          <p className="text-xs mt-1">Win rate: {pattern.similar_trades_win_rate}% | Avg: ${pattern.similar_trades_avg_pnl}</p>
          <p className="text-xs font-medium mt-2 text-white/80">{pattern.recommendation}</p>
        </div>
      </div>
    </div>
  );
}

export function ActionItems({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Action Items</h3>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded">
          <input type="checkbox" className="rounded border-white/20" />
          <div className="flex-1">
            <p className="text-sm">{item.description}</p>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {item.priority}
              </span>
              <span className="text-xs text-white/50">{item.type}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdvancedSummary({ analyses }) {
  if (!Array.isArray(analyses) || analyses.length === 0) return null;

  const totalMistakeCost = analyses.reduce((sum, a) => (
    sum + (a.improvement_analysis?.primary_mistake?.cost || 0) + (a.improvement_analysis?.secondary_mistake?.cost || 0)
  ), 0);

  const topMistakes = {};
  analyses.forEach((a) => {
    const mistake = a.improvement_analysis?.primary_mistake?.specific;
    if (!mistake) return;
    topMistakes[mistake] = (topMistakes[mistake] || 0) + 1;
  });

  const mostCommon = Object.entries(topMistakes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-[#1a1a24] rounded-lg p-4 border border-white/10">
        <p className="text-xs text-white/50">Total Mistake Cost</p>
        <p className="text-2xl font-bold text-red-400">-${totalMistakeCost}</p>
        <p className="text-xs text-white/50 mt-1">Across {analyses.length} trades</p>
      </div>

      <div className="bg-[#1a1a24] rounded-lg p-4 border border-white/10">
        <p className="text-xs text-white/50">Most Common Mistake</p>
        <p className="text-lg font-medium">{mostCommon}</p>
        <p className="text-xs text-white/50 mt-1">Fix this first for biggest impact</p>
      </div>

      <div className="bg-[#1a1a24] rounded-lg p-4 border border-white/10">
        <p className="text-xs text-white/50">Potential Improvement</p>
        <p className="text-2xl font-bold text-green-400">+${totalMistakeCost}</p>
        <p className="text-xs text-white/50 mt-1">If all mistakes fixed</p>
      </div>
    </div>
  );
}


