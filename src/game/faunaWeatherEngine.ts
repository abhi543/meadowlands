import { type WeatherProfileId } from './weatherEngine';
import { type AnimalSpecies } from './data';
import { type PrehistoricSanctuaryState } from '@/types/prehistoric';

export type FaunaClimateCondition = 'heatwave' | 'frost' | 'rain' | 'storm' | 'mild';

export interface PastureWelfareState {
  hasShadedCanopy: boolean;
  hasMudWallow: boolean;
  hasDrainageFurrows: boolean;
  hasStrawBedding: boolean;
  hasElevatedPlatforms: boolean;
  hasWindbreak: boolean;
  areBarnDoorsLatched: boolean;
  isFenceDamaged: boolean;
  pensMuckedOutAt: number;
  mudExposureSec: number;
  calmingHerbsDoses: number;
  troughThawedUntil: number;
  lastManureGenerationAt?: number;
}

export function createDefaultPastureWelfare(): PastureWelfareState {
  return {
    hasShadedCanopy: false,
    hasMudWallow: false,
    hasDrainageFurrows: false,
    hasStrawBedding: true,
    hasElevatedPlatforms: false,
    hasWindbreak: false,
    areBarnDoorsLatched: false,
    isFenceDamaged: false,
    pensMuckedOutAt: Date.now(),
    mudExposureSec: 0,
    calmingHerbsDoses: 3,
    troughThawedUntil: 0,
    lastManureGenerationAt: Date.now(),
  };
}

export interface FaunaWeatherEvaluation {
  condition: FaunaClimateCondition;
  conditionName: string;
  conditionEmoji: string;
  isMitigated: boolean;
  mitigationReasons: string[];
  waterConsumptionMultiplier: number;
  feedConsumptionMultiplier: number;
  yieldMultiplier: number;
  isYieldFrozen: boolean;
  isBreedingPaused: boolean;
  isTroughFrozen: boolean;
  manureRateMultiplier: number;
  co2CanopyActive: boolean;
  behavioralState: 'content' | 'panting' | 'shivering' | 'mud_soaked' | 'panicked';
  statusBadge: {
    text: string;
    emoji: string;
    color: string;
    tooltip: string;
  };
  alertText?: string;
}

/**
 * Evaluates the impact of environmental weather on farm animals and sanctuary fauna.
 */
export function evaluateFaunaWeather(params: {
  activeWeatherId: WeatherProfileId;
  temperatureC: number;
  isRainstormActive?: boolean;
  pastureWelfare?: Partial<PastureWelfareState>;
  sanctuary?: PrehistoricSanctuaryState;
  hasThermalCore?: boolean;
  hasSiphonValve?: boolean;
  farmLevel?: number;
  isHardcoreMode?: boolean;
}): FaunaWeatherEvaluation {
  const {
    activeWeatherId,
    temperatureC,
    isRainstormActive = false,
    pastureWelfare = {},
    sanctuary,
    hasThermalCore = false,
    hasSiphonValve = false,
    farmLevel = 1,
  } = params;

  // Check Prehistoric Fauna passive estate perks
  const hasDimetrodon = Boolean(
    sanctuary?.enclosures?.enclosure_geothermal_basin?.specimenCount &&
    sanctuary.enclosures.enclosure_geothermal_basin.specimenCount > 0 &&
    !sanctuary.enclosures.enclosure_geothermal_basin.isStarving
  );

  const hasWoollyMammoth = Boolean(
    sanctuary?.enclosures?.enclosure_glacial_paddock?.specimenCount &&
    sanctuary.enclosures.enclosure_glacial_paddock.specimenCount > 0 &&
    !sanctuary.enclosures.enclosure_glacial_paddock.isStarving
  );

  // 1. Classify climate condition
  let condition: FaunaClimateCondition = 'mild';
  const isHeat = activeWeatherId === 'heatwave' || activeWeatherId === 'drought' || activeWeatherId === 'plasma_firestorm' || temperatureC >= 35;
  const isCold = activeWeatherId === 'frost' || activeWeatherId === 'snow' || activeWeatherId === 'polar_vortex' || temperatureC <= 0;
  const isRain = isRainstormActive || activeWeatherId === 'rain' || activeWeatherId === 'monsoon' || activeWeatherId === 'supercell_deluge' || activeWeatherId === 'alchemical_monsoon';
  const isStorm = activeWeatherId === 'gale' || activeWeatherId === 'thunderstorm' || activeWeatherId === 'cyclone' || activeWeatherId === 'hyper_cyclone' || activeWeatherId === 'haboob_sandstorm';

  if (isHeat) {
    condition = 'heatwave';
  } else if (isCold) {
    condition = 'frost';
  } else if (isStorm) {
    condition = 'storm';
  } else if (isRain) {
    condition = 'rain';
  }

  const now = Date.now();
  const isTroughThawed = (pastureWelfare.troughThawedUntil || 0) > now;
  const mitigationReasons: string[] = [];

  // Default baseline
  let isMitigated = false;
  let waterConsumptionMultiplier = 1.0;
  let feedConsumptionMultiplier = 1.0;
  let yieldMultiplier = 1.0;
  let isYieldFrozen = false;
  let isBreedingPaused = false;
  let isTroughFrozen = false;
  let manureRateMultiplier = 1.0;
  let co2CanopyActive = true;
  let behavioralState: 'content' | 'panting' | 'shivering' | 'mud_soaked' | 'panicked' = 'content';
  let conditionName = 'Mild Weather';
  let conditionEmoji = '🌤️';
  let alertText: string | undefined = undefined;

  // Status badge
  let badgeText = 'Comfortable & Content';
  let badgeEmoji = '✨';
  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let badgeTooltip = 'Weather conditions are optimal. Animals are calm and producing standard yields.';

  switch (condition) {
    case 'heatwave': {
      conditionName = 'Severe Heatwave';
      conditionEmoji = '☀️';
      behavioralState = 'panting';

      // Mitigations
      if (pastureWelfare.hasShadedCanopy) mitigationReasons.push('Shaded Canopies Mounted');
      if (pastureWelfare.hasMudWallow) mitigationReasons.push('Cooling Mud Wallow Dug');
      if (hasSiphonValve) mitigationReasons.push('Aquifer Siphon Trough Pressurized');
      if (hasWoollyMammoth) mitigationReasons.push('Mammoth Heat Relief Aura');

      isMitigated = mitigationReasons.length > 0;

      if (isMitigated) {
        waterConsumptionMultiplier = 1.3; // Dampened water surge
        feedConsumptionMultiplier = 0.9;
        yieldMultiplier = 0.9;
        manureRateMultiplier = 0.85;
        badgeText = 'Shaded & Cool';
        badgeEmoji = '🛡️☀️';
        badgeColor = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
        badgeTooltip = `Heatwave mitigated by ${mitigationReasons.join(', ')}. Animals comfortable!`;
      } else {
        waterConsumptionMultiplier = 2.5; // Troughs deplete 2.5x rapidly
        feedConsumptionMultiplier = 0.7; // Drops by 30%
        yieldMultiplier = 0.6; // Decreases by 40%
        manureRateMultiplier = 0.5; // Halved manure (choking nitrogen supply)
        badgeText = 'Heat Stressed: Water 2.5x | Manure -50%';
        badgeEmoji = '🥵';
        badgeColor = 'bg-rose-500/25 text-rose-300 border-rose-500/50 animate-pulse';
        badgeTooltip = 'Severe heatwave! Water consumption 2.5x, yields cut by 40%, manure halved. Build shade canopies or mud wallow.';
        alertText = '☀️ Pasture Heat Stress: Animals panting heavily! Trough water draining at 2.5x speed.';
      }
      break;
    }

    case 'frost': {
      conditionName = 'Frost Snap & Blizzard';
      conditionEmoji = '❄️';
      behavioralState = 'shivering';

      // Mitigations
      if (hasDimetrodon) mitigationReasons.push('Dimetrodon Geothermal Radiance Sail');
      if (hasThermalCore) mitigationReasons.push('Barn Thermal Retaining Core');
      if (pastureWelfare.hasStrawBedding) mitigationReasons.push('Insulated Straw Bedding');
      if (isTroughThawed) mitigationReasons.push('Geothermal / Brazier Thawed Trough');

      isMitigated = Boolean(hasDimetrodon || hasThermalCore || (pastureWelfare.hasStrawBedding && isTroughThawed));

      if (isMitigated) {
        feedConsumptionMultiplier = 1.1; // Slight caloric intake to keep warm
        waterConsumptionMultiplier = 1.0;
        yieldMultiplier = 1.0;
        isYieldFrozen = false;
        isTroughFrozen = false;
        manureRateMultiplier = 1.0;
        badgeText = 'Heated & Sheltered';
        badgeEmoji = '🔥❄️';
        badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
        badgeTooltip = `Sub-zero cold mitigated by ${mitigationReasons.join(', ')}. Livestock warm and producing.`;
      } else {
        feedConsumptionMultiplier = 1.4; // Caloric burn spikes +40%
        isTroughFrozen = !isTroughThawed; // Unheated troughs freeze solid
        isYieldFrozen = true; // Milk, eggs, and wool freeze completely (0% yield)
        yieldMultiplier = 0.0;
        manureRateMultiplier = 0.2;
        badgeText = 'Freezing: Needs Warmth | Yield Frozen';
        badgeEmoji = '🥶';
        badgeColor = 'bg-cyan-500/25 text-cyan-300 border-cyan-400/60 animate-pulse';
        badgeTooltip = 'Sub-zero frost snap! Troughs frozen, animals shivering, yields completely halted (0%). Deploy Dimetrodon or thaw troughs.';
        alertText = '❄️ Frost Lockout: Water troughs froze solid! Milk and egg production frozen at 0% until warmed.';
      }
      break;
    }

    case 'rain': {
      conditionName = 'Torrential Deluge';
      conditionEmoji = '🌧️';
      behavioralState = 'mud_soaked';

      // Mitigations
      if (pastureWelfare.hasDrainageFurrows) mitigationReasons.push('Perimeter Drainage Furrows');
      if (pastureWelfare.hasElevatedPlatforms) mitigationReasons.push('Elevated Wooden Slatted Platforms');

      const isSoiled = (pastureWelfare.mudExposureSec || 0) > 60;
      isMitigated = Boolean(pastureWelfare.hasDrainageFurrows || pastureWelfare.hasElevatedPlatforms);

      if (isMitigated) {
        waterConsumptionMultiplier = 1.0;
        feedConsumptionMultiplier = 1.0;
        yieldMultiplier = 1.0;
        isBreedingPaused = false;
        manureRateMultiplier = 1.0;
        badgeText = 'Drained & Elevated';
        badgeEmoji = '🛡️🌧️';
        badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
        badgeTooltip = `Torrential rain diverted by ${mitigationReasons.join(', ')}. Enclosure dry and sanitary.`;
      } else {
        // Enclosure converts to mud slurry
        isBreedingPaused = true; // Breeding timers and fleece growth paused due to stress
        manureRateMultiplier = isSoiled ? 0.0 : 0.4; // Soiled bedding prevents manure collection
        yieldMultiplier = 0.75;
        badgeText = isSoiled ? 'Soiled Mud: Foot Rot Risk | Breeding Halted' : 'Mud Slurry: Breeding Halted';
        badgeEmoji = isSoiled ? '🐾⚠️' : '🌧️';
        badgeColor = 'bg-amber-600/25 text-amber-300 border-amber-500/50 animate-pulse';
        badgeTooltip = 'Heavy deluge creating deep mud! Breeding paused and soiled bedding prevents manure collection. Build platforms or muck out.';
        alertText = '🌧️ Mud Slurry Inundation: Animal pens flooded! Elevated platforms or drainage needed.';
      }
      break;
    }

    case 'storm': {
      conditionName = 'Gale & Severe Storm';
      conditionEmoji = '⚡';
      behavioralState = 'panicked';

      // Mitigations
      if (pastureWelfare.areBarnDoorsLatched) mitigationReasons.push('Barn Doors Latched & Secured');
      if (pastureWelfare.hasWindbreak || farmLevel >= 4) mitigationReasons.push('Cedar Windbreak & Boundary Walls');

      isMitigated = Boolean(pastureWelfare.areBarnDoorsLatched || (pastureWelfare.hasWindbreak && farmLevel >= 4));

      if (isMitigated) {
        waterConsumptionMultiplier = 1.0;
        feedConsumptionMultiplier = 1.0;
        yieldMultiplier = 0.9;
        isBreedingPaused = false;
        co2CanopyActive = true;
        manureRateMultiplier = 1.0;
        badgeText = 'Latched & Secured Indoors';
        badgeEmoji = '🚪⚡';
        badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
        badgeTooltip = `Herd secured indoors (${mitigationReasons.join(', ')}). Stampede risk eliminated.`;
      } else {
        feedConsumptionMultiplier = 0.0; // Animals stop feeding/resting during active storm
        yieldMultiplier = 0.0;
        isBreedingPaused = true;
        co2CanopyActive = false; // Animals retreated indoors in panic; outdoor crop CO2 canopy removed!
        manureRateMultiplier = 0.0;
        badgeText = 'Agitated: Panic Risk | Fences at Risk';
        badgeEmoji = '⚡⚠️';
        badgeColor = 'bg-yellow-500/25 text-yellow-300 border-yellow-400/60 animate-bounce';
        badgeTooltip = 'Howling gale and thunder! Animals in frantic panic; fence lines at risk of breaking. Latch barn doors or feed calming herbs.';
        alertText = '⚡ Herd Panic Alert: Storm panic active! Animals stopped feeding and fences are shaking.';
      }
      break;
    }

    default: {
      conditionName = 'Mild Pasture Weather';
      conditionEmoji = '🌤️';
      behavioralState = 'content';
      badgeText = 'Content & Comfortable';
      badgeEmoji = '✨';
      badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      badgeTooltip = 'Ideal pastoral conditions. Maximum yield and active +40% CO2 breathing canopy.';
      break;
    }
  }

  return {
    condition,
    conditionName,
    conditionEmoji,
    isMitigated,
    mitigationReasons,
    waterConsumptionMultiplier,
    feedConsumptionMultiplier,
    yieldMultiplier,
    isYieldFrozen,
    isBreedingPaused,
    isTroughFrozen,
    manureRateMultiplier,
    co2CanopyActive,
    behavioralState,
    statusBadge: {
      text: badgeText,
      emoji: badgeEmoji,
      color: badgeColor,
      tooltip: badgeTooltip,
    },
    alertText,
  };
}
