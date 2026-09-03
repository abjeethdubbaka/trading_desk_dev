import React from 'react';
import { cn } from '@/lib/utils/general';
import { getTradeNotesText } from '../utils/notes';

const FIELDS = [
  { key: 'stop_loss',  label: 'Stop',   check: (t) => t.stop_loss != null },
  { key: 'setup_type', label: 'Setup',  check: (t) => Boolean(String(t.setup_type || '').trim()) },
  { key: 'notes',      label: 'Notes',  check: (t) => Boolean(getTradeNotesText(t)) },
  { key: 'emotions',   label: 'Mood',   check: (t) => Array.isArray(t.emotions) && t.emotions.filter(Boolean).length > 0 },
];

export function TradeCompleteness({ trade }) {
  if (!trade) return null;
  const filled = FIELDS.filter((f) => f.check(trade)).length;
  const all = FIELDS.length;
  const isComplete = filled === all;
  const title = FIELDS.map((f) => `${f.label}: ${f.check(trade) ? '✓' : '✗'}`).join(' | ');

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5',
        isComplete
          ? 'border-emerald-400/30 bg-emerald-500/10'
          : filled >= 2
          ? 'border-amber-400/25 bg-amber-500/[0.08]'
          : 'border-white/12 bg-white/[0.04]',
      )}
      title={title}
    >
      <div className="flex items-center gap-[3px]">
        {FIELDS.map((f) => (
          <div
            key={f.key}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              f.check(trade) ? 'bg-emerald-400' : 'bg-white/20',
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          'text-[10px] font-semibold tabular-nums leading-none',
          isComplete ? 'text-emerald-300' : filled >= 2 ? 'text-amber-300' : 'text-white/35',
        )}
      >
        {filled}/{all}
      </span>
    </div>
  );
}
