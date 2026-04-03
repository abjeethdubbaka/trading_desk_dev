class PolygonClient {
  constructor() {
    this.apiKey = import.meta.env.VITE_POLYGON_API_KEY || '';
    this.baseUrl = import.meta.env.VITE_POLYGON_BASE_URL || 'https://api.polygon.io/v3';
  }

  hasApiKey() {
    return Boolean(this.apiKey);
  }

  // Get stock data including shares outstanding
  async getStockData(symbol) {
    try {
      if (!this.hasApiKey()) {
        throw new Error('Polygon API key is not configured (VITE_POLYGON_API_KEY)');
      }

      const response = await fetch(
        `${this.baseUrl}/reference/tickers/${symbol.toUpperCase()}?apiKey=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }
      
      const data = await response.json();
      // Debug log removed
      
      // The response has a single "results" object, not an array
      if (data.results) {
        const stockData = data.results;
        
        // Note: Polygon free tier doesn't provide share_class_shares_outstanding
        // You need premium subscription for this data
        return {
          symbol: symbol.toUpperCase(),
          name: stockData.name || stockData.ticker,
          share_class_shares_outstanding: stockData.share_class_shares_outstanding || null,
          market_cap: stockData.market_cap || null,
          primary_exchange: stockData.primary_exchange || 'N/A',
          gics_sector: stockData.sector || stockData.gics_sector || 'N/A',
          gics_sub_industry: stockData.subsector || stockData.gics_sub_industry || 'N/A',
          currency: stockData.currency_name || 'USD',
          description: stockData.description || '',
          data_source: 'Polygon.io',
          last_updated: new Date().toISOString(),
          note: stockData.share_class_shares_outstanding 
            ? 'Real outstanding shares data' 
            : 'Using estimated shares (premium feature)'
        };
      }
      
      return {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        share_class_shares_outstanding: null,
        data_source: 'Polygon.io',
        last_updated: new Date().toISOString(),
        error: 'No results found'
      };
      
    } catch (error) {
      
      return {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        share_class_shares_outstanding: null,
        data_source: 'Polygon.io',
        last_updated: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Alternative: Get shares outstanding from fundamentals endpoint (Premium)
  async getSharesOutstanding(symbol) {
    try {
      if (!this.hasApiKey()) {
        return null;
      }

      const response = await fetch(
        `${this.baseUrl}/reference/financials?ticker=${symbol.toUpperCase()}&apiKey=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Financials data might have shares outstanding
        const financials = data.results[0];
        return financials.shares_outstanding || null;
      }
      
      return null;
    } catch {
      
      return null;
    }
  }
}

export { PolygonClient };


