import { get, set, del } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';

export const SAVE_KEY = 'meadowlands-save';

/**
 * Robust IndexedDB storage adapter for Zustand persist.
 * Automatically migrates existing localStorage progress to IndexedDB on first load
 * to guarantee no user farm progress is ever lost.
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return null;
    }

    try {
      const val = await get<string>(name);
      if (val !== undefined && val !== null) {
        return val;
      }

      // Seamless migration from localStorage fallback
      const localVal = localStorage.getItem(name);
      if (localVal) {
        try {
          await set(name, localVal);
          console.info('[IndexedDB] Successfully migrated save from localStorage to IndexedDB.');
        } catch (e) {
          console.warn('[IndexedDB] Failed saving migrated save to IndexedDB:', e);
        }
        return localVal;
      }
      return null;
    } catch (err) {
      console.warn('[IndexedDB] Error reading save, falling back to localStorage:', err);
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    try {
      await set(name, value);
    } catch (err) {
      console.warn('[IndexedDB] Error writing save, falling back to localStorage:', err);
      try {
        localStorage.setItem(name, value);
      } catch {}
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return;
    }

    try {
      await del(name);
    } catch (err) {
      console.warn('[IndexedDB] Error deleting save from IndexedDB:', err);
    }
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

/**
 * Request browser storage persistence so the browser never evicts
 * IndexedDB farm data during low-disk memory cleanups.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (isPersisted) return true;
      return await navigator.storage.persist();
    } catch (e) {
      console.warn('[Storage] Persistent storage request error:', e);
    }
  }
  return false;
}

/**
 * Retrieve raw saved JSON string for inspection.
 */
export async function getRawSaveData(key = SAVE_KEY): Promise<string | null> {
  try {
    const idbVal = await get<string>(key);
    if (idbVal) return idbVal;
  } catch {}

  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) || null;
  }
  return null;
}
