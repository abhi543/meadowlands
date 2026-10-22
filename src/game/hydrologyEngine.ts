/**
 * Closed-Loop Hydrological Estate Simulation Engine
 * 
 * Implements physical fluid dynamics, finite mass conservation,
 * gravity-fed canal network routing, diurnal thermal evaporation,
 * capillary soil moisture spectrum, and shift-based worker duties.
 */

import { type CircadianClockInfo } from '@/game/shiftEngine';
import {
  simulateOverflowSurgeTick,
  TOWER_STORAGE_TIERS,
  getTowerLoadSheddingStage,
} from '@/game/hydraulicFailSafeEngine';
import {
  WEATHER_PROFILES,
  type WeatherProfileId,
  type WeatherCategoryId,
  type AtmosphericWeatherState,
  createDefaultWeatherState,
  calculateThermodynamicEvaporationRatePctPerMin,
  rollNextNaturalWeather,
  CROP_PHENOLOGY_REGISTRY,
  evaluateCropPhenology,
  type CropPhenologyResult,
  type CropPhenologyMeta,
} from '@/game/weatherEngine';

export {
  WEATHER_PROFILES,
  type WeatherProfileId,
  type WeatherCategoryId,
  type AtmosphericWeatherState,
  createDefaultWeatherState,
  calculateThermodynamicEvaporationRatePctPerMin,
  rollNextNaturalWeather,
  CROP_PHENOLOGY_REGISTRY,
  evaluateCropPhenology,
  type CropPhenologyResult,
  type CropPhenologyMeta,
};

// --- Physical Conversion Constants ---
export const LITERS_PER_PERCENT_MOISTURE_PER_PLOT = 2.5; // 1% moisture on 1 plot = 2.5 Liters of water
export const FIXED_ESTATE_PLOTS_COUNT = 12; // 2 rows of 6 plots

// --- Reservoir Capacities ---
export const ELEVATED_TOWER_CAPACITY = 800; // Liters
export const AQUIFER_CAPACITY = 3000; // Liters (groundwater table)
export const AQUIFER_NATURAL_RECHARGE_RATE_L_MIN = 8.0; // +8 Liters / real minute (+0.1333 L/sec)
export const PERCOLATION_FEEDBACK_FRACTION = 0.30; // 30% of applied irrigation returns to aquifer

// --- High-Level Water Storage Capacity Tiers ---
export interface StorageTierConfig {
  tier: number;
  name: string;
  shortName: string;
  capacityLiters: number;
  costCoins: number;
  minLevel: number;
  description: string;
  badge: string;
  icon: string;
}

export const CISTERN_STORAGE_TIERS: Record<number, StorageTierConfig> = {
  1: { tier: 1, name: 'Basic Rain Catchment Cistern', shortName: 'Tier 1 • Rain Basin', capacityLiters: 1500, costCoins: 0, minLevel: 1, description: 'Hand-hewn clay lined surface collection basin (1,500L).', badge: 'Tier 1 • 1,500L', icon: '🌧️' },
  2: { tier: 2, name: 'Deep Ground Brick Cistern', shortName: 'Tier 2 • Brick Cistern', capacityLiters: 5000, costCoins: 30000, minLevel: 3, description: 'Fired brick retention vault collecting overland runoff (5,000L).', badge: 'Tier 2 • 5,000L', icon: '🧱' },
  3: { tier: 3, name: 'Monolithic Stone Basin', shortName: 'Tier 3 • Stone Basin', capacityLiters: 15000, costCoins: 95000, minLevel: 5, description: 'Durable granite reservoir holding 15,000L with silt traps.', badge: 'Tier 3 • 15,000L', icon: '🏺' },
  4: { tier: 4, name: 'Industrial Subsoil Vault', shortName: 'Tier 4 • Subsoil Vault', capacityLiters: 35000, costCoins: 280000, minLevel: 7, description: 'Massive subterranean concrete vault storing 35,000L of precipitation.', badge: 'Tier 4 • 35,000L', icon: '🏭' },
  5: { tier: 5, name: 'Colossal Hydro-Retention Citadel', shortName: 'Tier 5 • Mega-Basin', capacityLiters: 75000, costCoins: 850000, minLevel: 10, description: 'Titan estate storm lake holding 75,000L of pure captured rainwater!', badge: 'Tier 5 • 75,000L', icon: '🌊' },
};

export const AQUIFER_STORAGE_TIERS: Record<number, StorageTierConfig> = {
  1: { tier: 1, name: 'Natural Groundwater Table', shortName: 'Tier 1 • Water Table', capacityLiters: 3000, costCoins: 0, minLevel: 1, description: 'Natural shallow water table baseline capacity (3,000L).', badge: 'Tier 1 • 3,000L', icon: '🚰' },
  2: { tier: 2, name: 'Perforated Casing Borehole', shortName: 'Tier 2 • Borehole Well', capacityLiters: 7500, costCoins: 35000, minLevel: 3, description: 'Steel-sleeved deep borehole reaching pressurized strata (7,500L).', badge: 'Tier 2 • 7,500L', icon: '🔩' },
  3: { tier: 3, name: 'Subterranean Cavern Reservoir', shortName: 'Tier 3 • Limestone Cavern', capacityLiters: 18000, costCoins: 110000, minLevel: 5, description: 'Tapped subterranean limestone chamber storing 18,000L groundwater.', badge: 'Tier 3 • 18,000L', icon: '🪨' },
  4: { tier: 4, name: 'Artesian Geothermal Aquifer', shortName: 'Tier 4 • Artesian Table', capacityLiters: 35000, costCoins: 320000, minLevel: 7, description: 'High-pressure self-rising artesian strata holding 35,000L.', badge: 'Tier 4 • 35,000L', icon: '🌋' },
  5: { tier: 5, name: 'Abyssal Hydro-Titan Vault', shortName: 'Tier 5 • Abyssal Reserve', capacityLiters: 80000, costCoins: 1000000, minLevel: 10, description: 'Infinite-depth planetary crust aquifer storing 80,000L subterranean reserve!', badge: 'Tier 5 • 80,000L', icon: '💎' },
};

// Homestead Rain Cistern Capacities scaling with Farm Level or Cistern Tier
export function getCisternCapacity(farmLevel: number, tier?: number): number {
  if (tier && CISTERN_STORAGE_TIERS[tier]) {
    return CISTERN_STORAGE_TIERS[tier].capacityLiters;
  }
  if (farmLevel <= 1) return 1500;
  if (farmLevel <= 3) return 5000;
  if (farmLevel <= 5) return 15000;
  if (farmLevel <= 7) return 35000;
  return 75000;
}


// Inflow rates for precipitation (Liters / real minute)
export const WEATHER_INFLOW_RATES = {
  clear: 0,
  light_rain: 45,
  downpour: 120, // or storm
} as const;

export type HydrologyWeatherCondition = WeatherProfileId | keyof typeof WEATHER_INFLOW_RATES;


// --- Canal Progression (4 Tiers) ---
export type CanalTier = 1 | 2 | 3 | 4;

export interface CanalTierConfig {
  tier: CanalTier;
  name: string;
  shortName: string;
  minLevel: number;
  costCoins: number;
  seepageLossFraction: number; // Tier 1: 0.35, Tier 2+: 0.0
  morningEvaporationRatePctPerMin: number; // Tier 1-2: 3.0%, Tier 3+: 1.5%
  maxSaturationCapPct: number; // Tier 1-2: 100.0%, Tier 3+: 80.0% (No Root Rot possible)
  autoCutoffSupported: boolean;
  sprinklerPulseSupported: boolean;
  description: string;
  badge: string;
  icon: string;
}

export const CANAL_TIER_CONFIGS: Record<CanalTier, CanalTierConfig> = {
  1: {
    tier: 1,
    name: 'Hand-Dug Earthen Furrows',
    shortName: 'Earthen Furrows',
    minLevel: 1,
    costCoins: 0,
    seepageLossFraction: 0.35, // 35% seepage loss
    morningEvaporationRatePctPerMin: 3.0,
    maxSaturationCapPct: 100.0,
    autoCutoffSupported: false,
    sprinklerPulseSupported: false,
    description: 'Unlined dirt trenches. 35% of released water seeps into uncultivated turf.',
    badge: 'Tier 1 • Furrows',
    icon: '🪵',
  },
  2: {
    tier: 2,
    name: 'Clay-Lined Canals & Mechanical Sluices',
    shortName: 'Clay-Lined Canals',
    minLevel: 3,
    costCoins: 20000,
    seepageLossFraction: 0.0, // 0% transit seepage
    morningEvaporationRatePctPerMin: 3.0,
    maxSaturationCapPct: 100.0,
    autoCutoffSupported: true,
    sprinklerPulseSupported: false,
    description: 'Fired impermeable clay beds. 0% transit loss with threshold auto-shutoff gates.',
    badge: 'Tier 2 • Clay Sluices',
    icon: '🧱',
  },
  3: {
    tier: 3,
    name: 'Subterranean Porous Tile Drains',
    shortName: 'Porous Tile Drains',
    minLevel: 5,
    costCoins: 75000,
    seepageLossFraction: 0.0,
    morningEvaporationRatePctPerMin: 1.5, // 50% evaporation discount during morning heat
    maxSaturationCapPct: 80.0, // Caps at 80% -> Root Rot physically impossible!
    autoCutoffSupported: true,
    sprinklerPulseSupported: false,
    description: 'Underground clay pipes releasing directly into root zones. Evaporation halved and Root Rot impossible.',
    badge: 'Tier 3 • Tile Drains',
    icon: '🏺',
  },
  4: {
    tier: 4,
    name: 'Pressurized Brass Sprinkler Lattice',
    shortName: 'Brass Sprinklers',
    minLevel: 7,
    costCoins: 220000,
    seepageLossFraction: 0.0,
    morningEvaporationRatePctPerMin: 1.5,
    maxSaturationCapPct: 80.0,
    autoCutoffSupported: true,
    sprinklerPulseSupported: true, // Senses <42% and pulses to 75%
    description: 'Automated pressure grid. Detects parched plots (<42%) and pulses water to 75% automatically.',
    badge: 'Tier 4 • Sprinklers',
    icon: '⚙️',
  },
};

export function getCanalTierForLevel(level: number): CanalTier {
  if (level >= 7) return 4;
  if (level >= 5) return 3;
  if (level >= 3) return 2;
  return 1;
}

// --- Soil Moisture Dynamics ---
export type MoistureZoneId = 'desiccated' | 'parched' | 'optimal' | 'saturated' | 'waterlogged';

export interface MoistureZoneInfo {
  id: MoistureZoneId;
  name: string;
  minPct: number;
  maxPct: number;
  growthSpeedMultiplier: number; // Desiccated: 0.0, Parched: 0.6 (-40%), Optimal: 1.15 (+15%), Saturated: 1.0, Waterlogged: 1.0
  colorClass: string;
  badgeText: string;
  textureDescription: string;
  qualityRollEligible: boolean;
}

export const MOISTURE_ZONES: Record<MoistureZoneId, MoistureZoneInfo> = {
  desiccated: {
    id: 'desiccated',
    name: 'Desiccated Earth',
    minPct: 0.0,
    maxPct: 15.0,
    growthSpeedMultiplier: 0.0, // 100% halted
    colorClass: 'text-rose-400 bg-rose-950/80 border-rose-500/60',
    badgeText: '0x Halted',
    textureDescription: 'Pale, dusty tan with cracked polygon lines',
    qualityRollEligible: false,
  },
  parched: {
    id: 'parched',
    name: 'Parched Soil',
    minPct: 15.01,
    maxPct: 40.0,
    growthSpeedMultiplier: 0.60, // -40% growth penalty
    colorClass: 'text-amber-400 bg-amber-950/80 border-amber-500/60',
    badgeText: '-40% Speed',
    textureDescription: 'Dry, crumbly clay with faint fissures',
    qualityRollEligible: false,
  },
  optimal: {
    id: 'optimal',
    name: 'Optimal Capillary Moisture',
    minPct: 40.01,
    maxPct: 80.0,
    growthSpeedMultiplier: 1.15, // +15% Maturation Speed Acceleration
    colorClass: 'text-emerald-300 bg-emerald-950/80 border-emerald-400/80',
    badgeText: '+15% Sweet Spot',
    textureDescription: 'Rich, dark chocolate loam with aerated glistening particles',
    qualityRollEligible: true, // Unlocks Gold and Prismatic quality rolls
  },
  saturated: {
    id: 'saturated',
    name: 'Saturated Ground',
    minPct: 80.01,
    maxPct: 95.0,
    growthSpeedMultiplier: 1.0, // Normal speed
    colorClass: 'text-cyan-300 bg-cyan-950/80 border-cyan-400/60',
    badgeText: '1.0x Standard',
    textureDescription: 'Damp, heavy soil with surface sheen',
    qualityRollEligible: false,
  },
  waterlogged: {
    id: 'waterlogged',
    name: 'Waterlogged / Flooded',
    minPct: 95.01,
    maxPct: 100.0,
    growthSpeedMultiplier: 1.0,
    colorClass: 'text-blue-300 bg-blue-950/90 border-blue-400/80 animate-pulse',
    badgeText: '⚠️ Root Rot Hazard',
    textureDescription: 'Standing surface puddles with rising bubble reflections',
    qualityRollEligible: false,
  },
};

export function getMoistureZone(moisturePct: number): MoistureZoneInfo {
  const m = Math.max(0, Math.min(100, moisturePct));
  if (m <= 15.0) return MOISTURE_ZONES.desiccated;
  if (m <= 40.0) return MOISTURE_ZONES.parched;
  if (m <= 80.0) return MOISTURE_ZONES.optimal;
  if (m <= 95.0) return MOISTURE_ZONES.saturated;
  return MOISTURE_ZONES.waterlogged;
}

// Diurnal Evaporation Rates (% moisture per real minute)
export function getDiurnalEvaporationRatePctPerMin(
  cycleElapsedSeconds: number,
  canalTier: CanalTier
): { ratePctPerMin: number; phaseName: string; solarLabel: string } {
  // 30m Game Day: 0..600s Morning Shift (10 min, 06:00 to 14:00)
  // 600..1800s: Night Rest (20 min, 14:00 to 06:00)
  const tierDef = CANAL_TIER_CONFIGS[canalTier];

  if (cycleElapsedSeconds < 600) {
    const rate = tierDef.morningEvaporationRatePctPerMin;
    return {
      ratePctPerMin: rate,
      phaseName: 'Morning Shift (10m)',
      solarLabel: tierDef.tier >= 3 ? 'Midday Heat (Tile Dampened: -1.5%/min)' : 'High Sun (-3.0%/min)',
    };
  } else {
    return {
      ratePctPerMin: 0.5,
      phaseName: 'Night Rest (20m)',
      solarLabel: 'Night Cool Condensation (-0.5%/min)',
    };
  }
}

// Time constants for hazards:
export const DESICCATION_WITHER_DURATION_SEC = 1800; // 30 real minutes (1 in-game day)
export const ROOT_ROT_HAZARD_DURATION_SEC = 240; // 4 real minutes (standing water)

export function resolveWeatherProfileId(condition: HydrologyWeatherCondition | undefined): WeatherProfileId {
  if (!condition || condition === 'clear') return 'sunny';
  if (condition === 'light_rain') return 'drizzle';
  if (condition === 'downpour') return 'rain';
  if (condition in WEATHER_PROFILES) return condition as WeatherProfileId;
  return 'sunny';
}

// --- Hydrology State Interface ---
export interface HydrologyState {
  // A. Surface Rain Cistern & Retention Basin
  cisternLiters: number;
  cisternMaxLiters: number;
  weatherCondition: HydrologyWeatherCondition;
  weatherState?: AtmosphericWeatherState;
  isRainbowActive?: boolean;
  isSluiceFrozen?: boolean;
  
  // B. Deep Subterranean Aquifer
  aquiferLiters: number;
  aquiferCapacityLiters: number;
  isAquiferStressed: boolean;
  hasSedimentInLine: boolean;
  
  // C. Elevated Gravity Cistern Tower
  towerLiters: number;
  towerCapacityLiters: number;
  towerTier?: number;
  cisternTier?: number;
  aquiferTier?: number;
  
  // D. Canals & Sluice Gates
  canalTier: CanalTier;
  sluiceGatesOpen: boolean;
  autoShutoffMoisture: number; // default: 75%
  liveDischargeLitersPerSec: number;
  isCloggedWithDebris: boolean;
  dewHarvestedToday: boolean;
  lastSluiceMorningDay: number;
  lastPumpMorningDay?: number;
  hasReinforcedSluiceSeal?: boolean;
  sluiceSealsCount?: number;

  // E. Flash Flood Crisis & Emergency Spillway Dynamics
  isFlashFloodActive?: boolean;
  isSpillwayOpen?: boolean;
  spillwayDivertingLitersPerSec?: number;
  floodHazardRemainingSec?: number;
  wasFloodControlled?: boolean;
  floodTriggeredAt?: number | null;
  
  // F. Fail-Safe Load-Shedding & Emergency Siphon
  loadSheddingStage?: 0 | 1 | 2 | 3;
  isCropConservationActive?: boolean;
  isCrewRationingActive?: boolean;
  isCryoStandbyActive?: boolean;
  cryoStandbyStartedAt?: number | null;
  isSiphonActive?: boolean;
  siphonTransferRateLps?: number;
  totalSiphonedLiters?: number;
  siphonMode?: 'continuous' | 'emergency';
  siphonSourcePreference?: 'smart_highest' | 'cistern' | 'aquifer';
  siphonActiveSource?: 'cistern' | 'aquifer' | null;
  siphonSourceBreakdown?: { fromCistern: number; fromAquifer: number };
  
  // G. Automated Hydraulic Rule: Full-Reserve Pressure Surge
  isOverflowSurgeActive?: boolean;
  overflowSurgeSource?: 'cistern' | 'aquifer' | null;
  overflowSurgeLps?: number;
  
  // Telemetry
  totalWaterDischargedLiters: number;
  totalPercolatedLiters: number;
}

/**
 * Returns total available pressurized water stock in liters across Tower and Cistern reservoirs.
 */
export function getAvailableHydrologyWater(hydrology?: HydrologyState | null): number {
  if (!hydrology) return 0;
  return Math.floor((hydrology.towerLiters || 0) + (hydrology.cisternLiters || 0));
}

/**
 * Deducts specified liters of water from the estate's reserves (prioritizing Tower, then Cistern).
 */
export function deductHydrologyWater(hydrology: HydrologyState, amountLiters: number): HydrologyState {
  let remaining = amountLiters;
  let newTower = hydrology.towerLiters || 0;
  let newCistern = hydrology.cisternLiters || 0;

  if (newTower >= remaining) {
    newTower -= remaining;
    remaining = 0;
  } else {
    remaining -= newTower;
    newTower = 0;
    newCistern = Math.max(0, newCistern - remaining);
  }

  return {
    ...hydrology,
    towerLiters: newTower,
    cisternLiters: newCistern,
  };
}

export function createDefaultHydrologyState(farmLevel: number = 1): HydrologyState {
  const cisternMax = getCisternCapacity(farmLevel);
  return {
    cisternLiters: Math.round(cisternMax * 0.6), // Start 60% full
    cisternMaxLiters: cisternMax,
    weatherCondition: 'sunny',
    weatherState: createDefaultWeatherState('sunny'),
    isRainbowActive: false,
    isSluiceFrozen: false,
    
    aquiferLiters: 2760, // 92% table depth of 3000L
    aquiferCapacityLiters: AQUIFER_CAPACITY,
    isAquiferStressed: false,
    hasSedimentInLine: false,
    
    towerLiters: 650, // 650 / 800L
    towerCapacityLiters: ELEVATED_TOWER_CAPACITY,
    towerTier: 1,
    cisternTier: 1,
    aquiferTier: 1,
    
    canalTier: getCanalTierForLevel(farmLevel),
    sluiceGatesOpen: false,
    autoShutoffMoisture: 75,
    liveDischargeLitersPerSec: 0,
    isCloggedWithDebris: false,
    dewHarvestedToday: false,
    lastSluiceMorningDay: 0,
    lastPumpMorningDay: 0,
    hasReinforcedSluiceSeal: false,
    sluiceSealsCount: 0,

    isFlashFloodActive: false,
    isSpillwayOpen: false,
    spillwayDivertingLitersPerSec: 0,
    floodHazardRemainingSec: 180,
    wasFloodControlled: false,
    floodTriggeredAt: null,
    
    loadSheddingStage: 0,
    isCropConservationActive: false,
    isCrewRationingActive: false,
    isCryoStandbyActive: false,
    cryoStandbyStartedAt: null,
    isSiphonActive: false,
    siphonTransferRateLps: 0,
    totalSiphonedLiters: 0,
    siphonMode: 'continuous',
    siphonSourcePreference: 'smart_highest',
    siphonActiveSource: null,
    siphonSourceBreakdown: { fromCistern: 0, fromAquifer: 0 },

    isOverflowSurgeActive: false,
    overflowSurgeSource: null,
    overflowSurgeLps: 0,
    
    totalWaterDischargedLiters: 0,
    totalPercolatedLiters: 0,
  };
}

export interface HydrologySimulationResult {
  updatedHydrology: HydrologyState;
  updatedPlots: any[];
  notifications: Array<{ text: string; icon: string; type: 'info' | 'coin' | 'event' }>;
}

/**
 * Validates whether the master canal sluice gates can be opened.
 * Enforces tower volume prerequisites, debris blockage, freezing state,
 * and the Safety Cut-Off Dial logic (triggering cutoff only when plots reach >= targetMoisture).
 * CRITICAL: Wilted and low-moisture (<15%) plots MUST ALWAYS be allowed to open gates!
 */
export function canOpenGates(
  hydrology: HydrologyState | undefined,
  plots: any[] = [],
  unlockedPlots: number = 12
): { canOpen: boolean; reason?: string } {
  if (!hydrology) return { canOpen: true };

  // 1. Tower Volume Prerequisite & Load-Shedding Gatekeeper
  if ((hydrology.towerLiters ?? 0) <= 200) {
    return {
      canOpen: false,
      reason: (hydrology.towerLiters ?? 0) <= 0
        ? 'Elevated Gravity Tower is empty (0L)! Transfer from Rain Cistern or pump from Deep Aquifer first.'
        : `Elevated Gravity Tower in Crop Conservation Mode (${Math.round(hydrology.towerLiters)}L ≤ 200L). Water conserved for crew hydration & Bio-Lab.`,
    };
  }

  // 2. Physical Canal Grate Blockages
  if (hydrology.isCloggedWithDebris) {
    return {
      canOpen: false,
      reason: 'Canal grates are clogged with silt & debris! Clear grates first.',
    };
  }

  // 3. Sub-Zero Frost Freezing (Tier 1 earthen trenches)
  if (hydrology.isSluiceFrozen) {
    return {
      canOpen: false,
      reason: 'Earthen canal furrows are frozen solid! Upgrade to Tier 2 clay canals.',
    };
  }

  // Player manual control ALWAYS permits opening gates when tower has water and channels are clear!
  return { canOpen: true };
}

/**
 * Step simulation for Hydrological Dynamics during the main tick.
 * Handles finite fluid transfer, gravity sluice distribution,
 * circadian evaporation, rain catchment, percolation feedback,
 * root rot hazards, and desiccation withering.
 */
export function stepHydrologySimulation(params: {
  hydrology: HydrologyState;
  plots: any[];
  unlockedPlots: number;
  farmLevel: number;
  cycleElapsedSeconds: number;
  currentDay: number;
  deltaSeconds: number;
  isRainstormActive: boolean;
  hasFieldHandMorningDuty: boolean;
  hasNightWatchDuty: boolean;
  isHardcoreMode?: boolean;
}): HydrologySimulationResult {
  const {
    hydrology,
    plots,
    unlockedPlots,
    farmLevel,
    cycleElapsedSeconds,
    currentDay,
    deltaSeconds,
    isRainstormActive,
    hasFieldHandMorningDuty,
    hasNightWatchDuty,
    isHardcoreMode = false,
  } = params;

  const dt = Math.max(0.1, Math.min(30, deltaSeconds)); // Clamp step
  const notifications: Array<{ text: string; icon: string; type: 'info' | 'coin' | 'event' }> = [];

  // 1. Maintain dynamic capacity scaling
  const effectiveCisternMax = getCisternCapacity(farmLevel);
  const effectiveTier = Math.max(hydrology.canalTier, getCanalTierForLevel(farmLevel)) as CanalTier;
  const tierConfig = CANAL_TIER_CONFIGS[effectiveTier];

  let currentCistern = Math.min(effectiveCisternMax, hydrology.cisternLiters);
  let currentTower = Math.min(hydrology.towerCapacityLiters, hydrology.towerLiters);
  let currentAquifer = Math.min(hydrology.aquiferCapacityLiters, hydrology.aquiferLiters);
  let isAquiferStressed = hydrology.isAquiferStressed;
  let hasSedimentInLine = hydrology.hasSedimentInLine;
  let sluiceGatesOpen = hydrology.sluiceGatesOpen;
  let isClogged = hydrology.isCloggedWithDebris;
  let dewHarvestedToday = hydrology.dewHarvestedToday;
  let lastSluiceMorningDay = hydrology.lastSluiceMorningDay;
  let lastPumpMorningDay = hydrology.lastPumpMorningDay ?? 0;
  let totalDischarged = hydrology.totalWaterDischargedLiters;
  let totalPercolated = hydrology.totalPercolatedLiters;
  let liveDischargeLitersPerSec = 0;

  // Flash Flood & Emergency Spillway Dynamics
  let isFlashFloodActive = Boolean(hydrology.isFlashFloodActive);
  let isSpillwayOpen = Boolean(hydrology.isSpillwayOpen);
  let floodHazardRemainingSec = hydrology.floodHazardRemainingSec !== undefined ? hydrology.floodHazardRemainingSec : 180;
  let floodTriggeredAt = hydrology.floodTriggeredAt || null;
  let wasFloodControlled = Boolean(hydrology.wasFloodControlled);
  let spillwayDivertingLitersPerSec = isSpillwayOpen ? 120 : 0;

  // 1. Weather determination & Automatic Dynamic Climate Front Progression
  let activeProfileId: WeatherProfileId = resolveWeatherProfileId(hydrology.weatherCondition);
  if (isRainstormActive && activeProfileId !== 'monsoon' && activeProfileId !== 'thunderstorm' && activeProfileId !== 'cyclone') {
    activeProfileId = 'thunderstorm';
  }

  // Automatic Dynamic Weather Cycling:
  // Weather shifts automatically once per 1-day game time (30 real minutes = 1,800s).
  // Day cycle: 10 minutes morning (0..600s, 06:00 to 14:00), 20 minutes night (600..1800s, 14:00 to 06:00).
  const WEATHER_1DAY_CYCLE_SEC = 1800; // 30 real minutes (1 full in-game day)
  let weatherStartedAt = hydrology.weatherState?.weatherStartedAt || Date.now();
  let weatherDurationSec = hydrology.weatherState?.weatherDurationSec || WEATHER_1DAY_CYCLE_SEC;
  // Upgrade old/legacy short weather durations (< 1800s) to 1800s (30 real minutes = 1 full day)
  if (weatherDurationSec < WEATHER_1DAY_CYCLE_SEC) {
    weatherDurationSec = WEATHER_1DAY_CYCLE_SEC;
  }
  let weatherDay = hydrology.weatherState?.weatherDay ?? currentDay;
  let ticksElapsed = (hydrology.weatherState?.ticksElapsed || 0) + 1;
  const elapsedWeatherSec = Math.max((Date.now() - weatherStartedAt) / 1000, ticksElapsed * dt);

  // Auto-transition to next natural weather pattern when 1-day duration expires (30 min) or when game day advances
  const hasDayAdvanced = currentDay > weatherDay;
  const hasDurationExpired = elapsedWeatherSec >= weatherDurationSec;

  if (!isRainstormActive && (hasDayAdvanced || hasDurationExpired)) {
    let nextWeatherId = rollNextNaturalWeather(activeProfileId);
    // If Markov roll picked the same weather, cycle to another viable atmospheric neighbor
    if (nextWeatherId === activeProfileId) {
      const fallbackNeighbors: Record<WeatherProfileId, WeatherProfileId> = {
        sunny: 'cloudy',
        heatwave: 'humid',
        drought: 'sunny',
        cloudy: 'drizzle',
        humid: 'rain',
        foggy: 'drizzle',
        drizzle: 'rain',
        rain: 'cloudy',
        monsoon: 'rain',
        sunshower: 'sunny',
        gale: 'thunderstorm',
        thunderstorm: 'rain',
        hailstorm: 'cloudy',
        cyclone: 'monsoon',
        frost: 'sunny',
        snow: 'frost',
        supercell_deluge: 'monsoon',
        plasma_firestorm: 'heatwave',
        polar_vortex: 'frost',
        hyper_cyclone: 'gale',
        alchemical_monsoon: 'drizzle',
        haboob_sandstorm: 'drought',
      };
      nextWeatherId = fallbackNeighbors[activeProfileId] || 'sunny';
    }

    activeProfileId = nextWeatherId;
    weatherStartedAt = Date.now();
    weatherDurationSec = WEATHER_1DAY_CYCLE_SEC; // Exactly 30 minutes (1 full in-game day)
    weatherDay = currentDay;
    ticksElapsed = 0;
    const nextDef = WEATHER_PROFILES[nextWeatherId];
    notifications.push({
      text: `🌤️ Day ${currentDay} Climate Front: Atmospheric front transitioned into ${nextDef.emoji} ${nextDef.name} (active for full 30-min day)!`,
      icon: nextDef.emoji,
      type: 'info',
    });
  }

  const weatherProfile = WEATHER_PROFILES[activeProfileId] || WEATHER_PROFILES.sunny;

  // Diurnal temperature and humidity adjustment:
  // Morning (10m, 0..600s): solar warming (+1°C)
  // Night (20m, 600..1800s): night cooling (-3°C) and dew/condensation (+6% RH)
  const isNightPhase = cycleElapsedSeconds >= 600;
  const diurnalTempC = Math.round((weatherProfile.defaultTempC + (isNightPhase ? -3.0 : 1.0)) * 10) / 10;
  const diurnalHumidityPct = Math.min(100, Math.max(10, Math.round(weatherProfile.defaultHumidityPct + (isNightPhase ? 6 : -2))));

  // Sync atmospheric weather state
  const currentAtmosphere: AtmosphericWeatherState = {
    ...(hydrology.weatherState || createDefaultWeatherState(activeProfileId)),
    currentWeather: activeProfileId,
    profileId: activeProfileId,
    temperatureC: diurnalTempC,
    relativeHumidityPct: diurnalHumidityPct,
    precipitationInflowLPerMin: weatherProfile.precipitationInflowLPerMin,
    windSpeedKmH: weatherProfile.windSpeedKmH,
    cloudCoverPct: weatherProfile.cloudCoverPct,
    barometricPressureHPa: weatherProfile.barometricPressureHPa,
    weatherStartedAt,
    weatherDurationSec,
    weatherDay,
    ticksElapsed,
  };

  // Sluice Gate Freezing Rule: Under 'frost' or 'snow', Tier 1 earthen furrows freeze solid!
  let isSluiceFrozen = false;
  if ((activeProfileId === 'frost' || activeProfileId === 'snow') && effectiveTier === 1) {
    isSluiceFrozen = true;
    if (sluiceGatesOpen) {
      sluiceGatesOpen = false;
      notifications.push({
        text: '🧊 Sluice Frozen Solid: Earthen furrows froze in sub-zero frost! Upgrade to Tier 2 clay canals to unlock winter irrigation.',
        icon: '🧊',
        type: 'event',
      });
    }
  }

  // 2. Closed-Loop Precipitation Catchment into Rain Cistern & Cistern Overflow
  const precipInflowLPerMin = activeProfileId === 'snow' ? 0 : weatherProfile.precipitationInflowLPerMin;
  if (precipInflowLPerMin > 0) {
    const rainLitersGained = (precipInflowLPerMin / 60) * dt;
    const prospectiveCistern = currentCistern + rainLitersGained;
    if (prospectiveCistern >= effectiveCisternMax) {
      currentCistern = effectiveCisternMax;
      // Overflow Rule: When Volume >= Max, excess water automatically recharges Deep Aquifer at +20 L/min
      const overflowRecharge = (20.0 / 60) * dt;
      currentAquifer = Math.min(hydrology.aquiferCapacityLiters, currentAquifer + overflowRecharge);
    } else {
      currentCistern = prospectiveCistern;
    }
  }

  // Cistern Heatwave & Plasma Firestorm Evaporation Loss: Uncovered cisterns lose water to thermal boiling/evaporation
  if (activeProfileId === 'heatwave' || activeProfileId === 'plasma_firestorm' || activeProfileId === 'haboob_sandstorm') {
    const evapRateLMin = isHardcoreMode
      ? (activeProfileId === 'plasma_firestorm' ? 35.0 : activeProfileId === 'haboob_sandstorm' ? 20.0 : 18.0)
      : (activeProfileId === 'plasma_firestorm' ? 20.0 : 10.0);
    const thermalEvapLiters = (evapRateLMin / 60) * dt;
    currentCistern = Math.max(0, currentCistern - thermalEvapLiters);
  }

  // 3. Subterranean Aquifer Baseline Natural Recharge (+8 L/min normal, drops to 2.5 L/min in Hardcore Mode, 0 in Drought/Firestorm)
  const isAridDrought = activeProfileId === 'drought' || activeProfileId === 'plasma_firestorm' || activeProfileId === 'haboob_sandstorm';
  const effectiveAquiferRecharge = isAridDrought ? 0.0 : (isHardcoreMode ? 2.5 : AQUIFER_NATURAL_RECHARGE_RATE_L_MIN);
  if (effectiveAquiferRecharge > 0) {
    const aquiferRechargeLiters = (effectiveAquiferRecharge / 60) * dt;
    currentAquifer = Math.min(hydrology.aquiferCapacityLiters, currentAquifer + aquiferRechargeLiters);
  }

  // Aquifer Stress state check: stressed if table drops below 25% (750L)
  const aquiferDepthPct = (currentAquifer / hydrology.aquiferCapacityLiters) * 100;
  if (aquiferDepthPct < 25 && !isAquiferStressed) {
    isAquiferStressed = true;
    hasSedimentInLine = true;
    notifications.push({
      text: '⚠️ Aquifer Depleted: Groundwater table dropped to Stressed (<25%)! Extraction halved & sediment in lines.',
      icon: '🚰',
      type: 'event',
    });
  } else if (aquiferDepthPct >= 40 && isAquiferStressed) {
    isAquiferStressed = false;
  }

  // 3.5. Flash Flood Crisis Trigger Conditions & Inflow Dynamics
  // Condition 1: Weather Intensity is Monsoon (+120 L/min) or Cyclone (+180 L/min)
  // Condition 2: Surface Storage Saturation (Cistern >= effectiveCisternMax - 1.0)
  // Condition 3: Subsoil Storage Saturation (Aquifer >= aquiferCapacityLiters - 1.0)
  const isFloodWeather = activeProfileId === 'monsoon' || activeProfileId === 'cyclone';
  const isCisternMaxed = currentCistern >= (effectiveCisternMax - 1.0);
  const isAquiferMaxed = currentAquifer >= (hydrology.aquiferCapacityLiters - 1.0);

  if (isFloodWeather && isCisternMaxed && isAquiferMaxed) {
    if (!isFlashFloodActive) {
      isFlashFloodActive = true;
      floodTriggeredAt = Date.now();
      floodHazardRemainingSec = 180;
      wasFloodControlled = false;
      notifications.push({
        text: '🌊 FLASH FLOOD CRISIS! Torrential storm has breached all reservoirs! Open Emergency Spillway before Root Rot destroys crops (3m)!',
        icon: '🌊',
        type: 'event',
      });
    }
  } else if (!isFloodWeather && isFlashFloodActive) {
    // Storm has broken / dispersed
    isFlashFloodActive = false;
    floodTriggeredAt = null;
    floodHazardRemainingSec = 180;
    notifications.push({
      text: '🌤️ Flood Receded: Extreme precipitation abated. Hydrological equilibrium restored.',
      icon: '🌤️',
      type: 'info',
    });
  }

  // Morning Field Hand Protocol (Shift Automation):
  // If Morning Shift (06:00 to 14:00, cycleElapsedSeconds < 600) worker is on duty when flood triggers:
  // Drops chores, sprints to canal head and opens Emergency Spillway within 15 seconds!
  if (isFlashFloodActive && !isSpillwayOpen && hasFieldHandMorningDuty && cycleElapsedSeconds < 600) {
    const elapsedSinceFlood = floodTriggeredAt ? (Date.now() - floodTriggeredAt) : 16000;
    if (elapsedSinceFlood >= 15000) {
      isSpillwayOpen = true;
      spillwayDivertingLitersPerSec = 120;
      notifications.push({
        text: '🚜 Field Hand Protocol: Morning worker sprinted to the canal head and OPENED the Emergency Spillway!',
        icon: '🚜',
        type: 'event',
      });
    }
  }

  // Canal Overflow Rule:
  // Sluice gates are automatically overridden by water head pressure when flood is active and spillway closed
  if (isFlashFloodActive && !isSpillwayOpen) {
    sluiceGatesOpen = true;
    liveDischargeLitersPerSec = 120;
  }

  // 4. Shift-Based Worker Hydrology Routines
  // A. Morning Shift (06:00 to 14:00, cycleElapsedSeconds < 600)
  if (cycleElapsedSeconds < 600) {
    dewHarvestedToday = false; // Reset dew harvest flag for next night

    if (hasFieldHandMorningDuty) {
      // Well pumping check: if elevated tower < 200L, pump from aquifer ONCE per day (atomic source deduction)
      if (lastPumpMorningDay !== currentDay && currentTower < 200 && currentAquifer > 100) {
        const pumpSpeedMultiplier = isAquiferStressed ? 0.5 : 1.0;
        const pumpTransfer = Math.min(400 * pumpSpeedMultiplier, currentAquifer, hydrology.towerCapacityLiters - currentTower);
        if (pumpTransfer > 0) {
          currentAquifer = Math.max(0, currentAquifer - pumpTransfer);
          currentTower = Math.min(hydrology.towerCapacityLiters, currentTower + pumpTransfer);
          lastPumpMorningDay = currentDay;
          notifications.push({
            text: `👷 Field Hand Routine: Pumped ${Math.round(pumpTransfer)}L from Aquifer into Elevated Tower.`,
            icon: '⛲',
            type: 'info',
          });
        }
      }

      // NOTE: Master Sluice Gates are STRICTLY manual/player-controlled or automated cut-off.
      // Workers DO NOT forcibly open physical sluice gates without user command (Bug 3 fixed).
    }
  }

  // B. Night Shift (22:00 to 06:00, cycleElapsedSeconds >= 1200)
  if (cycleElapsedSeconds >= 1200 && hasNightWatchDuty) {
    // Canal De-Silting
    if (isClogged) {
      isClogged = false;
      notifications.push({
        text: '🌙 Night Watch: Cleared debris and leaf litter from canal grates. Full flow restored!',
        icon: '🧹',
        type: 'info',
      });
    }

    // Dew Harvesting: If cistern < 50L, harvest +20L
    if (!dewHarvestedToday && currentCistern < 50) {
      currentCistern = Math.min(effectiveCisternMax, currentCistern + 20);
      dewHarvestedToday = true;
      notifications.push({
        text: '🌙 Night Watch: Deployed canvas condensation screens & harvested +20L night dew!',
        icon: '💧',
        type: 'info',
      });
    }
  }

  // 5. Canal Sluice Gate Gravity Discharge Math
  // Support ALL available unlocked plots on the estate (not artificially restricted to 12)
  const numAvailablePlots = Math.max(1, unlockedPlots || plots.length);
  const targetMoisture = tierConfig.autoCutoffSupported ? hydrology.autoShutoffMoisture : 100;
  const sealsCount = hydrology.sluiceSealsCount !== undefined ? hydrology.sluiceSealsCount : (hydrology.hasReinforcedSluiceSeal ? 1 : 0);
  let newPlots = [...plots];
  let totalDeliveredLiters = 0;

  // Check if Tier 4 Pressurized Brass Sprinklers need to auto-pulse across all available plots
  // Prerequisite: tower must be above Stage 1 Crop Conservation threshold (200L)
  if (effectiveTier >= 4 && currentTower > 200) {
    for (let i = 0; i < numAvailablePlots; i++) {
      const p = newPlots[i];
      if (!p) continue;
      const currentM = p.moistureLevel !== undefined ? p.moistureLevel : 60.0;
      if (currentM < 42.0) {
        // Target pulse up to 75.0%
        const neededPct = Math.min(75.0 - currentM, 33.0);
        const neededLiters = neededPct * LITERS_PER_PERCENT_MOISTURE_PER_PLOT; // 2.5L per +1% moisture per plot

        // Sprinkler Zero-Pressure Bypass Check: tower MUST have at least neededLiters to pulse!
        if (currentTower < neededLiters || currentTower <= 200) {
          // Insufficient tower pressure or conservation active: skip pulse
          continue;
        }

        // Atomic deduction from Elevated Gravity Tower
        currentTower = Math.max(0, currentTower - neededLiters);
        totalDischarged += neededLiters;
        totalDeliveredLiters += neededLiters;
        newPlots[i] = {
          ...p,
          moistureLevel: Number(Math.min(80.0, currentM + neededPct).toFixed(4)),
        };
      }
    }
  }

  // Handle open sluice gates
  if (sluiceGatesOpen) {
    if (currentTower <= 200 || isClogged) {
      // Out of water, conservation mode, or clogged
      sluiceGatesOpen = false;
      if (currentTower <= 0) {
        currentTower = 0;
        notifications.push({
          text: '🛑 Sluice Gates Closed: Elevated Gravity Tower is empty (0L)!',
          icon: '🔴',
          type: 'info',
        });
      } else if (currentTower <= 200) {
        notifications.push({
          text: `🛡️ Sluice Gates Secured: Tower reached Stage 1 Crop Conservation (${Math.round(currentTower)}L ≤ 200L). Water conserved for crew & Bio-Lab.`,
          icon: '🚰',
          type: 'info',
        });
      } else {
        notifications.push({
          text: '🛑 Sluice Gates Blocked: Canals clogged with silt! Awaiting Night Watch clearing.',
          icon: '🍂',
          type: 'event',
        });
      }
    } else {
      // Find plots eligible for water across ALL available plots (moisture < targetMoisture)
      let thirstyPlotIndices: number[] = [];
      for (let i = 0; i < numAvailablePlots; i++) {
        const p = newPlots[i];
        if (!p) continue;
        const m = p.moistureLevel !== undefined ? p.moistureLevel : 60.0;
        if (m < targetMoisture) {
          thirstyPlotIndices.push(i);
        }
      }

      // If all plots already reached targetMoisture, allow manual flow to saturate up to canal capacity (80%-100%)
      if (thirstyPlotIndices.length === 0) {
        for (let i = 0; i < numAvailablePlots; i++) {
          const p = newPlots[i];
          if (!p) continue;
          const m = p.moistureLevel !== undefined ? p.moistureLevel : 60.0;
          if (m < tierConfig.maxSaturationCapPct) {
            thirstyPlotIndices.push(i);
          }
        }
      }

      if (thirstyPlotIndices.length === 0) {
        // All plots reached maximum capacity! Auto shut-off gates
        sluiceGatesOpen = false;
        notifications.push({
          text: `🟢 Sluice Gates Secured: All plots reached maximum hydration capacity (${tierConfig.maxSaturationCapPct}%).`,
          icon: '🛑',
          type: 'info',
        });
      } else {
        // Discharge rate scales proportionally with available plot count (minimum 12 L/sec)
        // Reinforced Sluice Gate Seals: Each installed seal reduces gravity tower drainage by -20% (up to 3 seals = -60%)
        const baseFlowRate = 12.0; // Liters / sec base for 12 plots
        const rawFlowRate = Math.max(baseFlowRate, (numAvailablePlots / 12) * baseFlowRate);
        const drainageMult = sealsCount > 0 ? Math.max(0.40, 1.0 - (sealsCount * 0.20)) : 1.0;
        const flowRate = rawFlowRate * drainageMult;
        const requestedLiters = flowRate * dt;
        const actualDischargedLiters = Math.min(requestedLiters, currentTower);
        
        // Atomic deduction from Elevated Gravity Tower (2.5L per +1% moisture delivered)
        currentTower = Math.max(0, currentTower - actualDischargedLiters);
        totalDischarged += actualDischargedLiters;
        liveDischargeLitersPerSec = dt > 0 ? Math.round(actualDischargedLiters / dt) : 0;

        // Auto-close gates immediately if tower ran completely dry during this discharge tick
        if (currentTower <= 0) {
          sluiceGatesOpen = false;
          notifications.push({
            text: '🛑 Sluice Gates Closed: Elevated Gravity Tower ran dry (0L)!',
            icon: '🔴',
            type: 'info',
          });
        }

        // Seepage loss applied based on canal tier:
        // Tier 1: 35% seeps into turf, 65% reaches crop beds (eliminated if at least 1 Sluice Seal installed)
        // Tier 2+: 0% transit loss
        const effectiveSeepage = sealsCount > 0 ? 0 : tierConfig.seepageLossFraction;
        const deliveredLiters = actualDischargedLiters * (1.0 - effectiveSeepage);
        totalDeliveredLiters += deliveredLiters;

        const litersPerPlot = deliveredLiters / thirstyPlotIndices.length;
        const moisturePctIncrease = litersPerPlot / LITERS_PER_PERCENT_MOISTURE_PER_PLOT;

        for (const idx of thirstyPlotIndices) {
          const p = newPlots[idx];
          const curM = p.moistureLevel !== undefined ? p.moistureLevel : 60.0;
          const newM = Math.min(tierConfig.maxSaturationCapPct, curM + moisturePctIncrease);
          newPlots[idx] = {
            ...p,
            moistureLevel: Number(newM.toFixed(4)),
          };
        }
      }
    }
  }

  // 6. Percolation Feedback to Aquifer: 30% of delivered irrigation filters into subterranean reserve
  if (totalDeliveredLiters > 0) {
    const percolatedLiters = totalDeliveredLiters * PERCOLATION_FEEDBACK_FRACTION;
    currentAquifer = Math.min(hydrology.aquiferCapacityLiters, currentAquifer + percolatedLiters);
    totalPercolated += percolatedLiters;
  }

  // 7. Continuous Thermodynamic Soil Moisture Decay & Precipitation Wetting Formula (Bug 6)
  // EvaporativeLoss = E_base * (1 + (T - 20) / 25) * (1.0 - (H * 0.7)) * (1 - InfraDamping)
  const thermoEvap = calculateThermodynamicEvaporationRatePctPerMin({
    temperatureC: currentAtmosphere.temperatureC,
    relativeHumidityPct: currentAtmosphere.relativeHumidityPct,
    cycleElapsedSeconds,
    canalTier: effectiveTier,
  });
  // Heatwave / Drought: Evaporation rate triples: Plot water requirement jumps from 1x to 3x per cycle
  const isHeatwaveOrDrought = activeProfileId === 'heatwave' || activeProfileId === 'drought' || activeProfileId === 'plasma_firestorm';
  const weatherEvapMult = isHeatwaveOrDrought ? 3.0 : 1.0;
  const evapRatePctPerSec = (thermoEvap.evapRatePctPerMin * weatherEvapMult) / 60;
  const evapDeltaPct = evapRatePctPerSec * dt;

  // Direct soil wetting from rain / condensation
  // Foggy: ground condensation adds +0.3% moisture / min
  // Active precipitation: from weatherProfile.plotDirectMoistureGainPctPerMin (e.g. Drizzle +1.0%, Rain +3.0%, Monsoon +6.0%, Hail +1.0%, Sunshower +1.5%)
  const rainGainPctPerMin = activeProfileId === 'foggy'
    ? 0.3
    : weatherProfile.plotDirectMoistureGainPctPerMin;
  const directRainMoistureGainPct = (rainGainPctPerMin / 60) * dt;

  for (let i = 0; i < newPlots.length; i++) {
    const p = newPlots[i];
    if (!p) continue;
    let m = p.moistureLevel !== undefined ? p.moistureLevel : 60.0;

    // Apply continuous thermodynamic decay and precipitation inflow
    // High-precision floating point decay (not truncated by premature 1-decimal rounding)
    m = Math.max(0.0, Math.min(tierConfig.maxSaturationCapPct, m - evapDeltaPct + directRainMoistureGainPct));

    let desiccatedSec = p.desiccatedSeconds || 0;
    let isWithered = Boolean(p.isWithered);
    let waterloggedSec = p.waterloggedSeconds || 0;
    let hasRootRot = Boolean(p.hasRootRot);
    let wasFloodedToMax = Boolean(p.wasFloodedToMax);

    // Flash Flood Inundation & Emergency Spillway Purge Mechanics
    if (isFlashFloodActive) {
      if (isSpillwayOpen) {
        // While spillway open: diverts incoming runoff off-map and actively purges standing field water.
        // Plots drain at -10.0% moisture / sec down to the target safe zone (70%).
        m = Math.max(70.0, m - 10.0 * dt);
      } else {
        // While spillway closed: Inundation surge (+15.0% moisture / sec)
        // Infrastructure Mitigation: Tier 3+ Raised Furrows & Swales caps moisture at 85.0% (immune to root rot)
        const floodCap = effectiveTier >= 3 ? 85.0 : 100.0;
        m = Math.min(floodCap, m + 15.0 * dt);
        if (m >= 99.0) {
          wasFloodedToMax = true;
        }
      }
    }

    // Desiccation tracking (< 15.0%)
    if (m <= 15.0 && p.crop && !p.ready && !isWithered) {
      desiccatedSec += dt;
      const desiccationLimit = isHardcoreMode ? 75 : DESICCATION_WITHER_DURATION_SEC;
      if (desiccatedSec >= desiccationLimit) {
        isWithered = true;
        notifications.push({
          text: `🥀 Crop Withered: Plot #${i + 1} remained desiccated (<15%) for ${isHardcoreMode ? '75s' : '30 minutes'}! Clear with a hoe.`,
          icon: '🥀',
          type: 'event',
        });
      }
    } else if (m > 15.0) {
      desiccatedSec = 0;
    }

    // Waterlogging & Root Rot tracking (> 95.0%)
    if (m > 95.0 && p.crop && !p.ready && !hasRootRot) {
      waterloggedSec += dt;
      // In flash flood or hardcore, shorter countdown applies (60s - 75s in Hardcore)
      const rotLimit = isHardcoreMode
        ? (isFlashFloodActive ? 60 : 75)
        : (isFlashFloodActive ? 180 : ROOT_ROT_HAZARD_DURATION_SEC);
      if (waterloggedSec >= rotLimit) {
        hasRootRot = true;
        notifications.push({
          text: `⚠️ Root Rot Inflicted: Plot #${i + 1} flooded (>95%) for ${Math.round(rotLimit)}s! Yield halved & quality disabled.`,
          icon: '🪱',
          type: 'event',
        });
      }
    } else if (m <= 95.0) {
      waterloggedSec = 0;
    }

    newPlots[i] = {
      ...p,
      moistureLevel: Number(m.toFixed(4)),
      desiccatedSeconds: desiccatedSec,
      isWithered,
      waterloggedSeconds: waterloggedSec,
      hasRootRot,
      wasFloodedToMax,
      // Maintain backwards-compatible isWatered boolean
      isWatered: m >= 40.0,
    };
  }

  // Flash Flood Hazard Clock & Alluvial Silt Resolution
  if (isFlashFloodActive && !isSpillwayOpen) {
    floodHazardRemainingSec = Math.max(0, floodHazardRemainingSec - dt);
  }

  if (isSpillwayOpen) {
    // Check if plots reached safe zone (<= 70%)
    const avgMoisture = newPlots.slice(0, numAvailablePlots).reduce((sum, p) => sum + (p.moistureLevel ?? 60), 0) / numAvailablePlots;
    if (avgMoisture <= 70.5) {
      floodHazardRemainingSec = 180; // Hazard timer pauses and resets
      let siltCount = 0;
      for (let i = 0; i < newPlots.length; i++) {
        if (newPlots[i].wasFloodedToMax) {
          newPlots[i] = {
            ...newPlots[i],
            alluvialSiltCyclesRemaining: 2,
            wasFloodedToMax: false,
            waterloggedSeconds: 0,
          };
          siltCount++;
        }
      }
      if (siltCount > 0 && isFlashFloodActive) {
        isFlashFloodActive = false;
        wasFloodControlled = true;
        notifications.push({
          text: `✨ Flood Averted! Emergency Spillway safely drained the inundation. Alluvial Silt deposited on ${siltCount} plots (+20% Growth Speed & Free Fertilizer for next 2 plantings)!`,
          icon: '✨',
          type: 'event',
        });
      }
    }
  }

  // 8. Severe Convective Hazard: Thunderstorm Lightning Strike (2% check per flash)
  if (activeProfileId === 'thunderstorm' && Math.random() < 0.02 * (dt / 3.0)) {
    const plantedIndices = newPlots
      .map((p, idx) => (p && p.crop && !p.isWithered && !p.ready ? idx : -1))
      .filter((idx) => idx !== -1);
    if (plantedIndices.length > 0) {
      const strikeIdx = plantedIndices[Math.floor(Math.random() * plantedIndices.length)];
      const struckPlot = newPlots[strikeIdx];
      newPlots[strikeIdx] = {
        ...struckPlot,
        crop: null,
        plantedAt: null,
        ready: false,
        isWithered: false,
      };
      notifications.push({
        text: `⚡ Convective Lightning Bolt! Struck Plot #${strikeIdx + 1}, incinerating the crop into Alchemical Ash!`,
        icon: '⚡',
        type: 'event',
      });
    }
  }

  // 8.5. Automated Hydraulic Rule: "Full-Reserve Pressure Surge"
  const towerTier = hydrology.towerTier || 1;
  const towerTierConfig = TOWER_STORAGE_TIERS[towerTier] || TOWER_STORAGE_TIERS[1];
  const towerCap = hydrology.towerCapacityLiters || towerTierConfig.capacityLiters;
  const surgeRate = towerTierConfig.surgeLps;

  const surgeResult = simulateOverflowSurgeTick({
    towerLiters: currentTower,
    towerCapacityLiters: towerCap,
    cisternLiters: currentCistern,
    cisternMaxLiters: effectiveCisternMax,
    aquiferLiters: currentAquifer,
    aquiferCapacityLiters: hydrology.aquiferCapacityLiters,
    deltaSeconds: dt,
    isOverflowSurgeActive: Boolean(hydrology.isOverflowSurgeActive),
    overflowSurgeSource: hydrology.overflowSurgeSource || null,
    surgeRateLps: surgeRate,
  });

  currentTower = surgeResult.newTowerLiters;
  currentCistern = surgeResult.newCisternLiters;
  currentAquifer = surgeResult.newAquiferLiters;

  if (surgeResult.justTriggered) {
    notifications.push({
      text: `💧 [HYDROLOGY SURGE]: Reservoir reached 100% capacity. Automated overflow surge engaged — pumping water to fill Elevated Gravity Tower (${towerCap.toLocaleString()}L).`,
      icon: '💧',
      type: 'event',
    });
  }

  if (surgeResult.justCompleted) {
    notifications.push({
      text: `✅ [HYDROLOGY SURGE]: Elevated Gravity Tower reached ${towerCap.toLocaleString()}L capacity. Surge pump disengaged.`,
      icon: '✅',
      type: 'info',
    });
  }

  const dynamicStage = getTowerLoadSheddingStage(currentTower, towerCap);

  return {
    updatedHydrology: {
      ...hydrology,
      cisternLiters: Math.round(currentCistern * 10) / 10,
      cisternMaxLiters: effectiveCisternMax,
      weatherCondition: activeProfileId,
      weatherState: currentAtmosphere,
      isRainbowActive: activeProfileId === 'sunshower',
      isSluiceFrozen,
      aquiferLiters: Math.round(currentAquifer * 10) / 10,
      aquiferCapacityLiters: hydrology.aquiferCapacityLiters,
      isAquiferStressed,
      hasSedimentInLine,
      towerLiters: Math.round(currentTower * 10) / 10,
      towerCapacityLiters: towerCap,
      canalTier: effectiveTier,
      sluiceGatesOpen,
      autoShutoffMoisture: hydrology.autoShutoffMoisture,
      liveDischargeLitersPerSec: isFlashFloodActive && !isSpillwayOpen ? 120 : (sluiceGatesOpen ? liveDischargeLitersPerSec : 0),
      isCloggedWithDebris: isClogged,
      dewHarvestedToday,
      lastSluiceMorningDay,
      lastPumpMorningDay,
      hasReinforcedSluiceSeal: sealsCount > 0,
      sluiceSealsCount: sealsCount,

      // Flash Flood & Emergency Spillway Dynamics
      isFlashFloodActive,
      isSpillwayOpen,
      spillwayDivertingLitersPerSec: isSpillwayOpen ? 120 : 0,
      floodHazardRemainingSec: Math.round(floodHazardRemainingSec * 10) / 10,
      wasFloodControlled,
      floodTriggeredAt,

      // Automated Hydraulic Rule: Full-Reserve Pressure Surge
      isOverflowSurgeActive: surgeResult.isOverflowSurgeActive,
      overflowSurgeSource: surgeResult.overflowSurgeSource,
      overflowSurgeLps: surgeResult.isOverflowSurgeActive ? surgeRate : 0,

      totalWaterDischargedLiters: Math.round((totalDischarged + Number.EPSILON) * 10) / 10,
      totalPercolatedLiters: Math.round((totalPercolated + Number.EPSILON) * 10) / 10,

      // Fail-Safe Load-Shedding Status
      loadSheddingStage: dynamicStage,
      isCropConservationActive: currentTower <= (towerCap * 0.25),
      isCrewRationingActive: currentTower <= (towerCap * 0.10) && currentTower > 0,
      isCryoStandbyActive: currentTower <= 0,
    },
    updatedPlots: newPlots,
    notifications,
  };
}

/**
 * Offline Hydration Math: Iterates minute-by-minute across elapsed offline time
 * to account for diurnal shift changes in evaporation, ensuring crops do not falsely
 * desiccate or bypass waterlogging penalties while the game was closed.
 */
export function simulateOfflineHydrology(params: {
  hydrology: HydrologyState;
  plots: any[];
  unlockedPlots: number;
  farmLevel: number;
  startCycleElapsedSeconds: number;
  startDay: number;
  totalElapsedSeconds: number;
}): {
  updatedHydrology: HydrologyState;
  updatedPlots: any[];
  offlineMinutesProcessed: number;
} {
  const {
    hydrology,
    plots,
    unlockedPlots,
    farmLevel,
    startCycleElapsedSeconds,
    startDay,
    totalElapsedSeconds,
  } = params;

  // Cap offline simulation at 12 real hours (720 minutes / 43,200s) to prevent browser lockup
  const safeElapsedSec = Math.min(Math.max(1, totalElapsedSeconds), 43200);
  const stepSec = 60; // 1-minute steps
  const totalSteps = Math.ceil(safeElapsedSec / stepSec);

  let currentHydro = { ...hydrology };
  let currentPlots = [...plots];
  let curCycleSec = startCycleElapsedSeconds;
  let curDay = startDay;

  for (let s = 0; s < totalSteps; s++) {
    const res = stepHydrologySimulation({
      hydrology: currentHydro,
      plots: currentPlots,
      unlockedPlots,
      farmLevel,
      cycleElapsedSeconds: curCycleSec,
      currentDay: curDay,
      deltaSeconds: stepSec,
      isRainstormActive: false,
      hasFieldHandMorningDuty: true,
      hasNightWatchDuty: true,
    });

    currentHydro = res.updatedHydrology;
    currentPlots = res.updatedPlots;

    curCycleSec += stepSec;
    if (curCycleSec >= 1800) {
      curCycleSec %= 1800;
      curDay += 1;
    }
  }

  return {
    updatedHydrology: currentHydro,
    updatedPlots: currentPlots,
    offlineMinutesProcessed: totalSteps,
  };
}

/**
 * Calculates crop quality upon harvest:
 * Optimal moisture (40.1% to 80.0%) without Root Rot unlocks eligibility for Silver, Gold, and Prismatic rolls!
 */
export function rollCropQuality(
  hasRootRot: boolean,
  moistureLevel: number = 60.0,
  bonusPrismaticChance: number = 0
): {
  quality: 'standard' | 'silver' | 'gold' | 'prismatic';
  yieldMultiplier: number;
  priceMultiplier: number;
  badgeEmoji: string;
  badgeText: string;
} {
  if (hasRootRot) {
    return {
      quality: 'standard',
      yieldMultiplier: 0.5, // 50% yield cut
      priceMultiplier: 0.5,
      badgeEmoji: '🪱',
      badgeText: 'Root Rot (-50%)',
    };
  }

  // Check if within Optimal Capillary Zone (40.1% to 80.0%)
  if (moistureLevel >= 40.1 && moistureLevel <= 80.0) {
    const roll = Math.random();
    const effectivePrismaticChance = 0.02 + Math.max(0, bonusPrismaticChance);
    if (roll < effectivePrismaticChance) {
      // Prismatic / Mythic Quality (2% base + bonus from Sunshower rainbow)
      return {
        quality: 'prismatic',
        yieldMultiplier: 2.0,
        priceMultiplier: 3.0,
        badgeEmoji: '🌈',
        badgeText: 'PRISMATIC (+200%)',
      };
    }
    if (roll < effectivePrismaticChance + 0.08) {
      // 8% Gold
      return {
        quality: 'gold',
        yieldMultiplier: 1.5,
        priceMultiplier: 2.0,
        badgeEmoji: '⭐',
        badgeText: 'GOLD (+100%)',
      };
    }
    if (roll < effectivePrismaticChance + 0.08 + 0.20) {
      // 20% Silver
      return {
        quality: 'silver',
        yieldMultiplier: 1.25,
        priceMultiplier: 1.5,
        badgeEmoji: '✨',
        badgeText: 'SILVER (+50%)',
      };
    }
  }

  return {
    quality: 'standard',
    yieldMultiplier: 1.0,
    priceMultiplier: 1.0,
    badgeEmoji: '🌾',
    badgeText: 'Standard',
  };
}
