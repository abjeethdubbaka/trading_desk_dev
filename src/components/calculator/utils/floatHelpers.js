/**
 * @file src/components/calculator/utils/floatHelpers.js
 *
 * Centralized float category utilities to eliminate duplicates.
 */

// Default categories - can be overridden by settings
export const DEFAULT_FLOAT_CATEGORIES = {
  micro: { 
    min: 0, 
    max: 20000000, 
    label: 'Micro', 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20'
  },
  small: { 
    min: 20000000, 
    max: 50000000, 
    label: 'Small', 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/20'
  },
  medium: { 
    min: 50000000, 
    max: 200000000, 
    label: 'Medium', 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/20'
  },
  large: { 
    min: 200000000, 
    max: 1000000000, 
    label: 'Large', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20'
  },
  mega: { 
    min: 1000000000, 
    max: Infinity, 
    label: 'Mega', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/20'
  }
};

/**
 * Get float category key for a given float size
 * @param {number} floatSize - The float size
 * @param {Object} settings - Settings object containing float categories
 * @returns {string} - Category key ('micro', 'small', 'medium', 'large', 'mega')
 */
export function getFloatCategory(floatSize, settings = {}) {
  if (!floatSize || floatSize <= 0) return 'medium';
  
  // Get categories from settings or use defaults
  const categories = settings.floatCategories || DEFAULT_FLOAT_CATEGORIES;
  
  for (const [category, range] of Object.entries(categories)) {
    if (floatSize >= range.min && floatSize < range.max) {
      return category;
    }
  }
  return 'medium';
}

/**
 * Get full category info for a given float size
 * @param {number} floatSize - The float size
 * @param {Object} settings - Settings object containing float categories
 * @returns {Object} - Category info object
 */
export function getCategoryInfo(floatSize, settings = {}) {
  const category = getFloatCategory(floatSize, settings);
  const categories = settings.floatCategories || DEFAULT_FLOAT_CATEGORIES;
  return categories[category];
}

/**
 * Get float category with full info (key + category data)
 * @param {number} floatSize - The float size
 * @param {Object} floatCategories - Categories object
 * @returns {Object|null} - Category object with key and data
 */
export function getFloatCategoryWithInfo(floatSize, floatCategories = {}) {
  if (!floatSize || !floatCategories) return null;
  
  const categories = Object.keys(floatCategories).length > 0 ? floatCategories : DEFAULT_FLOAT_CATEGORIES;
  
  for (const [key, category] of Object.entries(categories)) {
    if (floatSize >= category.min && floatSize < category.max) {
      return { key, ...category };
    }
  }
  
  return null;
}

/**
 * Get float category from settings (legacy compatibility)
 * @param {number} floatSize - The float size
 * @param {Object} categories - Categories object
 * @returns {string|null} - Category key
 */
export function getFloatCategoryFromSettings(floatSize, categories) {
  if (!floatSize || !categories) return null;
  
  // Fix mega category max value if it's null (Infinity gets serialized as null)
  const fixedCategories = { ...categories };
  if (fixedCategories.mega && (fixedCategories.mega.max === null || fixedCategories.mega.max === undefined)) {
    fixedCategories.mega.max = Infinity;
  }
  
  for (const [category, range] of Object.entries(fixedCategories)) {
    if (floatSize >= range.min && floatSize < range.max) {
      return category;
    }
  }
  
  return 'medium';
}


