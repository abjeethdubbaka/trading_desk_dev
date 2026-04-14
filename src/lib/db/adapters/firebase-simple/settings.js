/**
 * @file src/lib/db/adapters/firebase-simple/settings.js
 *
 * Settings collection operations for Firebase Simple adapter.
 */

import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { broadcast, addUpdateTimestamp } from './utils.js';

export function createSettingsAdapter(db) {
  return {
    async get() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'main'));
        if (!snap.exists()) return null;
        return { ...snap.data(), id: snap.id };
      } catch (error) {
        
        throw error;
      }
    },

    async save(data) {
      const clean = addUpdateTimestamp(data);
      
      try {
        await setDoc(doc(db, 'settings', 'main'), clean, { merge: true });
        
        const result = { ...clean, id: 'main' };
        
        broadcast('settings-updated', { action: 'save', settings: result });
        return result;
      } catch (error) {
        
        throw error;
      }
    },

    async clear() {
      try {
        await deleteDoc(doc(db, 'settings', 'main'));
        broadcast('settings-updated', { action: 'clear' });
        return true;
      } catch (error) {
        throw error;
      }
    }
  };
}


