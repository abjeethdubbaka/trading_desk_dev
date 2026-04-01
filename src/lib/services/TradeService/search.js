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
      const trades = await service.list();
      return trades.filter(trade => trade.symbol === symbol);
    },

    async getBySetup(setupType) {
      const trades = await service.list();
      return trades.filter(trade => trade.setup_type === setupType);
    },

    async getByDateRange(startDate, endDate) {
      const trades = await service.list();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return trades.filter(trade => {
        const tradeDate = new Date(trade.entry_time);
        return tradeDate >= start && tradeDate <= end;
      });
    }
  };
}


