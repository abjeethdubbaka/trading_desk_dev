import React from 'react';
import { BrainCircuit, RefreshCw } from 'lucide-react';
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
  const { scorecard, refresh } = useLearningLoopScorecard();
  const models = Array.isArray(scorecard?.by_model) ? scorecard.by_model.slice(0, 3) : [];
  const hasData = Number(scorecard?.total_reviews) > 0;

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#13131e] p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-200">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Model Scorecard</p>
            <p className="text-[10px] text-white/40">Learning loop from reviewed trades</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/60"
          onClick={refresh}
          title="Refresh scorecard"
        >
          <RefreshCw className="h-3.5 w-3.5" />
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
  );
}
