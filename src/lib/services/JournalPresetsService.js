const STORAGE_KEY = 'journal.presets.v1';

export const BUILT_IN_PRESETS = Object.freeze([
  {
    id: 'all-trades',
    name: 'All Trades',
    builtIn: true,
    createdAt: null,
    filters: { searchTerm: '', filter: 'all', dateRange: 'all', tagFilter: [], sortKey: null, sortDir: 'asc' },
  },
  {
    id: 'this-week-winners',
    name: 'This Week — Winners',
    builtIn: true,
    createdAt: null,
    filters: { searchTerm: '', filter: 'winners', dateRange: 'week', tagFilter: [], sortKey: 'pnl', sortDir: 'desc' },
  },
  {
    id: 'plan-violations',
    name: 'Plan Violations',
    builtIn: true,
    createdAt: null,
    filters: { searchTerm: '', filter: 'losers', dateRange: 'all', tagFilter: [], sortKey: 'date', sortDir: 'desc' },
  },
  {
    id: 'a-plus-setups',
    name: 'A+ Setups',
    builtIn: true,
    createdAt: null,
    filters: { searchTerm: '', filter: 'winners', dateRange: 'all', tagFilter: [], sortKey: 'r_multiple', sortDir: 'desc' },
  },
  {
    id: 'big-losers',
    name: 'Big Losers (>$100)',
    builtIn: true,
    createdAt: null,
    filters: { searchTerm: '', filter: 'losers', dateRange: 'all', tagFilter: [], sortKey: 'pnl', sortDir: 'asc' },
  },
]);

function loadCustomPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomPresets(presets) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(presets)); } catch {}
}

export const JournalPresetsService = {
  getAll() {
    const custom = loadCustomPresets();
    return [...BUILT_IN_PRESETS, ...custom];
  },

  getCustom() {
    return loadCustomPresets();
  },

  getDefault() {
    const custom = loadCustomPresets();
    const defaultPreset = custom.find((p) => p.isDefault);
    return defaultPreset ?? BUILT_IN_PRESETS[0];
  },

  save(name, filters) {
    const custom = loadCustomPresets();
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Preset name cannot be empty');
    const exists = custom.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) throw new Error(`Preset "${trimmed}" already exists`);

    const next = [
      ...custom,
      {
        id: `custom-${Date.now()}`,
        name: trimmed,
        builtIn: false,
        createdAt: new Date().toISOString(),
        isDefault: false,
        filters: { ...filters },
      },
    ];
    saveCustomPresets(next);
    return next;
  },

  delete(id) {
    const custom = loadCustomPresets().filter((p) => p.id !== id);
    saveCustomPresets(custom);
    return custom;
  },

  setDefault(id) {
    const custom = loadCustomPresets().map((p) => ({ ...p, isDefault: p.id === id }));
    saveCustomPresets(custom);
  },

  clearDefault() {
    const custom = loadCustomPresets().map((p) => ({ ...p, isDefault: false }));
    saveCustomPresets(custom);
  },
};
