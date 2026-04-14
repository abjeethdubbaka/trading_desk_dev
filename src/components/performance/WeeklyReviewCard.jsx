import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/general';
import InfoHint from '@/components/ui/InfoHint';
import { buildEquityCurve, calcCoreStats, calcMaxDrawdown } from '@/lib/calculations/trades';

const formatMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return `${numeric >= 0 ? '+' : '-'}$${Math.abs(numeric).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
};

const formatDeltaMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'n/a';
  return `${numeric >= 0 ? '+' : '-'}$${Math.abs(numeric).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
};

function DeltaBadge({ value, format = (v) => v, higherIsBetter = true }) {
  if (!Number.isFinite(Number(value))) {
    return <span className="text-[10px] text-white/35">vs prior: n/a</span>;
  }

  const numeric = Number(value);
  const isPositive = higherIsBetter ? numeric >= 0 : numeric <= 0;

  return (
    <span className={cn('text-[10px] font-medium', isPositive ? 'text-emerald-300/90' : 'text-rose-300/90')}>
      vs prior: {format(numeric)}
    </span>
  );
}

function Metric({ label, value, valueClassName = 'text-white', delta, deltaFormat, higherIsBetter = true }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className={cn('mt-1 font-mono text-sm font-semibold', valueClassName)}>{value}</p>
      <div className="mt-1">
        <DeltaBadge value={delta} format={deltaFormat} higherIsBetter={higherIsBetter} />
      </div>
    </div>
  );
}

const isValidTradeDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const WEEKLY_REVIEW_STORAGE_KEY = 'weeklyReview.workflow.v1';
const EMPTY_WORKFLOW = Object.freeze({
  wins: '',
  improvements: '',
  nextFocus: '',
  completed: false,
  completedAt: '',
  updatedAt: '',
});

function getIsoWeekKey(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function readWorkflowStore() {
  if (typeof window === 'undefined') return {};

  try {
    const parsed = JSON.parse(localStorage.getItem(WEEKLY_REVIEW_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveWorkflowStore(store) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WEEKLY_REVIEW_STORAGE_KEY, JSON.stringify(store));
}

function toWorkflowEntry(value = {}) {
  return {
    wins: String(value.wins || ''),
    improvements: String(value.improvements || ''),
    nextFocus: String(value.nextFocus || ''),
    completed: Boolean(value.completed),
    completedAt: String(value.completedAt || ''),
    updatedAt: String(value.updatedAt || ''),
  };
}

function getCompletedHistory(store = {}, currentWeekKey = '') {
  return Object.entries(store)
    .filter(([weekKey, entry]) => weekKey !== currentWeekKey && entry?.completed)
    .map(([weekKey, entry]) => ({
      weekKey,
      ...toWorkflowEntry(entry),
    }))
    .sort((left, right) => Date.parse(right.updatedAt || 0) - Date.parse(left.updatedAt || 0))
    .slice(0, 6);
}

export default function WeeklyReviewCard({ reviews = [], trades = [], initialBalance = 50000 }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentWeekKey = useMemo(() => getIsoWeekKey(), []);
  const [workflow, setWorkflow] = useState(EMPTY_WORKFLOW);
  const [completedHistory, setCompletedHistory] = useState([]);

  const normalized = Array.isArray(reviews) ? reviews : [];
  const monthReview = useMemo(() => {
    const sourceTrades = Array.isArray(trades) ? trades : [];
    if (sourceTrades.length === 0) return null;

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    const current = sourceTrades.filter((trade) => {
      const rawDate = trade?.entry_time || trade?.created_date;
      if (!rawDate || !isValidTradeDate(rawDate)) return false;
      return new Date(rawDate) >= oneMonthAgo;
    });

    if (current.length === 0) return null;

    const prior = sourceTrades.filter((trade) => {
      const rawDate = trade?.entry_time || trade?.created_date;
      if (!rawDate || !isValidTradeDate(rawDate)) return false;
      const date = new Date(rawDate);
      return date >= twoMonthsAgo && date < oneMonthAgo;
    });

    const currentStats = calcCoreStats(current);
    const priorStats = calcCoreStats(prior);
    const currentDD = Math.abs(calcMaxDrawdown(buildEquityCurve(current, initialBalance)));
    const priorDD = Math.abs(calcMaxDrawdown(buildEquityCurve(prior, initialBalance)));
    const hasPrior = prior.length > 0;

    return {
      currentTrades: current.length,
      priorTrades: prior.length,
      currentStats,
      priorStats,
      currentDD,
      priorDD,
      deltas: {
        pnl: hasPrior ? currentStats.totalPnL - priorStats.totalPnL : null,
        winRate: hasPrior ? currentStats.winRate - priorStats.winRate : null,
        avgR: hasPrior ? currentStats.avgR - priorStats.avgR : null,
        drawdown: hasPrior ? currentDD - priorDD : null,
      },
    };
  }, [initialBalance, trades]);

  useEffect(() => {
    const store = readWorkflowStore();
    setWorkflow(toWorkflowEntry(store[currentWeekKey]));
    setCompletedHistory(getCompletedHistory(store, currentWeekKey));
  }, [currentWeekKey]);

  const saveWorkflow = (markCompleted = false) => {
    const nextWorkflow = {
      ...workflow,
      completed: markCompleted ? true : workflow.completed,
      completedAt: markCompleted ? new Date().toISOString() : workflow.completedAt,
      updatedAt: new Date().toISOString(),
    };

    const store = readWorkflowStore();
    store[currentWeekKey] = nextWorkflow;
    saveWorkflowStore(store);

    setWorkflow(nextWorkflow);
    setCompletedHistory(getCompletedHistory(store, currentWeekKey));

    toast.success(markCompleted ? 'Weekly review marked complete' : 'Weekly review saved');
  };

  if (normalized.length === 0 && !monthReview) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-white/8 bg-[#13131e] p-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-white/5"
        >
          <p className="text-sm font-semibold text-white">Review</p>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-white/55" />
          ) : (
            <ChevronRight className="h-4 w-4 text-white/55" />
          )}
        </button>
        <InfoHint text="This month vs last month plus 7D/14D performance versus prior matching periods." />
      </div>

      {isOpen ? (
        <>
          {monthReview ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  This month vs last month
                </p>
                <p className="text-[10px] text-white/40">
                  {monthReview.currentTrades} trades now | {monthReview.priorTrades} prior
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <Metric
                  label="Win rate"
                  value={`${Number(monthReview?.currentStats?.winRate ?? 0).toFixed(1)}%`}
                  valueClassName={
                    Number(monthReview?.currentStats?.winRate ?? 0) >= 50 ? 'text-emerald-300' : 'text-amber-300'
                  }
                  delta={monthReview?.deltas?.winRate}
                  deltaFormat={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
                />
                <Metric
                  label="Avg R"
                  value={`${Number(monthReview?.currentStats?.avgR ?? 0).toFixed(2)}R`}
                  valueClassName={Number(monthReview?.currentStats?.avgR ?? 0) >= 1 ? 'text-cyan-300' : 'text-amber-300'}
                  delta={monthReview?.deltas?.avgR}
                  deltaFormat={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}R`}
                />
                <Metric
                  label="P&L"
                  value={formatMoney(monthReview?.currentStats?.totalPnL)}
                  valueClassName={(monthReview?.currentStats?.totalPnL ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}
                  delta={monthReview?.deltas?.pnl}
                  deltaFormat={formatDeltaMoney}
                />
                <Metric
                  label="Max drawdown"
                  value={`-$${Math.abs(monthReview?.currentDD ?? 0).toFixed(0)}`}
                  valueClassName="text-amber-300"
                  delta={monthReview?.deltas?.drawdown}
                  deltaFormat={(value) => `${value >= 0 ? '+' : ''}$${Math.abs(value).toFixed(0)}`}
                  higherIsBetter={false}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2.5">
            {normalized.map((review) => {
              const currentTop = review?.topSetup?.current;
              const priorTop = review?.topSetup?.prior;
              return (
                <div key={`weekly-review-${review.days}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                      {review.days}D vs prior {review.days}D
                    </p>
                    <p className="text-[10px] text-white/40">
                      {review.currentTrades} trades now | {review.priorTrades} prior
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Metric
                      label="P&L"
                      value={formatMoney(review?.currentStats?.totalPnL)}
                      valueClassName={(review?.currentStats?.totalPnL ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}
                      delta={review?.deltas?.pnl}
                      deltaFormat={formatDeltaMoney}
                    />
                    <Metric
                      label="Win rate"
                      value={`${Number(review?.currentStats?.winRate ?? 0).toFixed(1)}%`}
                      valueClassName={Number(review?.currentStats?.winRate ?? 0) >= 50 ? 'text-emerald-300' : 'text-amber-300'}
                      delta={review?.deltas?.winRate}
                      deltaFormat={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
                    />
                    <Metric
                      label="Avg R"
                      value={`${Number(review?.currentStats?.avgR ?? 0).toFixed(2)}R`}
                      valueClassName={Number(review?.currentStats?.avgR ?? 0) >= 1 ? 'text-cyan-300' : 'text-amber-300'}
                      delta={review?.deltas?.avgR}
                      deltaFormat={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}R`}
                    />
                  </div>

                  <div className="mt-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">Top setup</p>
                    <p className="mt-1 text-xs text-white/80">
                      {currentTop?.setup ? (
                        <>
                          <span className="font-semibold text-white">{currentTop.setup}</span>
                          <span className="text-white/55"> ({formatMoney(currentTop.totalPnL)})</span>
                        </>
                      ) : 'No setup data in current window'}
                    </p>
                    <p className="mt-1 text-[11px] text-white/50">
                      Prior: {priorTop?.setup ? `${priorTop.setup} (${formatMoney(priorTop.totalPnL)})` : 'n/a'}
                      {review?.topSetup?.changed ? ' | setup leadership changed' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                Weekly Workflow ({currentWeekKey})
              </p>
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
                  workflow.completed
                    ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-200'
                    : 'border-amber-300/35 bg-amber-500/12 text-amber-200'
                )}
              >
                {workflow.completed ? 'Complete' : 'In progress'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              <label className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">Biggest Wins</span>
                <textarea
                  value={workflow.wins}
                  onChange={(event) => setWorkflow((prev) => ({ ...prev, wins: event.target.value }))}
                  placeholder="What worked best this week?"
                  className="min-h-[90px] w-full resize-none rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-emerald-300/45"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">Main Improvements</span>
                <textarea
                  value={workflow.improvements}
                  onChange={(event) => setWorkflow((prev) => ({ ...prev, improvements: event.target.value }))}
                  placeholder="Where did execution break down?"
                  className="min-h-[90px] w-full resize-none rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-emerald-300/45"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.14em] text-white/40">Next Week Focus</span>
                <textarea
                  value={workflow.nextFocus}
                  onChange={(event) => setWorkflow((prev) => ({ ...prev, nextFocus: event.target.value }))}
                  placeholder="1-3 non-negotiable process goals"
                  className="min-h-[90px] w-full resize-none rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-emerald-300/45"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => saveWorkflow(false)}
                className="rounded-lg border border-cyan-300/35 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => saveWorkflow(true)}
                className="rounded-lg border border-emerald-300/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25"
              >
                Mark Week Complete
              </button>
              {workflow.updatedAt ? (
                <span className="text-[11px] text-white/45">
                  Last updated: {new Date(workflow.updatedAt).toLocaleString()}
                </span>
              ) : null}
            </div>

            {completedHistory.length > 0 ? (
              <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Recent completed weeks</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {completedHistory.map((item) => (
                    <span
                      key={`completed-${item.weekKey}`}
                      className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200"
                    >
                      {item.weekKey}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
