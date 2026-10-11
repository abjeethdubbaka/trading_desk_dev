/**
 * @file src/lib/db/adapters/firebase-simple/morningBriefs.js
 *
 * The morning check-in, one document per day keyed by its local date, so
 * answering twice replaces the day's entry instead of adding another.
 */

import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore/lite';
import { prepareWrite } from './utils.js';

const COLLECTION = 'morningBriefs';

export function createMorningBriefsAdapter(db) {
  return {
    async list() {
      const snap = await getDocs(collection(db, COLLECTION));
      return snap.docs.map((item) => ({ ...item.data(), id: item.id }));
    },

    async get(dateKey) {
      const snap = await getDoc(doc(db, COLLECTION, dateKey));
      return snap.exists() ? { ...snap.data(), id: snap.id } : null;
    },

    async save(dateKey, data) {
      await setDoc(doc(db, COLLECTION, dateKey), prepareWrite({ ...data, date: dateKey }));
      return { ...data, date: dateKey, id: dateKey };
    },

    async delete(dateKey) {
      await deleteDoc(doc(db, COLLECTION, dateKey));
      return { id: dateKey };
    },
  };
}
