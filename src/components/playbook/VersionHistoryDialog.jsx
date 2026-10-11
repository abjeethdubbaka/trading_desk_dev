import React, { useMemo, useState } from 'react';
import { GitBranch, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/general';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useTrades } from '@/lib/hooks/useTrades';
import { usePlaybookVersions } from '@/lib/hooks/usePlaybookVersions';
import {
  MIN_TRADES_FOR_VERSION_VERDICT,
  compareVersions,
  summarizeVersionPerformance,
} from '@/lib/playbook/versions';

const VERDICT_TONES = {
  better: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
  worse: 'border-rose-400/35 bg-rose-500/10 text-rose-200',
  similar: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  insufficient: 'border-white/12 bg-white/[0.04] text-white/45',
};

function formatWhen(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * A setup's rules over time, each version scored on the trades it actually
 * allowed. The comparison against the previous version is the point: it says
 * whether a rule change helped, rather than leaving every edit unjudged.
 */
export default function VersionHistoryDialog({ open, onOpenChange, entry, onRestore, isSaving }) {
  const { versions, isLoading } = usePlaybookVersions();
  const { data: trades = [] } = useTrades();
  const [confirm, confirmDialog] = useConfirm();
  const [restoringId, setRestoringId] = useState('');

  // Newest first — the live rules are what a trader checks most.
  const rows = useMemo(() => {
    const scored = summarizeVersionPerformance(trades, versions, entry?.id);
    return scored
      .map((row, index) => ({ ...row, verdict: compareVersions(row, scored[index - 1] || null) }))
      .reverse();
  }, [trades, versions, entry?.id]);

  const handleRestore = async (row) => {
    const shouldRestore = await confirm({
      title: `Restore v${row.version}?`,
      description: `${entry?.name} goes back to the rules it had on ${formatWhen(row.created_date)}. This is saved as a new version, so nothing in the history is lost.`,
      confirmLabel: `Restore v${row.version}`,
    });
    if (!shouldRestore) return;

    setRestoringId(row.id);
    try {
      await onRestore(row.snapshot);
      toast.success(`Restored the rules from v${row.version} as a new version`);
      onOpenChange(false);
    } catch (error) {
      toast.error(`Could not restore: ${error?.message || 'Unknown error'}`);
    } finally {
      setRestoringId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-cyan-300/80" />
            {entry?.name} — rule history
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" />Loading history…
          </div>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-8 text-center text-xs text-white/40">
            No versions recorded yet. The first one is written the next time this setup is saved, or when a trade is logged against it.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id || row.version}
                className={cn(
                  'rounded-xl border p-3',
                  row.isCurrent ? 'border-cyan-400/30 bg-cyan-500/[0.05]' : 'border-white/10 bg-white/[0.02]',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white/90">v{row.version}</span>
                    {row.isCurrent && (
                      <span className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-200">
                        live
                      </span>
                    )}
                    <span className="text-xs text-white/55">{row.summary}</span>
                    <span className="text-[10px] text-white/30">{formatWhen(row.created_date)}</span>
                  </div>

                  {!row.isCurrent && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-white/45 hover:text-white/80"
                      disabled={isSaving || Boolean(restoringId)}
                      onClick={() => handleRestore(row)}
                    >
                      {restoringId === row.id
                        ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Restoring…</>
                        : <><RotateCcw className="mr-1.5 h-3 w-3" />Restore</>}
                    </Button>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/65">
                    {row.trades} trade{row.trades === 1 ? '' : 's'}
                  </span>
                  {row.winRate != null && (
                    <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/65">
                      {row.winRate}% WR
                    </span>
                  )}
                  {row.avgR != null && (
                    <span className={cn(
                      'rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                      row.avgR > 0
                        ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                        : 'border-rose-400/25 bg-rose-500/10 text-rose-200',
                    )}>
                      {row.avgR > 0 ? '+' : ''}{row.avgR}R avg
                    </span>
                  )}
                  <span
                    className={cn('rounded border px-1.5 py-0.5 text-[10px] font-semibold', VERDICT_TONES[row.verdict.key])}
                    title={row.verdict.detail}
                  >
                    {row.verdict.label}
                  </span>
                </div>

                {row.changes.length > 0 && (
                  <p className="mt-1.5 text-[10px] text-white/35">
                    Changed: {row.changes.map((change) => change.label).join(', ')}
                  </p>
                )}
              </div>
            ))}

            <p className="pt-1 text-[11px] text-white/30">
              A version is judged once it has {MIN_TRADES_FOR_VERSION_VERDICT} trades. Restoring saves the old rules as a new version, so history is never rewritten.
            </p>
          </div>
        )}
        {confirmDialog}
      </DialogContent>
    </Dialog>
  );
}
