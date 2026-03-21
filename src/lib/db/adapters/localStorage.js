/**
 * @file src/lib/db/adapters/localStorage.js
 *
 * LocalStorage adapter — the current data backend.
 * Implements the same interface as the Supabase adapter so you can swap
 * by changing one line in src/lib/db/index.js.
 *
 * All methods are async so callers work unchanged after migration.
 */

import { sanitizeForStorage, withDefaults, TRADE_DEFAULTS } from '../schema.js';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  TRADES:      'trades',
  SETTINGS:    'userSettings',
  CALC_HISTORY:'calcHistory',
  WATCHLIST:   'watchlist',
  NOTIFICATIONS:'notifications',
  DOS_DONTS:   'dosAndDonts',
  KNOWLEDGE:   'knowledgeBase',
  LEARNING:    'learningProgress',
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`[DB] Failed to read "${key}":`, e);
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[DB] Failed to write "${key}":`, e);
    return false;
  }
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function now() {
  return new Date().toISOString();
}

/** Dispatch a custom event so other components can react to data changes. */
function broadcast(channel, detail) {
  window.dispatchEvent(new CustomEvent(channel, { detail }));
}

// ─── Trades ──────────────────────────────────────────────────────────────────

const trades = {
  async list(options = {}) {
    const all = read(KEYS.TRADES) ?? [];
    let result = Array.isArray(all) ? all : [];

    // Filtering
    if (options.symbol) {
      result = result.filter(t => t.symbol === options.symbol.toUpperCase());
    }
    if (options.direction) {
      result = result.filter(t => t.direction === options.direction);
    }
    if (options.from) {
      const from = new Date(options.from);
      result = result.filter(t => new Date(t.entry_time || t.created_date) >= from);
    }
    if (options.to) {
      const to = new Date(options.to);
      result = result.filter(t => new Date(t.entry_time || t.created_date) <= to);
    }

    // Sorting — default newest first
    const sortKey = options.sortBy ?? 'entry_time';
    const sortDir = options.sortDir ?? 'desc';
    result.sort((a, b) => {
      const av = a[sortKey] ?? a.created_date ?? '';
      const bv = b[sortKey] ?? b.created_date ?? '';
      return sortDir === 'desc'
        ? new Date(bv) - new Date(av)
        : new Date(av) - new Date(bv);
    });

    // Pagination
    if (options.limit) result = result.slice(options.offset ?? 0, options.limit);

    return result;
  },

  async get(id) {
    const all = read(KEYS.TRADES) ?? [];
    return all.find(t => String(t.id) === String(id)) ?? null;
  },

  async create(data) {
    const all = read(KEYS.TRADES) ?? [];
    const record = sanitizeForStorage({
      ...withDefaults(TRADE_DEFAULTS, data),
      id: generateId(),
      created_date: now(),
      updated_date: now(),
    });
    all.push(record);
    write(KEYS.TRADES, all);
    broadcast('trades-updated', { action: 'create', trade: record });
    return record;
  },

  async update(id, data) {
    const all = read(KEYS.TRADES) ?? [];
    const idx = all.findIndex(t => String(t.id) === String(id));
    if (idx === -1) throw new Error(`Trade ${id} not found`);
    const updated = sanitizeForStorage({ ...all[idx], ...data, updated_date: now() });
    all[idx] = updated;
    write(KEYS.TRADES, all);
    broadcast('trades-updated', { action: 'update', trade: updated });
    return updated;
  },

  async delete(id) {
    const all = read(KEYS.TRADES) ?? [];
    const next = all.filter(t => String(t.id) !== String(id));
    write(KEYS.TRADES, next);
    broadcast('trades-updated', { action: 'delete', id });
    return { id };
  },

  async bulkCreate(rows) {
    const all = read(KEYS.TRADES) ?? [];
    const records = rows.map(data => sanitizeForStorage({
      ...withDefaults(TRADE_DEFAULTS, data),
      id: generateId(),
      created_date: now(),
      updated_date: now(),
    }));
    write(KEYS.TRADES, [...all, ...records]);
    broadcast('trades-updated', { action: 'bulk-create', count: records.length });
    return records;
  },

  async clear() {
    write(KEYS.TRADES, []);
    broadcast('trades-updated', { action: 'clear' });
  },
};

// ─── Settings ─────────────────────────────────────────────────────────────────

const settings = {
  async get() {
    return read(KEYS.SETTINGS) ?? null;
  },

  async save(data) {
    const existing = read(KEYS.SETTINGS) ?? {};
    const merged = { ...existing, ...data, updated_date: now() };
    write(KEYS.SETTINGS, merged);
    return merged;
  },

  async reset() {
    localStorage.removeItem(KEYS.SETTINGS);
  },
};

// ─── Calculation History ──────────────────────────────────────────────────────

const calcHistory = {
  async list() {
    return read(KEYS.CALC_HISTORY) ?? [];
  },

  async add(item) {
    const existing = read(KEYS.CALC_HISTORY) ?? [];
    const record = { ...item, id: item.id ?? generateId(), timestamp: item.timestamp ?? now() };
    const next = [record, ...existing].slice(0, 100); // cap at 100
    write(KEYS.CALC_HISTORY, next);
    return record;
  },

  async delete(id) {
    const existing = read(KEYS.CALC_HISTORY) ?? [];
    write(KEYS.CALC_HISTORY, existing.filter(i => String(i.id) !== String(id)));
  },

  async clear() {
    write(KEYS.CALC_HISTORY, []);
  },
};

// ─── Watchlist ─────────────────────────────────────────────────────────────────

const watchlist = {
  async list() {
    return read(KEYS.WATCHLIST) ?? [];
  },
  async create(data) {
    const all = read(KEYS.WATCHLIST) ?? [];
    const record = { ...data, id: generateId(), created_date: now() };
    write(KEYS.WATCHLIST, [record, ...all]);
    return record;
  },
  async update(id, data) {
    const all = read(KEYS.WATCHLIST) ?? [];
    const idx = all.findIndex(w => String(w.id) === String(id));
    if (idx === -1) throw new Error(`Watchlist item ${id} not found`);
    all[idx] = { ...all[idx], ...data };
    write(KEYS.WATCHLIST, all);
    return all[idx];
  },
  async delete(id) {
    const all = read(KEYS.WATCHLIST) ?? [];
    write(KEYS.WATCHLIST, all.filter(w => String(w.id) !== String(id)));
  },
};

// ─── Generic key-value store (dos-and-donts, knowledge base, etc.) ───────────

function makeKVStore(key) {
  return {
    async list() { return read(key) ?? []; },
    async save(data) { write(key, data); return data; },
    async clear() { localStorage.removeItem(key); },
  };
}

// ─── Export ──────────────────────────────────────────────────────────────────

export const localStorageAdapter = {
  name: 'localStorage',
  trades,
  settings,
  calcHistory,
  watchlist,
  dosAndDonts:  makeKVStore(KEYS.DOS_DONTS),
  knowledgeBase:makeKVStore(KEYS.KNOWLEDGE),
  learning:     makeKVStore(KEYS.LEARNING),
};
