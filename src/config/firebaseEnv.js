/**
 * Firebase configuration sourced from environment variables.
 */

import { firebaseConfig as fileFirebaseConfig } from './firebase.js';

function pickConfigValue(envValue, fileValue) {
  const env = typeof envValue === 'string' ? envValue.trim() : envValue;
  const file = typeof fileValue === 'string' ? fileValue.trim() : fileValue;
  return env || file || '';
}

const firebaseConfig = {
  apiKey: pickConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, fileFirebaseConfig?.apiKey),
  authDomain: pickConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, fileFirebaseConfig?.authDomain),
  projectId: pickConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, fileFirebaseConfig?.projectId),
  storageBucket: pickConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, fileFirebaseConfig?.storageBucket),
  messagingSenderId: pickConfigValue(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    fileFirebaseConfig?.messagingSenderId
  ),
  appId: pickConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, fileFirebaseConfig?.appId),
  measurementId: pickConfigValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, fileFirebaseConfig?.measurementId),
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

if (typeof window !== 'undefined' && !isFirebaseConfigured()) {
  console.warn(
    '[Firebase] Missing configuration. Set VITE_FIREBASE_* in .env.local or provide src/config/firebase.js'
  );
}

export { firebaseConfig };
