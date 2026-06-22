import React, { useMemo } from 'react';
import { Target, Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAnalysisTimer, useAnalysisTimer } from '@/lib/context/AnalysisTimerContext';
import { DEFAULT_EXIT_LEVELS, normalizeExitStrategyLevels } from '@/components/settings/exitStrategy';

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
    return DEFAULT_EXIT_LEVELS.map((level) => ({ ...level, weight: level.percent / 100 }));
  }
  return levels.map((level) => ({ ...level, weight: level.percent / totalPercent }));
};

const sanitizeExitLevels = (exitStrategy) => {
  const normalizedLevels = normalizeExitStrategyLevels(exitStrategy?.levels);
  return withWeights(normalizedLevels);
};

const formatR = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  if (Number.isInteger(numeric)) return String(numeric);
  return numeric.toFixed(2).replace(/\.?0+$/, '');
};

const formatElapsedLabel = (seconds) => `T+${formatAnalysisTimer(seconds)}`;

const SWEET_MID = 2.00;

function StatBlock({ label, value, color = 'text-white', sub = null }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-white/35">{label}</p>
      <p className={cn('mt-0.5 text-sm font-semibold tabular-nums', color)}>{value}</p>
      {sub && <p className="mt-0.5 text-[9px] leading-snug text-white/30">{sub}</p>}
    </div>
  );
}

export default function ResultsDisplay({
  entryPrice,
  stopLossPrice,
  targetProfit,
  shares,
  positionValue,
  actualRisk,
  requestedRisk,
  riskUtilizationPct,
  capReason,
  riskRewardRatio,
  direction,
  mode,
  exitStrategy,
  playbookSetupName = null,
  onApplyStop,
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
    const stop  = Number(stopLossPrice);

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
        const price        = entry + (multiplier * riskPerShare * level.r);
        const profit       = allocatedShares * riskPerShare * level.r;
        const allocatedPct = shareCount > 0 ? (allocatedShares / shareCount) * 100 : 0;
        return { r: level.r, shares: allocatedShares, percent: allocatedPct, price, profit, isTrailingStop: Boolean(level.trailingStop) };
      })
      .filter((t) => t.shares > 0);
  }, [shares, stopLossPrice, entryPrice, direction, exitStrategy]);

  const overallProfit = useMemo(() => targets.reduce((sum, t) => sum + (t.profit || 0), 0), [targets]);

  const displayTotalProfit = targets.length > 0
    ? overallProfit
    : (Number.isFinite(Number(targetProfit)) ? Number(targetProfit) : null);

  const blendedR = Number.isFinite(Number(actualRisk)) && Number(actualRisk) > 0
    ? overallProfit / Number(actualRisk)
    : null;

  const riskUsageSubtext = (() => {
    const targetRiskNum = Number(requestedRisk);
    const utilization   = Number(riskUtilizationPct);
    const hasTgt  = Number.isFinite(targetRiskNum) && targetRiskNum > 0;
    const hasUtil = Number.isFinite(utilization) && utilization >= 0;
    const hasCap  = Boolean(String(capReason || '').trim());
    if (!hasTgt && !hasCap) return null;
    const parts = [];
    if (hasTgt)  parts.push(`Target ${asMoney(targetRiskNum)}`);
    if (hasUtil) parts.push(`${utilization.toFixed(1)}% used`);
    if (hasCap)  parts.push(`Cap: ${capReason}`);
    return parts.join(' · ');
  })();

  const isTimerUrgentBlink = isTimerRunning && remainingSeconds > 0 && remainingSeconds <= 10;
  const isLong = direction !== 'short';

  const ladderSegments = useMemo(() => {
    if (!Array.isArray(targets) || targets.length === 0) return [];
    const rawPcts   = targets.map((t) => { const n = Number(t?.percent); return Number.isFinite(n) && n > 0 ? n : 0; });
    const total     = rawPcts.reduce((s, p) => s + p, 0);
    const fallback  = 100 / targets.length;
    let accumulated = 0;
    return targets.map((target, i) => {
      const isLast   = i === targets.length - 1;
      const computed = total > 0 ? (rawPcts[i] / total) * 100 : fallback;
      const width    = isLast ? Math.max(0, 100 - accumulated) : Math.max(0, computed);
      const start    = accumulated;
      accumulated   += width;
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

  const nextLadderCheckpoint         = ladderCheckpoints.find((c) => !c.isReached) || null;
  const activeLadderCheckpointIndex  = isTimerRunning && nextLadderCheckpoint ? nextLadderCheckpoint.index : null;
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

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1520] shadow-[0_16px_40px_-20px_rgba(0,0,0,0.8)] overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/8 bg-white/[0.02]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Position Snapshot
          </span>
          {/* Timer inline beside title */}
          <div className="flex items-center gap-0.5 rounded border border-white/10 bg-white/[0.03] pl-1.5 pr-0.5 py-0.5">
            <span className={cn(
              'min-w-[38px] text-center font-mono text-[11px] font-semibold tabular-nums',
              isTimerRunning
                ? isTimerUrgentBlink
                  ? 'animate-pulse text-amber-300'
                  : 'text-emerald-300'
                : isExpired
                  ? 'text-rose-300'
                  : 'text-white/40',
            )}>
              {formatAnalysisTimer(remainingSeconds)}
            </span>
            <button type="button" onClick={toggleTimer} className="p-0.5 text-white/35 hover:text-white/70 transition-colors">
              {isTimerRunning ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
            </button>
            <button type="button" onClick={resetTimer} className="p-0.5 text-white/25 hover:text-white/55 transition-colors">
              <RotateCcw className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {mode && (
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
              {String(mode).replace('-', ' ')}
            </span>
          )}
          <span className={cn(
            'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border',
            isLong
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/25 bg-rose-500/10 text-rose-300',
          )}>
            {isLong ? 'LONG' : 'SHORT'}
          </span>
          {riskRewardRatio && (
            <span className="text-[10px] font-semibold text-cyan-300/80">
              {riskRewardRatio}R
            </span>
          )}
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="flex min-h-0">

        {/* Focal numbers + stats */}
        <div className="flex-1 p-4 space-y-4">
          {/* Position Size | Max Profit | Deployed + At Risk */}
          <div className="flex items-start gap-6 flex-wrap">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">Position Size</p>
              <p className="mt-0.5 text-[28px] font-black leading-none tabular-nums text-white">
                {Number(shares || 0).toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-white/30 tracking-wide">shares</p>
            </div>

            {displayTotalProfit != null && (
              <div className="border-l border-white/10 pl-6 min-w-0">
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">Max Profit</p>
                <p className="mt-0.5 text-[28px] font-black leading-none tabular-nums text-emerald-300">
                  +{asMoney(displayTotalProfit)}
                </p>
                {blendedR != null && (
                  <p className="mt-1 text-[11px] text-purple-300/70 tracking-wide">{blendedR.toFixed(2)}R blended</p>
                )}
              </div>
            )}

            <div className="border-l border-white/10 pl-6 flex gap-5">
              <StatBlock label="Deployed" value={asWholeMoney(positionValue)} color="text-white/70" />
              <div className="flex gap-5">
                <StatBlock label="At Risk" value={asMoney(actualRisk)} color="text-rose-300" sub={riskUsageSubtext} />
                {(() => {
                  const entry = Number(entryPrice);
                  const stop  = Number(stopLossPrice);
                  if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(stop) || stop <= 0 || entry === stop) return null;
                  const isLong    = direction !== 'short';
                  const riskPct   = (Math.abs(entry - stop) / entry) * 100;
                  if (Math.abs(riskPct - SWEET_MID) < 0.15) return null;
                  const suggested = entry + (isLong ? -1 : 1) * entry * (SWEET_MID / 100);
                  return (
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-white/35">Suggested Stop</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-sm font-semibold font-mono text-white/70">${suggested.toFixed(2)}</span>
                        {onApplyStop && (
                          <button
                            type="button"
                            onClick={() => onApplyStop(suggested.toFixed(2))}
                            className="rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 text-[9px] text-white/30">{SWEET_MID}% risk · sweet spot</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Exit Strategy ── */}
      <div className="border-t border-white/8 px-4 py-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-emerald-400/70" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Exit Strategy</span>
          </div>
          {playbookSetupName && (
            <span className="rounded border border-violet-500/25 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-violet-300 uppercase tracking-wide">
              {playbookSetupName}
            </span>
          )}
        </div>

        {ladderSegments.length > 0 && (
          <div className="space-y-2">
            {/* Progress bar */}
            <div className="relative overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
              <div className="flex h-2 w-full">
                {ladderSegments.map((seg) => (
                  <div
                    key={`seg-${seg.index}`}
                    className={cn(
                      'transition-all',
                      seg.target.isTrailingStop ? 'bg-violet-400/80'
                        : seg.index % 3 === 0 ? 'bg-emerald-400/80'
                        : seg.index % 3 === 1 ? 'bg-cyan-400/80'
                        : 'bg-blue-400/80',
                      seg.index === activeLadderCheckpointIndex && (
                        isActiveLadderUrgent
                          ? 'animate-pulse brightness-[2.2] saturate-[2.5]'
                          : 'brightness-[1.8] saturate-[2]'
                      ),
                    )}
                    style={{ width: `${seg.widthPercent}%` }}
                  />
                ))}
              </div>
              {activeLadderCheckpointCenter != null && (
                <div
                  className={cn(
                    'pointer-events-none absolute inset-y-0 z-10 w-[2px]',
                    isActiveLadderUrgent
                      ? 'animate-pulse bg-amber-200 shadow-[0_0_14px_rgba(253,224,71,1)]'
                      : 'bg-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.9)]',
                  )}
                  style={{ left: `${Math.min(97, Math.max(3, activeLadderCheckpointCenter))}%` }}
                />
              )}
            </div>

            {/* Tier rows */}
            <div className="space-y-1">
              {ladderCheckpoints.map((cp) => {
                const isActive  = cp.index === activeLadderCheckpointIndex;
                const isReached = cp.isReached;
                return (
                  <div
                    key={cp.index}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] transition-colors',
                      isActive
                        ? isActiveLadderUrgent
                          ? 'bg-amber-500/12 border border-amber-400/25'
                          : 'bg-cyan-500/10 border border-cyan-400/20'
                        : isReached
                          ? 'bg-emerald-500/8 border border-emerald-400/12'
                          : 'bg-white/[0.03] border border-white/6',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'h-1.5 w-1.5 rounded-full flex-shrink-0',
                        isReached ? 'bg-emerald-400' : isActive ? (isActiveLadderUrgent ? 'bg-amber-300 animate-pulse' : 'bg-cyan-300') : 'bg-white/20',
                      )} />
                      <span className={cn(
                        'font-semibold',
                        isActive ? (isActiveLadderUrgent ? 'text-amber-200' : 'text-cyan-200') : isReached ? 'text-emerald-300/80' : 'text-white/55',
                      )}>
                        {Number(cp.target.shares).toLocaleString()} @ {formatR(cp.target.r)}R
                      </span>
                      <span className={cn(
                        isActive ? 'text-white/60' : 'text-white/30',
                      )}>
                        {asMoney(cp.target.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={cn(
                        'font-mono',
                        isActive ? (isActiveLadderUrgent ? 'text-amber-300 font-bold' : 'text-cyan-300') : isReached ? 'text-emerald-300/70' : 'text-white/30',
                      )}>
                        {formatElapsedLabel(cp.checkpointElapsedSeconds)}
                      </span>
                      <span className={cn(
                        'font-semibold tabular-nums',
                        cp.target.profit >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80',
                      )}>
                        +{asMoney(cp.target.profit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {timeCue && (
              <div className={cn(
                'rounded-lg border px-3 py-2 text-[11px]',
                isExpired
                  ? 'border-rose-400/20 bg-rose-500/8'
                  : isNearEnd
                    ? 'border-amber-400/20 bg-amber-500/8'
                    : 'border-white/8 bg-white/[0.02]',
              )}>
                <span className={timeCue.tone}>{timeCue.message}</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
