/**
 * @file src/components/calculator/memoized/index.js
 *
 * Memoized calculator components for performance.
 */

import React from 'react';
import ResultsDisplay from '../position-sizing/ResultsDisplay';
import FloatInputForm from '../input/FloatInputForm';

// Memoize expensive components
export const MemoizedResultsDisplay = React.memo(ResultsDisplay);
export const MemoizedFloatInputForm = React.memo(FloatInputForm);

// Add display names for debugging
MemoizedResultsDisplay.displayName = 'MemoizedResultsDisplay';
MemoizedFloatInputForm.displayName = 'MemoizedFloatInputForm';
