import { useMemo } from 'react';
import { computeTradeSetupQuality } from '@/lib/calculations/trades';

// Only backfills the numeric quality score for display — entry_grade/sl_grade/
// exit_grade are trader-selected and must never be recomputed or overwritten here.
export function useTradesWithQuality(trades, riskLimit) {
  return useMemo(() => {
    if (!Array.isArray(trades)) return [];
    return trades.map((trade) => {
      const quality = computeTradeSetupQuality(trade, { riskLimit });
      if (!Number.isFinite(quality?.score)) return trade;
      const normalizedScore = Math.round(quality.score);
      const currentScore = Number.isFinite(Number(trade?.setup_quality_score))
        ? Math.round(Number(trade.setup_quality_score))
        : null;
      if (currentScore === normalizedScore) return trade;
      return { ...trade, setup_quality_score: normalizedScore };
    });
  }, [trades, riskLimit]);
}
