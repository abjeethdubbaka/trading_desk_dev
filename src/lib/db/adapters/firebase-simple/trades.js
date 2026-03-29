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

export function createTradesAdapter(db) {
  return {
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
        let results = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
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
      return { id: snap.id, ...snap.data() };
    },

    async create(data) {
      try {
        const clean = addCreateTimestamps(data);
        
        const docRef = await addDoc(collection(db, 'trades'), clean);
        const result = { id: docRef.id, ...clean };
        
        broadcast('trades-updated', { action: 'create', trade: result });
        return result;
      } catch (error) {
        
        throw error;
      }
    },

    async update(id, changes) {
      const clean = addUpdateTimestamp(changes);
      
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
          
          throw error;
        }
      }
      
      return results;
    }
  };
}


