import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pause, Play, RotateCcw, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAnalysisTimer, useAnalysisTimer } from '@/lib/context/AnalysisTimerContext';

const DEFAULT_EXIT_LEVELS = [
  { r: 1, percent: 33, trailingStop: false },
  { r: 2, percent: 33, trailingStop: false },
  { r: 3, percent: 34, trailingStop: true },
];
const asMoney = (value, digits = 2) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return `$${numeric.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
};

const asWholeMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return `$${Math.round(numeric).toLocaleString()}`;
};

const withWeights = (levels) => {
  const totalPercent = levels.reduce((sum, level) => sum + level.percent, 0);

  if (!Number.isFinite(totalPercent) || totalPercent <= 0) {
    return DEFAULT_EXIT_LEVELS.map((level) => ({
      ...level,
      weight: level.percent / 100,
    }));
  }

  return levels.map((level) => ({
    ...level,
    weight: level.percent / totalPercent,
  }));
};

const sanitizeExitLevels = (exitStrategy) => {
  const rawLevels = Array.isArray(exitStrategy?.levels) && exitStrategy.levels.length > 0
    ? exitStrategy.levels
    : DEFAULT_EXIT_LEVELS;

  const cleaned = rawLevels
    .map((level, index) => {
      const fallback = DEFAULT_EXIT_LEVELS[index] || { r: index + 1, percent: 0, trailingStop: false };
      const parsedR = Number(level?.r);
      const parsedPercent = Number(level?.percent);

      return {
        r: Number.isFinite(parsedR) && parsedR > 0 ? parsedR : fallback.r,
        percent: Number.isFinite(parsedPercent) && parsedPercent > 0 ? parsedPercent : 0,
        trailingStop: Boolean(level?.trailingStop),
      };
    })
    .filter((level) => level.percent > 0)
    .sort((a, b) => a.r - b.r);

  return withWeights(cleaned.length > 0 ? cleaned : DEFAULT_EXIT_LEVELS);
};

const formatR = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  if (Number.isInteger(numeric)) return String(numeric);
  return numeric.toFixed(2).replace(/\.?0+$/, '');
};

const formatElapsedLabel = (seconds) => `T+${formatAnalysisTimer(seconds)}`;

function MetricCard({
  label,
  value,
  subtext = null,
  tone = 'default',
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.08]">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/50">{label}</p>
      <p className={cn(
        'mt-1 text-lg font-semibold',
        tone === 'success' && 'text-emerald-300',
        tone === 'danger' && 'text-red-300',
        tone === 'info' && 'text-cyan-300',
        tone === 'warning' && 'text-amber-300',
        tone === 'default' && 'text-white'
      )}
      >
        {value}
      </p>
      {subtext && (
        <p className="mt-0.5 text-[11px] text-white/40">{subtext}</p>
      )}
    </div>
  );
}

export default function ResultsDisplay({
  entryPrice,
  stopLossPrice,
  targetPrice,
  targetProfit,
  shares,
  positionValue,
  actualRisk,
  riskRewardRatio,
  direction,
  mode,
  exitStrategy,
}) {
  const {
    timerDurationSeconds,
    hasStarted,
    isTimerRunning,
    isExpired,
    isNearEnd,
    remainingSeconds,
    toggleTimer,
    resetTimer,
  } = useAnalysisTimer();

  const targets = useMemo(() => {
    const shareCount = Math.floor(Number(shares));
    const entry = Number(entryPrice);
    const stop = Number(stopLossPrice);

    if (!Number.isFinite(shareCount) || shareCount <= 0) return [];
    if (!Number.isFinite(entry) || !Number.isFinite(stop)) return [];

    const riskPerShare = Math.abs(entry - stop);
    if (!Number.isFinite(riskPerShare) || riskPerShare <= 0) return [];

    const levels = sanitizeExitLevels(exitStrategy);
    const multiplier = direction === 'short' ? -1 : 1;

    let remainingShares = shareCount;

    return levels
      .map((level, index) => {
        const allocatedShares = index === levels.length - 1
          ? remainingShares
          : Math.min(remainingShares, Math.floor(shareCount * level.weight));

        remainingShares -= allocatedShares;

        const price = entry + (multiplier * riskPerShare * level.r);
        const profit = allocatedShares * riskPerShare * level.r;
        const allocatedPercent = shareCount > 0 ? (allocatedShares / shareCount) * 100 : 0;

        return {
          r: level.r,
          shares: allocatedShares,
          percent: allocatedPercent,
          price,
          profit,
          isTrailingStop: Boolean(level.trailingStop),
        };
      })
      .filter((target) => target.shares > 0);
  }, [shares, stopLossPrice, entryPrice, direction, exitStrategy]);

  const overallProfit = useMemo(
    () => targets.reduce((sum, target) => sum + (target.profit || 0), 0),
    [targets]
  );

  const displayTotalProfit = targets.length > 0
    ? overallProfit
    : (Number.isFinite(Number(targetProfit)) ? Number(targetProfit) : null);

  const blendedR = Number.isFinite(Number(actualRisk)) && Number(actualRisk) > 0
    ? overallProfit / Number(actualRisk)
    : null;

  const reward = Number.isFinite(Number(actualRisk)) && Number.isFinite(Number(riskRewardRatio))
    ? Number(actualRisk) * Number(riskRewardRatio)
    : null;

  const riskLevelPct = Number.isFinite(Number(actualRisk)) && Number.isFinite(Number(positionValue)) && Number(positionValue) > 0
    ? ((Number(actualRisk) / Number(positionValue)) * 100).toFixed(1)
    : null;
  const timerButtonLabel = isTimerRunning
    ? 'Pause Timer'
    : isExpired
      ? 'Restart Timer'
      : hasStarted
        ? 'Resume Timer'
        : 'Start Timer';
  const timerStatusLabel = isExpired
    ? 'Time up'
    : isTimerRunning
      ? 'Running'
      : hasStarted
        ? 'Paused'
        : 'Ready';
  const isTimerUrgentBlink = isTimerRunning && remainingSeconds > 0 && remainingSeconds <= 10;
  const directionLabel = String(direction || '-').toUpperCase();
  const snapshotTags = [
    { label: 'Entry', value: asMoney(entryPrice), tone: 'text-emerald-300' },
    { label: 'Stop', value: asMoney(stopLossPrice), tone: 'text-red-300' },
    { label: 'Target', value: asMoney(targetPrice), tone: 'text-cyan-300' },
    { label: 'Direction', value: directionLabel, tone: 'text-amber-300' },
  ];
  const ladderSegments = useMemo(() => {
    if (!Array.isArray(targets) || targets.length === 0) return [];
    const rawPercents = targets.map((target) => {
      const numericPercent = Number(target?.percent);
      return Number.isFinite(numericPercent) && numericPercent > 0 ? numericPercent : 0;
    });
    const totalPercent = rawPercents.reduce((sum, percent) => sum + percent, 0);
    const fallbackPercent = 100 / targets.length;
    let accumulated = 0;

    return targets.map((target, index) => {
      const isLast = index === targets.length - 1;
      const computedPercent = totalPercent > 0
        ? (rawPercents[index] / totalPercent) * 100
        : fallbackPercent;
      const widthPercent = isLast
        ? Math.max(0, 100 - accumulated)
        : Math.max(0, computedPercent);
      const startPercent = accumulated;
      accumulated += widthPercent;

      return {
        target,
        index,
        widthPercent,
        centerPercent: startPercent + (widthPercent / 2),
      };
    });
  }, [targets]);
  const elapsedSeconds = hasStarted
    ? Math.max(0, Number(timerDurationSeconds) - Number(remainingSeconds))
    : 0;
  const ladderCheckpoints = useMemo(() => {
    if (ladderSegments.length === 0) return [];
    const totalDuration = Number.isFinite(Number(timerDurationSeconds)) && Number(timerDurationSeconds) > 0
      ? Number(timerDurationSeconds)
      : 0;
    let cumulativePercent = 0;

    return ladderSegments.map((segment) => {
      cumulativePercent += segment.widthPercent;
      const checkpointElapsedSeconds = Math.round((totalDuration * cumulativePercent) / 100);
      const secondsToCheckpoint = Math.max(0, checkpointElapsedSeconds - elapsedSeconds);

      return {
        ...segment,
        checkpointElapsedSeconds,
        secondsToCheckpoint,
        isReached: hasStarted && elapsedSeconds >= checkpointElapsedSeconds,
      };
    });
  }, [elapsedSeconds, hasStarted, ladderSegments, timerDurationSeconds]);
  const nextLadderCheckpoint = ladderCheckpoints.find((checkpoint) => !checkpoint.isReached) || null;
  const activeLadderCheckpointIndex = isTimerRunning && nextLadderCheckpoint
    ? nextLadderCheckpoint.index
    : null;
  const activeLadderCheckpointCenter = activeLadderCheckpointIndex == null
    ? null
    : ladderCheckpoints.find((checkpoint) => checkpoint.index === activeLadderCheckpointIndex)?.centerPercent ?? null;
  const isActiveLadderUrgent = Boolean(
    isTimerRunning
    && nextLadderCheckpoint
    && nextLadderCheckpoint.secondsToCheckpoint > 0
    && nextLadderCheckpoint.secondsToCheckpoint <= 10
  );
  const timeCue = useMemo(() => {
    if (ladderCheckpoints.length === 0) return null;
    if (!hasStarted) {
      return {
        tone: 'text-cyan-100/85',
        message: `Start timer on entry. First trim checkpoint is ${formatElapsedLabel(ladderCheckpoints[0].checkpointElapsedSeconds)}.`,
      };
    }
    if (isExpired) {
      return {
        tone: 'text-rose-200',
        message: 'Timer expired. If momentum faded, avoid waiting for extra move and prioritize capital protection.',
      };
    }
    if (!nextLadderCheckpoint) {
      return {
        tone: 'text-emerald-200',
        message: 'All ladder checkpoints passed. Manage runner with tighter stop discipline.',
      };
    }
    if (nextLadderCheckpoint.secondsToCheckpoint <= 45) {
      return {
        tone: 'text-amber-200',
        message: `Checkpoint ${nextLadderCheckpoint.index + 1} is due now (${formatElapsedLabel(nextLadderCheckpoint.checkpointElapsedSeconds)}). If push is weak, reduce risk or trail tighter.`,
      };
    }
    return {
      tone: 'text-cyan-100/85',
      message: `Next checkpoint: Tier ${nextLadderCheckpoint.index + 1} by ${formatElapsedLabel(nextLadderCheckpoint.checkpointElapsedSeconds)} (in ${formatAnalysisTimer(nextLadderCheckpoint.secondsToCheckpoint)}).`,
    };
  }, [hasStarted, isExpired, ladderCheckpoints, nextLadderCheckpoint]);

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-[#0f1724]/95 via-[#111d2c] to-[#0d1f24] p-5 shadow-[0_12px_34px_-20px_rgba(16,185,129,0.55)]">
      <div className="mb-4 border-b border-white/10 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 className="text-lg font-semibold text-white">Position Snapshot</h3>
              <span className="rounded-md border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-200">
                Active Plan
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={toggleTimer}
                className="h-7 border-white/20 bg-white/5 px-2.5 text-[11px] text-white hover:bg-white/10"
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
                className="h-7 px-2 text-[11px] text-white/70 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {snapshotTags.map((tag) => (
                <span key={tag.label} className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[10px]">
                  <span className="text-white/45">{tag.label}:</span>{' '}
                  <span className={tag.tone}>{tag.value}</span>
                </span>
              ))}
            </div>
          </div>

          {mode && (
            <Badge className="w-fit border-0 bg-cyan-500/20 text-cyan-200">
              {String(mode).replace('-', ' ')}
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Position Size"
          value={Number(shares || 0).toLocaleString()}
          subtext="shares"
        />
        <MetricCard label="Entry" value={asMoney(entryPrice)} tone="success" />
        <MetricCard label="Stop" value={asMoney(stopLossPrice)} tone="danger" />
        <MetricCard label="Total Cost" value={asWholeMoney(positionValue)} />
        <MetricCard label="Risk Amount" value={asMoney(actualRisk)} tone="danger" />

        <div
          className={cn(
            'rounded-xl border px-3 py-2.5 lg:hidden',
            isExpired
              ? 'border-rose-400/40 bg-rose-500/10'
              : isNearEnd
                ? 'border-amber-300/45 bg-amber-300/10'
                : isTimerRunning
                  ? 'border-emerald-400/35 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5'
          )}
        >
          <p className="mb-1 text-xs text-white/45">Analysis Timer</p>
          <p className={cn(
            'font-mono text-xl font-bold tracking-[0.12em]',
            isTimerRunning
              ? isTimerUrgentBlink
                ? 'animate-pulse text-amber-100 drop-shadow-[0_0_12px_rgba(253,224,71,1)]'
                : 'animate-pulse text-emerald-100 drop-shadow-[0_0_10px_rgba(16,185,129,0.9)]'
              : 'text-white'
          )}>
            {formatAnalysisTimer(remainingSeconds)}
          </p>
          <p className="mt-1 text-xs text-white/55">{timerStatusLabel}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label={`Reward (${riskRewardRatio || '-'}R)`}
          value={reward == null ? '-' : asMoney(reward)}
          tone="success"
        />
        <MetricCard label="Target Price" value={asMoney(targetPrice)} tone="info" />
        <MetricCard label="Risk Level" value={riskLevelPct == null ? '-' : `${riskLevelPct}%`} tone="warning" />
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-emerald-300">Exit Strategy</h4>
        </div>

        {ladderSegments.length > 0 && (
          <div className="mb-3 rounded-xl border border-white/12 bg-black/30 p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/55">Exit Ladder (Price + Time)</p>
            <div className="relative mt-2 overflow-hidden rounded-full border border-white/12 bg-white/10">
              <div className="flex h-2.5 w-full">
                {ladderSegments.map((segment) => (
                  <div
                    key={`ladder-segment-${segment.index}`}
                    className={cn(
                      segment.target.isTrailingStop
                        ? 'bg-violet-400/85'
                        : segment.index % 3 === 0
                          ? 'bg-emerald-400/85'
                          : segment.index % 3 === 1
                          ? 'bg-cyan-400/85'
                          : 'bg-blue-400/85'
                    ,
                      segment.index === activeLadderCheckpointIndex && (
                        isActiveLadderUrgent
                          ? 'animate-pulse brightness-[2] saturate-[2.4] shadow-[0_0_18px_rgba(250,204,21,0.95)]'
                          : 'brightness-[1.7] saturate-[2] shadow-[0_0_14px_rgba(45,212,191,0.8)]'
                      )
                    )}
                    style={{ width: `${segment.widthPercent}%` }}
                  />
                ))}
              </div>
              {activeLadderCheckpointCenter != null && (
                <div
                  className={cn(
                    'pointer-events-none absolute inset-y-0 z-10 w-[2px]',
                    isActiveLadderUrgent
                      ? 'animate-pulse bg-amber-200 shadow-[0_0_18px_rgba(253,224,71,1)]'
                      : 'bg-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.95)]'
                  )}
                  style={{ left: `${Math.min(98, Math.max(2, activeLadderCheckpointCenter))}%` }}
                />
              )}
            </div>
            <div className="relative mt-1.5 h-5">
              {ladderSegments.map((segment) => (
                <p
                  key={`ladder-price-marker-${segment.index}`}
                  className={cn(
                    'absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px]',
                    segment.index === activeLadderCheckpointIndex
                      ? isActiveLadderUrgent
                        ? 'animate-pulse font-bold text-amber-100 drop-shadow-[0_0_10px_rgba(253,224,71,1)]'
                        : 'font-semibold text-cyan-50 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                      : 'text-cyan-100/75'
                  )}
                  style={{ left: `${Math.min(98, Math.max(2, segment.centerPercent))}%` }}
                >
                  {Number(segment.target.shares || 0).toLocaleString()} at {formatR(segment.target.r)}R ({asMoney(segment.target.price)})
                </p>
              ))}
            </div>
            <div className="relative mt-1 h-4">
              {ladderCheckpoints.map((checkpoint) => (
                <p
                  key={`ladder-time-marker-${checkpoint.index}`}
                  className={cn(
                    'absolute top-0 -translate-x-1/2 whitespace-nowrap text-[9px] sm:text-[10px]',
                    checkpoint.index === activeLadderCheckpointIndex
                      ? isActiveLadderUrgent
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
            {timeCue && (
              <div className="mt-2 rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-white/50">Time Sync</p>
                <p className={cn('mt-1 text-[11px]', timeCue.tone)}>
                  {timeCue.message}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-200 border-0">
                Total Profit
              </Badge>
              <span className="text-sm font-semibold text-white/80">
                All {Number(shares || 0).toLocaleString()} shares {blendedR == null ? '' : `(${blendedR.toFixed(2)}R blended)`}
              </span>
            </div>

            <span className="text-lg font-bold text-emerald-300">
              +{displayTotalProfit == null ? '-' : asMoney(displayTotalProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
