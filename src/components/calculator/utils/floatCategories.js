// Simplified Float Categories - loaded from settings only
export function getFloatCategory(floatSize, settings = {}) {
  // Get categories from settings or use defaults
  const categories = settings.floatCategories || getDefaultCategories();
  
  if (!floatSize || floatSize <= 0) return 'medium';
  
  for (const [category, range] of Object.entries(categories)) {
    if (floatSize >= range.min && floatSize < range.max) {
      return category;
    }
  }
  return 'medium';
}

export function getCategoryInfo(floatSize, settings = {}) {
  const category = getFloatCategory(floatSize, settings);
  const categories = settings.floatCategories || getDefaultCategories();
  return categories[category];
}

// Default categories - can be overridden by settings
function getDefaultCategories() {
  return {
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
}
