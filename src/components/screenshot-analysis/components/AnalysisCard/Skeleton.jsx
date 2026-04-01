/**
 * @file src/components/screenshot-analysis/components/AnalysisCard/Skeleton.js
 *
 * Skeleton loading component.
 */

import React from 'react';

export function Skeleton({ className = '' }) {
  return <div className={`rounded bg-white/5 animate-pulse ${className}`} />;
}


