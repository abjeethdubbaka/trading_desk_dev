import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { PositionCalculator } from '../PositionCalculator';

// Create singleton instances
const positionCalculator = new PositionCalculator();

export function useFloatCalculation(
  entryPrice,
  accountSize,
  positionSizingPercent,
  defaultStopLossPercent,
  stopLossPrice,
  targetProfitDollars,
  floatSettings,
  floatCategories,
  direction,
  symbol,
  shareFloat,
  floatCategory,
  setCalculation,
  settings
) {
  // Add calculation lock to prevent infinite loops
  const isCalculating = useRef(false);
  
  const calculatePosition = useCallback(() => {
    if (isCalculating.current) return;
    
    // Prevent multiple simultaneous calculations
    isCalculating.current = true;
    
    try {
      // Validate required fields before calculating
      if (!entryPrice || entryPrice.trim() === '') {
                return;
      }
      
      if (!stopLossPrice || stopLossPrice.trim() === '') {
                return;
      }
      
      // Validate float categories are configured
      if (!floatCategories || Object.keys(floatCategories).length === 0) {
        throw new Error('Float categories not configured. Please set up float categories in Settings.');
      }
      
      if (floatCategory && floatCategories[floatCategory]) {
        // Category analysis available
      }
      
      if (!positionCalculator) {
        throw new Error('Position calculator not initialized. Please check your settings.');
      }
      
      const calculation = positionCalculator.calculatePosition({
        entryPrice,
        accountSize,
        positionSizingPercent,
        stopLossPercent: defaultStopLossPercent,
        stopLossPrice,
        direction,
        symbol: symbol || null, // Don't provide default symbol
        shareFloat: symbol ? shareFloat : null, // Only provide shareFloat when symbol is provided
        floatCategory: symbol ? floatCategory : null, // Only provide floatCategory when symbol is provided
        floatCategories: symbol ? floatCategories : {}, // Only provide floatCategories when symbol is provided
        settings // Pass the settings object
      });

      // Calculate targets
      const targets = positionCalculator.calculateTargets(
        calculation,
        targetProfitDollars,
        symbol ? shareFloat : null, // Only pass shareFloat when symbol is provided
        settings, // Pass the correct settings object, not floatSettings
        floatCategories
      );

      const finalCalculation = {
        ...calculation,
        ...targets,
        calculatedAt: new Date().toLocaleString()
      };
      
      // Add to calculation history
      try {
        const historyItem = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          symbol: finalCalculation.symbol || 'Unknown',
          entryPrice: finalCalculation.entryPrice,
          shares: finalCalculation.shares,
          stopLossPrice: finalCalculation.stopLossPrice,
          targetPrice: finalCalculation.targetPrice,
          positionValue: finalCalculation.positionValue,
          actualRisk: finalCalculation.actualRisk,
          riskAmount: finalCalculation.riskAmount,
          targetProfit: finalCalculation.targetProfit,
          direction: finalCalculation.direction || 'long',
          riskLevel: finalCalculation.riskLevel || 'Low',
          useIntelligentFlow: finalCalculation.useIntelligentFlow || false,
          floatCategory: finalCalculation.floatCategory || null,
          calculatedAt: finalCalculation.calculatedAt
        };

        // Get existing history from localStorage
        const existingHistory = localStorage.getItem('calcHistory');
        let history = existingHistory ? JSON.parse(existingHistory) : [];
        
        // Add new calculation to the beginning
        history = [historyItem, ...history].slice(0, 50); // Keep last 50 items
        
        // Save to localStorage
        localStorage.setItem('calcHistory', JSON.stringify(history));
        
      } catch (error) {
        
      }
      
      // Now set the calculation state after all other logic is complete
      setCalculation(finalCalculation);
                  
      // Show success toast after state is set
      toast.success(`Position calculated: ${finalCalculation.shares.toLocaleString()} shares`);
    
    } catch (error) {
      
      toast.error(error.message);
    } finally {
      // Reset calculation lock
      isCalculating.current = false;
    }
  }, [
    entryPrice,
    accountSize,
    positionSizingPercent,
    defaultStopLossPercent,
    targetProfitDollars,
    floatSettings,
    floatCategories,
    direction,
    symbol,
    shareFloat,
    floatCategory,
    setCalculation
  ]);

  return {
    calculatePosition
  };
}


