import { useMemo } from 'react';
import { formatAnalysisTimer } from '@/lib/context/AnalysisTimerContext';
import { asMoney, formatElapsedLabel, sanitizeExitLevels } from './resultsDisplayUtils';

/**
 * Derives the exit ladder (tiers, checkpoints, active tier, timer cue) from
 * the position result + exit strategy + live analysis timer state.
 */
export function useResultsDisplayCalculations({
  shares,
  entryPrice,
  stopLossPrice,
  targetProfit,
  actualRisk,
  requestedRisk,
  riskUtilizationPct,
  capReason,
  direction,
  exitStrategy,
  timerDurationSeconds,
  hasStarted,
  isTimerRunning,
  isExpired,
  remainingSeconds,
  // futures extras (all optional — absent for stocks)
  isFutures = false,
  tickSize,
  tickValue,
  stopTicks: stopTicksProp,
}) {
  const targets = useMemo(() => {
    const shareCount = Math.floor(Number(shares));
    const entry = Number(entryPrice);
    const stop = Number(stopLossPrice);

    if (!Number.isFinite(shareCount) || shareCount <= 0) return [];
    if (!Number.isFinite(entry) || !Number.isFinite(stop)) return [];

    if (isFutures) {
      const tSize = Number(tickSize);
      const tValue = Number(tickValue);
      if (!tSize || !tValue) return [];
      const resolvedStopTicks = Number.isFinite(Number(stopTicksProp)) && Number(stopTicksProp) > 0
        ? Number(stopTicksProp)
        : Math.round(Math.abs(entry - stop) / tSize);
      if (resolvedStopTicks <= 0) return [];

      const levels = sanitizeExitLevels(exitStrategy);
      const multiplier = direction === 'short' ? -1 : 1;
      let remaining = shareCount;

      return levels
        .map((level, index) => {
          const allocated = index === levels.length - 1
            ? remaining
            : Math.min(remaining, Math.floor(shareCount * level.weight));
          remaining -= allocated;
          const price = entry + multiplier * resolvedStopTicks * tSize * level.r;
          const profit = allocated * resolvedStopTicks * tValue * level.r;
          const allocatedPct = shareCount > 0 ? (allocated / shareCount) * 100 : 0;
          return { r: level.r, shares: allocated, percent: allocatedPct, price, profit, isTrailingStop: Boolean(level.trailingStop) };
        })
        .filter((t) => t.shares > 0);
    }

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
        const allocatedPct = shareCount > 0 ? (allocatedShares / shareCount) * 100 : 0;
        return { r: level.r, shares: allocatedShares, percent: allocatedPct, price, profit, isTrailingStop: Boolean(level.trailingStop) };
      })
      .filter((t) => t.shares > 0);
  }, [shares, stopLossPrice, entryPrice, direction, exitStrategy, isFutures, tickSize, tickValue, stopTicksProp]);

  const overallProfit = useMemo(() => targets.reduce((sum, t) => sum + (t.profit || 0), 0), [targets]);

  const displayTotalProfit = targets.length > 0
    ? overallProfit
    : (Number.isFinite(Number(targetProfit)) ? Number(targetProfit) : null);

  const blendedR = Number.isFinite(Number(actualRisk)) && Number(actualRisk) > 0
    ? overallProfit / Number(actualRisk)
    : null;

  const riskUsageSubtext = (() => {
    const targetRiskNum = Number(requestedRisk);
    const utilization = Number(riskUtilizationPct);
    const hasTgt = Number.isFinite(targetRiskNum) && targetRiskNum > 0;
    const hasUtil = Number.isFinite(utilization) && utilization >= 0;
    const hasCap = Boolean(String(capReason || '').trim());
    if (!hasTgt && !hasCap) return null;
    const parts = [];
    if (hasTgt) parts.push(`Target ${asMoney(targetRiskNum)}`);
    if (hasUtil) parts.push(`${utilization.toFixed(1)}% used`);
    if (hasCap) parts.push(`Cap: ${capReason}`);
    return parts.join(' · ');
  })();

  const ladderSegments = useMemo(() => {
    if (!Array.isArray(targets) || targets.length === 0) return [];
    const rawPcts = targets.map((t) => { const n = Number(t?.percent); return Number.isFinite(n) && n > 0 ? n : 0; });
    const total = rawPcts.reduce((s, p) => s + p, 0);
    const fallback = 100 / targets.length;
    let accumulated = 0;
    return targets.map((target, i) => {
      const isLast = i === targets.length - 1;
      const computed = total > 0 ? (rawPcts[i] / total) * 100 : fallback;
      const width = isLast ? Math.max(0, 100 - accumulated) : Math.max(0, computed);
      const start = accumulated;
      accumulated += width;
      return { target, index: i, widthPercent: width, centerPercent: start + width / 2 };
    });
  }, [targets]);

  const elapsedSeconds = hasStarted ? Math.max(0, Number(timerDurationSeconds) - Number(remainingSeconds)) : 0;

  const ladderCheckpoints = useMemo(() => {
    if (ladderSegments.length === 0) return [];
    const totalDuration = Number.isFinite(Number(timerDurationSeconds)) && Number(timerDurationSeconds) > 0
      ? Number(timerDurationSeconds) : 0;
    let cum = 0;
    return ladderSegments.map((seg) => {
      cum += seg.widthPercent;
      const checkpointElapsed = Math.round((totalDuration * cum) / 100);
      return {
        ...seg,
        checkpointElapsedSeconds: checkpointElapsed,
        secondsToCheckpoint: Math.max(0, checkpointElapsed - elapsedSeconds),
        isReached: hasStarted && elapsedSeconds >= checkpointElapsed,
      };
    });
  }, [elapsedSeconds, hasStarted, ladderSegments, timerDurationSeconds]);

  const nextLadderCheckpoint = ladderCheckpoints.find((c) => !c.isReached) || null;
  const activeLadderCheckpointIndex = isTimerRunning && nextLadderCheckpoint ? nextLadderCheckpoint.index : null;
  const activeLadderCheckpointCenter = activeLadderCheckpointIndex == null
    ? null
    : ladderCheckpoints.find((c) => c.index === activeLadderCheckpointIndex)?.centerPercent ?? null;
  const isActiveLadderUrgent = Boolean(
    isTimerRunning && nextLadderCheckpoint
    && nextLadderCheckpoint.secondsToCheckpoint > 0
    && nextLadderCheckpoint.secondsToCheckpoint <= 10,
  );

  const timeCue = useMemo(() => {
    if (ladderCheckpoints.length === 0) return null;
    if (!hasStarted) return {
      tone: 'text-cyan-100/85',
      message: `Start timer on entry. First trim at ${formatElapsedLabel(ladderCheckpoints[0].checkpointElapsedSeconds)}.`,
    };
    if (isExpired) return {
      tone: 'text-rose-300',
      message: 'Timer expired — prioritize capital protection over waiting for extra move.',
    };
    if (!nextLadderCheckpoint) return {
      tone: 'text-emerald-300',
      message: 'All checkpoints passed. Manage runner with tighter stop discipline.',
    };
    if (nextLadderCheckpoint.secondsToCheckpoint <= 45) return {
      tone: 'text-amber-300',
      message: `Checkpoint ${nextLadderCheckpoint.index + 1} due now (${formatElapsedLabel(nextLadderCheckpoint.checkpointElapsedSeconds)}). Weak push? Reduce or trail tighter.`,
    };
    return {
      tone: 'text-cyan-100/85',
      message: `Next: Tier ${nextLadderCheckpoint.index + 1} by ${formatElapsedLabel(nextLadderCheckpoint.checkpointElapsedSeconds)} (in ${formatAnalysisTimer(nextLadderCheckpoint.secondsToCheckpoint)}).`,
    };
  }, [hasStarted, isExpired, ladderCheckpoints, nextLadderCheckpoint]);

  return {
    displayTotalProfit,
    blendedR,
    riskUsageSubtext,
    ladderSegments,
    ladderCheckpoints,
    activeLadderCheckpointIndex,
    activeLadderCheckpointCenter,
    isActiveLadderUrgent,
    timeCue,
  };
}
