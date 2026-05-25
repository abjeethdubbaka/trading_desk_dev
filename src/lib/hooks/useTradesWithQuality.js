import { useMemo } from 'react';
import { computeTradeSetupQuality } from '@/lib/calculations/trades';

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
      const currentGrade = String(trade?.setup_grade || '').trim();
      const nextGrade = String(quality.grade || '').trim();
      if (currentScore === normalizedScore && currentGrade === nextGrade) return trade;
      return { ...trade, setup_quality_score: normalizedScore, setup_grade: nextGrade || trade?.setup_grade || '' };
    });
  }, [trades, riskLimit]);
}
