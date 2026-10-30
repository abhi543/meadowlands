/**
 * Elevated Gravity Tower Fail-Safe & Offline Protection Engine
 * 
 * Provides:
 * 1. Automated 3-Stage Load-Shedding Ladder (Nominal, Crop Conservation, Crew Rationing, Full Lockdown).
 * 2. Emergency Siphon Float Valve (Draws from Deep Aquifer when Tower <= 80L).
 * 3. Cryo-Standby Preservation Lock (Protects Amber Bio-Lab specimens from decay during water depletion).
 * 4. Offline Mathematical Catch-Up Resolver (Computes exact multi-stage water drain and specimen safety across offline absence).
 */

export const ELEVATED_TOWER_CAPACITY = 800; // 800L
export const DEEP_AQUIFER_BASE_CAPACITY = 3000; // 3,000L base

export const STAGE_THRESHOLDS = {
  STAGE_0_NOMINAL_MIN: 200,      // > 200L (>25%)
  STAGE_1_CONSERVATION_MAX: 200,  // 80L to 200L (10% to 25%)
  STAGE_1_CONSERVATION_MIN: 80,   // Siphon trigger point
  STAGE_2_RATIONING_MAX: 80,      // 1L to 79L (1% to 10%)
  STAGE_2_RATIONING_MIN: 1,
  STAGE_3_EMPTY: 0,              // 0L (Depleted / Full Lockdown)
} as const;

export type TowerLoadSheddingStage = 0 | 1 | 2 | 3;

export interface HydraulicConsumersBreakdown {
  furrowDrainLps: number;
  bioLabDrainLps: number;
  crewDrainLps: number;
  totalDrainLps: number;
  netSiphonLps: number;
  netFlowLps: number; // positive = filling, negative = draining
  estimatedSecondsUntilEmpty: number | null;
  stage: TowerLoadSheddingStage;
  stageName: string;
  stageColor: 'emerald' | 'amber' | 'orange' | 'rose';
  isCropConservationActive: boolean;
  isCrewRationingActive: boolean;
  isCryoStandbyActive: boolean;
}

export interface TowerStorageTierConfig {
  tier: number;
  name: string;
  shortName: string;
  capacityLiters: number;
  surgeLps: number;
  costCoins: number;
  costItems: Record<string, number>;
  minLevel: number;
  description: string;
  badge: string;
  icon: string;
}

export const TOWER_STORAGE_TIERS: Record<number, TowerStorageTierConfig> = {
  1: {
    tier: 1,
    name: 'Timber Stilt Cistern (Standard)',
    shortName: 'Tier 1 • Stilt Cistern',
    capacityLiters: 800,
    surgeLps: 15.0,
    costCoins: 0,
    costItems: {},
    minLevel: 1,
    description: 'Hand-hewn timber framework with baseline gravity head pressure (800L).',
    badge: 'Tier 1 • 800L',
    icon: '🪵',
  },
  2: {
    tier: 2,
    name: 'Reinforced Oak Reservoir',
    shortName: 'Tier 2 • Oak Reservoir',
    capacityLiters: 2500,
    surgeLps: 25.0,
    costCoins: 25000,
    costItems: { wood: 50 },
    minLevel: 3,
    description: 'Double-staved oak vat reinforced with iron hoops. Expands capacity to 2,500L with +25 L/s surge throughput.',
    badge: 'Tier 2 • 2,500L',
    icon: '🛢️',
  },
  3: {
    tier: 3,
    name: 'Riveted Cast-Iron Silo',
    shortName: 'Tier 3 • Iron Silo',
    capacityLiters: 7500,
    surgeLps: 40.0,
    costCoins: 85000,
    costItems: { iron_bar: 40 },
    minLevel: 5,
    description: 'Pressurized industrial steel vessel holding 7,500L with high-velocity +40 L/s manifold surge.',
    badge: 'Tier 3 • 7,500L',
    icon: '⚙️',
  },
  4: {
    tier: 4,
    name: 'Monolithic Granite Standpipe',
    shortName: 'Tier 4 • Granite Standpipe',
    capacityLiters: 20000,
    surgeLps: 65.0,
    costCoins: 250000,
    costItems: { stone: 150, clay: 80 },
    minLevel: 7,
    description: 'High-elevation architectural aqueduct standpipe holding 20,000L with massive hydrostatic head (+65 L/s).',
    badge: 'Tier 4 • 20,000L',
    icon: '🏛️',
  },
  5: {
    tier: 5,
    name: 'Hydro-Pneumatic Mega-Citadel',
    shortName: 'Tier 5 • Mega-Citadel',
    capacityLiters: 50000,
    surgeLps: 100.0,
    costCoins: 750000,
    costItems: { refined_glass: 60, steel_beam: 40 },
    minLevel: 10,
    description: 'Colossal pressurized mega-reservoir holding 50,000L! Unbeatable drought resilience and +100 L/s surge throughput.',
    badge: 'Tier 5 • 50,000L',
    icon: '🏰',
  },
};

export function getTowerLoadSheddingStage(towerLiters: number, towerCapacity: number = ELEVATED_TOWER_CAPACITY): TowerLoadSheddingStage {
  const nominalMin = towerCapacity * 0.25;
  const conservationMin = towerCapacity * 0.10;
  if (towerLiters > nominalMin) {
    return 0; // Nominal (>25%)
  }
  if (towerLiters >= conservationMin) {
    return 1; // Crop Conservation (10% to 25%)
  }
  if (towerLiters > 0) {
    return 2; // Crew Rationing (1L to 10%)
  }
  return 3; // Full Lockdown & Preservation (0L)
}


/**
 * Calculates current real-time consumption rates across all 3 estate systems
 */
export function calculateHydraulicConsumers(params: {
  towerLiters: number;
  towerCapacity?: number;
  sluiceGatesOpen: boolean;
  sluiceDischargeRateLps: number;
  activeBioLabChambersCount: number;
  activeWorkerCount: number;
  isSiphonActive: boolean;
  siphonTrickleRateLps?: number;
}): HydraulicConsumersBreakdown {
  const {
    towerLiters,
    towerCapacity = ELEVATED_TOWER_CAPACITY,
    sluiceGatesOpen,
    sluiceDischargeRateLps,
    activeBioLabChambersCount,
    activeWorkerCount,
    isSiphonActive,
    siphonTrickleRateLps = 2.0,
  } = params;

  const stage = getTowerLoadSheddingStage(towerLiters, towerCapacity);
  const isCropConservationActive = stage >= 1;
  const isCrewRationingActive = stage >= 2;
  const isCryoStandbyActive = stage >= 3;

  // 1. High Volume: Crop furrow irrigation (0 if Crop Conservation active or gates closed)
  const furrowDrainLps = (!isCropConservationActive && sluiceGatesOpen) ? Math.max(0, sluiceDischargeRateLps) : 0;

  // 2. Medium Volume: Amber Bio-Lab chamber cooling loops (0.05 L/s per active chamber)
  // Frozen in Stage 3 Cryo-Standby
  const bioLabDrainLps = isCryoStandbyActive ? 0 : activeBioLabChambersCount * 0.05;

  // 3. Low Volume: Staff bunkhouse hydration stations (0.015 L/s baseline, halved in rationing, 0 in full lockdown)
  let crewDrainLps = activeWorkerCount * 0.015;
  if (isCryoStandbyActive) {
    crewDrainLps = 0;
  } else if (isCrewRationingActive) {
    crewDrainLps *= 0.5; // emergency rations
  }

  const totalDrainLps = furrowDrainLps + bioLabDrainLps + crewDrainLps;
  const netSiphonLps = isSiphonActive ? siphonTrickleRateLps : 0;
  const netFlowLps = netSiphonLps - totalDrainLps;

  let estimatedSecondsUntilEmpty: number | null = null;
  if (towerLiters <= 0) {
    estimatedSecondsUntilEmpty = 0;
  } else if (netFlowLps < 0) {
    estimatedSecondsUntilEmpty = Math.max(0, Math.round(towerLiters / Math.abs(netFlowLps)));
  }

  let stageName = 'Stage 0: Nominal State';
  let stageColor: 'emerald' | 'amber' | 'orange' | 'rose' = 'emerald';
  if (stage === 1) {
    stageName = 'Stage 1: Crop Conservation';
    stageColor = 'amber';
  } else if (stage === 2) {
    stageName = 'Stage 2: Crew Rationing';
    stageColor = 'orange';
  } else if (stage === 3) {
    stageName = 'Stage 3: Cryo-Standby';
    stageColor = 'rose';
  }

  return {
    furrowDrainLps: Math.round(furrowDrainLps * 100) / 100,
    bioLabDrainLps: Math.round(bioLabDrainLps * 100) / 100,
    crewDrainLps: Math.round(crewDrainLps * 100) / 100,
    totalDrainLps: Math.round(totalDrainLps * 100) / 100,
    netSiphonLps: Math.round(netSiphonLps * 100) / 100,
    netFlowLps: Math.round(netFlowLps * 100) / 100,
    estimatedSecondsUntilEmpty,
    stage,
    stageName,
    stageColor,
    isCropConservationActive,
    isCrewRationingActive,
    isCryoStandbyActive,
  };
}

/**
 * Simulates real-time Siphon Float Valve dynamics.
 * Supports Smart Dual-Intake Manifold: automatically draws from whichever reservoir
 * has a higher water level percentage (Rain Catchment Cistern vs Deep Groundwater Aquifer),
 * or follows player preference ('smart_highest' | 'cistern' | 'aquifer') with seamless failover.
 */
export function simulateSiphonTick(params: {
  towerLiters: number;
  towerCapacityLiters?: number;
  aquiferLiters: number;
  aquiferCapacityLiters?: number;
  cisternLiters?: number;
  cisternMaxLiters?: number;
  deltaSeconds: number;
  hasEmergencySiphon: boolean;
  trickleRateLps?: number;
  siphonMode?: 'continuous' | 'emergency';
  siphonSourcePreference?: 'smart_highest' | 'cistern' | 'aquifer';
}): {
  newTowerLiters: number;
  newAquiferLiters: number;
  newCisternLiters: number;
  siphonedLiters: number;
  isSiphonActive: boolean;
  siphonActiveSource: 'cistern' | 'aquifer' | null;
  siphonSourceBreakdown: {
    fromCistern: number;
    fromAquifer: number;
  };
} {
  const {
    towerLiters,
    towerCapacityLiters = ELEVATED_TOWER_CAPACITY,
    aquiferLiters,
    aquiferCapacityLiters = 3000,
    cisternLiters = 0,
    cisternMaxLiters = 1200,
    deltaSeconds,
    hasEmergencySiphon,
    trickleRateLps = 2.0,
    siphonMode = 'continuous',
    siphonSourcePreference = 'smart_highest',
  } = params;

  const currentAquifer = Math.max(0, aquiferLiters);
  const currentCistern = Math.max(0, cisternLiters);
  const totalAvailable = currentAquifer + currentCistern;

  if (!hasEmergencySiphon || totalAvailable <= 0) {
    return {
      newTowerLiters: towerLiters,
      newAquiferLiters: currentAquifer,
      newCisternLiters: currentCistern,
      siphonedLiters: 0,
      isSiphonActive: false,
      siphonActiveSource: null,
      siphonSourceBreakdown: { fromCistern: 0, fromAquifer: 0 },
    };
  }

  // Continuous mode: maintains continuous inflow whenever tower < towerCapacityLiters!
  // Emergency mode: only activates when tower <= 80L (or returning to 200L)
  const isContinuous = siphonMode !== 'emergency';
  const targetCeiling = isContinuous ? towerCapacityLiters : STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN;

  const shouldSiphon = isContinuous
    ? towerLiters < targetCeiling
    : (towerLiters <= STAGE_THRESHOLDS.STAGE_1_CONSERVATION_MIN || (towerLiters < STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN && towerLiters > 0));

  if (!shouldSiphon) {
    return {
      newTowerLiters: towerLiters,
      newAquiferLiters: currentAquifer,
      newCisternLiters: currentCistern,
      siphonedLiters: 0,
      isSiphonActive: false,
      siphonActiveSource: null,
      siphonSourceBreakdown: { fromCistern: 0, fromAquifer: 0 },
    };
  }

  const requestedTransfer = trickleRateLps * deltaSeconds;
  const towerDeficit = Math.max(0, targetCeiling - towerLiters);
  const transferNeeded = Math.min(requestedTransfer, totalAvailable, towerDeficit);

  if (transferNeeded <= 0) {
    return {
      newTowerLiters: towerLiters,
      newAquiferLiters: currentAquifer,
      newCisternLiters: currentCistern,
      siphonedLiters: 0,
      isSiphonActive: false,
      siphonActiveSource: null,
      siphonSourceBreakdown: { fromCistern: 0, fromAquifer: 0 },
    };
  }

  // --- Dynamic Level Determination & Priority Routing ---
  const cisternPct = cisternMaxLiters > 0 ? (currentCistern / cisternMaxLiters) : 0;
  const aquiferPct = aquiferCapacityLiters > 0 ? (currentAquifer / aquiferCapacityLiters) : 0;

  let primary: 'cistern' | 'aquifer';
  let secondary: 'cistern' | 'aquifer';

  if (siphonSourcePreference === 'cistern') {
    primary = currentCistern > 0 ? 'cistern' : 'aquifer';
    secondary = 'aquifer';
  } else if (siphonSourcePreference === 'aquifer') {
    primary = currentAquifer > 0 ? 'aquifer' : 'cistern';
    secondary = 'cistern';
  } else {
    // 'smart_highest': automatically select reservoir with higher relative water fullness
    if (cisternPct >= aquiferPct) {
      primary = currentCistern > 0 ? 'cistern' : 'aquifer';
      secondary = 'aquifer';
    } else {
      primary = currentAquifer > 0 ? 'aquifer' : 'cistern';
      secondary = 'cistern';
    }
  }

  let fromCistern = 0;
  let fromAquifer = 0;

  if (primary === 'cistern') {
    fromCistern = Math.min(currentCistern, transferNeeded);
    const remainder = transferNeeded - fromCistern;
    if (remainder > 0 && secondary === 'aquifer') {
      fromAquifer = Math.min(currentAquifer, remainder);
    }
  } else {
    fromAquifer = Math.min(currentAquifer, transferNeeded);
    const remainder = transferNeeded - fromAquifer;
    if (remainder > 0 && secondary === 'cistern') {
      fromCistern = Math.min(currentCistern, remainder);
    }
  }

  const actualTransfer = fromCistern + fromAquifer;
  if (actualTransfer <= 0) {
    return {
      newTowerLiters: towerLiters,
      newAquiferLiters: currentAquifer,
      newCisternLiters: currentCistern,
      siphonedLiters: 0,
      isSiphonActive: false,
      siphonActiveSource: null,
      siphonSourceBreakdown: { fromCistern: 0, fromAquifer: 0 },
    };
  }

  const activeSource: 'cistern' | 'aquifer' = fromCistern >= fromAquifer ? 'cistern' : 'aquifer';

  return {
    newTowerLiters: Math.round((towerLiters + actualTransfer) * 10) / 10,
    newAquiferLiters: Math.max(0, Math.round((currentAquifer - fromAquifer) * 10) / 10),
    newCisternLiters: Math.max(0, Math.round((currentCistern - fromCistern) * 10) / 10),
    siphonedLiters: Math.round(actualTransfer * 10) / 10,
    isSiphonActive: true,
    siphonActiveSource: activeSource,
    siphonSourceBreakdown: {
      fromCistern: Math.round(fromCistern * 10) / 10,
      fromAquifer: Math.round(fromAquifer * 10) / 10,
    },
  };
}

export const OVERFLOW_SURGE_RATE_LPS = 15.0; // 15 L/s

export interface SimulateOverflowSurgeTickParams {
  towerLiters: number;
  towerCapacityLiters?: number;
  cisternLiters: number;
  cisternMaxLiters: number;
  aquiferLiters: number;
  aquiferCapacityLiters: number;
  deltaSeconds: number;
  isOverflowSurgeActive: boolean;
  overflowSurgeSource: 'cistern' | 'aquifer' | null;
  surgeRateLps?: number;
}

export interface OverflowSurgeTickResult {
  newTowerLiters: number;
  newCisternLiters: number;
  newAquiferLiters: number;
  isOverflowSurgeActive: boolean;
  overflowSurgeSource: 'cistern' | 'aquifer' | null;
  transferredLiters: number;
  justTriggered: boolean;
  justCompleted: boolean;
  triggerSourceName?: string;
}

/**
 * Automated Hydraulic Rule: "Full-Reserve Pressure Surge"
 * 
 * Rules:
 * 1. Strict Trigger: Dormant at sub-capacity (e.g. 90%, 98%, 99%). Triggers ONLY when either Cistern or Aquifer hits 100% capacity.
 * 2. Full-Tower Suppression: If Tower is already at 800L when a source hits 100%, NO transfer occurs.
 * 3. Priority & Collision Resolution: If both Cistern and Aquifer are full at the same time, prioritize Cistern first. Switch to Aquifer if Cistern empties before Tower hits 800L.
 * 4. Run to Completion: Once activated, pumping continues continuously at 15L/s until Tower reaches 800L (or source empties).
 * 5. Clean Auto-Shutoff: Exactly at 800L, pump immediately stops with 0L waste.
 */
export function simulateOverflowSurgeTick(params: SimulateOverflowSurgeTickParams): OverflowSurgeTickResult {
  const {
    towerLiters,
    towerCapacityLiters = ELEVATED_TOWER_CAPACITY,
    cisternLiters,
    cisternMaxLiters,
    aquiferLiters,
    aquiferCapacityLiters,
    deltaSeconds,
    isOverflowSurgeActive,
    overflowSurgeSource,
    surgeRateLps = OVERFLOW_SURGE_RATE_LPS,
  } = params;

  let currentTower = Math.max(0, towerLiters);
  let currentCistern = Math.max(0, cisternLiters);
  let currentAquifer = Math.max(0, aquiferLiters);
  let isActive = Boolean(isOverflowSurgeActive);
  let activeSource = overflowSurgeSource;
  let justTriggered = false;
  let justCompleted = false;
  let transferredLiters = 0;
  let triggerSourceName: string | undefined;

  // Strict 100% maximum capacity check (tolerance 0.001)
  const isCistern100Pct = cisternMaxLiters > 0 && currentCistern >= (cisternMaxLiters - 0.001);
  const isAquifer100Pct = aquiferCapacityLiters > 0 && currentAquifer >= (aquiferCapacityLiters - 0.001);

  // 1. Trigger evaluation if currently dormant
  if (!isActive) {
    // Full-Tower Suppression: If tower is already 800L, DO NOT activate
    if (currentTower < towerCapacityLiters) {
      if (isCistern100Pct) {
        // Priority 1: Rain Catchment Cistern
        isActive = true;
        activeSource = 'cistern';
        justTriggered = true;
        triggerSourceName = 'Rain Catchment Cistern';
      } else if (isAquifer100Pct) {
        // Priority 2: Deep Groundwater Aquifer
        isActive = true;
        activeSource = 'aquifer';
        justTriggered = true;
        triggerSourceName = 'Deep Groundwater Aquifer';
      }
    }
  }

  // 2. Active Transfer Simulation
  if (isActive) {
    // If tower is already at or above capacity, auto-shutoff immediately
    if (currentTower >= towerCapacityLiters) {
      isActive = false;
      activeSource = null;
      justCompleted = true;
    } else {
      // Collision / Source switching: if active source is empty, check alternative
      if (activeSource === 'cistern') {
        if (currentCistern <= 0) {
          if (currentAquifer > 0) {
            // Switch to Deep Aquifer only if Cistern empties before Gravity Tower reaches 800L
            activeSource = 'aquifer';
          } else {
            // No water in either reservoir
            isActive = false;
            activeSource = null;
          }
        }
      } else if (activeSource === 'aquifer') {
        if (currentAquifer <= 0) {
          isActive = false;
          activeSource = null;
        }
      } else {
        // Fallback resolution
        activeSource = currentCistern > 0 ? 'cistern' : (currentAquifer > 0 ? 'aquifer' : null);
        if (!activeSource) {
          isActive = false;
        }
      }

      // Execute hydraulic pumping transfer
      if (isActive && activeSource && deltaSeconds > 0) {
        const availableInSource = activeSource === 'cistern' ? currentCistern : currentAquifer;
        const towerSpace = Math.max(0, towerCapacityLiters - currentTower);
        const requestedTransfer = surgeRateLps * deltaSeconds;
        const actualTransfer = Math.min(requestedTransfer, availableInSource, towerSpace);

        if (actualTransfer > 0) {
          if (activeSource === 'cistern') {
            currentCistern = Math.max(0, currentCistern - actualTransfer);
          } else {
            currentAquifer = Math.max(0, currentAquifer - actualTransfer);
          }
          currentTower = Math.min(towerCapacityLiters, currentTower + actualTransfer);
          transferredLiters = actualTransfer;
        }

        // Clean Cutoff: as soon as tower reaches 800L ceiling, disengage pump instantly
        if (currentTower >= towerCapacityLiters) {
          currentTower = towerCapacityLiters;
          isActive = false;
          activeSource = null;
          justCompleted = true;
        }
      }
    }
  }

  return {
    newTowerLiters: Math.round(currentTower * 10) / 10,
    newCisternLiters: Math.round(currentCistern * 10) / 10,
    newAquiferLiters: Math.round(currentAquifer * 10) / 10,
    isOverflowSurgeActive: isActive,
    overflowSurgeSource: activeSource,
    transferredLiters: Math.round(transferredLiters * 10) / 10,
    justTriggered,
    justCompleted,
    triggerSourceName,
  };
}

export interface OfflineHydrologyResolutionResult {
  initialTowerLiters: number;
  finalTowerLiters: number;
  initialAquiferLiters: number;
  finalAquiferLiters: number;
  initialCisternLiters?: number;
  finalCisternLiters?: number;
  stageReached: TowerLoadSheddingStage;
  cropConservationEngagedSec: number | null; // seconds into offline period when Stage 1 triggered
  totalSiphonedLiters: number;
  elapsedOfflineSeconds: number;
  specimensPreservedCount: number;
  specimensSafetyConfirmed: boolean;
  workerRationingApplied: boolean;
  isCryoStandbyActive: boolean;
  cryoGraceWindowSeconds: number;
  isWithinGraceWindow: boolean;
  effectiveCropGrowthSeconds: number; // exact seconds crops were allowed to grow before conservation
}

/**
 * Offline Mathematical Catch-Up Resolver
 * 
 * Computes exact piecewise drain through the 3-Stage Load-Shedding Ladder:
 * - Phase 1: Tower > 200L -> Furrows + Bio-Lab + Crew (Crop growth runs)
 * - Phase 2: Tower 80L..200L -> Crop growth PAUSED, Sluice closed, Bio-Lab + Crew
 * - Siphon draws from whichever reservoir is higher (Rain Cistern vs Aquifer) to refill Tower up to 200L if valve installed
 * - Phase 3: Tower 1L..79L -> Crew rationing, Bio-Lab priority
 * - Phase 4: Tower 0L -> Cryo-Standby engaged, 100% specimen safety within 24h grace window
 */
export function resolveOfflineHydrologyCatchUp(params: {
  initialTowerLiters: number;
  initialAquiferLiters: number;
  initialCisternLiters?: number;
  cisternMaxLiters?: number;
  aquiferCapacityLiters?: number;
  elapsedOfflineSeconds: number;
  isSluiceOpen: boolean;
  sluiceDischargeRateLps: number;
  activeBioLabChambersCount: number;
  activeWorkerCount: number;
  hasEmergencySiphon: boolean;
  hasInsulationSleeves?: boolean;
  siphonMode?: 'continuous' | 'emergency';
  siphonSourcePreference?: 'smart_highest' | 'cistern' | 'aquifer';
  towerCapacityLiters?: number;
}): OfflineHydrologyResolutionResult {
  const {
    initialTowerLiters,
    initialAquiferLiters,
    initialCisternLiters = 0,
    cisternMaxLiters = 1200,
    aquiferCapacityLiters = 3000,
    elapsedOfflineSeconds,
    isSluiceOpen,
    sluiceDischargeRateLps,
    activeBioLabChambersCount,
    activeWorkerCount,
    hasEmergencySiphon,
    hasInsulationSleeves = false,
    siphonMode = 'continuous',
    siphonSourcePreference = 'smart_highest',
    towerCapacityLiters = ELEVATED_TOWER_CAPACITY,
  } = params;

  let tower = Math.max(0, initialTowerLiters);
  let aquifer = Math.max(0, initialAquiferLiters);
  let cistern = Math.max(0, initialCisternLiters);
  let timeLeft = Math.max(0, elapsedOfflineSeconds);

  let cropConservationEngagedSec: number | null = null;
  let effectiveCropGrowthSeconds = 0;
  let totalSiphonedLiters = 0;
  let workerRationingApplied = false;

  const cryoGraceWindowSeconds = hasInsulationSleeves ? 172800 : 86400; // 48h or 24h

  // Drain rates
  const R_furrow = isSluiceOpen ? Math.max(0, sluiceDischargeRateLps) : 0;
  const R_biolab = activeBioLabChambersCount * 0.05;
  // Workers drink from staff canteen or personal rations, not draining the industrial gravity tower!
  const R_crew_nominal = 0;
  const R_crew_rationed = 0;

  const totalAvailableSiphon = aquifer + cistern;
  const isContinuousSiphon = hasEmergencySiphon && siphonMode !== 'emergency' && totalAvailableSiphon > 0;

  // Helper function to draw water from preferred reservoir with fallback
  const drawSiphonTransfer = (requested: number): number => {
    if (requested <= 0) return 0;
    const totalAvail = cistern + aquifer;
    const toTransfer = Math.min(requested, totalAvail);
    if (toTransfer <= 0) return 0;

    const cPct = cisternMaxLiters > 0 ? (cistern / cisternMaxLiters) : 0;
    const aPct = aquiferCapacityLiters > 0 ? (aquifer / aquiferCapacityLiters) : 0;
    
    let primary: 'cistern' | 'aquifer' = 'aquifer';
    if (siphonSourcePreference === 'cistern') {
      primary = cistern > 0 ? 'cistern' : 'aquifer';
    } else if (siphonSourcePreference === 'aquifer') {
      primary = aquifer > 0 ? 'aquifer' : 'cistern';
    } else {
      primary = (cPct >= aPct && cistern > 0) ? 'cistern' : 'aquifer';
    }

    let fromC = 0;
    let fromA = 0;
    if (primary === 'cistern') {
      fromC = Math.min(cistern, toTransfer);
      const rem = toTransfer - fromC;
      if (rem > 0) fromA = Math.min(aquifer, rem);
    } else {
      fromA = Math.min(aquifer, toTransfer);
      const rem = toTransfer - fromA;
      if (rem > 0) fromC = Math.min(cistern, rem);
    }

    cistern -= fromC;
    aquifer -= fromA;
    const drawn = fromC + fromA;
    totalSiphonedLiters += drawn;
    return drawn;
  };

  // --- PHASE 1: DRAIN DOWN TO STAGE 1 (200L) ---
  if (tower > STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN && timeLeft > 0) {
    const R_total_1 = R_furrow + R_biolab + R_crew_nominal;
    const R_siphon = isContinuousSiphon ? 2.0 : 0;
    const R_net_drain = R_total_1 - R_siphon;
    const deltaV = tower - STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN;

    if (R_net_drain <= 0) {
      // Continuous siphon replenishes faster than or equal to drain! Tower stays stable.
      const transferNeeded = R_total_1 * timeLeft;
      drawSiphonTransfer(transferNeeded);
      tower = Math.min(towerCapacityLiters, tower + (Math.abs(R_net_drain) * timeLeft));
      effectiveCropGrowthSeconds = timeLeft;
      timeLeft = 0;
    } else if (R_net_drain > 0) {
      const timeToStage1 = deltaV / R_net_drain;
      if (timeLeft <= timeToStage1) {
        tower -= timeLeft * R_net_drain;
        if (isContinuousSiphon) {
          drawSiphonTransfer(R_siphon * timeLeft);
        }
        effectiveCropGrowthSeconds = timeLeft;
        timeLeft = 0;
      } else {
        tower = STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN;
        if (isContinuousSiphon) {
          drawSiphonTransfer(R_siphon * timeToStage1);
        }
        effectiveCropGrowthSeconds = timeToStage1;
        cropConservationEngagedSec = Math.round(timeToStage1);
        timeLeft -= timeToStage1;
      }
    } else {
      // Zero drain rate, crops grow for whole time
      effectiveCropGrowthSeconds = timeLeft;
      timeLeft = 0;
    }
  } else if (tower <= STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN) {
    // Was already at or below Stage 1 at start of absence
    cropConservationEngagedSec = 0;
    effectiveCropGrowthSeconds = 0;
  }

  // --- PHASE 2: CONSERVATION DRAIN DOWN TO STAGE 2 (80L) WITH SIPHON REFILL ---
  if (timeLeft > 0 && tower > STAGE_THRESHOLDS.STAGE_1_CONSERVATION_MIN) {
    // Sluice gates are now auto-secured. Drain is only Bio-Lab + Crew
    const R_total_2 = R_biolab + R_crew_nominal;
    const deltaV = tower - STAGE_THRESHOLDS.STAGE_1_CONSERVATION_MIN;

    if (R_total_2 > 0) {
      const timeToStage2 = deltaV / R_total_2;
      if (timeLeft <= timeToStage2) {
        tower -= timeLeft * R_total_2;
        timeLeft = 0;
      } else {
        tower = STAGE_THRESHOLDS.STAGE_1_CONSERVATION_MIN;
        timeLeft -= timeToStage2;
      }
    } else {
      timeLeft = 0;
    }
  }

  // --- EMERGENCY SIPHON ENGAGEMENT (when tower reaches or is <= 80L) ---
  const currentTotalWater = aquifer + cistern;
  if (hasEmergencySiphon && currentTotalWater > 0 && timeLeft > 0 && tower <= STAGE_THRESHOLDS.STAGE_1_CONSERVATION_MIN) {
    const siphonRate = 2.0;
    const consumptionRate = R_biolab + R_crew_nominal;
    const netFillingRate = siphonRate - consumptionRate;

    const towerDeficit = Math.max(0, STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN - tower);
    const maxTransferPossible = Math.min(currentTotalWater, towerDeficit);

    if (maxTransferPossible > 0 && netFillingRate > 0) {
      const timeToRefill = maxTransferPossible / netFillingRate;
      if (timeLeft <= timeToRefill) {
        drawSiphonTransfer(timeLeft * siphonRate);
        tower = Math.min(STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN, tower + (timeLeft * netFillingRate));
        timeLeft = 0;
      } else {
        drawSiphonTransfer(maxTransferPossible);
        tower = STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN;
        timeLeft -= timeToRefill;

        // Drain from 200L down to 80L again
        const drainTime2 = 120 / (consumptionRate || 0.05);
        if (timeLeft <= drainTime2) {
          tower -= timeLeft * consumptionRate;
          timeLeft = 0;
        } else {
          tower = STAGE_THRESHOLDS.STAGE_1_CONSERVATION_MIN;
          timeLeft -= drainTime2;
        }
      }
    }
  }

  // --- PHASE 3: CREW RATIONING DRAIN DOWN TO 0L ---
  if (timeLeft > 0 && tower > 0) {
    workerRationingApplied = true;
    const R_total_3 = R_biolab + R_crew_rationed;
    if (R_total_3 > 0) {
      const timeToEmpty = tower / R_total_3;
      if (timeLeft <= timeToEmpty) {
        tower -= timeLeft * R_total_3;
        timeLeft = 0;
      } else {
        tower = 0;
        timeLeft -= timeToEmpty;
      }
    } else {
      timeLeft = 0;
    }
  }

  // Final stage
  const finalTowerLiters = Math.max(0, Math.round(tower * 10) / 10);
  const finalAquiferLiters = Math.max(0, Math.round(aquifer * 10) / 10);
  const finalCisternLiters = Math.max(0, Math.round(cistern * 10) / 10);
  const stageReached = getTowerLoadSheddingStage(finalTowerLiters);
  const isCryoStandbyActive = stageReached === 3;

  // Grace window: If tower reached 0L, time spent at 0L is timeLeft
  const timeSpentAtZeroL = stageReached === 3 ? timeLeft : 0;
  const isWithinGraceWindow = timeSpentAtZeroL <= cryoGraceWindowSeconds;

  return {
    initialTowerLiters,
    finalTowerLiters,
    initialAquiferLiters,
    finalAquiferLiters,
    initialCisternLiters,
    finalCisternLiters,
    stageReached,
    cropConservationEngagedSec,
    totalSiphonedLiters: Math.round(totalSiphonedLiters * 10) / 10,
    elapsedOfflineSeconds,
    specimensPreservedCount: activeBioLabChambersCount,
    specimensSafetyConfirmed: isWithinGraceWindow,
    workerRationingApplied,
    isCryoStandbyActive,
    cryoGraceWindowSeconds,
    isWithinGraceWindow,
    effectiveCropGrowthSeconds: Math.round(effectiveCropGrowthSeconds),
  };
}
