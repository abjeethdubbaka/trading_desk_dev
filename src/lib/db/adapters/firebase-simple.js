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
  query, orderBy, limit as fsLimit, where,
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
      
      // For now, fetch all trades and filter client-side to avoid index requirements
      // TODO: Create Firebase index for better performance
      q = query(q, orderBy('entry_time', 'desc'));
      
      // Add limit if specified
      if (options.limit) {
        q = query(q, fsLimit(options.limit));
      }

      const snap = await getDocs(q);
      let results = snap.docs.map((doc) => fromDoc(doc));
      
      // Apply client-side filtering
      if (options.account_tier) {
        results = results.filter(trade => trade.account_tier === options.account_tier);
      }
      
      if (options.symbol) {
        results = results.filter(trade => trade.symbol === options.symbol);
      }
      
      if (options.direction) {
        results = results.filter(trade => trade.direction === options.direction);
      }
      
      // Apply date range filters
      if (options.date_from) {
        const fromDate = new Date(options.date_from);
        results = results.filter(trade => {
          const entryDate = new Date(trade.entry_time);
          return entryDate >= fromDate;
        });
      }
      
      if (options.date_to) {
        const toDate = new Date(options.date_to);
        results = results.filter(trade => {
          const entryDate = new Date(trade.entry_time);
          return entryDate <= toDate;
        });
      }
      
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
    try {
      
      const snap = await getDoc(doc(db, 'settings', 'main'));
      const result = fromDoc(snap);
      
      return result;
    } catch (error) {
      console.error('🔥 Firebase Settings Get Error:', error);
      throw error;
    }
  },

  async save(data) {
    
    const clean = prepareWrite(data);
    
    clean.updated_date = serverTimestamp();
    
    try {
      await setDoc(doc(db, 'settings', 'main'), clean, { merge: true });
      
      const result = { id: 'main', ...clean };
      
      broadcast('settings-updated', { action: 'save', settings: result });
      return result;
    } catch (error) {
      console.error('🔥 Firebase Settings Save Error:', error);
      throw error;
    }
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
  media: {
    async list(options = {}) {
      const q = query(collection(db, 'media'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(fromDoc);
      
      // Apply filtering
      if (options.media_type) {
        return items.filter(item => item.media_type === options.media_type);
      }
      if (options.trade_id) {
        return items.filter(item => item.trade_id === options.trade_id);
      }
      
      return items;
    },
    
    async create(data) {
      const clean = prepareWrite(withDefaults(data, {
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }));
      const docRef = await addDoc(collection(db, 'media'), clean);
      return { id: docRef.id, ...clean };
    },
    
    async get(id) {
      const snap = await getDoc(doc(db, 'media', id));
      return fromDoc(snap);
    },
    
    async update(id, data) {
      const clean = prepareWrite({ ...data, updated_at: serverTimestamp() });
      await updateDoc(doc(db, 'media', id), clean);
      return this.get(id);
    },
    
    async delete(id) {
      await deleteDoc(doc(db, 'media', id));
      broadcast('media:deleted', { id });
    }
  },
  
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
