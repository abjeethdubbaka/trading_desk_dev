import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pause, Play, RotateCcw, Target } from 'lucide-react';
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

// ── Price Ladder ────────────────────────────────────────────────────────────
function PriceLadder({ entryPrice, stopLossPrice, targetPrice, direction }) {
  const entry  = Number(entryPrice);
  const stop   = Number(stopLossPrice);
  const target = Number(targetPrice);

  if (!Number.isFinite(entry)  || entry  <= 0) return null;
  if (!Number.isFinite(stop)   || stop   <= 0) return null;
  if (!Number.isFinite(target) || target <= 0) return null;
  if (entry === stop || entry === target || stop === target) return null;

  const high  = Math.max(stop, target);
  const low   = Math.min(stop, target);
  const range = high - low;
  if (range <= 0) return null;

  // 0% = top (high price), 100% = bottom (low price)
  const toPct = (p) => ((high - p) / range) * 100;
  const entryPct = Math.min(93, Math.max(7, toPct(entry)));

  const isLong = direction !== 'short';

  // LONG:  target at top → green above entry, red below
  // SHORT: stop at top   → red above entry, green below
  const topZoneColor    = isLong ? 'bg-emerald-500/55' : 'bg-rose-500/55';
  const bottomZoneColor = isLong ? 'bg-rose-500/55'    : 'bg-emerald-500/55';

  const topPrice         = isLong ? target : stop;
  const bottomPrice      = isLong ? stop   : target;
  const topLabelText     = isLong ? 'TARGET' : 'STOP';
  const bottomLabelText  = isLong ? 'STOP'   : 'TARGET';
  const topLabelColor    = isLong ? 'text-emerald-400' : 'text-rose-400';
  const bottomLabelColor = isLong ? 'text-rose-400'    : 'text-emerald-400';

  const riskAmt   = Math.abs(entry - stop);
  const rewardAmt = Math.abs(target - entry);
  const rr        = riskAmt > 0 ? rewardAmt / riskAmt : null;
  const showEntryLabel = entryPct > 18 && entryPct < 82;

  return (
    <div className="flex gap-2.5 items-stretch" style={{ minHeight: 128 }}>
      {/* Vertical bar */}
      <div className="relative w-3.5 flex-shrink-0 rounded-lg overflow-hidden border border-white/10">
        <div className={cn('absolute inset-x-0 top-0', topZoneColor)} style={{ height: `${entryPct}%` }} />
        <div className={cn('absolute inset-x-0', bottomZoneColor)} style={{ top: `${entryPct}%`, bottom: 0 }} />
        <div
          className="absolute inset-x-0 z-10 h-[2px] bg-amber-300 shadow-[0_0_5px_rgba(253,224,71,0.85)]"
          style={{ top: `${entryPct}%` }}
        />
      </div>

      {/* Labels */}
      <div className="relative flex-1">
        {/* Top price */}
        <div className="absolute top-0 left-0">
          <p className={cn('text-[8px] font-bold uppercase tracking-widest leading-none', topLabelColor)}>
            {topLabelText}
          </p>
          <p className="mt-0.5 text-[10px] font-mono text-white/80 leading-tight">${topPrice.toFixed(2)}</p>
        </div>

        {/* Entry */}
        {showEntryLabel && (
          <div className="absolute left-0 -translate-y-1/2" style={{ top: `${entryPct}%` }}>
            <p className="text-[8px] font-bold uppercase tracking-widest leading-none text-amber-400">ENTRY</p>
            <p className="mt-0.5 text-[10px] font-mono text-white/80 leading-tight">${entry.toFixed(2)}</p>
          </div>
        )}

        {/* Bottom price */}
        <div className="absolute bottom-0 left-0">
          <p className={cn('text-[8px] font-bold uppercase tracking-widest leading-none', bottomLabelColor)}>
            {bottomLabelText}
          </p>
          <p className="mt-0.5 text-[10px] font-mono text-white/80 leading-tight">${bottomPrice.toFixed(2)}</p>
        </div>

        {/* R:R badge */}
        {rr != null && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <span className="rounded border border-cyan-500/25 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300/85">
              {rr.toFixed(1)}R
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, subtext = null, tone = 'default' }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent px-3 py-2.5 transition-colors hover:bg-white/[0.07]">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/45">{label}</p>
      <p className={cn(
        'mt-1 text-base font-semibold',
        tone === 'success' && 'text-emerald-300',
        tone === 'danger'  && 'text-red-300',
        tone === 'info'    && 'text-cyan-300',
        tone === 'warning' && 'text-amber-300',
        tone === 'default' && 'text-white',
      )}>
        {value}
      </p>
      {subtext && <p className="mt-0.5 text-[10px] leading-snug text-white/38">{subtext}</p>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ResultsDisplay({
  entryPrice,
  stopLossPrice,
  targetPrice,
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
        const price          = entry + (multiplier * riskPerShare * level.r);
        const profit         = allocatedShares * riskPerShare * level.r;
        const allocatedPct   = shareCount > 0 ? (allocatedShares / shareCount) * 100 : 0;
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

  const reward = Number.isFinite(Number(actualRisk)) && Number.isFinite(Number(riskRewardRatio))
    ? Number(actualRisk) * Number(riskRewardRatio)
    : null;

  const riskLevelPct = Number.isFinite(Number(actualRisk)) && Number.isFinite(Number(positionValue)) && Number(positionValue) > 0
    ? ((Number(actualRisk) / Number(positionValue)) * 100).toFixed(1)
    : null;

  const riskUsageSubtext = (() => {
    const targetRiskNum = Number(requestedRisk);
    const utilization   = Number(riskUtilizationPct);
    const hasTgt        = Number.isFinite(targetRiskNum) && targetRiskNum > 0;
    const hasUtil       = Number.isFinite(utilization) && utilization >= 0;
    const hasCap        = Boolean(String(capReason || '').trim());
    if (!hasTgt && !hasCap) return null;
    const parts = [];
    if (hasTgt)  parts.push(`Target ${asMoney(targetRiskNum)}`);
    if (hasUtil) parts.push(`${utilization.toFixed(1)}% used`);
    if (hasCap)  parts.push(`Limited by ${capReason}`);
    return parts.join(' · ');
  })();

  const timerButtonLabel = isTimerRunning ? 'Pause' : isExpired ? 'Restart' : hasStarted ? 'Resume' : 'Start Timer';
  const timerStatusLabel = isExpired ? 'Time up' : isTimerRunning ? 'Running' : hasStarted ? 'Paused' : 'Ready';
  const isTimerUrgentBlink = isTimerRunning && remainingSeconds > 0 && remainingSeconds <= 10;
  const directionLabel = String(direction || '-').toUpperCase();

  const snapshotTags = [
    { label: 'Direction', value: directionLabel, tone: 'text-amber-300' },
    ...(riskRewardRatio ? [{ label: 'R:R', value: `${riskRewardRatio}R`, tone: 'text-cyan-300' }] : []),
  ];

  // Whether the ladder has enough data to render
  const canShowLadder = Number(entryPrice) > 0 && Number(stopLossPrice) > 0 && Number(targetPrice) > 0;

  const ladderSegments = useMemo(() => {
    if (!Array.isArray(targets) || targets.length === 0) return [];
    const rawPcts = targets.map((t) => { const n = Number(t?.percent); return Number.isFinite(n) && n > 0 ? n : 0; });
    const total   = rawPcts.reduce((s, p) => s + p, 0);
    const fallback = 100 / targets.length;
    let accumulated = 0;
    return targets.map((target, i) => {
      const isLast = i === targets.length - 1;
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

  const nextLadderCheckpoint          = ladderCheckpoints.find((c) => !c.isReached) || null;
  const activeLadderCheckpointIndex   = isTimerRunning && nextLadderCheckpoint ? nextLadderCheckpoint.index : null;
  const activeLadderCheckpointCenter  = activeLadderCheckpointIndex == null
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
      message: `Start timer on entry. First trim checkpoint is ${formatElapsedLabel(ladderCheckpoints[0].checkpointElapsedSeconds)}.`,
    };
    if (isExpired) return {
      tone: 'text-rose-200',
      message: 'Timer expired. If momentum faded, avoid waiting for extra move and prioritize capital protection.',
    };
    if (!nextLadderCheckpoint) return {
      tone: 'text-emerald-200',
      message: 'All ladder checkpoints passed. Manage runner with tighter stop discipline.',
    };
    if (nextLadderCheckpoint.secondsToCheckpoint <= 45) return {
      tone: 'text-amber-200',
      message: `Checkpoint ${nextLadderCheckpoint.index + 1} is due now (${formatElapsedLabel(nextLadderCheckpoint.checkpointElapsedSeconds)}). If push is weak, reduce risk or trail tighter.`,
    };
    return {
      tone: 'text-cyan-100/85',
      message: `Next checkpoint: Tier ${nextLadderCheckpoint.index + 1} by ${formatElapsedLabel(nextLadderCheckpoint.checkpointElapsedSeconds)} (in ${formatAnalysisTimer(nextLadderCheckpoint.secondsToCheckpoint)}).`,
    };
  }, [hasStarted, isExpired, ladderCheckpoints, nextLadderCheckpoint]);

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-[#0f1724]/95 via-[#111d2c] to-[#0d1f24] p-5 shadow-[0_12px_34px_-20px_rgba(16,185,129,0.55)]">

      {/* ── Header ── */}
      <div className="mb-5 border-b border-white/10 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white">Position Snapshot</h3>
              <span className="rounded-md border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-200">
                Active Plan
              </span>
              <Button
                type="button" size="sm" variant="outline" onClick={toggleTimer}
                className="h-7 border-white/20 bg-white/5 px-2.5 text-[11px] text-white hover:bg-white/10"
              >
                {isTimerRunning ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
                {timerButtonLabel}
              </Button>
              <Button
                type="button" size="sm" variant="ghost" onClick={resetTimer}
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

      {/* ── Hero: Position focal + Price Map ── */}
      <div className={cn('mb-4 grid gap-3', canShowLadder ? 'grid-cols-[1fr_auto]' : 'grid-cols-1')}>
        {/* Left: shares focal */}
        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent p-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Position Size</p>
            <p className="mt-1 text-[40px] font-bold leading-none tabular-nums text-white">
              {Number(shares || 0).toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-white/40">shares</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-5">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/35">Deployed</p>
              <p className="mt-0.5 text-sm font-semibold text-white/65">{asWholeMoney(positionValue)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/35">At Risk</p>
              <p className="mt-0.5 text-sm font-semibold text-rose-300">{asMoney(actualRisk)}</p>
              {riskUsageSubtext && (
                <p className="mt-0.5 text-[9px] leading-snug text-white/35">{riskUsageSubtext}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: price map */}
        {canShowLadder && (
          <div className="flex flex-col rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-white/45">Price Map</p>
            <div className="flex flex-1 items-stretch">
              <PriceLadder
                entryPrice={entryPrice}
                stopLossPrice={stopLossPrice}
                targetPrice={targetPrice}
                direction={direction}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Supporting metrics ── */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricCard label="Total Cost" value={asWholeMoney(positionValue)} />
        <MetricCard
          label="Risk Deployed"
          value={asMoney(actualRisk)}
          tone="danger"
        />
        <MetricCard
          label={`Reward (${formatR(riskRewardRatio)}R)`}
          value={reward == null ? '-' : asMoney(reward)}
          tone="success"
        />
        <MetricCard
          label="Risk Level"
          value={riskLevelPct == null ? '-' : `${riskLevelPct}%`}
          tone="warning"
        />

        {/* Analysis timer — small screens only */}
        <div className={cn(
          'col-span-2 rounded-xl border px-3 py-2.5 sm:hidden',
          isExpired
            ? 'border-rose-400/40 bg-rose-500/10'
            : isNearEnd
              ? 'border-amber-300/45 bg-amber-300/10'
              : isTimerRunning
                ? 'border-emerald-400/35 bg-emerald-500/10'
                : 'border-white/10 bg-white/5',
        )}>
          <p className="mb-1 text-xs text-white/45">Analysis Timer</p>
          <p className={cn(
            'font-mono text-xl font-bold tracking-[0.12em]',
            isTimerRunning
              ? isTimerUrgentBlink
                ? 'animate-pulse text-amber-100 drop-shadow-[0_0_12px_rgba(253,224,71,1)]'
                : 'animate-pulse text-emerald-100 drop-shadow-[0_0_10px_rgba(16,185,129,0.9)]'
              : 'text-white',
          )}>
            {formatAnalysisTimer(remainingSeconds)}
          </p>
          <p className="mt-1 text-xs text-white/55">{timerStatusLabel}</p>
        </div>
      </div>

      {/* ── Exit Strategy ── */}
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
                {ladderSegments.map((seg) => (
                  <div
                    key={`seg-${seg.index}`}
                    className={cn(
                      seg.target.isTrailingStop ? 'bg-violet-400/85'
                        : seg.index % 3 === 0 ? 'bg-emerald-400/85'
                        : seg.index % 3 === 1 ? 'bg-cyan-400/85'
                        : 'bg-blue-400/85',
                      seg.index === activeLadderCheckpointIndex && (
                        isActiveLadderUrgent
                          ? 'animate-pulse brightness-[2] saturate-[2.4] shadow-[0_0_18px_rgba(250,204,21,0.95)]'
                          : 'brightness-[1.7] saturate-[2] shadow-[0_0_14px_rgba(45,212,191,0.8)]'
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
                      ? 'animate-pulse bg-amber-200 shadow-[0_0_18px_rgba(253,224,71,1)]'
                      : 'bg-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.95)]',
                  )}
                  style={{ left: `${Math.min(98, Math.max(2, activeLadderCheckpointCenter))}%` }}
                />
              )}
            </div>
            <div className="relative mt-1.5 h-5">
              {ladderSegments.map((seg) => (
                <p
                  key={`price-${seg.index}`}
                  className={cn(
                    'absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px]',
                    seg.index === activeLadderCheckpointIndex
                      ? isActiveLadderUrgent
                        ? 'animate-pulse font-bold text-amber-100 drop-shadow-[0_0_10px_rgba(253,224,71,1)]'
                        : 'font-semibold text-cyan-50 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                      : 'text-cyan-100/75',
                  )}
                  style={{ left: `${Math.min(98, Math.max(2, seg.centerPercent))}%` }}
                >
                  {Number(seg.target.shares || 0).toLocaleString()} at {formatR(seg.target.r)}R ({asMoney(seg.target.price)})
                </p>
              ))}
            </div>
            <div className="relative mt-1 h-4">
              {ladderCheckpoints.map((cp) => (
                <p
                  key={`time-${cp.index}`}
                  className={cn(
                    'absolute top-0 -translate-x-1/2 whitespace-nowrap text-[9px] sm:text-[10px]',
                    cp.index === activeLadderCheckpointIndex
                      ? isActiveLadderUrgent
                        ? 'animate-pulse font-bold text-amber-100 drop-shadow-[0_0_10px_rgba(253,224,71,1)]'
                        : 'font-semibold text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                      : cp.isReached
                        ? 'text-emerald-200/85'
                        : 'text-white/65',
                  )}
                  style={{ left: `${Math.min(98, Math.max(2, cp.centerPercent))}%` }}
                >
                  {formatElapsedLabel(cp.checkpointElapsedSeconds)}
                </p>
              ))}
            </div>
            {timeCue && (
              <div className="mt-2 rounded-lg border border-white/12 bg-white/[0.03] px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-[0.08em] text-white/50">Time Sync</p>
                <p className={cn('mt-1 text-[11px]', timeCue.tone)}>{timeCue.message}</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-200">
                Total Profit
              </Badge>
              <span className="text-sm font-semibold text-white/80">
                All {Number(shares || 0).toLocaleString()} shares
                {blendedR == null ? '' : ` (${blendedR.toFixed(2)}R blended)`}
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
