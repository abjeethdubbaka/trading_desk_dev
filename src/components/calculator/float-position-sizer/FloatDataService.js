import { PolygonClient } from '@/api/polygonClient';
import { SIMULATION_DATA, CACHE_CONFIG, FLOAT_CATEGORIES } from './constants';

export class FloatDataService {
  constructor() {
    this.polygonClient = new PolygonClient();
  }

  getFloatCategory(floatSize) {
    if (!floatSize) return 'medium';
    for (const [category, range] of Object.entries(FLOAT_CATEGORIES)) {
      if (floatSize >= range.min && floatSize < range.max) return category;
    }
    return 'medium';
  }

  loadSavedFloatData() {
    const savedFloatData = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY);
    if (savedFloatData) {
      try {
        return JSON.parse(savedFloatData);
      } catch (error) {
        console.error('Error loading saved float data:', error);
      }
    }
    return null;
  }

  saveFloatData(floatData) {
    if (floatData && floatData.share_float) {
      const dataWithTimestamp = {
        ...floatData,
        last_api_call: new Date().toISOString()
      };
      localStorage.setItem(CACHE_CONFIG.STORAGE_KEY, JSON.stringify(dataWithTimestamp));
    }
  }

  isCacheValid(savedData, symbol) {
    if (!savedData || savedData.symbol !== symbol) return false;
    
    const savedTime = new Date(savedData.last_api_call || savedData.last_updated);
    const now = new Date();
    const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
    
    return hoursDiff < CACHE_CONFIG.CACHE_DURATION_HOURS;
  }

  async fetchFloatData(symbol) {
    try {
      console.log('Fetching Polygon data for:', symbol);
      
      const polygonData = await this.polygonClient.getStockData(symbol);
      console.log('Polygon Response:', polygonData);
      
      if (polygonData && polygonData.share_class_shares_outstanding) {
        return this.parsePolygonData(symbol, polygonData);
      }
      
      // Fallback to market cap estimation
      if (polygonData && polygonData.market_cap) {
        return this.estimateFromMarketCap(symbol, polygonData);
      }
      
      // Use simulation data
      return this.getSimulationData(symbol);
      
    } catch (error) {
      console.error(`Error fetching float data for ${symbol}:`, error);
      return this.getErrorFallback(symbol, error.message);
    }
  }

  parsePolygonData(symbol, data) {
    const sharesOutstanding = data.share_class_shares_outstanding || data.outstanding_shares;
    let sharesOutstandingNum = 0;
    
    if (sharesOutstanding) {
      sharesOutstandingNum = parseFloat(sharesOutstanding.toString().replace(/,/g, ''));
    }
    
    const actualFloat = sharesOutstandingNum ? Math.round(sharesOutstandingNum * 0.75) : null;
    
    if (sharesOutstandingNum > 0) {
      return {
        symbol: symbol.toUpperCase(),
        company_name: data.name || data.company_name || symbol.toUpperCase(),
        share_float: actualFloat,
        shares_outstanding: sharesOutstandingNum,
        market_cap: data.market_capitalization || data.market_cap,
        exchange: data.primary_exchange || data.exchange,
        sector: data.gics_sector || data.sector,
        industry: data.gics_sub_industry || data.industry,
        data_sources: ['Polygon API'],
        last_updated: new Date().toISOString()
      };
    }
    
    return null;
  }

  estimateFromMarketCap(symbol, data) {
    console.log('Using market cap estimation for float');
    const marketCap = data.market_cap;
    let estimatedFloat;
    
    if (marketCap > 1000000000000) estimatedFloat = 15000000000;
    else if (marketCap > 500000000000) estimatedFloat = 5000000000;
    else if (marketCap > 100000000000) estimatedFloat = 1500000000;
    else if (marketCap > 20000000000) estimatedFloat = 500000000;
    else estimatedFloat = 30000000;
    
    return {
      symbol: symbol.toUpperCase(),
      company_name: data.name || symbol.toUpperCase(),
      share_float: estimatedFloat,
      market_cap: marketCap,
      data_sources: ['Polygon API (Estimated)'],
      last_updated: new Date().toISOString(),
      note: 'Estimated from market cap'
    };
  }

  getSimulationData(symbol) {
    const mockResponse = SIMULATION_DATA[symbol.toUpperCase()];
    if (mockResponse) {
      return {
        symbol: symbol.toUpperCase(),
        company_name: mockResponse.longname,
        share_float: mockResponse.float,
        market_cap: mockResponse.marketCap,
        data_sources: ['Simulation Data'],
        last_updated: new Date().toISOString(),
        note: 'Using simulation data for demo'
      };
    }
    
    // Default fallback
    return {
      symbol: symbol.toUpperCase(),
      company_name: symbol.toUpperCase(),
      share_float: 100000000,
      data_sources: ['Default Estimate'],
      last_updated: new Date().toISOString(),
      note: 'Default estimate. Add Polygon API key for real data.'
    };
  }

  getErrorFallback(symbol, errorMessage) {
    return {
      symbol: symbol.toUpperCase(),
      company_name: symbol.toUpperCase(),
      share_float: 100000000,
      data_sources: ['Error Fallback'],
      last_updated: new Date().toISOString(),
      error: errorMessage,
      note: 'Error fetching data, using fallback'
    };
  }
}