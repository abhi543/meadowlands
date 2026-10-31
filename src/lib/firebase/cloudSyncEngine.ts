// ============================================================================
// LOCAL-FIRST SAVE SYNCHRONIZATION ENGINE
// Tiered Storage: Layer 1 (In-Memory) -> Layer 2 (IndexedDB) -> Layer 3 (Firestore)
// Features: 45s Debounced Writes, Urgent Unload Flush, Conflict Resolution
// ============================================================================

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './config';
import { CURRENT_GAME_ID } from './authService';
import type { PartitionedGameSave, SyncStatus, CloudSyncTelemetry } from './types';

export const SAVE_SCHEMA_VERSION = 3;
const DEBOUNCE_INTERVAL_MS = 45000; // 45 seconds

export type TelemetryListener = (telemetry: CloudSyncTelemetry) => void;

class CloudSyncEngine {
  private activeUserId: string | null = null;
  private isGuest = true;
  private userEmail: string | null = null;
  private displayName: string | null = null;

  private syncStatus: SyncStatus = 'local';
  private lastSyncedAt: number | null = null;
  private errorMessage: string | null = null;

  private pendingPayload: any = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isSyncInProgress = false;

  private telemetryListeners: Set<TelemetryListener> = new Set();
  private hasInitializedUnloadListeners = false;

  constructor() {
    this.setupWindowListeners();
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    listener(this.getTelemetry());
    return () => this.telemetryListeners.delete(listener);
  }

  public getTelemetry(): CloudSyncTelemetry {
    return {
      status: this.syncStatus,
      lastSyncedAt: this.lastSyncedAt,
      errorMessage: this.errorMessage,
      pendingChanges: Boolean(this.pendingPayload),
      isGuest: this.isGuest,
      userId: this.activeUserId,
      userEmail: this.userEmail,
      displayName: this.displayName,
    };
  }

  private emitTelemetry() {
    const t = this.getTelemetry();
    for (const listener of this.telemetryListeners) {
      listener(t);
    }
  }

  public updateDisplayNameLocally(name: string) {
    this.displayName = name;
    this.emitTelemetry();
  }

  public setAuthenticatedUser(
    userId: string | null,
    isGuest: boolean,
    email: string | null = null,
    name: string | null = null
  ) {
    this.activeUserId = userId;
    this.isGuest = isGuest;
    this.userEmail = email;
    this.displayName = name;

    if (!userId) {
      this.syncStatus = 'local';
    } else if (this.syncStatus === 'error' && isFirebaseConfigured()) {
      this.syncStatus = 'local';
    }
    this.emitTelemetry();
  }

  /**
   * Generates composite key: [game_name]_[player_auth_id]
   */
  public getSaveDocId(userId: string, gameId = CURRENT_GAME_ID): string {
    return `${gameId}_${userId}`;
  }

  /**
   * Queue state change for 45-second debounced write
   */
  public queueDebouncedSave(statePayload: any) {
    this.pendingPayload = statePayload;
    this.emitTelemetry();

    if (!this.activeUserId || !isFirebaseConfigured()) {
      this.syncStatus = 'local';
      return;
    }

    if (!this.debounceTimer) {
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        this.flushImmediateSave();
      }, DEBOUNCE_INTERVAL_MS);
    }
  }

  /**
   * Forces an immediate cloud write (Urgent Save), bypassing debounce timer
   */
  public async flushImmediateSave(): Promise<boolean> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (!this.pendingPayload) {
      return true; // Nothing pending
    }

    if (!this.activeUserId || !isFirebaseConfigured()) {
      this.syncStatus = 'local';
      this.emitTelemetry();
      return false;
    }

    const payloadToSave = this.pendingPayload;
    const userId = this.activeUserId;
    const docId = this.getSaveDocId(userId, CURRENT_GAME_ID);

    this.isSyncInProgress = true;
    this.syncStatus = 'syncing';
    this.errorMessage = null;
    this.emitTelemetry();

    try {
      const db = getFirebaseDb();
      const saveRef = doc(db, 'game_saves', docId);

      const gameSaveDoc: PartitionedGameSave = {
        userId,
        gameId: CURRENT_GAME_ID,
        schemaVersion: SAVE_SCHEMA_VERSION,
        updatedAt: Date.now(),
        state: payloadToSave,
        clientMetadata: {
          level: payloadToSave.level || 1,
          coins: payloadToSave.coins || 0,
          gems: payloadToSave.gems || 0,
          playtimeSeconds: payloadToSave.playtimeSeconds || 0,
          platform: 'web',
        },
      };

      await setDoc(saveRef, {
        ...gameSaveDoc,
        serverUpdatedAt: serverTimestamp(),
      });

      // Clear pending payload if it hasn't mutated while writing
      if (this.pendingPayload === payloadToSave) {
        this.pendingPayload = null;
      }
      this.lastSyncedAt = Date.now();
      this.syncStatus = 'synced';
      this.isSyncInProgress = false;
      this.emitTelemetry();
      return true;
    } catch (err: any) {
      console.warn('[CloudSyncEngine] Cloud sync failed:', err);
      this.syncStatus = 'error';
      this.errorMessage = err?.message || 'Cloud write failed';
      this.isSyncInProgress = false;
      this.emitTelemetry();
      return false;
    }
  }

  /**
   * Loads the cloud save document if present.
   */
  public async fetchCloudSave(userId: string): Promise<PartitionedGameSave | null> {
    if (!isFirebaseConfigured()) return null;
    try {
      const db = getFirebaseDb();
      const docId = this.getSaveDocId(userId, CURRENT_GAME_ID);
      const snap = await getDoc(doc(db, 'game_saves', docId));
      if (!snap.exists()) return null;
      return snap.data() as PartitionedGameSave;
    } catch (err) {
      console.warn('[CloudSyncEngine] Failed to retrieve cloud save:', err);
      return null;
    }
  }

  private setupWindowListeners() {
    if (typeof window === 'undefined' || this.hasInitializedUnloadListeners) return;
    this.hasInitializedUnloadListeners = true;

    // Urgent flush on tab close / reload / navigation
    window.addEventListener('beforeunload', () => {
      if (this.pendingPayload) {
        this.flushImmediateSave();
      }
    });

    // Urgent flush when switching tabs or minimizing mobile browser
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.pendingPayload) {
        this.flushImmediateSave();
      }
    });
  }
}

export const cloudSyncEngine = new CloudSyncEngine();

