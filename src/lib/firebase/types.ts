// ============================================================================
// GLOBAL IDENTITY & PARTITIONED SAVE TYPES
// ============================================================================

export interface StudioUserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: number;
  lastActiveAt: number;
  registeredGames: string[];
}

export interface PartitionedGameSave<T = any> {
  userId: string;
  gameId: string;
  schemaVersion: number;
  updatedAt: number;
  state: T;
  clientMetadata?: {
    level: number;
    coins: number;
    gems: number;
    playtimeSeconds?: number;
    platform?: string;
  };
}

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export interface CloudSyncTelemetry {
  status: SyncStatus;
  lastSyncedAt: number | null;
  errorMessage: string | null;
  pendingChanges: boolean;
  isGuest: boolean;
  userId: string | null;
  userEmail: string | null;
  displayName: string | null;
}

