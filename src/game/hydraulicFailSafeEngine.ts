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

export function getTowerLoadSheddingStage(towerLiters: number): TowerLoadSheddingStage {
  if (towerLiters > STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN) {
    return 0; // Nominal (>200L)
  }
  if (towerLiters >= STAGE_THRESHOLDS.STAGE_1_CONSERVATION_MIN) {
    return 1; // Crop Conservation (80L to 200L)
  }
  if (towerLiters > STAGE_THRESHOLDS.STAGE_3_EMPTY) {
    return 2; // Crew Rationing (1L to 79L)
  }
  return 3; // Full Lockdown & Preservation (0L)
}

/**
 * Calculates current real-time consumption rates across all 3 estate systems
 */
export function calculateHydraulicConsumers(params: {
  towerLiters: number;
  sluiceGatesOpen: boolean;
  sluiceDischargeRateLps: number;
  activeBioLabChambersCount: number;
  activeWorkerCount: number;
  isSiphonActive: boolean;
  siphonTrickleRateLps?: number;
}): HydraulicConsumersBreakdown {
  const {
    towerLiters,
    sluiceGatesOpen,
    sluiceDischargeRateLps,
    activeBioLabChambersCount,
    activeWorkerCount,
    isSiphonActive,
    siphonTrickleRateLps = 2.0,
  } = params;

  const stage = getTowerLoadSheddingStage(towerLiters);
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
 * Simulates real-time Emergency Siphon Float Valve dynamics.
 * Opens automatically when tower <= 80L, pulls from Deep Aquifer until tower reaches 200L or aquifer hits 0L.
 */
export function simulateSiphonTick(params: {
  towerLiters: number;
  aquiferLiters: number;
  deltaSeconds: number;
  hasEmergencySiphon: boolean;
  trickleRateLps?: number;
}): {
  newTowerLiters: number;
  newAquiferLiters: number;
  siphonedLiters: number;
  isSiphonActive: boolean;
} {
  const {
    towerLiters,
    aquiferLiters,
    deltaSeconds,
    hasEmergencySiphon,
    trickleRateLps = 2.0,
  } = params;

  if (!hasEmergencySiphon || aquiferLiters <= 0) {
    return {
      newTowerLiters: towerLiters,
      newAquiferLiters: aquiferLiters,
      siphonedLiters: 0,
      isSiphonActive: false,
    };
  }

  // Float valve activates at or below 80L and remains open until 200L is restored
  const shouldSiphon = towerLiters <= STAGE_THRESHOLDS.STAGE_1_CONSERVATION_MIN || (towerLiters < STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN && towerLiters > 0);

  if (!shouldSiphon) {
    return {
      newTowerLiters: towerLiters,
      newAquiferLiters: aquiferLiters,
      siphonedLiters: 0,
      isSiphonActive: false,
    };
  }

  const requestedTransfer = trickleRateLps * deltaSeconds;
  const towerDeficitToNominal = Math.max(0, STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN - towerLiters);
  const actualTransfer = Math.min(requestedTransfer, aquiferLiters, towerDeficitToNominal);

  if (actualTransfer <= 0) {
    return {
      newTowerLiters: towerLiters,
      newAquiferLiters: aquiferLiters,
      siphonedLiters: 0,
      isSiphonActive: false,
    };
  }

  return {
    newTowerLiters: Math.round((towerLiters + actualTransfer) * 10) / 10,
    newAquiferLiters: Math.max(0, Math.round((aquiferLiters - actualTransfer) * 10) / 10),
    siphonedLiters: Math.round(actualTransfer * 10) / 10,
    isSiphonActive: true,
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
 * - Siphon draws from Aquifer to refill Tower up to 200L if valve installed
 * - Phase 3: Tower 1L..79L -> Crew rationing, Bio-Lab priority
 * - Phase 4: Tower 0L -> Cryo-Standby engaged, 100% specimen safety within 24h grace window
 */
export function resolveOfflineHydrologyCatchUp(params: {
  initialTowerLiters: number;
  initialAquiferLiters: number;
  elapsedOfflineSeconds: number;
  isSluiceOpen: boolean;
  sluiceDischargeRateLps: number;
  activeBioLabChambersCount: number;
  activeWorkerCount: number;
  hasEmergencySiphon: boolean;
  hasInsulationSleeves?: boolean;
}): OfflineHydrologyResolutionResult {
  const {
    initialTowerLiters,
    initialAquiferLiters,
    elapsedOfflineSeconds,
    isSluiceOpen,
    sluiceDischargeRateLps,
    activeBioLabChambersCount,
    activeWorkerCount,
    hasEmergencySiphon,
    hasInsulationSleeves = false,
  } = params;

  let tower = Math.max(0, initialTowerLiters);
  let aquifer = Math.max(0, initialAquiferLiters);
  let timeLeft = Math.max(0, elapsedOfflineSeconds);

  let cropConservationEngagedSec: number | null = null;
  let effectiveCropGrowthSeconds = 0;
  let totalSiphonedLiters = 0;
  let workerRationingApplied = false;

  const cryoGraceWindowSeconds = hasInsulationSleeves ? 172800 : 86400; // 48h or 24h

  // Drain rates
  const R_furrow = isSluiceOpen ? Math.max(0, sluiceDischargeRateLps) : 0;
  const R_biolab = activeBioLabChambersCount * 0.05;
  const R_crew_nominal = activeWorkerCount * 0.015;
  const R_crew_rationed = R_crew_nominal * 0.5;

  // --- PHASE 1: DRAIN DOWN TO STAGE 1 (200L) ---
  if (tower > STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN && timeLeft > 0) {
    const R_total_1 = R_furrow + R_biolab + R_crew_nominal;
    const deltaV = tower - STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN;

    if (R_total_1 > 0) {
      const timeToStage1 = deltaV / R_total_1;
      if (timeLeft <= timeToStage1) {
        // Did not reach Stage 1 during entire absence
        tower -= timeLeft * R_total_1;
        effectiveCropGrowthSeconds = timeLeft;
        timeLeft = 0;
      } else {
        // Reached Stage 1 at timeToStage1
        tower = STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN;
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
  if (hasEmergencySiphon && aquifer > 0 && timeLeft > 0 && tower <= STAGE_THRESHOLDS.STAGE_1_CONSERVATION_MIN) {
    // Siphon pulls from aquifer at 2.0 L/s up to 200L
    const siphonRate = 2.0;
    const consumptionRate = R_biolab + R_crew_nominal;
    const netFillingRate = siphonRate - consumptionRate;

    const towerDeficit = Math.max(0, STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN - tower);
    const maxTransferPossible = Math.min(aquifer, towerDeficit);

    if (maxTransferPossible > 0 && netFillingRate > 0) {
      const timeToRefill = maxTransferPossible / netFillingRate;
      if (timeLeft <= timeToRefill) {
        const transferred = Math.min(aquifer, timeLeft * siphonRate);
        aquifer -= transferred;
        totalSiphonedLiters += transferred;
        tower = Math.min(STAGE_THRESHOLDS.STAGE_0_NOMINAL_MIN, tower + (timeLeft * netFillingRate));
        timeLeft = 0;
      } else {
        const transferred = maxTransferPossible;
        aquifer -= transferred;
        totalSiphonedLiters += transferred;
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
