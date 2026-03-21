import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useFloatCategories } from '@/lib/hooks/useFloatCategories';

export function useFloatData(symbol, entryPrice, setShareFloat, setFloatCategory, setManualCalculation, floatDataService) {
  const [loading, setLoading] = useState(false);
  const [floatData, setFloatData] = useState(null);
  const { floatCategories } = useFloatCategories();

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
      console.error('Error fetching share float:', error);
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
