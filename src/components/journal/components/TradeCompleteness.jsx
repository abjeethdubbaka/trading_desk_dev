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
  const title = FIELDS.map((f) => `${f.label}: ${f.check(trade) ? '✓' : '✗'}`).join(' | ');

  return (
    <div className="flex items-center gap-0.5" title={title}>
      {FIELDS.map((f) => (
        <div
          key={f.key}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors',
            f.check(trade) ? 'bg-emerald-400/70' : 'bg-white/15',
          )}
        />
      ))}
      <span className={cn(
        'ml-1 text-[9px] font-mono tabular-nums',
        filled === all ? 'text-emerald-400/60' : filled >= 2 ? 'text-amber-400/60' : 'text-white/30',
      )}>
        {filled}/{all}
      </span>
    </div>
  );
}
