/**
 * @file src/lib/db/adapters/firebase-simple/trades.js
 *
 * Trades collection operations for Firebase Simple adapter.
 */

import { 
  collection, doc,
  getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, startAfter, limit as fsLimit,
} from 'firebase/firestore';
import { broadcast, addCreateTimestamps, addUpdateTimestamp } from './utils.js';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const FIRESTORE_INDEXED_SORT_FIELDS = Object.freeze({
  entry_time: 'entry_time',
  created_date: 'created_date',
  updated_date: 'updated_date',
  pnl: 'pnl',
  symbol: 'symbol',
  direction: 'direction',
  account_tier: 'account_tier',
  setup_type: 'setup_type',
  r_multiple: 'r_multiple',
});

function normalizeText(value) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function toPositiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function normalizeDateFilterValue(value, { endOfDay = false } = {}) {
  if (value === undefined || value === null || value === '') return null;

  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null;
    return value.toISOString();
  }

  const rawValue = String(value).trim();
  if (!rawValue) return null;

  const isDateOnly = DATE_ONLY_PATTERN.test(rawValue);
  const parsedDate = isDateOnly
    ? new Date(`${rawValue}T00:00:00`)
    : new Date(rawValue);

  if (!Number.isFinite(parsedDate.getTime())) return null;

  if (isDateOnly) {
    if (endOfDay) {
      parsedDate.setHours(23, 59, 59, 999);
    } else {
      parsedDate.setHours(0, 0, 0, 0);
    }
  }

  return parsedDate.toISOString();
}

function toTimestamp(value) {
  const parsed = Date.parse(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCursorValue(value, sortBy) {
  if (value === undefined || value === null || value === '') return null;

  if (sortBy === 'entry_time' || sortBy === 'created_date' || sortBy === 'updated_date') {
    return normalizeDateFilterValue(value);
  }

  if (sortBy === 'pnl' || sortBy === 'r_multiple') {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return normalizeText(value) ?? value;
}

export function normalizeTradeListOptions(options = {}) {
  const requestedSortBy = normalizeText(options.sortBy) || 'entry_time';
  let sortBy = FIRESTORE_INDEXED_SORT_FIELDS[requestedSortBy] || 'entry_time';
  const sortDir = options.sortDir === 'asc' ? 'asc' : 'desc';

  const normalizedOptions = {
    sortBy,
    sortDir,
    limit: toPositiveInteger(options.limit),
    account_tier: normalizeText(options.account_tier),
    symbol: normalizeText(options.symbol)?.toUpperCase() || null,
    direction: normalizeText(options.direction)?.toLowerCase() || null,
    setup_type: normalizeText(options.setup_type),
    date_from: normalizeDateFilterValue(options.date_from),
    date_to: normalizeDateFilterValue(options.date_to, { endOfDay: true }),
  };

  // Keep range filters queryable on Firestore without requiring extra sort indexes.
  if ((normalizedOptions.date_from || normalizedOptions.date_to) && sortBy !== 'entry_time') {
    normalizedOptions.sortBy = 'entry_time';
  }

  normalizedOptions.after = normalizeCursorValue(options.after, normalizedOptions.sortBy);

  return normalizedOptions;
}

export function applyTradeClientFilters(trades = [], options = {}) {
  const normalizedOptions = normalizeTradeListOptions(options);
  const fromTimestamp = normalizedOptions.date_from ? Date.parse(normalizedOptions.date_from) : null;
  const toTimestampValue = normalizedOptions.date_to ? Date.parse(normalizedOptions.date_to) : null;

  return trades.filter((trade) => {
    if (normalizedOptions.account_tier && trade.account_tier !== normalizedOptions.account_tier) {
      return false;
    }

    if (normalizedOptions.symbol && String(trade.symbol || '').toUpperCase() !== normalizedOptions.symbol) {
      return false;
    }

    if (normalizedOptions.direction && String(trade.direction || '').toLowerCase() !== normalizedOptions.direction) {
      return false;
    }

    if (normalizedOptions.setup_type && String(trade.setup_type || '') !== normalizedOptions.setup_type) {
      return false;
    }

    if (fromTimestamp || toTimestampValue) {
      const tradeTimestamp = toTimestamp(trade.entry_time);
      if (tradeTimestamp === null) return false;
      if (fromTimestamp && tradeTimestamp < fromTimestamp) return false;
      if (toTimestampValue && tradeTimestamp > toTimestampValue) return false;
    }

    return true;
  });
}

export function isLikelyFirestoreIndexError(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  return (
    code.includes('failed-precondition') ||
    message.includes('requires an index') ||
    message.includes('create it here')
  );
}

function hasServerSideFilters(options) {
  return Boolean(
    options.account_tier ||
      options.symbol ||
      options.direction ||
      options.setup_type ||
      options.date_from ||
      options.date_to
  );
}

function buildTradesQuery(tradesRef, options, { includeFilters = true, includeLimit = true } = {}) {
  const constraints = [];

  if (includeFilters) {
    if (options.account_tier) constraints.push(where('account_tier', '==', options.account_tier));
    if (options.symbol) constraints.push(where('symbol', '==', options.symbol));
    if (options.direction) constraints.push(where('direction', '==', options.direction));
    if (options.setup_type) constraints.push(where('setup_type', '==', options.setup_type));
    if (options.date_from) constraints.push(where('entry_time', '>=', options.date_from));
    if (options.date_to) constraints.push(where('entry_time', '<=', options.date_to));
  }

  constraints.push(orderBy(options.sortBy, options.sortDir));

  if (options.after !== null && options.after !== undefined) {
    constraints.push(startAfter(options.after));
  }

  if (includeLimit && options.limit) {
    constraints.push(fsLimit(options.limit));
  }

  return query(tradesRef, ...constraints);
}

export function createTradesAdapter(db) {
  return {
    async list(options = {}) {
      const normalizedOptions = normalizeTradeListOptions(options);
      const tradesRef = collection(db, 'trades');

      try {
        const primaryQuery = buildTradesQuery(tradesRef, normalizedOptions, {
          includeFilters: true,
          includeLimit: true,
        });

        const snap = await getDocs(primaryQuery);
        let results = snap.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        }));

        // Defensive post-filtering keeps behavior stable across mixed data quality.
        results = applyTradeClientFilters(results, normalizedOptions);
        if (normalizedOptions.limit) {
          results = results.slice(0, normalizedOptions.limit);
        }

        return results;
      } catch (error) {
        // Graceful fallback for missing composite indexes.
        if (!isLikelyFirestoreIndexError(error)) {
          throw error;
        }

        const fallbackQuery = buildTradesQuery(tradesRef, normalizedOptions, {
          includeFilters: false,
          includeLimit: !hasServerSideFilters(normalizedOptions),
        });

        const fallbackSnap = await getDocs(fallbackQuery);
        let fallbackResults = fallbackSnap.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        }));

        fallbackResults = applyTradeClientFilters(fallbackResults, normalizedOptions);
        if (normalizedOptions.limit) {
          fallbackResults = fallbackResults.slice(0, normalizedOptions.limit);
        }

        return fallbackResults;
      }
    },

    async get(id) {
      const snap = await getDoc(doc(db, 'trades', id));
      if (!snap.exists()) return null;
      return { ...snap.data(), id: snap.id };
    },

    async create(data) {
      try {
        const clean = addCreateTimestamps(data);
        
        const docRef = await addDoc(collection(db, 'trades'), clean);
        const result = { ...clean, id: docRef.id };
        
        broadcast('trades-updated', { action: 'create', trade: result });
        return result;
      } catch (error) {
        throw error;
      }
    },

    async update(id, changes) {
      const clean = addUpdateTimestamp(changes);
      await updateDoc(doc(db, 'trades', id), clean);
      const snap = await getDoc(doc(db, 'trades', id));
      const result = snap.exists() ? { ...snap.data(), id: snap.id } : { ...clean, id };
      broadcast('trades-updated', { action: 'update', trade: result });
      return result;
    },

    async delete(id) {
      const ref = doc(db, 'trades', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        throw new Error(`Trade ${id} not found`);
      }
      await deleteDoc(ref);
      broadcast('trades-updated', { action: 'delete', tradeId: id });
      return { id };
    },

    async bulkCreate(tradesArray) {
      const results = [];
      
      for (const tradeData of tradesArray) {
        try {
          const result = await this.create(tradeData);
          results.push(result);
        } catch (error) {
          
          throw error;
        }
      }
      
      return results;
    }
  };
}


