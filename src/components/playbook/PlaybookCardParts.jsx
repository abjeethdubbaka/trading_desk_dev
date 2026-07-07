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
