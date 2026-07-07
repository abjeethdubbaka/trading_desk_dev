/**
 * @file src/lib/db/adapters/firebase-simple/informativeImages.js
 *
 * Informative Images collection — chart setups/behaviors the user studied.
 * Real Firestore collection (one doc per entry) since images push individual
 * docs close to Firestore's 1 MiB limit; a single-doc-with-array pattern
 * (like settings) would run out of room after only a few entries.
 */

import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { broadcast, addCreateTimestamps, addUpdateTimestamp } from './utils.js';

export function createInformativeImagesAdapter(db) {
  return {
    async list() {
      const q = query(collection(db, 'informativeImages'), orderBy('created_date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({ ...docSnap.data(), id: docSnap.id }));
    },

    async create(data) {
      const clean = addCreateTimestamps(data);
      const docRef = await addDoc(collection(db, 'informativeImages'), clean);
      const created = { ...clean, id: docRef.id };
      broadcast('informative-images-updated', { action: 'create', item: created });
      return created;
    },

    async update(id, data) {
      const clean = addUpdateTimestamp(data);
      await updateDoc(doc(db, 'informativeImages', id), clean);
      const updated = { ...clean, id };
      broadcast('informative-images-updated', { action: 'update', item: updated });
      return updated;
    },

    async delete(id) {
      await deleteDoc(doc(db, 'informativeImages', id));
      broadcast('informative-images-updated', { action: 'delete', id });
      return true;
    },
  };
}
