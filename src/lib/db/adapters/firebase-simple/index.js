/**
 * @file src/lib/db/adapters/firebase-simple/index.js
 *
 * Simplified Firebase adapter using root-level collections (no auth required).
 * For development and migration without user authentication.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/config/firebaseEnv.js';
import { createTradesAdapter } from './trades.js';
import { createSettingsAdapter, createSettingsPresetsAdapter } from './settings.js';
import { createCalcHistoryAdapter, createWatchlistAdapter, createMediaAdapter, createMinimalAdapters } from './collections.js';
import { createFinanceAdapter } from './finance.js';

// Initialize Firebase
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db   = getFirestore(app);

// Create adapters for each collection
const trades = createTradesAdapter(db);
const settings = createSettingsAdapter(db);
const settingsPresets = createSettingsPresetsAdapter(db);
const calcHistory = createCalcHistoryAdapter(db);
const watchlist = createWatchlistAdapter(db);
const media = createMediaAdapter(db);
const minimalAdapters = createMinimalAdapters();
const finance = createFinanceAdapter(db);

// ─── Export ───────────────────────────────────────────────────────────────────

export const firebaseSimpleAdapter = {
  name: 'firebase-simple',
  trades,
  settings,
  settingsPresets,
  calcHistory,
  watchlist,
  media,
  finance,
  ...minimalAdapters
};

// No auth exports for simple adapter
export const firebaseAuth = null;


