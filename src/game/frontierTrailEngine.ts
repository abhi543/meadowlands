// ============================================================================
// FRONTIER TRAIL PROCEDURAL ENGINE & EVENT DECK REGISTRY
// ============================================================================

import {
  FrontierBiomeStrataId,
  FrontierEventCard,
  FrontierTrailRun,
  FrontierRucksack,
  EventActionType,
  FRONTIER_STRATA_SEQUENCE,
  FRONTIER_STRATA_REGISTRY,
  PREHISTORIC_SPECIES_REGISTRY,
} from '@/types/prehistoric';

// --- Procedural Event Decks per Biome Strata ---

export const PALEOSILT_EVENT_DECK: FrontierEventCard[] = [
  {
    id: 'silt_calcified_shelf',
    strataId: 'paleo_silt_beds',
    title: 'Calcified Shale Ledge',
    ambientEmoji: '🪨🌊',
    dilemmaText: 'A crumbling marine shale cliff face reveals the segmented outline of an ancient arthropod carapace encased in mineralized silt.',
    actions: {
      specialized: {
        type: 'specialized_tool',
        label: 'Precision Amber Chisel Flaking',
        description: 'Delicately cleave along the sedimentary bedding plane to extract an undamaged trilobite specimen.',
        requiredItem: { id: 'amber_chisel', name: 'Amber Chisel', emoji: '🔨', qty: 1 },
        successRate: 0.95,
        successRewards: {
          fossilIds: ['fossil_trilobite_carapace'],
          mineralSlabs: 2,
          coins: 450,
          moraleBonus: 10,
          message: 'Splendid extraction! An intact Asaphid Trilobite carapace cleaved cleanly from the shale.',
        },
        failurePenalty: {
          moraleLoss: 15,
          message: 'The chisel slipped on a pyrite nodule, fracturing the dorsal shield.',
        },
      },
      hydrological: {
        type: 'hydrological_resource',
        label: 'Hydraulic Gravity Sluice Wash',
        description: 'Direct 100L of pressurized water from the Gravity Tower through a handheld nozzle to gently wash away loose silt.',
        requiredTowerWaterLiters: 100,
        successRate: 0.85,
        successRewards: {
          fossilIds: ['fossil_trilobite_carapace'],
          amberPieces: 1,
          coins: 300,
          message: 'Pressurized water cleared the silt matrix effortlessly, revealing a preserved carapace.',
        },
        failurePenalty: {
          moraleLoss: 20,
          message: 'Water pressure surged unexpectedly, washing fine fossil fragments into the depths.',
        },
      },
      cautious: {
        type: 'cautious_scavenge',
        label: 'Surface Silt Scavenge',
        description: 'Carefully collect surface pebbles and weathered fossil flakes without disturbing the unstable ledge.',
        successRate: 1.0,
        successRewards: {
          mineralSlabs: 1,
          coins: 120,
          message: 'Safely picked weathered mineral fragments and calcified gravel.',
        },
        failurePenalty: {
          moraleLoss: 0,
          message: '',
        },
      },
    },
  },
  {
    id: 'silt_quicksand_basin',
    strataId: 'paleo_silt_beds',
    title: 'Submerged Benthic Sink',
    ambientEmoji: '🌀🦐',
    dilemmaText: 'A saline tide has pooled in a sunken hollow. Bioluminescent Cambrian micro-crustaceans flutter around a buried fossil mound.',
    actions: {
      specialized: {
        type: 'specialized_tool',
        label: 'Excavation Pick Dredge',
        description: 'Anchor the pickaxe into bedrock to brace against the shifting quicksilt and hoist the heavy specimen block.',
        requiredItem: { id: 'excavation_pickaxe', name: 'Excavation Pickaxe', emoji: '⛏️', qty: 1 },
        successRate: 0.90,
        successRewards: {
          fossilIds: ['fossil_trilobite_carapace'],
          mineralSlabs: 3,
          coins: 600,
          moraleBonus: 15,
          message: 'Anchored solid! Hoisted a dense block containing two pristine trilobite fossils.',
        },
        failurePenalty: {
          moraleLoss: 20,
          message: 'Silt gave way underfoot, causing a minor slide and spraining a team member.',
        },
      },
      hydrological: {
        type: 'hydrological_resource',
        label: 'Feed Dispersion & Siphon',
        description: 'Scatter 5 units of Grain Feed to appease disturbed benthic fauna and flush the silt with 120L Tower water.',
        requiredItem: { id: 'feed', name: 'Animal Feed', emoji: '🫗', qty: 5 },
        requiredTowerWaterLiters: 120,
        successRate: 0.85,
        successRewards: {
          fossilIds: ['fossil_trilobite_carapace'],
          amberPieces: 2,
          coins: 350,
          message: 'Calm water and scattered feed allowed clean recovery of an intact fossil specimen.',
        },
        failurePenalty: {
          moraleLoss: 15,
          message: 'The siphon hose clogged with thick clay, costing time and team stamina.',
        },
      },
      cautious: {
        type: 'cautious_scavenge',
        label: 'Skim Exposed Ridges',
        description: 'Step lightly along the dry travertine ridges and collect loose shale shards.',
        successRate: 1.0,
        successRewards: {
          mineralSlabs: 1,
          coins: 100,
          message: 'Carefully avoided the sinkhole and collected minor shale specimens.',
        },
        failurePenalty: {
          moraleLoss: 0,
          message: '',
        },
      },
    },
  },
];

export const MANGROVE_EVENT_DECK: FrontierEventCard[] = [
  {
    id: 'mangrove_amber_vein',
    strataId: 'primeval_mangrove',
    title: 'Colossal Sigillaria Amber Seep',
    ambientEmoji: '🌲✨',
    dilemmaText: 'A towering petrified lycopod trunk contains a thick golden amber drip. Trapped inside is the iridescent, perfectly preserved wing of a giant griffinfly.',
    actions: {
      specialized: {
        type: 'specialized_tool',
        label: 'Solvent Heated Needle Drill',
        description: 'Use Thermal Solvents to soften the outer resin and core out the intact amber block.',
        requiredItem: { id: 'thermal_solvent', name: 'Thermal Solvent', emoji: '🧪', qty: 1 },
        successRate: 0.92,
        successRewards: {
          fossilIds: ['amber_meganeura_wing'],
          amberPieces: 3,
          coins: 800,
          moraleBonus: 15,
          message: 'Flawless extraction! Recovered an Amber-Encased Giant Meganeura Wing with zero stress fractures.',
        },
        failurePenalty: {
          moraleLoss: 20,
          message: 'The solvent boiled too hot, micro-fracturing the outer amber resin.',
        },
      },
      hydrological: {
        type: 'hydrological_resource',
        label: 'Pressurized Cooling Flush',
        description: 'Pump 150L of cold Gravity Tower water to solidify and fracture the petrified bark casing cleanly.',
        requiredTowerWaterLiters: 150,
        successRate: 0.85,
        successRewards: {
          fossilIds: ['amber_meganeura_wing'],
          amberPieces: 1,
          coins: 550,
          message: 'Thermal shock cracked the outer bark cleanly, exposing the amber core.',
        },
        failurePenalty: {
          moraleLoss: 25,
          message: 'The trunk split violently under pressure, splashing team members with foul swamp water.',
        },
      },
      cautious: {
        type: 'cautious_scavenge',
        label: 'Gather Resin Droplets',
        description: 'Harvest small surface amber beads without attempting the delicate deep wing extraction.',
        successRate: 1.0,
        successRewards: {
          amberPieces: 2,
          coins: 200,
          message: 'Collected several grams of pure Carboniferous amber beads.',
        },
        failurePenalty: {
          moraleLoss: 0,
          message: '',
        },
      },
    },
  },
  {
    id: 'coal_forest_hollow',
    strataId: 'primeval_mangrove',
    title: 'Hollowed Lepidodendron Log',
    ambientEmoji: '🪵🐛',
    dilemmaText: 'A massive petrified log in the dense coal forest hollow contains thick, segmented chitin plates from a giant Arthropleura.',
    actions: {
      specialized: {
        type: 'specialized_tool',
        label: 'Hardened Excavation Pick Prying',
        description: 'Lever the heavy mineralized bark with an Excavation Pickaxe to slide out the segmented plates intact.',
        requiredItem: { id: 'excavation_pickaxe', name: 'Excavation Pickaxe', emoji: '⛏️', qty: 1 },
        successRate: 0.90,
        successRewards: {
          fossilIds: ['fossil_arthropleura_plates'],
          mineralSlabs: 3,
          coins: 750,
          moraleBonus: 10,
          message: 'Success! Extracted pristine Segmented Exoskeleton Plates of an Arthropleura.',
        },
        failurePenalty: {
          moraleLoss: 20,
          message: 'The pick glanced off petrified ironwood, stinging the workers hands and denting morale.',
        },
      },
      hydrological: {
        type: 'hydrological_resource',
        label: 'Hydraulic Mud Evacuation',
        description: 'Flush 200L of water through the hollowed core to float out the ancient carapace segments.',
        requiredTowerWaterLiters: 200,
        successRate: 0.80,
        successRewards: {
          fossilIds: ['fossil_arthropleura_plates'],
          coins: 500,
          message: 'Water jet washed away centuries of coal dust, freeing the heavy plates intact.',
        },
        failurePenalty: {
          moraleLoss: 25,
          message: 'Methane pocket stirred up in the hollow! The team had to retreat coughing and shaken.',
        },
      },
      cautious: {
        type: 'cautious_scavenge',
        label: 'Examine Outer Leaf Imprints',
        description: 'Collect loose fern and lycopod leaf fossils from the perimeter of the log.',
        successRate: 1.0,
        successRewards: {
          mineralSlabs: 2,
          coins: 150,
          message: 'Recovered beautiful Carboniferous fern stone slabs.',
        },
        failurePenalty: {
          moraleLoss: 0,
          message: '',
        },
      },
    },
  },
];

export const RED_QUARRY_EVENT_DECK: FrontierEventCard[] = [
  {
    id: 'quarry_dorsal_fin_shelf',
    strataId: 'sunken_red_quarry',
    title: 'Sunken Ferruginous Sandstone Bench',
    ambientEmoji: '🏜️🦎',
    dilemmaText: 'An iron-red sandstone overhang has split under desert heat, revealing the mineralized dorsal neural spines of a Permian Dimetrodon sail.',
    actions: {
      specialized: {
        type: 'specialized_tool',
        label: 'Precision Chisel Separation',
        description: 'Chip away the friable ironstone matrix with the Amber Chisel without fracturing the long neural spines.',
        requiredItem: { id: 'amber_chisel', name: 'Amber Chisel', emoji: '🔨', qty: 1 },
        successRate: 0.88,
        successRewards: {
          fossilIds: ['fossil_dimetrodon_spine'],
          mineralSlabs: 4,
          coins: 1100,
          moraleBonus: 20,
          message: 'Incredible precision! Recovered a complete Mineralized Dorsal Sail Spine with intact grooves.',
        },
        failurePenalty: {
          moraleLoss: 25,
          message: 'A sandstone block cleaved early, snapping a delicate spine tip.',
        },
      },
      hydrological: {
        type: 'hydrological_resource',
        label: 'Hydraulic Sand Dissolution & Jerky Rations',
        description: 'Soften the red sand with 250L Tower water and bolster expedition workers with 2 loaves of Bread.',
        requiredItem: { id: 'bread', name: 'Bread', emoji: '🍞', qty: 2 },
        requiredTowerWaterLiters: 250,
        successRate: 0.85,
        successRewards: {
          fossilIds: ['fossil_dimetrodon_spine'],
          amberPieces: 2,
          coins: 850,
          message: 'Well-hydrated and fed crew washed away the sandstone bench and secured the dorsal spine.',
        },
        failurePenalty: {
          moraleLoss: 30,
          message: 'The red clay turned into an unyielding paste under the harsh sun, exhausting the crew.',
        },
      },
      cautious: {
        type: 'cautious_scavenge',
        label: 'Collect Red Ochre & Shed Teeth',
        description: 'Comb the base of the talus slope for loose Permian reptile teeth and red ochre pigments.',
        successRate: 1.0,
        successRewards: {
          mineralSlabs: 2,
          coins: 300,
          message: 'Found several sharp Permian synapsid shed teeth.',
        },
        failurePenalty: {
          moraleLoss: 0,
          message: '',
        },
      },
    },
  },
];

export const THERMAL_MUD_EVENT_DECK: FrontierEventCard[] = [
  {
    id: 'thermal_crevasse_spine',
    strataId: 'thermal_mud_crevasse',
    title: 'Scalding Geothermal Caldera Basin',
    ambientEmoji: '🌋🐍',
    dilemmaText: 'Thick sulfuric mud bubbles around a colossal fossilized vertebrate chain. It is the massive petrified spine of a Mesozoic Titanoboa Cerrejonensis.',
    actions: {
      specialized: {
        type: 'specialized_tool',
        label: 'Thermal Solvent Quench & Hoist',
        description: 'Neutralize the corrosive sulfuric salts with Thermal Solvents before winching the giant vertebrae.',
        requiredItem: { id: 'thermal_solvent', name: 'Thermal Solvent', emoji: '🧪', qty: 2 },
        successRate: 0.88,
        successRewards: {
          fossilIds: ['fossil_titanoboa_vertebra'],
          mineralSlabs: 5,
          coins: 1600,
          moraleBonus: 25,
          message: 'Masterwork recovery! Secured a massive Petrified Vertebral Column of Titanoboa.',
        },
        failurePenalty: {
          moraleLoss: 30,
          message: 'Sulfuric steam hissed through a crack, forcing the team back with stinging eyes.',
        },
      },
      hydrological: {
        type: 'hydrological_resource',
        label: 'Massive Gravity Flood Quench',
        description: 'Release 350L of Elevated Gravity Tower water into the crevasse to rapidly cool the scalding mud and secure the specimen.',
        requiredTowerWaterLiters: 350,
        successRate: 0.85,
        successRewards: {
          fossilIds: ['fossil_titanoboa_vertebra'],
          amberPieces: 3,
          coins: 1250,
          message: 'Water deluge extinguished the heat instantly, allowing safe recovery of the colossal vertebra.',
        },
        failurePenalty: {
          moraleLoss: 30,
          message: 'Scalding mud splattered across the excavation rig, damaging equipment.',
        },
      },
      cautious: {
        type: 'cautious_scavenge',
        label: 'Dredge Perimeter Mineral Scales',
        description: 'Dredge safely from the outer rim of the basin to collect sulfur-calcified crusts.',
        successRate: 1.0,
        successRewards: {
          mineralSlabs: 3,
          coins: 400,
          message: 'Safely dredged rare geothermal mineral slabs from the outer rim.',
        },
        failurePenalty: {
          moraleLoss: 0,
          message: '',
        },
      },
    },
  },
];

export const GLACIAL_PERMAFROST_EVENT_DECK: FrontierEventCard[] = [
  {
    id: 'permafrost_ice_vault',
    strataId: 'glacial_permafrost',
    title: 'Blue Permafrost Fissure Vault',
    ambientEmoji: '❄️🦣',
    dilemmaText: 'Within a sheer wall of millennia-old blue glacial ice rests an intact Woolly Mammoth core specimen with preserved muscle tissue and thick insulated fleece.',
    actions: {
      specialized: {
        type: 'specialized_tool',
        label: 'Cryo-Pickaxe Precision Trenching',
        description: 'Cut ventilation and stress relief grooves with the Excavation Pickaxe to free the ice-bound block without thawing.',
        requiredItem: { id: 'excavation_pickaxe', name: 'Excavation Pickaxe', emoji: '⛏️', qty: 2 },
        successRate: 0.85,
        successRewards: {
          fossilIds: ['cryo_mammoth_tissue'],
          mineralSlabs: 6,
          coins: 2500,
          moraleBonus: 30,
          message: 'Legendary Discovery! Retrieved intact Cryo-Preserved Core Tissue of a Woolly Mammoth!',
        },
        failurePenalty: {
          moraleLoss: 30,
          message: 'A wall of hard blue ice fractured unpredictably, nearly trapping the lead excavator.',
        },
      },
      hydrological: {
        type: 'hydrological_resource',
        label: 'Warm Tower Water Thaw & Warm Pies',
        description: 'Use 400L of warm piped water to melt a targeted boundary trench, supported by 2 Savory Fish Pies for worker endurance.',
        requiredItem: { id: 'savory_fish_pie', name: 'Savory Fish Pie', emoji: '🥧', qty: 2 },
        requiredTowerWaterLiters: 400,
        successRate: 0.90,
        successRewards: {
          fossilIds: ['cryo_mammoth_tissue'],
          amberPieces: 4,
          coins: 2200,
          moraleBonus: 20,
          message: 'The warm water trench worked like a charm! Mammoth tissue block hoisted cleanly into cryo-crates.',
        },
        failurePenalty: {
          moraleLoss: 30,
          message: 'The thaw trench refroze instantly under a blast of glacial wind, wasting valuable fuel.',
        },
      },
      cautious: {
        type: 'cautious_scavenge',
        label: 'Chisel Ice Core Samples',
        description: 'Extract loose surface ice shards and ancient mammoth hair tuffs without risking a cave-in.',
        successRate: 1.0,
        successRewards: {
          mineralSlabs: 3,
          coins: 600,
          message: 'Recovered Pleistocene permafrost mineral cores and prehistoric hair strands.',
        },
        failurePenalty: {
          moraleLoss: 0,
          message: '',
        },
      },
    },
  },
];

// Combine all decks by Strata
export const ALL_FRONTIER_DECKS: Record<FrontierBiomeStrataId, FrontierEventCard[]> = {
  paleo_silt_beds: PALEOSILT_EVENT_DECK,
  primeval_mangrove: MANGROVE_EVENT_DECK,
  sunken_red_quarry: RED_QUARRY_EVENT_DECK,
  thermal_mud_crevasse: THERMAL_MUD_EVENT_DECK,
  glacial_permafrost: GLACIAL_PERMAFROST_EVENT_DECK,
};

// --- Procedural Deck Draw Function ---
export function drawFrontierEvent(strataId: FrontierBiomeStrataId, _nodeIndex: number): FrontierEventCard {
  const deck = ALL_FRONTIER_DECKS[strataId] || PALEOSILT_EVENT_DECK;
  const randomIndex = Math.floor(Math.random() * deck.length);
  return deck[randomIndex];
}

// --- Factory for Starting a New Trail Run ---
export function startNewFrontierRun(): FrontierTrailRun {
  const firstStrata = FRONTIER_STRATA_SEQUENCE[0]; // paleo_silt_beds
  const firstCard = drawFrontierEvent(firstStrata, 1);

  return {
    runId: `trail_${Date.now()}`,
    currentNodeIndex: 1,
    activeStrataId: firstStrata,
    morale: 100,
    maxMorale: 100,
    isCompleted: false,
    isExtracted: false,
    isFailed: false,
    currentEventCard: firstCard,
    resolvedEventChoice: null,
    eventOutcomeMessage: null,
    rucksack: {
      fossils: {},
      amberSpecimens: 0,
      mineralSlabs: 0,
      preservedEmbryos: {},
      coins: 0,
    },
    nodeHistory: [],
  };
}

// --- Compute Traversal Step Morale Cost ---
export function calculateNodeTraversalCost(weatherCondition?: string): number {
  let cost = 10; // Standard progression cost
  if (!weatherCondition) return cost;

  const w = weatherCondition.toLowerCase();
  if (w.includes('storm') || w.includes('rain') || w.includes('downpour')) {
    cost += 8;
  } else if (w.includes('heat') || w.includes('drought') || w.includes('arid')) {
    cost += 6;
  } else if (w.includes('frost') || w.includes('cold') || w.includes('snow')) {
    cost += 7;
  }
  return cost;
}

// --- Resolve Action Choice ---
export interface ActionExecutionResult {
  success: boolean;
  moraleChange: number;
  message: string;
  addedFossils: string[];
  addedAmber: number;
  addedSlabs: number;
  addedEmbryos: string[];
  addedCoins: number;
}

export function executeEventAction(
  actionType: EventActionType,
  card: FrontierEventCard,
  nodeIndex: number,
  hazardPenalty: number = 0
): ActionExecutionResult {
  const branch =
    actionType === 'specialized_tool'
      ? card.actions.specialized
      : actionType === 'hydrological_resource'
      ? card.actions.hydrological
      : card.actions.cautious;

  const roll = Math.random();
  const effectiveSuccessRate = Math.max(0.1, branch.successRate - hazardPenalty);
  const isSuccess = roll <= effectiveSuccessRate;

  // Nodes 4 and 5 apply 2x rarity multiplier to legendary fossil and amber drops
  const dropMultiplier = nodeIndex >= 4 ? 2 : 1;

  if (isSuccess) {
    const rewards = branch.successRewards;
    const addedFossils: string[] = [];
    if (rewards.fossilIds) {
      for (let i = 0; i < dropMultiplier; i++) {
        addedFossils.push(...rewards.fossilIds);
      }
    }

    const addedAmber = (rewards.amberPieces || 0) * dropMultiplier;
    const addedSlabs = (rewards.mineralSlabs || 0) * dropMultiplier;
    const addedCoins = (rewards.coins || 0) * dropMultiplier;

    // Small chance at node 4-5 to discover preserved embryo
    const addedEmbryos: string[] = [];
    if (nodeIndex >= 4 && Math.random() < 0.40) {
      const speciesIds = Object.keys(PREHISTORIC_SPECIES_REGISTRY);
      const randomSpecies = speciesIds[Math.floor(Math.random() * speciesIds.length)];
      addedEmbryos.push(randomSpecies);
    }

    return {
      success: true,
      moraleChange: rewards.moraleBonus || 0,
      message: rewards.message,
      addedFossils,
      addedAmber,
      addedSlabs,
      addedEmbryos,
      addedCoins,
    };
  } else {
    const penalty = branch.failurePenalty;
    return {
      success: false,
      moraleChange: -penalty.moraleLoss,
      message: penalty.message,
      addedFossils: [],
      addedAmber: 0,
      addedSlabs: 0,
      addedEmbryos: [],
      addedCoins: 0,
    };
  }
}

// --- Bank or Forfeit Rucksack ---
export interface ExtractionResult {
  savedFossils: Record<string, number>;
  savedAmber: number;
  savedSlabs: number;
  savedEmbryos: Record<string, number>;
  savedCoins: number;
  lostMaterialsText?: string;
}

export function extractRucksack(rucksack: FrontierRucksack, isFailure: boolean): ExtractionResult {
  if (!isFailure) {
    // 100% saved
    return {
      savedFossils: { ...rucksack.fossils },
      savedAmber: rucksack.amberSpecimens,
      savedSlabs: rucksack.mineralSlabs,
      savedEmbryos: { ...rucksack.preservedEmbryos },
      savedCoins: rucksack.coins,
    };
  }

  // 0-Morale Failure: 50% permanent loss of minerals/fossils, and 100% loss of fragile embryos!
  const savedFossils: Record<string, number> = {};
  for (const [k, v] of Object.entries(rucksack.fossils)) {
    const saved = Math.floor(v / 2);
    if (saved > 0) savedFossils[k] = saved;
  }

  const savedAmber = Math.floor(rucksack.amberSpecimens / 2);
  const savedSlabs = Math.floor(rucksack.mineralSlabs / 2);
  const savedCoins = Math.floor(rucksack.coins / 2);

  return {
    savedFossils,
    savedAmber,
    savedSlabs,
    savedEmbryos: {}, // Fragile organic embryos perished
    savedCoins,
    lostMaterialsText: 'Expedition failed! 50% of cached minerals forfeited, and all fragile organic embryos perished!',
  };
}
