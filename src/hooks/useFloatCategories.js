import { useSettings } from './useSettings';
import { FLOAT_CATEGORIES } from '@/components/calculator/float-position-sizer/constants';

export const useFloatCategories = () => {
  const { firstSettings } = useSettings();

  // Use float categories from settings, or fallback to defaults
  const floatCategories = firstSettings?.float_categories || FLOAT_CATEGORIES;

  return {
    floatCategories,
    isLoading: !firstSettings,
    settings: firstSettings
  };
};
