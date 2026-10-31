// ============================================================================
// FIREBASE CLIENT INITIALIZATION & CONFIGURATION
// Supports environment variables with graceful fallback for offline/development
// ============================================================================

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoFallbackKeyForClientInit9988',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'meadowlands-studio.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'meadowlands-studio',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'meadowlands-studio.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1029384756:web:abcdef1234567890',
};

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  return getAuth(app);
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let firestoreInstance: Firestore | null = null;

export function getFirebaseDb(): Firestore {
  if (firestoreInstance) return firestoreInstance;
  const app = getFirebaseApp();

  try {
    // Enable client persistent offline caching so pending writes queue automatically
    firestoreInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Fallback if already initialized in this runtime
    firestoreInstance = getFirestore(app);
  }

  return firestoreInstance;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}
