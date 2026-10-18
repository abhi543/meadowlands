/**
 * Worker Hydration Metabolism & Climate-Coupled Thirst Engine
 * 
 * Implements:
 * 1. Hydrological Mass Conservation: Water consumed by active workers is deducted
 *    from Bunkhouse Water Canteen Cooler or Elevated Gravity Tower (800L).
 * 2. Climate-Scaled Intake: Consumption increases based on ambient temperature:
 *    - Baseline (T <= 26°C): 1.0 L / worker / 8h shift (K_heat = 1.0)
 *    - Moderate Warmth (27°C <= T <= 38°C): 1.5 L / worker / 8h shift (K_heat = 1.5)
 *    - Extreme Heatwave (T > 38°C): 2.0 L / worker / 8h shift (K_heat = 2.0)
 * 3. Three-Tier Hydration State Machine:
 *    - Dehydrated: 0L available -> -50% work speed, cannot sprint to emergencies, amber sweat badge
 *    - Hydrated: >= 1L available -> 100% work speed, standard task rates
 *    - Cold-Infused: Supplied with Citrus/Herb Tea -> +15% velocity, 100% Heatwave fatigue immunity
 * 4. Night Watch Replenishment Automation: Off-shift staff pump water from cistern/aquifer into coolers.
 */

export type WorkerHydrationState = 'dehydrated' | 'hydrated' | 'cold_infused';

export interface HydrationTelemetry {
  state: WorkerHydrationState;
  speedMultiplier: number;
  badgeEmoji: string;
  badgeText: string;
  badgeColorClass: string;
  heatwaveImmunity: boolean;
  canSprintEmergencies: boolean;
  intakeMultiplier: number;
  intakeLitersPerShift: number;
  intakeLitersPerSec: number;
  temperatureC: number;
  climateLabel: 'Normal' | 'Warm' | 'Heatwave';
}

export interface BunkhouseCanteenState {
  canteenLiters: number;
  canteenCapacityLiters: number;
  coldInfusedDrinks: number;
  autoRefillFromTower: boolean;
  nightWatchAutomation: boolean;
  totalWaterConsumedLiters: number;
}

export const CANTEEN_DEFAULT_CAPACITY_LITERS = 100;
export const SHIFT_DURATION_SECONDS = 600; // 10 real-world minutes = 8 in-game hours
export const BASELINE_INTAKE_LITERS_PER_SHIFT = 1.0;

/**
 * Returns climate heat multiplier K_heat(T) and category based on ambient temperature
 */
export function getClimateHeatMultiplier(temperatureC: number): {
  multiplier: number;
  category: 'Normal' | 'Warm' | 'Heatwave';
} {
  if (temperatureC > 38) {
    return { multiplier: 2.0, category: 'Heatwave' };
  }
  if (temperatureC >= 27) {
    return { multiplier: 1.5, category: 'Warm' };
  }
  return { multiplier: 1.0, category: 'Normal' };
}

/**
 * Calculates global water demand for an entire 8-hour shift for a group of active workers
 */
export function calculateShiftWaterDemand(workerCount: number, temperatureC: number): number {
  if (workerCount <= 0) return 0;
  const { multiplier } = getClimateHeatMultiplier(temperatureC);
  return workerCount * BASELINE_INTAKE_LITERS_PER_SHIFT * multiplier;
}

/**
 * Calculates continuous micro-tick water consumption for active workers over deltaSeconds
 */
export function calculateMicroTickWaterConsumption(
  workerCount: number,
  temperatureC: number,
  deltaSeconds: number
): number {
  if (workerCount <= 0 || deltaSeconds <= 0) return 0;
  const shiftDemand = calculateShiftWaterDemand(workerCount, temperatureC);
  // Rate in liters per second = shiftDemand / SHIFT_DURATION_SECONDS
  return (shiftDemand / SHIFT_DURATION_SECONDS) * deltaSeconds;
}

/**
 * Evaluates the current hydration telemetry and speed modifier for workers
 */
export function evaluateHydrationTelemetry(args: {
  temperatureC: number;
  canteenLiters: number;
  towerLiters: number;
  hasColdBeverage: boolean;
  isOvertime?: boolean;
}): HydrationTelemetry {
  const { temperatureC, canteenLiters, towerLiters, hasColdBeverage } = args;
  const { multiplier, category } = getClimateHeatMultiplier(temperatureC);

  const intakeLitersPerShift = BASELINE_INTAKE_LITERS_PER_SHIFT * multiplier;
  const intakeLitersPerSec = intakeLitersPerShift / SHIFT_DURATION_SECONDS;

  const totalAvailableWater = Math.max(0, canteenLiters) + Math.max(0, towerLiters);

  let state: WorkerHydrationState = 'hydrated';
  let speedMultiplier = 1.0;
  let badgeEmoji = '🥛';
  let badgeText = 'Hydrated (100% Speed)';
  let badgeColorClass = 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-400';
  let heatwaveImmunity = false;
  let canSprintEmergencies = true;

  if (hasColdBeverage) {
    // 3. Cold Infused (Premium)
    state = 'cold_infused';
    speedMultiplier = 1.15; // +15% work velocity buff
    badgeEmoji = '🧊';
    badgeText = 'Cold-Infused (+15% Speed)';
    badgeColorClass = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-400 animate-pulse';
    heatwaveImmunity = true;
    canSprintEmergencies = true;
  } else if (totalAvailableWater < 0.5) {
    // 1. Dehydrated (Thirsty)
    state = 'dehydrated';
    speedMultiplier = 0.5; // -50% work speed debuff
    badgeEmoji = '🥵';
    badgeText = 'Thirsty (50% Speed)';
    badgeColorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-500 animate-pulse font-bold';
    heatwaveImmunity = false;
    canSprintEmergencies = false; // Cannot sprint to emergencies
  } else {
    // 2. Hydrated (Sustained)
    state = 'hydrated';
    speedMultiplier = 1.0;
    badgeEmoji = '🥛';
    badgeText = 'Hydrated (100% Speed)';
    badgeColorClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-400';
    heatwaveImmunity = false;
    canSprintEmergencies = true;
  }

  return {
    state,
    speedMultiplier,
    badgeEmoji,
    badgeText,
    badgeColorClass,
    heatwaveImmunity,
    canSprintEmergencies,
    intakeMultiplier: multiplier,
    intakeLitersPerShift,
    intakeLitersPerSec,
    temperatureC,
    climateLabel: category,
  };
}

/**
 * Performs mass-conservation deduction from Canteen and Gravity Tower
 */
export function deductWorkerHydration(args: {
  amountLiters: number;
  currentCanteenLiters: number;
  currentTowerLiters: number;
}): {
  deductedLiters: number;
  newCanteenLiters: number;
  newTowerLiters: number;
  source: 'canteen' | 'tower' | 'both' | 'none';
} {
  const { amountLiters, currentCanteenLiters, currentTowerLiters } = args;
  if (amountLiters <= 0) {
    return {
      deductedLiters: 0,
      newCanteenLiters: currentCanteenLiters,
      newTowerLiters: currentTowerLiters,
      source: 'none',
    };
  }

  let remaining = amountLiters;
  let newCanteen = currentCanteenLiters;
  let newTower = currentTowerLiters;
  let source: 'canteen' | 'tower' | 'both' | 'none' = 'none';

  // 1. Deduct from Bunkhouse Canteen first
  if (newCanteen > 0) {
    const fromCanteen = Math.min(newCanteen, remaining);
    newCanteen -= fromCanteen;
    remaining -= fromCanteen;
    source = 'canteen';
  }

  // 2. Fall back to Elevated Gravity Tower
  if (remaining > 0 && newTower > 0) {
    const fromTower = Math.min(newTower, remaining);
    newTower -= fromTower;
    remaining -= fromTower;
    source = source === 'canteen' ? 'both' : 'tower';
  }

  const deductedLiters = amountLiters - remaining;
  return {
    deductedLiters: Math.round(deductedLiters * 100) / 100,
    newCanteenLiters: Math.max(0, Math.round(newCanteen * 100) / 100),
    newTowerLiters: Math.max(0, Math.round(newTower * 100) / 100),
    source,
  };
}

/**
 * Night Watch Replenishment Automation
 * Off-shift workers draw water from Cistern or Aquifer to keep the Staff Canteen stocked.
 */
export function executeNightWatchHydrationAutomation(args: {
  canteenLiters: number;
  canteenCapacity: number;
  cisternLiters: number;
  aquiferLiters: number;
  deltaSeconds: number;
  isNightShift: boolean;
}): {
  pumpedLiters: number;
  newCanteenLiters: number;
  newCisternLiters: number;
  newAquiferLiters: number;
  sourceUsed: 'cistern' | 'aquifer' | 'none';
} {
  const { canteenLiters, canteenCapacity, cisternLiters, aquiferLiters, deltaSeconds, isNightShift } = args;

  if (!isNightShift || canteenLiters >= canteenCapacity) {
    return {
      pumpedLiters: 0,
      newCanteenLiters: canteenLiters,
      newCisternLiters: cisternLiters,
      newAquiferLiters: aquiferLiters,
      sourceUsed: 'none',
    };
  }

  const space = canteenCapacity - canteenLiters;
  // Off-shift pumping speed: 12 Liters per minute (= 0.2 L/sec)
  const maxPumpStep = 0.2 * deltaSeconds;
  const desired = Math.min(space, maxPumpStep);

  let newCanteen = canteenLiters;
  let newCistern = cisternLiters;
  let newAquifer = aquiferLiters;
  let pumped = 0;
  let sourceUsed: 'cistern' | 'aquifer' | 'none' = 'none';

  // Draw from rain cistern first if available
  if (newCistern > 10) {
    const draw = Math.min(desired, newCistern - 10);
    newCistern -= draw;
    newCanteen += draw;
    pumped = draw;
    sourceUsed = 'cistern';
  } else if (newAquifer > 100) {
    // Draw from deep aquifer
    const draw = Math.min(desired, newAquifer - 100);
    newAquifer -= draw;
    newCanteen += draw;
    pumped = draw;
    sourceUsed = 'aquifer';
  }

  return {
    pumpedLiters: Math.round(pumped * 100) / 100,
    newCanteenLiters: Math.round(newCanteen * 100) / 100,
    newCisternLiters: Math.round(newCistern * 100) / 100,
    newAquiferLiters: Math.round(newAquifer * 100) / 100,
    sourceUsed,
  };
}
