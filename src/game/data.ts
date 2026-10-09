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
  cow:     { species: 'cow',     name: 'Cow',     emoji: '\u{1F404}', habitat: 'Cow Barn',     habitatEmoji: '\u{1F316}', capacity: 4, feedPerCycle: 2, product: 'milk', productEmoji: '\u{1F95B}', productYield: 1, productionTimeSec: 90 },
  sheep:   { species: 'sheep',   name: 'Sheep',   emoji: '\u{1F411}', habitat: 'Sheep Pasture', habitatEmoji: '\u{1F7E9}', capacity: 4, feedPerCycle: 2, product: 'wool', productEmoji: '\u{1F9F6}', productYield: 1, productionTimeSec: 120 },
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
export type ProductId = 'feed' | 'egg' | 'milk' | 'wool' | 'truffle' | 'fish' | 'bread' | 'cheese' | 'pie' | 'sweater' | 'truffle_oil' | 'yarn' | 'quilted_blanket' | 'savory_fish_pie' | 'crab_bisque' | 'honey_comb' | 'honey' | 'wild_berries' | 'gold_nugget' | 'cotton' | 'silk';

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
    ],
  },
  bakery: {
    id: 'bakery', name: 'Bakery', emoji: '\u{1F3ED}', queueSlots: 20,
    recipes: [
      { id: 'make_bread', name: 'Bake Bread', emoji: '\u{1F35E}', inputs: [{ productId: 'wheat', qty: 3 }, { productId: 'egg', qty: 1 }], output: { productId: 'bread', qty: 1 }, timeSec: 60 },
      { id: 'make_pie', name: 'Bake Pie', emoji: '\u{1F967}', inputs: [{ productId: 'bread', qty: 1 }, { productId: 'strawberry', qty: 2 }], output: { productId: 'pie', qty: 1 }, timeSec: 60 },
      { id: 'make_savory_fish_pie', name: 'Savory Fish Pie', emoji: '\u{1F967}', inputs: [{ productId: 'fish', qty: 2 }, { productId: 'wheat', qty: 2 }, { productId: 'egg', qty: 1 }], output: { productId: 'savory_fish_pie', qty: 1 }, timeSec: 75 },
      { id: 'make_crab_bisque', name: 'Crab Bisque', emoji: '\u{1F352}', inputs: [{ productId: 'fish', qty: 3 }, { productId: 'milk', qty: 1 }], output: { productId: 'crab_bisque', qty: 1 }, timeSec: 90 },
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

// --- Livestock Market ---
export const ANIMAL_BUY_PRICES: Record<AnimalSpecies, number> = { chicken: 50, cow: 150, sheep: 200, pig: 300 };

export const TIER_MULTIPLIER: Record<Tier, number> = {
  common: 1.0,
  uncommon: 1.5,
  rare: 2.5,
  legendary: 5.0,
};

export function livestockSellPrice(species: AnimalSpecies, tier: Tier): number {
  return Math.floor(ANIMAL_BUY_PRICES[species] * TIER_MULTIPLIER[tier] * 0.7);
}

export function livestockBuyPrice(species: AnimalSpecies, tier: Tier): number {
  return Math.floor(ANIMAL_BUY_PRICES[species] * TIER_MULTIPLIER[tier]);
}
