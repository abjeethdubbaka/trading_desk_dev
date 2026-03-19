import { base44 } from '@/api/base44Client';

export class TradeCreator {
  static async createTrade(params) {
    const {
      symbol,
      entryPrice,
      direction,
      calculation,
      shares,
      floatData,
      floatCategory
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
      r_multiple: calculation ? (calculation.targetProfit / calculation.actualRisk).toFixed(2) : null,
      stop_loss: calculation?.stopLossPrice || null,
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
    notes += `Shares to Buy: ${calculation?.shares?.toLocaleString() || shares}\n`;
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
      console.log('Creating comprehensive trade with data:', tradeData);
      const response = await base44.entities.Trade.create(tradeData);
      console.log('Trade creation response:', response);
      return response;
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }
}