/**
 * @file src/lib/services/DosAndDontsService.js
 *
 * Do's & Don'ts rule list, persisted as a single Firestore doc (like settings).
 * Seeds from legacy localStorage data (if present) or built-in defaults on
 * first load, since this used to be a localStorage-only feature.
 */

import { getDefaultItems } from '@/components/dosanddonts/utils';

const LEGACY_LOCAL_STORAGE_KEY = 'dosAndDonts';

// Icons in getDefaultItems() are React component references — not
// Firestore-serializable — so they're stripped before persisting. The UI
// already falls back to a type-based icon when item.icon is missing.
const stripIcon = (item) => {
  const { icon: _icon, ...rest } = item ?? {};
  return rest;
};

const readLegacyLocalStorageItems = () => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.map(stripIcon) : null;
  } catch {
    return null;
  }
};

export class DosAndDontsService {
  constructor(dbAdapter) {
    this.db = dbAdapter;
    this.cache = null;
    this.cacheTimestamp = null;
    this.cacheTimeout = 30000;
  }

  async getItems() {
    const cached = this._getFromCache();
    if (cached) return cached;

    const stored = await this.db.dosAndDonts.get();
    if (stored && Array.isArray(stored.items) && stored.items.length > 0) {
      this._updateCache(stored.items);
      return stored.items;
    }

    // First load: migrate legacy localStorage data if present, else seed defaults.
    const legacyItems = readLegacyLocalStorageItems();
    const seedItems = legacyItems ?? getDefaultItems().map(stripIcon);
    await this.saveItems(seedItems);
    return seedItems;
  }

  async saveItems(items) {
    const cleanItems = Array.isArray(items) ? items.map(stripIcon) : [];
    await this.db.dosAndDonts.save({ items: cleanItems });
    this._updateCache(cleanItems);
    return cleanItems;
  }

  _getFromCache() {
    if (this.cache && this.cacheTimestamp && (Date.now() - this.cacheTimestamp < this.cacheTimeout)) {
      return this.cache;
    }
    return null;
  }

  _updateCache(items) {
    this.cache = items;
    this.cacheTimestamp = Date.now();
  }

  invalidateCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }
}

export function createDosAndDontsService(dbAdapter) {
  return new DosAndDontsService(dbAdapter);
}
