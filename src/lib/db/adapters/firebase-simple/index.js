/**
 * @file src/lib/db/adapters/firebase-simple/index.js
 *
 * Simplified Firebase adapter using root-level collections (no auth required).
 * For development and migration without user authentication.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/config/firebase.js';
import { createTradesAdapter } from './trades.js';
import { createSettingsAdapter } from './settings.js';
import { createCalcHistoryAdapter, createWatchlistAdapter, createMediaAdapter, createMinimalAdapters } from './collections.js';

// Initialize Firebase
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db   = getFirestore(app);

// Create adapters for each collection
const trades = createTradesAdapter(db);
const settings = createSettingsAdapter(db);
const calcHistory = createCalcHistoryAdapter(db);
const watchlist = createWatchlistAdapter(db);
const media = createMediaAdapter(db);
const minimalAdapters = createMinimalAdapters();

// ─── Export ───────────────────────────────────────────────────────────────────

export const firebaseSimpleAdapter = {
  name: 'firebase-simple',
  trades,
  settings,
  calcHistory,
  watchlist,
  media,
  ...minimalAdapters
};

// No auth exports for simple adapter
export const firebaseAuth = null;


