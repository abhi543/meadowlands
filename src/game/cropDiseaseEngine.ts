/**
 * Dynamic Crop Disease & Blight Ecosystem Engine
 *
 * Implements real-time environmental pathogen dynamics:
 * - 🪱 Anaerobic Root Rot (Fungal / Anoxic): Soil O2 < 20% for >45s (Standing water / poor drainage)
 * - 🍄 Foliar Mildew & Rust (Canopy Stagnation): CO2 > 80% in warm, humid weather with stagnant ventilation
 * - ☣️ Slurry Scorching & Bacterial Soft Rot: Raw slurry or 100% Nitrogen pegged during humid/heat spells
 * - 🌐 Spatial Contagion: Spreads to orthogonal neighbors every 45–60s
 * - ✂️ Tool Sanitation: Contaminated harvesting tools have 50% infection transmission risk
 * - ☀️ Soil Recovery: Contaminated Dirt tag requiring Slaked Lime or Clear Tarp Solarization
 */

import { type WeatherProfileId } from '@/game/weatherEngine';
import { type CropId, CROPS } from '@/game/data';

export const CURE_BASE_MIN_COINS = 5;
export const CURE_PLANT_COST_MULTIPLIER = 2;

/**
 * Calculates the coin cost for curing a single diseased plot.
 * Rule: 2x seed planting cost, with a minimum floor of 5 coins (e.g. for free seeds like wheat/corn).
 */
export function calculatePlotCureCost(cropId?: CropId | null): number {
  const seedCost = cropId && CROPS[cropId] ? CROPS[cropId].seedCost : 0;
  return Math.max(CURE_BASE_MIN_COINS, Math.ceil(seedCost * CURE_PLANT_COST_MULTIPLIER));
}

export type CropDiseaseType = 'root_rot' | 'foliar_mildew' | 'bacterial_soft_rot';

export interface CropDiseaseDef {
  type: CropDiseaseType;
  name: string;
  emoji: string;
  subTitle: string;
  causeDescription: string;
  symptoms: string;
  remedyActionLabel: string;
  remedyActionKey: 'dig_drain' | 'prune_mildew' | 'apply_lime';
  timeToDeathSec: number;
  contagionIntervalSec: number;
  growthSpeedPenalty: number;
}

export const CROP_DISEASE_DEFINITIONS: Record<CropDiseaseType, CropDiseaseDef> = {
  root_rot: {
    type: 'root_rot',
    name: 'Anaerobic Root Rot',
    emoji: '🪱',
    subTitle: 'Fungal / Anoxic Water-Logging',
    causeDescription: 'Standing Water & Soil O₂ < 20% for >45s',
    symptoms: 'Water-soaked stem bases, yellowing drooping foliage',
    remedyActionLabel: 'Dig Drain & Till Hoe',
    remedyActionKey: 'dig_drain',
    timeToDeathSec: 120, // 2 minutes before plant collapses
    contagionIntervalSec: 60,
    growthSpeedPenalty: 0.5, // 0.5x speed drag (Progression with drag - no freeze)
  },
  foliar_mildew: {
    type: 'foliar_mildew',
    name: 'Foliar Mildew & Rust',
    emoji: '🍄',
    subTitle: 'High Humidity & Canopy Stagnation',
    causeDescription: 'Crowded Enclosed Canopy & CO₂ > 80% in Humid Air',
    symptoms: 'Grayish-white spore coating on leaf surfaces; stunted growth',
    remedyActionLabel: 'Prune Foliage & Milk Wash',
    remedyActionKey: 'prune_mildew',
    timeToDeathSec: 150, // 2.5 minutes before yield ruined
    contagionIntervalSec: 50,
    growthSpeedPenalty: 0.7, // -0.30x growth penalty (0.70x speed)
  },
  bacterial_soft_rot: {
    type: 'bacterial_soft_rot',
    name: 'Slurry Scorch & Bacterial Soft Rot',
    emoji: '☣️',
    subTitle: 'Excess Nitrogen Scorch & Raw Slurry',
    causeDescription: 'Raw Unpasteurized Slurry or 100% N in Heat/Humid Spell',
    symptoms: 'Brown slimy lesions on fruit, foul odor vapor rising from dirt',
    remedyActionLabel: 'Dress Slaked Lime / Bio-Char',
    remedyActionKey: 'apply_lime',
    timeToDeathSec: 90, // fast 90s liquidation
    contagionIntervalSec: 45,
    growthSpeedPenalty: 0.4, // Locked minimum 0.40x floor drag
  },
};

export interface PlotDiseaseState {
  type: CropDiseaseType;
  name: string;
  emoji: string;
  causeDescription: string;
  infectedAt: number;
  stage: 'warning' | 'active'; // 15s warning phase before active
  warningTimerSec: number;     // 15s countdown
  timeRemainingSec: number;    // Countdown until permanent crop death / liquidation
  spreadTimerSec: number;      // Contagion spread countdown
  yieldReductionPct: number;   // Yield cut percentage
}

export interface DiseaseSimulationContext {
  activeWeatherId: WeatherProfileId;
  deltaSeconds: number;
  isRainstormActive: boolean;
  unlockedPlots: number;
}

export interface DiseaseTickResult {
  updatedDisease: PlotDiseaseState | null;
  newLowO2Seconds: number;
  newHighCo2Seconds: number;
  newHighNSeconds: number;
  isCropDead: boolean;
  shouldContaminateDirt: boolean;
  spreadOutbreakType?: CropDiseaseType;
  notification?: { text: string; icon: string; type: 'info' | 'event' | 'danger' };
}

/**
 * Calculates orthogonal neighbor plot indices on a logical 6-column grid.
 */
export function getOrthogonalNeighborPlotIds(plotId: number, totalUnlocked: number, cols = 6): number[] {
  const neighbors: number[] = [];
  const row = Math.floor(plotId / cols);
  const col = plotId % cols;

  // Left
  if (col > 0) neighbors.push(plotId - 1);
  // Right
  if (col < cols - 1 && plotId + 1 < totalUnlocked) neighbors.push(plotId + 1);
  // Up
  if (row > 0) neighbors.push(plotId - cols);
  // Down
  if (plotId + cols < totalUnlocked) neighbors.push(plotId + cols);

  return neighbors.filter(id => id >= 0 && id < totalUnlocked);
}

/**
 * Core simulation tick for a single plot's crop disease status.
 */
export function stepPlotDiseaseTick(
  plot: {
    id: number;
    crop: string | null;
    ready: boolean;
    moistureLevel?: number;
    gases?: { o2: number; co2: number; nitrogen: number };
    disease?: PlotDiseaseState | null;
    lowO2DurationSec?: number;
    highCo2DurationSec?: number;
    highNitrogenDurationSec?: number;
    isContaminatedDirt?: boolean;
  },
  ctx: DiseaseSimulationContext
): DiseaseTickResult {
  let disease: PlotDiseaseState | null = plot.disease ? { ...plot.disease } : null;
  let lowO2Sec = plot.lowO2DurationSec || 0;
  let highCo2Sec = plot.highCo2DurationSec || 0;
  let highNSec = plot.highNitrogenDurationSec || 0;
  let isCropDead = false;
  let shouldContaminateDirt = false;
  let spreadOutbreakType: CropDiseaseType | undefined = undefined;
  let notification: { text: string; icon: string; type: 'info' | 'event' | 'danger' } | undefined = undefined;

  // Empty or already ready crops don't incubate new vegetative diseases,
  // but existing diseases tick countdowns
  if (!plot.crop || plot.ready) {
    return {
      updatedDisease: null,
      newLowO2Seconds: 0,
      newHighCo2Seconds: 0,
      newHighNSeconds: 0,
      isCropDead: false,
      shouldContaminateDirt: false,
    };
  }

  const o2 = plot.gases?.o2 !== undefined ? plot.gases.o2 : 60;
  const co2 = plot.gases?.co2 !== undefined ? plot.gases.co2 : 65;
  const nitrogen = plot.gases?.nitrogen !== undefined ? plot.gases.nitrogen : 85;
  const moisture = plot.moistureLevel !== undefined ? plot.moistureLevel : 60;

  // -------------------------------------------------------------
  // 1. INCUBATION ACCUMULATION (When plot is NOT yet actively diseased)
  // -------------------------------------------------------------
  if (!disease) {
    // Condition A: Anaerobic Root Rot (O2 < 20% or flooded moisture > 85%)
    const isAnoxic = o2 < 20 || (moisture >= 85 && o2 < 35);
    if (isAnoxic) {
      lowO2Sec += ctx.deltaSeconds;
      if (lowO2Sec >= 30 && lowO2Sec < 45) {
        // 15-second Early Warning Trigger
        disease = {
          type: 'root_rot',
          name: CROP_DISEASE_DEFINITIONS.root_rot.name,
          emoji: '🪱',
          causeDescription: `Standing Water (O₂: ${Math.round(o2)}%)`,
          infectedAt: Date.now(),
          stage: 'warning',
          warningTimerSec: Math.max(1, Math.round(45 - lowO2Sec)),
          timeRemainingSec: CROP_DISEASE_DEFINITIONS.root_rot.timeToDeathSec,
          spreadTimerSec: CROP_DISEASE_DEFINITIONS.root_rot.contagionIntervalSec,
          yieldReductionPct: 0,
        };
      } else if (lowO2Sec >= 45) {
        // Full Active Infection
        disease = {
          type: 'root_rot',
          name: CROP_DISEASE_DEFINITIONS.root_rot.name,
          emoji: '🪱',
          causeDescription: `Standing Water (O₂: ${Math.round(o2)}%)`,
          infectedAt: Date.now(),
          stage: 'active',
          warningTimerSec: 0,
          timeRemainingSec: CROP_DISEASE_DEFINITIONS.root_rot.timeToDeathSec,
          spreadTimerSec: CROP_DISEASE_DEFINITIONS.root_rot.contagionIntervalSec,
          yieldReductionPct: 50,
        };
        notification = {
          text: `🪱 Anaerobic Root Rot infected Plot #${plot.id + 1}! Soil O₂ fell below 20%. Dig drainage ditch or till hoe to cure!`,
          icon: '🪱',
          type: 'danger',
        };
      }
    } else {
      lowO2Sec = Math.max(0, lowO2Sec - ctx.deltaSeconds * 2);
    }

    // Condition B: Foliar Mildew & Rust (CO2 > 80% in humid / stagnant air)
    const isHumidWeather = ['humid', 'cloudy', 'drizzle', 'rain', 'foggy'].includes(ctx.activeWeatherId) || moisture >= 70;
    const isMildewStagnant = co2 >= 80 && isHumidWeather;
    if (!disease && isMildewStagnant) {
      highCo2Sec += ctx.deltaSeconds;
      if (highCo2Sec >= 30 && highCo2Sec < 45) {
        // 15-second Early Warning Trigger
        disease = {
          type: 'foliar_mildew',
          name: CROP_DISEASE_DEFINITIONS.foliar_mildew.name,
          emoji: '🍄',
          causeDescription: `Stagnant Canopy (CO₂: ${Math.round(co2)}%)`,
          infectedAt: Date.now(),
          stage: 'warning',
          warningTimerSec: Math.max(1, Math.round(45 - highCo2Sec)),
          timeRemainingSec: CROP_DISEASE_DEFINITIONS.foliar_mildew.timeToDeathSec,
          spreadTimerSec: CROP_DISEASE_DEFINITIONS.foliar_mildew.contagionIntervalSec,
          yieldReductionPct: 0,
        };
      } else if (highCo2Sec >= 45) {
        disease = {
          type: 'foliar_mildew',
          name: CROP_DISEASE_DEFINITIONS.foliar_mildew.name,
          emoji: '🍄',
          causeDescription: `Stagnant Canopy (CO₂: ${Math.round(co2)}%)`,
          infectedAt: Date.now(),
          stage: 'active',
          warningTimerSec: 0,
          timeRemainingSec: CROP_DISEASE_DEFINITIONS.foliar_mildew.timeToDeathSec,
          spreadTimerSec: CROP_DISEASE_DEFINITIONS.foliar_mildew.contagionIntervalSec,
          yieldReductionPct: 50,
        };
        notification = {
          text: `🍄 Foliar Mildew outbreak on Plot #${plot.id + 1}! Stagnant CO₂ canopy produced spore growth. Prune leaves or spray milk wash!`,
          icon: '🍄',
          type: 'danger',
        };
      }
    } else if (!isMildewStagnant) {
      highCo2Sec = Math.max(0, highCo2Sec - ctx.deltaSeconds * 2);
    }

    // Condition C: Slurry Scorching & Bacterial Soft Rot (Nitrogen pegged at 100% in humid / heat)
    const isHumidHeat = ['heatwave', 'drought', 'humid', 'sunny'].includes(ctx.activeWeatherId) || moisture >= 65;
    const isNitrogenPegged = nitrogen >= 98 && isHumidHeat;
    if (!disease && isNitrogenPegged) {
      highNSec += ctx.deltaSeconds;
      if (highNSec >= 30 && highNSec < 45) {
        // 15-second Early Warning Trigger
        disease = {
          type: 'bacterial_soft_rot',
          name: CROP_DISEASE_DEFINITIONS.bacterial_soft_rot.name,
          emoji: '☣️',
          causeDescription: `Nitrogen Scorch (N: ${Math.round(nitrogen)}%)`,
          infectedAt: Date.now(),
          stage: 'warning',
          warningTimerSec: Math.max(1, Math.round(45 - highNSec)),
          timeRemainingSec: CROP_DISEASE_DEFINITIONS.bacterial_soft_rot.timeToDeathSec,
          spreadTimerSec: CROP_DISEASE_DEFINITIONS.bacterial_soft_rot.contagionIntervalSec,
          yieldReductionPct: 0,
        };
      } else if (highNSec >= 45) {
        disease = {
          type: 'bacterial_soft_rot',
          name: CROP_DISEASE_DEFINITIONS.bacterial_soft_rot.name,
          emoji: '☣️',
          causeDescription: `Nitrogen Scorch (N: ${Math.round(nitrogen)}%)`,
          infectedAt: Date.now(),
          stage: 'active',
          warningTimerSec: 0,
          timeRemainingSec: CROP_DISEASE_DEFINITIONS.bacterial_soft_rot.timeToDeathSec,
          spreadTimerSec: CROP_DISEASE_DEFINITIONS.bacterial_soft_rot.contagionIntervalSec,
          yieldReductionPct: 75,
        };
        notification = {
          text: `☣️ Bacterial Soft Rot on Plot #${plot.id + 1}! Extreme nitrogen scorch caused tissue decay. Apply Slaked Lime to neutralize!`,
          icon: '☣️',
          type: 'danger',
        };
      }
    } else if (!isNitrogenPegged) {
      highNSec = Math.max(0, highNSec - ctx.deltaSeconds * 2);
    }
  }

  // -------------------------------------------------------------
  // 2. ACTIVE DISEASE PROGRESSION, TIMERS & CONTAGION
  // -------------------------------------------------------------
  if (disease) {
    if (disease.stage === 'warning') {
      disease.warningTimerSec = Math.max(0, disease.warningTimerSec - ctx.deltaSeconds);
      if (disease.warningTimerSec <= 0) {
        disease.stage = 'active';
        disease.yieldReductionPct = disease.type === 'bacterial_soft_rot' ? 75 : 50;
        notification = {
          text: `🚨 Infection Confirmed on Plot #${plot.id + 1}: ${disease.name}! Treat immediately before crop death!`,
          icon: disease.emoji,
          type: 'danger',
        };
      }
    } else {
      // Active stage: countdown to plant death / liquidation
      disease.timeRemainingSec = Math.max(0, disease.timeRemainingSec - ctx.deltaSeconds);

      // Yield erosion: drop by additional 10% every 30s
      if (disease.type === 'root_rot' && Math.round(disease.timeRemainingSec) % 30 === 0) {
        disease.yieldReductionPct = Math.min(90, disease.yieldReductionPct + 10);
      }

      // Check for permanent crop liquidation / death
      if (disease.timeRemainingSec <= 0) {
        isCropDead = true;
        // Bacterial soft rot renders soil Contaminated Dirt for 1 subsequent cycle
        if (disease.type === 'bacterial_soft_rot') {
          shouldContaminateDirt = true;
        }
        notification = {
          text: `🥀 Crop on Plot #${plot.id + 1} collapsed from ${disease.name}! Clear plot with Hoe and dress dirt.`,
          icon: '🥀',
          type: 'danger',
        };
        disease = null;
      } else {
        // Contagion spread countdown to adjacent plots
        disease.spreadTimerSec = Math.max(0, disease.spreadTimerSec - ctx.deltaSeconds);
        if (disease.spreadTimerSec <= 0) {
          spreadOutbreakType = disease.type;
          disease.spreadTimerSec = CROP_DISEASE_DEFINITIONS[disease.type].contagionIntervalSec;
        }
      }
    }
  }

  return {
    updatedDisease: disease,
    newLowO2Seconds: lowO2Sec,
    newHighCo2Seconds: highCo2Sec,
    newHighNSeconds: highNSec,
    isCropDead,
    shouldContaminateDirt,
    spreadOutbreakType,
    notification,
  };
}

/**
 * Creates an initial infection state for a targeted plot (e.g. from contagion spread or tool contamination).
 */
export function createPlotInfection(type: CropDiseaseType, causeNote?: string): PlotDiseaseState {
  const def = CROP_DISEASE_DEFINITIONS[type];
  return {
    type,
    name: def.name,
    emoji: def.emoji,
    causeDescription: causeNote || def.causeDescription,
    infectedAt: Date.now(),
    stage: 'active',
    warningTimerSec: 0,
    timeRemainingSec: def.timeToDeathSec,
    spreadTimerSec: def.contagionIntervalSec,
    yieldReductionPct: type === 'bacterial_soft_rot' ? 75 : 50,
  };
}
