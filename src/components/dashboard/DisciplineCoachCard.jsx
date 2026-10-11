import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { useDisciplineCoachAI } from '@/lib/ai/hooks/useDisciplineCoachAI';

const STATUS_STYLE = {
  'on-track': {
    label: 'On Track',
    card: 'border-emerald-500/25 bg-emerald-500/5',
    badge: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    score: 'text-emerald-400',
    icon: ShieldCheck,
  },
  watch: {
    label: 'Watch',
    card: 'border-amber-500/25 bg-amber-500/5',
    badge: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
    score: 'text-amber-400',
    icon: ShieldAlert,
  },
  'at-risk': {
    label: 'At Risk',
    card: 'border-red-500/25 bg-red-500/5',
    badge: 'text-red-300 bg-red-500/15 border-red-500/30',
    score: 'text-red-400',
    icon: AlertTriangle,
  },
};

const ALERT_DOT = {
  positive: 'bg-emerald-400',
  focus: 'bg-blue-400',
  warning: 'bg-amber-400',
};

/**
 * The discipline score and what to do about it. Today's trade count and loss
 * allowance are on the Today card, so this keeps to the verdict, the two
 * most pressing notes and the next action.
 */
export default function DisciplineCoachCard({ snapshot }) {
  const {
    aiEnabled,
    aiLoading,
    aiInsights,
    aiActions,
    refreshAI,
  } = useDisciplineCoachAI(snapshot);

  if (!snapshot) return null;

  const visibleAlerts = aiInsights.length ? aiInsights : snapshot.alerts;
  const visibleActions = aiActions.length ? aiActions : snapshot.actions;

  const style = STATUS_STYLE[snapshot.status] || STATUS_STYLE.watch;
  const StatusIcon = style.icon;
  const { planAdherencePct } = snapshot.metrics;

  return (
    <div className={cn('space-y-3 rounded-2xl border p-4', style.card)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Discipline</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]', style.badge)}>
              <StatusIcon className="h-3 w-3" />
              {style.label}
            </span>
            <span className="text-[11px] text-white/40">{planAdherencePct.toFixed(0)}% plan adherence</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {aiEnabled && (
            <button
              type="button"
              onClick={refreshAI}
              disabled={aiLoading}
              title="Refresh AI coaching"
              className="rounded-md bg-white/5 p-1.5 transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white/60" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-white/60" />
              )}
            </button>
          )}
          <div className="text-right">
            <p className={cn('font-mono text-3xl font-bold leading-none', style.score)}>{snapshot.score}</p>
            <p className="mt-1 text-[10px] text-white/35">score</p>
          </div>
        </div>
      </div>

      {visibleAlerts.length > 0 && (
        <ul className="space-y-2">
          {visibleAlerts.slice(0, 2).map((alert, idx) => (
            <li key={`${alert.title}-${idx}`} className="flex items-start gap-2">
              <span className={cn('mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full', ALERT_DOT[alert.type] || ALERT_DOT.focus)} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/85">{alert.title}</p>
                <p className="text-xs text-white/50">{alert.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {visibleActions.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-[#101018] px-3 py-2">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-white/35">Next best action</p>
          <div className="flex items-start gap-1.5 text-xs text-white/80">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
            <span>{visibleActions[0]}</span>
          </div>
        </div>
      )}
    </div>
  );
}
