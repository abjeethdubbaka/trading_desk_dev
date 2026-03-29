/**
 * @file src/components/calculator/hooks/useDebouncedCalculation.js
 *
 * Debounced calculation hook for performance optimization.
 */

import { useState, useEffect, useCallback } from 'react';
import { calcPosition } from '@/lib/calculations/trades';

export function useDebouncedCalculation(params, delay = 300) {
  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculate = useCallback(() => {
    if (!params.entryPrice || !params.accountSize) {
      setResult(null);
      return;
    }

    setIsCalculating(true);
    
    try {
      const calcResult = calcPosition(params);
      setResult(calcResult);
    } catch (error) {
      
      setResult(null);
    } finally {
      setIsCalculating(false);
    }
  }, [params]);

  useEffect(() => {
    const timer = setTimeout(calculate, delay);
    return () => clearTimeout(timer);
  }, [calculate, delay]);

  return { result, isCalculating };
}


