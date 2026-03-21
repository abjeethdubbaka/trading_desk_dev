/**
 * @file src/lib/db/adapters/firebase.js
 *
 * Firebase / Firestore adapter.
 * Implements the same interface as localStorage.js — swap with one line in db/index.js.
 *
 * ── SETUP ────────────────────────────────────────────────────────────────────
 * 1. npm install firebase
 * 2. Create a project at https://console.firebase.google.com
 * 3. Enable Firestore (Native mode) + Authentication (Email/Google)
 * 4. Add to .env:
 *      VITE_FIREBASE_API_KEY=...
 *      VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
 *      VITE_FIREBASE_PROJECT_ID=your-app
 *      VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
 *      VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *      VITE_FIREBASE_APP_ID=...
 * 5. In db/index.js change the import to firebaseAdapter (already done for you)
 *
 * ── FIRESTORE COLLECTIONS ────────────────────────────────────────────────────
 *  users/{uid}/trades/{tradeId}
 *  users/{uid}/settings/main
 *  users/{uid}/calcHistory/{itemId}
 *  users/{uid}/watchlist/{itemId}
 *  users/{uid}/dosAndDonts/main        ← single doc, array stored in "items"
 *  users/{uid}/knowledgeBase/main
 *  users/{uid}/learning/progress
 *
 * ── FIRESTORE RULES (paste into Firebase console) ────────────────────────────
 *  rules_version = '2';
 *  service cloud.firestore {
 *    match /databases/{database}/documents {
 *      match /users/{userId}/{document=**} {
 *        allow read, write: if request.auth != null && request.auth.uid == userId;
 *      }
 *    }
 *  }
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection, doc,
  getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fsLimit, startAfter,
  serverTimestamp, writeBatch, Timestamp,
} from 'firebase/firestore';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { sanitizeForStorage, withDefaults, TRADE_DEFAULTS } from '../schema.js';
import { firebaseConfig } from '@/config/firebase.js';

// ─── Firebase init ────────────────────────────────────────────────────────────

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db   = getFirestore(app);
export const auth = getAuth(app);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/** Returns current user or throws if not signed in. */
function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated. Sign in first.');
  return user;
}

/** Base collection path: users/{uid}/{sub} */
function userCol(sub) {
  const { uid } = requireUser();
  return collection(db, 'users', uid, sub);
}

/** Base document path: users/{uid}/{sub}/{docId} */
function userDoc(sub, docId) {
  const { uid } = requireUser();
  return doc(db, 'users', uid, sub, docId);
}

/** Convert Firestore doc snapshot → plain object with id. */
function fromDoc(snap) {
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...snap.data() };
  console.log('🔥 Firebase READ:', { collection: snap.ref.path, data });
  return data;
}

/** Strip undefined & convert Date → ISO string for consistency. */
function prepareWrite(data) {
  const clean = sanitizeForStorage(data);
  // Remove undefined keys entirely (Firestore rejects them)
  const result = Object.fromEntries(
    Object.entries(clean).filter(([, v]) => v !== undefined)
  );
  console.log('🔥 Firebase PREPARE WRITE:', result);
  return result;
}

/** Broadcast DOM event so React Query can invalidate. */
function broadcast(channel, detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(channel, { detail }));
  }
}

// ─── Auth public API ──────────────────────────────────────────────────────────

export const firebaseAuth = {
  getCurrentUser: ()                  => auth.currentUser,
  onAuthChange:   (cb)                => onAuthStateChanged(auth, cb),
  signInEmail:    (email, password)   => signInWithEmailAndPassword(auth, email, password),
  signUpEmail:    (email, password)   => createUserWithEmailAndPassword(auth, email, password),
  signInGoogle:   ()                  => signInWithPopup(auth, new GoogleAuthProvider()),
  signOut:        ()                  => firebaseSignOut(auth),
};

// ─── Trades ──────────────────────────────────────────────────────────────────

const trades = {
  async list(options = {}) {
    console.log('🔥 Firebase LIST TRADES with options:', options);
    let q = query(userCol('trades'));

    // Filters
    if (options.symbol)    q = query(q, where('symbol',    '==', options.symbol));
    if (options.direction) q = query(q, where('direction', '==', options.direction));

    // Sorting
    const sortKey = options.sortBy  ?? 'entry_time';
    const sortDir = options.sortDir ?? 'desc';
    q = query(q, orderBy(sortKey, sortDir));

    // Pagination
    if (options.limit)  q = query(q, fsLimit(options.limit));

    const snap = await getDocs(q);
    let results = snap.docs.map(fromDoc);
    console.log('🔥 Firebase LIST RESULTS:', { count: results.length, trades: results });

    // Client-side date range filter (Firestore requires composite index for combined queries)
    if (options.from) {
      const from = new Date(options.from);
      results = results.filter(t => new Date(t.entry_time ?? t.created_date) >= from);
    }
    if (options.to) {
      const to = new Date(options.to);
      results = results.filter(t => new Date(t.entry_time ?? t.created_date) <= to);
    }

    return results;
  },

  async get(id) {
    const snap = await getDoc(userDoc('trades', id));
    return fromDoc(snap);
  },

  async create(data) {
    const payload = prepareWrite({
      ...withDefaults(TRADE_DEFAULTS, data),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    });
    console.log('🔥 Firebase CREATE TRADE:', payload);
    const ref    = await addDoc(userCol('trades'), payload);
    const record = { id: ref.id, ...payload };
    console.log('🔥 Firebase CREATE RESULT:', record);
    broadcast('trades-updated', { action: 'create', trade: record });
    return record;
  },

  async update(id, data) {
    const ref     = userDoc('trades', id);
    const payload = prepareWrite({ ...data, updated_date: new Date().toISOString() });
    await updateDoc(ref, payload);
    const snap    = await getDoc(ref);
    const record  = fromDoc(snap);
    broadcast('trades-updated', { action: 'update', trade: record });
    return record;
  },

  async delete(id) {
    await deleteDoc(userDoc('trades', id));
    broadcast('trades-updated', { action: 'delete', id });
    return { id };
  },

  async bulkCreate(rows) {
    const batch   = writeBatch(db);
    const { uid } = requireUser();
    const records = [];

    for (const data of rows) {
      const ref     = doc(collection(db, 'users', uid, 'trades'));
      const payload = prepareWrite({
        ...withDefaults(TRADE_DEFAULTS, data),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });
      batch.set(ref, payload);
      records.push({ id: ref.id, ...payload });
    }

    await batch.commit();
    broadcast('trades-updated', { action: 'bulk-create', count: records.length });
    return records;
  },

  async clear() {
    const snap  = await getDocs(userCol('trades'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    broadcast('trades-updated', { action: 'clear' });
  },
};

// ─── Settings ─────────────────────────────────────────────────────────────────

const settings = {
  async get() {
    const snap = await getDoc(userDoc('settings', 'main'));
    return fromDoc(snap);
  },

  async save(data) {
    const ref     = userDoc('settings', 'main');
    const payload = prepareWrite({ ...data, updated_date: new Date().toISOString() });
    await setDoc(ref, payload, { merge: true });
    return { id: 'main', ...payload };
  },

  async reset() {
    await deleteDoc(userDoc('settings', 'main'));
  },
};

// ─── Calculation History ──────────────────────────────────────────────────────

const calcHistory = {
  async list() {
    const q    = query(userCol('calcHistory'), orderBy('timestamp', 'desc'), fsLimit(100));
    const snap = await getDocs(q);
    return snap.docs.map(fromDoc);
  },

  async add(item) {
    const payload = prepareWrite({ ...item, timestamp: item.timestamp ?? new Date().toISOString() });
    const ref     = await addDoc(userCol('calcHistory'), payload);
    return { id: ref.id, ...payload };
  },

  async delete(id) {
    await deleteDoc(userDoc('calcHistory', id));
  },

  async clear() {
    const snap  = await getDocs(userCol('calcHistory'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },
};

// ─── Watchlist ────────────────────────────────────────────────────────────────

const watchlist = {
  async list() {
    const q    = query(userCol('watchlist'), orderBy('created_date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(fromDoc);
  },

  async create(data) {
    const payload = prepareWrite({ ...data, created_date: new Date().toISOString() });
    const ref     = await addDoc(userCol('watchlist'), payload);
    return { id: ref.id, ...payload };
  },

  async update(id, data) {
    const ref = userDoc('watchlist', id);
    await updateDoc(ref, prepareWrite(data));
    const snap = await getDoc(ref);
    return fromDoc(snap);
  },

  async delete(id) {
    await deleteDoc(userDoc('watchlist', id));
    return { id };
  },
};

// ─── Generic single-doc stores (dos/donts, knowledge base, learning) ─────────

function makeSingleDocStore(sub, field = 'items') {
  return {
    async list() {
      const snap = await getDoc(userDoc(sub, 'main'));
      if (!snap.exists()) return [];
      return snap.data()[field] ?? [];
    },

    async save(data) {
      const ref = userDoc(sub, 'main');
      await setDoc(ref, { [field]: data, updated_date: new Date().toISOString() }, { merge: true });
      return data;
    },

    async clear() {
      await deleteDoc(userDoc(sub, 'main'));
    },
  };
}

// ─── Export ──────────────────────────────────────────────────────────────────

export const firebaseAdapter = {
  name: 'firebase',
  trades,
  settings,
  calcHistory,
  watchlist,
  dosAndDonts:   makeSingleDocStore('dosAndDonts',   'items'),
  knowledgeBase: makeSingleDocStore('knowledgeBase',  'entries'),
  learning:      makeSingleDocStore('learning',       'progress'),
};
