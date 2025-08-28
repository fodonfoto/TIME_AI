import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration - handle both client-side (Vite) and server-side (Node.js)
const getEnvVar = (key) => {
  // Check if running in Vite environment (client-side)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  // Fallback to process.env for Node.js (server-side)
  return process.env[key];
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

let app, db, auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Configure auth settings to reduce COOP policy issues
  auth.settings = {
    appVerificationDisabledForTesting: import.meta.env.DEV
  };
  
  // Export to global scope for debugging and external access
  if (typeof window !== 'undefined') {
    window.auth = auth;
    window.db = db;
    window.firebase = { auth: () => auth, firestore: () => db };
  }
  
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  throw error; // Re-throw to prevent app from starting with broken Firebase
}

export { auth, db };
export default app;