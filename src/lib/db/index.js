/**
 * @file src/lib/db/index.js
 *
 * ════════════════════════════════════════════════════════════════
 *  DATABASE LAYER — THE ONE FILE YOU CHANGE TO SWITCH BACKENDS
 * ════════════════════════════════════════════════════════════════
 *
 * Currently: localStorage  →  works offline, zero config
 * To switch to Supabase:   change the import below + follow setup
 *                          instructions in adapters/supabase.js
 *
 * Usage anywhere in the app:
 *
 *   import { db } from '@/lib/db';
 *
 *   const trades    = await db.trades.list();
 *   const trade     = await db.trades.create({ symbol: 'AAPL', ... });
 *   const updated   = await db.trades.update(id, { pnl: 500 });
 *   await             db.trades.delete(id);
 *
 *   const settings  = await db.settings.get();
 *   await             db.settings.save({ account_size: 75000 });
 */

import { firebaseSimpleAdapter } from './adapters/firebase-simple.js';
import { localStorageAdapter } from './adapters/localStorage.js';

// ← CHANGE THIS ONE LINE TO SWITCH BACKENDS ───────────────────────────────────
const adapter = firebaseSimpleAdapter;
// const adapter = localStorageAdapter;  // ← uncomment for offline / dev mode
// const adapter = firebaseAdapter;       // ← full auth version (requires sign-in)
// ─────────────────────────────────────────────────────────────────────────────

export const db         = adapter;
export const DB_BACKEND = adapter.name;
export const IS_LOCAL   = adapter.name === 'localStorage';
export const IS_REMOTE  = adapter.name === 'firebase';

// Re-export auth so components don't need to import firebase directly
export { firebaseAuth } from './adapters/firebase-simple.js';
