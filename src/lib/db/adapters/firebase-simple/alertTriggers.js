/**
 * @file src/lib/db/adapters/firebase-simple/alertTriggers.js
 *
 * Trade Terminal's alert triggers as Trading Guardian read them, one
 * document per trigger. The document id is the trigger's own id (date, time,
 * symbol, direction, price), so reading the same alert again rewrites it
 * rather than adding a second.
 */

import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore/lite';
import { prepareWrite } from './utils.js';

const COLLECTION = 'alertTriggers';

export function createAlertTriggersAdapter(db) {
  return {
    async list() {
      const snap = await getDocs(collection(db, COLLECTION));
      return snap.docs.map((item) => ({ ...item.data(), id: item.id }));
    },

    async save(id, data) {
      await setDoc(doc(db, COLLECTION, id), prepareWrite(data));
      return { ...data, id };
    },

    async delete(id) {
      await deleteDoc(doc(db, COLLECTION, id));
      return { id };
    },
  };
}
