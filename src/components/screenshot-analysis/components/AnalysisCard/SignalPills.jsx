/**
 * @file src/components/screenshot-analysis/components/AnalysisCard/SignalPills.js
 *
 * Signal pills component.
 */

import React from 'react';

export function SignalPills({ signals, variant = 'risk' }) {
  const raw = typeof signals === 'string' ? signals : Array.isArray(signals) ? signals.join(', ') : '';
  const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) return <span className="text-xs text-white/30">—</span>;

  const color = variant === 'risk'
    ? 'bg-red-500/15 text-red-300 border-red-500/20'
    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, idx) => (
        <span key={`${item}-${idx}`} className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>{item}</span>
      ))}
    </div>
  );
}


