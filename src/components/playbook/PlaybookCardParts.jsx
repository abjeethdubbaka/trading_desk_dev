import React from 'react';
import { Copy, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/general';

export function MetricsPill({ label, value }) {
  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/95">{value}</p>
    </div>
  );
}

export function PlaybookCardActions({
  entry,
  onEdit,
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

export function TriggerSpecPanel({ triggerSpec, setupStats }) {
  const textRows = [
    ['Entry Trigger', triggerSpec?.entry_trigger],
    ['Trigger Level', triggerSpec?.trigger_level],
    ['Trigger Event', triggerSpec?.trigger_event],
    ['Order', triggerSpec?.order],
    ['Abort If', triggerSpec?.abort_if],
  ].filter(([, value]) => value);

  const hasExpiry = Number.isFinite(triggerSpec?.expiry_bars);
  const hasTriggerSpecContent = textRows.length > 0 || hasExpiry;

  // Loss (R) / Win Rate come from this setup's real trade history; fall back
  // to the manually-typed target values (legacy/imported data) until there's
  // enough history. Shown as "no trades yet" rather than hidden — the fields
  // are always present so it's clear they populate once trades are logged.
  const hasActualStats = Boolean(setupStats && setupStats.trades > 0);
  const actualLossR = Number.isFinite(setupStats?.avgLossR) ? Math.abs(setupStats.avgLossR) : null;
  const lossR = hasActualStats && actualLossR != null ? actualLossR : triggerSpec?.loss_r;
  const winRate = hasActualStats ? setupStats.winRate : triggerSpec?.win_rate;
  const isLossActual = hasActualStats && actualLossR != null;

  // Only surface the Loss/Win Rate placeholders for setups that actually use
  // this feature (Trigger Spec filled in, or trades already logged against it) —
  // otherwise every untouched Playbook entry would show a noisy "no trades yet".
  const showPerformancePills = hasTriggerSpecContent || hasActualStats;
  if (!showPerformancePills) return null;

  const statPills = [
    hasExpiry ? ['Expiry', `${triggerSpec.expiry_bars} bars`] : null,
    ['Loss', Number.isFinite(lossR) ? `${lossR}R${isLossActual ? ' actual' : ''}` : 'no trades yet'],
    ['Win Rate', Number.isFinite(winRate) ? `${winRate}%${hasActualStats ? ' actual' : ''}` : 'no trades yet'],
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.13em] text-white/45">Trigger Spec</p>
      {textRows.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {textRows.map(([label, value]) => (
            <p key={label} className="text-xs text-white/85">
              <span className="text-white/45">{label}:</span> {value}
            </p>
          ))}
        </div>
      )}
      {statPills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {statPills.map(([label, value]) => (
            <span key={label} className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/70">
              {label}: <span className="font-semibold text-white/90">{value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function CriteriaSection({ label, items = [], icon: Icon, toneClassName }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className={cn('flex items-center gap-1.5 text-[10px] uppercase tracking-[0.13em]', toneClassName)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="mt-1.5 space-y-1">
        {items.map((item) => (
          <p key={`${label}-${item}`} className="flex items-start gap-2 text-xs text-white/85">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-white/45" />
            <span>{item}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
