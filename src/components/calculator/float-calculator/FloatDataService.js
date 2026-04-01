import { PolygonClient } from '@/api/polygonClient';
import { SIMULATION_DATA, CACHE_CONFIG } from './constants';

export class FloatDataService {
  constructor() {
    this.polygonClient = new PolygonClient();
  }

  loadSavedFloatData() {
    const savedFloatData = localStorage.getItem(CACHE_CONFIG.STORAGE_KEY);
    if (savedFloatData) {
      try {
        const data = JSON.parse(savedFloatData);
        
        // Check cache version and validity
        if (data.version !== CACHE_CONFIG.VERSION) {
          this.clearCache();
          return null;
        }
        
        // Check if cache is still valid
        if (Date.now() - data.timestamp > CACHE_CONFIG.TTL) {
          this.clearCache();
          return null;
        }
        
        return data;
      } catch (error) {
        this.clearCache();
      }
    }
    return null;
  }

  saveFloatData(floatData) {
    if (floatData && floatData.share_float) {
      const dataWithTimestamp = {
        ...floatData,
        timestamp: Date.now(),
        version: CACHE_CONFIG.VERSION,
        last_api_call: new Date().toISOString()
      };
      localStorage.setItem(CACHE_CONFIG.STORAGE_KEY, JSON.stringify(dataWithTimestamp));
    }
  }

  clearCache() {
    localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY);
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
      
      
      const polygonData = await this.polygonClient.getStockData(symbol);
      
      
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


