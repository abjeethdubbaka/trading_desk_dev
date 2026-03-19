import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentBalance } from '@/lib/balanceUtils';
import { useTradingContext } from '@/lib/TradingContext';
import { useFloatCategories } from '@/hooks/useFloatCategories';
import { useSettings } from '@/hooks/useSettings';
import { FloatDataService } from './FloatDataService';
import { PositionCalculator } from './PositionCalculator';
import { toast } from 'sonner';

export function useFloatPositionSizer() {
  const { selectedSymbol, selectedEntryPrice } = useTradingContext();
  const { currentBalance } = useCurrentBalance();
  const { floatCategories } = useFloatCategories();
  const { firstSettings: settings, refetch: refetchSettings } = useSettings();
  
  // Settings - only use values from settings
  const accountSize = currentBalance || settings?.account_size || 50000;
  const positionSizingPercent = settings?.position_sizing_percent ?? settings?.default_risk_percent ?? 1;
  const defaultStopLossPercent = settings?.default_stop_loss_percent ?? 4;
  const targetProfitDollars = settings?.target_profit_dollars ?? 500;
  
  // Float-based R:R ratios - only use settings
  const floatSettings = {
    targetProfitDollars,
    float10mMinR: settings?.float_10m_min_r,
    float10mMaxR: settings?.float_10m_max_r,
    float10_50mMinR: settings?.float_10_50m_min_r,
    float10_50mMaxR: settings?.float_10_50m_max_r,
    float50_200mMinR: settings?.float_50_200m_min_r,
    float50_200mMaxR: settings?.float_50_200m_max_r,
    float200mMinR: settings?.float_200m_min_r,
    float200mMaxR: settings?.float_200m_max_r
  };
  
  // State
  const [symbol, setSymbol] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [direction, setDirection] = useState('long');
  const [loading, setLoading] = useState(false);
  const [shareFloat, setShareFloat] = useState(null);
  const [floatCategory, setFloatCategory] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [floatData, setFloatData] = useState(null);
  const [manualCalculation, setManualCalculation] = useState(false);
  const [shares, setShares] = useState(100);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track floatCategories changes
  useEffect(() => {
  }, [floatCategories]);

  // Initialization effect - wait for settings and float categories to load
  useEffect(() => {
    const hasSettings = !!settings;
    const hasFloatCategories = floatCategories && Object.keys(floatCategories).length > 0;
    
    if (hasSettings && hasFloatCategories && !isInitialized) {
      setIsInitialized(true);
    }
  }, [settings, floatCategories, isInitialized]);

  // Helper function to get float category from settings
  const getFloatCategoryFromSettings = (floatSize, categories) => {
    if (!floatSize || !categories) return null;
    
    // Fix mega category max value if it's null (Infinity gets serialized as null)
    if (categories.mega && categories.mega.max === null) {
      categories.mega.max = Infinity;
    }
    
    // Validate category data (allow null for mega max which should be Infinity)
    const invalidCategories = Object.entries(categories).filter(([key, cat]) => {
      if (key === 'mega') {
        // Mega category can have null max (treated as Infinity)
        return cat.min == null || typeof cat.min !== 'number';
      }
      return cat.min == null || cat.max == null || typeof cat.min !== 'number' || typeof cat.max !== 'number';
    });
    
    if (invalidCategories.length > 0) {
      return null;
    }
    
    for (const [key, category] of Object.entries(categories)) {
      const inRange = floatSize >= category.min && (category.max === Infinity ? true : floatSize < category.max);
      
      if (inRange) {
        return { key, ...category };
      }
    }
    
    return null;
  };

  // Services
  const floatDataService = new FloatDataService();
  const positionCalculator = settings ? new PositionCalculator(floatSettings) : null;

  // Sync local state from shared trading context
  useEffect(() => {
    if (selectedSymbol && selectedSymbol !== symbol) {
      // Clear calculation when symbol changes
      setCalculation(null);
      setShareFloat(null);
      setFloatCategory(null);
    }
    if (selectedEntryPrice != null && selectedEntryPrice !== entryPrice) {
      setEntryPrice(selectedEntryPrice);
    }
  }, [selectedSymbol, selectedEntryPrice, symbol, entryPrice]);

  // Load saved calculation and float data on mount
  useEffect(() => {
    // Load saved calculation
    const savedCalculation = localStorage.getItem('lastCalculation');
    if (savedCalculation) {
      try {
        const parsed = JSON.parse(savedCalculation);
        
        // Only restore calculation if it matches current symbol OR if no current symbol
        if (!symbol || parsed.symbol === symbol) {
          setCalculation(parsed);
        } else {
          localStorage.removeItem('lastCalculation');
          setCalculation(null);
        }
      } catch (error) {
        console.error('Failed to load saved calculation:', error);
        localStorage.removeItem('lastCalculation');
        setCalculation(null);
      }
    }

    // Load saved float data
    const savedData = floatDataService.loadSavedFloatData();
    if (savedData) {
      setFloatData(savedData);
      if (savedData.share_float && floatCategories) {
        setShareFloat(savedData.share_float);
        // Use the helper function to get category from settings
        const category = getFloatCategoryFromSettings(savedData.share_float, floatCategories);
        setFloatCategory(category ? category.key : null);
      }
    }
  }, [symbol, floatCategories]);

  // Save calculation when it changes
  useEffect(() => {
    if (calculation) {
      localStorage.setItem('lastCalculation', JSON.stringify(calculation));
    }
  }, [calculation]);

  // Save float data when it changes
  useEffect(() => {
    floatDataService.saveFloatData(floatData);
  }, [floatData]);

  // Auto-calculate when triggered - only if we have all required data and are initialized
  useEffect(() => {
    // Only calculate if manually triggered
    if (manualCalculation) {
      // Calculate with just entry price (use defaults for float)
      const hasMinimumData = entryPrice && accountSize && floatCategories && isInitialized;
      
      if (hasMinimumData) {
        calculatePosition();
        setManualCalculation(false);
      }
    }
  }, [manualCalculation]); // Only listen to manualCalculation changes

  // Recalculate when direction changes and we have existing calculation
  useEffect(() => {
    if (entryPrice && accountSize && shareFloat && calculation) {
      calculatePosition();
    }
  }, [direction]);

  // Recalculate when settings change - only if there's a calculation already
  useEffect(() => {
    if (settings && entryPrice && calculation && shareFloat) {
      // Only recalculate if essential parameters changed, not just any setting
      const newAccountSize = settings?.[0]?.account_size || 100000;
      const newPositionSizingPercent = settings?.[0]?.position_sizing_percent ?? settings?.[0]?.default_risk_percent ?? 1;
      const newDefaultStopLossPercent = settings?.[0]?.default_stop_loss_percent ?? 4;
      const newTargetProfitDollars = settings?.[0]?.target_profit_dollars || 500;
      
      // Check if critical settings changed that would affect the calculation
      if (newAccountSize !== accountSize || 
          newPositionSizingPercent !== positionSizingPercent ||
          newDefaultStopLossPercent !== defaultStopLossPercent ||
          newTargetProfitDollars !== targetProfitDollars) {
        calculatePosition();
      }
    }
  }, [settings, accountSize, positionSizingPercent, defaultStopLossPercent, targetProfitDollars]);

  const fetchShareFloat = async () => {
    if (!symbol) {
      toast.error('Please enter a stock symbol');
      return;
    }
    
    const symbolToFetch = symbol.toUpperCase();
    
    // Check cache
    const savedData = floatDataService.loadSavedFloatData();
    if (floatDataService.isCacheValid(savedData, symbolToFetch)) {
      console.log('Using cached float data');
      setFloatData(savedData);
      setShareFloat(savedData.share_float);
      setFloatCategory(floatDataService.getFloatCategory(savedData.share_float));
      
      toast.success(`Using cached ${savedData.share_float.toLocaleString()} share float`);
      
      if (entryPrice) {
        console.log('🔍 Debug: Setting manualCalculation to true for cached data');
        setManualCalculation(true);
      }
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔍 Debug: Fetching share float for symbol:', symbolToFetch);
      const data = await floatDataService.fetchFloatData(symbolToFetch);
      console.log('🔍 Debug: Received float data:', data);
      
      setFloatData(data);
      setShareFloat(data.share_float);
      if (floatCategories) {
        // Use the helper function to get category from settings
        const category = getFloatCategoryFromSettings(data.share_float, floatCategories);
        setFloatCategory(category ? category.key : null);
        console.log('🔍 Debug: Set float category from fresh data:', category ? category.key : 'none');
      }
      
      toast.success(`Float data loaded for ${symbolToFetch.toUpperCase()}`);
      
      // Trigger calculation if we have entry price
      if (entryPrice) {
        console.log('🔍 Debug: Setting manualCalculation to true after fresh float data');
        setManualCalculation(true);
      }
    } catch (error) {
      console.error('Error fetching share float:', error);
      toast.error('Failed to fetch share float data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePosition = () => {
    try {
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
          stopLossPercent: defaultStopLossPercent, // Use default stop loss when no float data
          direction,
          symbol: symbol || 'STOCK', // Use default symbol when none provided
          shareFloat: symbol ? (shareFloat || 100000000) : null, // Only provide shareFloat when symbol is provided
          floatCategory: symbol ? (floatCategory || 'large') : null, // Only provide floatCategory when symbol is provided
          floatCategories: symbol ? floatCategories : {} // Only provide floatCategories when symbol is provided
        });

        // Calculate targets
        const targets = positionCalculator.calculateTargets(
          calculation,
          targetProfitDollars,
          shareFloat || 100000000, // Use default share float for targets calculation
          floatSettings,
          floatCategories
        );

        // Calculate exit strategy
        const exitStrategy = positionCalculator.calculateExitStrategy(
          calculation,
          null // TODO: Add price data when available from API
        );

        const finalCalculation = {
          ...calculation,
          ...targets,
          exitStrategy,
          calculatedAt: new Date().toLocaleString()
        };
        
        setCalculation(finalCalculation);
      
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
        console.error('Failed to save to calculation history:', error);
      }
      
      toast.success(`Position calculated: ${finalCalculation.shares.toLocaleString()} shares`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const preserveCalculation = () => {
    // Function to explicitly preserve current calculation
    return calculation;
  };

  const clearSavedCalculation = () => {
    // Function to clear saved calculation from localStorage
    localStorage.removeItem('lastCalculation');
    setCalculation(null);
  };

  const clearCalculation = () => {
    console.log('🔍 Debug: Manual calculation clear triggered');
    setCalculation(null);
    setShareFloat(null);
    setFloatCategory(null);
    setFloatData(null);
    localStorage.removeItem('lastCalculation');
    console.log('🔍 Debug: Calculation and related states cleared');
  };

  return {
    // State
    symbol,
    setSymbol,
    entryPrice,
    setEntryPrice,
    direction,
    setDirection,
    loading,
    shareFloat,
    floatCategory,
    floatCategories,
    calculation,
    floatData,
    manualCalculation,
    setManualCalculation,
    shares,
    setShares,
    isInitialized,
    
    // Actions
    fetchShareFloat,
    calculatePosition,
    preserveCalculation,
    clearSavedCalculation,
    
    // Settings
    accountSize,
    settings,
    floatCategories,
    refetchSettings
  };
}}
