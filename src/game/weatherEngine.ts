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
  | 'snow'
  // F. Extreme Weather & Cataclysmic Anomalies
  | 'supercell_deluge'
  | 'plasma_firestorm'
  | 'polar_vortex'
  | 'hyper_cyclone'
  | 'alchemical_monsoon'
  | 'haboob_sandstorm';

export type WeatherCategoryId =
  | 'clear_thermal'
  | 'overcast_humid'
  | 'precipitation'
  | 'severe_convective'
  | 'freezing_arid'
  | 'extreme_weather';

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

  // F. Extreme Weather & Cataclysmic Anomalies
  supercell_deluge: {
    id: 'supercell_deluge',
    name: 'Supercell Atmospheric Deluge',
    category: 'extreme_weather',
    categoryLabel: 'Extreme Atmospheric Event',
    emoji: '🌊⛈️',
    description: 'Catastrophic atmospheric river and supercell downpour (+450 L/min). Floods surface furrows rapidly and fills high-level reservoirs in minutes.',
    tempRangeC: [16, 21],
    defaultTempC: 18.5,
    humidityRangePct: [100, 100],
    defaultHumidityPct: 100,
    precipitationInflowLPerMin: 450,
    windSpeedKmH: 65,
    cloudCoverPct: 100,
    barometricPressureHPa: 970,
    plotDirectMoistureGainPctPerMin: 12.0,
    baseEvaporativeFactor: 0.0,
    phenologyNotes: 'Massive inundation! Floods plots instantly (100%). Triggers emergency spillway bypasses and fills high-capacity mega-towers at record speed.',
    visualHazeClass: 'from-blue-950/60 via-cyan-900/40 to-slate-950/60 animate-pulse',
  },
  plasma_firestorm: {
    id: 'plasma_firestorm',
    name: 'Solar Thermal Firestorm',
    category: 'extreme_weather',
    categoryLabel: 'Extreme Atmospheric Event',
    emoji: '☄️🔥',
    description: 'Blistering solar plasma heatwave (52°C, 5% RH). Extreme thermal scorching causes surface cisterns to boil away at -30 L/min!',
    tempRangeC: [48, 56],
    defaultTempC: 52,
    humidityRangePct: [2, 10],
    defaultHumidityPct: 5,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 35,
    cloudCoverPct: 0,
    barometricPressureHPa: 1002,
    plotDirectMoistureGainPctPerMin: 0,
    baseEvaporativeFactor: 4.5, // -10.5% moisture per min
    phenologyNotes: 'Catastrophic thermal wilt! Unprotected plots lose moisture rapidly; crops wilt immediately unless continuously quenched from high-level towers.',
    visualHazeClass: 'from-red-600/30 via-orange-600/20 to-amber-500/20 animate-pulse',
  },
  polar_vortex: {
    id: 'polar_vortex',
    name: 'Cryogenic Polar Vortex',
    category: 'extreme_weather',
    categoryLabel: 'Extreme Atmospheric Event',
    emoji: '🧊🥶',
    description: 'Sub-zero glacial vortex (-18°C). Surface canals freeze solid and uninsulated pipes lock up. Requires high-level thermal cores or geothermal heat.',
    tempRangeC: [-25, -12],
    defaultTempC: -18,
    humidityRangePct: [30, 45],
    defaultHumidityPct: 38,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 52,
    cloudCoverPct: 20,
    barometricPressureHPa: 1040,
    plotDirectMoistureGainPctPerMin: 0,
    baseEvaporativeFactor: 0.05,
    phenologyNotes: 'Absolute zero freeze: All surface furrows lock solid; warm-season crops suffer severe frostbite unless insulated by Greenhouses.',
    visualHazeClass: 'from-cyan-300/30 via-blue-900/30 to-indigo-950/40 backdrop-blur-[1px]',
  },
  hyper_cyclone: {
    id: 'hyper_cyclone',
    name: 'Category 5 Hyper-Cyclone',
    category: 'extreme_weather',
    categoryLabel: 'Extreme Atmospheric Event',
    emoji: '🌪️⚡',
    description: 'Cataclysmic mega-tempest (165 km/h winds, +320 L/min deluge, 935 hPa). Shuts down outdoor labor while supercharging windmills at 4x speed.',
    tempRangeC: [18, 22],
    defaultTempC: 20,
    humidityRangePct: [100, 100],
    defaultHumidityPct: 100,
    precipitationInflowLPerMin: 320,
    windSpeedKmH: 165,
    cloudCoverPct: 100,
    barometricPressureHPa: 935,
    plotDirectMoistureGainPctPerMin: 10.0,
    baseEvaporativeFactor: 0.0,
    phenologyNotes: 'Extreme kinetic force! Crop growth halted; unharvested grains risk mechanical lodging damage without protective windbreaks.',
    visualHazeClass: 'from-purple-950/60 via-slate-900/50 to-blue-950/60 animate-pulse',
  },
  alchemical_monsoon: {
    id: 'alchemical_monsoon',
    name: 'Alchemical Spore Monsoon',
    category: 'extreme_weather',
    categoryLabel: 'Extreme Atmospheric Event',
    emoji: '🧪✨',
    description: 'Luminescent iridescent precipitation (+200 L/min) carrying fertile alchemical spore mist. Supercharges crop metabolism and yields!',
    tempRangeC: [22, 26],
    defaultTempC: 24,
    humidityRangePct: [90, 98],
    defaultHumidityPct: 94,
    precipitationInflowLPerMin: 200,
    windSpeedKmH: 18,
    cloudCoverPct: 75,
    barometricPressureHPa: 1008,
    plotDirectMoistureGainPctPerMin: 5.0,
    baseEvaporativeFactor: 0.1,
    phenologyNotes: 'Alchemical Mana Infusion: +50% crop maturation speed and +25% Gold/Prismatic harvest quality rolls on all active plots!',
    visualHazeClass: 'from-emerald-500/25 via-teal-400/20 to-purple-500/20 animate-pulse',
  },
  haboob_sandstorm: {
    id: 'haboob_sandstorm',
    name: 'Great Arid Haboob',
    category: 'extreme_weather',
    categoryLabel: 'Extreme Atmospheric Event',
    emoji: '🏜️🌪️',
    description: 'Towering 3,000ft wall of desert silt and red dust (85 km/h, 40°C). Clogs canal grates, blocks sunlight, and triples crew thirst.',
    tempRangeC: [37, 44],
    defaultTempC: 40,
    humidityRangePct: [5, 12],
    defaultHumidityPct: 8,
    precipitationInflowLPerMin: 0,
    windSpeedKmH: 85,
    cloudCoverPct: 100,
    barometricPressureHPa: 998,
    plotDirectMoistureGainPctPerMin: 0,
    baseEvaporativeFactor: 3.0,
    phenologyNotes: 'Solar dust blockage: -25% crop growth speed. Silt quickly clogs canal beds and workers consume hydration at 3x normal rate.',
    visualHazeClass: 'from-amber-800/40 via-orange-950/30 to-stone-900/40',
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
export type CropAgronomicFamily = 'sun_loving_warm' | 'cool_season_root' | 'temperate_berry' | 'cool_season_hardy' | 'restorative_legume';

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
  peas: {
    cropId: 'peas',
    family: 'cool_season_hardy',
    familyLabel: 'Restorative Legume',
    familyIcon: '🫛',
    optimalWeather: ['sunny', 'cloudy', 'humid', 'drizzle'],
    coldToleranceMinC: 2,
    heatToleranceMaxC: 38,
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
  isTimerFrozen?: boolean;
  weatherModifierText?: string;
  freezeReason?: string;
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
  hasHeatSource?: boolean;
  isWindbreakProtected?: boolean;
}): CropPhenologyResult {
  const {
    cropId,
    weatherState,
    weather: directWeather,
    moistureLevel,
    isProtectedByGreenhouse = false,
    hasAlchemicalAsh = false,
    hasHeatSource = false,
    isWindbreakProtected = false,
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
  let isTimerFrozen = false;
  let freezeReason: string | undefined = undefined;
  let weatherModifierText = '';
  let badgeEmoji = pheno.familyIcon;
  let badgeText = 'Normal';
  let description = 'Standard ambient growth.';

  // 1. Sunshower Blessing (Rainbow active)
  if (weatherState?.rainbowActive || weather === 'sunshower') {
    bonusPrismatic += 0.10; // +10% Prismatic / Mythic quality roll chance
    badgeEmoji = '🌈';
    badgeText = 'Sunshower Blessed (+10% Prismatic)';
    weatherModifierText = '🌈 Sunshower: +10% Mythic / Prismatic Quality Roll';
    description = 'Golden sunshower blessing unlocks +10% mythic quality roll chance!';
  }

  // 2. Severe Convective & Mechanical Hazards
  if (weather === 'hailstorm') {
    if (!isProtectedByGreenhouse) {
      if ((cropId === 'wheat' || cropId === 'corn') && !isWindbreakProtected) {
        // Unprotected tall crops suffer physical stalk damage, reducing final yield by 50%
        yieldMult = 0.50;
        badgeEmoji = '🌨️⚠️';
        badgeText = '🌨️ Stalk Damaged (-50% Yield)';
        weatherModifierText = '🌨️ Stalk Damage: -50% Yield (Unprotected)';
        description = 'Severe hail lodging crushed unprotected tall stalks! Final yield cut by 50%.';
      } else {
        yieldMult *= 0.70; // -30% harvest quantity reduction
        badgeEmoji = '🌨️';
        badgeText = 'Hail Damaged (-30% Yield)';
        weatherModifierText = '🌨️ Hailstorm: -30% Harvest Quantity Loss';
        description = 'Blunt hail lodging damaged plant stems! Yield cut by 30%.';
      }
    } else {
      weatherModifierText = '🛡️ Greenhouse Sheltered: Hail Damage Prevented';
    }
  } else if (weather === 'gale') {
    if (cropId === 'wheat' || cropId === 'corn') {
      if (!isWindbreakProtected && !isProtectedByGreenhouse) {
        // Unprotected tall crops suffer physical stalk damage, reducing final yield by 50%
        yieldMult = 0.50;
        badgeEmoji = '💨⚠️';
        badgeText = '🌨️ Stalk Damaged (-50% Yield)';
        weatherModifierText = '💨 Stalk Damage: -50% Yield (Unprotected High Gale)';
        description = 'Howling gales snapped unprotected tall stalks! Final yield cut by 50%.';
      } else {
        yieldMult *= 0.90; // 10% seed-scatter loss with windbreaks
        badgeEmoji = '💨🛡️';
        badgeText = 'Windbreak Shielded (-10%)';
        weatherModifierText = '💨 Windbreak Shielded: Stalk Damage Prevented';
        description = 'Windbreaks shielded tall stalks from catastrophic lodging damage.';
      }
    } else {
      weatherModifierText = '💨 High Gale: Strong Winds';
    }
  } else if (weather === 'cyclone') {
    speedMult = 0.0;
    if ((cropId === 'wheat' || cropId === 'corn') && !isWindbreakProtected && !isProtectedByGreenhouse) {
      yieldMult = 0.50;
      weatherModifierText = '🌀 Cyclone: 0x Growth & -50% Yield (Unprotected Stalks)';
    } else {
      weatherModifierText = '🌀 Cyclone: 0x Growth (Metabolic Arrest)';
    }
    badgeEmoji = '🌀';
    badgeText = 'Tempest Halted (0x)';
    description = 'Catastrophic cyclonic gale halts all crop metabolic processes.';
  } else if (weather === 'supercell_deluge') {
    // Torrential rain boosts growth +25% across all outdoor plots automatically (free irrigation)
    speedMult = 1.25;
    badgeEmoji = '🌊⛈️';
    badgeText = 'Deluge Growth (+25%)';
    weatherModifierText = '🌧️ Supercell Deluge: +25% Growth Acceleration (Free Irrigation)';
    description = 'Supercell rain (+450 L/min) saturates beds to maximum; excess runoff requires immediate drainage.';
  } else if (weather === 'plasma_firestorm') {
    if (moistureLevel >= 70.0) {
      speedMult *= 1.30;
      badgeEmoji = '☄️🔥';
      badgeText = 'Solar Plasma Surge (+30%)';
      weatherModifierText = '☄️ Plasma Surge: +30% Speed (Irrigated Loam)';
      description = 'Extreme solar radiation accelerated by heavy irrigation produces explosive growth!';
    } else {
      isWilted = true;
      speedMult = 0.0;
      badgeEmoji = '🥀';
      badgeText = 'Thermal Scorched (0x)';
      weatherModifierText = '☀️ PLASMA FIRESTORM: Evaporation 3x (Thermal Scorch 0x)';
      description = '52°C Plasma firestorm scorched soil! Irrigate immediately to prevent crop death.';
    }
  } else if (weather === 'polar_vortex') {
    if (!isProtectedByGreenhouse && !hasAlchemicalAsh && !hasHeatSource) {
      isFrostbitten = true;
      isTimerFrozen = true;
      freezeReason = 'Requires heat source to continue growth';
      speedMult = 0.0;
      yieldMult *= 0.40; // -60% yield penalty
      badgeEmoji = '🧊🥶';
      badgeText = '❄️ Frozen: Requires heat source to continue growth';
      weatherModifierText = '❄️ Frozen: Requires heat source to continue growth';
      description = '-18°C Polar vortex froze plant cellular walls! Requires Geothermal heat, Furrow Heater, or Greenhouse.';
    } else if (hasHeatSource) {
      speedMult = Math.max(1.0, speedMult);
      badgeEmoji = '🔥🛡️';
      badgeText = '🔥 Thermal Protected';
      weatherModifierText = '🔥 Heat Source Active: Protected from Cryo Freeze';
    }
  } else if (weather === 'hyper_cyclone') {
    speedMult = 0.0;
    if (!isProtectedByGreenhouse) {
      yieldMult *= 0.50;
    }
    badgeEmoji = '🌪️⚡';
    badgeText = 'Hyper-Cyclone Halted (0x)';
    weatherModifierText = '🌪️ Hyper-Cyclone: 0x Growth & Severe Hazard';
    description = 'Cataclysmic 165 km/h hurricane winds force complete suspension of growth and labor.';
  } else if (weather === 'alchemical_monsoon') {
    speedMult *= 1.50; // +50% acceleration!
    bonusPrismatic += 0.25; // +25% Gold/Prismatic roll chance!
    extraQty += 1;
    badgeEmoji = '🧪✨';
    badgeText = 'Alchemical Infusion (+50% Speed)';
    weatherModifierText = '🧪 Alchemical Monsoon: +50% Speed & Double Yield';
    description = 'Mana-infused precipitation supercharges crop biology and doubles harvest yields!';
  } else if (weather === 'haboob_sandstorm') {
    speedMult *= 0.75; // -25% dust penalty
    badgeEmoji = '🏜️🌪️';
    badgeText = 'Dust Choked (-25%)';
    weatherModifierText = '🏜️ Haboob: -25% Growth Speed (Dust Choked)';
    description = 'Red dust wall obscures sunlight and silts up furrow water beds.';
  }

  // Torrential Downpour (Heavy Rain): Free Irrigation +25% Speed Acceleration
  if (weather === 'rain' || weather === 'monsoon' || weather === 'thunderstorm') {
    speedMult *= 1.25;
    if (!weatherModifierText) {
      weatherModifierText = '🌧️ Heavy Rain: +25% Growth Acceleration (Free Irrigation)';
    }
  }

  // 3. Frost / Cold Snap: Plots without a nearby heat source have timers frozen
  if (weather === 'frost' || weather === 'snow') {
    if (!hasHeatSource && !isProtectedByGreenhouse && !hasAlchemicalAsh) {
      isFrostbitten = true;
      isTimerFrozen = true;
      freezeReason = 'Requires heat source to continue growth';
      speedMult = 0.0;
      badgeEmoji = '❄️';
      badgeText = '❄️ Frozen: Requires heat source to continue growth';
      weatherModifierText = '❄️ Frozen: Requires heat source to continue growth';
      description = 'Freezing cold has frozen crop timers. Requires a heat source (Dimetrodon aura or Furrow Heater) to continue growth.';
    } else if (hasHeatSource) {
      speedMult = Math.max(1.0, speedMult);
      badgeEmoji = '🔥🛡️';
      badgeText = '🔥 Thermal Protected';
      weatherModifierText = '🔥 Heat Source Active: Normal growth maintained';
    }
  }

  // 4. Heatwave / Drought: Evaporation 3x
  if (weather === 'heatwave' || weather === 'drought') {
    if (moistureLevel < 50.0) {
      if (!weatherModifierText) {
        weatherModifierText = '☀️ HEATWAVE: Plot Water Evaporation 3x (Water Deficit Risk)';
      }
    } else {
      if (!weatherModifierText) {
        weatherModifierText = '☀️ HEATWAVE: Plot Water Evaporation 3x (Canal Cooled)';
      }
    }
  }

  // 5. Category & Thermal Adaptations
  if (pheno.family === 'sun_loving_warm') {
    if (weather === 'sunny') {
      speedMult *= 1.10;
      badgeEmoji = '☀️';
      badgeText = 'Sun-Loving (+10% Speed)';
      if (!weatherModifierText) weatherModifierText = '☀️ Clear Irradiance: +10% Photosynthetic Speed';
      description = 'Vibrant solar irradiance accelerates photosynthesis!';
    } else if (weather === 'heatwave') {
      if (moistureLevel >= 50.0) {
        speedMult *= 1.20;
        badgeEmoji = '🔥';
        badgeText = 'Heat Surge (+20% Speed)';
        weatherModifierText = '🔥 Heat Surge: +20% Speed (Irrigated Loam)';
        description = 'Abundant irrigation coupled with intense heat sparks growth surge!';
      } else {
        isWilted = true;
        speedMult = 0.0;
        badgeEmoji = '🥀';
        badgeText = 'Thermal Wilted (0x)';
        weatherModifierText = '☀️ HEATWAVE: Plot Water Evaporation 3x (Thermal Wilted 0x)';
        description = 'Blistering heatwave scorched dry soil! Growth halted until watered.';
      }
    } else if (weather === 'humid' && cropId === 'pumpkin') {
      extraQty += 1;
      badgeEmoji = '🎃';
      badgeText = 'Vine Swelled (+1 Harvest)';
      weatherModifierText = '🌫️ Humid Tropical Air: +1 Harvest on Pumpkin Vines';
      description = 'Moist tropical humidity causes pumpkin vines to swell +1 extra fruit!';
    }
  } else if (pheno.family === 'cool_season_root') {
    if (weather === 'frost' && hasHeatSource) {
      priceMult *= 1.25; // +25% cold-sweetened value
      badgeEmoji = '❄️✨';
      badgeText = 'Cold-Sweetened (+25% Price)';
      weatherModifierText = '❄️ Cold-Sweetened: +25% Crop Value (Heat Protected)';
      description = 'Freezing temperatures convert root starches into pure natural sugars!';
    } else if (weather === 'heatwave') {
      if (moistureLevel >= 70.0) {
        speedMult *= 0.85;
        badgeEmoji = '💧';
        badgeText = 'Canal Cooled (0.85x)';
        weatherModifierText = '💧 Canal Cooled: 0.85x Speed (Shielded from Wilt)';
        description = 'Abundant canal moisture (≥70%) evaporatively cools root beds, shielding greens from heat collapse!';
      } else {
        isWilted = true;
        speedMult = 0.0;
        badgeEmoji = '🥀';
        badgeText = 'Heat Wilted (0x)';
        weatherModifierText = '☀️ HEATWAVE: Plot Water Evaporation 3x (Heat Wilted 0x)';
        description = 'Cool-season greens scorched by heatwave! Irrigate to ≥70% moisture or switch weather.';
      }
    } else if (weather === 'foggy') {
      speedMult *= 1.25;
      badgeEmoji = '🌁';
      badgeText = 'Fog Dew (+25% Speed)';
      weatherModifierText = '🌁 Ground Fog: +25% Root Growth Speed';
      description = 'Cool dense condensation accelerates root development.';
    } else if (weather === 'drizzle') {
      speedMult *= 1.10;
      badgeEmoji = '💧';
      badgeText = 'Lush Mist (+10% Speed)';
      weatherModifierText = '🌦️ Drizzle: Gentle Inflow (+10% Speed)';
      description = 'Gentle precipitation creates ideal temperate growing conditions.';
    }
  } else if (pheno.family === 'temperate_berry') {
    if (weather === 'sunshower') {
      speedMult *= 1.15;
      badgeEmoji = '🌈';
      badgeText = 'Sunshower Burst (+15%)';
      weatherModifierText = '🌈 Sunshower: +15% Berry Speed & Prismatic Chance';
      description = 'Perfect balance of moisture and sunlight stimulates berry ripening!';
    } else if (weather === 'heatwave') {
      if (moistureLevel >= 65.0) {
        speedMult *= 1.0;
        badgeEmoji = '🫐';
        badgeText = 'Hydrated Berry (1.0x)';
        weatherModifierText = '🫐 Hydrated Berry: Normal Speed (Evaporatively Cooled)';
        description = 'Plentiful soil moisture shields berry foliage from solar scorching.';
      } else {
        speedMult *= 0.50;
        badgeEmoji = '☀️';
        badgeText = 'Heat Stressed (-50%)';
        weatherModifierText = '☀️ HEATWAVE: Plot Water Evaporation 3x (-50% Heat Stress)';
        description = 'Berry bushes suffer leaf scorch during intense heatwaves. Irrigate to relieve stress.';
      }
    }
  }

  // Fallback default weather modifier text if none assigned
  if (!weatherModifierText) {
    if (weather === 'sunny') {
      weatherModifierText = '☀️ Clear Skies: Normal Ambient Growth';
    } else if (weather === 'cloudy') {
      weatherModifierText = '⛅ Cloudy: Evaporative Loss Halved (Steady Growth)';
    } else if (weather === 'humid') {
      weatherModifierText = '🌫️ Humid: Reduced Evaporation';
    } else if (weather === 'foggy') {
      weatherModifierText = '🌁 Ground Fog: +0.3% Soil Moisture/min';
    } else if (weather === 'drizzle') {
      weatherModifierText = '🌦️ Drizzle: Gentle Rain Inflow';
    } else {
      weatherModifierText = `${def.emoji} ${def.name}: Active Estate Environment`;
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
    isTimerFrozen,
    freezeReason,
    weatherModifierText,
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
      if (roll < 0.45) return 'drought';
      if (roll < 0.75) return 'humid';
      if (roll < 0.90) return 'plasma_firestorm';
      return 'sunny';

    case 'drought':
      if (roll < 0.35) return 'sunny';
      if (roll < 0.65) return 'cloudy';
      if (roll < 0.85) return 'heatwave';
      return 'haboob_sandstorm';

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
      if (roll < 0.50) return 'rain';
      if (roll < 0.75) return 'thunderstorm';
      if (roll < 0.90) return 'cyclone';
      return 'supercell_deluge';

    case 'sunshower':
      if (roll < 0.50) return 'sunny';
      if (roll < 0.75) return 'cloudy';
      if (roll < 0.90) return 'rain';
      return 'alchemical_monsoon';

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
      if (roll < 0.60) return 'monsoon';
      if (roll < 0.85) return 'gale';
      return 'hyper_cyclone';

    case 'frost':
      if (roll < 0.40) return 'snow';
      if (roll < 0.75) return 'foggy';
      if (roll < 0.90) return 'cloudy';
      return 'polar_vortex';

    case 'snow':
      if (roll < 0.45) return 'frost';
      if (roll < 0.80) return 'cloudy';
      if (roll < 0.90) return 'drizzle';
      return 'polar_vortex';

    case 'supercell_deluge':
      if (roll < 0.50) return 'monsoon';
      if (roll < 0.80) return 'rain';
      return 'thunderstorm';

    case 'plasma_firestorm':
      if (roll < 0.50) return 'heatwave';
      if (roll < 0.80) return 'drought';
      return 'sunny';

    case 'polar_vortex':
      if (roll < 0.50) return 'snow';
      if (roll < 0.80) return 'frost';
      return 'cloudy';

    case 'hyper_cyclone':
      if (roll < 0.50) return 'cyclone';
      if (roll < 0.80) return 'monsoon';
      return 'gale';

    case 'alchemical_monsoon':
      if (roll < 0.50) return 'sunshower';
      if (roll < 0.80) return 'rain';
      return 'cloudy';

    case 'haboob_sandstorm':
      if (roll < 0.50) return 'drought';
      if (roll < 0.80) return 'heatwave';
      return 'sunny';

    default:
      return 'sunny';
  }
}

export interface EstateWeatherModifierInfo {
  bannerText: string;
  categoryLabel: string;
  severity: 'danger' | 'warning' | 'benefit' | 'info';
  icon: string;
}

/**
 * Returns formatted estate-wide banner description and active mechanical impact.
 */
export function getEstateWeatherModifier(weather: WeatherProfileId): EstateWeatherModifierInfo {
  switch (weather) {
    case 'heatwave':
      return {
        bannerText: '☀️ HEATWAVE: Plot Water Evaporation 3x · Supply Gravity Tower Water',
        categoryLabel: 'Clear & Thermal Hazard',
        severity: 'danger',
        icon: '🔥',
      };
    case 'drought':
      return {
        bannerText: '🏜️ DROUGHT: Plot Water Evaporation 3x · Canal Inflow Suspended',
        categoryLabel: 'Clear & Thermal Hazard',
        severity: 'danger',
        icon: '🏜️',
      };
    case 'plasma_firestorm':
      return {
        bannerText: '☄️ PLASMA FIRESTORM: 52°C Thermal Scorch · Evaporation 3x · Sluice Open Required',
        categoryLabel: 'Cataclysmic Hazard',
        severity: 'danger',
        icon: '☄️',
      };
    case 'frost':
      return {
        bannerText: '❄️ FROST / COLD SNAP: Crop Timers Frozen Without Heat Source (Dimetrodon / Furrow Heater)',
        categoryLabel: 'Freezing Hazard',
        severity: 'warning',
        icon: '❄️',
      };
    case 'snow':
      return {
        bannerText: '❄️ WINTER SNOWFALL: Crop Timers Frozen Without Geothermal Heat Source',
        categoryLabel: 'Freezing Hazard',
        severity: 'warning',
        icon: '❄️',
      };
    case 'polar_vortex':
      return {
        bannerText: '🧊 POLAR VORTEX: Deep -18°C Cryo Freeze · Crop Timers Frozen · Heat Source Required',
        categoryLabel: 'Cataclysmic Hazard',
        severity: 'danger',
        icon: '🧊',
      };
    case 'rain':
      return {
        bannerText: '🌧️ TORRENTIAL RAIN: +25% Crop Growth Acceleration · Open Furrow Nutrient Leaching Risk',
        categoryLabel: 'Active Precipitation',
        severity: 'benefit',
        icon: '🌧️',
      };
    case 'monsoon':
      return {
        bannerText: '⛈️ HEAVY MONSOON: +25% Crop Growth Acceleration · Open Furrow Nutrient Leaching Risk',
        categoryLabel: 'Active Precipitation',
        severity: 'warning',
        icon: '⛈️',
      };
    case 'supercell_deluge':
      return {
        bannerText: '🌊 SUPERCELL DELUGE: +25% Growth Acceleration · Inundation & Soil Leaching Risk',
        categoryLabel: 'Cataclysmic Hazard',
        severity: 'danger',
        icon: '🌊',
      };
    case 'thunderstorm':
      return {
        bannerText: '⛈️ THUNDERSTORM: +25% Crop Growth Acceleration · Rapid Inflow & Leaching Hazard',
        categoryLabel: 'Severe Convective',
        severity: 'warning',
        icon: '⛈️',
      };
    case 'hailstorm':
      return {
        bannerText: '🌨️ HAILSTORM: -50% Yield on Unprotected Tall Crops (Wheat/Corn) · Stalk Damage Risk',
        categoryLabel: 'Mechanical Hazard',
        severity: 'danger',
        icon: '🌨️',
      };
    case 'gale':
      return {
        bannerText: '💨 HIGH GALE: -50% Yield on Unprotected Tall Crops (Wheat/Corn) Without Windbreaks',
        categoryLabel: 'Mechanical Hazard',
        severity: 'warning',
        icon: '💨',
      };
    case 'cyclone':
      return {
        bannerText: '🌀 CYCLONE: Gale Hazard (-50% Tall Crop Yield) · Growth Processes Suspended',
        categoryLabel: 'Severe Convective',
        severity: 'danger',
        icon: '🌀',
      };
    case 'hyper_cyclone':
      return {
        bannerText: '🌪️ HYPER-CYCLONE: 165 km/h Gales · -50% Tall Crop Yield · Metabolic Arrest',
        categoryLabel: 'Cataclysmic Hazard',
        severity: 'danger',
        icon: '🌪️',
      };
    case 'sunshower':
      return {
        bannerText: '🌈 SUNSHOWER: +10% Prismatic / Mythic Crop Quality Chance',
        categoryLabel: 'Meteorologic Blessing',
        severity: 'benefit',
        icon: '🌈',
      };
    case 'alchemical_monsoon':
      return {
        bannerText: '🧪 ALCHEMICAL MONSOON: +50% Crop Speed & Double Harvest Yield',
        categoryLabel: 'Alchemical Blessing',
        severity: 'benefit',
        icon: '🧪',
      };
    case 'haboob_sandstorm':
      return {
        bannerText: '🏜️ HABOOB DUST STORM: -25% Crop Growth Speed · Silt Infiltration',
        categoryLabel: 'Atmospheric Hazard',
        severity: 'warning',
        icon: '🏜️',
      };
    case 'foggy':
      return {
        bannerText: '🌁 GROUND FOG: +0.3% Soil Moisture/min · +25% Delicate Root Speed',
        categoryLabel: 'Overcast & Humidity',
        severity: 'info',
        icon: '🌁',
      };
    case 'humid':
      return {
        bannerText: '🌫️ HUMID & MUGGY: Soil Evaporation Suppressed · +1 Harvest on Pumpkin Vines',
        categoryLabel: 'Overcast & Humidity',
        severity: 'info',
        icon: '🌫️',
      };
    case 'drizzle':
      return {
        bannerText: '🌦️ DRIZZLE: Gentle Mist Irrigation · Reduced Evaporation',
        categoryLabel: 'Active Precipitation',
        severity: 'info',
        icon: '🌦️',
      };
    case 'cloudy':
      return {
        bannerText: '⛅ CLOUDY: Evaporative Loss Halved · Stable Unhurried Growth',
        categoryLabel: 'Overcast & Humidity',
        severity: 'info',
        icon: '⛅',
      };
    case 'sunny':
    default:
      return {
        bannerText: '☀️ CLEAR SKIES: Normal Ambient Evaporation · +10% Photosynthetic Speed on Sun Crops',
        categoryLabel: 'Clear & Thermal',
        severity: 'info',
        icon: '☀️',
      };
  }
}

