/**
 * @file src/pages/Calculator.jsx
 *
 * Phase 2 — rewired to useSettings() + useCalcHistory() (Firebase-backed).
 */

import React, { useEffect } from 'react';
import { useLocation }       from 'react-router-dom';
import FloatPositionSizer    from '@/components/calculator/FloatPositionSizer';
import { useCalcHistory }    from '@/hooks/useCalcHistory';

export default function Calculator() {
  const location    = useLocation();
  const historyData = location.state?.historyItem ?? null;
  const { addToHistory } = useCalcHistory();

  return (
    <FloatPositionSizer
      historyData={historyData}
      onCalculationSaved={addToHistory}
    />
  );
}