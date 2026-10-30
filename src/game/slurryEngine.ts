/**
 * Species-Specific Slurry Yield & Collection Mechanics Engine
 * 
 * Establishes distinct slurry production rates, fluid viscosities, and biochemical profiles
 * for every livestock and sanctuary fauna species on the estate. Slurry generation is tied directly
 * to animal diet quality, hydration volume, body mass, and pen drainage mechanics to feed
 * the Gas Production Lab (Anaerobic Digester & Nitrogen Processing).
 */

import { type AnimalSpecies } from './data';
import { type WeatherProfileId } from './weatherEngine';
import { type PastureWelfareState } from './faunaWeatherEngine';

// ============================================================================
// 1. DATA TYPES & ENUMS
// ============================================================================

export type SlurryViscosity =
  | 'sludge'           // Small livestock: high solids, uric acid rich, requires wash-down
  | 'fluid'            // Swine: high fluid volume, optimal rapid fermentation
  | 'fibrous_pellets'  // Sheep / Goats: pelletized waste, needs soaking / agitator
  | 'fibrous_emulsion' // Bovine & Equine: straw-manure emulsion, high buffering
  | 'primeval_heavy';  // Prehistoric Mega-Fauna: mineralized, primeval microbial flora

export type SlurryQualityGrade =
  | 'poultry_uric'     // Accelerated Nitrogen spike
  | 'swine_methane'    // Optimal fermentation, highest methane / CO2 release
  | 'ruminant_fibrous' // Fibrous, requires agitator/macerator
  | 'bovine_balanced'  // Stable, balanced CO2 and liquid Nitrogen digestate
  | 'primeval_flora';  // Boosts distillation +50%, supercharged nitrogen soil dressing

export type AnimalDietQuality = 'fresh_green' | 'balanced' | 'dry_grain' | 'dehydrated';

export interface SpeciesSlurryProfile {
  speciesKey: string;
  name: string;
  category: 'small_livestock' | 'medium_livestock' | 'large_livestock' | 'sanctuary_megafauna';
  baseWasteRateLitersPerDay: number; // In liters per in-game day (1,800s)
  minRateLiters: number;
  maxRateLiters: number;
  viscosity: SlurryViscosity;
  solidContentPercent: number; // e.g. 35% for poultry, 8% for swine
  washDownWaterRatio: number;  // parts water needed to 1 part manure for fluid flow (e.g. 2 for poultry)
  qualityGrade: SlurryQualityGrade;
  biochemicalDescription: string;
  gasLabExpectedYield: {
    methanePerLiter: number;        // Liters of CH4 per liter of slurry
    co2PerLiter: number;            // Liters of CO2 per liter of slurry
    liquidNitrogenPerLiter: number; // Liters of concentrated liquid N bio-liquor per liter
    distillationSpeedBoost: number; // Percentage speed boost (e.g. 0.5 for primeval)
  };
  collectionFacilityType: 'slat_pit' | 'sump_pit' | 'holding_tank' | 'bioreactor_sluice';
  defaultPitId: SlurryPitId;
}

// 4 Standard Estate Sump Pits / Collection Hubs
export type SlurryPitId = 'pit_coop' | 'pit_swine' | 'pit_cattle' | 'pit_sanctuary';

export interface SlurryPitState {
  id: SlurryPitId;
  name: string;
  categoryLabel: string;
  currentLiters: number;
  maxCapacityLiters: number;
  viscosityRating: SlurryViscosity;
  primarySpecies: string;
  speciesBreakdown: Record<string, number>; // Liters accumulated per species
  isDilutedByRain: boolean;
  dilutionFactor: number; // 1.0 = normal, 1.3 = heatwave diluted, >1.5 = rainstorm diluted
  isFrozen: boolean;
  isCovered: boolean; // Weather cover protects pit from rain dilution & nitrogen leaching
  hasAgitatorMacerator: boolean; // Prevents sheep/goat fibrous pipe clogging
  automatedIntakePipe: boolean; // Direct heavy-bore pipe connected to Gas Lab intake manifold
  isOverflowing: boolean;
  lastEmptiedAt: number;
}

export interface GasProductionLabState {
  digesterCurrentLiters: number;
  digesterMaxCapacityLiters: number;
  isDigesting: boolean;
  digestionProgress: number; // 0 to 100%
  distillationSpeedMultiplier: number; // 1.0 baseline, up to 1.5x with Primeval Slurry
  primevalSlurryRatio: number; // 0.0 to 1.0
  storedBiogasMethane: number; // Liters of CH4 clean energy
  storedBiogasCo2: number;     // Liters of Biogas CO2 for farm plots
  storedOxygen: number;        // Liters of Purified Bio-Oxygen (O2) from slurry + chaff mix
  storedLiquidNitrogen: number;// Liters of Liquid Nitrogen Digestate / Bio-Fertilizer
  chaffBiomassSubstrateLiters: number; // Active chaff biomass substrate inside chamber
  totalSlurryProcessedLiters: number;
  isAutomatedManifoldOpen: boolean;
}

// ============================================================================
// 2. SPECIES-SPECIFIC SLURRY PRODUCTION MATRIX
// ============================================================================

export const SPECIES_SLURRY_REGISTRY: Record<string, SpeciesSlurryProfile> = {
  // --- A. Small Livestock (Poultry & Lagomorphs) ---
  chicken: {
    speciesKey: 'chicken',
    name: 'Poultry (Chicken)',
    category: 'small_livestock',
    baseWasteRateLitersPerDay: 0.75, // 0.5L - 1.0L
    minRateLiters: 0.5,
    maxRateLiters: 1.0,
    viscosity: 'sludge',
    solidContentPercent: 35,
    washDownWaterRatio: 2.0, // 2 parts water to 1 part manure
    qualityGrade: 'poultry_uric',
    biochemicalDescription: 'High solid content, rich in uric acid. Triggers accelerated Nitrogen spike when processed.',
    gasLabExpectedYield: {
      methanePerLiter: 0.45,
      co2PerLiter: 0.35,
      liquidNitrogenPerLiter: 0.85, // Highest Nitrogen bio-liquor
      distillationSpeedBoost: 0.0,
    },
    collectionFacilityType: 'slat_pit',
    defaultPitId: 'pit_coop',
  },
  duck: {
    speciesKey: 'duck',
    name: 'Duck (Heritage Waterfowl)',
    category: 'small_livestock',
    baseWasteRateLitersPerDay: 0.85,
    minRateLiters: 0.6,
    maxRateLiters: 1.1,
    viscosity: 'sludge',
    solidContentPercent: 30,
    washDownWaterRatio: 1.8,
    qualityGrade: 'poultry_uric',
    biochemicalDescription: 'High uric acid content with aquatic microbe activity; sharp nitrogen spike.',
    gasLabExpectedYield: {
      methanePerLiter: 0.48,
      co2PerLiter: 0.38,
      liquidNitrogenPerLiter: 0.82,
      distillationSpeedBoost: 0.0,
    },
    collectionFacilityType: 'slat_pit',
    defaultPitId: 'pit_coop',
  },
  rabbit: {
    speciesKey: 'rabbit',
    name: 'Rabbit (Lagomorph)',
    category: 'small_livestock',
    baseWasteRateLitersPerDay: 0.55,
    minRateLiters: 0.4,
    maxRateLiters: 0.8,
    viscosity: 'fibrous_pellets',
    solidContentPercent: 40,
    washDownWaterRatio: 2.5,
    qualityGrade: 'poultry_uric',
    biochemicalDescription: 'Concentrated pelletized droppings; intense nitrogen and potassium mineral profile.',
    gasLabExpectedYield: {
      methanePerLiter: 0.40,
      co2PerLiter: 0.30,
      liquidNitrogenPerLiter: 0.90,
      distillationSpeedBoost: 0.0,
    },
    collectionFacilityType: 'slat_pit',
    defaultPitId: 'pit_coop',
  },

  // --- B. Medium Livestock (Swine & Small Ruminants) ---
  pig: {
    speciesKey: 'pig',
    name: 'Swine (Rooting Truffler)',
    category: 'medium_livestock',
    baseWasteRateLitersPerDay: 10.0, // 8L - 12L
    minRateLiters: 8.0,
    maxRateLiters: 12.0,
    viscosity: 'fluid',
    solidContentPercent: 8,
    washDownWaterRatio: 0.5,
    qualityGrade: 'swine_methane',
    biochemicalDescription: 'Highest fluid volume with optimal anaerobic fermentation profile. Rapid methane & CO2 release.',
    gasLabExpectedYield: {
      methanePerLiter: 0.95, // Highest methane yield!
      co2PerLiter: 0.85,
      liquidNitrogenPerLiter: 0.45,
      distillationSpeedBoost: 0.15,
    },
    collectionFacilityType: 'sump_pit',
    defaultPitId: 'pit_swine',
  },
  sheep: {
    speciesKey: 'sheep',
    name: 'Sheep (Pasture Merino)',
    category: 'medium_livestock',
    baseWasteRateLitersPerDay: 4.0, // 3L - 5L
    minRateLiters: 3.0,
    maxRateLiters: 5.0,
    viscosity: 'fibrous_pellets',
    solidContentPercent: 28,
    washDownWaterRatio: 1.5,
    qualityGrade: 'ruminant_fibrous',
    biochemicalDescription: 'High fibrous matter from digested clover. Requires mechanical agitator/macerator to prevent pipe clogging.',
    gasLabExpectedYield: {
      methanePerLiter: 0.60,
      co2PerLiter: 0.65,
      liquidNitrogenPerLiter: 0.55,
      distillationSpeedBoost: 0.0,
    },
    collectionFacilityType: 'sump_pit',
    defaultPitId: 'pit_cattle',
  },
  goat: {
    speciesKey: 'goat',
    name: 'Goat (Alpine Ruminant)',
    category: 'medium_livestock',
    baseWasteRateLitersPerDay: 3.5,
    minRateLiters: 3.0,
    maxRateLiters: 5.0,
    viscosity: 'fibrous_pellets',
    solidContentPercent: 30,
    washDownWaterRatio: 1.5,
    qualityGrade: 'ruminant_fibrous',
    biochemicalDescription: 'Pelletized ruminant waste rich in roughage lignin; benefits from macerator chopping.',
    gasLabExpectedYield: {
      methanePerLiter: 0.58,
      co2PerLiter: 0.62,
      liquidNitrogenPerLiter: 0.58,
      distillationSpeedBoost: 0.0,
    },
    collectionFacilityType: 'sump_pit',
    defaultPitId: 'pit_cattle',
  },

  // --- C. Large Livestock (Bovine & Equine) ---
  cow: {
    speciesKey: 'cow',
    name: 'Dairy Cattle (Holstein-Friesian)',
    category: 'large_livestock',
    baseWasteRateLitersPerDay: 32.0, // 25L - 40L
    minRateLiters: 25.0,
    maxRateLiters: 40.0,
    viscosity: 'fibrous_emulsion',
    solidContentPercent: 14,
    washDownWaterRatio: 0.8,
    qualityGrade: 'bovine_balanced',
    biochemicalDescription: 'Heavy fibrous straw-and-manure emulsion with high buffering capacity. Yields stable, balanced CO2 and liquid Nitrogen digestate.',
    gasLabExpectedYield: {
      methanePerLiter: 0.75,
      co2PerLiter: 0.80,
      liquidNitrogenPerLiter: 0.70,
      distillationSpeedBoost: 0.1,
    },
    collectionFacilityType: 'holding_tank',
    defaultPitId: 'pit_cattle',
  },
  horse: {
    speciesKey: 'horse',
    name: 'Draft Horse (Percheron)',
    category: 'large_livestock',
    baseWasteRateLitersPerDay: 30.0,
    minRateLiters: 25.0,
    maxRateLiters: 38.0,
    viscosity: 'fibrous_emulsion',
    solidContentPercent: 18,
    washDownWaterRatio: 1.0,
    qualityGrade: 'bovine_balanced',
    biochemicalDescription: 'Fibrous cellulose emulsion with active cellulolytic microbes; steady gas buffering.',
    gasLabExpectedYield: {
      methanePerLiter: 0.70,
      co2PerLiter: 0.78,
      liquidNitrogenPerLiter: 0.65,
      distillationSpeedBoost: 0.05,
    },
    collectionFacilityType: 'holding_tank',
    defaultPitId: 'pit_cattle',
  },

  // --- D. Sanctuary Mega-Fauna (Prehistoric / Exotic Species) ---
  dimetrodon: {
    speciesKey: 'dimetrodon',
    name: 'Dimetrodon (Sail-Backed Synapsid)',
    category: 'sanctuary_megafauna',
    baseWasteRateLitersPerDay: 15.0, // 15L
    minRateLiters: 12.0,
    maxRateLiters: 20.0,
    viscosity: 'primeval_heavy',
    solidContentPercent: 20,
    washDownWaterRatio: 1.0,
    qualityGrade: 'primeval_flora',
    biochemicalDescription: 'Primeval Slurry rich in sulfur and geothermal mineral compounds. Speeds gas distillation and wards against frost.',
    gasLabExpectedYield: {
      methanePerLiter: 0.90,
      co2PerLiter: 0.95,
      liquidNitrogenPerLiter: 0.90,
      distillationSpeedBoost: 0.35, // +35% distillation speed
    },
    collectionFacilityType: 'bioreactor_sluice',
    defaultPitId: 'pit_sanctuary',
  },
  brontosaurus: {
    speciesKey: 'brontosaurus',
    name: 'Brontosaurus (Colossal Sauropod)',
    category: 'sanctuary_megafauna',
    baseWasteRateLitersPerDay: 200.0, // 150L - 250L
    minRateLiters: 150.0,
    maxRateLiters: 250.0,
    viscosity: 'primeval_heavy',
    solidContentPercent: 16,
    washDownWaterRatio: 1.2,
    qualityGrade: 'primeval_flora',
    biochemicalDescription: 'Colossal Primeval Slurry: massive volume laden with prehistoric methanogenic archaea. Grants +50% gas distillation speed and supercharged nitrogen soil dressing.',
    gasLabExpectedYield: {
      methanePerLiter: 1.10, // Massive primeval methane output!
      co2PerLiter: 1.20,
      liquidNitrogenPerLiter: 1.25, // Supercharged nitrogen bio-liquor
      distillationSpeedBoost: 0.50, // +50% distillation speed boost!
    },
    collectionFacilityType: 'bioreactor_sluice',
    defaultPitId: 'pit_sanctuary',
  },
  hadrosaur: {
    speciesKey: 'hadrosaur',
    name: 'Hadrosaur (Crested Herbivore)',
    category: 'sanctuary_megafauna',
    baseWasteRateLitersPerDay: 120.0,
    minRateLiters: 100.0,
    maxRateLiters: 150.0,
    viscosity: 'primeval_heavy',
    solidContentPercent: 18,
    washDownWaterRatio: 1.0,
    qualityGrade: 'primeval_flora',
    biochemicalDescription: 'Heavy primeval slurry carrying ancient fern digestate; high botanical enzymes.',
    gasLabExpectedYield: {
      methanePerLiter: 1.00,
      co2PerLiter: 1.10,
      liquidNitrogenPerLiter: 1.15,
      distillationSpeedBoost: 0.40,
    },
    collectionFacilityType: 'bioreactor_sluice',
    defaultPitId: 'pit_sanctuary',
  },
  woolly_mammoth: {
    speciesKey: 'woolly_mammoth',
    name: 'Woolly Mammoth (Pleistocene Sovereign)',
    category: 'sanctuary_megafauna',
    baseWasteRateLitersPerDay: 180.0,
    minRateLiters: 140.0,
    maxRateLiters: 220.0,
    viscosity: 'primeval_heavy',
    solidContentPercent: 15,
    washDownWaterRatio: 1.0,
    qualityGrade: 'primeval_flora',
    biochemicalDescription: 'Permafrost-adapted primeval emulsion rich in psychrophilic bacteria and cold-hardy enzymes.',
    gasLabExpectedYield: {
      methanePerLiter: 1.05,
      co2PerLiter: 1.15,
      liquidNitrogenPerLiter: 1.20,
      distillationSpeedBoost: 0.45,
    },
    collectionFacilityType: 'bioreactor_sluice',
    defaultPitId: 'pit_sanctuary',
  },
  titanoboa: {
    speciesKey: 'titanoboa',
    name: 'Titanoboa (Colossal River Serpent)',
    category: 'sanctuary_megafauna',
    baseWasteRateLitersPerDay: 60.0,
    minRateLiters: 45.0,
    maxRateLiters: 80.0,
    viscosity: 'fluid',
    solidContentPercent: 10,
    washDownWaterRatio: 0.5,
    qualityGrade: 'primeval_flora',
    biochemicalDescription: 'High-protein aquatic primeval runoff; rich in marine ammonia and enzymes.',
    gasLabExpectedYield: {
      methanePerLiter: 0.95,
      co2PerLiter: 0.85,
      liquidNitrogenPerLiter: 1.30,
      distillationSpeedBoost: 0.35,
    },
    collectionFacilityType: 'bioreactor_sluice',
    defaultPitId: 'pit_sanctuary',
  },
  arthropleura: {
    speciesKey: 'arthropleura',
    name: 'Arthropleura (Primeval Detritivore)',
    category: 'sanctuary_megafauna',
    baseWasteRateLitersPerDay: 25.0,
    minRateLiters: 20.0,
    maxRateLiters: 35.0,
    viscosity: 'sludge',
    solidContentPercent: 32,
    washDownWaterRatio: 1.8,
    qualityGrade: 'primeval_flora',
    biochemicalDescription: 'Humus-rich detritus slurry, packed with soil micro-arthropod symbionts.',
    gasLabExpectedYield: {
      methanePerLiter: 0.80,
      co2PerLiter: 0.90,
      liquidNitrogenPerLiter: 1.10,
      distillationSpeedBoost: 0.25,
    },
    collectionFacilityType: 'bioreactor_sluice',
    defaultPitId: 'pit_sanctuary',
  },
  asaphid_trilobite: {
    speciesKey: 'asaphid_trilobite',
    name: 'Asaphid Trilobite (Benthic Arthropod)',
    category: 'sanctuary_megafauna',
    baseWasteRateLitersPerDay: 5.0,
    minRateLiters: 3.0,
    maxRateLiters: 8.0,
    viscosity: 'sludge',
    solidContentPercent: 25,
    washDownWaterRatio: 1.2,
    qualityGrade: 'primeval_flora',
    biochemicalDescription: 'Silt-based mineral slurry enriched with saline benthic salts.',
    gasLabExpectedYield: {
      methanePerLiter: 0.50,
      co2PerLiter: 0.60,
      liquidNitrogenPerLiter: 0.70,
      distillationSpeedBoost: 0.15,
    },
    collectionFacilityType: 'bioreactor_sluice',
    defaultPitId: 'pit_sanctuary',
  },
  meganeura: {
    speciesKey: 'meganeura',
    name: 'Meganeura (Apex Griffinfly)',
    category: 'sanctuary_megafauna',
    baseWasteRateLitersPerDay: 8.0,
    minRateLiters: 5.0,
    maxRateLiters: 12.0,
    viscosity: 'fluid',
    solidContentPercent: 12,
    washDownWaterRatio: 0.8,
    qualityGrade: 'primeval_flora',
    biochemicalDescription: 'High-nitrogen insectivore runoff with high bio-catalytic speed.',
    gasLabExpectedYield: {
      methanePerLiter: 0.65,
      co2PerLiter: 0.70,
      liquidNitrogenPerLiter: 0.80,
      distillationSpeedBoost: 0.20,
    },
    collectionFacilityType: 'bioreactor_sluice',
    defaultPitId: 'pit_sanctuary',
  },
};

// ============================================================================
// 3. DEFAULT ESTATE SUMP PITS & GAS LAB STATE
// ============================================================================

export function createDefaultSlurryPits(): Record<SlurryPitId, SlurryPitState> {
  const now = Date.now();
  return {
    pit_coop: {
      id: 'pit_coop',
      name: 'Coop Droppings Catchment',
      categoryLabel: 'Small-Mesh Slat Pit',
      currentLiters: 45,
      maxCapacityLiters: 300,
      viscosityRating: 'sludge',
      primarySpecies: 'chicken',
      speciesBreakdown: { chicken: 45 },
      isDilutedByRain: false,
      dilutionFactor: 1.0,
      isFrozen: false,
      isCovered: true, // Coops typically have covered roofing
      hasAgitatorMacerator: false,
      automatedIntakePipe: false,
      isOverflowing: false,
      lastEmptiedAt: now,
    },
    pit_swine: {
      id: 'pit_swine',
      name: 'Exterior Swine Sump Pit',
      categoryLabel: 'Slatted Floor Masonry Pit',
      currentLiters: 180,
      maxCapacityLiters: 1000,
      viscosityRating: 'fluid',
      primarySpecies: 'pig',
      speciesBreakdown: { pig: 180 },
      isDilutedByRain: false,
      dilutionFactor: 1.0,
      isFrozen: false,
      isCovered: false, // Open air paddock sump by default
      hasAgitatorMacerator: false,
      automatedIntakePipe: false,
      isOverflowing: false,
      lastEmptiedAt: now,
    },
    pit_cattle: {
      id: 'pit_cattle',
      name: 'Barn Gutter Holding Tank',
      categoryLabel: '1,000L Bovine/Equine Tank',
      currentLiters: 260,
      maxCapacityLiters: 2000,
      viscosityRating: 'fibrous_emulsion',
      primarySpecies: 'cow',
      speciesBreakdown: { cow: 200, sheep: 60 },
      isDilutedByRain: false,
      dilutionFactor: 1.0,
      isFrozen: false,
      isCovered: true,
      hasAgitatorMacerator: false,
      automatedIntakePipe: false,
      isOverflowing: false,
      lastEmptiedAt: now,
    },
    pit_sanctuary: {
      id: 'pit_sanctuary',
      name: 'Industrial Sluice Bioreactor Vat',
      categoryLabel: 'Reinforced Primeval Sluice',
      currentLiters: 350,
      maxCapacityLiters: 5000,
      viscosityRating: 'primeval_heavy',
      primarySpecies: 'dimetrodon',
      speciesBreakdown: { dimetrodon: 120, woolly_mammoth: 230 },
      isDilutedByRain: false,
      dilutionFactor: 1.0,
      isFrozen: false,
      isCovered: true,
      hasAgitatorMacerator: true,
      automatedIntakePipe: true, // Connected by default in high-tech sanctuary
      isOverflowing: false,
      lastEmptiedAt: now,
    },
  };
}

export function createDefaultGasProductionLab(): GasProductionLabState {
  return {
    digesterCurrentLiters: 400,
    digesterMaxCapacityLiters: 3000,
    isDigesting: true,
    digestionProgress: 42,
    distillationSpeedMultiplier: 1.0,
    primevalSlurryRatio: 0.25,
    storedBiogasMethane: 280, // 280 Liters CH4
    storedBiogasCo2: 240,     // 240 Liters CO2
    storedOxygen: 160,        // 160 Liters Bio-Oxygen (O2)
    storedLiquidNitrogen: 180,// 180 Liters Liquid N
    chaffBiomassSubstrateLiters: 100, // 100 Liters active chaff substrate
    totalSlurryProcessedLiters: 1250,
    isAutomatedManifoldOpen: true,
  };
}

// ============================================================================
// 4. DYNAMIC MODIFIER CALCULATION & STEP TICK LOGIC
// ============================================================================

export interface AnimalSlurryEvaluation {
  speciesKey: string;
  dailyRateLiters: number;
  ratePerSecond: number;
  viscosity: SlurryViscosity;
  qualityLabel: string;
  qualityGrade: SlurryQualityGrade;
  dietQuality: AnimalDietQuality;
  dietModifierPercent: number;
  hydrationPercent: number;
  isDehydratedFrozen: boolean;
  weatherModifierPercent: number;
  gasPotencyMultiplier: number; // 1.0 normal, 0.8 during heatwave dilution
  isDryCaked: boolean; // Needs washdown
  washDownNeededLiters: number;
  inspectionBadge: string;
}

/**
 * Calculates live slurry production rate & characteristics for a specific animal instance
 */
export function evaluateAnimalSlurry(params: {
  species: string;
  hydrationLevel?: number; // 0 to 100%
  hasGreenDiet?: boolean;  // Fresh clover/silage/vegetables vs dry straw/grain
  hasAdequateWater?: boolean;
  activeWeatherId: WeatherProfileId;
  temperatureC?: number;
  isRainstormActive?: boolean;
  isPastureShaded?: boolean;
  isBeddingMucked?: boolean;
  isElder?: boolean;       // Retired elder livestock (cyclesRemaining <= 0) produce 0 slurry
  isNight?: boolean;       // During nocturnal rest (night shift), livestock sleep and produce 0 slurry
}): AnimalSlurryEvaluation {
  const profile = SPECIES_SLURRY_REGISTRY[params.species] || SPECIES_SLURRY_REGISTRY.cow;
  const hydration = params.hydrationLevel !== undefined ? params.hydrationLevel : 90;
  const temp = params.temperatureC !== undefined ? params.temperatureC : 20;

  // 1. Dehydration check: freezing slurry output
  const isDehydrated = hydration < 20 || params.hasAdequateWater === false;

  // 2. Diet Quality Modifier
  let dietQuality: AnimalDietQuality = 'balanced';
  let dietModifierPercent = 0;
  let viscosity = profile.viscosity;
  let isDryCaked = false;

  if (isDehydrated) {
    dietQuality = 'dehydrated';
    dietModifierPercent = -100;
  } else if (params.hasGreenDiet) {
    // Fresh green fodder/silage: Increases slurry fluidity and daily volume by +25%
    dietQuality = 'fresh_green';
    dietModifierPercent = 25;
    if (viscosity === 'fibrous_pellets') viscosity = 'semi_fluid' as any;
    if (viscosity === 'sludge') viscosity = 'fluid';
  } else if (!params.hasGreenDiet && hydration < 60) {
    // Dry grain/hay without adequate water: Thickens waste into dry cakes, halting fluid flow until washed
    dietQuality = 'dry_grain';
    dietModifierPercent = -50;
    isDryCaked = true;
  }

  // 3. Weather Interactions
  let weatherModifierPercent = 0;
  let gasPotencyMultiplier = 1.0;
  const isHeatwave = params.activeWeatherId === 'heatwave' || params.activeWeatherId === 'drought' || temp >= 35;
  const isRainstorm = params.isRainstormActive || ['rain', 'monsoon', 'supercell_deluge', 'alchemical_monsoon'].includes(params.activeWeatherId);

  if (isHeatwave) {
    // Heatwave: Animals consume 2.5x water; slurry becomes diluted (-20% gas potency per liter, +30% total fluid volume)
    weatherModifierPercent = 30;
    gasPotencyMultiplier = 0.8;
  }

  // Calculate final daily rate in liters (1 game day = 1,800 seconds)
  let netRateLiters = profile.baseWasteRateLitersPerDay;
  if (params.isElder) {
    netRateLiters = 0; // Retired elders cease slurry generation
  } else if (params.isNight) {
    // Nocturnal stall digestion: animals resting in barn stalls continue active digestion and manure/slurry flow
    const totalModifierMultiplier = 1 + ((dietModifierPercent + weatherModifierPercent) / 100);
    netRateLiters = Math.max(0.1, Number((profile.baseWasteRateLitersPerDay * totalModifierMultiplier * 0.95).toFixed(2)));
  } else if (isDehydrated) {
    netRateLiters = 0;
  } else {
    const totalModifierMultiplier = 1 + ((dietModifierPercent + weatherModifierPercent) / 100);
    netRateLiters = Math.max(0.1, Number((profile.baseWasteRateLitersPerDay * totalModifierMultiplier).toFixed(2)));
  }

  const ratePerSecond = (isDehydrated || params.isElder) ? 0 : netRateLiters / 1800;
  const washDownNeededLiters = Number((netRateLiters * profile.washDownWaterRatio * 0.1).toFixed(1));

  // Build inspection badge string
  let qualityLabel = `${profile.name} Quality`;
  if (params.isElder) {
    qualityLabel = 'Retired Elder (0 L/day)';
  } else if (params.isNight) {
    qualityLabel = `${profile.name} (Nocturnal Stall Digestate)`;
  } else if (profile.qualityGrade === 'swine_methane') {
    qualityLabel = 'Swine Quality (High Methane)';
  } else if (profile.qualityGrade === 'poultry_uric') {
    qualityLabel = 'Poultry Quality (Uric N Spike)';
  } else if (profile.qualityGrade === 'bovine_balanced') {
    qualityLabel = 'Bovine Quality (Balanced Digestate)';
  } else if (profile.qualityGrade === 'primeval_flora') {
    qualityLabel = 'Primeval Quality (+50% Distillation)';
  }

  let badge = `Hydration: ${Math.round(hydration)}% | Slurry: ${netRateLiters.toFixed(1)}L/day (${qualityLabel})`;
  if (params.isElder) {
    badge = 'Retired Elder | Slurry Production Ceased (0 L/day)';
  } else if (params.isNight) {
    badge = `Night Watch | Barn Stall Slurry: +${netRateLiters.toFixed(1)} L/day (${qualityLabel})`;
  } else if (isDehydrated) {
    badge = `Hydration: ${Math.round(hydration)}% (DEHYDRATED) | Slurry Output Frozen! Refill Troughs`;
  } else if (isDryCaked) {
    badge += ' ⚠️ Caked Bedding: Washdown needed';
  } else if (isHeatwave) {
    badge += ' ☀️ Diluted (Water 2.5x, -20% Potency)';
  }

  return {
    speciesKey: profile.speciesKey,
    dailyRateLiters: netRateLiters,
    ratePerSecond,
    viscosity,
    qualityLabel,
    qualityGrade: profile.qualityGrade,
    dietQuality,
    dietModifierPercent,
    hydrationPercent: hydration,
    isDehydratedFrozen: isDehydrated,
    weatherModifierPercent,
    gasPotencyMultiplier,
    isDryCaked,
    washDownNeededLiters,
    inspectionBadge: badge,
  };
}

/**
 * Steps the live Slurry Pits and Anaerobic Digester simulation for deltaSeconds
 */
export function stepSlurrySimulation(params: {
  deltaSeconds: number;
  pits: Record<SlurryPitId, SlurryPitState>;
  animals: Array<{ species: string; hydrationLevel?: number; hasGreenDiet?: boolean; isElder?: boolean }>;
  prehistoricCreatures: Array<{ speciesId: string; specimenCount: number }>;
  gasLab: GasProductionLabState;
  activeWeatherId: WeatherProfileId;
  temperatureC: number;
  isRainstormActive: boolean;
  pastureWelfare?: Partial<PastureWelfareState>;
  hasDimetrodon?: boolean;
  isNight?: boolean;
}): {
  updatedPits: Record<SlurryPitId, SlurryPitState>;
  updatedGasLab: GasProductionLabState;
  notifications: string[];
} {
  const {
    deltaSeconds,
    pits,
    animals,
    prehistoricCreatures,
    gasLab,
    activeWeatherId,
    temperatureC,
    isRainstormActive,
    pastureWelfare,
    hasDimetrodon = false,
    isNight = false,
  } = params;

  const notifications: string[] = [];
  const updatedPits = { ...pits };
  for (const k of Object.keys(updatedPits) as SlurryPitId[]) {
    updatedPits[k] = { ...updatedPits[k], speciesBreakdown: { ...updatedPits[k].speciesBreakdown } };
  }

  const isFrost = temperatureC <= 0 || ['frost', 'snow', 'polar_vortex'].includes(activeWeatherId);
  const isRain = isRainstormActive || ['rain', 'monsoon', 'supercell_deluge', 'alchemical_monsoon'].includes(activeWeatherId);
  const isFrozenLockout = isFrost && !hasDimetrodon && !(pastureWelfare?.troughThawedUntil && pastureWelfare.troughThawedUntil > Date.now());

  // 1. Accumulate domestic animal slurry into corresponding pits
  for (const a of animals) {
    const evalResult = evaluateAnimalSlurry({
      species: a.species,
      hydrationLevel: a.hydrationLevel ?? 90,
      hasGreenDiet: a.hasGreenDiet ?? true,
      hasAdequateWater: !isFrozenLockout,
      activeWeatherId,
      temperatureC,
      isRainstormActive,
      isPastureShaded: pastureWelfare?.hasShadedCanopy,
      isElder: a.isElder,
      isNight,
    });

    if (evalResult.ratePerSecond <= 0) continue;

    const profile = SPECIES_SLURRY_REGISTRY[a.species] || SPECIES_SLURRY_REGISTRY.cow;
    const targetPitId = profile.defaultPitId;
    const pit = updatedPits[targetPitId];

    if (pit && !pit.isFrozen) {
      const generated = evalResult.ratePerSecond * deltaSeconds;
      pit.currentLiters = Math.min(pit.maxCapacityLiters, Number((pit.currentLiters + generated).toFixed(3)));
      pit.speciesBreakdown[a.species] = (pit.speciesBreakdown[a.species] || 0) + generated;
      pit.viscosityRating = evalResult.viscosity;
      if (evalResult.gasPotencyMultiplier < 1.0) {
        pit.dilutionFactor = Math.min(2.0, pit.dilutionFactor + 0.001 * deltaSeconds);
      }
    }
  }

  // 2. Accumulate prehistoric sanctuary fauna slurry
  for (const pc of prehistoricCreatures) {
    if (!pc.specimenCount || pc.specimenCount <= 0) continue;
    const profile = SPECIES_SLURRY_REGISTRY[pc.speciesId];
    if (!profile) continue;

    const evalResult = evaluateAnimalSlurry({
      species: pc.speciesId,
      hydrationLevel: 95,
      hasGreenDiet: true,
      hasAdequateWater: true,
      activeWeatherId,
      temperatureC,
      isRainstormActive,
    });

    const targetPitId = profile.defaultPitId;
    const pit = updatedPits[targetPitId];
    if (pit && !pit.isFrozen) {
      const generated = evalResult.ratePerSecond * deltaSeconds * pc.specimenCount;
      pit.currentLiters = Math.min(pit.maxCapacityLiters, Number((pit.currentLiters + generated).toFixed(3)));
      pit.speciesBreakdown[pc.speciesId] = (pit.speciesBreakdown[pc.speciesId] || 0) + generated;
      pit.viscosityRating = 'primeval_heavy';
    }
  }

  // 3. Weather impacts on pits (Rainstorm dilution & Frost freezing)
  for (const pitId of Object.keys(updatedPits) as SlurryPitId[]) {
    const pit = updatedPits[pitId];

    // Frost: low temperatures freeze unheated channels and jam transfer pumps
    if (isFrost && !pit.isCovered && !hasDimetrodon) {
      pit.isFrozen = true;
    } else {
      pit.isFrozen = false;
    }

    // Rainstorm: open-air paddocks risk excessive rain dilution; unprotected pits overflow
    if (isRain && !pit.isCovered) {
      pit.isDilutedByRain = true;
      pit.dilutionFactor = Math.min(2.5, Number((pit.dilutionFactor + (0.01 * deltaSeconds)).toFixed(2)));
      // Rain adds 0.5L/sec runoff water into uncovered pit
      pit.currentLiters = Math.min(pit.maxCapacityLiters, pit.currentLiters + (0.5 * deltaSeconds));

      // Overflow check: leaching nitrogen into the soil
      if (pit.currentLiters >= pit.maxCapacityLiters && !pit.isOverflowing) {
        pit.isOverflowing = true;
        notifications.push(`🌧️ Slurry Overflow Warning: ${pit.name} is overflowing in rain! Put weather cover over pit or hitch tanker.`);
      }
    } else {
      if (!isRain) {
        pit.isDilutedByRain = false;
        // Slowly normalize dilution factor
        if (pit.dilutionFactor > 1.0) {
          pit.dilutionFactor = Math.max(1.0, Number((pit.dilutionFactor - (0.005 * deltaSeconds)).toFixed(2)));
        }
      }
    }
  }

  // 4. Automated Late-Game Piping to Gas Production Lab
  const updatedGasLab = { ...gasLab };
  let transferredSlurryLiters = 0;
  let primevalTransferredLiters = 0;

  for (const pitId of Object.keys(updatedPits) as SlurryPitId[]) {
    const pit = updatedPits[pitId];
    if (pit.automatedIntakePipe && !pit.isFrozen && pit.currentLiters > 20) {
      // Pump up to 2L/sec per connected pit into the digester
      const availableCapacity = updatedGasLab.digesterMaxCapacityLiters - updatedGasLab.digesterCurrentLiters;
      if (availableCapacity > 0) {
        const flowRate = Math.min(pit.currentLiters, 2.0 * deltaSeconds, availableCapacity);
        pit.currentLiters = Number((pit.currentLiters - flowRate).toFixed(2));
        updatedGasLab.digesterCurrentLiters = Number((updatedGasLab.digesterCurrentLiters + flowRate).toFixed(2));
        transferredSlurryLiters += flowRate;

        if (pit.viscosityRating === 'primeval_heavy' || pit.id === 'pit_sanctuary') {
          primevalTransferredLiters += flowRate;
        }
      }
    }
  }

  // 5. Gas Production Lab (Anaerobic Digester & Nitrogen Processing) Cycle
  if (updatedGasLab.digesterCurrentLiters > 0) {
    updatedGasLab.isDigesting = true;

    // Check primeval slurry ratio: boosts distillation speed by +50%
    const isPrimevalBoosted = updatedGasLab.primevalSlurryRatio > 0.1 || primevalTransferredLiters > 0;
    updatedGasLab.distillationSpeedMultiplier = isPrimevalBoosted ? 1.5 : 1.0;

    // Digestion speed: ~1% per 2 seconds, modulated by primeval speed boost
    const progressInc = (0.5 * deltaSeconds) * updatedGasLab.distillationSpeedMultiplier;
    updatedGasLab.digestionProgress = Math.min(100, updatedGasLab.digestionProgress + progressInc);

    if (updatedGasLab.digestionProgress >= 100) {
      // Complete digestion batch: process 50L slurry into Biogas CH4, Biogas CO2, and Liquid Nitrogen
      const batchSize = Math.min(50, updatedGasLab.digesterCurrentLiters);
      updatedGasLab.digesterCurrentLiters = Math.max(0, updatedGasLab.digesterCurrentLiters - batchSize);
      updatedGasLab.totalSlurryProcessedLiters += batchSize;
      updatedGasLab.digestionProgress = 0;

      // Yield calculation:
      // Primeval slurry gives bonus distillation & nitrogen
      const primevalMultiplier = isPrimevalBoosted ? 1.5 : 1.0;
      const ch4Produced = Math.round(batchSize * 0.85 * primevalMultiplier);
      const co2Produced = Math.round(batchSize * 0.75 * primevalMultiplier);
      const liquidNProduced = Math.round(batchSize * 0.80 * primevalMultiplier);

      const hasChaff = (updatedGasLab.chaffBiomassSubstrateLiters || 0) > 0;
      const oxygenProduced = Math.round(batchSize * (hasChaff ? 0.85 : 0.50) * primevalMultiplier);

      updatedGasLab.storedBiogasMethane += ch4Produced;
      updatedGasLab.storedBiogasCo2 += co2Produced;
      updatedGasLab.storedOxygen = (updatedGasLab.storedOxygen || 0) + oxygenProduced;
      updatedGasLab.storedLiquidNitrogen += liquidNProduced;

      if (hasChaff) {
        updatedGasLab.chaffBiomassSubstrateLiters = Math.max(0, (updatedGasLab.chaffBiomassSubstrateLiters || 0) - (batchSize * 0.4));
      }

      notifications.push(
        `⚗️ Digestion Batch Complete! Produced +${ch4Produced}L Methane (CH₄), +${co2Produced}L Biogas CO₂, +${oxygenProduced}L Bio-Oxygen (O₂), +${liquidNProduced}L Liquid Nitrogen.`
      );
    }
  } else {
    updatedGasLab.isDigesting = false;
  }

  return {
    updatedPits,
    updatedGasLab,
    notifications,
  };
}

// ============================================================================
// 5. HELPER ACTIONS & ESTIMATORS
// ============================================================================

/**
 * Calculates estimated Gas Lab yield for a specific volume and species breakdown
 */
export function estimateGasLabOutputs(
  totalLiters: number,
  speciesBreakdown: Record<string, number>,
  dilutionFactor = 1.0
): {
  estimatedMethaneLiters: number;
  estimatedCo2Liters: number;
  estimatedOxygenLiters: number;
  estimatedLiquidNitrogenLiters: number;
  primevalDistillationBoostPercent: number;
  summaryLabel: string;
} {
  let ch4 = 0;
  let co2 = 0;
  let liquidN = 0;
  let primevalLiters = 0;

  const total = Object.values(speciesBreakdown).reduce((a, b) => a + b, 0) || totalLiters;

  for (const [sp, liters] of Object.entries(speciesBreakdown)) {
    const prof = SPECIES_SLURRY_REGISTRY[sp] || SPECIES_SLURRY_REGISTRY.cow;
    const ratio = liters / Math.max(1, total);
    const effectiveLiters = totalLiters * ratio;

    ch4 += effectiveLiters * prof.gasLabExpectedYield.methanePerLiter;
    co2 += effectiveLiters * prof.gasLabExpectedYield.co2PerLiter;
    liquidN += effectiveLiters * prof.gasLabExpectedYield.liquidNitrogenPerLiter;

    if (prof.qualityGrade === 'primeval_flora') {
      primevalLiters += effectiveLiters;
    }
  }

  // Apply dilution factor penalty
  const potency = 1 / Math.max(1.0, dilutionFactor);
  ch4 *= potency;
  co2 *= potency;
  liquidN *= potency;
  const o2 = Math.round(totalLiters * 0.75 * potency);

  const primevalRatio = primevalLiters / Math.max(1, totalLiters);
  const primevalBoost = primevalRatio > 0.2 ? 50 : Math.round(primevalRatio * 50);

  return {
    estimatedMethaneLiters: Math.round(ch4),
    estimatedCo2Liters: Math.round(co2),
    estimatedOxygenLiters: o2,
    estimatedLiquidNitrogenLiters: Math.round(liquidN),
    primevalDistillationBoostPercent: primevalBoost,
    summaryLabel: `Est. Yield: ${Math.round(ch4)}L CH₄ | ${Math.round(co2)}L CO₂ | ${o2}L O₂ | ${Math.round(liquidN)}L Liquid N`,
  };
}
