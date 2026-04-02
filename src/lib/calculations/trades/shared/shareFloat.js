const SHARE_FLOAT_RANGES = Object.freeze([
  { key: 'micro', label: 'Micro (<10M)', min: 0, max: 10_000_000 },
  { key: 'small', label: 'Small (10M-50M)', min: 10_000_000, max: 50_000_000 },
  { key: 'medium', label: 'Medium (50M-200M)', min: 50_000_000, max: 200_000_000 },
  { key: 'large', label: 'Large (200M-1B)', min: 200_000_000, max: 1_000_000_000 },
  { key: 'mega', label: 'Mega (1B+)', min: 1_000_000_000, max: Infinity },
]);

const SHARE_FLOAT_RANGE_BY_KEY = Object.freeze(
  SHARE_FLOAT_RANGES.reduce((acc, range) => {
    acc[range.key] = range;
    return acc;
  }, {})
);

const UNKNOWN_SHARE_FLOAT_RANGE = Object.freeze({
  key: 'unknown',
  label: 'Unknown Float',
});

function toFiniteNumber(value) {
  if (value == null || value === '') return null;
  if (value === Infinity || value === 'Infinity') return Infinity;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBoundary(value) {
  const numericValue = toFiniteNumber(value);
  if (numericValue == null) return null;
  if (numericValue === Infinity) return Infinity;

  // Some legacy settings store boundaries in "millions" units (e.g. 10, 50, 200).
  // Treat small values as millions for compatibility with share_float absolute values.
  if (numericValue > 0 && numericValue <= 10_000) {
    return numericValue * 1_000_000;
  }

  return numericValue;
}

function titleCase(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeShareFloatRangeKey(value, rangeByKey = SHARE_FLOAT_RANGE_BY_KEY) {
  const rawValue = String(value ?? '').trim().toLowerCase();
  if (!rawValue) return null;

  if (rangeByKey[rawValue]) return rawValue;

  const collapsedRaw = rawValue.replace(/[\s_-]+/g, '');
  const keyMatches = Object.keys(rangeByKey).find(
    (key) => key.toLowerCase().replace(/[\s_-]+/g, '') === collapsedRaw
  );
  if (keyMatches) return keyMatches;

  const labelMatches = Object.entries(rangeByKey).find(([, range]) => {
    const label = String(range?.label || '').toLowerCase().replace(/[\s_-]+/g, '');
    return label && (label.includes(collapsedRaw) || collapsedRaw.includes(label));
  });
  if (labelMatches) return labelMatches[0];

  if (rawValue.includes('micro')) return 'micro';
  if (rawValue.includes('small')) return 'small';
  if (rawValue.includes('mid') && rangeByKey.mid) return 'mid';
  if (rawValue.includes('medium')) return 'medium';
  if (rawValue.includes('large')) return 'large';
  if (rawValue.includes('mega')) return 'mega';

  return null;
}

function buildRangesFromSettings(floatCategories) {
  const entries = Object.entries(floatCategories || {});
  if (!entries.length) return null;

  const normalized = entries
    .map(([key, category]) => {
      const min = normalizeBoundary(category?.min);
      const max = normalizeBoundary(category?.max);

      if (min == null || max == null) return null;
      if (max <= min) return null;

      return {
        key: String(key).trim().toLowerCase(),
        label: String(category?.label || titleCase(key)).trim(),
        min,
        max,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.min - b.min);

  if (!normalized.length) return null;
  return Object.freeze(normalized);
}

function resolveRanges(floatCategories = null) {
  const fromSettings = buildRangesFromSettings(floatCategories);
  return fromSettings || SHARE_FLOAT_RANGES;
}

function buildRangeByKey(ranges) {
  return Object.freeze(
    ranges.reduce((acc, range) => {
      acc[range.key] = range;
      return acc;
    }, {})
  );
}

export function getShareFloatRanges(floatCategories = null) {
  return resolveRanges(floatCategories);
}

export function getUnknownShareFloatRange() {
  return UNKNOWN_SHARE_FLOAT_RANGE;
}

export function getShareFloatRangeByKey(floatCategories = null) {
  const ranges = resolveRanges(floatCategories);
  return buildRangeByKey(ranges);
}

export function resolveShareFloatRange(
  shareFloat,
  floatCategory = null,
  storedRange = null,
  floatCategories = null
) {
  const ranges = resolveRanges(floatCategories);
  const rangeByKey = buildRangeByKey(ranges);

  const storedKey = normalizeShareFloatRangeKey(storedRange, rangeByKey);
  if (storedKey) return rangeByKey[storedKey];

  const categoryKey = normalizeShareFloatRangeKey(floatCategory, rangeByKey);
  if (categoryKey) return rangeByKey[categoryKey];

  const numericShareFloat = Number(shareFloat);
  if (Number.isFinite(numericShareFloat) && numericShareFloat >= 0) {
    const matchedRange = ranges.find(
      (range) => numericShareFloat >= range.min && numericShareFloat < range.max
    );
    return matchedRange || UNKNOWN_SHARE_FLOAT_RANGE;
  }

  return UNKNOWN_SHARE_FLOAT_RANGE;
}
