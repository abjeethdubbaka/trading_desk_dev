import React from 'react';
import {
  Sparkles,
  Loader2,
  ChevronDown,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/general';

const GRADE_COLOR = {
  A: 'text-emerald-400',
  B: 'text-blue-400',
  C: 'text-amber-400',
  D: 'text-orange-400',
  F: 'text-red-400',
};

const GRADE_BG = {
  A: 'bg-emerald-500/15',
  B: 'bg-blue-500/15',
  C: 'bg-amber-500/15',
  D: 'bg-orange-500/15',
  F: 'bg-red-500/15',
};

export default function TradeReviewPanel({
  trade,
  review,
  isLoading,
  onRequest,
  isOpen,
  onToggle,
  onClear,
  usefulness,
  onSetUsefulness,
}) {
  const handleSetUsefulness = (value) => {
    if (!onSetUsefulness) return;
    const normalizedCurrent = typeof usefulness === 'boolean' ? usefulness : null;
    const nextValue = normalizedCurrent === value ? null : value;
    onSetUsefulness(trade?.id, nextValue);
  };

  return (
    <div className="mt-2 border-t border-white/5 pt-2">
      <button
        onClick={() => {
          onToggle();
          if (!review && !isLoading) onRequest(trade);
        }}
        className="flex items-center gap-1.5 py-0.5 text-xs text-purple-400/70 transition-colors hover:text-purple-300"
      >
        <Sparkles className="h-3 w-3" />
        {isOpen ? 'Hide' : 'AI review this trade'}
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {isLoading && (
            <div className="flex items-center gap-2 py-2 text-xs text-white/40">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              AI is reviewing this trade...
            </div>
          )}

          {review?.error && <p className="text-xs text-red-400/70">{review.error}</p>}

          {review && !review.error && !isLoading && (
            <div className="space-y-3 rounded-xl border border-purple-500/15 bg-purple-500/6 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg font-mono text-xl font-bold',
                      GRADE_BG[review.grade] || 'bg-white/8',
                      GRADE_COLOR[review.grade] || 'text-white'
                    )}
                  >
                    {review.grade}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/70">Trade grade</p>
                    <p className="text-[10px] capitalize text-white/40">{review.verdict}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClear && onClear(trade.id);
                    onRequest(trade);
                  }}
                  title="Regenerate"
                  className="rounded-lg bg-white/5 p-1.5 transition-colors hover:bg-white/10"
                >
                  <RefreshCw className="h-3 w-3 text-white/40" />
                </button>
              </div>

              {[
                ['What went well', review.what_went_well, 'text-emerald-300/80'],
                ['Improve', review.what_to_improve, 'text-amber-300/80'],
                ['Key lesson', review.key_lesson, 'text-blue-300/80'],
                ['Next time', review.next_time, 'text-purple-300/80'],
              ]
                .filter(([, value]) => value)
                .map(([label, text, color]) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold text-white/30">{label}</p>
                    <p className={cn('mt-0.5 text-xs leading-relaxed', color)}>{text}</p>
                  </div>
                ))}

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Usefulness</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetUsefulness(true)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors',
                      usefulness === true
                        ? 'border-emerald-300/45 bg-emerald-500/18 text-emerald-100'
                        : 'border-white/15 bg-white/[0.02] text-white/65 hover:text-white'
                    )}
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Helpful
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetUsefulness(false)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors',
                      usefulness === false
                        ? 'border-rose-300/45 bg-rose-500/18 text-rose-100'
                        : 'border-white/15 bg-white/[0.02] text-white/65 hover:text-white'
                    )}
                  >
                    <ThumbsDown className="h-3 w-3" />
                    Not useful
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
