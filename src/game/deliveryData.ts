// ============================================================
// Project Meadowlands — Logistics & Delivery Engine Data Registry
// Phase 1: Economic Rebalancing, Contract Schema, Client Personas
// ============================================================

import { CROPS, PRODUCTS, type CropId } from './data';
import {
  getDerivedItemPrice,
  getItemEconomicProfile,
  calculateMasterSettlement,
  type ContractEconomicTier,
  type ContractSettlementBreakdown,
} from './pricingEngine';

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
  contractTier?: ContractEconomicTier;
  settlementBreakdown?: ContractSettlementBreakdown;
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
    preferredItems: ['wheat', 'corn', 'bread', 'cheese', 'pie', 'cotton', 'wool', 'carrot', 'sweater'],
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

// --- Item Base Value Calculator (Powered by Mathematical Pricing Engine) ---
export function getItemBaseValue(itemId: string): number {
  return getDerivedItemPrice(itemId);
}

export function getItemMeta(itemId: string): { name: string; icon: string; baseValue: number } {
  const profile = getItemEconomicProfile(itemId);
  return { name: profile.name, icon: profile.icon, baseValue: profile.baseValue };
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

  // Level 6: Pigs (Truffle), Press (Truffle Oil)
  truffle: 6,
  truffle_oil: 6,

  // Level 7: Pumpkins, Bakery (Crab Bisque)
  pumpkin: 7,
  crab_bisque: 7,

  // Level 8: Cotton
  cotton: 8,

  // Level 12: Apiary Tender (Honey Comb), Press (Honey), Textiles (Silk)
  honey_comb: 12,
  honey: 12,
  silk: 12,

  // Level 16: Wilderness Scout (Wild Berries)
  wild_berries: 16,

  // Level 18: Tailor Shop (Quilted Blanket)
  quilted_blanket: 18,

  // Level 28: Quarry Miner (Gold Nugget)
  gold_nugget: 28,

  // Gourmet Quality Culinary & Premium Artisan Products
  glazed_silver_carrots: 5,
  golden_cornbread: 6,
  royal_pumpkin_pottage: 9,
  silver_woven_quilt: 10,
  prismatic_berry_tart: 14,
  grand_prismatic_jam: 15,
  prismatic_silk_tapestry: 20,

  // Gourmet Seafood Masterworks
  crispy_fried_catfish: 3,
  herb_grilled_trout: 3,
  steamed_mud_crab: 4,
  pan_seared_salmon: 5,
  smoked_tuna_steak: 7,
  golden_trout_meuniere: 9,
  imperial_sturgeon_caviar: 12,
  marlin_tartare: 16,
  luminescent_chowder: 20,
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
    { itemId: 'golden_cornbread', minLevel: 6 },
    { itemId: 'cotton', minLevel: 8 },
    { itemId: 'silk', minLevel: 12 },
    { itemId: 'grand_prismatic_jam', minLevel: 15 },
  ],
  chef_antoine: [
    { itemId: 'egg', minLevel: 1 },
    { itemId: 'wheat', minLevel: 1 },
    { itemId: 'milk', minLevel: 2 },
    { itemId: 'bread', minLevel: 2 },
    { itemId: 'carrot', minLevel: 3 },
    { itemId: 'crispy_fried_catfish', minLevel: 3 },
    { itemId: 'herb_grilled_trout', minLevel: 3 },
    { itemId: 'strawberry', minLevel: 4 },
    { itemId: 'cheese', minLevel: 4 },
    { itemId: 'pie', minLevel: 4 },
    { itemId: 'steamed_mud_crab', minLevel: 4 },
    { itemId: 'glazed_silver_carrots', minLevel: 5 },
    { itemId: 'savory_fish_pie', minLevel: 5 },
    { itemId: 'pan_seared_salmon', minLevel: 5 },
    { itemId: 'golden_cornbread', minLevel: 6 },
    { itemId: 'crab_bisque', minLevel: 7 },
    { itemId: 'smoked_tuna_steak', minLevel: 7 },
    { itemId: 'royal_pumpkin_pottage', minLevel: 9 },
    { itemId: 'golden_trout_meuniere', minLevel: 9 },
    { itemId: 'honey', minLevel: 12 },
    { itemId: 'imperial_sturgeon_caviar', minLevel: 12 },
    { itemId: 'prismatic_berry_tart', minLevel: 14 },
    { itemId: 'grand_prismatic_jam', minLevel: 15 },
    { itemId: 'luminescent_chowder', minLevel: 20 },
  ],
  captain_sterling: [
    { itemId: 'fish', minLevel: 1 },
    { itemId: 'wheat', minLevel: 1 },
    { itemId: 'feed', minLevel: 1 },
    { itemId: 'corn', minLevel: 2 },
    { itemId: 'bread', minLevel: 2 },
    { itemId: 'crispy_fried_catfish', minLevel: 3 },
    { itemId: 'herb_grilled_trout', minLevel: 3 },
    { itemId: 'steamed_mud_crab', minLevel: 4 },
    { itemId: 'yarn', minLevel: 5 },
    { itemId: 'savory_fish_pie', minLevel: 5 },
    { itemId: 'pan_seared_salmon', minLevel: 5 },
    { itemId: 'crab_bisque', minLevel: 7 },
    { itemId: 'smoked_tuna_steak', minLevel: 7 },
    { itemId: 'cotton', minLevel: 8 },
    { itemId: 'silk', minLevel: 12 },
    { itemId: 'imperial_sturgeon_caviar', minLevel: 12 },
    { itemId: 'marlin_tartare', minLevel: 16 },
    { itemId: 'luminescent_chowder', minLevel: 20 },
  ],
  lady_guinevere: [
    { itemId: 'wheat', minLevel: 1 },
    { itemId: 'egg', minLevel: 1 },
    { itemId: 'milk', minLevel: 2 },
    { itemId: 'wool', minLevel: 4 },
    { itemId: 'yarn', minLevel: 5 },
    { itemId: 'sweater', minLevel: 5 },
    { itemId: 'cotton', minLevel: 8 },
    { itemId: 'royal_pumpkin_pottage', minLevel: 9 },
    { itemId: 'silver_woven_quilt', minLevel: 10 },
    { itemId: 'honey_comb', minLevel: 12 },
    { itemId: 'silk', minLevel: 12 },
    { itemId: 'prismatic_berry_tart', minLevel: 14 },
    { itemId: 'quilted_blanket', minLevel: 18 },
    { itemId: 'prismatic_silk_tapestry', minLevel: 20 },
  ],
  old_man_jed: [
    { itemId: 'wheat', minLevel: 1 },
    { itemId: 'feed', minLevel: 1 },
    { itemId: 'corn', minLevel: 2 },
    { itemId: 'carrot', minLevel: 3 },
    { itemId: 'glazed_silver_carrots', minLevel: 5 },
    { itemId: 'truffle', minLevel: 6 },
    { itemId: 'truffle_oil', minLevel: 6 },
    { itemId: 'golden_cornbread', minLevel: 6 },
    { itemId: 'honey_comb', minLevel: 12 },
    { itemId: 'wild_berries', minLevel: 16 },
    { itemId: 'gold_nugget', minLevel: 28 },
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

  // Determine Macro-Contract Economic Tier
  let contractTier: ContractEconomicTier = 'tier1_local';
  if (type === 'town_project' || safeLevel >= 12) {
    contractTier = (type === 'town_project' || Math.random() < 0.45) ? 'tier3_noble' : 'tier2_merchant';
  } else if (safeLevel >= 4 || type === 'futures') {
    contractTier = 'tier2_merchant';
  } else {
    contractTier = 'tier1_local';
  }

  const isRush = type === 'rush';
  const settlement = calculateMasterSettlement(requiredItems, contractTier, 0, isRush);

  const specialItemPool = ['Expansion Deed', 'Nail', 'Plank', 'Relic Fragment'];
  const specialItem = (type === 'town_project' || (isRush && Math.random() < 0.5)) ? specialItemPool[Math.floor(Math.random() * specialItemPool.length)] : undefined;
  const gems = isRush ? 2 : (type === 'town_project' ? 1 : undefined);

  const coins = settlement.finalCoinPayout;
  const xp = Math.max(15, Math.round(settlement.baseCommodityValue * 0.75));
  let reputationPoints = contractTier === 'tier3_noble' ? 50 : (contractTier === 'tier2_merchant' ? 25 : 15);
  if (isRush) reputationPoints *= 2;

  // 10-minute countdown for Courier Rush bounties
  const totalDuration = isRush ? 600 : (type === 'futures' ? 300 : undefined);
  const durationRemaining = totalDuration;
  const penaltyCoins = isRush ? Math.max(25, Math.round(coins * 0.10)) : undefined;

  const id = `deliv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  const order: DeliveryOrder = {
    id,
    clientId: selectedClientId,
    type,
    contractTier,
    settlementBreakdown: settlement,
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
    isRushOrder: isRush,
    rushExpiresAt: isRush ? now + 600000 : null,
    rushDurationSec: isRush ? 600 : undefined,
    breachFee: penaltyCoins,
    bonusGems: gems,
    relicFragmentReward: specialItem === 'Relic Fragment' ? 1 : 0,
  };

  return order;
}
