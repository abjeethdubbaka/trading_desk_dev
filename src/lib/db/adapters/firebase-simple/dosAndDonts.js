/**
 * @file src/lib/db/adapters/firebase-simple/dosAndDonts.js
 *
 * Do's & Don'ts collection operations for Firebase Simple adapter.
 * Single doc (like settings) since it's a bounded, user-curated rule list.
 */

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { broadcast, addUpdateTimestamp } from './utils.js';

export function createDosAndDontsAdapter(db) {
  return {
    async get() {
      const snap = await getDoc(doc(db, 'dosAndDonts', 'main'));
      if (!snap.exists()) return null;
      return { ...snap.data(), id: snap.id };
    },

    async save(data) {
      const clean = addUpdateTimestamp(data);
      await setDoc(doc(db, 'dosAndDonts', 'main'), clean, { merge: true });

      const result = { ...clean, id: 'main' };
      broadcast('dosanddonts-updated', { action: 'save' });
      return result;
    },

    async clear() {
      await deleteDoc(doc(db, 'dosAndDonts', 'main'));
      broadcast('dosanddonts-updated', { action: 'clear' });
      return true;
    },
  };
}
