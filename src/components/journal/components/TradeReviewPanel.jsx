import React from 'react';
import { Sparkles, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRADE_COLOR = { A: 'text-emerald-400', B: 'text-blue-400', C: 'text-amber-400', D: 'text-orange-400', F: 'text-red-400' };
const GRADE_BG = { A: 'bg-emerald-500/15', B: 'bg-blue-500/15', C: 'bg-amber-500/15', D: 'bg-orange-500/15', F: 'bg-red-500/15' };

export default function TradeReviewPanel({ trade, review, isLoading, onRequest, isOpen, onToggle, onClear }) {
  return (
    <div className="border-t border-white/5 mt-2 pt-2">
      <button onClick={() => { onToggle(); if (!review && !isLoading) onRequest(trade); }} className="flex items-center gap-1.5 text-xs text-purple-400/70 hover:text-purple-300 transition-colors py-0.5">
        <Sparkles className="w-3 h-3" />
        {isOpen ? 'Hide' : 'AI review this trade'}
        <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-white/40 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />Claude is reviewing this trade…
            </div>
          )}

          {review?.error && <p className="text-xs text-red-400/70">{review.error}</p>}

          {review && !review.error && !isLoading && (
            <div className="bg-purple-500/6 border border-purple-500/15 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold font-mono', GRADE_BG[review.grade] || 'bg-white/8', GRADE_COLOR[review.grade] || 'text-white')}>
                    {review.grade}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/70">Trade grade</p>
                    <p className="text-[10px] text-white/40 capitalize">{review.verdict}</p>
                  </div>
                </div>
                <button onClick={() => { onClear && onClear(trade.id); onRequest(trade); }} title="Regenerate" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <RefreshCw className="w-3 h-3 text-white/40" />
                </button>
              </div>

              {[
                ['✓ What went well', review.what_went_well, 'text-emerald-300/80'],
                ['↑ Improve', review.what_to_improve, 'text-amber-300/80'],
                ['💡 Key lesson', review.key_lesson, 'text-blue-300/80'],
                ['→ Next time', review.next_time, 'text-purple-300/80'],
              ].filter(([, v]) => v).map(([label, text, color]) => (
                <div key={label}>
                  <p className="text-[10px] text-white/30 font-semibold">{label}</p>
                  <p className={cn('text-xs mt-0.5 leading-relaxed', color)}>{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
