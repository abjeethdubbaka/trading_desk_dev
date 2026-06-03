/**
 * @file src/components/calculator/FloatPositionSizer.jsx
 *
 * Main calculator component.
 * Wired to useSettings() and accepts onCalculationSaved callback.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  MemoizedFloatInputForm,
  MemoizedResultsDisplay,
} from './memoized';
import { FloatSmartPlanCard } from './float-position-sizer/FloatSmartPlanCard';
import { StopStructureAnalysis } from './position-sizing/StopStructureAnalysis';
import { useFloatPositionSizerController } from './float-position-sizer/hooks/useFloatPositionSizerController';

export default function FloatPositionSizer({ historyData, onCalculationSaved = () => {} }) {
  const controller = useFloatPositionSizerController({
    historyData,
    onCalculationSaved,
  });

  const isStale = Boolean(controller.calculation?._stale);
  const showResults = Boolean(controller.calculation?._viewSource);

  return (
    <div className="space-y-4 w-full">
      <Card className="border-white/10 bg-gradient-to-br from-[#1a1a24] to-[#131c2a] shadow-[0_10px_30px_-18px_rgba(59,130,246,0.5)]">
        <CardContent className="p-6 space-y-6">
          <MemoizedFloatInputForm
            symbol={controller.symbol}
            setSymbol={controller.updateSymbol}
            entryPrice={controller.entryPrice}
            setEntryPrice={controller.updateEntryPrice}
            customStopLossPrice={controller.customStop}
            setCustomStopLossPrice={controller.updateCustomStop}
            comment={controller.comment}
            setComment={controller.updateComment}
            loading={controller.loadingFloat}
            fetchShareFloat={controller.fetchShareFloat}
            onCalculate={controller.handleCalculate}
            onAddToJournal={controller.handleAddToJournal}
            canAddToJournal={controller.canAddToJournal}
            disabled={false}
          />
        </CardContent>
      </Card>

      <FloatSmartPlanCard
        symbol={controller.symbol}
        floatData={controller.floatData}
        loadingFloat={controller.loadingFloat}
        smartFloatPlan={controller.smartFloatPlan}
        onRefreshShareFloat={controller.fetchShareFloat}
        onApplyFloatSmartPlan={controller.handleApplyFloatSmartPlan}
      />

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
            exitStrategy={controller.exitStrategy}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
        <Button
          variant="ghost"
          onClick={controller.handleRefreshSettings}
          className="text-white/35 hover:text-white/70 gap-2 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Settings
        </Button>

        <Button
          variant="ghost"
          onClick={controller.handleReset}
          className="text-white/35 hover:text-white/70 gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
