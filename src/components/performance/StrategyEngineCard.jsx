import React from 'react';
import { AlertTriangle, Ban, BrainCircuit, CheckCircle2 } from 'lucide-react';
import InfoHint from '@/components/ui/InfoHint';
import { cn } from '@/lib/utils/general';

const STATUS_META = {
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-emerald-200',
    border: 'border-emerald-400/25',
    bg: 'bg-emerald-500/10',
  },
  caution: {
    label: 'Caution',
    icon: AlertTriangle,
    color: 'text-amber-200',
    border: 'border-amber-400/25',
    bg: 'bg-amber-500/10',
  },
  avoid: {
    label: 'Avoid',
    icon: Ban,
    color: 'text-rose-200',
    border: 'border-rose-400/25',
    bg: 'bg-rose-500/10',
  },
};

function formatMoney(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  const sign = numeric > 0 ? '+' : numeric < 0 ? '-' : '';
  return `${sign}$${Math.abs(numeric).toFixed(0)}`;
}

function formatPF(value) {
  if (value === Infinity) return 'inf';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '--';
}

function SetupRow({ item, tone }) {
  if (!item) return null;
  const bestWindow = item?.bestWindow?.label || 'n/a';
  const bestFloat = item?.bestFloatRange?.label || 'n/a';

  return (
    <div className={cn('rounded-lg border px-3 py-2.5', tone.border, tone.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{item.setup}</p>
          <p className="text-[10px] text-white/55">
            {item.trades} trade{item.trades === 1 ? '' : 's'} | {item.winRate.toFixed(0)}% W
          </p>
        </div>
        <p className={cn('text-[11px] font-semibold', tone.color)}>
          {item.confidence}% conf
        </p>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-white/70">
        <p>Exp: {formatMoney(item.expectancy)}</p>
        <p>PF: {formatPF(item.profitFactor)}</p>
        <p>AvgR: {Number(item.avgR || 0).toFixed(2)}R</p>
      </div>

      <p className="mt-1 text-[10px] text-white/55">
        Best: {bestWindow} | {bestFloat}
      </p>
    </div>
  );
}

function StatusColumn({ title, tone, items }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className={cn('text-xs font-semibold uppercase tracking-[0.14em]', tone.color)}>
        {title}
      </p>
      <div className="mt-2 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/15 bg-black/20 px-3 py-4 text-center text-[11px] text-white/50">
            No setups in this bucket.
          </div>
        ) : (
          items.map((item) => (
            <SetupRow key={`${title}-${item.setup}`} item={item} tone={tone} />
          ))
        )}
      </div>
    </div>
  );
}

export default function StrategyEngineCard({ snapshot }) {
  const recommended = Array.isArray(snapshot?.recommendedSetups) ? snapshot.recommendedSetups.slice(0, 4) : [];
  const caution = Array.isArray(snapshot?.cautionSetups) ? snapshot.cautionSetups.slice(0, 3) : [];
  const avoid = Array.isArray(snapshot?.blockedSetups) ? snapshot.blockedSetups.slice(0, 3) : [];
  const recommendedNow = Array.isArray(snapshot?.recommendedNow) ? snapshot.recommendedNow : [];

  if (!snapshot || snapshot?.summary?.trackedSetups === 0) {
    return (
      <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-[#161423] to-[#10131b] p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          Strategy Engine
          <InfoHint text="Edge engine needs setup-tagged trade data to rank what to trade more, less, or not at all." />
        </h3>
        <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/55">
          Log setup-tagged trades to unlock strategy ranking.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-white/10 bg-gradient-to-br from-[#181427] to-[#10131b] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <BrainCircuit className="h-4 w-4 text-violet-200" />
            Strategy Engine
            <InfoHint text="Ranks setup edge by expectancy, win rate, profit factor, and sample size. Use this as your daily playbook filter." />
          </h3>
          <p className="mt-1 text-xs text-white/60">
            Active window: {snapshot?.activeWindow?.label || '--'} ({snapshot?.activeWindow?.hour || '--'})
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-right text-[11px] text-white/65">
          <p>{snapshot?.summary?.trackedSetups || 0} tracked setups</p>
          <p>{snapshot?.summary?.approved || 0} approved</p>
          <p>{snapshot?.summary?.avoid || 0} avoid</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2.5">
        <p className="text-[11px] uppercase tracking-[0.13em] text-violet-200/85">Recommended Now</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {recommendedNow.length > 0 ? (
            recommendedNow.map((item) => (
              <span
                key={`recommended-now-${item.setup}`}
                className="rounded-md border border-emerald-300/35 bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-100"
                title={`${item.setup} | Exp ${formatMoney(item.expectancy)} | ${item.winRate.toFixed(0)}% W`}
              >
                {item.setup}
              </span>
            ))
          ) : (
            <span className="text-xs text-white/60">No approved setups yet.</span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <StatusColumn title={STATUS_META.approved.label} tone={STATUS_META.approved} items={recommended} />
        <StatusColumn title={STATUS_META.caution.label} tone={STATUS_META.caution} items={caution} />
        <StatusColumn title={STATUS_META.avoid.label} tone={STATUS_META.avoid} items={avoid} />
      </div>
    </div>
  );
}

