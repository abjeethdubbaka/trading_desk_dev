/**
 * @file src/lib/db/adapters/firebase-simple/collections.js
 *
 * Additional collections (calcHistory, watchlist, media) for Firebase Simple adapter.
 */

import {
  collection, doc,
  getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy,
} from 'firebase/firestore';
import { broadcast, addCreateTimestamps, addUpdateTimestamp, prepareWrite, withDefaults } from './utils.js';

export function createCalcHistoryAdapter(db) {
  return {
    async list() {
      const snap = await getDocs(collection(db, 'calcHistory'));
      return snap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));
    },
    
    async create(data) {
      const clean = addCreateTimestamps(data);
      // Use timestamp to match what the component expects
      clean.timestamp = clean.created_date;
      
      const docRef = await addDoc(collection(db, 'calcHistory'), clean);
      return { ...clean, id: docRef.id };
    },
    
    async get(id) {
      const snap = await getDoc(doc(db, 'calcHistory', id));
      if (!snap.exists()) return null;
      return { ...snap.data(), id: snap.id };
    },
    
    async delete(id) {
      await deleteDoc(doc(db, 'calcHistory', id));
      broadcast('calc-history-updated', { action: 'delete', calculationId: id });
      return true;
    },
    
    async clear() {
      const snap = await getDocs(collection(db, 'calcHistory'));
      const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      broadcast('calc-history-cleared', {});
      return [];
    }
  };
}

export function createWatchlistAdapter(db) {
  return {
    async list() {
      const snap = await getDocs(collection(db, 'watchlist'));
      return snap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));
    },
    
    async create(data) {
      const clean = addCreateTimestamps(data);
      const docRef = await addDoc(collection(db, 'watchlist'), clean);
      return { ...clean, id: docRef.id };
    }
  };
}

export function createMediaAdapter(db) {
  return {
    async list(options = {}) {
      const q = query(collection(db, 'media'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));
      
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      const docRef = await addDoc(collection(db, 'media'), clean);
      return { ...clean, id: docRef.id };
    },
    
    async get(id) {
      const snap = await getDoc(doc(db, 'media', id));
      if (!snap.exists()) return null;
      return { ...snap.data(), id: snap.id };
    },
    
    async update(id, data) {
      const clean = addUpdateTimestamp({ ...data });
      await updateDoc(doc(db, 'media', id), clean);
      return this.get(id);
    },
    
    async delete(id) {
      await deleteDoc(doc(db, 'media', id));
      broadcast('media:deleted', { id });
    }
  };
}

// Minimal implementations for other collections
export function createMinimalAdapters() {
  return {
    knowledgeBase: {
      async get() { return { items: [] }; },
      async save(data) { return data; }
    },
    strategyPresets: {
      async list() { return []; },
      async create(data) { return data; }
    }
  };
}


