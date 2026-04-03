import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Info, Loader2, Pause, Play, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatAnalysisTimer, useAnalysisTimer } from '@/lib/context/AnalysisTimerContext';

const formatCurrency = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return `$${numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const formatPrice = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return `$${numeric.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
};

const formatPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return `${numeric.toFixed(2)}%`;
};

const formatNumber = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return numeric.toLocaleString();
};

const formatR = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  if (Number.isInteger(numeric)) return String(numeric);
  return numeric.toFixed(2).replace(/\.?0+$/, '');
};

const allocateExitShares = (levels = [], totalShares) => {
  const shareCount = Math.floor(Number(totalShares));
  if (!Array.isArray(levels) || levels.length === 0) return [];
  if (!Number.isFinite(shareCount) || shareCount <= 0) {
    return levels.map(() => null);
  }

  const totalPercent = levels.reduce((sum, level) => {
    const pct = Number(level?.percent);
    return sum + (Number.isFinite(pct) && pct > 0 ? pct : 0);
  }, 0);

  if (!Number.isFinite(totalPercent) || totalPercent <= 0) {
    let remaining = shareCount;
    return levels.map((_, index) => {
      const allocated = index === levels.length - 1
        ? remaining
        : Math.floor(shareCount / levels.length);
      remaining -= allocated;
      return Math.max(0, allocated);
    });
  }

  let remaining = shareCount;
  return levels.map((level, index) => {
    if (index === levels.length - 1) {
      return Math.max(0, remaining);
    }

    const pct = Number(level?.percent);
    const weight = Number.isFinite(pct) && pct > 0 ? pct / totalPercent : 0;
    const allocated = Math.max(0, Math.min(remaining, Math.floor(shareCount * weight)));
    remaining -= allocated;
    return allocated;
  });
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  return parsed.toLocaleString();
};

const formatElapsedLabel = (seconds) => `T+${formatAnalysisTimer(seconds)}`;

function MetricCard({ label, value, tone = 'default' }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 transition-colors hover:bg-black/35">
      <p className="text-[10px] uppercase tracking-[0.08em] text-white/50">{label}</p>
      <p className={cn(
        'mt-1 text-sm font-semibold',
        tone === 'success' ? 'text-emerald-300' : 'text-white'
      )}
      >
        {value}
      </p>
    </div>
  );
}

export function FloatSmartPlanCard({
  symbol,
  floatData,
  loadingFloat,
  smartFloatPlan,
  onRefreshShareFloat,
  onApplyFloatSmartPlan,
}) {
  const {
    hasStarted,
    isTimerRunning,
    isExpired,
    timerDurationSeconds,
    remainingSeconds,
    toggleTimer,
    resetTimer,
  } = useAnalysisTimer();
  const [showInfo, setShowInfo] = useState(false);
  const normalizedSymbol = String(symbol || '').trim().toUpperCase();
  if (!normalizedSymbol) return null;

  const hasFloatData = Boolean(smartFloatPlan?.hasFloatData);
  const recommendation = smartFloatPlan?.recommendations || {};
  const basis = smartFloatPlan?.basis || {};
  const guardrails = Array.isArray(smartFloatPlan?.guardrails) ? smartFloatPlan.guardrails : [];
  const exitLevels = Array.isArray(smartFloatPlan?.exitLevels) ? smartFloatPlan.exitLevels : [];
  const guidance = Array.isArray(smartFloatPlan?.guidance) ? smartFloatPlan.guidance : [];
  const dataSources = Array.isArray(floatData?.data_sources) ? floatData.data_sources : [];
  const timerButtonLabel = isTimerRunning
    ? 'Pause Timer'
    : isExpired
      ? 'Restart Timer'
      : hasStarted
        ? 'Resume Timer'
        : 'Start Timer';
  const riskSourceLabel = basis.riskSource === 'risk_amount'
    ? 'Risk Amount setting'
    : basis.riskSource === 'account_size x position_sizing_percent'
      ? 'Account Size x Position Sizing %'
      : 'risk settings';
  const stopSourceLabel = basis.stopSource?.startsWith('float category')
    ? `float profile (${smartFloatPlan?.float?.rangeLabel || smartFloatPlan?.float?.rangeKey || 'current bucket'})`
    : 'default stop setting';
  const sizeCapReasons = [
    basis.sizeCappedByPositionValue ? 'max position value' : null,
    basis.sizeCappedByFloat ? 'float liquidity limit' : null,
  ].filter(Boolean);
  const exitShareAllocations = allocateExitShares(exitLevels, recommendation.positionSize);
  const exitSegmentClasses = [
    'bg-cyan-400/85',
    'bg-emerald-400/85',
    'bg-blue-400/85',
    'bg-violet-400/85',
  ];
  const normalizedExitSegments = (() => {
    if (exitLevels.length === 0) return [];
    const rawPercents = exitLevels.map((level) => {
      const numericPercent = Number(level?.percent);
      return Number.isFinite(numericPercent) && numericPercent > 0 ? numericPercent : 0;
    });
    const totalPercent = rawPercents.reduce((sum, percent) => sum + percent, 0);
    const fallbackPercent = 100 / exitLevels.length;
    let accumulated = 0;

    return exitLevels.map((level, index) => {
      const isLast = index === exitLevels.length - 1;
      const computedPercent = totalPercent > 0
        ? (rawPercents[index] / totalPercent) * 100
        : fallbackPercent;
      const widthPercent = isLast
        ? Math.max(0, 100 - accumulated)
        : Math.max(0, computedPercent);
      const startPercent = accumulated;
      accumulated += widthPercent;

      return {
        level,
        index,
        widthPercent,
        centerPercent: startPercent + (widthPercent / 2),
      };
    });
  })();
  const elapsedSeconds = hasStarted
    ? Math.max(0, Number(timerDurationSeconds) - Number(remainingSeconds))
    : 0;
  const exitTimeCheckpoints = (() => {
    if (normalizedExitSegments.length === 0) return [];
    const totalDuration = Number.isFinite(Number(timerDurationSeconds)) && Number(timerDurationSeconds) > 0
      ? Number(timerDurationSeconds)
      : 0;

    let cumulativePercent = 0;
    return normalizedExitSegments.map((segment) => {
      cumulativePercent += segment.widthPercent;
      const checkpointElapsedSeconds = Math.round((totalDuration * cumulativePercent) / 100);
      const secondsToCheckpoint = Math.max(0, checkpointElapsedSeconds - elapsedSeconds);

      return {
        ...segment,
        checkpointElapsedSeconds,
        checkpointRemainingSeconds: Math.max(0, totalDuration - checkpointElapsedSeconds),
        secondsToCheckpoint,
        isReached: hasStarted && elapsedSeconds >= checkpointElapsedSeconds,
      };
    });
  })();
  const nextExitCheckpoint = exitTimeCheckpoints.find((checkpoint) => !checkpoint.isReached) || null;
  const activeExitCheckpointIndex = isTimerRunning && nextExitCheckpoint
    ? nextExitCheckpoint.index
    : null;
  const activeExitCheckpointCenter = activeExitCheckpointIndex == null
    ? null
    : exitTimeCheckpoints.find((checkpoint) => checkpoint.index === activeExitCheckpointIndex)?.centerPercent ?? null;
  const isActiveExitUrgent = Boolean(
    isTimerRunning
    && nextExitCheckpoint
    && nextExitCheckpoint.secondsToCheckpoint > 0
    && nextExitCheckpoint.secondsToCheckpoint <= 10
  );
  const activeTimeCue = (() => {
    if (exitTimeCheckpoints.length === 0) return null;

    if (!hasStarted) {
      return {
        tone: 'text-cyan-100/85',
        message: `Start timer on entry. First trim checkpoint is ${formatElapsedLabel(exitTimeCheckpoints[0].checkpointElapsedSeconds)}.`,
      };
    }

    if (isExpired) {
      return {
        tone: 'text-rose-200',
        message: 'Timer expired. Avoid waiting for extra move; protect capital by flattening or using a very tight trail.',
      };
    }

    if (!nextExitCheckpoint) {
      return {
        tone: 'text-emerald-200',
        message: 'All ladder checkpoints passed. Focus on protecting remaining gains with tight execution.',
      };
    }

    if (nextExitCheckpoint.secondsToCheckpoint <= 45) {
      return {
        tone: 'text-amber-200',
        message: `Checkpoint ${nextExitCheckpoint.index + 1} is due now (${formatElapsedLabel(nextExitCheckpoint.checkpointElapsedSeconds)}). If momentum is weak, tighten stop or reduce size.`,
      };
    }

    return {
      tone: 'text-cyan-100/85',
      message: `Next checkpoint: Tier ${nextExitCheckpoint.index + 1} by ${formatElapsedLabel(nextExitCheckpoint.checkpointElapsedSeconds)} (in ${formatAnalysisTimer(nextExitCheckpoint.secondsToCheckpoint)}).`,
    };
  })();
  const metricCards = [
    {
      label: 'Order Size',
      value: Number.isFinite(recommendation.positionSize) ? formatNumber(recommendation.positionSize) : '--',
    },
    { label: 'Entry', value: formatCurrency(recommendation.entryPrice) },
    { label: 'Stop Loss', value: formatCurrency(recommendation.stopPrice) },
    { label: 'Risk', value: formatCurrency(recommendation.riskAmount) },
    { label: 'Stop %', value: formatPercent(recommendation.stopLossPercent) },
    {
      label: 'Preferred R',
      value: Number.isFinite(recommendation.preferredR) ? `${recommendation.preferredR.toFixed(2)}R` : '--',
    },
    { label: 'Target', value: formatCurrency(recommendation.targetPrice) },
    { label: 'Total Price', value: formatCurrency(recommendation.positionValue) },
    { label: 'Total Profit', value: formatCurrency(recommendation.potentialProfit), tone: 'success' },
  ];
  const contextCards = [
    { label: 'Company', value: floatData?.company_name || '--' },
    { label: 'Market Cap', value: formatCurrency(floatData?.market_cap) },
    { label: 'Exchange', value: floatData?.exchange || '--' },
    { label: 'Sector', value: floatData?.sector || '--' },
  ];

  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/12 via-[#071724]/85 to-[#03232c]/95 px-4 py-4 shadow-[0_10px_30px_-16px_rgba(6,182,212,0.6)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100/95">
              Float Smart Risk & Exit
            </p>
            <span className="rounded-md border border-cyan-300/35 bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-100">
              {normalizedSymbol}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={toggleTimer}
              className="h-7 border-white/20 bg-white/5 px-2.5 text-[11px] hover:bg-white/10"
            >
              {isTimerRunning ? (
                <Pause className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Play className="mr-1.5 h-3.5 w-3.5" />
              )}
              {timerButtonLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetTimer}
              className="h-7 px-2 text-[11px] text-white/70 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Restart Timer
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <p className="text-cyan-100/90">
              {hasFloatData
                ? `${smartFloatPlan?.float?.rangeLabel || 'Float bucket'} | ${formatNumber(smartFloatPlan?.float?.shareFloat)} shares float`
                : 'Fetch share float to unlock smart sizing and exit guidance.'}
            </p>
          </div>
          {floatData?.error && (
            <p className="text-[10px] text-red-200/85">
              {floatData.error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRefreshShareFloat}
            disabled={loadingFloat}
            className="h-8 border border-white/15 bg-white/[0.04] px-2.5 text-[11px]"
          >
            {loadingFloat ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onApplyFloatSmartPlan}
            disabled={!smartFloatPlan?.canApply || !smartFloatPlan?.hasFloatData}
            className="h-8 px-2.5 text-[11px]"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Apply Plan
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {metricCards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            tone={card.tone}
          />
        ))}
      </div>

      {guardrails.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2.5">
          <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            Risk Guardrails
          </p>
          <div className="mt-1.5 space-y-1">
            {guardrails.map((hint, index) => (
              <p
                key={`guardrail-${index}`}
                className={cn(
                  'text-[11px]',
                  hint?.level === 'critical'
                    ? 'text-rose-200'
                    : hint?.level === 'warning'
                      ? 'text-amber-100'
                      : 'text-cyan-100/90'
                )}
              >
                - <span className="font-semibold">{hint?.title || 'Guardrail'}:</span>{' '}
                {hint?.message || 'Review this setup before applying.'}
              </p>
            ))}
          </div>
        </div>
      )}

      {(floatData?.company_name || floatData?.market_cap || floatData?.exchange || floatData?.sector) && (
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {contextCards.map((card) => (
            <MetricCard key={card.label} label={card.label} value={card.value} />
          ))}
        </div>
      )}

      {exitLevels.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/12 bg-black/30 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/55">Exit Ladder</p>
          <div className="relative mt-2 overflow-hidden rounded-full border border-white/12 bg-white/10">
            <div className="flex h-2.5 w-full">
              {normalizedExitSegments.map(({ index, widthPercent }) => (
                <div
                  key={`exit-segment-${index}`}
                  className={cn(
                    exitSegmentClasses[index % exitSegmentClasses.length],
                    index === activeExitCheckpointIndex && (
                      isActiveExitUrgent
                        ? 'animate-pulse brightness-[2] saturate-[2.4] shadow-[0_0_18px_rgba(250,204,21,0.95)]'
                        : 'brightness-[1.7] saturate-[2] shadow-[0_0_14px_rgba(45,212,191,0.8)]'
                    )
                  )}
                  style={{ width: `${widthPercent}%` }}
                />
              ))}
            </div>
            {activeExitCheckpointCenter != null && (
              <div
                className={cn(
                  'pointer-events-none absolute inset-y-0 z-10 w-[2px]',
                  isActiveExitUrgent
                    ? 'animate-pulse bg-amber-200 shadow-[0_0_18px_rgba(253,224,71,1)]'
                    : 'bg-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.95)]'
                )}
                style={{ left: `${Math.min(98, Math.max(2, activeExitCheckpointCenter))}%` }}
              />
            )}
          </div>
          <div className="relative mt-1.5 h-5">
            {normalizedExitSegments.map(({ index, centerPercent, level }) => (
              <p
                key={`exit-price-marker-${index}`}
                className={cn(
                  'absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px]',
                  index === activeExitCheckpointIndex
                    ? isActiveExitUrgent
                      ? 'animate-pulse font-bold text-amber-100 drop-shadow-[0_0_10px_rgba(253,224,71,1)]'
                      : 'font-semibold text-cyan-50 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                    : 'text-cyan-100/75'
                )}
                style={{ left: `${Math.min(98, Math.max(2, centerPercent))}%` }}
              >
                {Number.isFinite(exitShareAllocations[index]) ? formatNumber(exitShareAllocations[index]) : '--'} at {formatR(level.r)}R ({formatCurrency(level.targetPrice)})
              </p>
            ))}
          </div>
          <div className="relative mt-1 h-4">
            {exitTimeCheckpoints.map((checkpoint) => (
              <p
                key={`exit-time-checkpoint-${checkpoint.index}`}
                className={cn(
                  'absolute top-0 -translate-x-1/2 whitespace-nowrap text-[9px] sm:text-[10px]',
                  checkpoint.index === activeExitCheckpointIndex
                    ? isActiveExitUrgent
                      ? 'animate-pulse font-bold text-amber-100 drop-shadow-[0_0_10px_rgba(253,224,71,1)]'
                      : 'font-semibold text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                    : checkpoint.isReached
                      ? 'text-emerald-200/85'
                      : 'text-white/65'
                )}
                style={{ left: `${Math.min(98, Math.max(2, checkpoint.centerPercent))}%` }}
              >
                {formatElapsedLabel(checkpoint.checkpointElapsedSeconds)}
              </p>
            ))}
          </div>
          {activeTimeCue && (
            <div className="mt-2 rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-white/50">Time Sync</p>
              <p className={cn('mt-1 text-[11px]', activeTimeCue.tone)}>
                {activeTimeCue.message}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setShowInfo((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-white/60">
            <Info className="h-3.5 w-3.5" />
            Info Box
          </span>
          {showInfo ? (
            <ChevronUp className="h-4 w-4 text-white/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/60" />
          )}
        </button>
        {showInfo && (
          <div className="mt-2.5 space-y-2">
            {dataSources.length > 0 && (
              <p className="text-[10px] text-cyan-100/70">
                Source: {dataSources.join(', ')}
              </p>
            )}
            <p className="text-[10px] text-amber-200/80">
              Planning only: data can be delayed, estimated, or cached (not live execution feed).
            </p>
            {guidance.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/55">Guidance</p>
                <div className="mt-1.5 space-y-1">
                  {guidance.slice(0, 3).map((line, index) => (
                    <p key={`guidance-${index}`} className="text-[10px] text-cyan-100/75">
                      - {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-lg border border-white/12 bg-black/30 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/55">Why These Numbers</p>
              <p className="mt-1.5 text-[11px] text-white/80">
                Base risk comes from your {riskSourceLabel}: {formatCurrency(recommendation.baseRiskAmount)}.
                Final risk used in this plan: {formatCurrency(recommendation.riskAmount)}.
                {basis.riskCappedByDailyLoss ? ` Final risk is capped by your daily loss limit ${formatCurrency(basis.dailyLossLimit)}.` : ''}
              </p>
              <p className="mt-1.5 text-[11px] text-white/80">
                Stop is set to {formatPercent(recommendation.stopLossPercent)} from your {stopSourceLabel}.
                This gives risk/share of {formatPrice(recommendation.riskPerShare)}.
              </p>
              <p className="mt-1.5 text-[11px] text-white/80">
                Position size uses floor(risk / risk-share): {formatCurrency(recommendation.riskAmount)} / {formatPrice(recommendation.riskPerShare)} = {Number.isFinite(recommendation.positionSize) ? formatNumber(recommendation.positionSize) : '--'} shares.
                {sizeCapReasons.length > 0 ? ` Size was capped by ${sizeCapReasons.join(' + ')}.` : ''}
              </p>
              <p className="mt-1.5 text-[11px] text-white/80">
                Target zone started at {Number.isFinite(basis.configuredMinR) ? basis.configuredMinR : '--'}R-{Number.isFinite(basis.configuredMaxR) ? basis.configuredMaxR : '--'}R and final output is {Number.isFinite(basis.finalMinR) ? basis.finalMinR : '--'}R-{Number.isFinite(basis.finalMaxR) ? basis.finalMaxR : '--'}R.
                {basis.rCappedByMove ? ` Capped to keep exits realistic for this float (estimated move limit ~${basis.realisticMaxMovePercent}%).` : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] text-white/50">
        Last updated: {formatDateTime(floatData?.last_updated)}
      </p>
    </div>
  );
}

