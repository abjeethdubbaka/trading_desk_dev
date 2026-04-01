/**
 * @file src/components/screenshot-analysis/components/AnalysisCard/AnalysisCard.js
 *
 * Main analysis card component.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Loader2 } from 'lucide-react';
import { AIStateBadge } from './AIStateBadge.jsx';
import { ScoreBadge } from './ScoreBadge.jsx';
import { ConfidenceBar } from './ConfidenceBar.jsx';
import { SignalPills } from './SignalPills.jsx';
import { Skeleton } from './Skeleton.jsx';
import { ReviewSection } from './ReviewSection.jsx';
import { CouldHaveDoneBetter } from './CouldHaveDoneBetter.jsx';
import { AdvancedAnalysisSection } from './AdvancedAnalysisSection.jsx';

export default function AnalysisCard({
  shot,
  row,
  aiState,
  aiError,
  setupOptions,
  statusOptions,
  entryTimingOptions,
  exitTimingOptions,
  onFieldChange,
}) {
  const isLoading = aiState === 'loading';
  const advanced = row.advanced_analysis;

  return (
    <Card className="bg-[#13131c] border-white/10 overflow-hidden">
      <CardHeader className="pb-2 border-b border-white/5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm truncate text-white/70 font-normal">{shot.name}</CardTitle>
          <AIStateBadge state={aiState} error={aiError} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="relative rounded-lg overflow-hidden border border-white/10">
          <img src={shot.url} alt={shot.name} className="w-full h-52 object-cover" />
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              <p className="text-xs text-blue-300">Claude Vision analyzing…</p>
            </div>
          )}

          {!isLoading && row.detected_setup && (
            <div className="absolute top-2 left-2">
              <span className="text-xs font-medium px-2 py-1 rounded bg-black/70 text-white border border-white/20">
                {row.detected_setup}
              </span>
            </div>
          )}

          {!isLoading && row.entry_quality_score !== undefined && row.entry_quality_score !== null && row.entry_quality_score !== '' && (
            <div className="absolute top-2 right-2">
              <ScoreBadge score={row.entry_quality_score} />
            </div>
          )}
        </div>

        {aiState === 'error' && (
          <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
            AI analysis failed for this image. You can still fill everything manually.
            {aiError ? ` ${aiError}` : ''}
          </div>
        )}

        {isLoading ? <Skeleton className="h-6" /> : <ConfidenceBar value={row.confidence} />}

        <div className="space-y-1">
          <label className="text-xs text-white/50">AI narrative</label>
          {isLoading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <textarea
              value={row.narrative || ''}
              onChange={(e) => onFieldChange(shot.id, 'narrative', e.target.value)}
              className="bg-white/5 border-white/10 min-h-[68px] text-sm resize-none w-full rounded-md p-2"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-white/50">Risk signals</label>
            {isLoading ? <Skeleton className="h-7" /> : <SignalPills signals={row.risk_signals} variant="risk" />}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/50">Strength signals</label>
            {isLoading ? <Skeleton className="h-7" /> : <SignalPills signals={row.strength_signals} variant="strength" />}
          </div>
        </div>

        <ReviewSection
          shot={shot}
          row={row}
          isLoading={isLoading}
          setupOptions={setupOptions}
          statusOptions={statusOptions}
          onFieldChange={onFieldChange}
        />

        <CouldHaveDoneBetter
          shot={shot}
          row={row}
          isLoading={isLoading}
          entryTimingOptions={entryTimingOptions}
          exitTimingOptions={exitTimingOptions}
          onFieldChange={onFieldChange}
        />

        {advanced && (
          <AdvancedAnalysisSection advanced={advanced} />
        )}
      </CardContent>
    </Card>
  );
}


