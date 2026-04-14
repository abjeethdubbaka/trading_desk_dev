/**
 * @file src/lib/services/TradeService/search.js
 *
 * Trade search and filtering operations.
 */

export function createTradeSearch(service) {
  return {
    async search(query) {
      const trades = await service.list();
      
      const lowerQuery = query.toLowerCase();
      
      return trades.filter(trade => 
        trade.symbol?.toLowerCase().includes(lowerQuery) ||
        trade.setup_type?.toLowerCase().includes(lowerQuery) ||
        trade.notes?.toLowerCase().includes(lowerQuery) ||
        trade.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    },

    async getBySymbol(symbol) {
      const normalizedSymbol = String(symbol || '').trim().toUpperCase();
      if (!normalizedSymbol) return [];
      return service.list({
        symbol: normalizedSymbol,
        sortBy: 'entry_time',
        sortDir: 'desc',
      });
    },

    async getBySetup(setupType) {
      const normalizedSetupType = String(setupType || '').trim();
      if (!normalizedSetupType) return [];
      return service.list({
        setup_type: normalizedSetupType,
        sortBy: 'entry_time',
        sortDir: 'desc',
      });
    },

    async getByDateRange(startDate, endDate) {
      if (!startDate || !endDate) return [];
      return service.list({
        date_from: startDate,
        date_to: endDate,
        sortBy: 'entry_time',
        sortDir: 'desc',
      });
    }
  };
}


