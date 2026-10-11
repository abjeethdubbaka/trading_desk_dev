/**
 * @file src/lib/db/adapters/firebase-simple/setupJournal.js
 *
 * Setup Journal collection — one structured debrief per trade taken on a
 * Playbook strategy, answered from that setup's own template.
 *
 * Its own Firestore collection rather than a field on Settings: entries
 * accumulate for as long as the setup is traded, which the single 1 MiB
 * settings document could not hold.
 */

import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore/lite';
import { broadcast, addCreateTimestamps, addUpdateTimestamp } from './utils.js';

export function createSetupJournalAdapter(db) {
  return {
    async list() {
      const q = query(collection(db, 'setupJournal'), orderBy('created_date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({ ...docSnap.data(), id: docSnap.id }));
    },

    async create(data) {
      const clean = addCreateTimestamps(data);
      const docRef = await addDoc(collection(db, 'setupJournal'), clean);
      const created = { ...clean, id: docRef.id };
      broadcast('setup-journal-updated', { action: 'create', item: created });
      return created;
    },

    async update(id, data) {
      const clean = addUpdateTimestamp(data);
      await updateDoc(doc(db, 'setupJournal', id), clean);
      const updated = { ...clean, id };
      broadcast('setup-journal-updated', { action: 'update', item: updated });
      return updated;
    },

    async delete(id) {
      await deleteDoc(doc(db, 'setupJournal', id));
      broadcast('setup-journal-updated', { action: 'delete', id });
      return true;
    },
  };
}
