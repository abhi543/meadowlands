/**
 * Multi-Variable Atmospheric Weather & Climate-Driven Crop Phenology Engine
 * 
 * Implements 16 deterministic meteorologic profiles across 5 categories,
 * continuous thermodynamic soil evaporation, finite fluid closed-loop coupling,
 * crop thermal taxonomy (Sun-Loving, Cool-Season, Temperate Berry), and
 * severe convective mechanical hazard states.
 */

import { type CropId } from '@/game/data';
import { type CanalTier } from '@/game/hydrologyEngine';

// --- 16 Deterministic Weather Profiles ---
export type WeatherProfileId =
  // A. Clear & Thermal
  | 'sunny'
  | 'heatwave'
  | 'drought'
  // B. Overcast & High Humidity
  | 'cloudy'
  | 'humid'
  | 'foggy'
  // C. Active Precipitation
  | 'drizzle'
  | 'rain'
  | 'monsoon'
  | 'sunshower'
  // D. Severe Convective & Mechanical Hazards
  | 'gale'
  | 'thunderstorm'
  | 'hailstorm'
  | 'cyclone'
  // E. Freezing & Arid
  | 'frost'
  | 'snow';

export type WeatherCategoryId =
  | 'clear_thermal'
  | 'overcast_humid'
  | 'precipitation'
  | 'severe_convective'
  | 'freezing_arid';

export interface WeatherProfileDef {
  id: WeatherProfileId;
  name: string;
  category: WeatherCategoryId;
  categoryLabel: string;
  emoji: string;
  description: string;
  // Multi-variable atmospheric parameters
  tempRangeC: [number, number];
  defaultTempC: number;
  humidityRangePct: [number, number];
  defaultHumidityPct: number;
  precipitationInflowLPerMin: number;
  windSpeedKmH: number;
  cloudCoverPct: number;
  barometricPressureHPa: number;
  // Hydrology & Plot Soil Wetting/Decay modifiers
  plotDirectMoistureGainPctPerMin: number;
  baseEvaporativeFactor: number; // baseline thermodynamic scale
  // Phenology & Agronomic Impacts
  phenologyNotes: string;
  visualHazeClass: string;
}

export const WEATHER_PROFILES: Record<WeatherProfileId, WeatherProfileDef> = {
  // A. Clear & Thermal
  sunny: {
    id: 'sunny',
    name: 'Sunny / Clear Skies',
    category: 'clear_thermal',
    categoryLabel: 'Clear & Thermal',
    emoji: '☀️',
    description: 'Crisp bright sunshine. Moderate baseline evaporation with high photosynthetic energy.',
    tempRangeC: [22, 32],
    defaultTempC: 27,
    humidityRangePct: [30, 50],
    defaultHumidityPct: 40,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 10,
    cloudCoverPct: 5,
    barometricPressureHPa: 1015,
    plotDirectMoistureGainPctPerMin: 0,
    baseEvaporativeFactor: 1.0,
    phenologyNotes: '+10% solar growth speed for sun-loving crops (Corn, Pumpkin, Cotton, Soy).',
    visualHazeClass: 'from-amber-500/10 via-yellow-500/5 to-transparent',
  },
  heatwave: {
    id: 'heatwave',
    name: 'Hot Weather & Heatwave',
    category: 'clear_thermal',
    categoryLabel: 'Clear & Thermal',
    emoji: '🔥',
    description: 'Blistering thermal surge. High evaporation strips soil rapidly and boils cistern water.',
    tempRangeC: [38, 46],
    defaultTempC: 42,
    humidityRangePct: [12, 25],
    defaultHumidityPct: 18,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 18,
    cloudCoverPct: 0,
    barometricPressureHPa: 1008,
    plotDirectMoistureGainPctPerMin: 0,
    baseEvaporativeFactor: 2.2, // -5.0% to -6.0% per min
    phenologyNotes: 'Thermal scorching: Cool crops (Carrot, Wheat) wilt. Sun crops get +20% speed if soil > 50%.',
    visualHazeClass: 'from-orange-600/20 via-red-600/10 to-amber-500/10 animate-pulse',
  },
  drought: {
    id: 'drought',
    name: 'Dry / Drought Condition',
    category: 'clear_thermal',
    categoryLabel: 'Clear & Thermal',
    emoji: '🏜️',
    description: 'Prolonged parched high-pressure ridge. Deep aquifer natural recharge drops to 0 L/min.',
    tempRangeC: [32, 36],
    defaultTempC: 34,
    humidityRangePct: [10, 18],
    defaultHumidityPct: 14,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 22,
    cloudCoverPct: 0,
    barometricPressureHPa: 1022,
    plotDirectMoistureGainPctPerMin: 0,
    baseEvaporativeFactor: 1.6, // -3.8% per min
    phenologyNotes: 'Rapid desiccation (<15%). Withering timers activate quickly unless irrigated.',
    visualHazeClass: 'from-amber-700/15 via-stone-800/20 to-transparent',
  },

  // B. Overcast & High Humidity
  cloudy: {
    id: 'cloudy',
    name: 'Cloudy / Overcast',
    category: 'overcast_humid',
    categoryLabel: 'Overcast & Humidity',
    emoji: '☁️',
    description: 'Dense blanket of stratus clouds. Diffuse sunlight cuts evaporative losses by half.',
    tempRangeC: [18, 24],
    defaultTempC: 21,
    humidityRangePct: [60, 75],
    defaultHumidityPct: 68,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 15,
    cloudCoverPct: 85,
    barometricPressureHPa: 1012,
    plotDirectMoistureGainPctPerMin: 0,
    baseEvaporativeFactor: 0.5, // -1.2% per min
    phenologyNotes: 'Stable unhurried growth; soil retains water much longer.',
    visualHazeClass: 'from-stone-500/15 via-slate-600/10 to-transparent',
  },
  humid: {
    id: 'humid',
    name: 'Humid & Muggy',
    category: 'overcast_humid',
    categoryLabel: 'Overcast & Humidity',
    emoji: '🌫️',
    description: 'Sweltering moisture-laden air. Vapor saturation suppresses evaporative soil transpiration.',
    tempRangeC: [30, 35],
    defaultTempC: 32,
    humidityRangePct: [85, 98],
    defaultHumidityPct: 92,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 4,
    cloudCoverPct: 60,
    barometricPressureHPa: 1006,
    plotDirectMoistureGainPctPerMin: 0,
    baseEvaporativeFactor: 0.25, // -0.6% per min
    phenologyNotes: 'Vine vegetables (Pumpkin) swell, granting +1 extra harvest quantity! Spore hazard.',
    visualHazeClass: 'from-teal-600/10 via-emerald-600/10 to-transparent',
  },
  foggy: {
    id: 'foggy',
    name: 'Dense Ground Fog',
    category: 'overcast_humid',
    categoryLabel: 'Overcast & Humidity',
    emoji: '🌁',
    description: 'Heavy ground-level vapor condensation. Adds passive moisture to open plot beds.',
    tempRangeC: [10, 16],
    defaultTempC: 13,
    humidityRangePct: [98, 100],
    defaultHumidityPct: 100,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 2,
    cloudCoverPct: 100,
    barometricPressureHPa: 1016,
    plotDirectMoistureGainPctPerMin: 0.3, // +0.3% moisture / min
    baseEvaporativeFactor: 0.1,
    phenologyNotes: 'Delicate shade crops mature 25% faster. Overland caravan speed reduced by 25%.',
    visualHazeClass: 'from-slate-400/25 via-stone-300/15 to-slate-500/20 backdrop-blur-[2px]',
  },

  // C. Active Precipitation
  drizzle: {
    id: 'drizzle',
    name: 'Drizzly Mist',
    category: 'precipitation',
    categoryLabel: 'Active Precipitation',
    emoji: '🌦️',
    description: 'Gentle fine mist droplets. Sustains soil moisture without danger of flooding.',
    tempRangeC: [15, 18],
    defaultTempC: 16.5,
    humidityRangePct: [88, 94],
    defaultHumidityPct: 90,
    precipitationInflowLPerMin: 15,
    windSpeedKmH: 8,
    cloudCoverPct: 95,
    barometricPressureHPa: 1009,
    plotDirectMoistureGainPctPerMin: 1.0, // +1.0% / min
    baseEvaporativeFactor: 0.0,
    phenologyNotes: 'Gentle leaf washing; steady hydration for all cool-season crops.',
    visualHazeClass: 'from-cyan-600/15 via-blue-500/10 to-transparent',
  },
  rain: {
    id: 'rain',
    name: 'Moderate Rainy',
    category: 'precipitation',
    categoryLabel: 'Active Precipitation',
    emoji: '🌧️',
    description: 'Steady steady rainfall. Rapidly fills rain cisterns and thoroughly waters crop beds.',
    tempRangeC: [17, 21],
    defaultTempC: 19,
    humidityRangePct: [92, 98],
    defaultHumidityPct: 95,
    precipitationInflowLPerMin: 45,
    windSpeedKmH: 20,
    cloudCoverPct: 100,
    barometricPressureHPa: 1002,
    plotDirectMoistureGainPctPerMin: 3.0, // +3.0% / min
    baseEvaporativeFactor: 0.0,
    phenologyNotes: 'High hydration. Grains and leafy greens mature at peak un-penalized rates.',
    visualHazeClass: 'from-blue-600/20 via-cyan-600/15 to-transparent',
  },
  monsoon: {
    id: 'monsoon',
    name: 'Heavy Monsoon Rain',
    category: 'precipitation',
    categoryLabel: 'Active Precipitation',
    emoji: '⛈️',
    description: 'Torrential downpour with standing puddles. Extreme flood risk without proper drainage.',
    tempRangeC: [20, 24],
    defaultTempC: 22,
    humidityRangePct: [98, 100],
    defaultHumidityPct: 100,
    precipitationInflowLPerMin: 120,
    windSpeedKmH: 40,
    cloudCoverPct: 100,
    barometricPressureHPa: 994,
    plotDirectMoistureGainPctPerMin: 6.0, // +6.0% / min
    baseEvaporativeFactor: 0.0,
    phenologyNotes: 'Plots saturate rapidly (>95%). Triggers Root Rot hazard (-50% yield) if unmitigated.',
    visualHazeClass: 'from-blue-900/35 via-cyan-800/25 to-blue-950/40',
  },
  sunshower: {
    id: 'sunshower',
    name: 'Mixed Weather (Sunshower)',
    category: 'precipitation',
    categoryLabel: 'Active Precipitation',
    emoji: '🌈',
    description: 'Bright sunshine dancing through golden rain. Spawns an aesthetic atmospheric rainbow.',
    tempRangeC: [21, 25],
    defaultTempC: 23,
    humidityRangePct: [65, 75],
    defaultHumidityPct: 70,
    precipitationInflowLPerMin: 25,
    windSpeedKmH: 12,
    cloudCoverPct: 35,
    barometricPressureHPa: 1010,
    plotDirectMoistureGainPctPerMin: 1.5, // +1.5% / min
    baseEvaporativeFactor: 0.2,
    phenologyNotes: 'Rainbow Blessing: All crops harvested while active gain +10% Prismatic / Mythic quality roll chance!',
    visualHazeClass: 'from-pink-500/15 via-amber-400/15 to-cyan-400/15 animate-pulse',
  },

  // D. Severe Convective & Mechanical Hazards
  gale: {
    id: 'gale',
    name: 'Windy / Gale',
    category: 'severe_convective',
    categoryLabel: 'Severe Hazard',
    emoji: '💨',
    description: 'Howling convective gusts. High wind strips topsoil moisture and rattles tall crops.',
    tempRangeC: [14, 20],
    defaultTempC: 17,
    humidityRangePct: [30, 42],
    defaultHumidityPct: 35,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 75,
    cloudCoverPct: 25,
    barometricPressureHPa: 1000,
    plotDirectMoistureGainPctPerMin: 0,
    baseEvaporativeFactor: 1.4, // -3.5% per min
    phenologyNotes: 'Tall stalks (Corn, Wheat) suffer 10% seed-scatter loss. Windmills process at double speed (+100%).',
    visualHazeClass: 'from-teal-800/20 via-stone-600/15 to-transparent',
  },
  thunderstorm: {
    id: 'thunderstorm',
    name: 'Severe Thunderstorm',
    category: 'severe_convective',
    categoryLabel: 'Severe Hazard',
    emoji: '⚡',
    description: 'Violent atmospheric electrical discharge. Dangerous lightning strikes across estate fields.',
    tempRangeC: [18, 22],
    defaultTempC: 20,
    humidityRangePct: [94, 98],
    defaultHumidityPct: 96,
    precipitationInflowLPerMin: 90,
    windSpeedKmH: 55,
    cloudCoverPct: 100,
    barometricPressureHPa: 988,
    plotDirectMoistureGainPctPerMin: 4.5,
    baseEvaporativeFactor: 0.0,
    phenologyNotes: '2% flash strike check per plot; unprotected crops incinerate into Alchemical Ash. Shielded by Lightning Rod.',
    visualHazeClass: 'from-purple-900/40 via-blue-950/40 to-stone-950/50',
  },
  hailstorm: {
    id: 'hailstorm',
    name: 'Severe Hailstorm',
    category: 'severe_convective',
    categoryLabel: 'Severe Hazard',
    emoji: '🌨️',
    description: 'Dense barrage of frozen ice pellets. Inflicts blunt physical impact damage to crops.',
    tempRangeC: [4, 10],
    defaultTempC: 7,
    humidityRangePct: [75, 85],
    defaultHumidityPct: 80,
    precipitationInflowLPerMin: 35,
    windSpeedKmH: 45,
    cloudCoverPct: 100,
    barometricPressureHPa: 992,
    plotDirectMoistureGainPctPerMin: 1.0, // delayed melt
    baseEvaporativeFactor: 0.1,
    phenologyNotes: 'Mechanical lodging damage: Inflicts -30% flat harvest quantity reduction on unprotected crops.',
    visualHazeClass: 'from-cyan-900/35 via-slate-800/30 to-blue-950/40',
  },
  cyclone: {
    id: 'cyclone',
    name: 'Cyclonic Storm',
    category: 'severe_convective',
    categoryLabel: 'Severe Hazard',
    emoji: '🌀',
    description: 'Catastrophic low-pressure tempest. Raging winds and deluge threaten the entire estate.',
    tempRangeC: [20, 23],
    defaultTempC: 21.5,
    humidityRangePct: [100, 100],
    defaultHumidityPct: 100,
    precipitationInflowLPerMin: 180,
    windSpeedKmH: 115,
    cloudCoverPct: 100,
    barometricPressureHPa: 960,
    plotDirectMoistureGainPctPerMin: 8.0,
    baseEvaporativeFactor: 0.0,
    phenologyNotes: 'Field labor completely halted. Caravan travel times tripled. Unprotected crops risk destruction.',
    visualHazeClass: 'from-slate-950/60 via-blue-950/60 to-purple-950/60 animate-pulse',
  },

  // E. Freezing & Arid
  frost: {
    id: 'frost',
    name: 'Cold & Frosty Weather',
    category: 'freezing_arid',
    categoryLabel: 'Freezing & Arid',
    emoji: '❄️',
    description: 'Sub-zero silver frost. Earthen furrows freeze solid; root crops undergo sugar conversion.',
    tempRangeC: [-3, 3],
    defaultTempC: -0.5,
    humidityRangePct: [50, 60],
    defaultHumidityPct: 55,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 8,
    cloudCoverPct: 15,
    barometricPressureHPa: 1028,
    plotDirectMoistureGainPctPerMin: 0,
    baseEvaporativeFactor: 0.1, // -0.2% per min
    phenologyNotes: 'Warm crops get Frostbitten (growth freezes; -40% yield). Carrots gain +25% Cold-Sweetened value!',
    visualHazeClass: 'from-blue-200/20 via-sky-300/10 to-indigo-900/20',
  },
  snow: {
    id: 'snow',
    name: 'Snowy Weather',
    category: 'freezing_arid',
    categoryLabel: 'Freezing & Arid',
    emoji: '☃️',
    description: 'Silent falling white flakes. Insulating snow layer freezes surface absorption until thaw.',
    tempRangeC: [-7, 0],
    defaultTempC: -3.5,
    humidityRangePct: [75, 88],
    defaultHumidityPct: 80,
    precipitationInflowLPerMin: 25, // frozen snow equivalent
    windSpeedKmH: 20,
    cloudCoverPct: 100,
    barometricPressureHPa: 1018,
    plotDirectMoistureGainPctPerMin: 0, // 0 until thaw
    baseEvaporativeFactor: 0.05,
    phenologyNotes: 'Thermal dormancy. Warm crops freeze and perish unless sheltered by Alchemical Soil / Greenhouse.',
    visualHazeClass: 'from-indigo-100/25 via-slate-200/15 to-sky-900/25',
  },
};

// --- Multi-Variable Atmospheric Weather State ---
export interface AtmosphericWeatherState {
  currentWeather: WeatherProfileId;
  profileId?: WeatherProfileId;
  temperatureC: number;
  relativeHumidityPct: number;
  precipitationInflowLPerMin: number;
  windSpeedKmH: number;
  cloudCoverPct: number;
  barometricPressureHPa: number;
  weatherStartedAt: number;
  weatherDurationSec: number;
  isManualOverride: boolean;
  lightningStrikesCount: number;
  lastLightningFlash: number | null;
  rainbowActive: boolean;
  snowAccumulationMm: number;
  ticksElapsed?: number;
}

export function createDefaultWeatherState(initialWeather: WeatherProfileId = 'sunny'): AtmosphericWeatherState {
  const def = WEATHER_PROFILES[initialWeather] || WEATHER_PROFILES.sunny;
  return {
    currentWeather: initialWeather,
    profileId: initialWeather,
    temperatureC: def.defaultTempC,
    relativeHumidityPct: def.defaultHumidityPct,
    precipitationInflowLPerMin: def.precipitationInflowLPerMin,
    windSpeedKmH: def.windSpeedKmH,
    cloudCoverPct: def.cloudCoverPct,
    barometricPressureHPa: def.barometricPressureHPa,
    weatherStartedAt: Date.now(),
    weatherDurationSec: 600, // 10 minutes per natural weather phase
    isManualOverride: false,
    lightningStrikesCount: 0,
    lastLightningFlash: null,
    rainbowActive: false,
    snowAccumulationMm: 0,
    ticksElapsed: 0,
  };
}

// --- Crop Agronomic Families & Phenology Taxonomy ---
export type CropAgronomicFamily = 'sun_loving_warm' | 'cool_season_root' | 'temperate_berry';

export interface CropPhenologyMeta {
  cropId: CropId;
  family: CropAgronomicFamily;
  familyLabel: string;
  familyIcon: string;
  optimalWeather: WeatherProfileId[];
  coldToleranceMinC: number;
  heatToleranceMaxC: number;
}

export const CROP_PHENOLOGY_REGISTRY: Record<CropId, CropPhenologyMeta> = {
  wheat: {
    cropId: 'wheat',
    family: 'cool_season_root',
    familyLabel: 'Cool-Season Grain',
    familyIcon: '🌾',
    optimalWeather: ['cloudy', 'drizzle', 'rain', 'frost'],
    coldToleranceMinC: -2,
    heatToleranceMaxC: 36,
  },
  corn: {
    cropId: 'corn',
    family: 'sun_loving_warm',
    familyLabel: 'Sun-Loving Stalk',
    familyIcon: '🌽',
    optimalWeather: ['sunny', 'heatwave', 'humid'],
    coldToleranceMinC: 10,
    heatToleranceMaxC: 48,
  },
  carrot: {
    cropId: 'carrot',
    family: 'cool_season_root',
    familyLabel: 'Cool-Season Root',
    familyIcon: '🥕',
    optimalWeather: ['cloudy', 'frost', 'drizzle', 'foggy'],
    coldToleranceMinC: -4,
    heatToleranceMaxC: 34,
  },
  strawberry: {
    cropId: 'strawberry',
    family: 'temperate_berry',
    familyLabel: 'Temperate Berry',
    familyIcon: '🍓',
    optimalWeather: ['cloudy', 'sunshower', 'drizzle'],
    coldToleranceMinC: 5,
    heatToleranceMaxC: 35,
  },
  soybean: {
    cropId: 'soybean',
    family: 'sun_loving_warm',
    familyLabel: 'Sun-Loving Legume',
    familyIcon: '🫘',
    optimalWeather: ['sunny', 'heatwave', 'humid'],
    coldToleranceMinC: 12,
    heatToleranceMaxC: 45,
  },
  pumpkin: {
    cropId: 'pumpkin',
    family: 'sun_loving_warm',
    familyLabel: 'Sun-Loving Vine',
    familyIcon: '🎃',
    optimalWeather: ['sunny', 'heatwave', 'humid'],
    coldToleranceMinC: 8,
    heatToleranceMaxC: 46,
  },
  cotton: {
    cropId: 'cotton',
    family: 'sun_loving_warm',
    familyLabel: 'Sun-Loving Fiber',
    familyIcon: '🌿',
    optimalWeather: ['sunny', 'heatwave', 'humid'],
    coldToleranceMinC: 14,
    heatToleranceMaxC: 50,
  },
};

export interface CropPhenologyResult {
  growthSpeedMultiplier: number;
  yieldMultiplier: number;
  priceMultiplier: number;
  extraQuantity: number;
  bonusPrismaticChance: number;
  isWilted: boolean;
  isFrostbitten: boolean;
  isDormant: boolean;
  isSheltered: boolean;
  badgeEmoji: string;
  badgeText: string;
  description: string;
}

/**
 * Computes live climate-driven phenology impacts on a planted crop plot.
 */
export function evaluateCropPhenology(params: {
  cropId: CropId;
  weatherState?: AtmosphericWeatherState;
  weather?: WeatherProfileId;
  moistureLevel: number;
  isProtectedByGreenhouse?: boolean;
  hasAlchemicalAsh?: boolean;
}): CropPhenologyResult {
  const {
    cropId,
    weatherState,
    weather: directWeather,
    moistureLevel,
    isProtectedByGreenhouse = false,
    hasAlchemicalAsh = false,
  } = params;

  const pheno = CROP_PHENOLOGY_REGISTRY[cropId] || CROP_PHENOLOGY_REGISTRY.wheat;
  const weather: WeatherProfileId = directWeather || weatherState?.currentWeather || weatherState?.profileId || 'sunny';
  const def = WEATHER_PROFILES[weather] || WEATHER_PROFILES.sunny;
  const temp = weatherState ? weatherState.temperatureC : def.defaultTempC;

  let speedMult = 1.0;
  let yieldMult = 1.0;
  let priceMult = 1.0;
  let extraQty = 0;
  let bonusPrismatic = 0;
  let isWilted = false;
  let isFrostbitten = false;
  let isDormant = false;
  let badgeEmoji = pheno.familyIcon;
  let badgeText = 'Normal';
  let description = 'Standard ambient growth.';

  // 1. Sunshower Blessing (Rainbow active)
  if (weatherState?.rainbowActive || weather === 'sunshower') {
    bonusPrismatic += 0.10; // +10% Prismatic / Mythic quality roll chance
    badgeEmoji = '🌈';
    badgeText = 'Sunshower Blessed (+10% Prismatic)';
    description = 'Golden sunshower blessing unlocks +10% mythic quality roll chance!';
  }

  // 2. Severe Convective & Mechanical Hazards
  if (weather === 'hailstorm') {
    if (!isProtectedByGreenhouse) {
      yieldMult *= 0.70; // -30% harvest quantity reduction
      badgeEmoji = '🌨️';
      badgeText = 'Hail Damaged (-30% Yield)';
      description = 'Blunt hail lodging damaged plant stems! Yield cut by 30%.';
    }
  } else if (weather === 'gale') {
    if (cropId === 'wheat' || cropId === 'corn') {
      yieldMult *= 0.90; // 10% seed-scatter loss
      badgeEmoji = '💨';
      badgeText = 'Wind Scattered (-10%)';
      description = 'Howling gales scattered stalks, losing 10% seeds.';
    }
  } else if (weather === 'cyclone') {
    speedMult = 0.0;
    badgeEmoji = '🌀';
    badgeText = 'Tempest Halted (0x)';
    description = 'Catastrophic cyclonic gale halts all crop metabolic processes.';
  }

  // 3. Category & Thermal Adaptations
  if (pheno.family === 'sun_loving_warm') {
    if (weather === 'sunny') {
      speedMult *= 1.10;
      badgeEmoji = '☀️';
      badgeText = 'Sun-Loving (+10% Speed)';
      description = 'Vibrant solar irradiance accelerates photosynthesis!';
    } else if (weather === 'heatwave') {
      if (moistureLevel >= 50.0) {
        speedMult *= 1.20;
        badgeEmoji = '🔥';
        badgeText = 'Heat Surge (+20% Speed)';
        description = 'Abundant irrigation coupled with intense heat sparks growth surge!';
      } else {
        isWilted = true;
        speedMult = 0.0;
        badgeEmoji = '🥀';
        badgeText = 'Thermal Wilted (0x)';
        description = 'Blistering heatwave scorched dry soil! Growth halted until watered.';
      }
    } else if (weather === 'humid' && cropId === 'pumpkin') {
      extraQty += 1;
      badgeEmoji = '🎃';
      badgeText = 'Vine Swelled (+1 Harvest)';
      description = 'Moist tropical humidity causes pumpkin vines to swell +1 extra fruit!';
    } else if (weather === 'frost') {
      if (!isProtectedByGreenhouse && !hasAlchemicalAsh) {
        isFrostbitten = true;
        speedMult = 0.0;
        yieldMult *= 0.60; // -40% yield
        badgeEmoji = '🧊';
        badgeText = 'Frostbitten (-40% Yield)';
        description = 'Sub-zero frost crystallised warm tissue! Growth halted and yield penalized.';
      }
    } else if (weather === 'snow') {
      if (!isProtectedByGreenhouse && !hasAlchemicalAsh) {
        isDormant = true;
        speedMult = 0.0;
        yieldMult *= 0.50;
        badgeEmoji = '❄️';
        badgeText = 'Winter Dormancy (0x)';
        description = 'Deep snow buried warm crop into dormancy.';
      }
    }
  } else if (pheno.family === 'cool_season_root') {
    if (weather === 'frost') {
      priceMult *= 1.25; // +25% cold-sweetened value
      badgeEmoji = '❄️';
      badgeText = 'Cold-Sweetened (+25% Price)';
      description = 'Freezing temperatures convert root starches into pure natural sugars!';
    } else if (weather === 'heatwave') {
      if (moistureLevel >= 70.0) {
        // High soil moisture & canal hydration provides evaporative cooling
        speedMult *= 0.85;
        badgeEmoji = '💧';
        badgeText = 'Canal Cooled (0.85x)';
        description = 'Abundant canal moisture (≥70%) evaporatively cools root beds, shielding greens from heat collapse!';
      } else {
        isWilted = true;
        speedMult = 0.0;
        badgeEmoji = '🥀';
        badgeText = 'Heat Wilted (0x)';
        description = 'Cool-season greens scorched by heatwave! Irrigate to ≥70% moisture or switch weather.';
      }
    } else if (weather === 'foggy') {
      speedMult *= 1.25;
      badgeEmoji = '🌁';
      badgeText = 'Fog Dew (+25% Speed)';
      description = 'Cool dense condensation accelerates root development.';
    } else if (weather === 'drizzle' || weather === 'rain') {
      speedMult *= 1.10;
      badgeEmoji = '💧';
      badgeText = 'Lush Rain (+10% Speed)';
      description = 'Gentle precipitation creates ideal temperate growing conditions.';
    }
  } else if (pheno.family === 'temperate_berry') {
    if (weather === 'sunshower') {
      speedMult *= 1.15;
      badgeEmoji = '🌈';
      badgeText = 'Sunshower Burst (+15%)';
      description = 'Perfect balance of moisture and sunlight stimulates berry ripening!';
    } else if (weather === 'heatwave') {
      if (moistureLevel >= 65.0) {
        speedMult *= 1.0;
        badgeEmoji = '🫐';
        badgeText = 'Hydrated Berry (1.0x)';
        description = 'Plentiful soil moisture shields berry foliage from solar scorching.';
      } else {
        speedMult *= 0.50;
        badgeEmoji = '☀️';
        badgeText = 'Heat Stressed (-50%)';
        description = 'Berry bushes suffer leaf scorch during intense heatwaves. Irrigate to relieve stress.';
      }
    }
  }

  return {
    growthSpeedMultiplier: Math.max(0.0, speedMult),
    yieldMultiplier: Math.max(0.1, yieldMult),
    priceMultiplier: Math.max(0.5, priceMult),
    extraQuantity: extraQty,
    bonusPrismaticChance: bonusPrismatic,
    isWilted,
    isFrostbitten,
    isDormant,
    isSheltered: isProtectedByGreenhouse,
    badgeEmoji,
    badgeText,
    description,
  };
}

// --- Continuous Thermodynamic Soil Evaporation Formula ---
/**
 * EvaporativeLoss = E_base * (1 + (T - 20) / 25) * (1.0 - (H * 0.7)) * (1 - InfraDamping)
 * Where:
 *  - E_base: Morning = 2.5%, Twilight = 1.5%, Night = 0.4% per minute
 *  - InfraDamping = 0.50 if Tier 3+ (Subterranean Tiles or Brass Sprinklers)
 */
export function calculateThermodynamicEvaporationRatePctPerMin(params: {
  temperatureC: number;
  relativeHumidityPct: number;
  cycleElapsedSeconds: number;
  canalTier: CanalTier;
}): {
  evapRatePctPerMin: number;
  diurnalPhase: string;
  infraDiscountPct: number;
  thermalFactor: number;
  humidityFactor: number;
} {
  const { temperatureC, relativeHumidityPct, cycleElapsedSeconds, canalTier } = params;

  // 1. Diurnal Baseline (cycle: 0..600s Morning, 600..1200s Twilight, 1200..1800s Night)
  let eBase = 2.5;
  let diurnalPhase = 'Morning Shift';
  if (cycleElapsedSeconds >= 1200) {
    eBase = 0.4;
    diurnalPhase = 'Night Watch';
  } else if (cycleElapsedSeconds >= 600) {
    eBase = 1.5;
    diurnalPhase = 'Twilight Gap';
  }

  // 2. Thermal Scaling: (1 + (T - 20) / 25)
  // At 45°C (Heatwave): 1 + 25/25 = 2.0x acceleration. At 0°C (Frost): 1 - 20/25 = 0.20x.
  const thermalFactor = Math.max(0.05, 1.0 + (temperatureC - 20.0) / 25.0);

  // 3. Humidity Vapor Suppression: (1.0 - (H * 0.7)), where H in [0..1]
  const hFraction = Math.min(1.0, Math.max(0.0, relativeHumidityPct / 100.0));
  const humidityFactor = Math.max(0.1, 1.0 - (hFraction * 0.7));

  // 4. Infrastructure Damping
  const isHighTierCanal = canalTier >= 3;
  const infraDamping = isHighTierCanal ? 0.50 : 0.0;

  const rawRate = eBase * thermalFactor * humidityFactor * (1.0 - infraDamping);
  const clampedRate = Math.max(0.0, Math.min(8.0, rawRate));

  return {
    evapRatePctPerMin: Math.round(clampedRate * 100) / 100,
    diurnalPhase,
    infraDiscountPct: Math.round(infraDamping * 100),
    thermalFactor: Math.round(thermalFactor * 100) / 100,
    humidityFactor: Math.round(humidityFactor * 100) / 100,
  };
}

// --- Natural Weather Cycling Transitions ---
export function rollNextNaturalWeather(current: WeatherProfileId): WeatherProfileId {
  const roll = Math.random();

  // Natural probabilistic state transitions
  switch (current) {
    case 'sunny':
      if (roll < 0.40) return 'cloudy';
      if (roll < 0.60) return 'heatwave';
      if (roll < 0.75) return 'drizzle';
      if (roll < 0.90) return 'gale';
      return 'sunshower';

    case 'heatwave':
      if (roll < 0.50) return 'drought';
      if (roll < 0.80) return 'humid';
      return 'sunny';

    case 'drought':
      if (roll < 0.40) return 'sunny';
      if (roll < 0.70) return 'cloudy';
      return 'heatwave';

    case 'cloudy':
      if (roll < 0.35) return 'drizzle';
      if (roll < 0.65) return 'rain';
      if (roll < 0.85) return 'foggy';
      return 'sunny';

    case 'humid':
      if (roll < 0.40) return 'thunderstorm';
      if (roll < 0.70) return 'rain';
      return 'cloudy';

    case 'foggy':
      if (roll < 0.50) return 'drizzle';
      if (roll < 0.80) return 'cloudy';
      return 'frost';

    case 'drizzle':
      if (roll < 0.50) return 'rain';
      if (roll < 0.75) return 'cloudy';
      if (roll < 0.90) return 'sunshower';
      return 'foggy';

    case 'rain':
      if (roll < 0.40) return 'monsoon';
      if (roll < 0.70) return 'drizzle';
      if (roll < 0.90) return 'thunderstorm';
      return 'sunshower';

    case 'monsoon':
      if (roll < 0.60) return 'rain';
      if (roll < 0.85) return 'thunderstorm';
      return 'cyclone';

    case 'sunshower':
      if (roll < 0.60) return 'sunny';
      if (roll < 0.85) return 'cloudy';
      return 'rain';

    case 'gale':
      if (roll < 0.50) return 'cloudy';
      if (roll < 0.80) return 'thunderstorm';
      return 'hailstorm';

    case 'thunderstorm':
      if (roll < 0.50) return 'rain';
      if (roll < 0.75) return 'gale';
      return 'hailstorm';

    case 'hailstorm':
      if (roll < 0.60) return 'cloudy';
      if (roll < 0.85) return 'frost';
      return 'rain';

    case 'cyclone':
      if (roll < 0.70) return 'monsoon';
      return 'gale';

    case 'frost':
      if (roll < 0.45) return 'snow';
      if (roll < 0.80) return 'foggy';
      return 'cloudy';

    case 'snow':
      if (roll < 0.50) return 'frost';
      if (roll < 0.85) return 'cloudy';
      return 'drizzle';

    default:
      return 'sunny';
  }
}
