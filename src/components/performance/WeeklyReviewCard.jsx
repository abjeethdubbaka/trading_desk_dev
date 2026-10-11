import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/general';
import {
  EMPTY_WORKFLOW,
  getIsoWeekKey,
  readWorkflowStore,
  saveWorkflowStore,
  toWorkflowEntry,
} from '@/lib/review/weeklyWorkflow';

const money = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return `${numeric >= 0 ? '+' : '-'}$${Math.abs(numeric).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

/** One window, on one line: how it went, and how that compares to before. */
function PeriodRow({ review }) {
  const pnl = Number(review?.currentStats?.totalPnL ?? 0);
  const winRate = Number(review?.currentStats?.winRate ?? 0);
  const avgR = Number(review?.currentStats?.avgR ?? 0);
  const pnlDelta = Number(review?.deltas?.pnl);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <span className="w-12 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {review.days}D
      </span>
      <span className={cn('font-mono text-sm font-semibold', pnl >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
        {money(pnl)}
      </span>
      <span className="font-mono text-xs text-white/60">{winRate.toFixed(0)}% WR</span>
      <span className="font-mono text-xs text-white/60">{avgR.toFixed(2)}R avg</span>
      <span className="text-[11px] text-white/30">{review.currentTrades} trades</span>
      {Number.isFinite(pnlDelta) && (
        <span className={cn('ml-auto text-[11px]', pnlDelta >= 0 ? 'text-emerald-300/80' : 'text-rose-300/80')}>
          {money(pnlDelta)} vs prior
        </span>
      )}
    </div>
  );
}

function Box({ label, value, placeholder, onChange }) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] w-full resize-none rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-emerald-300/45"
      />
    </label>
  );
}

/**
 * The week in one card: how it went, and what to carry into the next one.
 * Deliberately short — a review nobody finishes is a review nobody reads,
 * and the only output that leaves this card is the focus, which rolls in the
 * banner all week.
 */
export default function WeeklyReviewCard({ reviews = [] }) {
  const currentWeekKey = useMemo(() => getIsoWeekKey(), []);
  const [workflow, setWorkflow] = useState(EMPTY_WORKFLOW);

  const periods = Array.isArray(reviews) ? reviews : [];

  useEffect(() => {
    setWorkflow(toWorkflowEntry(readWorkflowStore()[currentWeekKey]));
  }, [currentWeekKey]);

  const save = () => {
    const next = { ...workflow, updatedAt: new Date().toISOString() };
    const store = readWorkflowStore();
    store[currentWeekKey] = next;
    saveWorkflowStore(store);
    setWorkflow(next);
    toast.success('Weekly review saved');
  };

  const setField = (field) => (value) => setWorkflow((prev) => ({ ...prev, [field]: value }));

  if (periods.length === 0) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-white/8 bg-[#13131e] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Review</p>
        <span className="text-[11px] text-white/35">{currentWeekKey}</span>
      </div>

      <div className="space-y-1.5">
        {periods.map((review) => (
          <PeriodRow key={`weekly-review-${review.days}`} review={review} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        <Box
          label="What worked"
          value={workflow.wins}
          placeholder="Kept the plan on the open"
          onChange={setField('wins')}
        />
        <Box
          label="What broke"
          value={workflow.improvements}
          placeholder="Sized up after a loss"
          onChange={setField('improvements')}
        />
        <Box
          label="Focus next week"
          value={workflow.nextFocus}
          placeholder="One goal per line — these roll in the banner all week"
          onChange={setField('nextFocus')}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="rounded-lg border border-emerald-300/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25"
        >
          Save
        </button>
        {workflow.updatedAt ? (
          <span className="text-[11px] text-white/35">
            Saved {new Date(workflow.updatedAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>
    </div>
  );
}
