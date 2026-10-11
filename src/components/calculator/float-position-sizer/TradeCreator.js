import { calculatePnL } from '@/components/journal/AddTradeModal/utils/calculationUtils';
import { PLACEHOLDER_USER_ID } from '@/lib/constants';
import { buildCalculatorTrade } from '@/lib/calculations/calculatorTrade';

/**
 * Turns the calculator's current state into a closed trade for the journal.
 *
 * Only two things happen here: the shared P&L calculation, and handing the
 * result to the record builder. The record's shape lives in
 * lib/calculations/calculatorTrade.js so it can be tested on its own.
 */
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
      stopLoss,
      setupType,
      playbookEntry = null,
      playbookVersion = null,
      expectedRisk = null,
      futures = null,
    } = params;

    if (!symbol || !entryPrice) {
      throw new Error('Symbol and entry price are required');
    }

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
          // A contract moves in ticks worth a fixed amount, not a dollar a point.
          isFutures: Boolean(futures),
          tickSize: futures?.tickSize,
          tickValue: futures?.tickValue,
          contracts: quantity,
        })
      : { pnl: 0, pnlPercent: 0, rMultiple: null };

    return buildCalculatorTrade({
      symbol,
      entryPrice,
      exitPrice: hasExit ? exitPriceNum : null,
      stopLoss: stopLossNum,
      quantity,
      direction: normalizedDirection,
      comment,
      setupType,
      pnl,
      pnlPercent,
      rMultiple,
      playbookEntry,
      playbookVersion,
      expectedRisk,
      futures,
      userId: PLACEHOLDER_USER_ID,
    });
  }
}
