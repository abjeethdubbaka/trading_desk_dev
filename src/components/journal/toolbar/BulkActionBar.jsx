import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export function BulkActionBar({
  count,
  selectedTrades,
  onDelete,
  onBulkMarkPlan,
  onClear,
}) {
  const [confirm, confirmDialog] = useConfirm();

  if (count === 0) return null;

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Delete ${count} trade${count !== 1 ? 's' : ''}?`,
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    onDelete(selectedTrades.map((t) => t.id));
  };

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-2 px-3 py-2',
      'bg-cyan-950/60 border border-cyan-500/20 rounded-lg',
      'animate-fade-in',
    )}>
      <span className="text-xs font-semibold text-cyan-300 mr-1">
        {count} selected
      </span>

      <Button
        size="sm"
        variant="ghost"
        onClick={handleDelete}
        className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => onBulkMarkPlan(selectedTrades, true)}
        className="h-7 text-xs text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        Followed Plan
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => onBulkMarkPlan(selectedTrades, false)}
        className="h-7 text-xs text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5"
      >
        <XCircle className="w-3.5 h-3.5" />
        Plan Violation
      </Button>

      <button
        type="button"
        onClick={onClear}
        className="ml-auto p-1.5 rounded text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
        title="Clear selection"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {confirmDialog}
    </div>
  );
}
