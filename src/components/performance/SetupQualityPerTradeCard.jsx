import React, { useMemo } from 'react';
import { cn } from '@/lib/utils/general';
import InfoHint from '@/components/ui/InfoHint';
import { computeTradeSetupQuality } from '@/lib/calculations/trades';

const toTradeDate = (trade) => {
  const raw = trade?.entry_time ?? trade?.created_date ?? trade?.created_at;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (trade) => {
  const date = toTradeDate(trade);
  if (!date) return '--';
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export default function SetupQualityPerTradeCard({ trades = [], riskLimit = null }) {
  const rows = useMemo(() => {
    const sorted = [...(Array.isArray(trades) ? trades : [])].sort((a, b) => {
      const aDate = toTradeDate(a)?.getTime() ?? 0;
      const bDate = toTradeDate(b)?.getTime() ?? 0;
      return bDate - aDate;
    });

    return sorted.slice(0, 10).map((trade) => {
      const quality = computeTradeSetupQuality(trade, { riskLimit });
      const score = Number.isFinite(quality?.score) ? Math.round(quality.score) : null;
      return {
        id: trade?.id || `${trade?.symbol}-${trade?.entry_time}`,
        trade,
        score,
        grade: quality?.grade || trade?.setup_grade || null,
        breakdown: quality?.breakdown || {},
      };
    });
  }, [riskLimit, trades]);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-white/8 bg-[#13131e] p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-white">Setup Quality Per Trade</p>
        <InfoHint text="Auto-score combines strategy steps, plan adherence, and risk compliance." />
      </div>

      <div className="space-y-1.5">
        {rows.map(({ id, trade, score, grade, breakdown }) => (
          <div
            key={id}
            className="grid grid-cols-[68px_minmax(0,1fr)_90px] items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-2"
          >
            <div className="text-[11px] text-white/55">
              <p>{formatDate(trade)}</p>
              <p className="mt-0.5 font-mono text-white/40">{trade?.symbol || '--'}</p>
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs text-white/80">{trade?.setup_type || 'Unknown setup'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-white/50">
                <span>
                  Steps: {breakdown?.stepsFollowed ?? 0}/{breakdown?.stepsTotal ?? 0}
                </span>
                <span>
                  Plan: {breakdown?.followedPlan === true ? 'Y' : breakdown?.followedPlan === false ? 'N' : '--'}
                </span>
                <span
                  className={cn(
                    breakdown?.riskCompliant === false
                      ? 'text-rose-300/80'
                      : breakdown?.riskCompliant === true
                        ? 'text-emerald-300/80'
                        : 'text-white/50'
                  )}
                >
                  Risk:{' '}
                  {breakdown?.riskCompliant === false
                    ? 'Off'
                    : breakdown?.riskCompliant === true
                      ? 'OK'
                      : '--'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className={cn('font-mono text-base font-bold', score != null ? 'text-cyan-300' : 'text-white/40')}>
                {score != null ? `${score}` : '--'}
              </p>
              <p className="text-[10px] text-white/45">{grade || 'No grade'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
