/**
 * @file src/components/calculator/memoized/index.js
 *
 * Memoized calculator components for performance.
 */

import React from 'react';
import ResultsDisplay from '../position-sizing/ResultsDisplay';
import FloatInputForm from '../input/FloatInputForm';
import FloatInfoBox from '../input/FloatInfoBox';

// Memoize expensive components
export const MemoizedResultsDisplay = React.memo(ResultsDisplay);
export const MemoizedFloatInputForm = React.memo(FloatInputForm);
export const MemoizedFloatInfoBox = React.memo(FloatInfoBox);

// Add display names for debugging
MemoizedResultsDisplay.displayName = 'MemoizedResultsDisplay';
MemoizedFloatInputForm.displayName = 'MemoizedFloatInputForm';
MemoizedFloatInfoBox.displayName = 'MemoizedFloatInfoBox';


