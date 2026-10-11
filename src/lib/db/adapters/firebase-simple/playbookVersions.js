/**
 * @file src/lib/db/adapters/firebase-simple/playbookVersions.js
 *
 * Strategy versions — a record per change to a Playbook setup's rules, so a
 * trade's result can be credited to the rules that were live when it was
 * taken.
 *
 * Its own collection rather than a field on the setup: versions accumulate
 * for as long as a setup is traded, and every setup shares the single 1 MiB
 * Settings document.
 */

import { collection, doc, getDocs, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore/lite';
import { broadcast, addCreateTimestamps } from './utils.js';

export function createPlaybookVersionsAdapter(db) {
  return {
    async list() {
      const q = query(collection(db, 'playbookVersions'), orderBy('created_date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => ({ ...docSnap.data(), id: docSnap.id }));
    },

    async create(data) {
      const clean = addCreateTimestamps(data);
      const docRef = await addDoc(collection(db, 'playbookVersions'), clean);
      const created = { ...clean, id: docRef.id };
      broadcast('playbook-versions-updated', { action: 'create', item: created });
      return created;
    },

    // A version is history: it is written once and never edited. Deletion
    // exists only for clearing a setup's history along with the setup.
    async delete(id) {
      await deleteDoc(doc(db, 'playbookVersions', id));
      broadcast('playbook-versions-updated', { action: 'delete', id });
      return true;
    },
  };
}
