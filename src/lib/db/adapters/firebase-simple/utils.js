/**
 * @file src/lib/db/adapters/firebase-simple/utils.js
 *
 * Shared utility functions for Firebase Simple adapter.
 */

import { serverTimestamp } from 'firebase/firestore';

/** Convert Firestore doc snapshot → plain object with id. */
export function fromDoc(snap) {
  if (!snap.exists()) return null;
  const data = snap.data();
  
  // Convert Firestore timestamps to ISO strings
  const converted = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value.toISOString === 'function') {
      // Firestore Timestamp
      converted[key] = value.toISOString();
    } else {
      converted[key] = value;
    }
  }
  
  // Always prefer the Firestore document id over any stored `id` field.
  return { ...converted, id: snap.id };
}

/** Strip undefined & convert Date → ISO string for consistency. */
export function prepareWrite(data) {
  // Remove undefined keys entirely (Firestore rejects them)
  // Also strip client-provided `id` so doc ids remain source-of-truth.
  const result = Object.fromEntries(
    Object.entries(data).filter(([k, v]) => k !== 'id' && v !== undefined)
  );
  return result;
}

/** Broadcast DOM event so React Query can invalidate. */
export function broadcast(channel, detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(channel, { detail }));
  }
}

/** Add server timestamps to data for creation. */
export function addCreateTimestamps(data) {
  const clean = prepareWrite(data);
  clean.created_date = serverTimestamp();
  clean.updated_date = serverTimestamp();
  return clean;
}

/** Add update timestamp to data for updates. */
export function addUpdateTimestamp(data) {
  const clean = prepareWrite(data);
  clean.updated_date = serverTimestamp();
  return clean;
}

/** Merge partial data with defaults, stripping undefined values. */
export function withDefaults(defaults, data = {}) {
  return Object.fromEntries(
    Object.entries({ ...defaults, ...data }).filter(([, v]) => v !== undefined)
  );
}


