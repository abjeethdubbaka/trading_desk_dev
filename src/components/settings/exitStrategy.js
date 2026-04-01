export const DEFAULT_EXIT_LEVELS = [
  { r: 1, percent: 33, trailingStop: false },
  { r: 2, percent: 33, trailingStop: false },
  { r: 3, percent: 34, trailingStop: true },
];

export function normalizeExitStrategyLevels(rawLevels) {
  const levels = Array.isArray(rawLevels) && rawLevels.length > 0
    ? rawLevels
    : DEFAULT_EXIT_LEVELS;

  const cleaned = levels
    .map((level, index) => {
      const fallback = DEFAULT_EXIT_LEVELS[index] || { r: index + 1, percent: 0, trailingStop: false };
      const parsedR = Number(level?.r);
      const parsedPercent = Number(level?.percent);
      return {
        r: Number.isFinite(parsedR) && parsedR > 0 ? parsedR : fallback.r,
        percent: Number.isFinite(parsedPercent) && parsedPercent >= 0 ? parsedPercent : fallback.percent,
        trailingStop: Boolean(level?.trailingStop),
      };
    })
    .filter((level) => level.percent > 0)
    .sort((a, b) => a.r - b.r);

  return cleaned.length > 0 ? cleaned : DEFAULT_EXIT_LEVELS;
}

