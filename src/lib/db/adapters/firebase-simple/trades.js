/**
 * @file src/lib/db/adapters/firebase-simple/trades.js
 *
 * Trades collection operations for Firebase Simple adapter.
 */

import { 
  collection, doc,
  getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, limit as fsLimit,
} from 'firebase/firestore';
import { broadcast, addCreateTimestamps, addUpdateTimestamp } from './utils.js';

const FIRESTORE_INDEXED_SORT_FIELDS = Object.freeze({
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

export function createTradesAdapter(db) {
  return {
    async list(options = {}) {
      try {
        const tradesRef = collection(db, 'trades');
        let q = query(tradesRef);
        
        // For now, fetch all trades and filter client-side to avoid index requirements.
        const requestedSortBy = options.sortBy || 'entry_time';
        const sortBy = FIRESTORE_INDEXED_SORT_FIELDS[requestedSortBy] || 'entry_time';
        const sortDir = options.sortDir === 'asc' ? 'asc' : 'desc';
        q = query(q, orderBy(sortBy, sortDir));
        
        // Add limit if specified
        if (options.limit) {
          q = query(q, fsLimit(options.limit));
        }

        const snap = await getDocs(q);
        let results = snap.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        
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
        throw error;
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
        console.info('[FirebaseSimple][trades.create] write start', {
          symbol: clean?.symbol,
          quantity: clean?.quantity,
          direction: clean?.direction,
          entry_time: clean?.entry_time,
        });
        
        const docRef = await addDoc(collection(db, 'trades'), clean);
        const result = { ...clean, id: docRef.id };
        console.info('[FirebaseSimple][trades.create] write success', {
          id: result.id,
          symbol: result.symbol,
        });
        
        broadcast('trades-updated', { action: 'create', trade: result });
        return result;
      } catch (error) {
        console.error('[FirebaseSimple][trades.create] write failed', {
          code: error?.code,
          message: error?.message,
          name: error?.name,
        });
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


