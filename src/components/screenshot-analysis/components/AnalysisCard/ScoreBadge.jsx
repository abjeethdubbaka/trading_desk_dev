/**
 * @file src/components/screenshot-analysis/components/AnalysisCard/ScoreBadge.js
 *
 * Score badge component.
 */

import React from 'react';

export function ScoreBadge({ score }) {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  const color = n >= 8
    ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    : n >= 6
      ? 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
      : 'text-red-400 bg-red-500/15 border-red-500/30';

  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>{n}/10</span>;
}


