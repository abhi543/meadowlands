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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBRvmzfU52is8UAcx1n9KcRZV-YTxGaSzQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "meadowlands-64696.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "meadowlands-64696",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "meadowlands-64696.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "900016364212",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:900016364212:web:475a83a17d3483ad32d5e1",
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
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes('FallbackKey')
  );
}

