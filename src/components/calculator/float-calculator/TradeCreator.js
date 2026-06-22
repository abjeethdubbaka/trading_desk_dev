import { resolveShareFloatRange } from '@/lib/calculations/trades';
import { calculatePnL } from '@/components/journal/AddTradeModal/utils/calculationUtils';
import { PLACEHOLDER_USER_ID } from '@/lib/constants';

export class TradeCreator {
  static async createTrade(params) {
    const {
      symbol,
      entryPrice,
      exitPrice,
      direction,
      comment,
      calculation,
      shares,
      floatData,
      floatCategory,
      floatCategories,
      stopLoss, // Add stopLoss parameter
      setupType
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
    const normalizedComment = String(comment || '').trim();
    const normalizedDirection = direction || 'long';
    const quantity = calculation?.shares || shares || 100;
    const stopLossNum = stopLoss ? parseFloat(stopLoss) : (calculation?.stopLossPrice || null);

    const exitPriceNum = parseFloat(exitPrice);
    const hasExit = Number.isFinite(exitPriceNum) && exitPriceNum > 0;
    const { pnl, pnlPercent, rMultiple } = hasExit
      ? calculatePnL({
          entryPrice,
          exitPrice: exitPriceNum,
          stopLoss: stopLossNum,
          positionSize: quantity,
          direction: normalizedDirection,
          fee: 0,
        })
      : { pnl: 0, pnlPercent: 0, rMultiple: null };

    const newTrade = {
      symbol: symbol.toUpperCase(),
      direction: normalizedDirection,
      entry_price: parseFloat(entryPrice),
      exit_price: hasExit ? exitPriceNum : null,
      position_size: quantity,
      quantity,
      entry_time: new Date().toISOString(),
      exit_time: hasExit ? new Date().toISOString() : null,
      pnl,
      pnl_percent: pnlPercent,
      r_multiple: rMultiple,
      stop_loss: stopLossNum,
      share_float: shareFloat,
      float_category: normalizedFloatCategory,
      share_float_range: shareFloatRange,
      fee: 0,
      setup_type: setupType || 'Calculator Entry',
      notes: normalizedComment,
      // Keep shape aligned with Journal submission format
      emotions: ['neutral'],
      followed_plan: true,
      mistakes: [],
      lessons: '',
      screenshots: [],
      trade_plan_id: null,
      strategy_preset_id: null,
      user_id: PLACEHOLDER_USER_ID
    };

    return newTrade;
  }

  static async saveTrade(_tradeData) {
    throw new Error('TradeCreator.saveTrade is deprecated. Use useTradesMutation().createTrade instead.');
  }
}


