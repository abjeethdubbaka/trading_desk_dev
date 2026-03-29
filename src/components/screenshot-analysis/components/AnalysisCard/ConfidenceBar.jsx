/**
 * @file src/components/screenshot-analysis/components/AnalysisCard/ConfidenceBar.js
 *
 * Confidence bar component.
 */

import React from 'react';

export function ConfidenceBar({ value }) {
  const pct = Math.round((Number(value) || 0) * 100);
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/50">AI confidence</span>
        <span className="text-white/80">{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}


