/**
 * @file src/components/screenshot-analysis/components/AnalysisCard/AdvancedAnalysisSection.js
 *
 * Advanced analysis section component.
 */

import React from 'react';
import {
  ActionItems,
  ExecutionTimeline,
  MistakeCostCard,
  PatternAlert,
} from '../../AdvancedAnalysisPanels.jsx';

export function AdvancedAnalysisSection({ advanced }) {
  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
      <h3 className="text-sm font-medium">Advanced Analysis</h3>
      <ExecutionTimeline entry={advanced.execution?.entry} exit={advanced.execution?.exit} />
      <MistakeCostCard analysis={advanced} />
      <PatternAlert pattern={advanced.pattern_matching} />
      <ActionItems items={advanced.improvement_analysis?.action_items || []} />
    </div>
  );
}


