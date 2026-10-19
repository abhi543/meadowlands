// ============================================================================
// PREHISTORIC SANCTUARY, AMBER BIO-LAB & FRONTIER TRAIL PROCEDURAL ENGINE
// ============================================================================

export type PrehistoricEra = 'Cambrian' | 'Carboniferous' | 'Permian' | 'Mesozoic' | 'Pleistocene';

export type FrontierBiomeStrataId =
  | 'paleo_silt_beds'
  | 'primeval_mangrove'
  | 'sunken_red_quarry'
  | 'thermal_mud_crevasse'
  | 'glacial_permafrost';

export type PrehistoricSpeciesId =
  | 'asaphid_trilobite'
  | 'meganeura'
  | 'arthropleura'
  | 'dimetrodon'
  | 'titanoboa'
  | 'woolly_mammoth';

export type EnclosureTypeId =
  | 'enclosure_silt_terrarium'
  | 'enclosure_canopy_terrarium'
  | 'enclosure_sylvan_floor'
  | 'enclosure_geothermal_basin'
  | 'enclosure_thermal_mire'
  | 'enclosure_glacial_paddock';

// --- Species Definition Interface ---
export interface PrehistoricSpeciesDef {
  id: PrehistoricSpeciesId;
  name: string;
  scientificName: string;
  era: PrehistoricEra;
  emoji: string;
  avatar: string;
  fossilItemId: string;
  fossilName: string;
  fossilEmoji: string;
  enclosureType: EnclosureTypeId;
  enclosureName: string;
  dietProductId: string;
  dietName: string;
  dietEmoji: string;
  incubationTowerWaterLiters: number;
  incubationTimeSec: number;
  harvestPeriodSec: number;
  harvestProductId: string;
  harvestName: string;
  harvestEmoji: string;
  estatePassiveTitle: string;
  estatePassiveDesc: string;
  lore: string;
  primaryStrata: FrontierBiomeStrataId;
  eligibleNodes: number[];
}

export const PREHISTORIC_SPECIES_REGISTRY: Record<PrehistoricSpeciesId, PrehistoricSpeciesDef> = {
  asaphid_trilobite: {
    id: 'asaphid_trilobite',
    name: 'Asaphid Trilobite',
    scientificName: 'Asaphus expansus',
    era: 'Cambrian',
    emoji: '🦞',
    avatar: '🦐',
    fossilItemId: 'fossil_trilobite_carapace',
    fossilName: 'Intact Trilobite Carapace',
    fossilEmoji: '🐚',
    enclosureType: 'enclosure_silt_terrarium',
    enclosureName: 'Silt-Bottom Terrarium',
    dietProductId: 'algae_paste',
    dietName: 'Algae Paste',
    dietEmoji: '🧪',
    incubationTowerWaterLiters: 100,
    incubationTimeSec: 60,
    harvestPeriodSec: 120,
    harvestProductId: 'chitin_molt_plates',
    harvestName: 'Chitin Molt Plates',
    harvestEmoji: '🛡️',
    estatePassiveTitle: 'Soil Aeration',
    estatePassiveDesc: 'Prevents soil compaction across all crop plots and increases baseline capillary nutrient absorption by +15%.',
    lore: 'Predatory marine arthropod with stalked compound eyes. Sifts and aerates submerged benthic sediment.',
    primaryStrata: 'paleo_silt_beds',
    eligibleNodes: [1, 2],
  },
  meganeura: {
    id: 'meganeura',
    name: 'Meganeura',
    scientificName: 'Meganeura monyi',
    era: 'Carboniferous',
    emoji: '🦗',
    avatar: '🪰',
    fossilItemId: 'amber_meganeura_wing',
    fossilName: 'Amber-Encased Giant Wing',
    fossilEmoji: '✨',
    enclosureType: 'enclosure_canopy_terrarium',
    enclosureName: 'Humid Canopy Terrarium',
    dietProductId: 'insect_mash',
    dietName: 'Insect Mash',
    dietEmoji: '🥣',
    incubationTowerWaterLiters: 150,
    incubationTimeSec: 90,
    harvestPeriodSec: 180,
    harvestProductId: 'prismatic_wing_membrane',
    harvestName: 'Prismatic Wing Membranes',
    harvestEmoji: '🪽',
    estatePassiveTitle: 'Apex Pollination',
    estatePassiveDesc: 'Accelerates crop flowering and final maturation speed by +25% across the entire farm.',
    lore: 'Colossal griffinfly with a 70cm wingspan fueled by hyper-oxygenated Carboniferous atmosphere.',
    primaryStrata: 'primeval_mangrove',
    eligibleNodes: [2, 3],
  },
  arthropleura: {
    id: 'arthropleura',
    name: 'Arthropleura',
    scientificName: 'Arthropleura armata',
    era: 'Carboniferous',
    emoji: '🐛',
    avatar: '🐛',
    fossilItemId: 'fossil_arthropleura_plates',
    fossilName: 'Segmented Exoskeleton Plates',
    fossilEmoji: '🧱',
    enclosureType: 'enclosure_sylvan_floor',
    enclosureName: 'Humid Sylvan Floor',
    dietProductId: 'crushed_grain_mash',
    dietName: 'Crushed Grain Mash',
    dietEmoji: '🌾',
    incubationTowerWaterLiters: 200,
    incubationTimeSec: 120,
    harvestPeriodSec: 150,
    harvestProductId: 'primeval_humus',
    harvestName: 'Supercharged Primeval Humus',
    harvestEmoji: '🍂',
    estatePassiveTitle: 'Composting Engine',
    estatePassiveDesc: 'Doubles Feed Mill processing velocity (+100% throughput) and enriches all animal rations.',
    lore: 'Two-meter giant millipede that mulches immense volumes of primeval detritus into hyper-fertile humus.',
    primaryStrata: 'primeval_mangrove',
    eligibleNodes: [3, 4],
  },
  dimetrodon: {
    id: 'dimetrodon',
    name: 'Dimetrodon',
    scientificName: 'Dimetrodon grandis',
    era: 'Permian',
    emoji: '🦎',
    avatar: '🐊',
    fossilItemId: 'fossil_dimetrodon_spine',
    fossilName: 'Mineralized Dorsal Sail Spine',
    fossilEmoji: '🦴',
    enclosureType: 'enclosure_geothermal_basin',
    enclosureName: 'Geothermal Stone Basin',
    dietProductId: 'savory_fish_pie',
    dietName: 'Savory Fish Pie',
    dietEmoji: '🥧',
    incubationTowerWaterLiters: 250,
    incubationTimeSec: 150,
    harvestPeriodSec: 240,
    harvestProductId: 'thermal_scutes',
    harvestName: 'Shed Thermal Scutes',
    harvestEmoji: '🔥',
    estatePassiveTitle: 'Geothermal Radiance',
    estatePassiveDesc: 'Emits a warm micro-climate bubble, granting all surrounding crop plots complete immunity to Frost Shock and cold lockouts.',
    lore: 'Apex synapsid equipped with a vascularized neural spine sail for acute thermodynamic regulation.',
    primaryStrata: 'sunken_red_quarry',
    eligibleNodes: [4],
  },
  titanoboa: {
    id: 'titanoboa',
    name: 'Titanoboa',
    scientificName: 'Titanoboa cerrejonensis',
    era: 'Mesozoic',
    emoji: '🐍',
    avatar: '🐍',
    fossilItemId: 'fossil_titanoboa_vertebra',
    fossilName: 'Petrified Vertebral Column',
    fossilEmoji: '🦴',
    enclosureType: 'enclosure_thermal_mire',
    enclosureName: 'Deep Thermal Mire',
    dietProductId: 'sturgeon',
    dietName: 'Fresh River Sturgeon',
    dietEmoji: '🐟',
    incubationTowerWaterLiters: 350,
    incubationTimeSec: 200,
    harvestPeriodSec: 300,
    harvestProductId: 'serpent_slough',
    harvestName: 'Massive Serpent Slough',
    harvestEmoji: '📜',
    estatePassiveTitle: 'Apex Scent Ward',
    estatePassiveDesc: 'Completely repels crop pests and nocturnal vermin across the entire farm; boosts natural composting yields by +35%.',
    lore: 'Thirteen-meter constrictor of prehistoric riverways. Its territorial pheromones deter all invasive fauna.',
    primaryStrata: 'thermal_mud_crevasse',
    eligibleNodes: [4, 5],
  },
  woolly_mammoth: {
    id: 'woolly_mammoth',
    name: 'Woolly Mammoth',
    scientificName: 'Mammuthus primigenius',
    era: 'Pleistocene',
    emoji: '🦣',
    avatar: '🐘',
    fossilItemId: 'cryo_mammoth_tissue',
    fossilName: 'Cryo-Preserved Core Tissue',
    fossilEmoji: '❄️',
    enclosureType: 'enclosure_glacial_paddock',
    enclosureName: 'Sub-Zero Glacial Paddock',
    dietProductId: 'mountain_hay_bales',
    dietName: 'Mountain Hay Bales',
    dietEmoji: '🌾',
    incubationTowerWaterLiters: 400,
    incubationTimeSec: 240,
    harvestPeriodSec: 360,
    harvestProductId: 'insulated_down_wool',
    harvestName: 'Insulated Down Wool',
    harvestEmoji: '🧶',
    estatePassiveTitle: 'Heavy Labor Pack',
    estatePassiveDesc: 'Reduces hydration drain of all estate field workers by -30% during warm shifts and severe heatwaves.',
    lore: 'Mega-herbivore insulated against deep glacial frosts. Provides immense draught power and dense underwool.',
    primaryStrata: 'glacial_permafrost',
    eligibleNodes: [5],
  },
};

// --- Biome Strata Configuration ---
export interface FrontierStrataDef {
  id: FrontierBiomeStrataId;
  name: string;
  era: PrehistoricEra;
  emoji: string;
  themeColor: string;
  bgGradient: string;
  description: string;
  nodeIndex: number; // 1 to 5
  hazards: string[];
  nativeSpecies: PrehistoricSpeciesId[];
}

export const FRONTIER_STRATA_REGISTRY: Record<FrontierBiomeStrataId, FrontierStrataDef> = {
  paleo_silt_beds: {
    id: 'paleo_silt_beds',
    name: 'Paleo Silt Beds',
    era: 'Cambrian',
    emoji: '🌊',
    themeColor: 'teal',
    bgGradient: 'from-cyan-950 via-teal-900 to-stone-900',
    description: 'Ancient marine shale stratum rich in soft-bodied fossil imprints and calcified trilobite carapaces.',
    nodeIndex: 1,
    hazards: ['Quicksilt Sinkhole', 'Saline Tidal Surge', 'Shifting Silt Collapses'],
    nativeSpecies: ['asaphid_trilobite'],
  },
  primeval_mangrove: {
    id: 'primeval_mangrove',
    name: 'Primeval Mangrove & Coal Forest',
    era: 'Carboniferous',
    emoji: '🌲',
    themeColor: 'emerald',
    bgGradient: 'from-emerald-950 via-green-900 to-stone-950',
    description: 'Dense lycopod swamp laden with petrified amber veins, giant arthropods, and hyper-dense peat.',
    nodeIndex: 2,
    hazards: ['Methane Swamp Gas', 'Tangled Sigillaria Roots', 'Hyper-Oxygen Fire Flash'],
    nativeSpecies: ['meganeura', 'arthropleura'],
  },
  sunken_red_quarry: {
    id: 'sunken_red_quarry',
    name: 'Sunken Red Quarry',
    era: 'Permian',
    emoji: '🏜️',
    themeColor: 'amber',
    bgGradient: 'from-amber-950 via-red-950 to-stone-900',
    description: 'Iron-rich red sandstone canyons revealing mineralized synapsid sails and fossilized dry streambeds.',
    nodeIndex: 3,
    hazards: ['Flash Rockslides', 'Arid Dust Gale', 'Thermal Rock Fracturing'],
    nativeSpecies: ['dimetrodon'],
  },
  thermal_mud_crevasse: {
    id: 'thermal_mud_crevasse',
    name: 'Thermal Mud Crevasse',
    era: 'Mesozoic',
    emoji: '🌋',
    themeColor: 'orange',
    bgGradient: 'from-orange-950 via-stone-900 to-neutral-950',
    description: 'Subterranean geothermal fissure steaming with sulfuric mud and petrified serpentine vertebrae.',
    nodeIndex: 4,
    hazards: ['Geyser Eruption', 'Scalding Sulfur Fog', 'Viscous Mud Inundation'],
    nativeSpecies: ['titanoboa'],
  },
  glacial_permafrost: {
    id: 'glacial_permafrost',
    name: 'Glacial Permafrost Crevasse',
    era: 'Pleistocene',
    emoji: '❄️',
    themeColor: 'sky',
    bgGradient: 'from-sky-950 via-blue-950 to-slate-900',
    description: 'Ancient blue glacial ice walls preserving intact cryo-tissue and mammoth tusk caches.',
    nodeIndex: 5,
    hazards: ['Crevasse Collapse', 'Cryo-Frostbite Gale', 'Flash Avalanche'],
    nativeSpecies: ['woolly_mammoth'],
  },
};

export const FRONTIER_STRATA_SEQUENCE: FrontierBiomeStrataId[] = [
  'paleo_silt_beds',
  'primeval_mangrove',
  'sunken_red_quarry',
  'thermal_mud_crevasse',
  'glacial_permafrost',
];

// --- Procedural Trail Event Card Interface ---
export type EventActionType = 'specialized_tool' | 'hydrological_resource' | 'cautious_scavenge';

export interface EventActionBranch {
  type: EventActionType;
  label: string;
  description: string;
  requiredItem?: {
    id: string;
    name: string;
    emoji: string;
    qty: number;
  };
  requiredTowerWaterLiters?: number;
  successRate: number; // 0.0 to 1.0
  successRewards: {
    fossilIds?: string[];
    amberPieces?: number;
    mineralSlabs?: number;
    coins?: number;
    moraleBonus?: number;
    message: string;
  };
  failurePenalty: {
    moraleLoss: number;
    message: string;
  };
}

export interface FrontierEventCard {
  id: string;
  strataId: FrontierBiomeStrataId;
  title: string;
  dilemmaText: string;
  ambientEmoji: string;
  actions: {
    specialized: EventActionBranch;
    hydrological: EventActionBranch;
    cautious: EventActionBranch;
  };
}

// --- Amber Bio-Lab State & Chamber Interface ---
export type IncubationStatus =
  | 'EMPTY'
  | 'INCUBATING'
  | 'SUSPENDED_UNCOOLED'
  | 'CRYO_STANDBY'
  | 'READY_TO_REVIVE'
  | 'DECAYED';

export interface IncubationChamber {
  chamberId: number;
  status: IncubationStatus;
  speciesId?: PrehistoricSpeciesId;
  startedAt?: number;
  durationSec: number;
  progressPct: number;
  towerWaterReservedLiters: number;
  uncooledSecElapsed: number; // If tower hits 0L, increments; decays only after 24h/48h grace window
}

export interface AmberBioLabState {
  isConstructed: boolean;
  chambers: IncubationChamber[];
  totalSpecimensRevived: number;
  coolingPipesInstalled: boolean;
  cryoInsulationInstalled?: boolean;
  isCryoStandbyActive?: boolean;
  cryoStandbyStartedAt?: number | null;
}

// --- Prehistoric Sanctuary Enclosure State ---
export interface SanctuaryEnclosure {
  enclosureId: EnclosureTypeId;
  name: string;
  era: PrehistoricEra;
  biomeStrata: FrontierBiomeStrataId;
  speciesId: PrehistoricSpeciesId;
  specimenCount: number;
  troughFoodLiters: number; // 0 to 100
  maxTroughLiters: number; // 100
  isStarving: boolean;
  lastFedTimestamp: number;
  harvestProgressSec: number;
  harvestReadyCount: number;
}

export interface PrehistoricSanctuaryState {
  enclosures: Record<EnclosureTypeId, SanctuaryEnclosure>;
}

// --- Active Frontier Trail Run State ---
export interface FrontierRucksack {
  fossils: Record<string, number>;
  amberSpecimens: number;
  mineralSlabs: number;
  preservedEmbryos: Record<string, number>;
  coins: number;
}

export interface FrontierTrailRun {
  runId: string;
  currentNodeIndex: number; // 1 through 5
  activeStrataId: FrontierBiomeStrataId;
  morale: number; // 0 to 100
  maxMorale: number; // 100
  isCompleted: boolean;
  isExtracted: boolean;
  isFailed: boolean;
  currentEventCard: FrontierEventCard | null;
  resolvedEventChoice: EventActionType | null;
  eventOutcomeMessage: string | null;
  rucksack: FrontierRucksack;
  nodeHistory: Array<{
    node: number;
    strataId: FrontierBiomeStrataId;
    eventTitle: string;
    actionTaken: EventActionType;
    success: boolean;
  }>;
}

// Construction Sink Costs for Amber Bio-Lab
export const AMBER_BIO_LAB_CONSTRUCTION_COSTS = {
  coins: 3500000,
  firedHardwood: 500,
  temperedGlass: 150,
  copperPipes: 60,
  geothermalRelics: 20,
};

// Initial State Factories
export function createDefaultAmberBioLab(): AmberBioLabState {
  return {
    isConstructed: true, // Default accessible for rich gameplay
    coolingPipesInstalled: true,
    totalSpecimensRevived: 0,
    chambers: [
      {
        chamberId: 1,
        status: 'EMPTY',
        durationSec: 60,
        progressPct: 0,
        towerWaterReservedLiters: 0,
        uncooledSecElapsed: 0,
      },
      {
        chamberId: 2,
        status: 'EMPTY',
        durationSec: 90,
        progressPct: 0,
        towerWaterReservedLiters: 0,
        uncooledSecElapsed: 0,
      },
      {
        chamberId: 3,
        status: 'EMPTY',
        durationSec: 120,
        progressPct: 0,
        towerWaterReservedLiters: 0,
        uncooledSecElapsed: 0,
      },
    ],
  };
}

export function createDefaultSanctuary(): PrehistoricSanctuaryState {
  return {
    enclosures: {
      enclosure_silt_terrarium: {
        enclosureId: 'enclosure_silt_terrarium',
        name: 'Silt-Bottom Terrarium',
        era: 'Cambrian',
        biomeStrata: 'paleo_silt_beds',
        speciesId: 'asaphid_trilobite',
        specimenCount: 1, // Start with 1 revived pioneer specimen!
        troughFoodLiters: 70,
        maxTroughLiters: 100,
        isStarving: false,
        lastFedTimestamp: Date.now(),
        harvestProgressSec: 0,
        harvestReadyCount: 1,
      },
      enclosure_canopy_terrarium: {
        enclosureId: 'enclosure_canopy_terrarium',
        name: 'Humid Canopy Terrarium',
        era: 'Carboniferous',
        biomeStrata: 'primeval_mangrove',
        speciesId: 'meganeura',
        specimenCount: 0,
        troughFoodLiters: 50,
        maxTroughLiters: 100,
        isStarving: false,
        lastFedTimestamp: Date.now(),
        harvestProgressSec: 0,
        harvestReadyCount: 0,
      },
      enclosure_sylvan_floor: {
        enclosureId: 'enclosure_sylvan_floor',
        name: 'Humid Sylvan Floor',
        era: 'Carboniferous',
        biomeStrata: 'primeval_mangrove',
        speciesId: 'arthropleura',
        specimenCount: 0,
        troughFoodLiters: 50,
        maxTroughLiters: 100,
        isStarving: false,
        lastFedTimestamp: Date.now(),
        harvestProgressSec: 0,
        harvestReadyCount: 0,
      },
      enclosure_geothermal_basin: {
        enclosureId: 'enclosure_geothermal_basin',
        name: 'Geothermal Stone Basin',
        era: 'Permian',
        biomeStrata: 'sunken_red_quarry',
        speciesId: 'dimetrodon',
        specimenCount: 0,
        troughFoodLiters: 40,
        maxTroughLiters: 100,
        isStarving: false,
        lastFedTimestamp: Date.now(),
        harvestProgressSec: 0,
        harvestReadyCount: 0,
      },
      enclosure_thermal_mire: {
        enclosureId: 'enclosure_thermal_mire',
        name: 'Deep Thermal Mire',
        era: 'Mesozoic',
        biomeStrata: 'thermal_mud_crevasse',
        speciesId: 'titanoboa',
        specimenCount: 0,
        troughFoodLiters: 30,
        maxTroughLiters: 100,
        isStarving: false,
        lastFedTimestamp: Date.now(),
        harvestProgressSec: 0,
        harvestReadyCount: 0,
      },
      enclosure_glacial_paddock: {
        enclosureId: 'enclosure_glacial_paddock',
        name: 'Sub-Zero Glacial Paddock',
        era: 'Pleistocene',
        biomeStrata: 'glacial_permafrost',
        speciesId: 'woolly_mammoth',
        specimenCount: 0,
        troughFoodLiters: 60,
        maxTroughLiters: 100,
        isStarving: false,
        lastFedTimestamp: Date.now(),
        harvestProgressSec: 0,
        harvestReadyCount: 0,
      },
    },
  };
}
