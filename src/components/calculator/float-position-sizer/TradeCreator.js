import { db } from '@/lib/db';

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
      stopLoss // Add stopLoss parameter
    } = params;

    if (!symbol || !entryPrice) {
      throw new Error('Symbol and entry price are required');
    }

    const newTrade = {
      symbol: symbol.toUpperCase(),
      direction: direction || 'long',
      entry_price: parseFloat(entryPrice),
      exit_price: calculation?.targetPrice || null,
      position_size: calculation?.shares || shares || 100,
      entry_time: new Date().toISOString(),
      exit_time: null,
      pnl: 0,
      r_multiple: this.calculateRMultiple(entryPrice, stopLoss, calculation?.targetPrice),
      stop_loss: stopLoss ? parseFloat(stopLoss) : (calculation?.stopLossPrice || null),
      fee: 0,
      setup_type: 'Calculator Entry',
      notes: this.buildNotes(params),
      emotions: 'neutral',
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

  static buildNotes(params) {
    const {
      symbol,
      entryPrice,
      direction,
      calculation,
      shares,
      floatData,
      floatCategory
    } = params;

    let notes = `Created from calculator at ${new Date().toLocaleString()}\n`;
    notes += `Entry Price: $${parseFloat(entryPrice).toFixed(2)}\n`;
    notes += `Position Type: ${direction || 'long'}\n`;
    notes += `Shares: ${calculation?.shares?.toLocaleString() || shares}\n`;
    notes += `Stop Loss: ${calculation?.stopLossPrice ? `$${calculation.stopLossPrice.toFixed(2)}` : 'Not set'}\n`;
    notes += `Target Price: ${calculation?.targetPrice ? `$${calculation.targetPrice.toFixed(2)}` : 'Not set'}\n`;
    notes += `Position Value: ${calculation?.positionValue ? `$${calculation.positionValue.toFixed(2)}` : 'Not calculated'}\n`;
    notes += `Risk Amount: ${calculation?.actualRisk ? `$${calculation.actualRisk.toFixed(2)}` : 'Not calculated'}\n`;
    notes += `Risk Level: ${calculation?.riskLevel || 'Unknown'}\n`;
    notes += `Account Usage: ${calculation?.percentOfAccount ? `${calculation.percentOfAccount.toFixed(2)}%` : 'Not calculated'}\n`;
    
    if (floatData?.share_float) {
      notes += `Share Float: ${floatData.share_float.toLocaleString()} (${floatCategory ? FLOAT_CATEGORIES[floatCategory].label : 'Unknown'} Float)\n`;
    }
    
    if (floatData?.company_name) {
      notes += `Company: ${floatData.company_name}\n`;
    }
    
    if (calculation?.targetProfit) {
      notes += `Potential Profit: $${calculation.targetProfit.toFixed(2)}\n`;
    }
    
    if (calculation?.profitPercent) {
      notes += `Profit Potential: ${calculation.profitPercent.toFixed(2)}%\n`;
    }
    
    notes += `Source: Float Position Sizer Calculator`;
    
    return notes;
  }

  static async saveTrade(tradeData) {
    try {
      const response = await db.trades.create(tradeData);
      return response;
    } catch (error) {
      throw error;
    }
  }
}
