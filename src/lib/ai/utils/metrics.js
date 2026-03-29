/**
 * @file src/lib/ai/utils/metrics.js
 *
 * Metrics calculation utilities for AI analysis.
 */

import { parseDollarAmount } from './parsers.js';

export function calculateSessionMetrics(analyses) {
  if (!Array.isArray(analyses) || analyses.length === 0) {
    return {
      totalAnalyses: 0,
      averageConfidence: 0,
      totalPotentialSavings: 0,
      mostCommonIssue: null,
      averageEntryQuality: 0
    };
  }

  const validAnalyses = analyses.filter(analysis => analysis && typeof analysis === 'object');
  
  // Calculate average confidence
  const totalConfidence = validAnalyses.reduce((sum, analysis) => {
    return sum + (analysis.confidence || 0);
  }, 0);
  const averageConfidence = totalConfidence / validAnalyses.length;

  // Calculate total potential savings
  const totalPotentialSavings = validAnalyses.reduce((sum, analysis) => {
    const entrySavings = parseDollarAmount(analysis.entry_savings_potential);
    const exitLeftOnTable = parseDollarAmount(analysis.exit_left_on_table);
    return sum + entrySavings + exitLeftOnTable;
  }, 0);

  // Find most common issue
  const issues = validAnalyses
    .map(analysis => analysis.one_thing_to_change)
    .filter(issue => issue && typeof issue === 'string');
  
  const mostCommonIssue = getMostCommonItem(issues);

  // Calculate average entry quality
  const totalEntryQuality = validAnalyses.reduce((sum, analysis) => {
    return sum + (analysis.entry_quality_score || 0);
  }, 0);
  const averageEntryQuality = totalEntryQuality / validAnalyses.length;

  return {
    totalAnalyses: validAnalyses.length,
    averageConfidence,
    totalPotentialSavings,
    mostCommonIssue,
    averageEntryQuality
  };
}

export function calculateExecutionMetrics(advancedAnalysis) {
  if (!advancedAnalysis || !advancedAnalysis.execution) {
    return {
      entryGrade: 'C',
      exitGrade: 'C',
      totalTimingCost: 0,
      positionMistakeCost: 0
    };
  }

  const { execution } = advancedAnalysis;
  
  return {
    entryGrade: execution.entry?.grade || 'C',
    exitGrade: execution.exit?.grade || 'C',
    totalTimingCost: (execution.entry?.timing?.cost_of_deviation || 0) + 
                     (execution.exit?.timing?.cost_of_deviation || 0),
    positionMistakeCost: execution.position?.cost_of_size_mistake || 0
  };
}

export function calculateImprovementMetrics(improvementAnalysis) {
  if (!improvementAnalysis) {
    return {
      primaryMistakeCost: 0,
      secondaryMistakeCost: 0,
      projectedPnl: 0,
      actualVsProjected: 0,
      actionItemsCount: 0
    };
  }

  return {
    primaryMistakeCost: improvementAnalysis.primary_mistake?.cost || 0,
    secondaryMistakeCost: improvementAnalysis.secondary_mistake?.cost || 0,
    projectedPnl: improvementAnalysis.rewind?.projected_pnl || 0,
    actualVsProjected: improvementAnalysis.rewind?.actual_vs_projected || 0,
    actionItemsCount: improvementAnalysis.action_items?.length || 0
  };
}

function getMostCommonItem(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const frequency = {};
  let maxCount = 0;
  let mostCommon = null;

  for (const item of items) {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxCount) {
      maxCount = frequency[item];
      mostCommon = item;
    }
  }

  return mostCommon;
}


