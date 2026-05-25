import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/general';
import { useDisciplineCoachAI } from '@/lib/ai/hooks/useDisciplineCoachAI';
import DailyGoalBar from '@/components/dashboard/DailyGoalBar';

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

const ALERT_STYLE = {
  positive: 'border-emerald-500/20 bg-emerald-500/8 text-emerald-300/90',
  focus: 'border-blue-500/20 bg-blue-500/8 text-blue-300/90',
  warning: 'border-amber-500/20 bg-amber-500/8 text-amber-300/90',
};

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[10px] text-white/35 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-white/85 mt-0.5">{value}</p>
    </div>
  );
}

export default function DisciplineCoachCard({
  snapshot,
  dailyGoal = null,
}) {
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

  const {
    planAdherencePct,
    todayTrades,
    maxDailyTrades,
    lossUsedPct,
    currentLossStreak,
  } = snapshot.metrics;

  return (
    <div className={cn('rounded-xl border px-4 py-3 space-y-3', style.card)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Discipline Coach</p>
        </div>

        <div className="text-right">
          <p className={cn('text-2xl font-bold leading-none', style.score)}>{snapshot.score}</p>
          <p className="text-[10px] text-white/40 mt-1">discipline score</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className={cn('inline-flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1', style.badge)}>
          <StatusIcon className="w-3.5 h-3.5" />
          {style.label}
        </div>
        <div className="flex items-center gap-2">
          {aiEnabled && (
            <button
              type="button"
              onClick={refreshAI}
              disabled={aiLoading}
              title="Refresh AI coaching"
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors"
            >
              {aiLoading ? (
                <Loader2 className="w-3.5 h-3.5 text-white/60 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-white/60" />
              )}
            </button>
          )}
          <div className="text-[10px] text-white/35">Alerts are guidance only (not blocking)</div>
        </div>
      </div>

      {dailyGoal ? (
        <DailyGoalBar
          todayPnL={dailyGoal.todayPnL}
          targetProfit={dailyGoal.targetProfit}
          maxDailyLoss={dailyGoal.maxDailyLoss}
          embedded
        />
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Plan Adherence" value={`${planAdherencePct.toFixed(0)}%`} />
        <Metric
          label="Trades Today"
          value={maxDailyTrades > 0 ? `${todayTrades}/${maxDailyTrades}` : `${todayTrades}`}
        />
        <Metric label="Loss Limit Used" value={`${Math.min(100, lossUsedPct).toFixed(0)}%`} />
        <Metric label="Loss Streak" value={`${currentLossStreak}`} />
      </div>

      <div className="space-y-2">
        {visibleAlerts.slice(0, 3).map((alert, idx) => (
          <div
            key={`${alert.title}-${idx}`}
            className={cn('rounded-lg border px-3 py-2', ALERT_STYLE[alert.type] || ALERT_STYLE.focus)}
          >
            <p className="text-xs font-semibold">{alert.title}</p>
            <p className="text-xs mt-0.5 opacity-90">{alert.message}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-[#101018] px-3 py-2">
        <p className="text-[10px] text-white/35 uppercase tracking-wide mb-1">Next Best Action</p>
        <div className="space-y-1.5">
          {visibleActions.slice(0, 2).map((action, idx) => (
            <div key={`${action}-${idx}`} className="flex items-start gap-1.5 text-xs text-white/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


