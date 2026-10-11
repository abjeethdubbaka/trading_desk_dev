/**
 * Firebase configuration sourced from environment variables.
 */

function pickConfigValue(envValue) {
  const env = typeof envValue === 'string' ? envValue.trim() : envValue;
  return env || '';
}

// Optional chaining on import.meta.env: Vite always injects an object there,
// but it's undefined under plain Node (e.g. the node:test suite), which
// otherwise throws at import time for anything transitively pulling this in.
const firebaseConfig = {
  apiKey: pickConfigValue(import.meta.env?.VITE_FIREBASE_API_KEY),
  authDomain: pickConfigValue(import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: pickConfigValue(import.meta.env?.VITE_FIREBASE_PROJECT_ID),
  storageBucket: pickConfigValue(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: pickConfigValue(import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: pickConfigValue(import.meta.env?.VITE_FIREBASE_APP_ID),
  measurementId: pickConfigValue(import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID),
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

export { firebaseConfig };
