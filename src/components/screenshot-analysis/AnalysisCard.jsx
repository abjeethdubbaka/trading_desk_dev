/**
 * @file src/components/screenshot-analysis/AnalysisCard.jsx
 *
 * Analysis card component - re-export from split components for backward compatibility.
 */

// Default export for backward compatibility
export { default as AnalysisCard } from './components/AnalysisCard/AnalysisCard.jsx';

// Add a default export that re-exports the AnalysisCard
export { default } from './components/AnalysisCard/AnalysisCard.jsx';

// Named exports for individual components
export { AIStateBadge } from './components/AnalysisCard/AIStateBadge.jsx';
export { ScoreBadge } from './components/AnalysisCard/ScoreBadge.jsx';
export { ConfidenceBar } from './components/AnalysisCard/ConfidenceBar.jsx';
export { SignalPills } from './components/AnalysisCard/SignalPills.jsx';
export { Skeleton } from './components/AnalysisCard/Skeleton.jsx';


