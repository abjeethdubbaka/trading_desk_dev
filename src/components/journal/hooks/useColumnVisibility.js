import { useCallback, useState } from 'react';

const STORAGE_KEY = 'journal.columns.v2';
const LEGACY_STORAGE_KEY = 'journal.columns.v1';

/**
 * Columns a trader can hide. The four grades are one column now: a row of
 * letters reads as a pattern, where four separate columns read as a table.
 */
export const OPTIONAL_COLUMNS = [
  { key: 'pnl',           label: 'P&L' },
  { key: 'setup',         label: 'Setup' },
  { key: 'grades',        label: 'Grades' },
  { key: 'emotions',      label: 'Emotions' },
  { key: 'overallRating', label: 'Rating' },
];

const DEFAULT = Object.fromEntries(OPTIONAL_COLUMNS.map((c) => [c.key, true]));

/**
 * Earlier settings had a toggle per grade. Anyone who had at least one grade
 * showing wants the grades column; anyone who hid all four does not.
 */
function migrateLegacy(stored) {
  if (!stored || typeof stored !== 'object') return {};
  const legacyGradeKeys = ['grade', 'slGrade', 'exitGrade', 'sizeGrade'];
  const hadGradeSetting = legacyGradeKeys.some((key) => key in stored);
  const next = {};

  for (const { key } of OPTIONAL_COLUMNS) {
    if (key === 'grades') {
      if (hadGradeSetting) next.grades = legacyGradeKeys.some((legacy) => stored[legacy]);
    } else if (key in stored) {
      next[key] = Boolean(stored[key]);
    }
  }
  return next;
}

function load() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (current && typeof current === 'object') return { ...DEFAULT, ...current };

    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) ?? 'null');
    return { ...DEFAULT, ...migrateLegacy(legacy) };
  } catch {
    return DEFAULT;
  }
}

export function useColumnVisibility() {
  const [columns, setColumns] = useState(load);

  const toggleColumn = useCallback((key) => {
    setColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }, []);

  return { columns, toggleColumn };
}
