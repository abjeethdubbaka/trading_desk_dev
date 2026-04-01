/**
 * @file src/lib/db/index.js
 *
 * Database backend entrypoint.
 */

import { firebaseSimpleAdapter, firebaseAuth as firebaseAuthSimple } from './adapters/firebase-simple/index.js';

const adapter = firebaseSimpleAdapter;

export const db = adapter;
export const DB_BACKEND = adapter.name;
export const IS_LOCAL = adapter.name === 'localStorage';
export const IS_REMOTE = adapter.name !== 'localStorage';

// Re-export auth so components don't need to import firebase directly
export const firebaseAuth = firebaseAuthSimple;
