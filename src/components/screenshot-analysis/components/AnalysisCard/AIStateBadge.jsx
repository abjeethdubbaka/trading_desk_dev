/**
 * @file src/components/screenshot-analysis/components/AnalysisCard/AIStateBadge.js
 *
 * AI state badge component.
 */

import React from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function AIStateBadge({ state, error }) {
  if (state === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
        <Loader2 className="w-3 h-3 animate-spin" />
        Analyzing…
      </span>
    );
  }
  if (state === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        AI complete
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span title={error || ''} className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" />
        Analysis failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
      <Sparkles className="w-3 h-3" />
      Awaiting analysis
    </span>
  );
}


