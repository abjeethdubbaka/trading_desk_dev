/**
 * @file src/components/calculator/FloatPositionSizer.jsx
 *
 * Main calculator component.
 * Wired to useSettings() and accepts onCalculationSaved callback.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sigma, ShieldX, X } from 'lucide-react';
import FloatInputForm from './input/FloatInputForm';
import ResultsDisplay from './position-sizing/ResultsDisplay';
import { StopStructureAnalysis } from './position-sizing/StopStructureAnalysis';
import { useFloatPositionSizerController } from './float-position-sizer/hooks/useFloatPositionSizerController';

export default function FloatPositionSizer({ historyData, onCalculationSaved = () => {} }) {
  const controller = useFloatPositionSizerController({
    historyData,
    onCalculationSaved,
  });

  const [limitDismissed, setLimitDismissed] = useState(false);

  const showResults = Boolean(controller.calculation?._viewSource);

  const hasLimit = controller.maxDailyTrades != null && Number(controller.maxDailyTrades) > 0;
  const limitReached = hasLimit && controller.todayTradeCount >= Number(controller.maxDailyTrades);
  const showLimitOverlay = limitReached && !limitDismissed;

  // Reset dismiss when count drops below limit (e.g. trade deleted)
  React.useEffect(() => {
    if (!limitReached) setLimitDismissed(false);
  }, [limitReached]);

  return (
    <div className="space-y-4 w-full">

      {/* Daily trade limit overlay */}
      {showLimitOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative mx-4 max-w-sm w-full rounded-2xl border border-rose-500/40 bg-[#1a0d0d] shadow-[0_24px_80px_-20px_rgba(239,68,68,0.6)] p-8 text-center">
            <button
              type="button"
              onClick={() => setLimitDismissed(true)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/15">
              <ShieldX className="h-7 w-7 text-rose-400" />
            </div>

            <h2 className="text-lg font-bold text-white">Daily Limit Reached</h2>
            <p className="mt-1.5 text-sm text-white/55">
              You've taken{' '}
              <span className="font-semibold text-rose-300">{controller.todayTradeCount} of {Number(controller.maxDailyTrades)}</span>{' '}
              allowed trades today.
            </p>
            <p className="mt-3 text-xs text-white/35 leading-relaxed">
              Protect your capital. Step away, review your trades, and come back tomorrow with a clear head.
            </p>

            <button
              type="button"
              onClick={() => setLimitDismissed(true)}
              className="mt-6 w-full rounded-lg border border-rose-500/30 bg-rose-500/15 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors"
            >
              I understand — dismiss
            </button>
          </div>
        </div>
      )}

      {/* Daily loss limit overlay */}
      {controller.lossLimitInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative mx-4 max-w-sm w-full rounded-2xl border border-rose-500/40 bg-[#1a0d0d] shadow-[0_24px_80px_-20px_rgba(239,68,68,0.6)] p-8 text-center">
            <button
              type="button"
              onClick={controller.dismissLossLimitInfo}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/15">
              <ShieldX className="h-7 w-7 text-rose-400" />
            </div>

            <h2 className="text-lg font-bold text-white">Daily Loss Limit Reached</h2>
            <p className="mt-1.5 text-sm text-white/55">
              You're down{' '}
              <span className="font-semibold text-rose-300">
                ${Math.abs(controller.lossLimitInfo.todayPnL).toFixed(0)} of ${controller.lossLimitInfo.maxDailyLoss.toFixed(0)}
              </span>{' '}
              max daily loss today.
            </p>
            <p className="mt-3 text-xs text-white/35 leading-relaxed">
              Protect your capital. Step away, review your trades, and come back tomorrow with a clear head.
            </p>

            <button
              type="button"
              onClick={controller.dismissLossLimitInfo}
              className="mt-6 w-full rounded-lg border border-rose-500/30 bg-rose-500/15 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors"
            >
              I understand — dismiss
            </button>
          </div>
        </div>
      )}

      {/* Inputs on the left, the position they imply on the right — nothing
          to scroll to, and the snapshot re-sizes as the numbers are typed. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:items-start">
        <Card className="border-white/10 bg-gradient-to-br from-[#1a1a24] to-[#131c2a] shadow-[0_10px_30px_-18px_rgba(59,130,246,0.5)] lg:sticky lg:top-4">
          <CardContent className="p-5 space-y-5">
            <FloatInputForm
              symbol={controller.symbol}
              setSymbol={controller.updateSymbol}
              entryPrice={controller.entryPrice}
              setEntryPrice={controller.updateEntryPrice}
              customStopLossPrice={controller.customStop}
              setCustomStopLossPrice={controller.updateCustomStop}
              onReset={controller.handleReset}
              playbookEntries={controller.playbookEntries}
              selectedSetupId={controller.selectedSetupId}
              onSetupChange={controller.setSelectedSetupId}
              selectedSetup={controller.selectedSetup}
              riskMultiplier={controller.riskMultiplier}
              baseRiskAmount={controller.riskAmount}
              disabled={false}
              isFutures={controller.isFutures}
              futuresPreset={controller.futuresPreset}
              onFuturesPresetChange={controller.setFuturesPreset}
              tickSize={controller.tickSize}
              onTickSizeChange={controller.setTickSize}
              tickValue={controller.tickValue}
              onTickValueChange={controller.setTickValue}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {showResults ? (
            <ResultsDisplay
              {...controller.calculation}
              exitStrategy={controller.playbookExitStrategy ?? controller.exitStrategy}
              playbookSetupName={controller.playbookExitStrategy ? (controller.selectedSetup?.name ?? null) : null}
              onApplyStop={controller.updateCustomStop}
              onApplyEntry={controller.updateEntryPrice}
              todayPnL={controller.todayPnL}
              maxDailyLoss={controller.maxDailyLoss}
              todayTradeCount={controller.todayTradeCount}
              maxDailyTrades={controller.maxDailyTrades}
              exitPrice={controller.exitPrice}
              onExitPriceChange={controller.updateExitPrice}
              onAddToJournal={controller.handleAddToJournal}
              canAddToJournal={controller.canAddToJournal}
              isSavingTrade={controller.isSavingTrade}
              isFutures={controller.isFutures}
              tickSize={controller.tickSize}
              tickValue={controller.tickValue}
            />
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-8 text-center">
              <Sigma className="h-6 w-6 text-white/20" />
              <p className="mt-3 text-sm font-medium text-white/55">Enter a stop and an entry price</p>
              <p className="mt-1 text-xs text-white/30">The position sizes itself as you type.</p>
            </div>
          )}

          <StopStructureAnalysis
            entryPrice={controller.entryPrice}
            stopLoss={controller.customStop}
          />
        </div>
      </div>
    </div>
  );
}
