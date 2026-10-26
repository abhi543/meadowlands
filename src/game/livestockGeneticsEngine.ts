// ============================================================================
// MEADOWLANDS - LIVESTOCK GENETICS & TRAIT INHERITANCE SYSTEM
// Comprehensive genetic breeding engine for Cow, Hen (Chicken), and Pig.
// Handles generation scaling, trait rolls, cosmetic coats, and resale pricing.
// ============================================================================

import { type AnimalSpecies } from './data';

export type AnimalTraitId =
  | 'none'
  // Cow Traits
  | 'rich_nitrogen'
  | 'golden_cream'
  // Pig Traits
  | 'hyper_slurry'
  | 'mineral_snout'
  // Hen Traits
  | 'double_yolk'
  | 'calcified_shells';

export interface TraitDefinition {
  id: AnimalTraitId;
  name: string;
  species: AnimalSpecies;
  emoji: string;
  badgeColor: string;
  summary: string;
  detailedEffect: string;
}

export interface CoatDefinition {
  id: string;
  name: string;
  species: AnimalSpecies;
  minGeneration: number;
  sellValueMultiplier: number;
  emoji: string;
  badgeColor: string;
  description: string;
}

export const SPECIES_TRAIT_REGISTRY: Record<string, TraitDefinition> = {
  // --- Cow Traits ---
  rich_nitrogen: {
    id: 'rich_nitrogen',
    name: 'Rich Nitrogen',
    species: 'cow',
    emoji: '🧪',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-700',
    summary: '2x Volume towards N₂ Dewar tank',
    detailedEffect: 'Slurry output contributes 2x effective volume towards the Liquid Nitrogen Dewar (N₂) refinery tank.',
  },
  golden_cream: {
    id: 'golden_cream',
    name: 'Golden Cream',
    species: 'cow',
    emoji: '🥛',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700',
    summary: 'Milking yields Golden Milk (2.5x coin value)',
    detailedEffect: 'Milking gives rare Golden Milk which sells on regional markets for 2.5x base coin price.',
  },

  // --- Pig Traits ---
  hyper_slurry: {
    id: 'hyper_slurry',
    name: 'Hyper Slurry',
    species: 'pig',
    emoji: '⚡',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700',
    summary: '+60% Slurry Production Rate',
    detailedEffect: 'Increases slurry byproduct generation velocity by +60% into intake tanks.',
  },
  mineral_snout: {
    id: 'mineral_snout',
    name: 'Mineral Snout',
    species: 'pig',
    emoji: '🌋',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-700',
    summary: '80% Sulfur Dust / 20% Wild Truffle (75c)',
    detailedEffect: 'When grazing outdoors, 80% chance every 60s to unearth 1x Raw Sulfur Dust (SO₂ lab input) and 20% for Wild Truffle (75 coins).',
  },

  // --- Hen Traits ---
  double_yolk: {
    id: 'double_yolk',
    name: 'Double Yolk',
    species: 'chicken',
    emoji: '🥚',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/70 dark:text-yellow-200 dark:border-yellow-700',
    summary: '30% chance for 2x eggs per cycle',
    detailedEffect: 'Has a 30% chance to drop double egg yields on every laying cycle.',
  },
  calcified_shells: {
    id: 'calcified_shells',
    name: 'Calcified Shells',
    species: 'chicken',
    emoji: '🦴',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-700',
    summary: 'Drops 1x Bone Meal / Phosphorus (PH₃ input)',
    detailedEffect: 'Laying an egg also deposits 1x Bone Meal / Phosphorus into Gas Lab feedstocks for Phosphine (PH₃) production.',
  },
};

export const SPECIES_COAT_REGISTRY: Record<string, CoatDefinition> = {
  // --- Cow Coats ---
  holstein: {
    id: 'holstein',
    name: 'Holstein (Black & White)',
    species: 'cow',
    minGeneration: 0,
    sellValueMultiplier: 1.0,
    emoji: '🐄',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300',
    description: 'Classic dairy pasture pattern. Standard market resale value.',
  },
  caramel_jersey: {
    id: 'caramel_jersey',
    name: 'Caramel Jersey',
    species: 'cow',
    minGeneration: 1,
    sellValueMultiplier: 1.75,
    emoji: '🟤',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200',
    description: 'Rich velvety caramel coat from Gen 1+ selective breeding (+75% resale value).',
  },
  midnight_onyx: {
    id: 'midnight_onyx',
    name: 'Midnight Onyx',
    species: 'cow',
    minGeneration: 2,
    sellValueMultiplier: 3.5,
    emoji: '✨',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-400 dark:bg-purple-950/80 dark:text-purple-200 ring-1 ring-purple-400/40',
    description: 'Stunning obsidian shimmer coat from Gen 2+ lineage (+250% resale value).',
  },

  // --- Pig Coats ---
  standard_pink: {
    id: 'standard_pink',
    name: 'Standard Pink',
    species: 'pig',
    minGeneration: 0,
    sellValueMultiplier: 1.0,
    emoji: '🐖',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300',
    description: 'Standard domestic swine skin. Baseline market value.',
  },
  spotted_mudback: {
    id: 'spotted_mudback',
    name: 'Spotted Mudback',
    species: 'pig',
    minGeneration: 1,
    sellValueMultiplier: 1.75,
    emoji: '🐗',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200',
    description: 'Hardy rustic mudback coat from Gen 1+ breeding (+75% resale value).',
  },
  wild_iron_bristle: {
    id: 'wild_iron_bristle',
    name: 'Wild Iron Bristle',
    species: 'pig',
    minGeneration: 2,
    sellValueMultiplier: 3.5,
    emoji: '🛡️',
    badgeColor: 'bg-zinc-100 text-zinc-900 border-zinc-400 dark:bg-zinc-800 dark:text-zinc-100 ring-1 ring-zinc-400/40',
    description: 'Ferrous metallic coat from Gen 2+ ancestral bloodlines (+250% resale value).',
  },

  // --- Hen Coats ---
  white_leghorn: {
    id: 'white_leghorn',
    name: 'White Leghorn',
    species: 'chicken',
    minGeneration: 0,
    sellValueMultiplier: 1.0,
    emoji: '🐔',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300',
    description: 'Pure snow-white standard leghorn plumage. Baseline value.',
  },
  silkie_silver: {
    id: 'silkie_silver',
    name: 'Silkie Silver',
    species: 'chicken',
    minGeneration: 1,
    sellValueMultiplier: 1.75,
    emoji: '🪶',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-200',
    description: 'Feathery satin silver down from Gen 1+ breeding (+75% resale value).',
  },
  golden_phoenix: {
    id: 'golden_phoenix',
    name: 'Golden Phoenix',
    species: 'chicken',
    minGeneration: 2,
    sellValueMultiplier: 4.0,
    emoji: '👑',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/80 dark:text-amber-200 ring-1 ring-amber-400/50',
    description: 'Resplendent radiant golden crest from Gen 2+ lineage (+300% resale value).',
  },

  // --- Sheep Fallbacks (For General Herd Robustness) ---
  white_dorset: {
    id: 'white_dorset',
    name: 'White Dorset',
    species: 'sheep',
    minGeneration: 0,
    sellValueMultiplier: 1.0,
    emoji: '🐑',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300',
    description: 'Standard white pasture fleece.',
  },
};

/**
 * Returns default store-bought coat for a given species.
 */
export function getDefaultCoat(species: AnimalSpecies): string {
  switch (species) {
    case 'cow': return 'holstein';
    case 'pig': return 'standard_pink';
    case 'chicken': return 'white_leghorn';
    case 'sheep': return 'white_dorset';
    default: return 'default';
  }
}

/**
 * Retrieves trait definition or null if 'none'.
 */
export function getTraitDefinition(traitId?: string | null): TraitDefinition | null {
  if (!traitId || traitId === 'none') return null;
  return SPECIES_TRAIT_REGISTRY[traitId] || null;
}

/**
 * Retrieves coat definition with graceful fallback to default coat.
 */
export function getCoatDefinition(species: AnimalSpecies, coatId?: string | null): CoatDefinition {
  if (coatId && SPECIES_COAT_REGISTRY[coatId]) {
    return SPECIES_COAT_REGISTRY[coatId];
  }
  const defaultKey = getDefaultCoat(species);
  return SPECIES_COAT_REGISTRY[defaultKey] || {
    id: 'default',
    name: 'Standard Coat',
    species,
    minGeneration: 0,
    sellValueMultiplier: 1.0,
    emoji: '🐾',
    badgeColor: 'bg-stone-100 text-stone-700 border-stone-300',
    description: 'Standard baseline coat.',
  };
}

/**
 * Rolls genetic inheritance for bred offspring:
 * - Generation: max(parentA, parentB) + 1
 * - Output multiplier: 1.0 + generation * 0.12
 * - Trait roll: 55% inherit from parents, 30% mutation, 15% none
 * - Coat roll: Gen >= 2: 8% rare, 32% Gen 1, 60% inherit
 *              Gen == 1: 30% Gen 1, 70% inherit
 */
export function rollOffspringGenetics(
  parentA: { generation?: number; trait?: string; coat?: string },
  parentB: { generation?: number; trait?: string; coat?: string },
  species: AnimalSpecies
): {
  generation: number;
  outputMultiplier: number;
  trait: AnimalTraitId;
  coat: string;
} {
  const genA = parentA?.generation || 0;
  const genB = parentB?.generation || 0;
  const babyGen = Math.max(genA, genB) + 1;
  const outputMultiplier = Number((1.0 + babyGen * 0.12).toFixed(2));

  // 1. Trait Roll:
  // 55% chance to inherit from parents (if parent has a valid trait)
  // 30% chance for mutation (random species trait)
  // 15% chance for 'none'
  let trait: AnimalTraitId = 'none';
  const rollTrait = Math.random() * 100;

  const speciesTraits = Object.values(SPECIES_TRAIT_REGISTRY).filter((t) => t.species === species);
  const parentTraits = [parentA?.trait, parentB?.trait].filter(
    (t): t is AnimalTraitId => Boolean(t && t !== 'none')
  );

  if (rollTrait < 55 && parentTraits.length > 0) {
    // Inherit from parent
    trait = parentTraits[Math.floor(Math.random() * parentTraits.length)];
  } else if (rollTrait < 85 && speciesTraits.length > 0) {
    // 30% Mutation chance
    const picked = speciesTraits[Math.floor(Math.random() * speciesTraits.length)];
    trait = picked.id;
  } else {
    trait = 'none';
  }

  // 2. Coat Roll:
  let coat = getDefaultCoat(species);
  const parentCoats = [parentA?.coat, parentB?.coat].filter(Boolean) as string[];
  const parentCoatPick = parentCoats.length > 0
    ? parentCoats[Math.floor(Math.random() * parentCoats.length)]
    : getDefaultCoat(species);

  if (babyGen >= 2) {
    const rollCoat = Math.random() * 100;
    if (rollCoat < 8) {
      // 8% Rare Gen 2+ coat
      coat = species === 'cow' ? 'midnight_onyx'
        : species === 'pig' ? 'wild_iron_bristle'
        : species === 'chicken' ? 'golden_phoenix'
        : parentCoatPick;
    } else if (rollCoat < 40) {
      // 32% Gen 1+ coat
      coat = species === 'cow' ? 'caramel_jersey'
        : species === 'pig' ? 'spotted_mudback'
        : species === 'chicken' ? 'silkie_silver'
        : parentCoatPick;
    } else {
      // 60% inherit parent coat
      coat = parentCoatPick;
    }
  } else if (babyGen === 1) {
    const rollCoat = Math.random() * 100;
    if (rollCoat < 30) {
      // 30% Gen 1 coat
      coat = species === 'cow' ? 'caramel_jersey'
        : species === 'pig' ? 'spotted_mudback'
        : species === 'chicken' ? 'silkie_silver'
        : parentCoatPick;
    } else {
      // 70% inherit parent coat
      coat = parentCoatPick;
    }
  }

  return {
    generation: babyGen,
    outputMultiplier,
    trait,
    coat,
  };
}

/**
 * Calculates animal resale market price including coat multiplier and generation lineage bonus.
 */
export function calculateAnimalResalePrice(
  species: AnimalSpecies,
  basePrice: number,
  generation?: number,
  coatId?: string
): number {
  const coatDef = getCoatDefinition(species, coatId);
  const coatMult = coatDef?.sellValueMultiplier || 1.0;
  const genBonus = 1 + (generation || 0) * 0.25; // +25% per generation
  return Math.round(basePrice * coatMult * genBonus);
}
