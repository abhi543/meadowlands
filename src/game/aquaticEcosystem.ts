/**
 * Unified Dynamic Aquatic Ecosystem Engine
 *
 * Implements finite population stocks, mathematical replenishment/depletion dynamics,
 * closed-loop hydrological coupling with the Elevated Gravity Tower (800L),
 * and thermal climate sensitivity based on ambient temperature and weather.
 */

import { type WaterZoneId } from '@/game/data';

export type ZoneEcosystemId = 'farmsteadPond' | 'forestRiver' | 'coastalEstuary' | 'alpineMountain' | 'deepOceanPier';

export const ZONE_ID_TO_ALIAS: Record<WaterZoneId, ZoneEcosystemId> = {
  zone_pond: 'farmsteadPond',
  zone_river: 'forestRiver',
  zone_estuary: 'coastalEstuary',
  zone_lake: 'alpineMountain',
  zone_ocean: 'deepOceanPier',
};

export const ALIAS_TO_ZONE_ID: Record<ZoneEcosystemId, WaterZoneId> = {
  farmsteadPond: 'zone_pond',
  forestRiver: 'zone_river',
  coastalEstuary: 'zone_estuary',
  alpineMountain: 'zone_lake',
  deepOceanPier: 'zone_ocean',
};

export interface ZoneEcosystemConfig {
  zoneId: WaterZoneId;
  alias: ZoneEcosystemId;
  name: string;
  habitatClassification: 'Freshwater' | 'Brackish' | 'Saltwater';
  catchIntervalSec: number;        // T_catch
  stockCap: number;                // N_stock
  activeDepletionTimeSec: number;  // T_deplete = N_stock * T_catch
  tierMultiplier: number;          // M_tier
  replenishRatio: number;          // R = 2.0 * M_tier
  exactRechargeTimeSec: number;    // T_recharge = T_deplete * R
  singleFishSpawnTickSec: number;  // delta t_spawn = T_catch * 2.0 * M_tier
  hasHydrologicalCoupling: boolean;
}

export const ZONE_ECOSYSTEM_CONFIGS: Record<WaterZoneId, ZoneEcosystemConfig> = {
  zone_pond: {
    zoneId: 'zone_pond',
    alias: 'farmsteadPond',
    name: 'Farmstead Pond',
    habitatClassification: 'Freshwater',
    catchIntervalSec: 5,
    stockCap: 30,
    activeDepletionTimeSec: 150,      // 2m 30s
    tierMultiplier: 1.0,
    replenishRatio: 2.0,
    exactRechargeTimeSec: 300,        // 5m 00s
    singleFishSpawnTickSec: 10.0,
    hasHydrologicalCoupling: true,
  },
  zone_river: {
    zoneId: 'zone_river',
    alias: 'forestRiver',
    name: 'Forest River Stream',
    habitatClassification: 'Freshwater',
    catchIntervalSec: 5,
    stockCap: 40,
    activeDepletionTimeSec: 200,      // 3m 20s
    tierMultiplier: 1.2,
    replenishRatio: 2.4,
    exactRechargeTimeSec: 480,        // 8m 00s
    singleFishSpawnTickSec: 12.0,
    hasHydrologicalCoupling: false,
  },
  zone_estuary: {
    zoneId: 'zone_estuary',
    alias: 'coastalEstuary',
    name: 'Coastal Estuary',
    habitatClassification: 'Brackish',
    catchIntervalSec: 5,
    stockCap: 50,
    activeDepletionTimeSec: 250,      // 4m 10s
    tierMultiplier: 1.4,
    replenishRatio: 2.8,
    exactRechargeTimeSec: 700,        // 11m 40s
    singleFishSpawnTickSec: 14.0,
    hasHydrologicalCoupling: false,
  },
  zone_lake: {
    zoneId: 'zone_lake',
    alias: 'alpineMountain',
    name: 'Alpine Mountain Lake',
    habitatClassification: 'Freshwater',
    catchIntervalSec: 23,
    stockCap: 20,
    activeDepletionTimeSec: 460,      // 7m 40s
    tierMultiplier: 1.6,
    replenishRatio: 3.2,
    exactRechargeTimeSec: 1472,       // 24m 32s
    singleFishSpawnTickSec: 73.6,
    hasHydrologicalCoupling: false,
  },
  zone_ocean: {
    zoneId: 'zone_ocean',
    alias: 'deepOceanPier',
    name: 'Deep Ocean Pier',
    habitatClassification: 'Saltwater',
    catchIntervalSec: 24,
    stockCap: 25,
    activeDepletionTimeSec: 600,      // 10m 00s
    tierMultiplier: 2.0,
    replenishRatio: 4.0,
    exactRechargeTimeSec: 2400,       // 40m 00s
    singleFishSpawnTickSec: 96.0,
    hasHydrologicalCoupling: false,
  },
};

export const POND_HYDROLOGY = {
  MAX_CAPACITY_LITERS: 3000,
  INITIAL_VOLUME_LITERS: 3000,
  LOW_DEPTH_THRESHOLD_LITERS: 1500, // < 50%
  REFILL_DEDUCTION_LITERS: 100,
  OXYGENATED_SHOCK_BONUS_FISH: 5,
} as const;

export interface ZoneEcosystemData {
  currentStock: number;
  maxStock: number;
  spawnProgressSec: number;
  isDepleted: boolean;
}

export function createDefaultZoneEcosystem(): Record<WaterZoneId, ZoneEcosystemData> {
  return {
    zone_pond: {
      currentStock: 30,
      maxStock: 30,
      spawnProgressSec: 0,
      isDepleted: false,
    },
    zone_river: {
      currentStock: 40,
      maxStock: 40,
      spawnProgressSec: 0,
      isDepleted: false,
    },
    zone_estuary: {
      currentStock: 50,
      maxStock: 50,
      spawnProgressSec: 0,
      isDepleted: false,
    },
    zone_lake: {
      currentStock: 20,
      maxStock: 20,
      spawnProgressSec: 0,
      isDepleted: false,
    },
    zone_ocean: {
      currentStock: 25,
      maxStock: 25,
      spawnProgressSec: 0,
      isDepleted: false,
    },
  };
}

/**
 * Determines whether a zone's fishing should remain paused/depleted.
 * Strict full-replenishment rule:
 * Once depleted (currentStock <= 0 or isDepleted === true), fishing is paused
 * until the population has fully recharged to 100% capacity (currentStock >= maxStock).
 * Only once currentStock >= maxStock does isDepleted clear to false and fishing resume.
 */
export function isZoneFishingPaused(currentStock: number, maxStock: number, isDepleted: boolean): boolean {
  if (isDepleted) {
    return currentStock < maxStock;
  }
  return currentStock <= 0;
}


/**
 * Calculates continuous thermodynamic evaporative water loss for Farmstead Pond.
 *
 * Formula:
 * Delta V_pond = -E_rate * (1 + (T - 20) / 25) * (1.0 - (H * 0.6)) * Delta t_minutes
 * - At T <= 20°C: Minimal evaporative loss (-1.0 L/min)
 * - At T = 42°C (Heatwave): Evaporative loss peaks at -3.5 L/min
 * - At H >= 90% (Rain/Fog): Evaporative loss drops to 0.0 L/min
 */
export function calculatePondEvaporationLitersPerMin(
  temperatureC: number,
  relativeHumidityPct: number
): number {
  if (relativeHumidityPct >= 90) {
    return 0.0;
  }
  const H = Math.max(0, Math.min(1, relativeHumidityPct / 100));
  const humidityFactor = Math.max(0, 1.0 - (H * 0.6));

  if (temperatureC <= 20) {
    // Minimal evaporative loss (-1.0 L/min)
    return Math.max(0.5, Number((1.0 * humidityFactor).toFixed(2)));
  }

  // Thermal scaling: peaks at 3.5 L/min at 42°C in Heatwave conditions
  const tempScale = 1.0 + (temperatureC - 20) / 25;
  const baseRate = 2.085;
  const loss = baseRate * tempScale * humidityFactor;
  return Math.min(3.5, Math.max(1.0, Number(loss.toFixed(2))));
}

export interface ClimateSensitivityResult {
  kTemp: number;
  isFrozen: boolean;
  statusBadge: string;
  statusLabel: string;
  colorClass: string;
}

/**
 * Climate Sensitivity Matrix (K_temp)
 * Evaluates biological replenishment multiplier based on water zone and ambient temperature.
 */
export function calculateClimateSensitivity(
  zoneId: WaterZoneId,
  tempC: number
): ClimateSensitivityResult {
  let frostVal = 1.0;
  let heatVal = 1.0;

  switch (zoneId) {
    case 'zone_pond':
      frostVal = 0.0; // 0.0 (Frozen)
      heatVal = 0.60; // 0.60 (-40% Speed)
      break;
    case 'zone_river':
      frostVal = 0.85; // 0.85 (Slow)
      heatVal = 1.00; // 1.00 (Current Cool)
      break;
    case 'zone_estuary':
      frostVal = 0.70; // 0.70 (Slow)
      heatVal = 0.90; // 0.90 (Tidal Flow)
      break;
    case 'zone_lake':
      frostVal = 1.25; // 1.25 (+25%)
      heatVal = 0.50; // 0.50 (Overheated)
      break;
    case 'zone_ocean':
      frostVal = 1.00; // 1.00 (Immune)
      heatVal = 1.00; // 1.00 (Immune)
      break;
  }

  let kTemp = 1.0;
  let statusBadge = '1.0x Normal';
  let statusLabel = 'Mild Equilibrium';
  let colorClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
  let isFrozen = false;

  if (tempC < 2) {
    kTemp = frostVal;
    if (kTemp === 0.0) {
      isFrozen = true;
      statusBadge = '🧊 Frozen (0.0x)';
      statusLabel = 'Surface Bed Frozen (<2°C)';
      colorClass = 'text-sky-400 bg-sky-950/60 border-sky-400 animate-pulse';
    } else if (kTemp > 1.0) {
      statusBadge = `❄️ +${Math.round((kTemp - 1) * 100)}% (${kTemp.toFixed(2)}x)`;
      statusLabel = 'Cold-Adapted Surge (Alpine)';
      colorClass = 'text-cyan-400 bg-cyan-950/50 border-cyan-400';
    } else {
      statusBadge = `❄️ Slow (${kTemp.toFixed(2)}x)`;
      statusLabel = 'Cold Water Sluggish';
      colorClass = 'text-blue-400 bg-blue-950/50 border-blue-400';
    }
  } else if (tempC > 38) {
    kTemp = heatVal;
    if (kTemp < 1.0) {
      const penalty = Math.round((1 - kTemp) * 100);
      statusBadge = `🔥 -${penalty}% (${kTemp.toFixed(2)}x)`;
      statusLabel = 'Thermal Deoxygenation Stress (>38°C)';
      colorClass = 'text-amber-500 bg-amber-950/50 border-amber-500';
    } else {
      statusBadge = '🌊 Immune (1.0x)';
      statusLabel = 'Thermal Barrier / Current Buffer';
      colorClass = 'text-emerald-500 bg-emerald-950/40 border-emerald-500';
    }
  } else if (tempC >= 18 && tempC <= 26) {
    kTemp = 1.0;
    statusBadge = '✨ Optimal (1.0x)';
    statusLabel = 'Mild Climate (18–26°C)';
    colorClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400';
  } else if (tempC >= 2 && tempC < 18) {
    // Interpolate between frostVal and 1.0
    const factor = (tempC - 2) / (18 - 2);
    kTemp = Number((frostVal + factor * (1.0 - frostVal)).toFixed(3));
    statusBadge = `💧 ${kTemp.toFixed(2)}x`;
    statusLabel = 'Cool Waters';
    colorClass = 'text-sky-500 bg-sky-950/40 border-sky-400';
  } else {
    // 26 < tempC <= 38: interpolate between 1.0 and heatVal
    const factor = (tempC - 26) / (38 - 26);
    kTemp = Number((1.0 + factor * (heatVal - 1.0)).toFixed(3));
    statusBadge = `☀️ ${kTemp.toFixed(2)}x`;
    statusLabel = 'Warm Waters';
    colorClass = 'text-amber-500 bg-amber-950/40 border-amber-400';
  }

  return { kTemp, isFrozen, statusBadge, statusLabel, colorClass };
}

/**
 * Low Water Stress Trigger for Farmstead Pond:
 * If pond.waterVolume < 1500 (<50% capacity):
 * - Catch duration doubles (T_catch = 5s -> 10s)
 * - Natural spawning multiplier drops by half (K_volume = 0.5)
 * - Amber alert active
 */
export function calculateVolumeMultiplier(zoneId: WaterZoneId, waterVolume?: number): {
  kVolume: number;
  isLowDepth: boolean;
  alertText: string | null;
} {
  if (zoneId !== 'zone_pond') {
    return { kVolume: 1.0, isLowDepth: false, alertText: null };
  }
  const vol = waterVolume !== undefined ? waterVolume : POND_HYDROLOGY.INITIAL_VOLUME_LITERS;
  if (vol < POND_HYDROLOGY.LOW_DEPTH_THRESHOLD_LITERS) {
    return {
      kVolume: 0.5,
      isLowDepth: true,
      alertText: '⚠️ LOW DEPTH: Fish crowded and sluggish',
    };
  }
  return { kVolume: 1.0, isLowDepth: false, alertText: null };
}

/**
 * Calculates active spawn interval:
 * Delta t_spawn(active) = Delta t_spawn(base) / (K_temp * K_volume)
 */
export function calculateActiveSpawnInterval(
  zoneId: WaterZoneId,
  tempC: number,
  waterVolume?: number
): {
  activeSpawnTickSec: number;
  kTemp: number;
  kVolume: number;
  isFrozen: boolean;
  isLowDepth: boolean;
} {
  const cfg = ZONE_ECOSYSTEM_CONFIGS[zoneId];
  const { kTemp, isFrozen } = calculateClimateSensitivity(zoneId, tempC);
  const { kVolume, isLowDepth } = calculateVolumeMultiplier(zoneId, waterVolume);

  if (isFrozen || kTemp <= 0) {
    return {
      activeSpawnTickSec: Infinity,
      kTemp: 0,
      kVolume,
      isFrozen: true,
      isLowDepth,
    };
  }

  const denominator = kTemp * kVolume;
  const activeSpawnTickSec = denominator > 0
    ? cfg.singleFishSpawnTickSec / denominator
    : Infinity;

  return {
    activeSpawnTickSec,
    kTemp,
    kVolume,
    isFrozen,
    isLowDepth,
  };
}

/**
 * Calculates effective catch interval in milliseconds.
 * In low depth (<1500L), Farmstead Pond base interval doubles from 5s to 10s.
 */
export function calculateActiveCatchIntervalMs(params: {
  zoneId: WaterZoneId;
  rodSpeedMultiplier: number;
  hasSlicker: boolean;
  overclockMultiplier?: number;
  waterVolume?: number;
}): number {
  const { zoneId, rodSpeedMultiplier, hasSlicker, overclockMultiplier = 1.0, waterVolume } = params;
  const cfg = ZONE_ECOSYSTEM_CONFIGS[zoneId];
  let baseMs = cfg.catchIntervalSec * 1000;

  if (zoneId === 'zone_pond' && waterVolume !== undefined && waterVolume < POND_HYDROLOGY.LOW_DEPTH_THRESHOLD_LITERS) {
    baseMs *= 2.0; // Low depth doubles catch duration (5s -> 10s)
  }

  const speedMult = rodSpeedMultiplier * (hasSlicker ? 0.67 : 1.0);
  const effectiveMs = (baseMs * speedMult) / (overclockMultiplier || 1.0);
  return Math.max(1000, effectiveMs);
}
