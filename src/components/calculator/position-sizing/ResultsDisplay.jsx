import React from 'react';
import { Loader2, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatAnalysisTimer, useAnalysisTimer } from '@/lib/context/AnalysisTimerContext';
import { asMoney, SWEET_MID } from './resultsDisplayUtils';
import { useResultsDisplayCalculations } from './useResultsDisplayCalculations';
import ExitStrategyLadder from './ExitStrategyLadder';

function StatBlock({ label, value, color = 'text-white', sub = null }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-white/35">{label}</p>
      <p className={cn('mt-0.5 text-sm font-semibold tabular-nums', color)}>{value}</p>
      {sub && <p className="mt-0.5 text-[9px] leading-snug text-white/30">{sub}</p>}
    </div>
  );
}

function ResultsDisplay({
  entryPrice,
  stopLossPrice,
  targetProfit,
  shares,
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
  onApplyEntry,
  todayPnL = 0,
  maxDailyLoss = 0,
  todayTradeCount = 0,
  maxDailyTrades = null,
  exitPrice = '',
  onExitPriceChange,
  onAddToJournal,
  canAddToJournal = false,
  isSavingTrade = false,
  // Futures: exits are priced in ticks, worth tick value each per contract.
  isFutures = false,
  tickSize,
  tickValue,
  stopTicks,
}) {
  const hasTradeLimit = maxDailyTrades != null
    && Number.isFinite(Number(maxDailyTrades))
    && Number(maxDailyTrades) > 0;
  const tradeLimit = hasTradeLimit ? Number(maxDailyTrades) : null;
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

  const {
    riskUsageSubtext,
    ladderSegments,
    ladderCheckpoints,
    activeLadderCheckpointIndex,
    activeLadderCheckpointCenter,
    isActiveLadderUrgent,
    timeCue,
  } = useResultsDisplayCalculations({
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
    isFutures,
    tickSize,
    tickValue,
    stopTicks,
  });

  const isTimerUrgentBlink = isTimerRunning && remainingSeconds > 0 && remainingSeconds <= 10;
  const isLong = direction !== 'short';

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
          {/* Position Size | At Risk */}
          <div className="flex items-start gap-6 flex-wrap">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">Position Size</p>
              <p className="mt-0.5 text-[28px] font-black leading-none tabular-nums text-white">
                {Number(shares || 0).toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-white/30 tracking-wide">shares</p>
            </div>

            <div className="border-l border-white/10 pl-6 flex gap-5">
              <div className="flex gap-5">
                <StatBlock label="At Risk" value={asMoney(actualRisk)} color="text-rose-300" sub={riskUsageSubtext} />
                {(() => {
                  const entry = Number(entryPrice);
                  const stop = Number(stopLossPrice);
                  if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(stop) || stop <= 0 || entry === stop) return null;
                  const riskPct = (Math.abs(entry - stop) / entry) * 100;
                  if (Math.abs(riskPct - SWEET_MID) < 0.15) return null;
                  const suggestedStop = entry + (isLong ? -1 : 1) * entry * (SWEET_MID / 100);
                  const sweetMidFraction = SWEET_MID / 100;
                  const suggestedEntry = isLong
                    ? stop / (1 - sweetMidFraction)
                    : stop / (1 + sweetMidFraction);
                  return (
                    <>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-white/35">Suggested Stop</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-sm font-semibold font-mono text-white/70">${suggestedStop.toFixed(2)}</span>
                          {onApplyStop && (
                            <button
                              type="button"
                              onClick={() => onApplyStop(suggestedStop.toFixed(2))}
                              className="rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                        <p className="mt-0.5 text-[9px] text-white/30">{SWEET_MID}% risk · sweet spot</p>
                      </div>
                      {suggestedEntry > 0 && Number.isFinite(suggestedEntry) && (
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-white/35">Suggested Entry</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-sm font-semibold font-mono text-white/70">${suggestedEntry.toFixed(2)}</span>
                            {onApplyEntry && (
                              <button
                                type="button"
                                onClick={() => onApplyEntry(suggestedEntry.toFixed(2))}
                                className="rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
                              >
                                Apply
                              </button>
                            )}
                          </div>
                          <p className="mt-0.5 text-[9px] text-white/30">{SWEET_MID}% risk · sweet spot</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Today's standing sits beside the position's own risk: how much
                is on the line here, against how much is left for the day. */}
            <div className="ml-auto flex items-center gap-1.5 self-center">
          {/* How many trades today, against the cap — the other number that
              decides whether this position should be taken at all. */}
          <span
            className={cn(
              'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums',
              !hasTradeLimit
                ? 'border-white/10 bg-white/[0.03] text-white/50'
                : todayTradeCount >= tradeLimit
                  ? 'border-rose-500/35 bg-rose-500/12 text-rose-300'
                  : todayTradeCount >= tradeLimit - 1
                    ? 'border-amber-500/35 bg-amber-500/12 text-amber-300'
                    : 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300',
            )}
            title="Trades taken today against this tier's daily trade cap"
          >
            {todayTradeCount}{hasTradeLimit ? `/${tradeLimit}` : ''}T
          </span>

          {/* Where today stands against the loss cap — the number that decides
              whether this position should be taken at all. */}
          {maxDailyLoss > 0 && (
            <span
              className={cn(
                'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold',
                todayPnL <= -maxDailyLoss
                  ? 'border-rose-500/35 bg-rose-500/10 text-rose-300'
                  : todayPnL < 0
                    ? 'border-amber-500/25 bg-amber-500/[0.08] text-amber-300'
                    : 'border-white/10 bg-white/[0.03] text-white/50',
              )}
              title="Today's P&L against this tier's daily loss limit"
            >
              {todayPnL >= 0 ? '+' : '-'}${Math.abs(todayPnL).toFixed(0)}
              <span className="opacity-50"> / ${maxDailyLoss.toFixed(0)}</span>
            </span>
          )}
            </div>
          </div>
        </div>

      </div>

      <ExitStrategyLadder
        playbookSetupName={playbookSetupName}
        ladderSegments={ladderSegments}
        ladderCheckpoints={ladderCheckpoints}
        activeLadderCheckpointIndex={activeLadderCheckpointIndex}
        activeLadderCheckpointCenter={activeLadderCheckpointCenter}
        isActiveLadderUrgent={isActiveLadderUrgent}
        timeCue={timeCue}
        isExpired={isExpired}
        isNearEnd={isNearEnd}
      />

      {/* Closing the trade belongs to the position, not to the sizing form. */}
      {typeof onAddToJournal === 'function' && (
        <div className="flex items-center gap-2 border-t border-white/8 bg-white/[0.02] px-4 py-2.5">
          <span className="text-[10px] uppercase tracking-widest text-white/40">Close at</span>
          <Input
            type="text"
            inputMode="decimal"
            value={exitPrice}
            onChange={(event) => onExitPriceChange?.(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && canAddToJournal) onAddToJournal(); }}
            placeholder="Exit price"
            className="h-9 w-32 bg-white/5 border-white/10 font-mono text-sm tabular-nums focus-visible:ring-emerald-500/30"
            disabled={isSavingTrade}
          />
          <Button
            onClick={onAddToJournal}
            disabled={!canAddToJournal || isSavingTrade}
            className="h-9 gap-1.5 bg-emerald-600 px-3 text-xs font-semibold hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            title="Save this position to the journal as a closed trade"
          >
            {isSavingTrade
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <><Plus className="h-4 w-4" />Log Trade</>}
          </Button>
          {!canAddToJournal && !isSavingTrade && (
            <span className="text-[10px] text-white/30">needs a stop and an exit</span>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(ResultsDisplay);
