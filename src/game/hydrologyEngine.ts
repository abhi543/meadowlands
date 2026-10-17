/**
 * Closed-Loop Hydrological Estate Simulation Engine
 * 
 * Implements physical fluid dynamics, finite mass conservation,
 * gravity-fed canal network routing, diurnal thermal evaporation,
 * capillary soil moisture spectrum, and shift-based worker duties.
 */

import { type CircadianClockInfo } from '@/game/shiftEngine';
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

// Homestead Rain Cistern Capacities scaling with Farm Level
export function getCisternCapacity(farmLevel: number): number {
  if (farmLevel <= 1) return 500;
  if (farmLevel <= 3) return 1500;
  if (farmLevel <= 5) return 4000;
  return 10000;
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
  // 0..600s: Morning Shift (06:00 to 14:00)
  // 600..1200s: Twilight Gap (14:00 to 22:00)
  // 1200..1800s: Night Watch (22:00 to 06:00)
  const tierDef = CANAL_TIER_CONFIGS[canalTier];

  if (cycleElapsedSeconds < 600) {
    const rate = tierDef.morningEvaporationRatePctPerMin;
    return {
      ratePctPerMin: rate,
      phaseName: 'Morning Shift',
      solarLabel: tierDef.tier >= 3 ? 'Midday Heat (Tile Dampened: -1.5%/min)' : 'High Sun (-3.0%/min)',
    };
  } else if (cycleElapsedSeconds < 1200) {
    return {
      ratePctPerMin: 2.0,
      phaseName: 'Twilight Gap',
      solarLabel: 'Afternoon Warmth (-2.0%/min)',
    };
  } else {
    return {
      ratePctPerMin: 0.5,
      phaseName: 'Night Watch',
      solarLabel: 'Cool Condensation (-0.5%/min)',
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
  
  // D. Canals & Sluice Gates
  canalTier: CanalTier;
  sluiceGatesOpen: boolean;
  autoShutoffMoisture: number; // default: 75%
  liveDischargeLitersPerSec: number;
  isCloggedWithDebris: boolean;
  dewHarvestedToday: boolean;
  lastSluiceMorningDay: number;
  
  // Telemetry
  totalWaterDischargedLiters: number;
  totalPercolatedLiters: number;
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
    
    canalTier: getCanalTierForLevel(farmLevel),
    sluiceGatesOpen: false,
    autoShutoffMoisture: 75,
    liveDischargeLitersPerSec: 0,
    isCloggedWithDebris: false,
    dewHarvestedToday: false,
    lastSluiceMorningDay: 0,
    
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
  let totalDischarged = hydrology.totalWaterDischargedLiters;
  let totalPercolated = hydrology.totalPercolatedLiters;

  // Weather determination & Multi-variable Profile sync
  let activeProfileId: WeatherProfileId = resolveWeatherProfileId(hydrology.weatherCondition);
  if (isRainstormActive && activeProfileId !== 'monsoon' && activeProfileId !== 'thunderstorm' && activeProfileId !== 'cyclone') {
    activeProfileId = 'thunderstorm';
  }
  const weatherProfile = WEATHER_PROFILES[activeProfileId] || WEATHER_PROFILES.sunny;

  // Sync atmospheric weather state
  const currentAtmosphere: AtmosphericWeatherState = (!hydrology.weatherState || (hydrology.weatherState.profileId || hydrology.weatherState.currentWeather) !== activeProfileId)
    ? createDefaultWeatherState(activeProfileId)
    : {
        ...hydrology.weatherState,
        ticksElapsed: (hydrology.weatherState.ticksElapsed || 0) + 1,
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
      // Overflow Rule: When Volume >= Max (10,000L), excess water automatically recharges the Deep Groundwater Aquifer at +20 L/min
      const overflowRecharge = (20.0 / 60) * dt;
      currentAquifer = Math.min(hydrology.aquiferCapacityLiters, currentAquifer + overflowRecharge);
    } else {
      currentCistern = prospectiveCistern;
    }
  }

  // Cistern Heatwave Evaporation Loss: Uncovered cisterns lose 10 L/min to thermal boiling/evaporation
  if (activeProfileId === 'heatwave') {
    const heatwaveEvapLiters = (10.0 / 60) * dt;
    currentCistern = Math.max(0, currentCistern - heatwaveEvapLiters);
  }

  // 3. Subterranean Aquifer Baseline Natural Recharge (+8 L/min, drops to 0 in Drought)
  const baseRechargeRate = activeProfileId === 'drought' ? 0.0 : AQUIFER_NATURAL_RECHARGE_RATE_L_MIN;
  if (baseRechargeRate > 0) {
    const aquiferRechargeLiters = (baseRechargeRate / 60) * dt;
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

  // 4. Shift-Based Worker Hydrology Routines
  // A. Morning Shift (06:00 to 14:00, cycleElapsedSeconds < 600)
  if (cycleElapsedSeconds < 600) {
    dewHarvestedToday = false; // Reset dew harvest flag for next night

    if (hasFieldHandMorningDuty) {
      // Well pumping check: if elevated tower < 200L, pump from aquifer
      if (currentTower < 200 && currentAquifer > 100) {
        const pumpSpeedMultiplier = isAquiferStressed ? 0.5 : 1.0;
        const pumpTransfer = Math.min(400 * pumpSpeedMultiplier, currentAquifer, hydrology.towerCapacityLiters - currentTower);
        currentAquifer -= pumpTransfer;
        currentTower += pumpTransfer;
        notifications.push({
          text: `👷 Field Hand Routine: Pumped ${Math.round(pumpTransfer)}L from Aquifer into Elevated Tower.`,
          icon: '⛲',
          type: 'info',
        });
      }

      // Sluice routine: at shift start, if plots dry and gates closed, open sluice
      if (lastSluiceMorningDay !== currentDay && (effectiveTier === 1 || effectiveTier === 2)) {
        if (!sluiceGatesOpen && currentTower >= 50) {
          sluiceGatesOpen = true;
          lastSluiceMorningDay = currentDay;
          notifications.push({
            text: '👷 Field Hand Morning Routine: Opened canal sluice gates for 06:00 estate hydration!',
            icon: '🌊',
            type: 'info',
          });
        }
      }
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
  let liveDischargeLitersPerSec = 0;
  const numEstatePlots = Math.min(FIXED_ESTATE_PLOTS_COUNT, unlockedPlots);
  const targetMoisture = tierConfig.autoCutoffSupported ? hydrology.autoShutoffMoisture : 100;
  let newPlots = [...plots];
  let totalDeliveredLiters = 0;

  // Check if Tier 4 Pressurized Brass Sprinklers need to auto-pulse
  if (effectiveTier >= 4 && currentTower >= 30) {
    for (let i = 0; i < numEstatePlots; i++) {
      const p = newPlots[i];
      if (!p) continue;
      const currentM = p.moistureLevel ?? 60.0;
      if (currentM < 42.0 && currentTower >= 25) {
        // Pulse to 75.0%
        const neededPct = Math.min(75.0 - currentM, 33.0);
        const neededLiters = neededPct * LITERS_PER_PERCENT_MOISTURE_PER_PLOT;
        const availableLiters = Math.min(neededLiters, currentTower);
        currentTower -= availableLiters;
        totalDischarged += availableLiters;
        totalDeliveredLiters += availableLiters;
        const addedPct = availableLiters / LITERS_PER_PERCENT_MOISTURE_PER_PLOT;
        newPlots[i] = {
          ...p,
          moistureLevel: Math.min(80.0, currentM + addedPct),
        };
      }
    }
  }

  // Handle open sluice gates
  if (sluiceGatesOpen) {
    if (currentTower <= 0 || isClogged) {
      // Out of water or clogged
      sluiceGatesOpen = false;
      if (currentTower <= 0) {
        notifications.push({
          text: '🛑 Sluice Gates Closed: Elevated Gravity Tower is empty (0L)!',
          icon: '🔴',
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
      // Find plots eligible for water (moisture < targetMoisture)
      const thirstyPlotIndices: number[] = [];
      for (let i = 0; i < numEstatePlots; i++) {
        const p = newPlots[i];
        if (!p) continue;
        const m = p.moistureLevel ?? 60.0;
        if (m < targetMoisture) {
          thirstyPlotIndices.push(i);
        }
      }

      if (thirstyPlotIndices.length === 0) {
        // All plots reached target! Auto shut-off if Tier 2+
        if (tierConfig.autoCutoffSupported) {
          sluiceGatesOpen = false;
          notifications.push({
            text: `🟢 Automated Sluice Cut-Off: All plots reached ${targetMoisture}% target moisture. Gates secured!`,
            icon: '🛑',
            type: 'info',
          });
        }
      } else {
        // Discharge rate: 12 Liters / sec total across canal network
        const flowRate = 12.0; // Liters / sec
        const requestedLiters = flowRate * dt;
        const actualDischargedLiters = Math.min(requestedLiters, currentTower);
        currentTower -= actualDischargedLiters;
        totalDischarged += actualDischargedLiters;
        liveDischargeLitersPerSec = Math.round(actualDischargedLiters / dt);

        // Seepage loss applied based on canal tier:
        // Tier 1: 35% seeps into turf, 65% reaches crop beds
        // Tier 2+: 0% transit loss
        const deliveredLiters = actualDischargedLiters * (1.0 - tierConfig.seepageLossFraction);
        totalDeliveredLiters += deliveredLiters;

        const litersPerPlot = deliveredLiters / thirstyPlotIndices.length;
        const moisturePctIncrease = litersPerPlot / LITERS_PER_PERCENT_MOISTURE_PER_PLOT;

        for (const idx of thirstyPlotIndices) {
          const p = newPlots[idx];
          const curM = p.moistureLevel ?? 60.0;
          const newM = Math.min(tierConfig.maxSaturationCapPct, curM + moisturePctIncrease);
          newPlots[idx] = {
            ...p,
            moistureLevel: newM,
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

  // 7. Continuous Thermodynamic Soil Moisture Decay & Precipitation Wetting Formula
  // EvaporativeLoss = E_base * (1 + (T - 20) / 25) * (1.0 - (H * 0.7)) * (1 - InfraDamping)
  const thermoEvap = calculateThermodynamicEvaporationRatePctPerMin({
    temperatureC: currentAtmosphere.temperatureC,
    relativeHumidityPct: currentAtmosphere.relativeHumidityPct,
    cycleElapsedSeconds,
    canalTier: effectiveTier,
  });
  const evapRatePctPerSec = thermoEvap.evapRatePctPerMin / 60;
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
    m = Math.max(0.0, Math.min(tierConfig.maxSaturationCapPct, m - evapDeltaPct + directRainMoistureGainPct));

    let desiccatedSec = p.desiccatedSeconds || 0;
    let isWithered = Boolean(p.isWithered);
    let waterloggedSec = p.waterloggedSeconds || 0;
    let hasRootRot = Boolean(p.hasRootRot);

    // Desiccation tracking (< 15.0%)
    if (m <= 15.0 && p.crop && !p.ready && !isWithered) {
      desiccatedSec += dt;
      if (desiccatedSec >= DESICCATION_WITHER_DURATION_SEC) {
        isWithered = true;
        notifications.push({
          text: `🥀 Crop Withered: Plot #${i + 1} remained desiccated (<15%) for 30 minutes! Clear with a hoe.`,
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
      if (waterloggedSec >= ROOT_ROT_HAZARD_DURATION_SEC) {
        hasRootRot = true;
        notifications.push({
          text: `⚠️ Root Rot Inflicted: Plot #${i + 1} flooded (>95%) for 4 minutes! Yield halved & quality disabled.`,
          icon: '🪱',
          type: 'event',
        });
      }
    } else if (m <= 95.0) {
      waterloggedSec = 0;
    }

    newPlots[i] = {
      ...p,
      moistureLevel: Math.round(m * 10) / 10,
      desiccatedSeconds: desiccatedSec,
      isWithered,
      waterloggedSeconds: waterloggedSec,
      hasRootRot,
      // Maintain backwards-compatible isWatered boolean
      isWatered: m >= 40.0,
    };
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
      towerCapacityLiters: hydrology.towerCapacityLiters,
      canalTier: effectiveTier,
      sluiceGatesOpen,
      autoShutoffMoisture: hydrology.autoShutoffMoisture,
      liveDischargeLitersPerSec: sluiceGatesOpen ? liveDischargeLitersPerSec : 0,
      isCloggedWithDebris: isClogged,
      dewHarvestedToday,
      lastSluiceMorningDay,
      totalWaterDischargedLiters: Math.round((totalDischarged + Number.EPSILON) * 10) / 10,
      totalPercolatedLiters: Math.round((totalPercolated + Number.EPSILON) * 10) / 10,
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
