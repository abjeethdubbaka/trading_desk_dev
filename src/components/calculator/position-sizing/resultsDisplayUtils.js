import { formatAnalysisTimer } from '@/lib/context/AnalysisTimerContext';
import { DEFAULT_EXIT_LEVELS, normalizeExitStrategyLevels } from '@/components/settings/exitStrategy';

export const SWEET_MID = 2.00;

export const asMoney = (value, digits = 2) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return `$${numeric.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
};

export const asWholeMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return `$${Math.round(numeric).toLocaleString()}`;
};

const withWeights = (levels) => {
  const totalPercent = levels.reduce((sum, level) => sum + level.percent, 0);
  if (!Number.isFinite(totalPercent) || totalPercent <= 0) {
    return DEFAULT_EXIT_LEVELS.map((level) => ({ ...level, weight: level.percent / 100 }));
  }
  return levels.map((level) => ({ ...level, weight: level.percent / totalPercent }));
};

export const sanitizeExitLevels = (exitStrategy) => {
  const normalizedLevels = normalizeExitStrategyLevels(exitStrategy?.levels);
  return withWeights(normalizedLevels);
};

export const formatR = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  if (Number.isInteger(numeric)) return String(numeric);
  return numeric.toFixed(2).replace(/\.?0+$/, '');
};

export const formatElapsedLabel = (seconds) => `T+${formatAnalysisTimer(seconds)}`;
