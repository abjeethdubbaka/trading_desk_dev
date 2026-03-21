import React, { useState, useMemo } from 'react';
import { CheckSquare, Square, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULTS = [
  'Stop loss is set before entry',
  'Position size follows my risk rules',
  'Setup matches my defined criteria',
  'Not trading out of FOMO or revenge',
  'Clear profit target defined',
];

export default function PreTradeChecklist({ onAllChecked }) {
  const rules = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('dosAndDonts') || '[]');
      const high = raw.filter((r) => r.priority === 'high' && r.type === 'do').slice(0, 5);
      return high.length >= 3 ? high.map((r) => r.title) : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  }, []);

  const [checked, setChecked] = useState(() => rules.map(() => false));
  const allDone = checked.every(Boolean);
  const doneCt = checked.filter(Boolean).length;
  const pct = Math.round(doneCt / rules.length * 100);

  const toggle = (i) => {
    const next = checked.map((c, idx) => (idx === i ? !c : c));
    setChecked(next);
    if (next.every(Boolean)) onAllChecked?.();
  };

  return (
    <div className={cn('rounded-xl border p-4 space-y-3 transition-all duration-300', allDone ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-[#13131e] border-white/8')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {allDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400/70" />}
          <p className={cn('text-xs font-semibold uppercase tracking-wider', allDone ? 'text-emerald-400' : 'text-white/50')}>Pre-trade checklist</p>
        </div>
        <span className={cn('text-xs font-mono font-bold', allDone ? 'text-emerald-400' : 'text-white/40')}>{doneCt}/{rules.length}</span>
      </div>

      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', allDone ? 'bg-emerald-500' : 'bg-amber-400')} style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-2">
        {rules.map((rule, i) => (
          <button key={i} onClick={() => toggle(i)} className="flex items-start gap-2.5 w-full text-left group">
            {checked[i]
              ? <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              : <Square className="w-4 h-4 text-white/25 group-hover:text-white/50 flex-shrink-0 mt-0.5 transition-colors" />}
            <span className={cn('text-xs leading-relaxed transition-colors', checked[i] ? 'text-white/35 line-through' : 'text-white/65 group-hover:text-white/85')}>
              {rule}
            </span>
          </button>
        ))}
      </div>

      {allDone
        ? <p className="text-[10px] text-emerald-400/80">✓ All checks passed — you can add to journal</p>
        : <p className="text-[10px] text-amber-400/60 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Complete all items before adding to journal</p>}
    </div>
  );
}
