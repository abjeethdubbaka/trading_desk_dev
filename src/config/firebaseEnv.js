/**
 * Firebase configuration sourced from environment variables.
 */

function pickConfigValue(envValue) {
  const env = typeof envValue === 'string' ? envValue.trim() : envValue;
  return env || '';
}

const firebaseConfig = {
  apiKey: pickConfigValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: pickConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: pickConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: pickConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: pickConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: pickConfigValue(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: pickConfigValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
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
    '[Firebase] Missing configuration. Set VITE_FIREBASE_* in .env.local'
  );
}

export { firebaseConfig };
