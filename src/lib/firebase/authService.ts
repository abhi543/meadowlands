// ============================================================================
// AUTHENTICATION & ACCOUNT ELEVATION SERVICE
// ============================================================================

import {
  signInAnonymously,
  linkWithPopup,
  signInWithPopup,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, googleProvider } from './config';
import type { StudioUserProfile } from './types';

export const CURRENT_GAME_ID = 'the_meadows';

export type AuthStateCallback = (user: User | null, profile: StudioUserProfile | null) => void;

/**
 * Initializes the automatic silent authentication observer.
 * If no active session exists, silently triggers anonymous authentication.
 */
export function initializeAuthObserver(callback: AuthStateCallback): () => void {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Trigger silent frictionless guest sign-in
      try {
        const cred = await signInAnonymously(auth);
        const profile = await syncUserProfile(cred.user, CURRENT_GAME_ID);
        callback(cred.user, profile);
      } catch (err) {
        console.warn('[Firebase Auth] Anonymous sign-in fallback:', err);
        callback(null, null);
      }
      return;
    }

    // Existing user (anonymous or elevated)
    try {
      const profile = await syncUserProfile(user, CURRENT_GAME_ID);
      callback(user, profile);
    } catch (err) {
      console.warn('[Firebase Auth] Failed to load user profile:', err);
      callback(user, null);
    }
  });
}

/**
 * Ensures a global StudioUserProfile exists in Firestore, registering CURRENT_GAME_ID.
 */
export async function syncUserProfile(user: User, gameId: string): Promise<StudioUserProfile> {
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const now = Date.now();
  const fallbackGuestName = `Guest_${user.uid.slice(0, 5)}`;
  if (!snap.exists()) {
    const newProfile: StudioUserProfile = {
      uid: user.uid,
      displayName: user.displayName || fallbackGuestName,
      email: user.email || null,
      isAnonymous: user.isAnonymous,
      createdAt: now,
      lastActiveAt: now,
      registeredGames: [gameId],
    };
    await setDoc(userRef, {
      ...newProfile,
      serverCreatedAt: serverTimestamp(),
      serverLastActiveAt: serverTimestamp(),
    });
    return newProfile;
  }

  const existing = snap.data() as StudioUserProfile;
  const updates: Partial<StudioUserProfile> & Record<string, any> = {
    lastActiveAt: now,
    serverLastActiveAt: serverTimestamp(),
    isAnonymous: user.isAnonymous,
  };

  if (user.email && existing.email !== user.email) {
    updates.email = user.email;
  }
  if (user.displayName && existing.displayName !== user.displayName) {
    updates.displayName = user.displayName;
  }
  if (!existing.registeredGames?.includes(gameId)) {
    updates.registeredGames = arrayUnion(gameId);
  }

  await updateDoc(userRef, updates);
  return {
    ...existing,
    ...updates,
    registeredGames: Array.from(new Set([...(existing.registeredGames || []), gameId])),
  };
}

export interface LinkResult {
  success: boolean;
  user?: User;
  profile?: StudioUserProfile;
  error?: 'already_in_use' | 'popup_closed' | 'unknown';
  errorMessage?: string;
}

/**
 * Elevates an anonymous player by linking their active session to Google Sign-In.
 * Preserves the internal UID so game save keys '[game_name]_[player_auth_id]' stay matched.
 */
export async function linkCurrentGuestToGoogle(): Promise<LinkResult> {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, error: 'unknown', errorMessage: 'No active user session found.' };
  }

  try {
    const cred = await linkWithPopup(currentUser, googleProvider);
    const elevatedUser = cred.user;
    const profile = await syncUserProfile(elevatedUser, CURRENT_GAME_ID);
    return { success: true, user: elevatedUser, profile };
  } catch (err: any) {
    if (err?.code === 'auth/credential-already-in-use') {
      return {
        success: false,
        error: 'already_in_use',
        errorMessage: 'This Google account is already linked to another Meadowlands profile.',
      };
    }
    if (err?.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'popup_closed', errorMessage: 'Sign-in window closed by user.' };
    }
    return {
      success: false,
      error: 'unknown',
      errorMessage: err?.message || 'Failed to elevate guest account.',
    };
  }
}

/**
 * Switches profile to an existing Google account if linking failed due to credential already in use.
 */
export async function switchToGoogleAccount(): Promise<LinkResult> {
  const auth = getFirebaseAuth();
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const profile = await syncUserProfile(cred.user, CURRENT_GAME_ID);
    return { success: true, user: cred.user, profile };
  } catch (err: any) {
    return {
      success: false,
      error: 'unknown',
      errorMessage: err?.message || 'Failed to switch Google account.',
    };
  }
}

/**
 * Updates the player's custom display handle across Firebase Auth & Firestore profile.
 */
export async function updatePlayerDisplayName(newName: string): Promise<{ success: boolean; error?: string }> {
  const trimmed = newName.trim();
  if (!trimmed || trimmed.length < 2) {
    return { success: false, error: 'Name must be at least 2 characters long.' };
  }
  if (trimmed.length > 24) {
    return { success: false, error: 'Name cannot exceed 24 characters.' };
  }

  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'No active user session found.' };
  }

  try {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      displayName: trimmed,
      lastActiveAt: Date.now(),
      serverLastActiveAt: serverTimestamp(),
    });

    // Also cache locally in localStorage for instant offline access
    if (typeof window !== 'undefined') {
      localStorage.setItem('meadowlands_player_handle', trimmed);
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[Firebase Auth] Failed to update display name:', err);
    return { success: false, error: err?.message || 'Failed to update name.' };
  }
}

