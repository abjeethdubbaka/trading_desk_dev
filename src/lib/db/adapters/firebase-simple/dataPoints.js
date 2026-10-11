/**
 * @file src/lib/db/adapters/firebase-simple/dataPoints.js
 *
 * Data Points collection — entry/exit/stop observations collected per
 * Playbook strategy to calibrate its expected R.
 *
 * Its own Firestore collection (one doc per data point) for the same reason
 * as informativeImages: attached chart photos are stored inline, which would
 * blow past the 1 MiB limit if they lived in a single shared document.
 *
 * Deliberately separate from `trades` — these are study samples and must
 * never reach the Performance analytics.
 */

import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore/lite';
import { broadcast, addCreateTimestamps, addUpdateTimestamp } from './utils.js';

export function createDataPointsAdapter(db) {
  return {
    async list() {
      const q = query(collection(db, 'dataPoints'), orderBy('created_date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({ ...docSnap.data(), id: docSnap.id }));
    },

    async create(data) {
      const clean = addCreateTimestamps(data);
      const docRef = await addDoc(collection(db, 'dataPoints'), clean);
      const created = { ...clean, id: docRef.id };
      broadcast('data-points-updated', { action: 'create', item: created });
      return created;
    },

    async update(id, data) {
      const clean = addUpdateTimestamp(data);
      await updateDoc(doc(db, 'dataPoints', id), clean);
      const updated = { ...clean, id };
      broadcast('data-points-updated', { action: 'update', item: updated });
      return updated;
    },

    async delete(id) {
      await deleteDoc(doc(db, 'dataPoints', id));
      broadcast('data-points-updated', { action: 'delete', id });
      return true;
    },
  };
}
