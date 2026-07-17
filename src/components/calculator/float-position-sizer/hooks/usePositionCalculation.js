import { useCallback } from 'react';
import { toast } from 'sonner';
import { calcPosition, calcFuturesPosition } from '@/lib/calculations/trades';

const CALCULATOR_DECISION_EVENT = 'calculator-decision-context';

/**
 * Builds the position-sizing calculation from current inputs and runs it,
 * recording a history entry and broadcasting a decision-context event for
 * the "Calculate" button flow.
 */
export function usePositionCalculation({
  entryPrice,
  direction,
  setDirection,
  customStop,
  accountSize,
  positionSizingPct,
  defaultStopLossPct,
  riskAmount,
  riskMultiplier,
  playbookTargetR,
  maxPositionValue,
  targetProfitDollars,
  symbol,
  comment,
  setCalculation,
  resetTimer,
  onCalculationSaved,
  // futures
  isFutures = false,
  tickSize,
  tickValue,
}) {
  const buildCalculationParams = useCallback((overrides = {}) => {
    if (isFutures) {
      return {
        entryPrice,
        direction,
        accountSize,
        riskAmount: riskMultiplier !== 1 && Number.isFinite(Number(riskAmount))
          ? Number(riskAmount) * riskMultiplier
          : riskAmount,
        stopLossPrice: customStop || undefined,
        tickSize,
        tickValue,
        riskRewardRatio: playbookTargetR ?? 3,
        ...overrides,
      };
    }
    return {
      entryPrice,
      direction,
      accountSize,
      positionPct: positionSizingPct,
      stopPct: defaultStopLossPct,
      stopLossPrice: customStop || undefined,
      riskAmount: riskMultiplier !== 1 && Number.isFinite(Number(riskAmount))
        ? Number(riskAmount) * riskMultiplier
        : riskAmount,
      maxPositionValue,
      targetProfitDollars,
      riskRewardRatio: playbookTargetR ?? 3,
      ...overrides,
    };
  }, [
    isFutures,
    entryPrice,
    direction,
    accountSize,
    positionSizingPct,
    defaultStopLossPct,
    customStop,
    riskAmount,
    riskMultiplier,
    playbookTargetR,
    maxPositionValue,
    targetProfitDollars,
    tickSize,
    tickValue,
  ]);

  const runCalculation = useCallback((overrides = {}) => {
    const calc = isFutures ? calcFuturesPosition : calcPosition;
    const result = calc(buildCalculationParams(overrides));
    const normalizedResult = { ...result, _viewSource: 'snapshot' };
    setCalculation(normalizedResult);
    resetTimer();
    return normalizedResult;
  }, [isFutures, buildCalculationParams, resetTimer, setCalculation]);

  const handleCalculate = useCallback(() => {
    if (!entryPrice) {
      toast.error('Enter an entry price');
      return;
    }

    const entryPriceNum = parseFloat(entryPrice);
    const stopLossPriceNum = parseFloat(customStop);
    let effectiveDirection = direction;

    if (stopLossPriceNum && entryPriceNum) {
      if (stopLossPriceNum > entryPriceNum && direction === 'long') {
        effectiveDirection = 'short';
        setDirection('short');
        toast.info('Auto-detected short (stop > entry)');
      } else if (stopLossPriceNum < entryPriceNum && direction === 'short') {
        effectiveDirection = 'long';
        setDirection('long');
        toast.info('Auto-detected long (stop < entry)');
      }
    }

    try {
      const result = runCalculation({ direction: effectiveDirection });
      const normalizedSymbol = String(symbol || '').trim().toUpperCase();

      const historyItem = {
        timestamp: new Date().toISOString(),
        symbol: normalizedSymbol || 'N/A',
        entryPrice: result.entryPrice,
        shares: result.shares,
        stopLossPrice: result.stopLossPrice,
        targetPrice: result.targetPrice,
        positionValue: result.positionValue,
        actualRisk: result.actualRisk,
        potentialProfit: result.targetProfit,
        riskLevel: result.riskLevel,
        requestedRisk: result.requestedRisk,
        riskUtilizationPct: result.riskUtilizationPct,
        capReason: result.capReason,
        riskRewardRatio: 3,
        direction: result.direction,
        mode: result.mode,
      };

      onCalculationSaved?.(historyItem);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(CALCULATOR_DECISION_EVENT, {
            detail: {
              source: 'calculator',
              timestamp: new Date().toISOString(),
              symbol: normalizedSymbol,
              direction: result.direction,
              entry: result.entryPrice,
              stop: result.stopLossPrice,
              target: result.targetPrice,
              max_risk_dollars: result.actualRisk,
              position_size_shares: result.shares,
              risk_reward_ratio: result.riskRewardRatio,
              notes: String(comment || '').trim(),
            },
          })
        );
      }

      toast.success('Position calculated using static risk settings.');
      if (result.capReason) {
        toast.info(`Risk capped by ${result.capReason}`);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [entryPrice, customStop, direction, setDirection, runCalculation, symbol, comment, onCalculationSaved]);

  return { handleCalculate };
}
