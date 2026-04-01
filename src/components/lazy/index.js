/**
 * @file src/components/lazy/index.js
 *
 * Lazy loaded components for code splitting.
 */

import { lazy } from 'react';

// Lazy load heavy components
export const LazyAnalysisCard = lazy(() => import('../screenshot-analysis/AnalysisCard'));
export const LazyPerformanceCharts = lazy(() => import('../performance/PerformanceCharts'));
export const LazyFloatPositionSizer = lazy(() => import('../calculator/FloatPositionSizer'));
export const LazyJournalTable = lazy(() => import('../journal/JournalTable'));
export const LazyScreenshotAnalysis = lazy(() => import('../screenshot-analysis/ScreenshotAnalysis'));

// Create a wrapper component with Suspense
import { Suspense } from 'react';

export function withSuspense(Component, fallback = null) {
  return (
    <Suspense fallback={fallback || <div className="animate-pulse bg-white/10 h-32 rounded" />}>
      <Component />
    </Suspense>
  );
}


