import React, { useState } from 'react';
import { BrainCircuit, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearningLoopScorecard } from '@/lib/ai/hooks/useLearningLoopScorecard';

function formatPercent(value) {
  if (!Number.isFinite(Number(value))) return 'n/a';
  return `${Math.round(Number(value))}%`;
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white/90">{value}</p>
    </div>
  );
}

export default function AIModelScorecard() {
  const [collapsed, setCollapsed] = useState(true);
  const { scorecard, refresh } = useLearningLoopScorecard();
  const models = Array.isArray(scorecard?.by_model) ? scorecard.by_model.slice(0, 3) : [];
  const hasData = Number(scorecard?.total_reviews) > 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#0f1118] overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-white/30">
            <BrainCircuit className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-white/40">AI Model Scorecard</span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] uppercase tracking-widest text-white/25">
            Not in use
          </span>
        </div>
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5 text-white/25 flex-shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-white/25 flex-shrink-0" />
        }
      </button>

      {!collapsed && (
        <div className="space-y-3 px-4 pb-4">
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40"
              onClick={(e) => { e.stopPropagation(); refresh(); }}
              title="Refresh scorecard"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          {!hasData ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-xs text-white/55">
              Run AI review on trades in Journal to build model accuracy and usefulness metrics.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Accuracy" value={formatPercent(scorecard?.accuracy_pct)} />
                <Metric label="Usefulness" value={formatPercent(scorecard?.usefulness_pct)} />
                <Metric label="False Positives" value={formatPercent(scorecard?.false_positive_rate_pct)} />
                <Metric label="False Negatives" value={formatPercent(scorecard?.false_negative_rate_pct)} />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Samples</p>
                <p className="mt-1 text-sm font-semibold text-white/90">
                  {scorecard?.total_reviews || 0} reviews
                  <span className="ml-2 text-xs font-normal text-white/55">
                    ({scorecard?.comparable_reviews || 0} comparable)
                  </span>
                </p>
              </div>

              {models.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">By Model</p>
                  {models.map((modelStats) => (
                    <div
                      key={modelStats.model}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2"
                    >
                      <p className="truncate text-xs text-white/80">{modelStats.model}</p>
                      <div className="flex items-center gap-3 text-[11px] text-white/65">
                        <span>Acc {formatPercent(modelStats.accuracy_pct)}</span>
                        <span>Use {formatPercent(modelStats.usefulness_pct)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
