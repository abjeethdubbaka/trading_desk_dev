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

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-xl p-5 border border-emerald-500/20">
      <div className="mb-4 pb-4 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 className="text-lg font-semibold text-white">Position Analysis</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={toggleTimer}
                className="h-8 px-2.5 border-white/20 bg-white/5 hover:bg-white/10 text-white"
              >
                {isTimerRunning ? (
                  <Pause className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                )}
                {timerButtonLabel}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={resetTimer}
                className="h-8 px-2 text-white/60 hover:text-white hover:bg-white/10"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset
              </Button>
            </div>
            <p className="text-xs text-white/60 mt-1">
              Entry <span className="text-emerald-400">{asMoney(entryPrice)}</span>
              <span className="mx-1 text-white/30">|</span>
              Stop <span className="text-red-400">{asMoney(stopLossPrice)}</span>
              <span className="mx-1 text-white/30">|</span>
              Target <span className="text-blue-400">{asMoney(targetPrice)}</span>
              <span className="mx-1 text-white/30">|</span>
              <span className="text-amber-300">{(direction || '-').toUpperCase()}</span>
            </p>
          </div>

          {mode && (
            <Badge className="w-fit bg-blue-500/20 text-blue-300 border-0">
              {String(mode).replace('-', ' ')}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/45 mb-1">Position Size</p>
          <p className="text-xl font-bold text-white">{Number(shares || 0).toLocaleString()}</p>
          <p className="text-xs text-white/35">shares</p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/45 mb-1">Entry</p>
          <p className="text-xl font-bold text-emerald-400">{asMoney(entryPrice)}</p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/45 mb-1">Stop</p>
          <p className="text-xl font-bold text-red-400">{asMoney(stopLossPrice)}</p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/45 mb-1">Total Cost</p>
          <p className="text-xl font-bold text-white">{asWholeMoney(positionValue)}</p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/45 mb-1">Risk Amount</p>
          <p className="text-xl font-bold text-red-400">{asMoney(actualRisk)}</p>
        </div>

        <div
          className={cn(
            'rounded-lg border p-3 lg:hidden',
            isExpired
              ? 'border-rose-400/40 bg-rose-500/10'
              : isNearEnd
                ? 'border-amber-300/45 bg-amber-300/10'
                : isTimerRunning
                  ? 'border-emerald-400/35 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5'
          )}
        >
          <p className="text-xs text-white/45 mb-1">Analysis Timer</p>
          <p className="font-mono text-xl font-bold text-white tracking-[0.12em]">
            {formatAnalysisTimer(remainingSeconds)}
          </p>
          <p className="text-xs text-white/55 mt-1">{timerStatusLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/45 mb-1">Reward ({riskRewardRatio || '-'}R)</p>
          <p className="text-xl font-bold text-emerald-400">{reward == null ? '-' : asMoney(reward)}</p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/45 mb-1">Target Price</p>
          <p className="text-xl font-bold text-blue-400">{asMoney(targetPrice)}</p>
        </div>

        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/45 mb-1">Risk Level</p>
          <p className="text-xl font-bold text-amber-400">{riskLevelPct == null ? '-' : `${riskLevelPct}%`}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-emerald-300">Exit Strategy</h4>
        </div>

        <div className="space-y-2">
          {(targets || []).map((target, i) => (
            <div key={`${target.r}-${i}`} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn(
                    'border-0',
                    target.isTrailingStop ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                  )}>
                    {formatR(target.r)}R {target.isTrailingStop ? '(Trailing Stop)' : ''}
                  </Badge>
                  <span className="text-sm text-white/70">
                    Sell {Number(target.shares || 0).toLocaleString()} ({target.percent.toFixed(1)}%) @ {asMoney(target.price)}
                  </span>
                </div>

                <span className="text-sm font-bold text-emerald-300">
                  +{asMoney(target.profit)}
                </span>
              </div>

              <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    target.isTrailingStop
                      ? 'bg-gradient-to-r from-purple-500/70 to-fuchsia-400/70'
                      : 'bg-gradient-to-r from-emerald-500/70 to-blue-400/70'
                  )}
                  style={{ width: `${Math.max(4, target.percent)}%` }}
                />
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg p-3 border border-emerald-500/20">
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
