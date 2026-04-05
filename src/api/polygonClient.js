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
    const normalizedSymbol = symbol.toUpperCase();
    const baseResult = {
      symbol: normalizedSymbol,
      name: normalizedSymbol,
      share_class_shares_outstanding: null,
      data_source: 'Polygon.io',
      last_updated: new Date().toISOString(),
    };

    try {
      if (!this.hasApiKey()) {
        throw new Error('Polygon API key is not configured (VITE_POLYGON_API_KEY)');
      }

      const response = await fetch(
        `${this.baseUrl}/reference/tickers/${normalizedSymbol}?apiKey=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const retryAfterSeconds = Number.parseInt(response.headers.get('Retry-After') || '', 10);
        return {
          ...baseResult,
          error: `Polygon API error: ${response.status}`,
          statusCode: response.status,
          rateLimited: response.status === 429,
          retryAfterMs: Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds * 1000
            : null,
        };
      }

      const data = await response.json();
      // Debug log removed

      // The response has a single "results" object, not an array
      if (data.results) {
        const stockData = data.results;

        // Note: Polygon free tier doesn't provide share_class_shares_outstanding
        // You need premium subscription for this data
        return {
          ...baseResult,
          name: stockData.name || stockData.ticker,
          share_class_shares_outstanding: stockData.share_class_shares_outstanding || null,
          market_cap: stockData.market_cap || null,
          primary_exchange: stockData.primary_exchange || 'N/A',
          gics_sector: stockData.sector || stockData.gics_sector || 'N/A',
          gics_sub_industry: stockData.subsector || stockData.gics_sub_industry || 'N/A',
          currency: stockData.currency_name || 'USD',
          description: stockData.description || '',
          statusCode: 200,
          rateLimited: false,
          retryAfterMs: null,
          note: stockData.share_class_shares_outstanding 
            ? 'Real outstanding shares data' 
            : 'Using estimated shares (premium feature)'
        };
      }

      return {
        ...baseResult,
        error: 'No results found',
        statusCode: 404,
        rateLimited: false,
        retryAfterMs: null,
      };

    } catch (error) {

      return {
        ...baseResult,
        error: error.message,
        statusCode: null,
        rateLimited: false,
        retryAfterMs: null,
      };
    }
  }

  // Alternative: Get shares outstanding from fundamentals endpoint (Premium).
  // This method returns metadata so callers can react to 404/429 gracefully.
  async getSharesOutstandingMeta(symbol) {
    try {
      if (!this.hasApiKey()) {
        return {
          value: null,
          statusCode: null,
          rateLimited: false,
          retryAfterMs: null,
          error: 'Polygon API key is not configured',
        };
      }

      const response = await fetch(
        `${this.baseUrl}/reference/financials?ticker=${symbol.toUpperCase()}&apiKey=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const retryAfterSeconds = Number.parseInt(response.headers.get('Retry-After') || '', 10);
        return {
          value: null,
          statusCode: response.status,
          rateLimited: response.status === 429,
          retryAfterMs: Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds * 1000
            : null,
          error: `Polygon financials error: ${response.status}`,
        };
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Financials data might have shares outstanding
        const financials = data.results[0];
        return {
          value: financials.shares_outstanding || null,
          statusCode: 200,
          rateLimited: false,
          retryAfterMs: null,
          error: null,
        };
      }

      return {
        value: null,
        statusCode: 200,
        rateLimited: false,
        retryAfterMs: null,
        error: null,
      };
    } catch {

      return {
        value: null,
        statusCode: null,
        rateLimited: false,
        retryAfterMs: null,
        error: 'Failed to fetch Polygon financials',
      };
    }
  }

  async getSharesOutstanding(symbol) {
    const result = await this.getSharesOutstandingMeta(symbol);
    return result?.value ?? null;
  }
}

export { PolygonClient };


