/**
 * @file src/lib/db/adapters/firebase-simple/guardianDays.js
 *
 * Trading Guardian's record of each day — its timeline of warnings, the final
 * trade and any lock — one document per day keyed by date, so
 * saving again replaces the day's entry instead of adding another.
 */

import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore/lite';
import { prepareWrite } from './utils.js';

const COLLECTION = 'guardianDays';

export function createGuardianDaysAdapter(db) {
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
