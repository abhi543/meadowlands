// ============================================================================
// HIGH-STAKES CONTRACTS & MULTI-DOMAIN SUPPLY CHAIN LOGISTICS ENGINE
// ============================================================================

import { FreshnessTier, isItemPerishable } from './freshnessEngine';

export type ContractFactionId = 'royal_crown' | 'paleo_guild' | 'mercantile_caravan';

export type ContractDifficulty = 'normal' | 'demanding' | 'hazard';

export interface FactionDef {
  id: ContractFactionId;
  name: string;
  title: string;
  emblem: string;
  themeColor: string;
  headerGradient: string;
  accentBorder: string;
  description: string;
  successBonusText: string;
  failurePenaltyText: string;
  typicalTimerRangeMin: [number, number]; // [min, max] minutes
}

export const FACTION_REGISTRY: Record<ContractFactionId, FactionDef> = {
  royal_crown: {
    id: 'royal_crown',
    name: 'The Royal Crown Expedition',
    title: 'Imperial Quartermaster & Court Logistics',
    emblem: '👑',
    themeColor: 'from-amber-600 via-purple-700 to-indigo-900',
    headerGradient: 'from-amber-500/20 via-purple-900/40 to-stone-900',
    accentBorder: 'border-amber-400/60 ring-1 ring-amber-500/30',
    description: 'Supplying His Majesty’s high expeditionary fleet with flawless culinary delicacies, pure pressurized springwater, and noble textiles.',
    successBonusText: '+50 Crown Standing · Crown Relics · Imperial Seed Cache · +50% Pristine Payout Bonus',
    failurePenaltyText: '-15 Crown Standing · 2-Hour Imperial Embargo on Premium Seeds',
    typicalTimerRangeMin: [8, 15],
  },
  paleo_guild: {
    id: 'paleo_guild',
    name: 'The Frontier Paleontological Guild',
    title: 'Sanctuary Bio-Excavators & Strata Surveyors',
    emblem: '🦖',
    themeColor: 'from-emerald-700 via-teal-800 to-stone-900',
    headerGradient: 'from-emerald-500/20 via-teal-900/40 to-stone-900',
    accentBorder: 'border-emerald-400/60 ring-1 ring-emerald-500/30',
    description: 'Procuring mineralized shed specimens, bio-exoskeletons, and precision hydraulic seals for deep strata excavation rigs.',
    successBonusText: '+35 Guild Trust · Rare Fossilized Amber · Outpost Expedition Fuel · High Coin Yield',
    failurePenaltyText: '-20 Guild Trust · +25% Frontier Trail Expedition Hazard Rate (3 Cycles)',
    typicalTimerRangeMin: [30, 50],
  },
  mercantile_caravan: {
    id: 'mercantile_caravan',
    name: 'Regional Mercantile Caravan',
    title: 'Inter-Settlement Commodity Freight',
    emblem: '🚚',
    themeColor: 'from-amber-700 via-stone-800 to-stone-950',
    headerGradient: 'from-amber-600/20 via-stone-800/40 to-stone-900',
    accentBorder: 'border-amber-600/50 ring-1 ring-amber-600/20',
    description: 'Bulk agricultural transports supplying neighboring river valleys with high-calorie staple crops, animal feed, and fresh dairy.',
    successBonusText: '+20 Mercantile Standing · Stable High Volume Coins · Bulk Hardwood & Masonry',
    failurePenaltyText: '-5 Standing · 20-Minute Order Board Slot Lockdown',
    typicalTimerRangeMin: [90, 180],
  },
};

export interface HighStakesManifestSlot {
  slotId: string;
  itemId: string;
  name: string;
  icon: string;
  requiredQuantity: number;
  escrowQuantity: number;
  isWaterSlot?: boolean;
  minFreshness?: FreshnessTier; // 'pristine' or 'standard'
  baseUnitValue: number;
}

export interface ContractRewardItem {
  itemId: string;
  name: string;
  icon: string;
  quantity: number;
}

export interface HighStakesContract {
  id: string;
  factionId: ContractFactionId;
  title: string;
  subtitle: string;
  difficulty: ContractDifficulty;
  difficultyLabel: string;
  manifest: HighStakesManifestSlot[];
  durationSec: number;
  expiresAt: number;
  createdAt: number;
  rewards: {
    coins: number;
    xp: number;
    reputation: number;
    pristineBonusCoins?: number;
    bonusItems?: ContractRewardItem[];
  };
  penalties: {
    reputationLoss: number;
    description: string;
  };
  status: 'active' | 'fulfilled' | 'forfeited' | 'expired';
}

/**
 * Calculates overall escrow loading progress across all manifest slots
 */
export function calculateEscrowTotalProgress(contract: HighStakesContract): {
  loadedSlots: number;
  totalSlots: number;
  loadedUnits: number;
  totalUnits: number;
  percent: number;
  isComplete: boolean;
} {
  let loadedUnits = 0;
  let totalUnits = 0;
  let loadedSlots = 0;

  for (const slot of contract.manifest) {
    loadedUnits += slot.escrowQuantity;
    totalUnits += slot.requiredQuantity;
    if (slot.escrowQuantity >= slot.requiredQuantity) {
      loadedSlots++;
    }
  }

  const percent = totalUnits > 0 ? Math.min(100, Math.floor((loadedUnits / totalUnits) * 100)) : 100;
  const isComplete = contract.manifest.every(s => s.escrowQuantity >= s.requiredQuantity);

  return {
    loadedSlots,
    totalSlots: contract.manifest.length,
    loadedUnits,
    totalUnits,
    percent,
    isComplete,
  };
}

/**
 * Calculates nominal 10% scrap liquidation compensation for committed escrow items
 */
export function calculateScrapLiquidationValue(contract: HighStakesContract): number {
  let committedValue = 0;
  for (const slot of contract.manifest) {
    committedValue += slot.escrowQuantity * slot.baseUnitValue;
  }
  return Math.max(10, Math.round(committedValue * 0.10));
}

/**
 * Generates procedural High-Stakes Contracts tailored to each faction
 */
export function generateHighStakesContract(
  factionId: ContractFactionId,
  playerLevel: number = 5
): HighStakesContract {
  const faction = FACTION_REGISTRY[factionId];
  const now = Date.now();
  const id = `hsc_${factionId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  let difficulty: ContractDifficulty = 'normal';
  let difficultyLabel = '★ Normal';
  let timerMinutes = 60;
  const manifest: HighStakesManifestSlot[] = [];

  if (factionId === 'royal_crown') {
    difficulty = 'hazard';
    difficultyLabel = '★★★ Extreme Hazard';
    timerMinutes = Math.floor(Math.random() * 6) + 8; // 8 to 13 minutes

    // 1. Pristine Culinary slot (bread, cheese, pie, butter, or savory_fish_pie)
    const culinaryPool = [
      { id: 'bread', name: 'Crusty Bread', icon: '🍞', value: 35 },
      { id: 'cheese', name: 'Artisan Cheese', icon: '🧀', value: 75 },
      { id: 'pie', name: 'Berry Pie', icon: '🥧', value: 120 },
      { id: 'butter', name: 'Creamery Butter', icon: '🧈', value: 50 },
    ];
    const pickedCulinary = culinaryPool[Math.floor(Math.random() * culinaryPool.length)];
    manifest.push({
      slotId: 'slot_1',
      itemId: pickedCulinary.id,
      name: pickedCulinary.name,
      icon: pickedCulinary.icon,
      requiredQuantity: 2 + Math.floor(Math.random() * 3), // 2-4 items
      escrowQuantity: 0,
      minFreshness: 'pristine', // DEMANDS PRISTINE
      baseUnitValue: pickedCulinary.value,
    });

    // 2. Luxury Textile slot (shaggy_wool, silk, quilted_blanket, or sweater)
    const textilePool = [
      { id: 'sweater', name: 'Woolen Sweater', icon: '🧥', value: 90 },
      { id: 'silk', name: 'Spun Silk', icon: '🧶', value: 140 },
      { id: 'quilted_blanket', name: 'Quilted Blanket', icon: '🛏️', value: 180 },
    ];
    const pickedTextile = textilePool[Math.floor(Math.random() * textilePool.length)];
    manifest.push({
      slotId: 'slot_2',
      itemId: pickedTextile.id,
      name: pickedTextile.name,
      icon: pickedTextile.icon,
      requiredQuantity: 1 + Math.floor(Math.random() * 2), // 1-2 items
      escrowQuantity: 0,
      baseUnitValue: pickedTextile.value,
    });

    // 3. Direct Hydraulic Depletion slot: Gravity Tower Water (100L - 200L)
    const waterLiters = 100 + Math.floor(Math.random() * 3) * 50; // 100, 150, or 200L
    manifest.push({
      slotId: 'slot_water',
      itemId: 'gravity_tower_water',
      name: 'Gravity Tower Pure Water',
      icon: '💧',
      requiredQuantity: waterLiters,
      escrowQuantity: 0,
      isWaterSlot: true,
      baseUnitValue: 3, // 3 coins per liter
    });
  } else if (factionId === 'paleo_guild') {
    difficulty = 'demanding';
    difficultyLabel = '★★ Demanding';
    timerMinutes = Math.floor(Math.random() * 21) + 30; // 30 to 50 minutes

    // 1. Prehistoric Shed Drop slot
    const prehistoricPool = [
      { id: 'chitin_molt_plates', name: 'Chitin Molt Plates', icon: '🛡️', value: 160 },
      { id: 'prismatic_wing_membrane', name: 'Prismatic Wing Membranes', icon: '🪽', value: 220 },
      { id: 'thermal_scutes', name: 'Shed Thermal Scutes', icon: '🔥', value: 280 },
      { id: 'serpent_slough', name: 'Massive Serpent Slough', icon: '📜', value: 320 },
    ];
    const pickedPrehistoric = prehistoricPool[Math.floor(Math.random() * prehistoricPool.length)];
    manifest.push({
      slotId: 'slot_1',
      itemId: pickedPrehistoric.id,
      name: pickedPrehistoric.name,
      icon: pickedPrehistoric.icon,
      requiredQuantity: 2 + Math.floor(Math.random() * 2), // 2-3 items
      escrowQuantity: 0,
      baseUnitValue: pickedPrehistoric.value,
    });

    // 2. Workshop Hardware / Structural Materials
    const hardwarePool = [
      { id: 'sluice_seal', name: 'Reinforced Sluice Seal', icon: '⚙️', value: 110 },
      { id: 'well_casing', name: 'Iron Well Casing', icon: '🛢️', value: 130 },
      { id: 'refined_glass', name: 'Refined Pressure Glass', icon: '🪟', value: 150 },
      { id: 'steel_beam', name: 'Forged Steel Beam', icon: '🔩', value: 190 },
    ];
    const pickedHardware = hardwarePool[Math.floor(Math.random() * hardwarePool.length)];
    manifest.push({
      slotId: 'slot_2',
      itemId: pickedHardware.id,
      name: pickedHardware.name,
      icon: pickedHardware.icon,
      requiredQuantity: 2 + Math.floor(Math.random() * 2), // 2-3 items
      escrowQuantity: 0,
      baseUnitValue: pickedHardware.value,
    });

    // 3. Hydraulic Siphon slot (80L - 150L)
    const waterLiters = 80 + Math.floor(Math.random() * 3) * 35; // 80, 115, 150L
    manifest.push({
      slotId: 'slot_water',
      itemId: 'gravity_tower_water',
      name: 'Gravity Tower Pressurized Water',
      icon: '💧',
      requiredQuantity: waterLiters,
      escrowQuantity: 0,
      isWaterSlot: true,
      baseUnitValue: 3,
    });
  } else {
    // mercantile_caravan
    difficulty = 'normal';
    difficultyLabel = '★ Normal';
    timerMinutes = Math.floor(Math.random() * 61) + 90; // 90 to 150 minutes

    // 1. Bulk Crop slot (standard freshness)
    const cropPool = [
      { id: 'wheat', name: 'Wheat', icon: '🌾', value: 8 },
      { id: 'corn', name: 'Corn', icon: '🌽', value: 12 },
      { id: 'carrot', name: 'Carrot', icon: '🥕', value: 15 },
      { id: 'tomato', name: 'Tomato', icon: '🍅', value: 18 },
      { id: 'pumpkin', name: 'Pumpkin', icon: '🎃', value: 30 },
    ];
    const pickedCrop = cropPool[Math.floor(Math.random() * cropPool.length)];
    manifest.push({
      slotId: 'slot_1',
      itemId: pickedCrop.id,
      name: pickedCrop.name,
      icon: pickedCrop.icon,
      requiredQuantity: 8 + Math.floor(Math.random() * 8), // 8-15 crops
      escrowQuantity: 0,
      minFreshness: 'standard', // DEMANDS STANDARD FRESHNESS
      baseUnitValue: pickedCrop.value,
    });

    // 2. Feed or Dairy slot
    const feedPool = [
      { id: 'feed', name: 'Animal Feed Rations', icon: '🥣', value: 14 },
      { id: 'milk', name: 'Fresh Milk', icon: '🥛', value: 25 },
      { id: 'egg', name: 'Farm Egg', icon: '🥚', value: 20 },
    ];
    const pickedFeed = feedPool[Math.floor(Math.random() * feedPool.length)];
    manifest.push({
      slotId: 'slot_2',
      itemId: pickedFeed.id,
      name: pickedFeed.name,
      icon: pickedFeed.icon,
      requiredQuantity: 4 + Math.floor(Math.random() * 4), // 4-7 units
      escrowQuantity: 0,
      minFreshness: isItemPerishable(pickedFeed.id) ? 'standard' : undefined,
      baseUnitValue: pickedFeed.value,
    });

    // 3. Optional Tower Water (50L - 100L)
    if (Math.random() < 0.6) {
      manifest.push({
        slotId: 'slot_water',
        itemId: 'gravity_tower_water',
        name: 'Bulk Irrigation Water',
        icon: '💧',
        requiredQuantity: 60,
        escrowQuantity: 0,
        isWaterSlot: true,
        baseUnitValue: 2,
      });
    }
  }

  // Calculate rewards based on manifest values
  let totalBaseValue = 0;
  for (const s of manifest) {
    totalBaseValue += s.requiredQuantity * s.baseUnitValue;
  }

  const durationSec = timerMinutes * 60;
  const expiresAt = now + durationSec * 1000;

  // Royal Crown awards +50% Pristine bonus!
  const coins = Math.round(totalBaseValue * (factionId === 'royal_crown' ? 2.2 : factionId === 'paleo_guild' ? 1.8 : 1.4));
  const pristineBonusCoins = factionId === 'royal_crown' ? Math.round(coins * 0.50) : undefined;
  const xp = Math.round(coins * 0.35);

  let reputation = 20;
  let reputationLoss = 5;
  let bonusItems: ContractRewardItem[] = [];

  if (factionId === 'royal_crown') {
    reputation = 50;
    reputationLoss = 15;
    bonusItems = [
      { itemId: 'relic_fragment', name: 'Crown Relic Fragment', icon: '👑', quantity: 2 },
      { itemId: 'imperial_seed_cache', name: 'Imperial Seed Cache', icon: '✨', quantity: 1 },
      { itemId: 'gem', name: 'Royal Emerald Gem', icon: '💎', quantity: 3 },
    ];
  } else if (factionId === 'paleo_guild') {
    reputation = 35;
    reputationLoss = 20;
    bonusItems = [
      { itemId: 'fossil_amber_core', name: 'Fossilized Amber Core', icon: '✨', quantity: 1 },
      { itemId: 'expedition_fuel', name: 'Frontier Trail Rations', icon: '🥫', quantity: 5 },
      { itemId: 'gem', name: 'Bio-Crystal Gem', icon: '💎', quantity: 2 },
    ];
  } else {
    reputation = 20;
    reputationLoss = 5;
    bonusItems = [
      { itemId: 'scrap_timber', name: 'Hardwood Timber', icon: '🪵', quantity: 10 },
      { itemId: 'river_stone', name: 'River Cobblestone', icon: '🪨', quantity: 8 },
      { itemId: 'gem', name: 'Merchant Gem', icon: '💎', quantity: 1 },
    ];
  }

  const titles: Record<ContractFactionId, string[]> = {
    royal_crown: [
      'His Majesty’s Grand Galleon Provisioning',
      'Crown Envoy Diplomatic Banquet Cargo',
      'Imperial Citadel Emergency Winter Cache',
      'Royal Sovereign High-Seas Expedition Crate',
    ],
    paleo_guild: [
      'Deep Strata Thermal Excavation Hardware',
      'Primeval Biosphere Specimen Consignment',
      'Frontier Rig Hydraulic Well Reinforcement',
      'Cambrian Silt Survey Expedition Supplies',
    ],
    mercantile_caravan: [
      'High-Valley Agricultural Distribution Freight',
      'Cross-River Settlement Feed Consignment',
      'Midland Trading Post Weekly Sustenance Cargo',
      'Caravan Overland Bulk Grain Shipment',
    ],
  };

  const pool = titles[factionId];
  const title = pool[Math.floor(Math.random() * pool.length)];

  return {
    id,
    factionId,
    title,
    subtitle: faction.title,
    difficulty,
    difficultyLabel,
    manifest,
    durationSec,
    expiresAt,
    createdAt: now,
    rewards: {
      coins,
      xp,
      reputation,
      pristineBonusCoins,
      bonusItems,
    },
    penalties: {
      reputationLoss,
      description: faction.failurePenaltyText,
    },
    status: 'active',
  };
}
