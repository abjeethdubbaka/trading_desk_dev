import { useEffect } from 'react';

export function useFloatAutoCalculate(
  manualCalculation,
  entryPrice,
  accountSize,
  shareFloat,
  floatCategories,
  isInitialized,
  calculatePosition,
  setManualCalculation
) {
  // Only calculate when manually triggered
  useEffect(() => {
    if (manualCalculation) {
      const hasMinimumData = entryPrice && accountSize && floatCategories && isInitialized;
      
      if (hasMinimumData) {
                calculatePosition();
        setManualCalculation(false);
      }
    }
  }, [manualCalculation, entryPrice, accountSize, floatCategories, isInitialized, calculatePosition, setManualCalculation]);

  // Recalculate when direction changes and we have existing calculation
  useEffect(() => {
    // This would need calculation state passed in
    // if (entryPrice && accountSize && shareFloat && calculation) {
    //   calculatePosition();
    // }
  }, []); // Placeholder for direction change logic
}


