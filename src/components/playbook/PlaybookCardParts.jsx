import React from 'react';
import { Copy, Eye, GitBranch, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/general';

export function PlaybookCardActions({
  entry,
  onEdit,
  onHistory,
  onDuplicate,
  onToggleActive,
  onMarkReviewed,
  onDelete,
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3.5">
      <Button
        size="sm"
        variant="ghost"
        className="h-8 border border-white/12 bg-white/[0.03] px-2.5 text-xs hover:bg-white/[0.08]"
        onClick={() => onEdit(entry)}
      >
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 border border-white/12 bg-white/[0.03] px-2.5 text-xs hover:bg-white/[0.08]"
        onClick={() => onHistory(entry)}
      >
        <GitBranch className="mr-1.5 h-3.5 w-3.5" />
        History
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 border border-white/12 bg-white/[0.03] px-2.5 text-xs hover:bg-white/[0.08]"
        onClick={() => onDuplicate(entry.id)}
      >
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        Duplicate
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 border border-white/12 bg-white/[0.03] px-2.5 text-xs hover:bg-white/[0.08]"
        onClick={() => onMarkReviewed(entry.id)}
      >
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        Reviewed
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          'h-8 px-2.5 text-xs',
          entry.is_active
            ? 'border border-amber-300/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20'
            : 'border border-emerald-300/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20'
        )}
        onClick={() => onToggleActive(entry.id)}
      >
        {entry.is_active ? 'Archive' : 'Activate'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 border border-rose-300/20 bg-rose-500/10 px-2.5 text-xs text-rose-200 hover:bg-rose-500/20 hover:text-rose-100"
        onClick={() => onDelete(entry.id)}
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Delete
      </Button>
    </div>
  );
}

export function ConditionsPanel({ conditions }) {
  const rows = [
    ['Structure', conditions?.structure],
    ['EMA Context', conditions?.ema_context],
    ['Volume', conditions?.volume],
    ['Market Context', conditions?.market_context],
    ['Time', conditions?.time],
    ['Entry Type', conditions?.entry_type],
  ].filter(([, value]) => value);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.13em] text-white/45">Setup Conditions</p>
      <div className="mt-1.5 space-y-1">
        {rows.map(([label, value]) => (
          <p key={label} className="text-xs text-white/85">
            <span className="text-white/45">{label}:</span> {value}
          </p>
        ))}
      </div>
    </div>
  );
}

const GRADE_STYLES = {
  a_plus: { label: 'A+', className: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300' },
  a: { label: 'A', className: 'border-cyan-500/25 bg-cyan-500/8 text-cyan-300' },
  b: { label: 'B', className: 'border-amber-500/25 bg-amber-500/8 text-amber-300' },
  c: { label: 'C', className: 'border-rose-500/25 bg-rose-500/8 text-rose-300' },
};

export function GradeCriteriaPanel({ gradeCriteria }) {
  const rows = ['a_plus', 'a', 'b', 'c']
    .map((key) => ({ key, value: gradeCriteria?.[key], ...GRADE_STYLES[key] }))
    .filter((row) => row.value);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.13em] text-white/45">Grade Criteria</p>
      <div className="mt-1.5 space-y-1.5">
        {rows.map(({ key, label, className, value }) => (
          <p key={key} className="flex items-start gap-2 text-xs text-white/85">
            <span className={cn('flex-shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold', className)}>{label}</span>
            <span>{value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function TriggerSpecPanel({ triggerSpec }) {
  const textRows = [
    ['Entry Trigger', triggerSpec?.entry_trigger],
    ['Trigger Level', triggerSpec?.trigger_level],
    ['Trigger Event', triggerSpec?.trigger_event],
    ['Order', triggerSpec?.order],
    ['Abort If', triggerSpec?.abort_if],
  ].filter(([, value]) => value);

  // Expiry / Loss / Win Rate / EV deliberately live on the Data Points page
  // only — this panel states how the setup is triggered, not how it performs.
  if (textRows.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.13em] text-white/45">Trigger Spec</p>
      <div className="mt-1.5 space-y-1">
        {textRows.map(([label, value]) => (
          <p key={label} className="text-xs text-white/85">
            <span className="text-white/45">{label}:</span> {value}
          </p>
        ))}
      </div>
    </div>
  );
}


export function CriteriaSection({ label, items = [], icon: Icon, toneClassName }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const rows = items.map((item) => (
    typeof item === 'string' ? { text: item, grade: '' } : { text: item?.text || '', grade: item?.grade || '' }
  )).filter((row) => row.text);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className={cn('flex items-center gap-1.5 text-[10px] uppercase tracking-[0.13em]', toneClassName)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <p key={`${label}-${row.text}`} className="flex items-start gap-2 text-xs text-white/85">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-white/45" />
            <span className="flex-1">{row.text}</span>
            {row.grade ? (
              <span className={cn(
                'flex-shrink-0 rounded border px-1 py-0 text-[9px] font-bold',
                row.grade === 'A+'
                  ? 'border-yellow-300/50 bg-gradient-to-r from-yellow-400/25 to-amber-400/15 text-yellow-200'
                  : 'border-white/15 bg-white/[0.06] text-white/70',
              )}>
                {row.grade}
              </span>
            ) : null}
          </p>
        ))}
      </div>
    </div>
  );
}
