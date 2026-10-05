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

// --- Crops ---
export type CropId = 'wheat' | 'corn' | 'carrot' | 'strawberry' | 'soybean' | 'pumpkin';

export interface CropDef {
  id: CropId;
  name: string;
  emoji: string;
  growTimeSec: number;
  yieldCount: number;
  seedCost: number;
}

export const CROPS: Record<CropId, CropDef> = {
  wheat:       { id: 'wheat',       name: 'Wheat',       emoji: '🌾', growTimeSec: 30,  yieldCount: 2, seedCost: 0 },
  corn:        { id: 'corn',        name: 'Corn',        emoji: '🌽', growTimeSec: 60,  yieldCount: 2, seedCost: 0 },
  carrot:      { id: 'carrot',      name: 'Carrot',      emoji: '🥕', growTimeSec: 90,  yieldCount: 3, seedCost: 5 },
  strawberry:  { id: 'strawberry',  name: 'Strawberry',  emoji: '🍓', growTimeSec: 120, yieldCount: 3, seedCost: 10 },
  soybean:     { id: 'soybean',     name: 'Soybean',     emoji: '🫛', growTimeSec: 180, yieldCount: 4, seedCost: 15 },
  pumpkin:     { id: 'pumpkin',     name: 'Pumpkin',     emoji: '🎃', growTimeSec: 300, yieldCount: 5, seedCost: 25 },
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
  chicken: { species: 'chicken', name: 'Chicken', emoji: '🐔', habitat: 'Chicken Coop', habitatEmoji: '🏠', capacity: 6, feedPerCycle: 1, product: 'egg', productEmoji: '🥚', productYield: 1, productionTimeSec: 45 },
  cow:     { species: 'cow',     name: 'Cow',     emoji: '🐄', habitat: 'Cow Barn',     habitatEmoji: '🛖', capacity: 4, feedPerCycle: 2, product: 'milk', productEmoji: '🥛', productYield: 1, productionTimeSec: 90 },
  sheep:   { species: 'sheep',   name: 'Sheep',   emoji: '🐑', habitat: 'Sheep Pasture', habitatEmoji: '🟩', capacity: 4, feedPerCycle: 2, product: 'wool', productEmoji: '🧶', productYield: 1, productionTimeSec: 120 },
  pig:     { species: 'pig',     name: 'Pig',     emoji: '🐷', habitat: 'Pig Pen',     habitatEmoji: '🏠', capacity: 4, feedPerCycle: 3, product: 'truffle', productEmoji: '🍄', productYield: 1, productionTimeSec: 180 },
};

// --- Products ---
export type ProductId = 'feed' | 'egg' | 'milk' | 'wool' | 'truffle' | 'fish' | 'bread' | 'cheese' | 'pie' | 'sweater' | 'truffle_oil';

export interface ProductDef {
  id: ProductId;
  name: string;
  emoji: string;
  category: 'raw' | 'animal' | 'manufactured';
  sellPrice: number;
}

export const PRODUCTS: Record<ProductId, ProductDef> = {
  feed:        { id: 'feed',        name: 'Animal Feed',  emoji: '🫙', category: 'raw',          sellPrice: 2 },
  egg:         { id: 'egg',         name: 'Egg',          emoji: '🥚', category: 'animal',       sellPrice: 5 },
  milk:        { id: 'milk',        name: 'Milk',         emoji: '🥛', category: 'animal',       sellPrice: 8 },
  wool:        { id: 'wool',        name: 'Wool',         emoji: '🧶', category: 'animal',       sellPrice: 10 },
  truffle:     { id: 'truffle',     name: 'Truffle',      emoji: '🍄', category: 'animal',       sellPrice: 15 },
  bread:       { id: 'bread',       name: 'Bread',        emoji: '🍞', category: 'manufactured', sellPrice: 20 },
  cheese:      { id: 'cheese',      name: 'Cheese',       emoji: '🧀', category: 'manufactured', sellPrice: 25 },
  pie:         { id: 'pie',         name: 'Pie',          emoji: '🥧', category: 'manufactured', sellPrice: 35 },
  sweater:     { id: 'sweater',     name: 'Sweater',      emoji: '🧥', category: 'manufactured', sellPrice: 40 },
  fish:        { id: 'fish',        name: 'Fish',         emoji: '🐟', category: 'animal',       sellPrice: 12 },
  truffle_oil: { id: 'truffle_oil', name: 'Truffle Oil',  emoji: '🫒', category: 'manufactured', sellPrice: 50 },
};

// --- Production Buildings ---
export type BuildingId = 'feed_mill' | 'bakery' | 'dairy' | 'loom' | 'press';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  emoji: string;
  recipes: RecipeDef[];
  queueSlots: number;
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
    id: 'feed_mill', name: 'Feed Mill', emoji: '⚙️', queueSlots: 2,
    recipes: [
      { id: 'make_feed', name: 'Make Feed', emoji: '🫙', inputs: [{ productId: 'wheat', qty: 2 }], output: { productId: 'feed', qty: 3 }, timeSec: 15 },
    ],
  },
  bakery: {
    id: 'bakery', name: 'Bakery', emoji: '🏭', queueSlots: 2,
    recipes: [
      { id: 'make_bread', name: 'Bake Bread', emoji: '🍞', inputs: [{ productId: 'wheat', qty: 3 }, { productId: 'egg', qty: 1 }], output: { productId: 'bread', qty: 1 }, timeSec: 30 },
      { id: 'make_pie', name: 'Bake Pie', emoji: '🥧', inputs: [{ productId: 'bread', qty: 1 }, { productId: 'strawberry', qty: 2 }], output: { productId: 'pie', qty: 1 }, timeSec: 60 },
    ],
  },
  dairy: {
    id: 'dairy', name: 'Dairy', emoji: '🧀', queueSlots: 2,
    recipes: [
      { id: 'make_cheese', name: 'Make Cheese', emoji: '🧀', inputs: [{ productId: 'milk', qty: 2 }], output: { productId: 'cheese', qty: 1 }, timeSec: 45 },
    ],
  },
  loom: {
    id: 'loom', name: 'Loom', emoji: '🧵', queueSlots: 2,
    recipes: [
      { id: 'make_sweater', name: 'Weave Sweater', emoji: '🧥', inputs: [{ productId: 'wool', qty: 3 }], output: { productId: 'sweater', qty: 1 }, timeSec: 60 },
    ],
  },
  press: {
    id: 'press', name: 'Press', emoji: '🫒', queueSlots: 2,
    recipes: [
      { id: 'make_truffle_oil', name: 'Press Truffle Oil', emoji: '🫒', inputs: [{ productId: 'truffle', qty: 2 }], output: { productId: 'truffle_oil', qty: 1 }, timeSec: 90 },
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
  lumberjack: { role: 'lumberjack', name: 'Lumberjack', emoji: '🪓', description: 'Clears wood hazards; boosts lumber mill yield.', perk: '+15% production speed' },
  fisherman:  { role: 'fisherman',  name: 'Fisherman',  emoji: '🎣', description: 'Passive fish gathering at riverside docks.', perk: 'Free fish every 5 min' },
  farmer:     { role: 'farmer',     name: 'Farmer',     emoji: '👨‍🌾', description: 'Decreases field growth timers on adjacent plots.', perk: '-20% crop grow time' },
  artisan:    { role: 'artisan',    name: 'Artisan',    emoji: '🧑‍🎨', description: 'Speeds up production processing inside factories.', perk: '-25% production time' },
};

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
  { requested: [{ itemId: 'wheat', qty: 5, emoji: '🌾', name: 'Wheat' }], coinReward: 15, xpReward: 10 },
  { requested: [{ itemId: 'corn', qty: 4, emoji: '🌽', name: 'Corn' }], coinReward: 18, xpReward: 12 },
  { requested: [{ itemId: 'egg', qty: 3, emoji: '🥚', name: 'Egg' }], coinReward: 25, xpReward: 15 },
  { requested: [{ itemId: 'milk', qty: 2, emoji: '🥛', name: 'Milk' }], coinReward: 30, xpReward: 18 },
  { requested: [{ itemId: 'bread', qty: 2, emoji: '🍞', name: 'Bread' }], coinReward: 55, xpReward: 30 },
  { requested: [{ itemId: 'cheese', qty: 1, emoji: '🧀', name: 'Cheese' }], coinReward: 40, xpReward: 25 },
  { requested: [{ itemId: 'wool', qty: 3, emoji: '🧶', name: 'Wool' }], coinReward: 45, xpReward: 22 },
  { requested: [{ itemId: 'feed', qty: 5, emoji: '🫙', name: 'Animal Feed' }], coinReward: 20, xpReward: 12 },
  { requested: [{ itemId: 'carrot', qty: 4, emoji: '🥕', name: 'Carrot' }], coinReward: 28, xpReward: 16 },
  { requested: [{ itemId: 'strawberry', qty: 3, emoji: '🍓', name: 'Strawberry' }], coinReward: 35, xpReward: 20 },
  { requested: [{ itemId: 'pie', qty: 1, emoji: '🥧', name: 'Pie' }], coinReward: 60, xpReward: 35 },
  { requested: [{ itemId: 'sweater', qty: 1, emoji: '🧥', name: 'Sweater' }], coinReward: 70, xpReward: 40 },
  // Fish-related orders
  { requested: [{ itemId: 'fish', qty: 2, emoji: '🐟', name: 'Fish' }], coinReward: 30, xpReward: 18 },
  { requested: [{ itemId: 'fish', qty: 5, emoji: '🐟', name: 'Fish' }], coinReward: 75, xpReward: 40 },
  { requested: [{ itemId: 'fish', qty: 3, emoji: '🐟', name: 'Fish' }, { itemId: 'wheat', qty: 3, emoji: '🌾', name: 'Wheat' }], coinReward: 55, xpReward: 30 },
];
