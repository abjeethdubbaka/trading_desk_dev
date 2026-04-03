import { resolveShareFloatRange } from '@/lib/calculations/trades';

export class TradeCreator {
  static async createTrade(params) {
    const {
      symbol,
      entryPrice,
      direction,
      calculation,
      shares,
      floatData,
      floatCategory,
      floatCategories,
      stopLoss // Add stopLoss parameter
    } = params;

    if (!symbol || !entryPrice) {
      throw new Error('Symbol and entry price are required');
    }

    const parsedShareFloat = Number(floatData?.share_float);
    const shareFloat = Number.isFinite(parsedShareFloat) && parsedShareFloat > 0
      ? Math.round(parsedShareFloat)
      : null;
    const normalizedFloatCategory = floatCategory ? String(floatCategory).toLowerCase() : null;
    const resolvedShareFloatRange = resolveShareFloatRange(
      shareFloat,
      normalizedFloatCategory,
      null,
      floatCategories
    );
    const shareFloatRange = shareFloat != null || normalizedFloatCategory
      ? resolvedShareFloatRange.key
      : null;

    const newTrade = {
      symbol: symbol.toUpperCase(),
      direction: direction || 'long',
      entry_price: parseFloat(entryPrice),
      exit_price: calculation?.targetPrice || null,
      position_size: calculation?.shares || shares || 100,
      quantity: calculation?.shares || shares || 100,
      entry_time: new Date().toISOString(),
      exit_time: null,
      pnl: 0,
      r_multiple: this.calculateRMultiple(entryPrice, stopLoss, calculation?.targetPrice),
      stop_loss: stopLoss ? parseFloat(stopLoss) : (calculation?.stopLossPrice || null),
      share_float: shareFloat,
      float_category: normalizedFloatCategory,
      share_float_range: shareFloatRange,
      fee: 0,
      setup_type: 'Calculator Entry',
      notes: '',
      // Keep shape aligned with Journal submission format
      emotions: ['neutral'],
      followed_plan: true,
      mistakes: [],
      lessons: '',
      screenshots: [],
      trade_plan_id: null,
      strategy_preset_id: null,
      user_id: 'user-123'
    };

    return newTrade;
  }

  static calculateRMultiple(entryPrice, stopLoss, targetPrice) {
    if (!entryPrice || !stopLoss || !targetPrice) return null;
    
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(targetPrice - entryPrice);
    
    return risk > 0 ? (reward / risk).toFixed(2) : null;
  }

  static async saveTrade(tradeData) {
    throw new Error('TradeCreator.saveTrade is deprecated. Use useTradesMutation().createTrade instead.');
  }
}


