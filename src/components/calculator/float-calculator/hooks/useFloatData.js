import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useFloatCategories } from '@/lib/hooks/useFloatCategories';
import { getFloatCategoryFromSettings } from '../utils/floatHelpers.js';

export function useFloatData(symbol, entryPrice, setShareFloat, setFloatCategory, setManualCalculation, floatDataService) {
  const [loading, setLoading] = useState(false);
  const [floatData, setFloatData] = useState(null);
  const { floatCategories } = useFloatCategories();

  const fetchShareFloat = useCallback(async () => {
    if (!symbol) {
      toast.error('Please enter a stock symbol');
      return;
    }
    
    const symbolToFetch = symbol.toUpperCase();
    
    // Check cache
    const savedData = floatDataService.loadSavedFloatData();
    if (floatDataService.isCacheValid(savedData, symbolToFetch)) {
      setFloatData(savedData);
      setShareFloat(savedData.share_float);
      if (floatCategories) {
        const category = getFloatCategoryFromSettings(savedData.share_float, floatCategories);
        setFloatCategory(category ? category.key : null);
      }
      
      toast.success(`Using cached ${savedData.share_float.toLocaleString()} share float`);
      
      // Trigger calculation if we have entry price
      if (entryPrice) {
        setManualCalculation(true);
      }
      return;
    }
    
    setLoading(true);
    try {
      const data = await floatDataService.fetchFloatData(symbolToFetch);
      
      setFloatData(data);
      setShareFloat(data.share_float);
      if (floatCategories) {
        const category = getFloatCategoryFromSettings(data.share_float, floatCategories);
        setFloatCategory(category ? category.key : null);
      }
      
      toast.success(`Float data loaded for ${symbolToFetch.toUpperCase()}`);
      
      // Trigger calculation if we have entry price
      if (entryPrice) {
        setManualCalculation(true);
      }
    } catch (error) {
      
      toast.error('Failed to fetch share float data');
    } finally {
      setLoading(false);
    }
  }, [symbol, entryPrice, setShareFloat, setFloatCategory, setManualCalculation, floatCategories]);

  return {
    loading,
    floatData,
    fetchShareFloat,
    setFloatData
  };
}


