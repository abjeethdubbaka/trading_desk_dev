/**
 * @file src/lib/db/adapters/firebase-simple.js
 *
 * Simplified Firebase adapter using root-level collections (no auth required).
 * For development and migration without user authentication.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection, doc,
  getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, limit as fsLimit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { sanitizeForStorage, withDefaults, TRADE_DEFAULTS } from '../schema.js';
import { firebaseConfig } from '@/config/firebase.js';

// Initialize Firebase
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db   = getFirestore(app);

// ─── Helper functions ─────────────────────────────────────────────────────────────

/** Convert Firestore doc snapshot → plain object with id. */
function fromDoc(snap) {
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...snap.data() };
  return data;
}

/** Strip undefined & convert Date → ISO string for consistency. */
function prepareWrite(data) {
  // Remove undefined keys entirely (Firestore rejects them)
  const result = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  return result;
}

/** Broadcast DOM event so React Query can invalidate. */
function broadcast(channel, detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(channel, { detail }));
  }
}

// ─── Trades ──────────────────────────────────────────────────────────────────

const trades = {
  async list(options = {}) {
    try {
      const tradesRef = collection(db, 'trades');
      let q = query(tradesRef);
      
      // Add ordering
      q = query(q, orderBy('entry_time', 'desc'));
      
      // Add limit if specified
      if (options.limit) {
        q = query(q, fsLimit(options.limit));
      }

      const snap = await getDocs(q);
      const results = snap.docs.map((doc) => fromDoc(doc));
      return results;
    } catch (error) {
      console.error('💥 Firebase LIST TRADES - ERROR:', error);
      throw error;
    }
  },

  async get(id) {
    const snap = await getDoc(doc(db, 'trades', id));
    return fromDoc(snap);
  },

  async create(data) {
    try {
      const clean = prepareWrite(data);
      clean.created_date = serverTimestamp();
      clean.updated_date = serverTimestamp();
      
      const docRef = await addDoc(collection(db, 'trades'), clean);
      const result = { id: docRef.id, ...clean };
      
      broadcast('trades-updated', { action: 'create', trade: result });
      return result;
    } catch (error) {
      console.error('💥 Firebase CREATE TRADE - ERROR:', error);
      throw error;
    }
  },

  async update(id, changes) {
    const clean = prepareWrite(changes);
    clean.updated_date = serverTimestamp();
    
    await updateDoc(doc(db, 'trades', id), clean);
    const result = { id, ...clean };
    broadcast('trades-updated', { action: 'update', trade: result });
    return result;
  },

  async delete(id) {
    await deleteDoc(doc(db, 'trades', id));
    broadcast('trades-updated', { action: 'delete', tradeId: id });
  },

  async bulkCreate(tradesArray) {
    const results = [];
    
    for (const tradeData of tradesArray) {
      try {
        const result = await this.create(tradeData);
        results.push(result);
      } catch (error) {
        console.error('💥 Firebase BULK CREATE - ERROR on trade:', error);
        throw error;
      }
    }
    
    return results;
  }
};

// ─── Settings ────────────────────────────────────────────────────────────────

const settings = {
  async get() {
    const snap = await getDoc(doc(db, 'settings', 'main'));
    return fromDoc(snap);
  },

  async save(data) {
    const clean = prepareWrite(data);
    clean.updated_date = serverTimestamp();
    
    await setDoc(doc(db, 'settings', 'main'), clean, { merge: true });
    const result = { id: 'main', ...clean };
    broadcast('settings-updated', { action: 'save', settings: result });
    return result;
  }
};

// ─── Other collections (minimal implementation for migration) ─────────────────

const calcHistory = {
  async list() {
    const snap = await getDocs(collection(db, 'calcHistory'));
    return snap.docs.map(fromDoc);
  },
  async create(data) {
    const clean = prepareWrite(data);
    clean.created_date = serverTimestamp();
    const docRef = await addDoc(collection(db, 'calcHistory'), clean);
    return { id: docRef.id, ...clean };
  }
};

const watchlist = {
  async list() {
    const snap = await getDocs(collection(db, 'watchlist'));
    return snap.docs.map(fromDoc);
  },
  async create(data) {
    const clean = prepareWrite(data);
    clean.created_date = serverTimestamp();
    const docRef = await addDoc(collection(db, 'watchlist'), clean);
    return { id: docRef.id, ...clean };
  }
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const firebaseSimpleAdapter = {
  name: 'firebase-simple',
  trades,
  settings,
  calcHistory,
  watchlist,
  
  // Additional collections with minimal implementation
  dosAndDonts: {
    async get() { return { items: [] }; },
    async save(data) { return data; }
  },
  knowledgeBase: {
    async get() { return { items: [] }; },
    async save(data) { return data; }
  },
  strategyPresets: {
    async list() { return []; },
    async create(data) { return data; }
  }
};

// No auth exports for simple adapter
export const firebaseAuth = null;
