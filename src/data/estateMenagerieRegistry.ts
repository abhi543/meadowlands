// ============================================================================
// ESTATE MENAGERIE & FAUNA CODEX — UNIFIED REGISTRY & COMPENDIUM SPECIFICATION
// Consolidates Modern Farm Livestock (4) and Prehistoric Sanctuary Fauna (6)
// ============================================================================

import { AnimalSpecies } from '@/game/data';
import { EnclosureTypeId, PrehistoricSpeciesId } from '@/types/prehistoric';

export type FaunaCategory = 'modern_farm' | 'prehistoric_reserve';
export type FaunaTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface FaunaDefinition {
  id: string;
  speciesKey?: AnimalSpecies;
  prehistoricId?: PrehistoricSpeciesId;
  enclosureType?: EnclosureTypeId;
  name: string;
  scientificOrBreedName: string;
  category: FaunaCategory;
  categoryLabel: string;
  tier: FaunaTier;
  tierBadgeLabel: string; // e.g. "Common Farm", "Uncommon Prehistoric", etc.
  era: string; // e.g. "Holocene • Modern", "Cambrian (~500M BC)"
  eraShort: string;
  emoji: string;
  avatar: string;
  
  // Diet & Trough
  dietLabel: string;
  dietDescription: string;
  dietItemIds: string[]; // item IDs to check in barn/silo
  dietEmoji: string;
  troughMaxUnits: number;
  feedDrainRatePerSec: number;

  // Harvest / Shed Drops
  primaryDropName: string;
  primaryDropItemId: string;
  primaryDropEmoji: string;
  primaryDropUsage: string;
  baseIntervalSec: number;

  // Passive Estate Aura & Buffs
  passiveAuraTitle: string;
  passiveAuraSummary: string; // concise badge text (e.g. "-15% Weed Rate")
  passiveAuraDesc: string; // full tooltip / description
  passiveAuraEmoji: string;

  // Enclosure Environment Telemetry
  enclosureName: string;
  enclosureLinkStatus: string;
  defaultCoupledStatus: string;
}

export const ESTATE_MENAGERIE_REGISTRY: FaunaDefinition[] = [
  // ==========================================================================
  // A. DOMESTIC LIVESTOCK (Category: Modern Farm)
  // ==========================================================================
  {
    id: 'chicken',
    speciesKey: 'chicken',
    name: 'Chicken',
    scientificOrBreedName: 'Gallus gallus domesticus (Heritage Flock)',
    category: 'modern_farm',
    categoryLabel: 'Farm Livestock',
    tier: 'common',
    tierBadgeLabel: 'Common Farm',
    era: 'Holocene • Modern Domestic',
    eraShort: 'Modern Farm',
    emoji: '🐔',
    avatar: '🐓',
    dietLabel: 'Seed Mix or Harvested Wheat',
    dietDescription: 'Crushed seed grain mix or farm-fresh wheat bundles.',
    dietItemIds: ['feed', 'wheat'],
    dietEmoji: '🌾',
    troughMaxUnits: 100,
    feedDrainRatePerSec: 0.05,
    primaryDropName: 'Fresh Farm Eggs',
    primaryDropItemId: 'egg',
    primaryDropEmoji: '🥚',
    primaryDropUsage: 'Consumed in Bakery and gourmet culinary recipes.',
    baseIntervalSec: 60,
    passiveAuraTitle: 'Pest Pecking',
    passiveAuraSummary: '-15% Weed Growth Rate',
    passiveAuraDesc: 'Reduces farm plot weed growth and infestation rate by -15% through vigilant foraging.',
    passiveAuraEmoji: '🌱',
    enclosureName: 'Heritage Coop & Run',
    enclosureLinkStatus: 'Ventilation: Coupled • Clean Perch • 21°C',
    defaultCoupledStatus: 'Coop Microclimate Active',
  },
  {
    id: 'cow',
    speciesKey: 'cow',
    name: 'Dairy Cow',
    scientificOrBreedName: 'Bos taurus (Holstein-Friesian)',
    category: 'modern_farm',
    categoryLabel: 'Farm Livestock',
    tier: 'common',
    tierBadgeLabel: 'Common Farm',
    era: 'Holocene • Modern Domestic',
    eraShort: 'Modern Farm',
    emoji: '🐄',
    avatar: '🐮',
    dietLabel: 'Hay Bales or Green Fodder',
    dietDescription: 'Sun-cured meadow hay bales or succulent green grass fodder.',
    dietItemIds: ['feed', 'wheat'],
    dietEmoji: '🌾',
    troughMaxUnits: 100,
    feedDrainRatePerSec: 0.05,
    primaryDropName: 'Raw Milk',
    primaryDropItemId: 'milk',
    primaryDropEmoji: '🥛',
    primaryDropUsage: 'Processed in Dairy for rich Butter and aged artisanal Cheese.',
    baseIntervalSec: 120,
    passiveAuraTitle: 'Manure Generation',
    passiveAuraSummary: 'Rich Organic Soil Compost',
    passiveAuraDesc: 'Periodically yields rich organic compost for soil plots, boosting natural earthworm activity.',
    passiveAuraEmoji: '💩',
    enclosureName: 'Pasture Barn & Meadow',
    enclosureLinkStatus: 'Hydration: Coupled • Bedding Straw Fresh • 18°C',
    defaultCoupledStatus: 'Barn Hydration Coupled',
  },
  {
    id: 'sheep',
    speciesKey: 'sheep',
    name: 'Sheep',
    scientificOrBreedName: 'Ovis aries (Pasture Merino)',
    category: 'modern_farm',
    categoryLabel: 'Farm Livestock',
    tier: 'common',
    tierBadgeLabel: 'Common Farm',
    era: 'Holocene • Modern Domestic',
    eraShort: 'Modern Farm',
    emoji: '🐑',
    avatar: '🐏',
    dietLabel: 'Field Clover or Fresh Pasture Grass',
    dietDescription: 'Sweet field clover or dense perennial pasture turf.',
    dietItemIds: ['feed', 'wheat'],
    dietEmoji: '☘️',
    troughMaxUnits: 100,
    feedDrainRatePerSec: 0.05,
    primaryDropName: 'Raw Wool Fleece',
    primaryDropItemId: 'wool',
    primaryDropEmoji: '🧶',
    primaryDropUsage: 'Spun at the Loom into high-grade yarns and warm winter fabrics.',
    baseIntervalSec: 150,
    passiveAuraTitle: 'Pasture Grazing',
    passiveAuraSummary: 'Perimeter Weed Trimming',
    passiveAuraDesc: 'Passively trims perimeter weeds and brush, suppressing wild thicket encroachment.',
    passiveAuraEmoji: '✂️',
    enclosureName: 'Pasture Paddock',
    enclosureLinkStatus: 'Perimeter: Grounded • Sun Canopy 100% • 19°C',
    defaultCoupledStatus: 'Perimeter Grounds Guarded',
  },
  {
    id: 'pig',
    speciesKey: 'pig',
    name: 'Pig',
    scientificOrBreedName: 'Sus domesticus (Rooting Truffler)',
    category: 'modern_farm',
    categoryLabel: 'Farm Livestock',
    tier: 'common',
    tierBadgeLabel: 'Common Farm',
    era: 'Holocene • Modern Domestic',
    eraShort: 'Modern Farm',
    emoji: '🐖',
    avatar: '🐷',
    dietLabel: 'Root Mash or Steamed Vegetable Slurry',
    dietDescription: 'Cooked root vegetable mash or farm veggie scrap slurry.',
    dietItemIds: ['feed', 'carrot', 'soybean', 'corn'],
    dietEmoji: '🥕',
    troughMaxUnits: 100,
    feedDrainRatePerSec: 0.05,
    primaryDropName: 'Truffles & Coarse Bristles',
    primaryDropItemId: 'truffle',
    primaryDropEmoji: '🍄',
    primaryDropUsage: 'Used in Oil Press and Tailor Shop recipes for premium artisan commodities.',
    baseIntervalSec: 180,
    passiveAuraTitle: 'Soil Aeration Rooting',
    passiveAuraSummary: '+Tilling Speed & Soil Loosening',
    passiveAuraDesc: 'Loosens adjacent garden plots through natural rooting, slightly increasing tilling speed.',
    passiveAuraEmoji: '🌱',
    enclosureName: 'Mud Wallow Pen',
    enclosureLinkStatus: 'Misting: Active • Silt Bed Moisture 85% • 20°C',
    defaultCoupledStatus: 'Wallow Misting Coupled',
  },

  // ==========================================================================
  // B. PREHISTORIC SANCTUARY FAUNA (Category: Prehistoric Reserve)
  // ==========================================================================
  {
    id: 'asaphid_trilobite',
    prehistoricId: 'asaphid_trilobite',
    enclosureType: 'enclosure_silt_terrarium',
    name: 'Asaphid Trilobite',
    scientificOrBreedName: 'Asaphus expansus (Stalk-Eyed Benthic)',
    category: 'prehistoric_reserve',
    categoryLabel: 'Prehistoric Reserve',
    tier: 'uncommon',
    tierBadgeLabel: 'Uncommon Prehistoric',
    era: 'Cambrian Era (~500M BC)',
    eraShort: 'Cambrian',
    emoji: '🦞',
    avatar: '🦐',
    dietLabel: 'Algae Paste',
    dietDescription: 'Synthesized benthic micro-algae culture and mineralized slurry.',
    dietItemIds: ['algae_paste'],
    dietEmoji: '🧪',
    troughMaxUnits: 100,
    feedDrainRatePerSec: 0.05,
    primaryDropName: 'Chitin Molt Plates',
    primaryDropItemId: 'chitin_molt_plates',
    primaryDropEmoji: '🛡️',
    primaryDropUsage: 'Essential component for Workshop Sluice Gate Seals and Hardened Trowels.',
    baseIntervalSec: 120,
    passiveAuraTitle: 'Subaquatic Soil Conditioning',
    passiveAuraSummary: '+15% Soil Moisture Retention',
    passiveAuraDesc: 'Maintains subaquatic soil aeration and boosts capillary moisture retention by +15% across all farm plots.',
    passiveAuraEmoji: '💧',
    enclosureName: 'Silt-Bottom Terrarium',
    enclosureLinkStatus: 'Hydraulic Silt Bed: Saline 1.025 S.G. • 18°C Stable',
    defaultCoupledStatus: 'Closed-Loop Saline Flow OK',
  },
  {
    id: 'meganeura',
    prehistoricId: 'meganeura',
    enclosureType: 'enclosure_canopy_terrarium',
    name: 'Meganeura',
    scientificOrBreedName: 'Meganeura monyi (Apex Griffinfly)',
    category: 'prehistoric_reserve',
    categoryLabel: 'Prehistoric Reserve',
    tier: 'uncommon',
    tierBadgeLabel: 'Uncommon Prehistoric',
    era: 'Carboniferous Era (~300M BC)',
    eraShort: 'Carboniferous',
    emoji: '🦗',
    avatar: '🪰',
    dietLabel: 'Ground Insect Meal or Seed Slurry',
    dietDescription: 'High-protein insect mash or pulverized primeval seed slurry.',
    dietItemIds: ['insect_mash'],
    dietEmoji: '🥣',
    troughMaxUnits: 100,
    feedDrainRatePerSec: 0.05,
    primaryDropName: 'Prismatic Wing Membranes',
    primaryDropItemId: 'prismatic_wing_membrane',
    primaryDropEmoji: '🪽',
    primaryDropUsage: 'Used in Workshop for Prismatic Solar Lenses and optical collectors.',
    baseIntervalSec: 180,
    passiveAuraTitle: 'Aerial Canopy Patrol',
    passiveAuraSummary: 'Crop Blight Immunity Active',
    passiveAuraDesc: 'Grants complete immunity against airborne crop blights and speeds up flowering by +25%.',
    passiveAuraEmoji: '🛡️',
    enclosureName: 'Humid Canopy Terrarium',
    enclosureLinkStatus: 'O₂ Enrichment: 32% Atmospheric • 27°C Mist',
    defaultCoupledStatus: 'Hyper-Oxygen Canopy Coupled',
  },
  {
    id: 'arthropleura',
    prehistoricId: 'arthropleura',
    enclosureType: 'enclosure_sylvan_floor',
    name: 'Arthropleura',
    scientificOrBreedName: 'Arthropleura armata (Primeval Sylvan Detritivore)',
    category: 'prehistoric_reserve',
    categoryLabel: 'Prehistoric Reserve',
    tier: 'rare',
    tierBadgeLabel: 'Rare Prehistoric',
    era: 'Permian Transition (~290M BC)',
    eraShort: 'Permian Transition',
    emoji: '🐛',
    avatar: '🐛',
    dietLabel: 'Leaf Silage & Crushed Root Mash',
    dietDescription: 'Fermented swamp leaf silage and crushed starchy grain mash.',
    dietItemIds: ['crushed_grain_mash'],
    dietEmoji: '🌾',
    troughMaxUnits: 100,
    feedDrainRatePerSec: 0.05,
    primaryDropName: 'Supercharged Primeval Humus',
    primaryDropItemId: 'primeval_humus',
    primaryDropEmoji: '🍂',
    primaryDropUsage: 'Instant-apply high-yield soil fertilizer and Feed Mill accelerator.',
    baseIntervalSec: 150,
    passiveAuraTitle: 'Deep Strata Infiltration',
    passiveAuraSummary: 'Enhanced Aquifer Percolation',
    passiveAuraDesc: 'Improves rainfall percolation into the Deep Groundwater Aquifer and doubles Feed Mill throughput (+100%).',
    passiveAuraEmoji: '🌧️',
    enclosureName: 'Humid Sylvan Floor',
    enclosureLinkStatus: 'Humus Layer: pH 6.4 • Moisture 92% • 22°C',
    defaultCoupledStatus: 'Detritus Mulch Bed Active',
  },
  {
    id: 'dimetrodon',
    prehistoricId: 'dimetrodon',
    enclosureType: 'enclosure_geothermal_basin',
    name: 'Dimetrodon',
    scientificOrBreedName: 'Dimetrodon grandis (Sail-Backed Synapsid)',
    category: 'prehistoric_reserve',
    categoryLabel: 'Prehistoric Reserve',
    tier: 'rare',
    tierBadgeLabel: 'Rare Prehistoric',
    era: 'Permian Era (~275M BC)',
    eraShort: 'Permian',
    emoji: '🦎',
    avatar: '🐊',
    dietLabel: 'High-Protein Fish Scraps & Preserved Meat Meal',
    dietDescription: 'Fresh stream fish fillets, savory pies, or cured protein rations.',
    dietItemIds: ['savory_fish_pie'],
    dietEmoji: '🥧',
    troughMaxUnits: 100,
    feedDrainRatePerSec: 0.05,
    primaryDropName: 'Shed Thermal Scutes',
    primaryDropItemId: 'thermal_scutes',
    primaryDropEmoji: '🔥',
    primaryDropUsage: 'Used in Workshop for Thermal Retaining Cores and heating conduits.',
    baseIntervalSec: 240,
    passiveAuraTitle: 'Thermal Radiator Sail',
    passiveAuraSummary: 'Estate Frost & Cold Immunity',
    passiveAuraDesc: 'Emits an active micro-climate heat radius that prevents crop freezing and cold lockouts during cold snaps and frost.',
    passiveAuraEmoji: '☀️',
    enclosureName: 'Geothermal Stone Basin',
    enclosureLinkStatus: 'Basalt Hearth: Core 34°C • Thermal Core Coupled',
    defaultCoupledStatus: 'Geothermal Radiance Online',
  },
  {
    id: 'titanoboa',
    prehistoricId: 'titanoboa',
    enclosureType: 'enclosure_thermal_mire',
    name: 'Titanoboa',
    scientificOrBreedName: 'Titanoboa cerrejonensis (Colossal River Serpent)',
    category: 'prehistoric_reserve',
    categoryLabel: 'Prehistoric Reserve',
    tier: 'legendary',
    tierBadgeLabel: 'Legendary Prehistoric',
    era: 'Paleocene Era (~58M BC)',
    eraShort: 'Paleocene',
    emoji: '🐍',
    avatar: '🐍',
    dietLabel: 'Preserved Poultry & Heavy Meat Rations',
    dietDescription: 'Fresh river sturgeon, whole fowl, and concentrated animal rations.',
    dietItemIds: ['sturgeon'],
    dietEmoji: '🐟',
    troughMaxUnits: 100,
    feedDrainRatePerSec: 0.05,
    primaryDropName: 'Giant Serpent Slough',
    primaryDropItemId: 'serpent_slough',
    primaryDropEmoji: '📜',
    primaryDropUsage: 'Used in Workshop for high-pressure irrigation gaskets and hydraulic seals.',
    baseIntervalSec: 300,
    passiveAuraTitle: 'Canal Hydro-Compaction',
    passiveAuraSummary: 'Erosion Immunity & Fast Flow',
    passiveAuraDesc: 'Reinforces dirt canal banks, eliminating erosion, speeding up water flow, and repelling nocturnal crop vermin.',
    passiveAuraEmoji: '🌊',
    enclosureName: 'Deep Thermal Mire',
    enclosureLinkStatus: 'Canal Bed: Depth 4.2m • Siphon Coupled • 31°C Mire',
    defaultCoupledStatus: 'Hydro-Compaction Wave Active',
  },
  {
    id: 'woolly_mammoth',
    prehistoricId: 'woolly_mammoth',
    enclosureType: 'enclosure_glacial_paddock',
    name: 'Woolly Mammoth',
    scientificOrBreedName: 'Mammuthus primigenius (Glacial Sovereign)',
    category: 'prehistoric_reserve',
    categoryLabel: 'Prehistoric Reserve',
    tier: 'legendary',
    tierBadgeLabel: 'Legendary Prehistoric',
    era: 'Pleistocene Era (~100K BC)',
    eraShort: 'Pleistocene',
    emoji: '🦣',
    avatar: '🐘',
    dietLabel: 'Cured Hay Bales, Hardwood Browse & Grain Mash',
    dietDescription: 'Dense mountain hay bales, hardwood twig browse, and grain mash.',
    dietItemIds: ['mountain_hay_bales'],
    dietEmoji: '🌾',
    troughMaxUnits: 100,
    feedDrainRatePerSec: 0.05,
    primaryDropName: 'Insulated Down Wool',
    primaryDropItemId: 'insulated_down_wool',
    primaryDropEmoji: '🧶',
    primaryDropUsage: 'Woven at the Loom into high-tier extreme-cold textiles and blizzard coats.',
    baseIntervalSec: 360,
    passiveAuraTitle: 'Permafrost Shield & Haul Draft',
    passiveAuraSummary: 'Blizzard Ward & +20% Haul Speed',
    passiveAuraDesc: 'Estate-wide blizzard resistance, -30% worker hydration drain during heatwaves, and +20% worker hauling speed.',
    passiveAuraEmoji: '❄️',
    enclosureName: 'Sub-Zero Glacial Paddock',
    enclosureLinkStatus: 'Cryo-Loop: Permafrost Core -6°C • Chill Ducts OK',
    defaultCoupledStatus: 'Glacial Permafrost Shield Up',
  },
];

// Map lookup by ID
export const ESTATE_MENAGERIE_MAP = ESTATE_MENAGERIE_REGISTRY.reduce((acc, f) => {
  acc[f.id] = f;
  return acc;
}, {} as Record<string, FaunaDefinition>);

export const FAUNA_TIER_COLORS: Record<FaunaTier, {
  badge: string;
  border: string;
  glow: string;
  text: string;
  bgLight: string;
}> = {
  common: {
    badge: 'bg-stone-800/90 text-stone-300 border-stone-500/40',
    border: 'border-stone-500/40 hover:border-stone-400',
    glow: 'shadow-stone-700/10',
    text: 'text-stone-300',
    bgLight: 'bg-stone-500/10',
  },
  uncommon: {
    badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    glow: 'shadow-emerald-500/20',
    text: 'text-emerald-400',
    bgLight: 'bg-emerald-500/10',
  },
  rare: {
    badge: 'bg-sky-950/90 text-sky-300 border-sky-500/40',
    border: 'border-sky-500/40 hover:border-sky-400',
    glow: 'shadow-sky-500/20',
    text: 'text-sky-400',
    bgLight: 'bg-sky-500/10',
  },
  legendary: {
    badge: 'bg-amber-950/90 text-amber-200 border-amber-500/50 ring-1 ring-amber-400/30',
    border: 'border-amber-500/50 hover:border-amber-400 ring-1 ring-amber-400/20',
    glow: 'shadow-amber-500/30',
    text: 'text-amber-300',
    bgLight: 'bg-amber-500/10',
  },
};
