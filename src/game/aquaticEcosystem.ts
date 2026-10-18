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

export type ZoneUpgradeTier = 1 | 2 | 3 | 4 | 5;

export interface ZoneUpgradeTierDef {
  tier: ZoneUpgradeTier;
  name: string;
  stockCap: number;
  catchIntervalSec: number;
  spawnTickSec: number;
  costCoins: number;
  description: string;
  towerLitersCost?: number;
}

export const ZONE_UPGRADES: Record<WaterZoneId, Record<ZoneUpgradeTier, ZoneUpgradeTierDef>> = {
  zone_pond: {
    1: {
      tier: 1,
      name: 'Natural Basin',
      stockCap: 30,
      catchIntervalSec: 5.0,
      spawnTickSec: 10.0,
      costCoins: 0,
      description: 'Natural freshwater pond fed by surface rainwater.',
    },
    2: {
      tier: 2,
      name: 'Cobblestone Bank',
      stockCap: 52,
      catchIntervalSec: 4.6,
      spawnTickSec: 8.0,
      costCoins: 50000,
      description: 'Stabilized stone banks prevent silt runoff and enhance habitat volume.',
    },
    3: {
      tier: 3,
      name: 'Submerged Aerator Pipe',
      stockCap: 75,
      catchIntervalSec: 4.2,
      spawnTickSec: 6.6,
      costCoins: 250000,
      towerLitersCost: 50,
      description: 'Subsurface aerator connected to Gravity Tower boosts dissolved oxygen (-50L Tower).',
    },
    4: {
      tier: 4,
      name: 'Gravel Spawning Beds',
      stockCap: 97,
      catchIntervalSec: 3.8,
      spawnTickSec: 5.7,
      costCoins: 1200000,
      description: 'Specially filtered river gravel allows dense clutch spawning.',
    },
    5: {
      tier: 5,
      name: 'The Grand Estate Oasis',
      stockCap: 120,
      catchIntervalSec: 3.4,
      spawnTickSec: 5.0,
      costCoins: 5000000,
      description: 'Pristine palatial water body with optimal microclimate and biological mastery.',
    },
  },
  zone_river: {
    1: {
      tier: 1,
      name: 'Wild Brook',
      stockCap: 40,
      catchIntervalSec: 5.0,
      spawnTickSec: 12.0,
      costCoins: 0,
      description: 'Natural forest river stream flowing through woodland.',
    },
    2: {
      tier: 2,
      name: 'Boulder Weirs',
      stockCap: 70,
      catchIntervalSec: 4.6,
      spawnTickSec: 9.6,
      costCoins: 120000,
      description: 'Hand-placed boulder weirs create deep resting pools for migrating schools.',
    },
    3: {
      tier: 3,
      name: 'Riparian Willow Bank',
      stockCap: 100,
      catchIntervalSec: 4.2,
      spawnTickSec: 8.0,
      costCoins: 600000,
      description: 'Shaded root systems lower water temp and provide sheltered nurseries.',
    },
    4: {
      tier: 4,
      name: 'Shaded Fishway Chute',
      stockCap: 130,
      catchIntervalSec: 3.8,
      spawnTickSec: 6.8,
      costCoins: 3000000,
      description: 'Engineered bypass chutes accelerate fish travel and spawning returns.',
    },
    5: {
      tier: 5,
      name: 'Ancient River Sanctuary',
      stockCap: 160,
      catchIntervalSec: 3.4,
      spawnTickSec: 6.0,
      costCoins: 12000000,
      description: 'Legendary pristine river reserve with abundant endemic fish populations.',
    },
  },
  zone_estuary: {
    1: {
      tier: 1,
      name: 'Brackish Bay',
      stockCap: 50,
      catchIntervalSec: 5.0,
      spawnTickSec: 14.0,
      costCoins: 0,
      description: 'Natural coastal mangrove estuary where river meets sea.',
    },
    2: {
      tier: 2,
      name: 'Mangrove Nursery',
      stockCap: 87,
      catchIntervalSec: 4.6,
      spawnTickSec: 11.2,
      costCoins: 300000,
      description: 'Intertwined stilt roots shield juvenile fingerlings from open-water predators.',
    },
    3: {
      tier: 3,
      name: 'Tidal Sluice Gates',
      stockCap: 125,
      catchIntervalSec: 4.2,
      spawnTickSec: 9.3,
      costCoins: 1500000,
      description: 'Automated tidal gates regulate brackish salinity through tidal surges.',
    },
    4: {
      tier: 4,
      name: 'Oyster Reef Barrier',
      stockCap: 162,
      catchIntervalSec: 3.8,
      spawnTickSec: 8.0,
      costCoins: 8000000,
      description: 'Living bivalve reefs filter water and foster thriving crustacean feeding beds.',
    },
    5: {
      tier: 5,
      name: 'Royal Maritime Lagoon',
      stockCap: 200,
      catchIntervalSec: 3.4,
      spawnTickSec: 7.0,
      costCoins: 30000000,
      description: 'A vast, crystal-clear protected estuary teeming with high-value species.',
    },
  },
  zone_lake: {
    1: {
      tier: 1,
      name: 'Glacial Tarn',
      stockCap: 20,
      catchIntervalSec: 23.0,
      spawnTickSec: 73.6,
      costCoins: 0,
      description: 'High-altitude alpine glacial lake with crystal-cold water.',
    },
    2: {
      tier: 2,
      name: 'Sub-surface Rock Ledges',
      stockCap: 35,
      catchIntervalSec: 21.1,
      spawnTickSec: 58.8,
      costCoins: 800000,
      description: 'Submerged granite shelves provide sheltered beds amidst cold waters.',
    },
    3: {
      tier: 3,
      name: 'Geothermal Vents',
      stockCap: 50,
      catchIntervalSec: 19.3,
      spawnTickSec: 49.0,
      costCoins: 4000000,
      description: 'Deep thermal fissures prevent bottom freezing and foster aquatic vegetation.',
    },
    4: {
      tier: 4,
      name: 'Glacial Melt Canal',
      stockCap: 65,
      catchIntervalSec: 17.4,
      spawnTickSec: 42.0,
      costCoins: 18000000,
      description: 'Regulated channels bring oxygen-rich meltwater directly to spawning grounds.',
    },
    5: {
      tier: 5,
      name: 'Summit Crystal Abyss',
      stockCap: 80,
      catchIntervalSec: 15.6,
      spawnTickSec: 36.8,
      costCoins: 65000000,
      description: 'Mythic sapphire-hued mountain reservoir of unparalleled biological purity.',
    },
  },
  zone_ocean: {
    1: {
      tier: 1,
      name: 'Timber Wharf',
      stockCap: 25,
      catchIntervalSec: 24.0,
      spawnTickSec: 96.0,
      costCoins: 0,
      description: 'Simple open saltwater pier reaching into the coastal ocean.',
    },
    2: {
      tier: 2,
      name: 'Reinforced Pilings',
      stockCap: 43,
      catchIntervalSec: 22.0,
      spawnTickSec: 76.8,
      costCoins: 2000000,
      description: 'Barnacle-encrusted pilings create an artificial reef ecosystem for schooling fish.',
    },
    3: {
      tier: 3,
      name: 'Deepwater Kelp Forest',
      stockCap: 62,
      catchIntervalSec: 20.1,
      spawnTickSec: 64.0,
      costCoins: 10000000,
      description: 'Towering submarine kelp canopies shelter pelagic and deep-sea predators.',
    },
    4: {
      tier: 4,
      name: 'Sunken Galleon Artificial Reef',
      stockCap: 81,
      catchIntervalSec: 18.2,
      spawnTickSec: 54.8,
      costCoins: 45000000,
      description: 'Submerged historical wreckage forms an impenetrable haven for rare ocean species.',
    },
    5: {
      tier: 5,
      name: 'Abyssal Trench Derrick',
      stockCap: 100,
      catchIntervalSec: 16.3,
      spawnTickSec: 48.0,
      costCoins: 150000000,
      description: 'State-of-the-art offshore facility extracting the deepest ocean bounty.',
    },
  },
};

export function getZoneUpgradeDef(zoneId: WaterZoneId, tier: ZoneUpgradeTier = 1): ZoneUpgradeTierDef {
  const safeTier = Math.min(5, Math.max(1, tier)) as ZoneUpgradeTier;
  return ZONE_UPGRADES[zoneId]?.[safeTier] || ZONE_UPGRADES[zoneId][1];
}

export function getZoneStockCap(zoneId: WaterZoneId, tier: ZoneUpgradeTier = 1): number {
  return getZoneUpgradeDef(zoneId, tier).stockCap;
}

export function getZoneBaseCatchIntervalSec(zoneId: WaterZoneId, tier: ZoneUpgradeTier = 1): number {
  return getZoneUpgradeDef(zoneId, tier).catchIntervalSec;
}

export function getZoneBaseSpawnTickSec(zoneId: WaterZoneId, tier: ZoneUpgradeTier = 1): number {
  return getZoneUpgradeDef(zoneId, tier).spawnTickSec;
}

export interface ZoneEcosystemData {
  currentStock: number;
  maxStock: number;
  spawnProgressSec: number;
  isDepleted: boolean;
  tier?: ZoneUpgradeTier;
}

export function createDefaultZoneEcosystem(): Record<WaterZoneId, ZoneEcosystemData> {
  return {
    zone_pond: {
      currentStock: 30,
      maxStock: 30,
      spawnProgressSec: 0,
      isDepleted: false,
      tier: 1,
    },
    zone_river: {
      currentStock: 40,
      maxStock: 40,
      spawnProgressSec: 0,
      isDepleted: false,
      tier: 1,
    },
    zone_estuary: {
      currentStock: 50,
      maxStock: 50,
      spawnProgressSec: 0,
      isDepleted: false,
      tier: 1,
    },
    zone_lake: {
      currentStock: 20,
      maxStock: 20,
      spawnProgressSec: 0,
      isDepleted: false,
      tier: 1,
    },
    zone_ocean: {
      currentStock: 25,
      maxStock: 25,
      spawnProgressSec: 0,
      isDepleted: false,
      tier: 1,
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
 * Delta t_spawn(active) = Delta t_spawn(base, tier) / (K_temp * K_volume)
 */
export function calculateActiveSpawnInterval(
  zoneId: WaterZoneId,
  tempC: number,
  waterVolume?: number,
  tier: ZoneUpgradeTier = 1
): {
  activeSpawnTickSec: number;
  kTemp: number;
  kVolume: number;
  isFrozen: boolean;
  isLowDepth: boolean;
} {
  const baseSpawnSec = getZoneBaseSpawnTickSec(zoneId, tier);
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
    ? baseSpawnSec / denominator
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
 * In low depth (<1500L), Farmstead Pond base interval doubles from its tier base.
 */
export function calculateActiveCatchIntervalMs(params: {
  zoneId: WaterZoneId;
  rodSpeedMultiplier: number;
  hasSlicker: boolean;
  overclockMultiplier?: number;
  waterVolume?: number;
  tier?: ZoneUpgradeTier;
}): number {
  const { zoneId, rodSpeedMultiplier, hasSlicker, overclockMultiplier = 1.0, waterVolume, tier = 1 } = params;
  const baseCatchSec = getZoneBaseCatchIntervalSec(zoneId, tier);
  let baseMs = baseCatchSec * 1000;

  if (zoneId === 'zone_pond' && waterVolume !== undefined && waterVolume < POND_HYDROLOGY.LOW_DEPTH_THRESHOLD_LITERS) {
    baseMs *= 2.0; // Low depth doubles catch duration
  }

  const speedMult = rodSpeedMultiplier * (hasSlicker ? 0.67 : 1.0);
  const effectiveMs = (baseMs * speedMult) / (overclockMultiplier || 1.0);
  return Math.max(1000, effectiveMs);
}

