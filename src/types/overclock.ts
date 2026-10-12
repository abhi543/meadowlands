export type OverclockTier = 1 | 2 | 3;

export interface OverclockConfig {
  tier: OverclockTier;
  label: string;
  speedMultiplier: number;
  costCoins: number;
  burnoutChance: number; // 0.0 to 1.0
  bonusYield: number;
}

export interface ProductionUnitState {
  id: string;
  name: string;
  currentProgress: number; // 0 to 100
  baseCycleTimeMs: number;
  activeMultiplier: number;
  isOverclocked: boolean;
  activeTier: OverclockTier | null;
  isExhausted: boolean;
  exhaustionRemainingSec: number;
  streakCount: number;
}

export type OverclockEntityType = 'plot' | 'animal' | 'building' | 'fishery' | 'worker';

export interface EntityOverclockState {
  isOverclocked: boolean;
  activeTier: OverclockTier | null;
  speedMultiplier: number;
  bonusYield: number;
  burnoutChance: number;
  expiresAt: number | null;
  isExhausted: boolean;
  exhaustedUntil: number | null;
  streakCount: number;
  lastOverclockAt: number | null;
}

export const EXHAUSTION_DURATION_SEC = 180;
export const STREAK_DECAY_MS = 600000; // 10 minutes
export const STREAK_COST_INCREASE = 0.25; // +25% per subsequent overclock

export const BASE_OVERCLOCK_COSTS: Record<OverclockEntityType, number> = {
  plot: 25,
  animal: 35,
  building: 50,
  fishery: 40,
  worker: 45,
};

export const CURE_EXHAUSTION_FEES: Record<OverclockEntityType, { cost: number; title: string; emoji: string }> = {
  plot: { cost: 20, title: 'Soil Revitalizer', emoji: '🧪' },
  animal: { cost: 25, title: 'Veterinary Treatment', emoji: '💊' },
  building: { cost: 35, title: 'Mechanic Tune-Up', emoji: '🔧' },
  fishery: { cost: 30, title: 'Reel Tech Servicing', emoji: '⚙️' },
  worker: { cost: 30, title: 'Energy Restorative', emoji: '⚡' },
};

/**
 * Calculates decay-adjusted streak count. If > 10 minutes have elapsed since last overclock,
 * streak resets to 0.
 */
export function getDecayedStreak(lastOverclockAt: number | null, streakCount: number, now = Date.now()): number {
  if (!lastOverclockAt || now - lastOverclockAt >= STREAK_DECAY_MS) {
    return 0;
  }
  return streakCount;
}

/**
 * Calculates dynamic cost accounting for tier multiplier and active streak.
 * Tier 1: baseCost
 * Tier 2: baseCost * 2.2
 * Tier 3: baseCost * 4.5
 * Streak: +25% per active streak count within 10 min
 */
export function calculateOverclockCost(baseCost: number, tier: OverclockTier, streakCount: number): number {
  let tierMultiplier = 1.0;
  if (tier === 2) tierMultiplier = 2.2;
  else if (tier === 3) tierMultiplier = 4.5;

  const streakMultiplier = 1.0 + (streakCount * STREAK_COST_INCREASE);
  return Math.max(1, Math.round(baseCost * tierMultiplier * streakMultiplier));
}

/**
 * Generates tier configuration with computed cost for UI display.
 */
export function getTierConfig(tier: OverclockTier, baseCost: number, streakCount: number): OverclockConfig {
  const cost = calculateOverclockCost(baseCost, tier, streakCount);
  if (tier === 1) {
    return {
      tier: 1,
      label: 'Shift Overtime',
      speedMultiplier: 1.5,
      costCoins: cost,
      burnoutChance: 0.0,
      bonusYield: 0,
    };
  }
  if (tier === 2) {
    return {
      tier: 2,
      label: 'Double Shift',
      speedMultiplier: 2.5,
      costCoins: cost,
      burnoutChance: 0.15,
      bonusYield: 0,
    };
  }
  return {
    tier: 3,
    label: 'Adrenaline Overdrive',
    speedMultiplier: 4.0,
    costCoins: cost,
    burnoutChance: 0.35,
    bonusYield: 1,
  };
}

export function createDefaultEntityOverclock(): EntityOverclockState {
  return {
    isOverclocked: false,
    activeTier: null,
    speedMultiplier: 1.0,
    bonusYield: 0,
    burnoutChance: 0.0,
    expiresAt: null,
    isExhausted: false,
    exhaustedUntil: null,
    streakCount: 0,
    lastOverclockAt: null,
  };
}
