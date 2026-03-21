import { useSettings } from './useSettings';
import { FLOAT_CATEGORIES } from '@/components/calculator/float-position-sizer/constants';

export const useFloatCategories = () => {
  const { settings } = useSettings();

  // Use float categories from settings, or fallback to defaults
  const floatCategories = settings?.float_categories || FLOAT_CATEGORIES;

  return {
    floatCategories,
    isLoading: !settings,
    settings
  };
};
