/**
 * @file src/components/calculator/utils/floatCategories.js
 *
 * Float categories utilities - now using centralized helpers.
 */

import { 
  getFloatCategory as getFloatCategoryCentralized,
  getCategoryInfo as getCategoryInfoCentralized,
  getFloatCategoryFromSettings,
  DEFAULT_FLOAT_CATEGORIES
} from './floatHelpers.js';

// Re-export centralized functions for backward compatibility
export { getFloatCategoryCentralized as getFloatCategory };
export { getCategoryInfoCentralized as getCategoryInfo };
export { getFloatCategoryFromSettings };
export { DEFAULT_FLOAT_CATEGORIES };

// Additional category-specific utilities
export function getMaxFloatPercent(floatSize, settings = {}) {
  const category = getCategoryInfo(floatSize, settings);
  return category?.maxFloatPercent || 5; // Default 5%
}

export function getRiskMultiplier(floatSize, settings = {}) {
  const category = getCategoryInfo(floatSize, settings);
  return category?.riskMultiplier || 1; // Default 1x
}

export function getStopLossPercent(floatSize, settings = {}) {
  const category = getCategoryInfo(floatSize, settings);
  return category?.stopLossPercent || 2; // Default 2%
}

export function getMaxAccountPercent(floatSize, settings = {}) {
  const category = getCategoryInfo(floatSize, settings);
  return category?.maxAccountPercent || 10; // Default 10%
}


