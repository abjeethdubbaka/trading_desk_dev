/**
 * @file src/lib/services/TradeService/enrichment.js
 *
 * Trade enrichment logic - calculates derived fields.
 */

export function enrichTrade(trade) {
  const enriched = { ...trade };

  // Calculate P&L if not present
  if (trade.entry_price && trade.exit_price && trade.quantity) {
    const priceDiff = trade.direction === 'short' ? 
      trade.entry_price - trade.exit_price : 
      trade.exit_price - trade.entry_price;
    
    const grossPnL = priceDiff * trade.quantity;
    const commission = trade.commission || 0;
    const netPnL = grossPnL - commission;
    
    enriched.pnl = netPnL;  // Changed from total_pnl to pnl
    enriched.total_pnl = netPnL;  // Keep for backward compatibility
    enriched.gross_pnl = grossPnL;
    enriched.pnl_percent = ((netPnL / (trade.entry_price * trade.quantity)) * 100);
  }

  // Calculate position value
  if (trade.entry_price && trade.quantity) {
    enriched.position_value = trade.entry_price * trade.quantity;
  }

  // Calculate risk if stop loss is present
  if (trade.entry_price && trade.stop_loss && trade.quantity) {
    const riskPerShare = Math.abs(trade.entry_price - trade.stop_loss);
    enriched.risk_amount = riskPerShare * trade.quantity;
    enriched.risk_percent = (riskPerShare / trade.entry_price) * 100;
  }

  // Add timestamps if missing
  if (!enriched.created_date) {
    enriched.created_date = new Date().toISOString();
  }
  if (!enriched.updated_date) {
    enriched.updated_date = new Date().toISOString();
  }

  return enriched;
}


