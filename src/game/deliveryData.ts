// ============================================================
// Project Meadowlands — Logistics & Delivery Engine Data Registry
// Phase 1: Economic Rebalancing, Contract Schema, Client Personas
// ============================================================

import { CROPS, PRODUCTS, type CropId } from './data';

export type OrderType = 'standard' | 'rush' | 'futures' | 'town_project';

export interface ClientProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  reputationLevel: number; // 1 to 5
  reputationXp: number;
  unlockedPerkDescription: string;
}

export interface ClientPerkDef {
  level: number;
  perkName: string;
  description: string;
}

export interface ClientDefinition {
  id: string;
  name: string;
  title: string;
  avatar: string;
  quote: string;
  themeColor: string;
  preferredItems: string[];
  perks: ClientPerkDef[];
}

export interface DeliveryOrder {
  id: string;
  clientId: string;
  type: OrderType;
  requiredItems: {
    itemId: string;
    name: string;
    quantity: number;
    icon: string;
  }[];
  rewards: {
    coins: number;
    xp: number;
    gems?: number;
    reputationPoints: number;
    specialItem?: string; // e.g., 'Expansion Deed', 'Nail', 'Plank'
  };
  durationRemaining?: number; // In seconds (for rush/futures)
  totalDuration?: number;
  penaltyCoins?: number;
  routeOptions?: {
    safeDurationSeconds: number;
    wildDurationSeconds: number;
    wildRiskPercentage: number; // e.g., 25% hazard risk
  };
  // Backwards-compatible / runtime tracking fields
  expiresAt?: number | null;
  trashedAt?: number | null;
  requested?: { itemId: string; qty: number; emoji: string; name: string }[];
  coinReward?: number;
  xpReward?: number;
  isRushOrder?: boolean;
  rushExpiresAt?: number | null;
  rushDurationSec?: number;
  breachFee?: number;
  bonusGems?: number;
  relicFragmentReward?: number;
}

// --- 5 Recurring Client Personas ---
export const CLIENT_DEFINITIONS: Record<string, ClientDefinition> = {
  mayor_barnaby: {
    id: 'mayor_barnaby',
    name: 'Mayor Barnaby',
    title: 'Town Mayor & Magistrate',
    avatar: '🎩',
    quote: 'A well-fed township is a peaceful township. Meadowlands depends on your enterprise!',
    themeColor: 'from-amber-600 to-yellow-500',
    preferredItems: ['wheat', 'corn', 'bread', 'cheese', 'pie', 'fabric', 'wool', 'carrot', 'sweater'],
    perks: [
      { level: 1, perkName: 'Town Hall Trust', description: 'Civic recognition across Meadowlands.' },
      { level: 2, perkName: 'Commercial Subsidy', description: '+5% Order Board coin payouts farm-wide.' },
      { level: 3, perkName: 'Municipal Well Grant', description: 'Well pumping yields +2 Water and refuels 20% faster.' },
      { level: 4, perkName: 'Granary Expansion', description: '+25 storage capacity to both Silo and Barn.' },
      { level: 5, perkName: 'Key to the City', description: '+15% all delivery coins and +1 free Daily Gem.' },
    ],
  },
  chef_antoine: {
    id: 'chef_antoine',
    name: 'Chef Antoine',
    title: 'Grand Hotel Head Chef',
    avatar: '👨‍🍳',
    quote: 'Only the freshest butter, cream, and berries belong in my grand banquet kitchen.',
    themeColor: 'from-orange-600 to-rose-500',
    preferredItems: ['egg', 'milk', 'bread', 'cheese', 'pie', 'strawberry', 'carrot', 'savory_fish_pie', 'honey'],
    perks: [
      { level: 1, perkName: 'Kitchen Whitelist', description: 'VIP kitchen demand notifications.' },
      { level: 2, perkName: 'Artisan Agility', description: 'Bakery, Dairy & Mill crafting speeds boosted by +15%.' },
      { level: 3, perkName: 'Sous-Chef Thrift', description: '15% chance to not consume ingredients when baking recipes.' },
      { level: 4, perkName: 'Michelin Payouts', description: '+20% bonus coins on all dairy, pastry & meal deliveries.' },
      { level: 5, perkName: 'Grand Gastronome', description: 'Bakery & Dairy operate at +25% speed; grant +2 Gems weekly.' },
    ],
  },
  captain_sterling: {
    id: 'captain_sterling',
    name: 'Captain Sterling',
    title: 'High-Seas Fleet Quartermaster',
    avatar: '⚓',
    quote: 'The ocean yields gold to the brave, but a ship cannot sail without provisions in her hold.',
    themeColor: 'from-sky-700 to-cyan-500',
    preferredItems: ['fish', 'wheat', 'corn', 'bread', 'yarn', 'cotton', 'crab_bisque', 'savory_fish_pie'],
    perks: [
      { level: 1, perkName: 'Harbor Pass', description: 'Recognized at coastal estuaries and deep docks.' },
      { level: 2, perkName: 'Swift Current', description: 'Fishery fishing bite cooldowns reduced by 30%.' },
      { level: 3, perkName: 'Fair Winds', description: 'Wild shortcut hazard failure chance reduced by 12%.' },
      { level: 4, perkName: 'Smuggler Accord', description: 'Wilderness Outpost dispatch fees reduced by 20%.' },
      { level: 5, perkName: 'Naval Charter', description: 'Deliveries have a 25% chance to drop bonus Expansion Deeds or Nails.' },
    ],
  },
  lady_guinevere: {
    id: 'lady_guinevere',
    name: 'Lady Guinevere',
    title: 'Highborn Aristocrat & Weaver',
    avatar: '👒',
    quote: 'Elegance requires the softest fleeces and immaculate tailoring. Spare no standard of luxury.',
    themeColor: 'from-purple-700 to-fuchsia-500',
    preferredItems: ['wool', 'cotton', 'yarn', 'sweater', 'quilted_blanket', 'silk', 'honey_comb'],
    perks: [
      { level: 1, perkName: 'Aristocratic Court', description: 'High-society trade prestige.' },
      { level: 2, perkName: 'Silken Loom', description: 'Loom, Textiles, and Tailor Shop speeds boosted by +20%.' },
      { level: 3, perkName: 'Golden Shears', description: 'Pastoral animals produce +1 bonus yield 20% of the time.' },
      { level: 4, perkName: 'Couture Premiums', description: '+25% coins on luxury textile, wool, and garment orders.' },
      { level: 5, perkName: 'Royal Benefactor', description: 'Livestock consume 15% less feed; permanent +10% farm XP boost.' },
    ],
  },
  old_man_jed: {
    id: 'old_man_jed',
    name: 'Old Man Jed',
    title: 'Frontier Outpost Veteran',
    avatar: '⛏️',
    quote: 'The woods and mines hold great wealth if ye know how to listen. Keep yer boots dry and axe sharp.',
    themeColor: 'from-stone-700 to-amber-700',
    preferredItems: ['carrot', 'corn', 'truffle', 'wild_berries', 'honey_comb', 'gold_nugget', 'truffle_oil'],
    perks: [
      { level: 1, perkName: 'Frontier Handshake', description: 'Recognized across mountain and ridge outposts.' },
      { level: 2, perkName: 'Vein Striker', description: 'Prospector and quarry nodes yield +1 extra ore/gold.' },
      { level: 3, perkName: 'Trailblazer Route', description: 'Wild shortcut hazard damage halved; travel delays eliminated.' },
      { level: 4, perkName: 'Deep Forage', description: '+20% higher chance of discovering rare wild herbs and truffles.' },
      { level: 5, perkName: 'Mountain Sovereign', description: 'All territory parcel expansion coin costs reduced by 20%.' },
    ],
  },
};

export const REPUTATION_THRESHOLDS = [0, 100, 250, 500, 1000]; // Levels 1 through 5

export function getReputationInfo(xp: number, clientDef: ClientDefinition) {
  let level = 1;
  for (let i = 0; i < REPUTATION_THRESHOLDS.length; i++) {
    if (xp >= REPUTATION_THRESHOLDS[i]) {
      level = i + 1;
    }
  }
  level = Math.min(5, Math.max(1, level));
  const isMaxLevel = level >= 5;
  const currentThreshold = REPUTATION_THRESHOLDS[level - 1];
  const nextThreshold = isMaxLevel ? REPUTATION_THRESHOLDS[4] : REPUTATION_THRESHOLDS[level];
  const currentLevelXp = xp - currentThreshold;
  const neededForNext = nextThreshold - currentThreshold;
  const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.floor((currentLevelXp / neededForNext) * 100));

  const currentPerk = clientDef.perks.find(p => p.level === level) || clientDef.perks[0];
  const nextPerk = !isMaxLevel ? clientDef.perks.find(p => p.level === level + 1) : null;

  return {
    level,
    xp,
    currentLevelXp,
    neededForNext,
    progressPercent,
    currentPerk,
    nextPerk,
    isMaxLevel,
  };
}

// --- Item Base Value Calculator ---
export function getItemBaseValue(itemId: string): number {
  if (itemId in CROPS) {
    const cropDef = CROPS[itemId as CropId];
    return Math.max(1, Math.floor(cropDef.seedCost / 2) + 1);
  }
  const product = PRODUCTS[itemId as keyof typeof PRODUCTS];
  if (product && product.sellPrice > 0) {
    return product.sellPrice;
  }
  const extraValues: Record<string, number> = {
    cotton: 6,
    honey_comb: 12,
    wild_berries: 8,
    gold_nugget: 50,
    fish: 15,
    feed: 4,
  };
  return extraValues[itemId] || 8;
}

export function getItemMeta(itemId: string): { name: string; icon: string; baseValue: number } {
  if (itemId in CROPS) {
    const c = CROPS[itemId as CropId];
    return { name: c.name, icon: c.emoji, baseValue: getItemBaseValue(itemId) };
  }
  if (itemId in PRODUCTS) {
    const p = PRODUCTS[itemId as keyof typeof PRODUCTS];
    return { name: p.name, icon: p.emoji, baseValue: getItemBaseValue(itemId) };
  }
  const extras: Record<string, { name: string; icon: string }> = {
    cotton: { name: 'Cotton', icon: '🌿' },
    honey_comb: { name: 'Honey Comb', icon: '🍯' },
    wild_berries: { name: 'Wild Berries', icon: '🍇' },
    gold_nugget: { name: 'Gold Nugget', icon: '⭐' },
    fish: { name: 'Fish', icon: '🐟' },
    feed: { name: 'Animal Feed', icon: '🥣' },
  };
  const extra = extras[itemId] || { name: itemId, icon: '📦' };
  return { ...extra, baseValue: getItemBaseValue(itemId) };
}

// --- Item Unlock Level Registry ---
export const ITEM_UNLOCK_LEVELS: Record<string, number> = {
  // Level 1: Starter Crops, Animal Feed, Starter Chickens (Egg), Starter Pond (Fish)
  wheat: 1,
  feed: 1,
  egg: 1,
  fish: 1,

  // Level 2: Corn, Cows (Milk), Bakery (Bread)
  corn: 2,
  milk: 2,
  bread: 2,

  // Level 3: Carrots
  carrot: 3,

  // Level 4: Strawberries, Sheep (Wool), Dairy (Cheese), Bakery (Pie)
  strawberry: 4,
  wool: 4,
  cheese: 4,
  pie: 4,

  // Level 5: Soybeans, Loom (Yarn, Sweater), Bakery (Savory Fish Pie)
  soybean: 5,
  yarn: 5,
  sweater: 5,
  savory_fish_pie: 5,

  // Level 6: Pigs (Truffle), Beehive (Honey Comb), Press (Honey), Forager (Wild Berries)
  truffle: 6,
  honey_comb: 6,
  honey: 6,
  wild_berries: 6,

  // Level 7: Pumpkins, Bakery (Crab Bisque)
  pumpkin: 7,
  crab_bisque: 7,

  // Level 8: Cotton, Press (Truffle Oil), Prospector (Gold Nugget)
  cotton: 8,
  truffle_oil: 8,
  gold_nugget: 8,

  // Level 10: High-End Luxury Goods (Silk, Quilted Blanket, Fabric)
  silk: 10,
  quilted_blanket: 10,
  fabric: 10,
};

// --- Client Themed Progression Pools by Unlock Level ---
export const CLIENT_LEVEL_POOLS: Record<string, { itemId: string; minLevel: number }[]> = {
  mayor_barnaby: [
    { itemId: 'wheat', minLevel: 1 },
    { itemId: 'feed', minLevel: 1 },
    { itemId: 'corn', minLevel: 2 },
    { itemId: 'bread', minLevel: 2 },
    { itemId: 'carrot', minLevel: 3 },
    { itemId: 'cheese', minLevel: 4 },
    { itemId: 'pie', minLevel: 4 },
    { itemId: 'wool', minLevel: 4 },
    { itemId: 'sweater', minLevel: 5 },
    { itemId: 'fabric', minLevel: 10 },
  ],
  chef_antoine: [
    { itemId: 'egg', minLevel: 1 },
    { itemId: 'wheat', minLevel: 1 },
    { itemId: 'milk', minLevel: 2 },
    { itemId: 'bread', minLevel: 2 },
    { itemId: 'carrot', minLevel: 3 },
    { itemId: 'strawberry', minLevel: 4 },
    { itemId: 'cheese', minLevel: 4 },
    { itemId: 'pie', minLevel: 4 },
    { itemId: 'savory_fish_pie', minLevel: 5 },
    { itemId: 'honey', minLevel: 6 },
  ],
  captain_sterling: [
    { itemId: 'fish', minLevel: 1 },
    { itemId: 'wheat', minLevel: 1 },
    { itemId: 'feed', minLevel: 1 },
    { itemId: 'corn', minLevel: 2 },
    { itemId: 'bread', minLevel: 2 },
    { itemId: 'yarn', minLevel: 5 },
    { itemId: 'savory_fish_pie', minLevel: 5 },
    { itemId: 'crab_bisque', minLevel: 7 },
    { itemId: 'cotton', minLevel: 8 },
  ],
  lady_guinevere: [
    { itemId: 'wheat', minLevel: 1 },
    { itemId: 'egg', minLevel: 1 },
    { itemId: 'milk', minLevel: 2 },
    { itemId: 'wool', minLevel: 4 },
    { itemId: 'yarn', minLevel: 5 },
    { itemId: 'sweater', minLevel: 5 },
    { itemId: 'honey_comb', minLevel: 6 },
    { itemId: 'cotton', minLevel: 8 },
    { itemId: 'silk', minLevel: 10 },
    { itemId: 'quilted_blanket', minLevel: 10 },
  ],
  old_man_jed: [
    { itemId: 'wheat', minLevel: 1 },
    { itemId: 'feed', minLevel: 1 },
    { itemId: 'corn', minLevel: 2 },
    { itemId: 'carrot', minLevel: 3 },
    { itemId: 'truffle', minLevel: 6 },
    { itemId: 'wild_berries', minLevel: 6 },
    { itemId: 'honey_comb', minLevel: 6 },
    { itemId: 'gold_nugget', minLevel: 8 },
    { itemId: 'truffle_oil', minLevel: 8 },
  ],
};

// --- Order Generator Matching Player Level & Progression Requirements ---
export function generateDeliveryOrder(
  playerLevel = 1,
  forcedType?: OrderType,
  clientKey?: string
): DeliveryOrder {
  const safeLevel = Math.max(1, playerLevel);
  const clientKeys = Object.keys(CLIENT_DEFINITIONS);
  const selectedClientId = clientKey || clientKeys[Math.floor(Math.random() * clientKeys.length)];
  const client = CLIENT_DEFINITIONS[selectedClientId];

  // Roll order type gated by player level for a smooth onboarding curve
  let type: OrderType = forcedType || 'standard';
  if (!forcedType) {
    if (safeLevel < 2) {
      // Level 1: strictly standard contracts to allow relaxed onboarding
      type = 'standard';
    } else if (safeLevel < 4) {
      // Level 2-3: standard (75%) or rush (25%)
      type = Math.random() < 0.75 ? 'standard' : 'rush';
    } else if (safeLevel < 6) {
      // Level 4-5: standard (55%), rush (25%), futures (20%)
      const roll = Math.random();
      if (roll < 0.55) type = 'standard';
      else if (roll < 0.80) type = 'rush';
      else type = 'futures';
    } else {
      // Level 6+: full spectrum including town projects
      const roll = Math.random();
      if (roll < 0.50) type = 'standard';
      else if (roll < 0.72) type = 'rush';
      else if (roll < 0.86) type = 'futures';
      else type = 'town_project';
    }
  }

  // Filter client's preferred items strictly to those unlocked at playerLevel
  const clientPool = CLIENT_LEVEL_POOLS[selectedClientId] || [];
  const eligibleItems = clientPool
    .filter(item => item.minLevel <= safeLevel)
    .map(item => item.itemId);

  // Fallback safety if pool is somehow empty
  const itemPool = eligibleItems.length > 0 ? eligibleItems : ['wheat', 'feed', 'egg'];

  // Item count based on contract type & player level
  let itemCount = 1;
  if (type === 'town_project') {
    itemCount = Math.min(itemPool.length, 3);
  } else if (type === 'futures') {
    itemCount = Math.min(itemPool.length, safeLevel >= 4 ? 2 : 1);
  } else if (type === 'rush') {
    itemCount = Math.min(itemPool.length, safeLevel >= 3 && Math.random() < 0.4 ? 2 : 1);
  } else {
    // Standard orders: 1 item for beginners; 1-2 items for experienced farmers
    itemCount = Math.min(itemPool.length, safeLevel >= 3 && Math.random() < 0.35 ? 2 : 1);
  }

  const shuffledItems = [...itemPool].sort(() => Math.random() - 0.5);
  const pickedItemIds = shuffledItems.slice(0, itemCount);

  // Scaled quantities matching player level capacity
  const requiredItems = pickedItemIds.map(id => {
    const meta = getItemMeta(id);
    let qty = 1;
    if (id === 'wheat' || id === 'corn' || id === 'feed') {
      if (safeLevel <= 2) {
        qty = 2 + Math.floor(Math.random() * 2); // 2-3 items for beginners
      } else {
        qty = type === 'town_project' ? 8 + Math.floor(Math.random() * 6) : 3 + Math.floor(Math.random() * 4);
      }
    } else if (id === 'carrot' || id === 'strawberry' || id === 'cotton' || id === 'fish') {
      if (safeLevel <= 3) {
        qty = 1 + Math.floor(Math.random() * 2); // 1-2 items
      } else {
        qty = type === 'town_project' ? 5 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 3);
      }
    } else if (id === 'egg' || id === 'milk' || id === 'wool') {
      if (safeLevel <= 3) {
        qty = 1 + Math.floor(Math.random() * 2); // 1-2 items
      } else {
        qty = type === 'town_project' ? 4 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 2);
      }
    } else {
      // Manufactured/artisan products (bread, cheese, pie, sweater, etc.)
      qty = type === 'town_project' ? 2 : 1;
    }
    return {
      itemId: id,
      name: meta.name,
      quantity: qty,
      icon: meta.icon,
    };
  });

  const totalBaseValue = requiredItems.reduce((acc, it) => acc + (getItemBaseValue(it.itemId) * it.quantity), 0);

  let coins = 0;
  let xp = 0;
  let gems: number | undefined;
  let specialItem: string | undefined;
  let durationRemaining: number | undefined;
  let totalDuration: number | undefined;
  let penaltyCoins: number | undefined;
  let reputationPoints = 15;

  const specialItemPool = ['Expansion Deed', 'Nail', 'Plank', 'Relic Fragment'];

  if (type === 'standard') {
    // Standard: 140% coins, 120% XP
    coins = Math.max(15, Math.round(totalBaseValue * 1.40));
    xp = Math.max(10, Math.round(totalBaseValue * 1.20));
    reputationPoints = 15 + Math.floor(totalBaseValue / 12);
  } else if (type === 'rush') {
    // Timed Rush: 220% coins, 1-3 Gems, Relic/Expansion shards, strict 90s countdown, 10% breach penalty
    coins = Math.max(30, Math.round(totalBaseValue * 2.20));
    xp = Math.max(20, Math.round(totalBaseValue * 1.80));
    gems = 1 + Math.floor(Math.random() * 3); // 1-3 gems
    specialItem = specialItemPool[Math.floor(Math.random() * specialItemPool.length)];
    totalDuration = 90;
    durationRemaining = 90;
    penaltyCoins = Math.max(20, Math.round(coins * 0.10)); // 10% coin breach penalty
    reputationPoints = 30 + Math.floor(totalBaseValue / 8);
  } else if (type === 'futures') {
    // Advance Futures: 180% coins, 180s countdown, guaranteed Gems & Materials, 15% breach penalty
    coins = Math.max(25, Math.round(totalBaseValue * 1.80));
    xp = Math.max(15, Math.round(totalBaseValue * 1.50));
    gems = 2;
    specialItem = Math.random() < 0.6 ? 'Plank' : 'Expansion Deed';
    totalDuration = 180;
    durationRemaining = 180;
    penaltyCoins = Math.max(25, Math.round(coins * 0.15)); // 15% breach penalty
    reputationPoints = 25 + Math.floor(totalBaseValue / 9);
  } else if (type === 'town_project') {
    // Town Project: Community/Municipal construction, +50 Rep, Expansion Deed, 160% coins
    coins = Math.max(50, Math.round(totalBaseValue * 1.60));
    xp = Math.max(40, Math.round(totalBaseValue * 1.60));
    gems = 1;
    specialItem = 'Expansion Deed';
    reputationPoints = 50 + Math.floor(totalBaseValue / 10);
  }

  const id = `deliv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  const order: DeliveryOrder = {
    id,
    clientId: selectedClientId,
    type,
    requiredItems,
    rewards: {
      coins,
      xp,
      gems,
      reputationPoints,
      specialItem,
    },
    durationRemaining,
    totalDuration,
    penaltyCoins,
    routeOptions: {
      safeDurationSeconds: 0,
      wildDurationSeconds: 0,
      wildRiskPercentage: 25, // 25% hazard risk for +25% bonus coins
    },
    // Backwards-compatible fields
    expiresAt: durationRemaining ? now + durationRemaining * 1000 : null,
    trashedAt: null,
    requested: requiredItems.map(r => ({
      itemId: r.itemId,
      qty: r.quantity,
      emoji: r.icon,
      name: r.name,
    })),
    coinReward: coins,
    xpReward: xp,
    isRushOrder: type === 'rush',
    rushExpiresAt: type === 'rush' ? now + 90000 : null,
    rushDurationSec: type === 'rush' ? 90 : undefined,
    breachFee: penaltyCoins,
    bonusGems: gems,
    relicFragmentReward: specialItem === 'Relic Fragment' ? 1 : 0,
  };

  return order;
}
