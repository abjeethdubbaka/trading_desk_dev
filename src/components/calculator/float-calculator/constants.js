// Float categories configuration
export const FLOAT_CATEGORIES = {
  micro: { 
    min: 0, 
    max: 10000000, 
    label: 'Micro', 
    color: 'text-red-400', 
    positionMultiplier: 0.3, 
    stopLossPercent: 3.0, 
    maxFloatPercent: 0.1 
  },
  small: { 
    min: 10000000, 
    max: 50000000, 
    label: 'Small', 
    color: 'text-orange-400', 
    positionMultiplier: 0.5, 
    stopLossPercent: 3.5, 
    maxFloatPercent: 0.25 
  },
  medium: { 
    min: 50000000, 
    max: 500000000, 
    label: 'Medium', 
    color: 'text-yellow-400', 
    positionMultiplier: 0.8, 
    stopLossPercent: 4.0, 
    maxFloatPercent: 0.5 
  },
  large: { 
    min: 500000000, 
    max: 2000000000, 
    label: 'Large', 
    color: 'text-blue-400', 
    positionMultiplier: 1.2, 
    stopLossPercent: 5.0, 
    maxFloatPercent: 0.75 
  },
  mega: { 
    min: 2000000000, 
    max: Infinity, 
    label: 'Mega', 
    color: 'text-emerald-400', 
    positionMultiplier: 1.5, 
    stopLossPercent: 6.0, 
    maxFloatPercent: 1.0 
  }
};

// Simulation data for fallback
export const SIMULATION_DATA = {
  'AAPL': { marketCap: 3000000000000, longname: 'Apple Inc.', float: 15000000000 },
  'TSLA': { marketCap: 800000000000, longname: 'Tesla, Inc.', float: 3100000000 },
  'NVDA': { marketCap: 1800000000000, longname: 'NVIDIA Corporation', float: 2400000000 },
  'MSFT': { marketCap: 2500000000000, longname: 'Microsoft Corporation', float: 7400000000 },
  'GOOGL': { marketCap: 1600000000000, longname: 'Alphabet Inc.', float: 5700000000 },
  'AMZN': { marketCap: 1500000000000, longname: 'Amazon.com, Inc.', float: 9900000000 },
  'META': { marketCap: 900000000000, longname: 'Meta Platforms, Inc.', float: 2600000000 },
  'AMD': { marketCap: 200000000000, longname: 'Advanced Micro Devices, Inc.', float: 1600000000 },
  'SPY': { marketCap: 400000000000, longname: 'SPDR S&P 500 ETF', float: 900000000 },
  'QQQ': { marketCap: 200000000000, longname: 'Invesco QQQ ETF', float: 450000000 }
};

// Cache configuration
export const CACHE_CONFIG = {
  STORAGE_KEY: 'savedFloatData',
  CACHE_DURATION_HOURS: 24,
  TTL: 1000 * 60 * 30, // 30 minutes
  VERSION: '1.0' // Add version for cache busting
};


