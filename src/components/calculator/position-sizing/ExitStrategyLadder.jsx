import React from 'react';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { asMoney, formatElapsedLabel, formatR } from './resultsDisplayUtils';

export default function ExitStrategyLadder({
  playbookSetupName,
  ladderSegments,
  ladderCheckpoints,
  activeLadderCheckpointIndex,
  activeLadderCheckpointCenter,
  isActiveLadderUrgent,
  timeCue,
  isExpired,
  isNearEnd,
}) {
  return (
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
              const isActive = cp.index === activeLadderCheckpointIndex;
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
  );
}
