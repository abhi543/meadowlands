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
 * Retrieve raw saved JSON string for export or inspection.
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

/**
 * Triggers a browser file download of the full game state.
 */
export function downloadBackupFile(jsonString: string, filename?: string): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const name = filename || `meadowlands-backup-${dateStr}.json`;
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an imported backup JSON string, writing it directly into IndexedDB.
 */
export async function importBackupString(
  jsonString: string,
  key = SAVE_KEY
): Promise<{ success: boolean; error?: string; state?: any }> {
  try {
    const parsed = JSON.parse(jsonString);
    const stateObj = parsed.state || parsed;

    // Sanity check: must resemble a Meadowlands GameState
    if (
      typeof stateObj !== 'object' ||
      stateObj === null ||
      (stateObj.coins === undefined && stateObj.level === undefined && stateObj.plots === undefined)
    ) {
      return { success: false, error: 'File is not a valid Meadowlands backup JSON.' };
    }

    const payload = parsed.state ? parsed : { state: stateObj, version: 0 };
    const stringified = JSON.stringify(payload);

    await set(key, stringified);
    return { success: true, state: stateObj };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Invalid JSON format in backup file.' };
  }
}
