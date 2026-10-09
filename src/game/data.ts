// ============================================================
// Project Meadowlands — Static Game Data & Type Definitions
// ============================================================

// --- Tier ---
export type Tier = 'common' | 'uncommon' | 'rare' | 'legendary';

export const TIER_COLORS: Record<Tier, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  legendary: '#f59e0b',
};

export const TIER_LABELS: Record<Tier, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
};

export const TIER_MAX_CYCLES: Record<Tier, number> = {
  common: 8,
  uncommon: 12,
  rare: 16,
  legendary: 20,
};

// Randomize max cycles for a new animal: ±30% around the tier base, clamped to [4, 30]
export function randomMaxCycles(tier: Tier): number {
  const base = TIER_MAX_CYCLES[tier];
  const min = Math.max(4, Math.floor(base * 0.7));
  const max = Math.min(30, Math.ceil(base * 1.3));
  return min + Math.floor(Math.random() * (max - min + 1));
}

// ============================================================
// Breed Registry — 16 Named Variants (4 species × 4 tiers)
// ============================================================

export interface BreedDefinition {
  id: string;
  species: AnimalSpecies;
  tier: Tier;
  name: string;
  visualTheme: string;
  baseIntervalMs: number;
  maxCycles: number;
  primaryProductKey: string;
  baseYieldAmount: number;
  bonusDrop?: {
    itemKey: string;
    chance: number; // 0.0 to 1.0
    directCoins?: number;
  };
  gemMilestoneEveryN?: number; // e.g. every 3rd or 5th harvest
  elderMarketValue: number;
  codexGemReward: number;
}

export const BREED_REGISTRY: Record<string, BreedDefinition> = {
  // ---- Chickens ----
  chicken_common: {
    id: 'chicken_common', species: 'chicken', tier: 'common',
    name: 'Rhode Island Red', visualTheme: 'Rustic Brown Plumage',
    baseIntervalMs: 60000, maxCycles: 15,
    primaryProductKey: 'egg', baseYieldAmount: 2,
    elderMarketValue: 250, codexGemReward: 0,
  },
  chicken_uncommon: {
    id: 'chicken_uncommon', species: 'chicken', tier: 'uncommon',
    name: 'Pasture Araucana', visualTheme: 'Powder Blue Feathers',
    baseIntervalMs: 60000, maxCycles: 18,
    primaryProductKey: 'egg_blue', baseYieldAmount: 2,
    bonusDrop: { itemKey: 'soft_down_feather', chance: 0.10 },
    elderMarketValue: 375, codexGemReward: 5,
  },
  chicken_rare: {
    id: 'chicken_rare', species: 'chicken', tier: 'rare',
    name: 'Midnight Silkie', visualTheme: 'Fluffy Obsidian Down',
    baseIntervalMs: 60000, maxCycles: 22,
    primaryProductKey: 'egg_obsidian', baseYieldAmount: 3,
    bonusDrop: { itemKey: 'glossy_quill', chance: 0.20 },
    elderMarketValue: 625, codexGemReward: 20,
  },
  chicken_legendary: {
    id: 'chicken_legendary', species: 'chicken', tier: 'legendary',
    name: 'Solar Phoenix Hen', visualTheme: 'Fiery Amber Plumage',
    baseIntervalMs: 60000, maxCycles: 26,
    primaryProductKey: 'egg_golden', baseYieldAmount: 4,
    gemMilestoneEveryN: 5, elderMarketValue: 1250, codexGemReward: 50,
  },

  // ---- Cows ----
  cow_common: {
    id: 'cow_common', species: 'cow', tier: 'common',
    name: 'Holstein-Friesian', visualTheme: 'Black & White Spotted',
    baseIntervalMs: 120000, maxCycles: 12,
    primaryProductKey: 'milk', baseYieldAmount: 2,
    elderMarketValue: 750, codexGemReward: 0,
  },
  cow_uncommon: {
    id: 'cow_uncommon', species: 'cow', tier: 'uncommon',
    name: 'Jersey Buttercup', visualTheme: 'Fawn Tan Coat',
    baseIntervalMs: 120000, maxCycles: 15,
    primaryProductKey: 'milk_rich_cream', baseYieldAmount: 2,
    bonusDrop: { itemKey: 'churned_butter', chance: 0.15 },
    elderMarketValue: 1125, codexGemReward: 5,
  },
  cow_rare: {
    id: 'cow_rare', species: 'cow', tier: 'rare',
    name: 'Highland Shaggy Yak', visualTheme: 'Caramel Shag Coat',
    baseIntervalMs: 120000, maxCycles: 18,
    primaryProductKey: 'milk_alpine', baseYieldAmount: 3,
    bonusDrop: { itemKey: 'yak_wool', chance: 0.25 },
    elderMarketValue: 1875, codexGemReward: 20,
  },
  cow_legendary: {
    id: 'cow_legendary', species: 'cow', tier: 'legendary',
    name: 'Celestial Star-Bovine', visualTheme: 'Midnight Constellation',
    baseIntervalMs: 120000, maxCycles: 21,
    primaryProductKey: 'milk_starlight', baseYieldAmount: 4,
    gemMilestoneEveryN: 4, elderMarketValue: 3750, codexGemReward: 50,
  },

  // ---- Sheep ----
  sheep_common: {
    id: 'sheep_common', species: 'sheep', tier: 'common',
    name: 'Dorset White Horn', visualTheme: 'Ivory Fluffy Fleece',
    baseIntervalMs: 150000, maxCycles: 10,
    primaryProductKey: 'wool', baseYieldAmount: 2,
    elderMarketValue: 1200, codexGemReward: 0,
  },
  sheep_uncommon: {
    id: 'sheep_uncommon', species: 'sheep', tier: 'uncommon',
    name: 'Jacob Four-Horn', visualTheme: 'Piebald Spotted Wool',
    baseIntervalMs: 150000, maxCycles: 13,
    primaryProductKey: 'wool_patterned', baseYieldAmount: 2,
    bonusDrop: { itemKey: 'horn_shavings', chance: 0.15 },
    elderMarketValue: 1800, codexGemReward: 5,
  },
  sheep_rare: {
    id: 'sheep_rare', species: 'sheep', tier: 'rare',
    name: 'Merino Cloud Sheep', visualTheme: 'Dense Crimped Fleece',
    baseIntervalMs: 150000, maxCycles: 15,
    primaryProductKey: 'wool_merino', baseYieldAmount: 3,
    bonusDrop: { itemKey: 'lanolin_balm', chance: 0.25 },
    elderMarketValue: 3000, codexGemReward: 20,
  },
  sheep_legendary: {
    id: 'sheep_legendary', species: 'sheep', tier: 'legendary',
    name: 'Golden Fleece Ram', visualTheme: 'Spun Gold Metallic',
    baseIntervalMs: 150000, maxCycles: 18,
    primaryProductKey: 'wool_gilded', baseYieldAmount: 4,
    gemMilestoneEveryN: 3, elderMarketValue: 6000, codexGemReward: 50,
  },

  // ---- Pigs ----
  pig_common: {
    id: 'pig_common', species: 'pig', tier: 'common',
    name: 'Yorkshire Pink', visualTheme: 'Rose Pink Hide',
    baseIntervalMs: 180000, maxCycles: 8,
    primaryProductKey: 'truffle', baseYieldAmount: 2,
    elderMarketValue: 2200, codexGemReward: 0,
  },
  pig_uncommon: {
    id: 'pig_uncommon', species: 'pig', tier: 'uncommon',
    name: 'Berkshire Black', visualTheme: 'Black with White Socks',
    baseIntervalMs: 180000, maxCycles: 10,
    primaryProductKey: 'truffle_white', baseYieldAmount: 2,
    bonusDrop: { itemKey: 'ancient_coin', chance: 0.15, directCoins: 100 },
    elderMarketValue: 3300, codexGemReward: 5,
  },
  pig_rare: {
    id: 'pig_rare', species: 'pig', tier: 'rare',
    name: 'Iberian Bristle Boar', visualTheme: 'Slate Grey Bristle',
    baseIntervalMs: 180000, maxCycles: 12,
    primaryProductKey: 'truffle_alba', baseYieldAmount: 3,
    bonusDrop: { itemKey: 'foraged_nut', chance: 0.25 },
    elderMarketValue: 5500, codexGemReward: 20,
  },
  pig_legendary: {
    id: 'pig_legendary', species: 'pig', tier: 'legendary',
    name: 'Gilded Snout Chimera', visualTheme: 'Mottled Jade-Gold',
    baseIntervalMs: 180000, maxCycles: 14,
    primaryProductKey: 'truffle_diamond', baseYieldAmount: 4,
    bonusDrop: { itemKey: 'ancient_hoard', chance: 1.0, directCoins: 500 },
    gemMilestoneEveryN: 1, elderMarketValue: 11000, codexGemReward: 50,
  },
};

// Helper: get the default breedId for a given species (common tier)
export function defaultBreedId(species: AnimalSpecies): string {
  return `${species}_common`;
}

// Helper: get all breed IDs for a given species
export function breedsForSpecies(species: AnimalSpecies): string[] {
  return Object.values(BREED_REGISTRY).filter(b => b.species === species).map(b => b.id);
}

// Breed-specific discovery hints for undiscovered breeds in the codex
export const BREED_DISCOVERY_HINTS: Record<string, string> = {
  chicken_uncommon: 'Found in Woodland Expeditions with Berry Lure',
  chicken_rare: 'Lured with Glazed Berry Pastry on the Alpine Ridge',
  chicken_legendary: 'Breeding two Rare hens has a small chance',
  cow_uncommon: 'Found in Ridge Expeditions with Truffle Lure',
  cow_rare: 'Deep Cave expeditions with Nectar Lure',
  cow_legendary: 'Breeding two Rare cows has a small chance',
  sheep_uncommon: 'Found in Ridge Expeditions with Berry Lure',
  sheep_rare: 'Deep Cave expeditions with Truffle Lure',
  sheep_legendary: 'Breeding two Rare sheep has a small chance',
  pig_uncommon: 'Found in Cave Expeditions with Truffle Lure',
  pig_rare: 'Peak expeditions with Nectar Lure',
  pig_legendary: 'Breeding two Rare pigs has a small chance',
};

// --- Crops ---
export type CropId = 'wheat' | 'corn' | 'carrot' | 'strawberry' | 'soybean' | 'pumpkin' | 'cotton';

export interface CropDef {
  id: CropId;
  name: string;
  emoji: string;
  growTimeSec: number;
  yieldCount: number;
  seedCost: number;
}

export const CROPS: Record<CropId, CropDef> = {
  wheat:       { id: 'wheat',       name: 'Wheat',       emoji: '\u{1F33E}', growTimeSec: 60,  yieldCount: 2, seedCost: 0 },
  corn:        { id: 'corn',        name: 'Corn',        emoji: '\u{1F33D}', growTimeSec: 60,  yieldCount: 2, seedCost: 0 },
  carrot:      { id: 'carrot',      name: 'Carrot',      emoji: '\u{1F955}', growTimeSec: 90,  yieldCount: 3, seedCost: 5 },
  strawberry:  { id: 'strawberry',  name: 'Strawberry',  emoji: '\u{1F353}', growTimeSec: 120, yieldCount: 3, seedCost: 10 },
  soybean:     { id: 'soybean',     name: 'Soybean',     emoji: '\u{1FADB}', growTimeSec: 180, yieldCount: 4, seedCost: 15 },
  pumpkin:     { id: 'pumpkin',     name: 'Pumpkin',     emoji: '\u{1F383}', growTimeSec: 600, yieldCount: 5, seedCost: 25 },
  cotton:      { id: 'cotton',      name: 'Cotton',      emoji: '\u{1F33F}', growTimeSec: 150, yieldCount: 8, seedCost: 12 },
};

// --- Animals ---
export type AnimalSpecies = 'chicken' | 'cow' | 'sheep' | 'pig';

export interface AnimalDef {
  species: AnimalSpecies;
  name: string;
  emoji: string;
  habitat: string;
  habitatEmoji: string;
  capacity: number;
  feedPerCycle: number;
  product: string;
  productEmoji: string;
  productYield: number;
  productionTimeSec: number;
}

export const ANIMALS: Record<AnimalSpecies, AnimalDef> = {
  chicken: { species: 'chicken', name: 'Chicken', emoji: '\u{1F414}', habitat: 'Chicken Coop', habitatEmoji: '\u{1F3E0}', capacity: 6, feedPerCycle: 1, product: 'egg', productEmoji: '\u{1F95A}', productYield: 1, productionTimeSec: 60 },
  cow:     { species: 'cow',     name: 'Cow',     emoji: '\u{1F404}', habitat: 'Cow Barn',     habitatEmoji: '\u{1F316}', capacity: 4, feedPerCycle: 2, product: 'milk', productEmoji: '\u{1F95B}', productYield: 1, productionTimeSec: 120 },
  sheep:   { species: 'sheep',   name: 'Sheep',   emoji: '\u{1F411}', habitat: 'Sheep Pasture', habitatEmoji: '\u{1F7E9}', capacity: 4, feedPerCycle: 2, product: 'wool', productEmoji: '\u{1F9F6}', productYield: 1, productionTimeSec: 150 },
  pig:     { species: 'pig',     name: 'Pig',     emoji: '\u{1F437}', habitat: 'Pig Pen',     habitatEmoji: '\u{1F3E0}', capacity: 4, feedPerCycle: 3, product: 'truffle', productEmoji: '\u{1F344}', productYield: 1, productionTimeSec: 180 },
};

// --- Habitat Upgrades ---
export interface HabitatUpgradeStep {
  species: AnimalSpecies;
  step: number;
  additionalCapacity: number;
  costCoins: number;
}

export const HABITAT_UPGRADES: HabitatUpgradeStep[] = [
  { species: 'chicken', step: 1, additionalCapacity: 2, costCoins: 200 },
  { species: 'chicken', step: 2, additionalCapacity: 2, costCoins: 500 },
  { species: 'chicken', step: 3, additionalCapacity: 2, costCoins: 1200 },
  { species: 'cow',     step: 1, additionalCapacity: 2, costCoins: 300 },
  { species: 'cow',     step: 2, additionalCapacity: 2, costCoins: 800 },
  { species: 'cow',     step: 3, additionalCapacity: 2, costCoins: 2000 },
  { species: 'sheep',   step: 1, additionalCapacity: 2, costCoins: 300 },
  { species: 'sheep',   step: 2, additionalCapacity: 2, costCoins: 800 },
  { species: 'sheep',   step: 3, additionalCapacity: 2, costCoins: 2000 },
  { species: 'pig',     step: 1, additionalCapacity: 2, costCoins: 400 },
  { species: 'pig',     step: 2, additionalCapacity: 2, costCoins: 1000 },
  { species: 'pig',     step: 3, additionalCapacity: 2, costCoins: 2500 },
];

// --- Products ---
export type ProductId = 'feed' | 'egg' | 'milk' | 'wool' | 'truffle' | 'fish' | 'bread' | 'cheese' | 'pie' | 'sweater' | 'truffle_oil' | 'yarn' | 'quilted_blanket' | 'savory_fish_pie' | 'crab_bisque' | 'honey_comb' | 'honey' | 'wild_berries' | 'gold_nugget' | 'cotton' | 'silk' | 'lure_basic' | 'lure_berry' | 'lure_truffle' | 'lure_nectar';

export interface ProductDef {
  id: ProductId;
  name: string;
  emoji: string;
  category: 'raw' | 'animal' | 'manufactured';
  sellPrice: number;
}

export const PRODUCTS: Record<ProductId, ProductDef> = {
  feed:             { id: 'feed',             name: 'Animal Feed',      emoji: '\u{1FAD9}', category: 'raw',          sellPrice: 2 },
  egg:              { id: 'egg',              name: 'Egg',              emoji: '\u{1F95A}', category: 'animal',       sellPrice: 5 },
  milk:             { id: 'milk',             name: 'Milk',             emoji: '\u{1F95B}', category: 'animal',       sellPrice: 8 },
  wool:             { id: 'wool',             name: 'Wool',             emoji: '\u{1F9F6}', category: 'animal',       sellPrice: 10 },
  truffle:          { id: 'truffle',          name: 'Truffle',          emoji: '\u{1F344}', category: 'animal',       sellPrice: 15 },
  bread:            { id: 'bread',            name: 'Bread',            emoji: '\u{1F35E}', category: 'manufactured', sellPrice: 20 },
  cheese:           { id: 'cheese',           name: 'Cheese',           emoji: '\u{1F9C0}', category: 'manufactured', sellPrice: 25 },
  pie:              { id: 'pie',              name: 'Pie',              emoji: '\u{1F967}', category: 'manufactured', sellPrice: 35 },
  sweater:          { id: 'sweater',          name: 'Sweater',          emoji: '\u{1F9E5}', category: 'manufactured', sellPrice: 40 },
  fish:             { id: 'fish',             name: 'Fish',             emoji: '\u{1F41F}', category: 'animal',       sellPrice: 12 },
  truffle_oil:      { id: 'truffle_oil',      name: 'Truffle Oil',      emoji: '\u{1FAD2}', category: 'manufactured', sellPrice: 50 },
  yarn:             { id: 'yarn',             name: 'Yarn',             emoji: '\u{1F9F5}', category: 'manufactured', sellPrice: 18 },
  quilted_blanket:  { id: 'quilted_blanket',  name: 'Quilted Blanket',  emoji: '\u{1F9F4}', category: 'manufactured', sellPrice: 65 },
  savory_fish_pie:  { id: 'savory_fish_pie',  name: 'Savory Fish Pie',  emoji: '\u{1F967}', category: 'manufactured', sellPrice: 55 },
  crab_bisque:      { id: 'crab_bisque',      name: 'Crab Bisque',      emoji: '\u{1F352}', category: 'manufactured', sellPrice: 70 },
  honey_comb:       { id: 'honey_comb',       name: 'Honey Comb',       emoji: '\u{1F36F}', category: 'raw',          sellPrice: 12 },
  honey:            { id: 'honey',            name: 'Honey',            emoji: '\u{1F36F}', category: 'manufactured', sellPrice: 22 },
  wild_berries:     { id: 'wild_berries',     name: 'Wild Berries',     emoji: '\u{1F347}', category: 'raw',          sellPrice: 8 },
  gold_nugget:      { id: 'gold_nugget',      name: 'Gold Nugget',      emoji: '\u{2B50}',  category: 'raw',          sellPrice: 50 },
  cotton:           { id: 'cotton',           name: 'Cotton',           emoji: '\u{1F33F}', category: 'raw',          sellPrice: 6 },
  silk:             { id: 'silk',             name: 'Silk',             emoji: '\u{1F9F5}', category: 'manufactured', sellPrice: 30 },
  // Lure items (crafted for wilderness expeditions)
  lure_basic:       { id: 'lure_basic',       name: 'Sweet Seed Cluster',  emoji: '\u{1F33E}', category: 'manufactured', sellPrice: 15 },
  lure_berry:       { id: 'lure_berry',       name: 'Glazed Berry Pastry', emoji: '\u{1F353}', category: 'manufactured', sellPrice: 45 },
  lure_truffle:     { id: 'lure_truffle',     name: 'Aromatic Truffle Mash', emoji: '\u{1F344}', category: 'manufactured', sellPrice: 80 },
  lure_nectar:      { id: 'lure_nectar',      name: 'Celestial Ambrosia',  emoji: '\u{2728}',  category: 'manufactured', sellPrice: 200 },
};

// --- Production Buildings ---
export type BuildingId = 'feed_mill' | 'bakery' | 'dairy' | 'loom' | 'press' | 'tailor_shop' | 'textiles';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  emoji: string;
  recipes: RecipeDef[];
  queueSlots: number;
  unlockLevel?: number;
}

export interface RecipeDef {
  id: string;
  name: string;
  emoji: string;
  inputs: { productId: string; qty: number }[];
  output: { productId: string; qty: number };
  timeSec: number;
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  feed_mill: {
    id: 'feed_mill', name: 'Feed Mill', emoji: '\u2699\uFE0F', queueSlots: 20,
    recipes: [
      { id: 'make_feed', name: 'Make Feed', emoji: '\u{1FAD9}', inputs: [{ productId: 'wheat', qty: 2 }], output: { productId: 'feed', qty: 3 }, timeSec: 60 },
      { id: 'make_lure_basic', name: 'Sweet Seed Cluster', emoji: '\u{1F33E}', inputs: [{ productId: 'wheat', qty: 6 }, { productId: 'carrot', qty: 4 }], output: { productId: 'lure_basic', qty: 1 }, timeSec: 120 },
    ],
  },
  bakery: {
    id: 'bakery', name: 'Bakery', emoji: '\u{1F3ED}', queueSlots: 20,
    recipes: [
      { id: 'make_bread', name: 'Bake Bread', emoji: '\u{1F35E}', inputs: [{ productId: 'wheat', qty: 3 }, { productId: 'egg', qty: 1 }], output: { productId: 'bread', qty: 1 }, timeSec: 60 },
      { id: 'make_pie', name: 'Bake Pie', emoji: '\u{1F967}', inputs: [{ productId: 'bread', qty: 1 }, { productId: 'strawberry', qty: 2 }], output: { productId: 'pie', qty: 1 }, timeSec: 60 },
      { id: 'make_savory_fish_pie', name: 'Savory Fish Pie', emoji: '\u{1F967}', inputs: [{ productId: 'fish', qty: 2 }, { productId: 'wheat', qty: 2 }, { productId: 'egg', qty: 1 }], output: { productId: 'savory_fish_pie', qty: 1 }, timeSec: 75 },
      { id: 'make_crab_bisque', name: 'Crab Bisque', emoji: '\u{1F352}', inputs: [{ productId: 'fish', qty: 3 }, { productId: 'milk', qty: 1 }], output: { productId: 'crab_bisque', qty: 1 }, timeSec: 90 },
      { id: 'make_lure_berry', name: 'Glazed Berry Pastry', emoji: '\u{1F353}', inputs: [{ productId: 'pie', qty: 1 }, { productId: 'strawberry', qty: 4 }], output: { productId: 'lure_berry', qty: 1 }, timeSec: 150 },
    ],
  },
  dairy: {
    id: 'dairy', name: 'Dairy', emoji: '\u{1F9C0}', queueSlots: 20,
    recipes: [
      { id: 'make_cheese', name: 'Make Cheese', emoji: '\u{1F9C0}', inputs: [{ productId: 'milk', qty: 2 }], output: { productId: 'cheese', qty: 1 }, timeSec: 60 },
    ],
  },
  loom: {
    id: 'loom', name: 'Loom', emoji: '\u{1F9F5}', queueSlots: 20,
    recipes: [
      { id: 'make_sweater', name: 'Weave Sweater', emoji: '\u{1F9E5}', inputs: [{ productId: 'wool', qty: 3 }], output: { productId: 'sweater', qty: 1 }, timeSec: 60 },
      { id: 'make_yarn', name: 'Spin Yarn', emoji: '\u{1F9F5}', inputs: [{ productId: 'wool', qty: 1 }], output: { productId: 'yarn', qty: 2 }, timeSec: 60 },
    ],
  },
  press: {
    id: 'press', name: 'Press', emoji: '\u{1FAD2}', queueSlots: 20,
    recipes: [
      { id: 'make_truffle_oil', name: 'Press Truffle Oil', emoji: '\u{1FAD2}', inputs: [{ productId: 'truffle', qty: 2 }], output: { productId: 'truffle_oil', qty: 1 }, timeSec: 90 },
      { id: 'make_honey', name: 'Press Honey', emoji: '\u{1F36F}', inputs: [{ productId: 'honey_comb', qty: 2 }], output: { productId: 'honey', qty: 1 }, timeSec: 60 },
      { id: 'make_lure_truffle', name: 'Aromatic Truffle Mash', emoji: '\u{1F344}', inputs: [{ productId: 'truffle_oil', qty: 1 }, { productId: 'cheese', qty: 2 }], output: { productId: 'lure_truffle', qty: 1 }, timeSec: 180 },
      { id: 'make_lure_nectar', name: 'Celestial Ambrosia', emoji: '\u{2728}', inputs: [{ productId: 'truffle_oil', qty: 2 }, { productId: 'sweater', qty: 2 }, { productId: 'fish', qty: 6 }], output: { productId: 'lure_nectar', qty: 1 }, timeSec: 300 },
    ],
  },
  tailor_shop: {
    id: 'tailor_shop', name: 'Tailor Shop', emoji: '\u{1F9E5}', queueSlots: 20, unlockLevel: 18,
    recipes: [
      { id: 'make_sweater_ts', name: 'Knit Sweater', emoji: '\u{1F9E5}', inputs: [{ productId: 'yarn', qty: 3 }], output: { productId: 'sweater', qty: 1 }, timeSec: 60 },
      { id: 'make_yarn_ts', name: 'Spin Yarn', emoji: '\u{1F9F5}', inputs: [{ productId: 'cotton', qty: 3 }], output: { productId: 'yarn', qty: 2 }, timeSec: 60 },
      { id: 'make_quilted_blanket', name: 'Quilt Blanket', emoji: '\u{1F9F4}', inputs: [{ productId: 'yarn', qty: 4 }, { productId: 'wool', qty: 2 }], output: { productId: 'quilted_blanket', qty: 1 }, timeSec: 120 },
    ],
  },
  textiles: {
    id: 'textiles', name: 'Textiles', emoji: '\u{1F33F}', queueSlots: 20, unlockLevel: 12,
    recipes: [
      { id: 'make_silk', name: 'Weave Silk', emoji: '\u{1F9F5}', inputs: [{ productId: 'cotton', qty: 4 }], output: { productId: 'silk', qty: 1 }, timeSec: 60 },
    ],
  },
};

// --- Farmhands ---
export type FarmhandRole = 'lumberjack' | 'fisherman' | 'farmer' | 'artisan';

export interface FarmhandDef {
  role: FarmhandRole;
  name: string;
  emoji: string;
  description: string;
  perk: string;
}

export const FARMHANDS: Record<FarmhandRole, FarmhandDef> = {
  lumberjack: { role: 'lumberjack', name: 'Lumberjack', emoji: '\u{1FA93}', description: 'Clears wood hazards; boosts lumber mill yield.', perk: '+15% production speed' },
  fisherman:  { role: 'fisherman',  name: 'Fisherman',  emoji: '\u{1F3A3}', description: 'Passive fish gathering at riverside docks.', perk: 'Free fish every 5 min' },
  farmer:     { role: 'farmer',     name: 'Farmer',     emoji: '\u{1F468}\u200D\u{1F33E}', description: 'Decreases field growth timers on adjacent plots.', perk: '-20% crop grow time' },
  artisan:    { role: 'artisan',    name: 'Artisan',    emoji: '\u{1F9D1}\u200D\u{1F3A8}', description: 'Speeds up production processing inside factories.', perk: '-25% production time' },
};

// --- Water Zones ---
export type WaterZoneId = 'zone_pond' | 'zone_river' | 'zone_estuary' | 'zone_lake' | 'zone_ocean';

export interface WaterZoneDef {
  id: WaterZoneId;
  name: string;
  emoji: string;
  waterType: 'freshwater' | 'brackish' | 'saltwater';
  unlockLevel: number;
  baseIntervalMs: number;
  unlockCostCoins?: number;
  unlockCostGems?: number;
  species: FishSpeciesId[];
}

export const WATER_ZONES: Record<WaterZoneId, WaterZoneDef> = {
  zone_pond: {
    id: 'zone_pond', name: 'Farmstead Pond', emoji: '\u{1F327}\uFE0F', waterType: 'freshwater',
    unlockLevel: 1, baseIntervalMs: 60000,
    species: ['carp', 'catfish', 'perch'],
  },
  zone_river: {
    id: 'zone_river', name: 'Forest River Stream', emoji: '\u{1F4A7}', waterType: 'freshwater',
    unlockLevel: 5, baseIntervalMs: 60000, unlockCostCoins: 500,
    species: ['trout', 'salmon', 'bass'],
  },
  zone_estuary: {
    id: 'zone_estuary', name: 'Coastal Estuary', emoji: '\u{1F3DD}\uFE0F', waterType: 'brackish',
    unlockLevel: 10, baseIntervalMs: 60000, unlockCostCoins: 2000,
    species: ['mud_crab', 'snapper', 'barramundi'],
  },
  zone_lake: {
    id: 'zone_lake', name: 'Alpine Mountain Lake', emoji: '\u{1F3D4}\uFE0F', waterType: 'freshwater',
    unlockLevel: 16, baseIntervalMs: 80000, unlockCostCoins: 5000,
    species: ['arctic_char', 'golden_trout', 'sturgeon'],
  },
  zone_ocean: {
    id: 'zone_ocean', name: 'Deep Ocean Pier', emoji: '\u{1F30A}', waterType: 'saltwater',
    unlockLevel: 22, baseIntervalMs: 120000, unlockCostCoins: 15000, unlockCostGems: 10,
    species: ['tuna', 'marlin', 'lanternfish'],
  },
};

// --- Fish Species ---
export type FishSpeciesId = 'carp' | 'catfish' | 'perch' | 'trout' | 'salmon' | 'bass' | 'mud_crab' | 'snapper' | 'barramundi' | 'arctic_char' | 'golden_trout' | 'sturgeon' | 'tuna' | 'marlin' | 'lanternfish';

export interface FishSpeciesDef {
  id: FishSpeciesId;
  name: string;
  emoji: string;
  tier: Tier;
  sellPrice: number;
  codexGems: number;
  dropWeight: number;
  hint: string;
}

export const FISH_SPECIES: Record<FishSpeciesId, FishSpeciesDef> = {
  carp:          { id: 'carp',          name: 'Carp',          emoji: '\u{1F41F}', tier: 'common',    sellPrice: 5,  codexGems: 1, dropWeight: 60, hint: 'Common in still waters' },
  catfish:       { id: 'catfish',       name: 'Catfish',       emoji: '\u{1F41F}', tier: 'uncommon',  sellPrice: 10, codexGems: 2, dropWeight: 30, hint: 'Bottom-dwelling whiskered fish' },
  perch:         { id: 'perch',         name: 'Perch',         emoji: '\u{1F41F}', tier: 'rare',      sellPrice: 20, codexGems: 3, dropWeight: 10, hint: 'Striped and elusive' },
  trout:         { id: 'trout',         name: 'Trout',         emoji: '\u{1F41F}', tier: 'common',    sellPrice: 8,  codexGems: 1, dropWeight: 55, hint: 'Swift river swimmer' },
  salmon:        { id: 'salmon',        name: 'Salmon',        emoji: '\u{1F41F}', tier: 'uncommon',  sellPrice: 15, codexGems: 2, dropWeight: 30, hint: 'Migratory upstream' },
  bass:          { id: 'bass',          name: 'Bass',          emoji: '\u{1F41F}', tier: 'rare',      sellPrice: 25, codexGems: 3, dropWeight: 15, hint: 'A prized catch' },
  mud_crab:      { id: 'mud_crab',      name: 'Mud Crab',      emoji: '\u{1F980}', tier: 'common',    sellPrice: 10, codexGems: 1, dropWeight: 50, hint: 'Scuttles in the muck' },
  snapper:       { id: 'snapper',       name: 'Snapper',       emoji: '\u{1F41F}', tier: 'uncommon',  sellPrice: 18, codexGems: 2, dropWeight: 30, hint: 'Bright red scales' },
  barramundi:    { id: 'barramundi',    name: 'Barramundi',    emoji: '\u{1F41F}', tier: 'rare',      sellPrice: 30, codexGems: 3, dropWeight: 20, hint: 'Tropical predator' },
  arctic_char:   { id: 'arctic_char',   name: 'Arctic Char',   emoji: '\u{1F41F}', tier: 'common',    sellPrice: 15, codexGems: 1, dropWeight: 45, hint: 'Cold-water survivor' },
  golden_trout:  { id: 'golden_trout',  name: 'Golden Trout',  emoji: '\u{1F41F}', tier: 'uncommon',  sellPrice: 25, codexGems: 2, dropWeight: 35, hint: 'Shimmers like gold' },
  sturgeon:      { id: 'sturgeon',      name: 'Sturgeon',      emoji: '\u{1F41F}', tier: 'rare',      sellPrice: 40, codexGems: 3, dropWeight: 20, hint: 'Ancient river giant' },
  tuna:          { id: 'tuna',          name: 'Tuna',          emoji: '\u{1F41F}', tier: 'common',    sellPrice: 20, codexGems: 1, dropWeight: 45, hint: 'Open ocean speedster' },
  marlin:        { id: 'marlin',        name: 'Marlin',        emoji: '\u{1F41F}', tier: 'rare',      sellPrice: 50, codexGems: 3, dropWeight: 15, hint: 'The king of game fish' },
  lanternfish:   { id: 'lanternfish',   name: 'Lanternfish',   emoji: '\u{1F41F}', tier: 'legendary', sellPrice: 100, codexGems: 5, dropWeight: 5,  hint: 'Bioluminescent deep-sea wonder' },
};

// --- Fishing Rod Tiers ---
export type RodTier = 'bamboo' | 'fiberglass' | 'carbon' | 'titanium';

export interface RodTierDef {
  id: RodTier;
  name: string;
  emoji: string;
  speedMultiplier: number;
  rareBoost: number;
  legendaryBoost: number;
  unlockLevel: number;
  costCoins: number;
}

export const ROD_TIERS: Record<RodTier, RodTierDef> = {
  bamboo:     { id: 'bamboo',     name: 'Bamboo Rod',     emoji: '\u{1F3A3}', speedMultiplier: 1.0, rareBoost: 0,    legendaryBoost: 0,    unlockLevel: 1,  costCoins: 0 },
  fiberglass: { id: 'fiberglass', name: 'Fiberglass Rod', emoji: '\u{1F3A3}', speedMultiplier: 0.75, rareBoost: 0, legendaryBoost: 0, unlockLevel: 8,  costCoins: 1000 },
  carbon:     { id: 'carbon',     name: 'Carbon Rod',     emoji: '\u{1F3A3}', speedMultiplier: 0.50, rareBoost: 0.10, legendaryBoost: 0,    unlockLevel: 14, costCoins: 5000 },
  titanium:   { id: 'titanium',   name: 'Titanium Rod',   emoji: '\u{1F3A3}', speedMultiplier: 0.30, rareBoost: 0.15, legendaryBoost: 0.10, unlockLevel: 22, costCoins: 20000 },
};

export const ROD_TIER_ORDER: RodTier[] = ['bamboo', 'fiberglass', 'carbon', 'titanium'];

// --- Outfits ---
export type OutfitId = 'fisherman_slicker' | 'farmers_hat' | 'artisan_apron' | 'lumberjack_vest';

export interface OutfitDef {
  id: OutfitId;
  name: string;
  emoji: string;
  compatibleRole: FarmhandRole;
  buff: string;
}

export const OUTFITS: Record<OutfitId, OutfitDef> = {
  fisherman_slicker: { id: 'fisherman_slicker', name: 'Fisherman Slicker', emoji: '\u{1F9E5}', compatibleRole: 'fisherman', buff: '-33% catch time' },
  farmers_hat:       { id: 'farmers_hat',       name: "Farmer's Hat",      emoji: '\u{1F9E5}', compatibleRole: 'farmer',     buff: '-20% crop grow time' },
  artisan_apron:     { id: 'artisan_apron',     name: 'Artisan Apron',     emoji: '\u{1F9E5}', compatibleRole: 'artisan',    buff: '-25% production time' },
  lumberjack_vest:   { id: 'lumberjack_vest',   name: 'Lumberjack Vest',   emoji: '\u{1F9E5}', compatibleRole: 'lumberjack', buff: '+15% lumber yield' },
};

// --- Autonomous Workers ---
export type WorkerType = 'fisherman' | 'beekeeper' | 'forager' | 'merchant' | 'prospector';

export interface WorkerDef {
  type: WorkerType;
  name: string;
  emoji: string;
  description: string;
  baseIntervalMs: number;
  produces?: string;
  producesEmoji?: string;
  producesQty?: number;
  gearTiers: GearTierDef[];
}

export interface GearTierDef {
  tier: number;
  name: string;
  speedMultiplier: number;
  costCoins: number;
  costGems: number;
}

export const WORKERS: Record<WorkerType, WorkerDef> = {
  fisherman: {
    type: 'fisherman', name: 'Auto Fisherman', emoji: '\u{1F3A3}',
    description: 'Catches fish autonomously', baseIntervalMs: 60000,
    produces: 'fish', producesEmoji: '\u{1F41F}', producesQty: 1,
    gearTiers: [
      { tier: 1, name: 'Basic Net', speedMultiplier: 1.0, costCoins: 0, costGems: 0 },
      { tier: 2, name: 'Copper Net', speedMultiplier: 0.8, costCoins: 500, costGems: 0 },
      { tier: 3, name: 'Steel Net', speedMultiplier: 0.6, costCoins: 2000, costGems: 2 },
    ],
  },
  beekeeper: {
    type: 'beekeeper', name: 'Beekeeper', emoji: '\u{1F36F}',
    description: 'Tends hives for honey comb', baseIntervalMs: 120000,
    produces: 'honey_comb', producesEmoji: '\u{1F36F}', producesQty: 1,
    gearTiers: [
      { tier: 1, name: 'Basic Smoker', speedMultiplier: 1.0, costCoins: 0, costGems: 0 },
      { tier: 2, name: 'Pro Smoker', speedMultiplier: 0.75, costCoins: 800, costGems: 0 },
      { tier: 3, name: 'Elite Smoker', speedMultiplier: 0.5, costCoins: 3000, costGems: 3 },
    ],
  },
  forager: {
    type: 'forager', name: 'Forager', emoji: '\u{1F347}',
    description: 'Gathers wild berries', baseIntervalMs: 90000,
    produces: 'wild_berries', producesEmoji: '\u{1F347}', producesQty: 1,
    gearTiers: [
      { tier: 1, name: 'Basic Basket', speedMultiplier: 1.0, costCoins: 0, costGems: 0 },
      { tier: 2, name: 'Woven Basket', speedMultiplier: 0.8, costCoins: 600, costGems: 0 },
      { tier: 3, name: 'Enchanted Basket', speedMultiplier: 0.5, costCoins: 2500, costGems: 2 },
    ],
  },
  merchant: {
    type: 'merchant', name: 'Merchant', emoji: '\u{1F4B0}',
    description: 'Auto-sells excess items for coins', baseIntervalMs: 60000,
    gearTiers: [
      { tier: 1, name: 'Basic Cart', speedMultiplier: 1.0, costCoins: 0, costGems: 0 },
      { tier: 2, name: 'Sturdy Cart', speedMultiplier: 0.8, costCoins: 1000, costGems: 0 },
      { tier: 3, name: 'Golden Cart', speedMultiplier: 0.5, costCoins: 5000, costGems: 5 },
    ],
  },
  prospector: {
    type: 'prospector', name: 'Prospector', emoji: '\u{26CF}',
    description: 'Digs for gold nuggets', baseIntervalMs: 180000,
    produces: 'gold_nugget', producesEmoji: '\u2B50', producesQty: 1,
    gearTiers: [
      { tier: 1, name: 'Basic Pick', speedMultiplier: 1.0, costCoins: 0, costGems: 0 },
      { tier: 2, name: 'Iron Pick', speedMultiplier: 0.75, costCoins: 1500, costGems: 0 },
      { tier: 3, name: 'Diamond Pick', speedMultiplier: 0.5, costCoins: 8000, costGems: 5 },
    ],
  },
};

// --- Hourly Events ---
export type HourlyEventType = 'vip_chef' | 'crow_attack' | 'rainstorm' | 'smuggler';

export interface HourlyEventDef {
  type: HourlyEventType;
  name: string;
  emoji: string;
  description: string;
  durationMs: number;
}

export const HOURLY_EVENTS: Record<HourlyEventType, HourlyEventDef> = {
  vip_chef: {
    type: 'vip_chef', name: 'VIP Chef Visit', emoji: '\u{1F468}\u200D\u{1F373}',
    description: 'A VIP chef is visiting! Fulfill their order for bonus rewards.',
    durationMs: 600000, // 10 min
  },
  crow_attack: {
    type: 'crow_attack', name: 'Crow Attack!', emoji: '\u{1F426}',
    description: 'Crows are attacking your crops! Shoo them away!',
    durationMs: 180000, // 3 min
  },
  rainstorm: {
    type: 'rainstorm', name: 'Rainstorm', emoji: '\u{26C8}\uFE0F',
    description: 'Rain speeds up all crop growth by 50%!',
    durationMs: 900000, // 15 min
  },
  smuggler: {
    type: 'smuggler', name: 'Smuggler Crate', emoji: '\u{1F4E6}',
    description: 'A mysterious smuggler left a crate! Open it for loot.',
    durationMs: 900000, // 15 min
  },
};

// Smuggler crate loot table
export interface SmugglerLootEntry {
  itemId: string;
  qty: number;
  weight: number;
}

export const SMUGGLER_LOOT: SmugglerLootEntry[] = [
  { itemId: 'gems', qty: 2, weight: 10 },
  { itemId: 'fish', qty: 5, weight: 15 },
  { itemId: 'honey_comb', qty: 3, weight: 15 },
  { itemId: 'gold_nugget', qty: 1, weight: 10 },
  { itemId: 'cheese', qty: 2, weight: 15 },
  { itemId: 'sweater', qty: 1, weight: 10 },
  { itemId: 'truffle_oil', qty: 1, weight: 5 },
  { itemId: 'quilted_blanket', qty: 1, weight: 5 },
  { itemId: 'silk', qty: 2, weight: 10 },
  { itemId: 'savory_fish_pie', qty: 1, weight: 5 },
];

// VIP Chef order templates
export const CHEF_ORDER_TEMPLATES: { requested: { itemId: string; qty: number; emoji: string; name: string }[]; coinReward: number; xpReward: number; gemReward: number }[] = [
  { requested: [{ itemId: 'bread', qty: 3, emoji: '\u{1F35E}', name: 'Bread' }], coinReward: 80, xpReward: 50, gemReward: 1 },
  { requested: [{ itemId: 'cheese', qty: 2, emoji: '\u{1F9C0}', name: 'Cheese' }], coinReward: 100, xpReward: 60, gemReward: 1 },
  { requested: [{ itemId: 'pie', qty: 2, emoji: '\u{1F967}', name: 'Pie' }], coinReward: 120, xpReward: 70, gemReward: 2 },
  { requested: [{ itemId: 'sweater', qty: 1, emoji: '\u{1F9E5}', name: 'Sweater' }, { itemId: 'yarn', qty: 2, emoji: '\u{1F9F5}', name: 'Yarn' }], coinReward: 150, xpReward: 80, gemReward: 2 },
  { requested: [{ itemId: 'savory_fish_pie', qty: 1, emoji: '\u{1F967}', name: 'Savory Fish Pie' }], coinReward: 200, xpReward: 100, gemReward: 3 },
];

// --- Breeding Slot Upgrades ---
export interface BreedingSlotUpgrade {
  slotIndex: number;
  unlockLevel: number;
  costGems: number;
}

export const BREEDING_SLOT_UPGRADES: BreedingSlotUpgrade[] = [
  { slotIndex: 2, unlockLevel: 6,  costGems: 10 },
  { slotIndex: 3, unlockLevel: 14, costGems: 25 },
  { slotIndex: 4, unlockLevel: 22, costGems: 50 },
];

// --- XP Level Curve ---
export function xpForLevel(level: number): number {
  return Math.floor(50 * level * level + 100 * level);
}

export const MAX_LEVEL = 50;

// --- Order templates ---
export interface OrderTemplate {
  requested: { itemId: string; qty: number; emoji: string; name: string }[];
  coinReward: number;
  xpReward: number;
}

export const ORDER_TEMPLATES: OrderTemplate[] = [
  { requested: [{ itemId: 'wheat', qty: 5, emoji: '\u{1F33E}', name: 'Wheat' }], coinReward: 15, xpReward: 10 },
  { requested: [{ itemId: 'corn', qty: 4, emoji: '\u{1F33D}', name: 'Corn' }], coinReward: 18, xpReward: 12 },
  { requested: [{ itemId: 'egg', qty: 3, emoji: '\u{1F95A}', name: 'Egg' }], coinReward: 25, xpReward: 15 },
  { requested: [{ itemId: 'milk', qty: 2, emoji: '\u{1F95B}', name: 'Milk' }], coinReward: 30, xpReward: 18 },
  { requested: [{ itemId: 'bread', qty: 2, emoji: '\u{1F35E}', name: 'Bread' }], coinReward: 55, xpReward: 30 },
  { requested: [{ itemId: 'cheese', qty: 1, emoji: '\u{1F9C0}', name: 'Cheese' }], coinReward: 40, xpReward: 25 },
  { requested: [{ itemId: 'wool', qty: 3, emoji: '\u{1F9F6}', name: 'Wool' }], coinReward: 45, xpReward: 22 },
  { requested: [{ itemId: 'feed', qty: 5, emoji: '\u{1FAD9}', name: 'Animal Feed' }], coinReward: 20, xpReward: 12 },
  { requested: [{ itemId: 'carrot', qty: 4, emoji: '\u{1F955}', name: 'Carrot' }], coinReward: 28, xpReward: 16 },
  { requested: [{ itemId: 'strawberry', qty: 3, emoji: '\u{1F353}', name: 'Strawberry' }], coinReward: 35, xpReward: 20 },
  { requested: [{ itemId: 'pie', qty: 1, emoji: '\u{1F967}', name: 'Pie' }], coinReward: 60, xpReward: 35 },
  { requested: [{ itemId: 'sweater', qty: 1, emoji: '\u{1F9E5}', name: 'Sweater' }], coinReward: 70, xpReward: 40 },
  { requested: [{ itemId: 'fish', qty: 2, emoji: '\u{1F41F}', name: 'Fish' }], coinReward: 30, xpReward: 18 },
  { requested: [{ itemId: 'fish', qty: 5, emoji: '\u{1F41F}', name: 'Fish' }], coinReward: 75, xpReward: 40 },
  { requested: [{ itemId: 'fish', qty: 3, emoji: '\u{1F41F}', name: 'Fish' }, { itemId: 'wheat', qty: 3, emoji: '\u{1F33E}', name: 'Wheat' }], coinReward: 55, xpReward: 30 },
  { requested: [{ itemId: 'cotton', qty: 5, emoji: '\u{1F33F}', name: 'Cotton' }], coinReward: 35, xpReward: 20 },
  { requested: [{ itemId: 'honey_comb', qty: 2, emoji: '\u{1F36F}', name: 'Honey Comb' }], coinReward: 30, xpReward: 18 },
  { requested: [{ itemId: 'yarn', qty: 2, emoji: '\u{1F9F5}', name: 'Yarn' }], coinReward: 45, xpReward: 25 },
  { requested: [{ itemId: 'savory_fish_pie', qty: 1, emoji: '\u{1F967}', name: 'Savory Fish Pie' }], coinReward: 100, xpReward: 55 },
];

// --- Wilderness Expeditions ---
export type BiomeId = 'biome_woods' | 'biome_ridge' | 'biome_caves' | 'biome_peaks';
export type LureTypeId = 'lure_basic' | 'lure_berry' | 'lure_truffle' | 'lure_nectar';

export interface BiomeDef {
  id: BiomeId;
  name: string;
  emoji: string;
  description: string;
  unlockLevel: number;
  baseDurationMs: number;
  dispatchFee: number;
  // Species + tier combinations available in this biome
  speciesPool: { species: AnimalSpecies; tier: Tier; name: string; weight: number }[];
}

export const BIOMES: Record<BiomeId, BiomeDef> = {
  biome_woods: {
    id: 'biome_woods', name: 'Whispering Woods', emoji: '\u{1F332}',
    description: 'Dense forest teeming with common and uncommon breeds.',
    unlockLevel: 14, baseDurationMs: 180_000, dispatchFee: 2500,
    speciesPool: [
      { species: 'chicken', tier: 'common', name: 'Rhode Island Red', weight: 50 },
      { species: 'cow', tier: 'common', name: 'Jersey Cow', weight: 30 },
      { species: 'pig', tier: 'common', name: 'Berkshire Pig', weight: 20 },
      { species: 'chicken', tier: 'uncommon', name: 'Ameraucana Hen', weight: 15 },
      { species: 'cow', tier: 'uncommon', name: 'Holstein Calf', weight: 10 },
    ],
  },
  biome_ridge: {
    id: 'biome_ridge', name: 'Alpine Ridge', emoji: '\u{26F0}\uFE0F',
    description: 'Windswept highland pastures hide uncommon and rare breeds.',
    unlockLevel: 22, baseDurationMs: 360_000, dispatchFee: 8000,
    speciesPool: [
      { species: 'cow', tier: 'uncommon', name: 'Highland Shaggy Cow', weight: 40 },
      { species: 'sheep', tier: 'uncommon', name: 'Jacob Multi-Horn', weight: 30 },
      { species: 'pig', tier: 'uncommon', name: 'Wild Boar', weight: 20 },
      { species: 'cow', tier: 'rare', name: 'Aurochs Bull', weight: 10 },
      { species: 'sheep', tier: 'rare', name: 'Blue Faced Leicester', weight: 8 },
    ],
  },
  biome_caves: {
    id: 'biome_caves', name: 'Luminescent Caverns', emoji: '\u{1F48A}',
    description: 'Glowing grottos shelter rare and legendary creatures.',
    unlockLevel: 32, baseDurationMs: 600_000, dispatchFee: 22000,
    speciesPool: [
      { species: 'chicken', tier: 'rare', name: 'Silkie Chicken', weight: 35 },
      { species: 'cow', tier: 'rare', name: 'Aurora Bovine', weight: 25 },
      { species: 'sheep', tier: 'rare', name: 'Golden Fleece Sheep', weight: 20 },
      { species: 'chicken', tier: 'legendary', name: 'Phoenix Rooster', weight: 5 },
      { species: 'pig', tier: 'legendary', name: 'Truffle Sovereign', weight: 3 },
    ],
  },
  biome_peaks: {
    id: 'biome_peaks', name: 'Sunken Volcano Peaks', emoji: '\u{1F30B}',
    description: 'Molten cradle of mythic legends. Only the finest lures prevail.',
    unlockLevel: 42, baseDurationMs: 900_000, dispatchFee: 60000,
    speciesPool: [
      { species: 'chicken', tier: 'legendary', name: 'Phoenix Rooster', weight: 30 },
      { species: 'cow', tier: 'legendary', name: 'Celestial Ox', weight: 20 },
      { species: 'sheep', tier: 'legendary', name: 'Cloudwalker Ewe', weight: 15 },
      { species: 'pig', tier: 'legendary', name: 'Infernal Boar', weight: 10 },
    ],
  },
};

export interface LureDef {
  id: LureTypeId;
  name: string;
  emoji: string;
  productId: string; // the PRODUCT id this lure maps to
  targetTier: Tier; // primary tier this lure attracts
  // Modifiers applied when this lure is used
  timeMultiplier: number;  // e.g. 0.8 = 20% faster
  rareBoost: number;       // +chance to trigger rare encounter
  legendaryBoost: number;  // +chance to trigger legendary encounter
}

export const LURES: Record<LureTypeId, LureDef> = {
  lure_basic: {
    id: 'lure_basic', name: 'Sweet Seed Cluster', emoji: '\u{1F33E}', productId: 'lure_basic',
    targetTier: 'common', timeMultiplier: 1.0, rareBoost: 0, legendaryBoost: 0,
  },
  lure_berry: {
    id: 'lure_berry', name: 'Glazed Berry Pastry', emoji: '\u{1F353}', productId: 'lure_berry',
    targetTier: 'uncommon', timeMultiplier: 0.8, rareBoost: 0.10, legendaryBoost: 0,
  },
  lure_truffle: {
    id: 'lure_truffle', name: 'Aromatic Truffle Mash', emoji: '\u{1F344}', productId: 'lure_truffle',
    targetTier: 'rare', timeMultiplier: 1.0, rareBoost: 0.35, legendaryBoost: 0.05,
  },
  lure_nectar: {
    id: 'lure_nectar', name: 'Celestial Ambrosia', emoji: '\u{2728}', productId: 'lure_nectar',
    targetTier: 'legendary', timeMultiplier: 1.0, rareBoost: 0.5, legendaryBoost: 0.25,
  },
};

// Trail encounter prompts used at the midpoint of expeditions
export const TRAIL_ENCOUNTERS = [
  {
    prompt: 'Your Farmhand spots fresh tracks leading toward a steep bramble ridge, while a gentle path follows the riverbank.',
    safeLabel: 'Follow the Riverbank',
    riskyLabel: 'Scale the Ridge',
  },
  {
    prompt: 'A faint glow emanates from a cave entrance ahead. The main trail continues through open meadow.',
    safeLabel: 'Stay on the Meadow Trail',
    riskyLabel: 'Enter the Glowing Cave',
  },
  {
    prompt: 'Fog rolls in. A well-worn path leads through the clearing, but a shadow darts between the ancient trees.',
    safeLabel: 'Take the Cleared Path',
    riskyLabel: 'Chase the Shadow',
  },
  {
    prompt: 'You hear distant howling. A sheltered den offers safety, while a narrow ridge leads toward the sound.',
    safeLabel: 'Take Shelter in the Den',
    riskyLabel: 'Follow the Howling',
  },
] as const;

// --- Livestock Market ---
export const ANIMAL_BUY_PRICES: Record<AnimalSpecies, number> = { chicken: 50, cow: 150, sheep: 200, pig: 300 };

// Market sale prices (common tier base) — derived from the economic formula:
//   Market Sale Payout = Purchase Cost + (Σ Commodity Value Generated × 1.25)
// Chicken: 50 + (150 × 1.25) = 237.5 → 250
// Cow:    150 + (192 × 1.25) = 390   → 750  (higher tier investment reward)
// Sheep:  200 + (200 × 1.25) = 450   → 1200 (premium for patience)
// Pig:    300 + (240 × 1.25) = 600   → 2200 (jackpot payday animal)
export const ANIMAL_MARKET_PRICES: Record<AnimalSpecies, number> = {
  chicken: 250,
  cow: 750,
  sheep: 1200,
  pig: 2200,
};

export const TIER_MULTIPLIER: Record<Tier, number> = {
  common: 1.0,
  uncommon: 1.5,
  rare: 2.5,
  legendary: 5.0,
};

// Full market price for an elder animal (completed all productive cycles)
export function livestockSellPrice(species: AnimalSpecies, tier: Tier): number {
  return Math.floor(ANIMAL_MARKET_PRICES[species] * TIER_MULTIPLIER[tier]);
}

// Proportional market price based on cycles already completed
// Elder animals (cyclesRemaining=0) get full price; younger animals get a fraction
export function livestockSellPriceForAnimal(species: AnimalSpecies, tier: Tier, cyclesRemaining: number, maxCycles: number): number {
  const fullPrice = livestockSellPrice(species, tier);
  const cyclesCompleted = maxCycles - cyclesRemaining;
  if (cyclesCompleted <= 0) return 0; // haven't produced anything yet
  if (cyclesRemaining <= 0) return fullPrice; // elder — full payout
  return Math.floor(fullPrice * (cyclesCompleted / maxCycles));
}

export function livestockBuyPrice(species: AnimalSpecies, tier: Tier): number {
  return Math.floor(ANIMAL_BUY_PRICES[species] * TIER_MULTIPLIER[tier]);
}

// ============================================================
// Unified Master Worker Ecosystem (v2.0) — 13 Workers, 120 Levels
// ============================================================

export type WorkerDivision = 'farmhand' | 'autonomous' | 'utility';

export type WorkerRole =
  // Division A: Farmhands (Site Buffers)
  | 'farmer' | 'lumberjack' | 'fisherman' | 'artisan'
  // Division B: Autonomous Specialists (Passive Harvesters)
  | 'auto_fisherman' | 'beekeeper' | 'forager' | 'merchant' | 'prospector'
  // Division C: Utility Specialists (Converters)
  | 'alchemist' | 'barn_overseer' | 'cellar_ager' | 'tinkerer';

export const WORKER_DIVISIONS: Record<WorkerDivision, { label: string; emoji: string; roles: WorkerRole[] }> = {
  farmhand: {
    label: 'Field Crew',
    emoji: '\u{1F33E}',
    roles: ['farmer', 'lumberjack', 'fisherman', 'artisan'],
  },
  autonomous: {
    label: 'Harvesters',
    emoji: '\u{1F41D}',
    roles: ['auto_fisherman', 'beekeeper', 'forager', 'merchant', 'prospector'],
  },
  utility: {
    label: 'Specialists',
    emoji: '\u{2699}',
    roles: ['alchemist', 'barn_overseer', 'cellar_ager', 'tinkerer'],
  },
};

export interface WorkerRegistryDef {
  role: WorkerRole;
  name: string;
  emoji: string;
  description: string;
  division: WorkerDivision;
  baseCost: number;
  baseIntervalMs: number;
  exponent: number;      // cost scaling exponent (1.068 – 1.082)
  unlockLevel: number;
  // Auto-Sell payout (coins per cycle at base)
  autoSellPayout: number;
  // Hoard mode deposit
  hoardItem?: string;      // item ID deposited to barn/silo
  hoardItemEmoji?: string;
  hoardIsSilo?: boolean;   // true = silo, false = barn
  // Secondary/rare item (for higher-level procs)
  rareItem?: string;
  rareItemEmoji?: string;
  rareItemSellPrice?: number;
}

export const WORKER_REGISTRY: Record<WorkerRole, WorkerRegistryDef> = {
  // --- Division A: Farmhands ---
  farmer: {
    role: 'farmer', name: 'Field Hand', emoji: '\u{1F468}\u200D\u{1F33E}',
    description: 'Accelerates crop timers and auto-replants', division: 'farmhand',
    baseCost: 50, baseIntervalMs: 30000, exponent: 1.068, unlockLevel: 1,
    autoSellPayout: 5, hoardItem: 'wheat', hoardItemEmoji: '\u{1F33E}', hoardIsSilo: true,
  },
  lumberjack: {
    role: 'lumberjack', name: 'Timberjack', emoji: '\u{1FA93}',
    description: 'Harvests timber from perimeter orchards', division: 'farmhand',
    baseCost: 150, baseIntervalMs: 45000, exponent: 1.070, unlockLevel: 4,
    autoSellPayout: 6, hoardItem: 'softwood', hoardItemEmoji: '\u{1FAB5}', hoardIsSilo: false,
  },
  fisherman: {
    role: 'fisherman', name: 'Dock Master', emoji: '\u{1F3A3}',
    description: 'Drives active dock catches with reeling bonus', division: 'farmhand',
    baseCost: 300, baseIntervalMs: 45000, exponent: 1.071, unlockLevel: 6,
    autoSellPayout: 15, hoardItem: 'fish', hoardItemEmoji: '\u{1F41F}', hoardIsSilo: false,
    rareItem: 'trout', rareItemEmoji: '\u{1F41F}', rareItemSellPrice: 35,
  },
  artisan: {
    role: 'artisan', name: 'Guild Craftsman', emoji: '\u{1F9D1}\u200D\u{1F3A8}',
    description: 'Cuts manufacturing duration at production buildings', division: 'farmhand',
    baseCost: 800, baseIntervalMs: 60000, exponent: 1.073, unlockLevel: 10,
    autoSellPayout: 20, hoardItem: 'bread', hoardItemEmoji: '\u{1F35E}', hoardIsSilo: false,
  },
  // --- Division B: Autonomous Specialists ---
  auto_fisherman: {
    role: 'auto_fisherman', name: 'Automated Trawler', emoji: '\u{1F3A3}',
    description: 'Passively trawls for fish on background timer', division: 'autonomous',
    baseCost: 500, baseIntervalMs: 60000, exponent: 1.072, unlockLevel: 8,
    autoSellPayout: 15, hoardItem: 'fish', hoardItemEmoji: '\u{1F41F}', hoardIsSilo: false,
    rareItem: 'trout', rareItemEmoji: '\u{1F41F}', rareItemSellPrice: 35,
  },
  beekeeper: {
    role: 'beekeeper', name: 'Apiary Tender', emoji: '\u{1F36F}',
    description: 'Tends hives for honeycomb and royal jelly', division: 'autonomous',
    baseCost: 1000, baseIntervalMs: 90000, exponent: 1.074, unlockLevel: 12,
    autoSellPayout: 25, hoardItem: 'honey_comb', hoardItemEmoji: '\u{1F36F}', hoardIsSilo: false,
    rareItem: 'honey', rareItemEmoji: '\u{1F36F}', rareItemSellPrice: 60,
  },
  forager: {
    role: 'forager', name: 'Wilderness Scout', emoji: '\u{1F347}',
    description: 'Gathers wild berries and forest herbs', division: 'autonomous',
    baseCost: 2200, baseIntervalMs: 120000, exponent: 1.075, unlockLevel: 16,
    autoSellPayout: 20, hoardItem: 'wild_berries', hoardItemEmoji: '\u{1F347}', hoardIsSilo: true,
    rareItem: 'forest_herbs', rareItemEmoji: '\u{1F33F}', rareItemSellPrice: 45,
  },
  merchant: {
    role: 'merchant', name: 'Roadside Peddler', emoji: '\u{1F4B0}',
    description: 'Auto-sells surplus silo crops at +20% premium', division: 'autonomous',
    baseCost: 5000, baseIntervalMs: 180000, exponent: 1.078, unlockLevel: 22,
    autoSellPayout: 30,
  },
  prospector: {
    role: 'prospector', name: 'Quarry Miner', emoji: '\u{26CF}',
    description: 'Digs for iron ore and gold nuggets', division: 'autonomous',
    baseCost: 10000, baseIntervalMs: 300000, exponent: 1.080, unlockLevel: 28,
    autoSellPayout: 40, hoardItem: 'gold_nugget', hoardItemEmoji: '\u2B50', hoardIsSilo: true,
    rareItem: 'iron_ore', rareItemEmoji: '\u26CF', rareItemSellPrice: 120,
  },
  // --- Division C: Utility Specialists ---
  alchemist: {
    role: 'alchemist', name: 'Botanical Synthesizer', emoji: '\u{2697}',
    description: 'Brews growth elixirs and super feed', division: 'utility',
    baseCost: 3500, baseIntervalMs: 150000, exponent: 1.076, unlockLevel: 18,
    autoSellPayout: 85, hoardItem: 'growth_elixir', hoardItemEmoji: '\u{1F9EA}', hoardIsSilo: false,
  },
  barn_overseer: {
    role: 'barn_overseer', name: 'Quartermaster', emoji: '\u{1F4E6}',
    description: 'Compacts items into crates and auto-fills troughs', division: 'utility',
    baseCost: 4200, baseIntervalMs: 120000, exponent: 1.076, unlockLevel: 20,
    autoSellPayout: 40,
  },
  cellar_ager: {
    role: 'cellar_ager', name: 'Vintage Sommelier', emoji: '\u{1F377}',
    description: 'Ages items for 3x–10x value multiplier', division: 'utility',
    baseCost: 7500, baseIntervalMs: 240000, exponent: 1.078, unlockLevel: 25,
    autoSellPayout: 75, hoardItem: 'vintage_reserve', hoardItemEmoji: '\u{1F377}', hoardIsSilo: false,
  },
  tinkerer: {
    role: 'tinkerer', name: 'Machinist', emoji: '\u{1F527}',
    description: 'Overclocks buildings 2x and salvages parts', division: 'utility',
    baseCost: 12500, baseIntervalMs: 300000, exponent: 1.082, unlockLevel: 30,
    autoSellPayout: 50, hoardItem: 'nails', hoardItemEmoji: '\u{1F529}', hoardIsSilo: false,
  },
};

// --- 120-Level Progression Math ---

export const WORKER_MAX_LEVEL = 120;

/** Cost to upgrade from level L to L+1 */
export function workerUpgradeCost(role: WorkerRole, currentLevel: number): number {
  if (currentLevel >= WORKER_MAX_LEVEL) return 0;
  const cfg = WORKER_REGISTRY[role];
  const linearDamp = 1 + currentLevel / 12;
  return Math.floor(cfg.baseCost * Math.pow(cfg.exponent, currentLevel - 1) * linearDamp);
}

/** Speed multiplier: asymptotically approaches 0.25× at level 120 */
export function workerSpeedMultiplier(level: number): number {
  const progressRatio = Math.max(0, Math.min(1, (WORKER_MAX_LEVEL - level) / (WORKER_MAX_LEVEL - 1)));
  return 0.25 + 0.75 * Math.pow(progressRatio, 1.15);
}

/** Overdrive bonus: additional -20% at level 120 */
export function workerOverdrive(level: number): number {
  return level >= WORKER_MAX_LEVEL ? 0.8 : 1.0;
}

/** Effective interval in ms for a worker at given level */
export function workerEffectiveInterval(role: WorkerRole, level: number): number {
  const cfg = WORKER_REGISTRY[role];
  return Math.floor(cfg.baseIntervalMs * workerSpeedMultiplier(level) * workerOverdrive(level));
}

/** Double proc chance: 0% at L1, ~60% at L120 */
export function workerDoubleProcChance(level: number): number {
  return Math.min(0.60, (level - 1) / 200);
}

/** Triple proc unlocked at level 100+ (15% chance to upgrade double→triple) */
export function workerTripleProcUnlocked(level: number): boolean {
  return level >= 100;
}

/** Gem proc unlocked at level 60+ (5% chance per cycle) */
export function workerGemProcUnlocked(level: number): boolean {
  return level >= 60;
}

/** Auto-sell bonus: +10% at level 20+ (Apprentice rank) */
export function workerAutoSellBonus(level: number): number {
  return level >= 20 ? 1.10 : 1.0;
}

/** Hopper buffer capacity: 0 below level 40, up to 5 at level 59+ */
export function workerHopperBuffer(level: number): number {
  if (level < 40) return 0;
  if (level < 59) return Math.min(5, Math.floor((level - 40) / 4) + 1);
  return 5;
}

/** District Aura: +10% speed to adjacent buildings at level 80+ */
export function workerDistrictAura(level: number): boolean {
  return level >= 80;
}

// --- Milestone Ranks ---

export interface MilestoneRank {
  minLevel: number;
  maxLevel: number;
  title: string;
  emoji: string;
  color: string;         // tailwind text color class
  borderColor: string;   // tailwind border color class
  bgColor: string;       // tailwind bg color class
}

export const MILESTONE_RANKS: MilestoneRank[] = [
  { minLevel: 1,   maxLevel: 19,  title: 'Novice',      emoji: '\u{1F9F1}', color: 'text-stone-500 dark:text-stone-400',       borderColor: 'border-stone-300 dark:border-stone-600',       bgColor: 'bg-stone-50 dark:bg-stone-900/30' },
  { minLevel: 20,  maxLevel: 39,  title: 'Apprentice',  emoji: '\u{1FA91}', color: 'text-amber-600 dark:text-amber-400',       borderColor: 'border-amber-300 dark:border-amber-700',       bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  { minLevel: 40,  maxLevel: 59,  title: 'Journeyman',  emoji: '\u{1F6E1}', color: 'text-slate-500 dark:text-slate-400',       borderColor: 'border-slate-300 dark:border-slate-600',       bgColor: 'bg-slate-50 dark:bg-slate-900/30' },
  { minLevel: 60,  maxLevel: 79,  title: 'Craftsman',   emoji: '\u2694',    color: 'text-blue-600 dark:text-blue-400',         borderColor: 'border-blue-300 dark:border-blue-700',         bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { minLevel: 80,  maxLevel: 99,  title: 'Expert',      emoji: '\u{1F3F5}', color: 'text-purple-600 dark:text-purple-400',     borderColor: 'border-purple-300 dark:border-purple-700',     bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  { minLevel: 100, maxLevel: 119, title: 'Grandmaster', emoji: '\u{1F4A0}', color: 'text-rose-600 dark:text-rose-400',         borderColor: 'border-rose-300 dark:border-rose-700',         bgColor: 'bg-rose-50 dark:bg-rose-900/20' },
  { minLevel: 120, maxLevel: 120, title: 'Mythic',      emoji: '\u{1F52E}', color: 'text-fuchsia-500 dark:text-fuchsia-300',   borderColor: 'border-fuchsia-400 dark:border-fuchsia-600',   bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-900/20' },
];

export function getMilestoneRank(level: number): MilestoneRank {
  for (const rank of MILESTONE_RANKS) {
    if (level >= rank.minLevel && level <= rank.maxLevel) return rank;
  }
  return MILESTONE_RANKS[0];
}

// --- Bulk Upgrade Engine ---

export type BulkMode = 'x1' | 'x10' | 'MAX';

export interface BulkUpgradeResult {
  levelsToBuy: number;
  totalCost: number;
}

export function calculateBulkUpgrade(role: WorkerRole, currentLevel: number, mode: BulkMode, currentCoins: number): BulkUpgradeResult {
  if (currentLevel >= WORKER_MAX_LEVEL) return { levelsToBuy: 0, totalCost: 0 };

  if (mode === 'x1') {
    const cost = workerUpgradeCost(role, currentLevel);
    return currentCoins >= cost ? { levelsToBuy: 1, totalCost: cost } : { levelsToBuy: 0, totalCost: cost };
  }

  if (mode === 'x10') {
    const maxLevels = Math.min(10, WORKER_MAX_LEVEL - currentLevel);
    let totalCost = 0;
    let affordable = 0;
    for (let i = 0; i < maxLevels; i++) {
      const cost = workerUpgradeCost(role, currentLevel + i);
      if (totalCost + cost > currentCoins) break;
      totalCost += cost;
      affordable++;
    }
    return { levelsToBuy: affordable, totalCost };
  }

  // MAX mode
  let levelsToBuy = 0;
  let totalCost = 0;
  while (currentLevel + levelsToBuy < WORKER_MAX_LEVEL) {
    const nextCost = workerUpgradeCost(role, currentLevel + levelsToBuy);
    if (totalCost + nextCost > currentCoins) break;
    totalCost += nextCost;
    levelsToBuy++;
  }
  return { levelsToBuy, totalCost };
}

/** Get the total payout for a worker in auto-sell mode (per cycle) */
export function workerAutoSellPayout(role: WorkerRole, level: number): number {
  const cfg = WORKER_REGISTRY[role];
  return Math.round(cfg.autoSellPayout * workerAutoSellBonus(level));
}

// ============================================================
// Territory Expansion — Parcels, Facilities, Freight & Auras
// ============================================================

// --- Parcel IDs ---
export type ParcelId =
  | 'parcel_core'
  | 'parcel_east_river'
  | 'parcel_west_alluvium'
  | 'parcel_south_quarry'
  | 'parcel_north_highland'
  | 'parcel_deep_orchard'
  | 'parcel_port_basin';

// --- Debris Entity (boulders, stumps, brambles on a parcel) ---
export interface DebrisEntity {
  id: string;
  type: 'boulder' | 'stump' | 'brambles';
  clearCost: number;
  clearDurationMs: number;
  clearingStartedAt: number | null;
  cleared: boolean;
}

// --- Parcel Config (static definition) ---
export interface ParcelConfig {
  id: ParcelId;
  name: string;
  emoji: string;
  levelReq: number;
  coinCost: number;
  debrisClearCost: number;
  debrisClearDurationMs: number;
  uniqueFeature: string;
  lockedCapability: string;
  position: { row: number; col: number }; // Map grid position (0-2)
  color: string;       // Tailwind accent color for borders/badges
  bgGradient: string;  // Tailwind gradient classes
}

// --- Parcel Runtime State ---
export interface ParcelState {
  id: ParcelId;
  isUnlocked: boolean;
  unlockedAt: number | null;
  debris: DebrisEntity[];
  placedBuildingId: string | null;
}

// --- Facility Footprint ---
export interface FacilityFootprint {
  id: string;
  name: string;
  emoji: string;
  tiles: { rows: number; cols: number };
  requiredZone: ParcelId | 'any_cleared';
  description: string;
}

// --- Estate Aura Tiers ---
export interface EstateAuraTier {
  parcelsClaimed: number;
  title: string;
  emoji: string;
  effect: string;
  effectDetail: {
    type: 'growth_speed' | 'order_refresh' | 'order_coin_bonus' | 'instant_mature_chance';
    value: number; // multiplier or percentage
  };
}

// --- Freight Contract ---
export interface FreightContract {
  id: string;
  title: string;
  emoji: string;
  requirements: { itemId: string; qty: number; emoji: string; name: string }[];
  coinReward: number;
  gemReward: number;
  blueprintReward?: string;
  expiresAt: number;
  acceptedAt: number | null;
  completed: boolean;
  entryDeposit: number; // 10% of total payout
}

// --- Freight Contract Template ---
export interface FreightContractTemplate {
  title: string;
  emoji: string;
  requirements: { itemId: string; qty: number; emoji: string; name: string }[];
  coinReward: number;
  gemReward: number;
  blueprintReward?: string;
  durationMs: number; // delivery window from acceptance
}

// ---- PARCEL CONFIGS ----
export const PARCEL_CONFIGS: Record<ParcelId, ParcelConfig> = {
  parcel_core: {
    id: 'parcel_core',
    name: 'Homestead Center',
    emoji: '\u{1F3E1}',
    levelReq: 1,
    coinCost: 0,
    debrisClearCost: 0,
    debrisClearDurationMs: 0,
    uniqueFeature: 'Standard loam soil',
    lockedCapability: 'Starter 6 Crop Plots, Small Coop, Feed Mill',
    position: { row: 1, col: 1 },
    color: 'text-stone-500 dark:text-stone-400',
    bgGradient: 'from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900',
  },
  parcel_east_river: {
    id: 'parcel_east_river',
    name: 'Riverfront Estuary',
    emoji: '\u{1F4A7}',
    levelReq: 12,
    coinCost: 45000,
    debrisClearCost: 5000,
    debrisClearDurationMs: 5 * 60 * 1000,
    uniqueFeature: 'Flowing river bank',
    lockedCapability: 'Waterwheel, Dock Fishery, Freshwater Trout',
    position: { row: 1, col: 2 },
    color: 'text-cyan-600 dark:text-cyan-400',
    bgGradient: 'from-cyan-100 to-sky-100 dark:from-cyan-900 dark:to-sky-900',
  },
  parcel_west_alluvium: {
    id: 'parcel_west_alluvium',
    name: 'Fertile Alluvium',
    emoji: '\u{1F33E}',
    levelReq: 18,
    coinCost: 110000,
    debrisClearCost: 15000,
    debrisClearDurationMs: 12 * 60 * 1000,
    uniqueFeature: 'Black peat soil (+25% crop speed)',
    lockedCapability: '2x Growth Speed for root crops (Carrots, Pumpkins)',
    position: { row: 1, col: 0 },
    color: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-100 to-green-100 dark:from-emerald-900 dark:to-green-900',
  },
  parcel_south_quarry: {
    id: 'parcel_south_quarry',
    name: 'Quarry Ridge',
    emoji: '\u26CF',
    levelReq: 26,
    coinCost: 280000,
    debrisClearCost: 40000,
    debrisClearDurationMs: 25 * 60 * 1000,
    uniqueFeature: 'Exposed rock veins',
    lockedCapability: 'Prospector Mine Shaft, Iron & Gold Ore harvesting',
    position: { row: 2, col: 1 },
    color: 'text-slate-600 dark:text-slate-400',
    bgGradient: 'from-slate-100 to-gray-200 dark:from-slate-800 dark:to-gray-900',
  },
  parcel_north_highland: {
    id: 'parcel_north_highland',
    name: 'Highland Meadow',
    emoji: '\u{1F343}',
    levelReq: 34,
    coinCost: 650000,
    debrisClearCost: 90000,
    debrisClearDurationMs: 45 * 60 * 1000,
    uniqueFeature: 'High-altitude chill',
    lockedCapability: 'Secondary Pasture, Highland Yaks, Cloud Sheep',
    position: { row: 0, col: 1 },
    color: 'text-teal-600 dark:text-teal-400',
    bgGradient: 'from-teal-100 to-cyan-100 dark:from-teal-900 dark:to-cyan-900',
  },
  parcel_deep_orchard: {
    id: 'parcel_deep_orchard',
    name: 'Sunken Grove',
    emoji: '\u{1F34E}',
    levelReq: 44,
    coinCost: 1400000,
    debrisClearCost: 200000,
    debrisClearDurationMs: 90 * 60 * 1000,
    uniqueFeature: 'Ancient deep loam',
    lockedCapability: 'Fruit Orchard (Apples, Cherries), 4x Apiaries',
    position: { row: 0, col: 0 },
    color: 'text-rose-600 dark:text-rose-400',
    bgGradient: 'from-rose-100 to-pink-100 dark:from-rose-900 dark:to-pink-900',
  },
  parcel_port_basin: {
    id: 'parcel_port_basin',
    name: 'Shipping Basin',
    emoji: '\u{1F6A2}',
    levelReq: 54,
    coinCost: 3200000,
    debrisClearCost: 500000,
    debrisClearDurationMs: 180 * 60 * 1000,
    uniqueFeature: 'Coastal deep water',
    lockedCapability: 'Grand Cargo Port, Freight Export Terminal',
    position: { row: 2, col: 2 },
    color: 'text-blue-600 dark:text-blue-400',
    bgGradient: 'from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900',
  },
};

export const PARCEL_ORDER: ParcelId[] = [
  'parcel_core',
  'parcel_east_river',
  'parcel_west_alluvium',
  'parcel_south_quarry',
  'parcel_north_highland',
  'parcel_deep_orchard',
  'parcel_port_basin',
];

// ---- FACILITY FOOTPRINTS ----
export const FACILITY_FOOTPRINTS: FacilityFootprint[] = [
  { id: 'bakery_hearth', name: 'Bakery & Hearth', emoji: '\u{1F3ED}', tiles: { rows: 2, cols: 2 }, requiredZone: 'any_cleared', description: 'Artisan bread, fruit pies, tarts' },
  { id: 'guild_loom', name: 'Guild Loom', emoji: '\u{1F9F5}', tiles: { rows: 3, cols: 3 }, requiredZone: 'parcel_north_highland', description: 'Sweaters, fine fabrics, sails' },
  { id: 'artisan_cheese_press', name: 'Artisan Cheese Press', emoji: '\u{1F9C0}', tiles: { rows: 2, cols: 3 }, requiredZone: 'any_cleared', description: 'Aged cheddar, starlight cheese' },
  { id: 'industrial_waterwheel', name: 'Industrial Waterwheel', emoji: '\u{1F4A7}', tiles: { rows: 3, cols: 4 }, requiredZone: 'parcel_east_river', description: 'Auto-irrigates 8 adjacent plots' },
  { id: 'mine_extraction_rig', name: 'Mine Extraction Rig', emoji: '\u26CF', tiles: { rows: 4, cols: 4 }, requiredZone: 'parcel_south_quarry', description: 'High-yield ore output, Gem extraction' },
  { id: 'cargo_freight_crane', name: 'Cargo Freight Crane', emoji: '\u{1F6A2}', tiles: { rows: 4, cols: 5 }, requiredZone: 'parcel_port_basin', description: 'Global industrial delivery board access' },
];

// ---- ESTATE AURA TIERS ----
export const ESTATE_AURAS: EstateAuraTier[] = [
  { parcelsClaimed: 1, title: 'Homestead',          emoji: '\u{1F3E1}', effect: 'Standard operation.',                                                  effectDetail: { type: 'growth_speed',            value: 1.0  } },
  { parcelsClaimed: 2, title: 'River Settlement',   emoji: '\u{1F4A7}', effect: 'Irrigation Boost: -10% growth timer on all farm plots.',              effectDetail: { type: 'growth_speed',            value: 0.9  } },
  { parcelsClaimed: 4, title: 'County Domain',       emoji: '\u{1F3DB}', effect: 'Logistics Mastery: Order Board refresh timers reduced by 50%.',      effectDetail: { type: 'order_refresh',           value: 0.5  } },
  { parcelsClaimed: 6, title: 'Grand Agricultural Estate', emoji: '\u{1F3EF}', effect: 'Bulk Freight Margin: +15% coin yield on all completed orders.', effectDetail: { type: 'order_coin_bonus',        value: 1.15 } },
  { parcelsClaimed: 7, title: 'Regional Sovereign',  emoji: '\u{1F451}', effect: 'Overdrive Field: +10% chance for instant crop maturity on harvest.', effectDetail: { type: 'instant_mature_chance',    value: 0.10 } },
];

export function getEstateAura(parcelsClaimed: number): EstateAuraTier {
  let result = ESTATE_AURAS[0];
  for (const aura of ESTATE_AURAS) {
    if (parcelsClaimed >= aura.parcelsClaimed) result = aura;
  }
  return result;
}

// ---- FREIGHT CONTRACT TEMPLATES ----
export const FREIGHT_CONTRACT_TEMPLATES: FreightContractTemplate[] = [
  {
    title: 'The Royal Naval Provision',
    emoji: '\u2693',
    requirements: [
      { itemId: 'bread',   qty: 40, emoji: '\u{1F35E}', name: 'Artisan Bread' },
      { itemId: 'cheese',  qty: 25, emoji: '\u{1F9C0}', name: 'Aged Cheese' },
      { itemId: 'fish',    qty: 30, emoji: '\u{1F41F}', name: 'Smoked Trout' },
      { itemId: 'sweater', qty: 20, emoji: '\u{1F9E5}', name: 'Fine Wool Sweater' },
    ],
    coinReward: 120000,
    gemReward: 45,
    blueprintReward: 'gilded_gear',
    durationMs: 8 * 60 * 60 * 1000, // 8 hours
  },
  {
    title: 'Eastern Silk Road Caravan',
    emoji: '\u{1F42D}',
    requirements: [
      { itemId: 'fabric', qty: 50, emoji: '\u{1F9F5}', name: 'Fine Fabric' },
      { itemId: 'silk',   qty: 30, emoji: '\u{1F33F}', name: 'Raw Silk' },
      { itemId: 'yarn',   qty: 60, emoji: '\u{1F9F6}', name: 'Yarn' },
      { itemId: 'honey',  qty: 25, emoji: '\u{1F36F}', name: 'Golden Honey' },
    ],
    coinReward: 95000,
    gemReward: 35,
    durationMs: 8 * 60 * 60 * 1000,
  },
  {
    title: 'Miner\'s Feast Delivery',
    emoji: '\u26CF',
    requirements: [
      { itemId: 'bread',  qty: 60, emoji: '\u{1F35E}', name: 'Rye Bread' },
      { itemId: 'cheese', qty: 40, emoji: '\u{1F9C0}', name: 'Cheddar Wheel' },
      { itemId: 'pie',    qty: 30, emoji: '\u{1F967}', name: 'Hearty Pie' },
    ],
    coinReward: 80000,
    gemReward: 25,
    durationMs: 8 * 60 * 60 * 1000,
  },
  {
    title: 'Luxury Textile Shipment',
    emoji: '\u{1F457}',
    requirements: [
      { itemId: 'sweater',         qty: 35, emoji: '\u{1F9E5}', name: 'Cashmere Sweater' },
      { itemId: 'quilted_blanket', qty: 20, emoji: '\u{1F6CB}', name: 'Quilted Blanket' },
      { itemId: 'fabric',          qty: 45, emoji: '\u{1F9F5}', name: 'Silk Fabric' },
    ],
    coinReward: 150000,
    gemReward: 50,
    blueprintReward: 'ornate_frame',
    durationMs: 8 * 60 * 60 * 1000,
  },
  {
    title: 'Highland Provision Run',
    emoji: '\u{1F343}',
    requirements: [
      { itemId: 'milk',    qty: 50, emoji: '\u{1F95B}', name: 'Fresh Milk' },
      { itemId: 'wool',    qty: 40, emoji: '\u{1F412}', name: 'Highland Wool' },
      { itemId: 'cheese',  qty: 30, emoji: '\u{1F9C0}', name: 'Highland Cheese' },
      { itemId: 'bread',   qty: 50, emoji: '\u{1F35E}', name: 'Stone Bread' },
    ],
    coinReward: 110000,
    gemReward: 40,
    durationMs: 8 * 60 * 60 * 1000,
  },
];

/** Generate random debris entities for a parcel */
export function generateParcelDebris(parcelId: ParcelId): DebrisEntity[] {
  if (parcelId === 'parcel_core') return []; // Core has no debris
  const config = PARCEL_CONFIGS[parcelId];
  const count = 2 + Math.floor(Math.random() * 3); // 2-4 debris
  const types: DebrisEntity['type'][] = ['boulder', 'stump', 'brambles'];
  const debris: DebrisEntity[] = [];
  for (let i = 0; i < count; i++) {
    const type = types[i % 3];
    // Cost/duration scale down from parcel total by count
    const perDebrisCost = Math.round(config.debrisClearCost / count);
    const perDebrisDuration = Math.round(config.debrisClearDurationMs / count);
    debris.push({
      id: `debris_${parcelId}_${i}`,
      type,
      clearCost: perDebrisCost,
      clearDurationMs: perDebrisDuration,
      clearingStartedAt: null,
      cleared: false,
    });
  }
  return debris;
}

/** Generate a freight contract from templates */
export function generateFreightContract(): FreightContract {
  const template = FREIGHT_CONTRACT_TEMPLATES[Math.floor(Math.random() * FREIGHT_CONTRACT_TEMPLATES.length)];
  const id = `freight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const entryDeposit = Math.round((template.coinReward + template.gemReward * 100) * 0.1); // 10% of total value
  return {
    id,
    title: template.title,
    emoji: template.emoji,
    requirements: [...template.requirements],
    coinReward: template.coinReward,
    gemReward: template.gemReward,
    blueprintReward: template.blueprintReward,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Available for 24h before acceptance
    acceptedAt: null,
    completed: false,
    entryDeposit,
  };
}
