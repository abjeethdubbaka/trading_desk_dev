import { useEffect, useState } from 'react';
import { useFloatCategories } from '@/lib/hooks/useFloatCategories';
import { useSettings } from '@/lib/hooks/useSettings';

export function useFloatInitialization() {
  const { floatCategories } = useFloatCategories();
  const { firstSettings: settings } = useSettings();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialization effect - wait for settings and float categories to load
  useEffect(() => {
    const hasSettings = !!settings;
    const hasFloatCategories = floatCategories && Object.keys(floatCategories).length > 0;
    
    if (hasSettings && hasFloatCategories && !isInitialized) {
      setIsInitialized(true);
    }
  }, [settings, floatCategories, isInitialized]);

  return { isInitialized };
}
