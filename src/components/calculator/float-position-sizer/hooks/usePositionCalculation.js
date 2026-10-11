import { useCallback, useEffect, useRef } from 'react';
import { calcPosition, calcFuturesPosition } from '@/lib/calculations/trades';

const CALCULATOR_DECISION_EVENT = 'calculator-decision-context';

/**
 * Keeps the position-sizing calculation current as the inputs change, so
 * the snapshot is always what the numbers on screen imply — there is no
 * Calculate button to press and nothing to go stale.
 *
 * Sizing a position and recording it are two different acts. History and
 * the decision-context event are written by `commitCalculation`, which the
 * journal save calls, rather than on every keystroke.
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

  const previousHadResult = useRef(false);
  const previousSymbol = useRef(symbol);

  // Live: every change to the inputs re-sizes the position.
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    if (!Number.isFinite(entry) || entry <= 0) {
      setCalculation(null);
      previousHadResult.current = false;
      return;
    }

    // Where the stop sits decides the side: a stop above entry is a short.
    const stop = parseFloat(customStop);
    let effectiveDirection = direction;
    if (Number.isFinite(stop) && stop > 0 && stop !== entry) {
      effectiveDirection = stop > entry ? 'short' : 'long';
      if (effectiveDirection !== direction) setDirection(effectiveDirection);
    }

    try {
      const calc = isFutures ? calcFuturesPosition : calcPosition;
      const result = calc(buildCalculationParams({ direction: effectiveDirection }));
      setCalculation({ ...result, _viewSource: 'snapshot' });

      // The analysis timer measures time spent on one idea: it restarts when a
      // position first appears or the symbol changes, not on every keystroke.
      const symbolChanged = previousSymbol.current !== symbol;
      if (!previousHadResult.current || symbolChanged) resetTimer();
      previousHadResult.current = true;
      previousSymbol.current = symbol;
    } catch {
      setCalculation(null);
      previousHadResult.current = false;
    }
  }, [buildCalculationParams, entryPrice, customStop, direction, isFutures, symbol, setCalculation, setDirection, resetTimer]);

  /**
   * Records the position as it stands — to calculator history, and as a
   * decision-context event for the discipline coach. Called when a trade is
   * saved to the journal, which is the moment the sizing became a decision.
   */
  const commitCalculation = useCallback((result) => {
    if (!result) return;
    const normalizedSymbol = String(symbol || '').trim().toUpperCase();

    onCalculationSaved?.({
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
      riskRewardRatio: result.riskRewardRatio ?? 3,
      direction: result.direction,
      mode: result.mode,
    });

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
  }, [symbol, comment, onCalculationSaved]);

  return { commitCalculation };
}
