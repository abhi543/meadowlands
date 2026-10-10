'use client';

import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useGameStore, GameState } from '@/game/store';
import { useAuthStore } from '@/store/useAuthStore';

export interface SaveSnapshot {
  level: number;
  xp: number;
  coins: number;
  gems: number;
  timestamp: number;
  payload: any;
}

export interface ConflictData {
  isOpen: boolean;
  localSave: SaveSnapshot;
  cloudSave: SaveSnapshot;
}

// Store to control SaveConflictModal visibility and options
export const useConflictStore = create<{
  conflict: ConflictData | null;
  openConflict: (localSave: SaveSnapshot, cloudSave: SaveSnapshot) => void;
  closeConflict: () => void;
  resolveChoice: (choice: 'local' | 'cloud') => void;
}>((set, get) => ({
  conflict: null,
  openConflict: (localSave, cloudSave) => {
    set({ conflict: { isOpen: true, localSave, cloudSave } });
  },
  closeConflict: () => set({ conflict: null }),
  resolveChoice: (choice) => {
    const data = get().conflict;
    if (!data) return;

    if (choice === 'cloud') {
      useGameStore.getState().loadCloudSave(data.cloudSave.payload);
    } else {
      // Keep local, mark dirty so it overwrites cloud on next sync
      useGameStore.getState().markDirty();
      flushSaveImmediately();
    }

    set({ conflict: null });
  },
}));

const SYNC_INTERVAL_MS = 150_000; // Strictly 2.5 minutes (150 seconds)

let syncIntervalTimer: ReturnType<typeof setInterval> | null = null;
let lastBlurTimestamp: number = Date.now();

/** Prepare a clean JSON payload of current Zustand state */
export function extractSavePayload(state: GameState) {
  return {
    coins: state.coins,
    gems: state.gems,
    xp: state.xp,
    level: state.level,
    silo: state.silo,
    barn: state.barn,
    plots: state.plots,
    unlockedPlots: state.unlockedPlots,
    animals: state.animals,
    animalCapacity: state.animalCapacity,
    productionQueues: state.productionQueues,
    orders: state.orders,
    farmhands: state.farmhands,
    codex: state.codex,
    fishery: state.fishery,
    autonomousWorkers: state.autonomousWorkers,
    unifiedWorkers: state.unifiedWorkers,
    activeEvent: state.activeEvent,
    lastEventTriggerTime: state.lastEventTriggerTime,
    notifications: state.notifications,
    breedingSlots: state.breedingSlots,
    activeBreedings: state.activeBreedings,
    wilderness: state.wilderness,
    habitatUpgradeSteps: state.habitatUpgradeSteps,
    parcels: state.parcels,
    activeFreightContract: state.activeFreightContract,
    freightContractRefreshAt: state.freightContractRefreshAt,
    currentEstateAura: state.currentEstateAura,
    isGuest: state.isGuest,
    relics: state.relics,
    systemicEvent: state.systemicEvent,
    systemicEventCooldowns: state.systemicEventCooldowns,
    lastSystemicEventCompletedAt: state.lastSystemicEventCompletedAt,
  };
}

/** Push current local state immediately to Supabase */
export async function flushSaveImmediately(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const authUser = useAuthStore.getState().user;
  if (!authUser) return false;

  const gameState = useGameStore.getState();
  const now = Date.now();
  const payload = extractSavePayload(gameState);

  try {
    const { error } = await supabase
      .from('farm_saves')
      .upsert({
        user_id: authUser.id,
        schema_version: 1,
        save_payload: payload,
        client_timestamp: now,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;

    gameState.markClean();
    return true;
  } catch (err: any) {
    console.error('Failed to flush save to Supabase:', err?.message || err);
    return false;
  }
}

/** Fetch remote cloud save and compare with local progress on login */
export async function checkCloudSaveOnLogin(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const authUser = useAuthStore.getState().user;
  if (!authUser) return;

  try {
    const { data, error } = await supabase
      .from('farm_saves')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (error) throw error;

    const gameState = useGameStore.getState();

    // If no remote save exists yet, push the current local game state immediately
    if (!data || !data.save_payload) {
      await flushSaveImmediately();
      return;
    }

    const remotePayload = data.save_payload as Partial<GameState>;
    const remoteLevel = remotePayload.level ?? 1;
    const remoteXp = remotePayload.xp ?? 0;
    const remoteCoins = remotePayload.coins ?? 0;
    const remoteGems = remotePayload.gems ?? 0;
    const remoteTime = Number(data.client_timestamp || Date.now());

    const localLevel = gameState.level;
    const localXp = gameState.xp;
    const localCoins = gameState.coins;
    const localGems = gameState.gems;
    const localTime = gameState.lastTick;

    const isDifferent =
      remoteLevel !== localLevel ||
      Math.abs(remoteCoins - localCoins) > 100 ||
      Math.abs(remoteGems - localGems) > 5;

    if (isDifferent) {
      // Significant difference detected: Prompt conflict resolution modal
      const localSnapshot: SaveSnapshot = {
        level: localLevel,
        xp: localXp,
        coins: localCoins,
        gems: localGems,
        timestamp: localTime,
        payload: extractSavePayload(gameState),
      };

      const cloudSnapshot: SaveSnapshot = {
        level: remoteLevel,
        xp: remoteXp,
        coins: remoteCoins,
        gems: remoteGems,
        timestamp: remoteTime,
        payload: remotePayload,
      };

      useConflictStore.getState().openConflict(localSnapshot, cloudSnapshot);
    } else {
      // Seamlessly hydrate if identical or close
      if (remoteLevel > localLevel) {
        gameState.loadCloudSave(remotePayload);
      }
    }
  } catch (err: any) {
    console.warn('Could not verify remote save on login:', err?.message || err);
  }
}

/** Initialize sync loops and window lifecycle listeners */
export function initSyncManager(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Periodic 2.5-minute Sync Loop (Throttled by isDirty)
  syncIntervalTimer = setInterval(async () => {
    const gameState = useGameStore.getState();
    const authState = useAuthStore.getState();

    // If user is not authenticated or local state is not dirty, skip network call entirely!
    if (!authState.user || !gameState.isDirty) {
      return;
    }

    await flushSaveImmediately();
  }, SYNC_INTERVAL_MS);

  // 2. Anti-Throttling Timestamp Delta Engine (Tab Focus / Blur)
  const handleFocus = () => {
    const now = Date.now();
    const elapsed = now - lastBlurTimestamp;
    if (elapsed > 3000) {
      // Fast-forward offline timers deterministically
      useGameStore.getState().fastForwardOfflineTime(elapsed);
    }
    lastBlurTimestamp = now;
  };

  const handleBlur = () => {
    lastBlurTimestamp = Date.now();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      lastBlurTimestamp = Date.now();
      // Urgent flush when player switches away from tab
      if (useGameStore.getState().isDirty && useAuthStore.getState().user) {
        flushSaveImmediately();
      }
    } else if (document.visibilityState === 'visible') {
      handleFocus();
    }
  };

  // 3. Forced Flush on Page Exit (beforeunload)
  const handleBeforeUnload = () => {
    const gameState = useGameStore.getState();
    const authUser = useAuthStore.getState().user;

    if (!gameState.isDirty || !authUser || !isSupabaseConfigured()) {
      return;
    }

    // Try urgent Supabase upsert
    flushSaveImmediately();
  };

  // 4. Reactive State Change Observer (Marks isDirty on gameplay progress)
  let prevSnapshot = {
    coins: useGameStore.getState().coins,
    gems: useGameStore.getState().gems,
    xp: useGameStore.getState().xp,
    level: useGameStore.getState().level,
    plots: useGameStore.getState().plots,
    animals: useGameStore.getState().animals,
    barn: useGameStore.getState().barn,
    silo: useGameStore.getState().silo,
    orders: useGameStore.getState().orders,
    farmhands: useGameStore.getState().farmhands,
    fishery: useGameStore.getState().fishery,
    productionQueues: useGameStore.getState().productionQueues,
  };

  const unsubscribeStore = useGameStore.subscribe((state) => {
    if (state.isDirty) {
      prevSnapshot = {
        coins: state.coins,
        gems: state.gems,
        xp: state.xp,
        level: state.level,
        plots: state.plots,
        animals: state.animals,
        barn: state.barn,
        silo: state.silo,
        orders: state.orders,
        farmhands: state.farmhands,
        fishery: state.fishery,
        productionQueues: state.productionQueues,
      };
      return;
    }

    if (
      state.coins !== prevSnapshot.coins ||
      state.gems !== prevSnapshot.gems ||
      state.xp !== prevSnapshot.xp ||
      state.level !== prevSnapshot.level ||
      state.plots !== prevSnapshot.plots ||
      state.animals !== prevSnapshot.animals ||
      state.barn !== prevSnapshot.barn ||
      state.silo !== prevSnapshot.silo ||
      state.orders !== prevSnapshot.orders ||
      state.farmhands !== prevSnapshot.farmhands ||
      state.fishery !== prevSnapshot.fishery ||
      state.productionQueues !== prevSnapshot.productionQueues
    ) {
      prevSnapshot = {
        coins: state.coins,
        gems: state.gems,
        xp: state.xp,
        level: state.level,
        plots: state.plots,
        animals: state.animals,
        barn: state.barn,
        silo: state.silo,
        orders: state.orders,
        farmhands: state.farmhands,
        fishery: state.fishery,
        productionQueues: state.productionQueues,
      };
      useGameStore.setState({ isDirty: true });
    }
  });

  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return teardown function
  return () => {
    if (syncIntervalTimer) clearInterval(syncIntervalTimer);
    unsubscribeStore();
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}
