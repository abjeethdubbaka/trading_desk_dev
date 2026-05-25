import { useCallback, useState } from 'react';

const STORAGE_KEY = 'journal.columns.v1';

export const OPTIONAL_COLUMNS = [
  { key: 'setup',    label: 'Setup' },
  { key: 'emotions', label: 'Emotions' },
  { key: 'quality',  label: 'Quality' },
  { key: 'plan',     label: 'Plan' },
];

const DEFAULT = Object.fromEntries(OPTIONAL_COLUMNS.map((c) => [c.key, true]));

export function useColumnVisibility() {
  const [columns, setColumns] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      return { ...DEFAULT, ...stored };
    } catch {
      return DEFAULT;
    }
  });

  const toggleColumn = useCallback((key) => {
    setColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { columns, toggleColumn };
}
