/**
 * @file src/lib/db/adapters/firebase-simple/settings.js
 *
 * Settings collection operations for Firebase Simple adapter.
 */

import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { broadcast, addCreateTimestamps, addUpdateTimestamp } from './utils.js';

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

export function createSettingsPresetsAdapter(db) {
  return {
    async list() {
      const q = query(collection(db, 'settings_presets'), orderBy('created_date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async create(data) {
      const clean = addCreateTimestamps({ ...data });
      const ref = await addDoc(collection(db, 'settings_presets'), clean);
      return { ...clean, id: ref.id };
    },
    async delete(id) {
      await deleteDoc(doc(db, 'settings_presets', id));
      return true;
    },
  };
}


