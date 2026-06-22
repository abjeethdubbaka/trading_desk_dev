/**
 * @file src/components/calculator/FloatPositionSizer.jsx
 *
 * Main calculator component.
 * Wired to useSettings() and accepts onCalculationSaved callback.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ShieldX, X } from 'lucide-react';
import {
  MemoizedFloatInputForm,
  MemoizedResultsDisplay,
} from './memoized';
import { StopStructureAnalysis } from './position-sizing/StopStructureAnalysis';
import { useFloatPositionSizerController } from './float-position-sizer/hooks/useFloatPositionSizerController';

export default function FloatPositionSizer({ historyData, onCalculationSaved = () => {} }) {
  const controller = useFloatPositionSizerController({
    historyData,
    onCalculationSaved,
  });

  const [limitDismissed, setLimitDismissed] = useState(false);

  const isStale = Boolean(controller.calculation?._stale);
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

      <Card className="border-white/10 bg-gradient-to-br from-[#1a1a24] to-[#131c2a] shadow-[0_10px_30px_-18px_rgba(59,130,246,0.5)]">
        <CardContent className="p-6 space-y-6">
          <MemoizedFloatInputForm
            symbol={controller.symbol}
            setSymbol={controller.updateSymbol}
            entryPrice={controller.entryPrice}
            setEntryPrice={controller.updateEntryPrice}
            customStopLossPrice={controller.customStop}
            setCustomStopLossPrice={controller.updateCustomStop}
            exitPrice={controller.exitPrice}
            setExitPrice={controller.updateExitPrice}
            onCalculate={controller.handleCalculate}
            onAddToJournal={controller.handleAddToJournal}
            canAddToJournal={controller.canAddToJournal}
            isSavingTrade={controller.isSavingTrade}
            onReset={controller.handleReset}
            playbookEntries={controller.playbookEntries}
            selectedSetupId={controller.selectedSetupId}
            onSetupChange={controller.setSelectedSetupId}
            selectedSetup={controller.selectedSetup}
            riskMultiplier={controller.riskMultiplier}
            baseRiskAmount={controller.riskAmount}
            todayTradeCount={controller.todayTradeCount}
            maxDailyTrades={controller.maxDailyTrades}
            disabled={false}
          />
        </CardContent>
      </Card>

      <StopStructureAnalysis
        entryPrice={controller.entryPrice}
        stopLoss={controller.customStop}
      />

      {showResults && (
        <div className={isStale ? 'opacity-50 pointer-events-none select-none' : ''}>
          {isStale && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Inputs changed — press Calculate to refresh
            </div>
          )}
          <MemoizedResultsDisplay
            {...controller.calculation}
            exitStrategy={controller.playbookExitStrategy ?? controller.exitStrategy}
            playbookSetupName={controller.playbookExitStrategy ? (controller.selectedSetup?.name ?? null) : null}
            onApplyStop={controller.updateCustomStop}
          />
        </div>
      )}

    </div>
  );
}
