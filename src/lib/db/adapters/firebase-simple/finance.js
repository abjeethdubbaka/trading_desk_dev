import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where,
} from 'firebase/firestore';
import { addCreateTimestamps, addUpdateTimestamp } from './utils.js';

export function createFinanceAdapter(db) {
  const expenses = {
    async list() {
      const q = query(collection(db, 'finance_expenses'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async create(data) {
      const clean = addCreateTimestamps({ ...data });
      const ref = await addDoc(collection(db, 'finance_expenses'), clean);
      return { ...clean, id: ref.id };
    },
    async update(id, data) {
      const clean = addUpdateTimestamp({ ...data });
      await updateDoc(doc(db, 'finance_expenses', id), clean);
      const snap = await getDoc(doc(db, 'finance_expenses', id));
      return { ...snap.data(), id: snap.id };
    },
    async delete(id) {
      await deleteDoc(doc(db, 'finance_expenses', id));
      return true;
    },
  };

  const netWorth = {
    async list() {
      const q = query(collection(db, 'finance_net_worth'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async create(data) {
      const clean = addCreateTimestamps({ ...data });
      const ref = await addDoc(collection(db, 'finance_net_worth'), clean);
      return { ...clean, id: ref.id };
    },
    async update(id, data) {
      const clean = addUpdateTimestamp({ ...data });
      await updateDoc(doc(db, 'finance_net_worth', id), clean);
      const snap = await getDoc(doc(db, 'finance_net_worth', id));
      return { ...snap.data(), id: snap.id };
    },
    async delete(id) {
      await deleteDoc(doc(db, 'finance_net_worth', id));
      return true;
    },
  };

  const holdings = {
    async list() {
      const q = query(collection(db, 'finance_holdings'), orderBy('created_date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async create(data) {
      const clean = addCreateTimestamps({ ...data });
      const ref = await addDoc(collection(db, 'finance_holdings'), clean);
      return { ...clean, id: ref.id };
    },
    async update(id, data) {
      const clean = addUpdateTimestamp({ ...data });
      await updateDoc(doc(db, 'finance_holdings', id), clean);
      const snap = await getDoc(doc(db, 'finance_holdings', id));
      return { ...snap.data(), id: snap.id };
    },
    async delete(id) {
      await deleteDoc(doc(db, 'finance_holdings', id));
      return true;
    },
  };

  const budget = {
    async list() {
      const snap = await getDocs(collection(db, 'finance_budget'));
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async upsert(data) {
      const q = query(
        collection(db, 'finance_budget'),
        where('year', '==', data.year),
        where('month', '==', data.month),
        where('category', '==', data.category),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const ref = snap.docs[0].ref;
        await updateDoc(ref, addUpdateTimestamp({ limit: data.limit }));
        const updated = await getDoc(ref);
        return { ...updated.data(), id: updated.id };
      }
      const clean = addCreateTimestamps(data);
      const ref = await addDoc(collection(db, 'finance_budget'), clean);
      return { ...clean, id: ref.id };
    },
    async delete(id) {
      await deleteDoc(doc(db, 'finance_budget', id));
      return true;
    },
  };

  const income = {
    async list() {
      const q = query(collection(db, 'finance_income'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async create(data) {
      const clean = addCreateTimestamps({ ...data });
      const ref = await addDoc(collection(db, 'finance_income'), clean);
      return { ...clean, id: ref.id };
    },
    async update(id, data) {
      const clean = addUpdateTimestamp({ ...data });
      await updateDoc(doc(db, 'finance_income', id), clean);
      const snap = await getDoc(doc(db, 'finance_income', id));
      return { ...snap.data(), id: snap.id };
    },
    async delete(id) {
      await deleteDoc(doc(db, 'finance_income', id));
      return true;
    },
  };

  const savingsGoals = {
    async list() {
      const snap = await getDocs(collection(db, 'finance_savings_goals'));
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async create(data) {
      const clean = addCreateTimestamps({ ...data });
      const ref = await addDoc(collection(db, 'finance_savings_goals'), clean);
      return { ...clean, id: ref.id };
    },
    async update(id, data) {
      const clean = addUpdateTimestamp({ ...data });
      await updateDoc(doc(db, 'finance_savings_goals', id), clean);
      const snap = await getDoc(doc(db, 'finance_savings_goals', id));
      return { ...snap.data(), id: snap.id };
    },
    async delete(id) {
      await deleteDoc(doc(db, 'finance_savings_goals', id));
      return true;
    },
  };

  const savingsContributions = {
    async list() {
      const q = query(collection(db, 'finance_savings_contributions'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    },
    async create(data) {
      const clean = addCreateTimestamps({ ...data });
      const ref = await addDoc(collection(db, 'finance_savings_contributions'), clean);
      return { ...clean, id: ref.id };
    },
    async delete(id) {
      await deleteDoc(doc(db, 'finance_savings_contributions', id));
      return true;
    },
  };

  return { expenses, netWorth, holdings, budget, income, savingsGoals, savingsContributions };
}
