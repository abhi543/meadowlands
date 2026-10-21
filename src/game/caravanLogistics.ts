// ============================================================================
// Project Meadowlands — Bulk Caravan Dispatch & Multi-Order Stacking Logistics
// Mathematical Volume Multipliers, Aggregate Inventory Validation, & Batch Settlement
// ============================================================================

import { CROPS } from './data';
import {
  getItemEconomicProfile,
  getTradeStreakMultiplier,
  CONTRACT_TIER_CONFIG,
  type ContractEconomicTier,
} from './pricingEngine';
import type { DeliveryOrder } from './deliveryData';

export interface RareFrontierDrop {
  itemId: string;
  name: string;
  qty: number;
  emoji: string;
}

export interface BulkVolumeTierInfo {
  count: number;
  multiplier: number;
  bonusPercent: number;
  tierTitle: string;
  rareDrops: RareFrontierDrop[];
  description: string;
}

export const BULK_VOLUME_TIERS: Record<number, { multiplier: number; bonusPercent: number; title: string }> = {
  1: { multiplier: 1.00, bonusPercent: 0,  title: 'Standard Dispatch' },
  2: { multiplier: 1.05, bonusPercent: 5,  title: 'Dual-Order Stacking' },
  3: { multiplier: 1.15, bonusPercent: 15, title: 'Merchant Caravan' },
  4: { multiplier: 1.25, bonusPercent: 25, title: 'Full Caravan Haul' },
  5: { multiplier: 1.40, bonusPercent: 40, title: 'Grand Merchant Fleet' },
};

/**
 * Returns the bulk volume multiplier and rare frontier drops for a given stacked order count.
 */
export function getBulkVolumeTierInfo(orderCount: number): BulkVolumeTierInfo {
  if (orderCount <= 1) {
    return {
      count: orderCount,
      multiplier: 1.00,
      bonusPercent: 0,
      tierTitle: 'Standard Individual Rate',
      rareDrops: [],
      description: 'Single-order dispatch without bulk logistics surcharge.',
    };
  }

  if (orderCount === 2) {
    return {
      count: 2,
      multiplier: 1.05,
      bonusPercent: 5,
      tierTitle: 'Dual Courier Stack (+5%)',
      rareDrops: [],
      description: '+5% bulk logistics surcharge on all stacked cargo.',
    };
  }

  if (orderCount === 3) {
    return {
      count: 3,
      multiplier: 1.15,
      bonusPercent: 15,
      tierTitle: 'Merchant Caravan Stack (+15%)',
      rareDrops: [],
      description: '+15% bulk logistics surcharge on all stacked cargo.',
    };
  }

  if (orderCount === 4) {
    return {
      count: 4,
      multiplier: 1.25,
      bonusPercent: 25,
      tierTitle: 'Full Caravan Haul (+25% + Rare Drop)',
      rareDrops: [
        { itemId: 'mountain_slate', name: 'Mountain Slate', qty: 5, emoji: '🪨' },
      ],
      description: '+25% bulk volume bonus + guaranteed 5x Mountain Slate drop.',
    };
  }

  // 5+ Orders
  return {
    count: orderCount,
    multiplier: 1.40,
    bonusPercent: 40,
    tierTitle: 'Grand Merchant Fleet (+40% + 2x Rare Drops)',
    rareDrops: [
      { itemId: 'mountain_slate', name: 'Mountain Slate', qty: 5, emoji: '🪨' },
      { itemId: 'fossil_bark', name: 'Ancient Birch Bark', qty: 5, emoji: '🍂' },
    ],
    description: '+40% bulk volume bonus + 5x Mountain Slate & 5x Ancient Birch Bark.',
  };
}

/** Determines whether an item belongs to the Silo or the Barn */
export function isCropStorageItem(itemId: string): boolean {
  return (
    itemId in CROPS ||
    itemId === 'feed' ||
    itemId === 'cotton' ||
    itemId === 'honey_comb' ||
    itemId === 'wild_berries' ||
    itemId === 'gold_nugget'
  );
}

export interface RequisitionItemDemand {
  itemId: string;
  name: string;
  icon: string;
  storageType: 'silo' | 'barn';
  totalRequired: number;
  availableStock: number;
  isSatisfied: boolean;
  deficit: number;
  contributingOrderIds: string[];
}

export interface CaravanManifestValidation {
  demands: RequisitionItemDemand[];
  isValidCargo: boolean;
  hasConflicts: boolean;
  conflictingItems: RequisitionItemDemand[];
  totalItemUnits: number;
  totalUniqueItems: number;
}

/**
 * Aggregates all item demands across selected orders and validates against Silo/Barn stock.
 * Anti-cannibalization engine guarantees items are not double-counted.
 */
export function validateCaravanCargo(
  orders: DeliveryOrder[],
  silo: Record<string, number>,
  barn: Record<string, number>,
  currentWater: number = Infinity
): CaravanManifestValidation {
  const demandMap: Record<string, RequisitionItemDemand> = {};

  for (const order of orders) {
    const items =
      order.requiredItems ||
      order.requested?.map(r => ({
        itemId: r.itemId,
        quantity: r.qty,
        name: r.name,
        icon: r.emoji,
      })) ||
      [];

    for (const item of items) {
      if (!demandMap[item.itemId]) {
        const isCrop = isCropStorageItem(item.itemId);
        const available = isCrop ? (silo[item.itemId] || 0) : (barn[item.itemId] || 0);
        demandMap[item.itemId] = {
          itemId: item.itemId,
          name: item.name || item.itemId,
          icon: item.icon || '📦',
          storageType: isCrop ? 'silo' : 'barn',
          totalRequired: 0,
          availableStock: available,
          isSatisfied: true,
          deficit: 0,
          contributingOrderIds: [],
        };
      }

      demandMap[item.itemId].totalRequired += item.quantity;
      demandMap[item.itemId].contributingOrderIds.push(order.id);
    }

    // Hydrology pressurized water demand
    if (order.waterRequired && order.waterRequired > 0) {
      if (!demandMap['water']) {
        demandMap['water'] = {
          itemId: 'water',
          name: 'Pressurized Water',
          icon: '💧',
          storageType: 'silo',
          totalRequired: 0,
          availableStock: Math.floor(currentWater),
          isSatisfied: true,
          deficit: 0,
          contributingOrderIds: [],
        };
      }
      demandMap['water'].totalRequired += order.waterRequired;
      demandMap['water'].contributingOrderIds.push(order.id);
    }
  }

  const demands = Object.values(demandMap);
  const conflictingItems: RequisitionItemDemand[] = [];
  let totalUnits = 0;

  for (const demand of demands) {
    totalUnits += demand.totalRequired;
    if (demand.availableStock < demand.totalRequired) {
      demand.isSatisfied = false;
      demand.deficit = demand.totalRequired - demand.availableStock;
      conflictingItems.push(demand);
    } else {
      demand.isSatisfied = true;
      demand.deficit = 0;
    }
  }

  const isValidCargo = orders.length > 0 && conflictingItems.length === 0;

  return {
    demands,
    isValidCargo,
    hasConflicts: conflictingItems.length > 0,
    conflictingItems,
    totalItemUnits: totalUnits,
    totalUniqueItems: demands.length,
  };
}

/**
 * Checks whether an unselected order can be safely packed into the caravan
 * without exceeding the remaining available stock after current selections.
 */
export function canAddOrderToCaravan(
  candidateOrder: DeliveryOrder,
  currentlySelectedOrders: DeliveryOrder[],
  silo: Record<string, number>,
  barn: Record<string, number>,
  currentWater: number = Infinity
): { canAdd: boolean; conflictReason?: string; shortItemName?: string; shortAvailable?: number; shortRequired?: number } {
  // Combine currently selected plus candidate
  const combined = [...currentlySelectedOrders, candidateOrder];
  const validation = validateCaravanCargo(combined, silo, barn, currentWater);

  if (validation.isValidCargo) {
    return { canAdd: true };
  }

  const firstConflict = validation.conflictingItems[0];
  if (firstConflict) {
    return {
      canAdd: false,
      conflictReason: `Exceeds Available Stock (${firstConflict.availableStock}/${firstConflict.totalRequired} ${firstConflict.name})`,
      shortItemName: firstConflict.name,
      shortAvailable: firstConflict.availableStock,
      shortRequired: firstConflict.totalRequired,
    };
  }

  return { canAdd: false, conflictReason: 'Insufficient Home Barn/Hydrology Inventory' };
}

export interface CaravanSettlementBreakdown {
  ordersCount: number;
  baseCommodityTotal: number;
  tierMarkupTotal: number;
  subtotalBaseValue: number;
  bulkVolumeBonusPercent: number;
  bulkBonusCoins: number;
  currentStreak: number;
  advancedStreak: number;
  streakMultiplier: number;
  streakBonusPercent: number;
  streakBonusCoins: number;
  streakLeapAchieved: boolean;
  streakLeapNotice?: string;
  hasRushBounties: boolean;
  rushBonusCoins: number;
  clientPerkCoins: number;
  totalNetProceeds: number;
  totalBonusGoldEarned: number;
  totalXp: number;
  totalGems: number;
  clientRepGains: Record<string, number>;
  rareFrontierDrops: RareFrontierDrop[];
  dailyPayrollBurnRate: number;
  payrollDaysCovered: number;
}

/**
 * Calculates complete multi-order caravan settlement, applying compounding volume bonuses,
 * instant velocity streak advancement (S + K), and client perk multipliers.
 */
export function calculateCaravanSettlement(args: {
  orders: DeliveryOrder[];
  currentStreak: number;
  now?: number;
  clientReputation?: Record<string, { level: number; xp: number }>;
  relics?: any;
  dailyPayrollRate?: number;
}): CaravanSettlementBreakdown {
  const {
    orders,
    currentStreak,
    now = Date.now(),
    clientReputation = {},
    relics = {},
    dailyPayrollRate = 0,
  } = args;

  const ordersCount = orders.length;
  const volumeInfo = getBulkVolumeTierInfo(ordersCount);

  // Instant Velocity Streak Leaping: Fulfilling K orders advances streak by +K points immediately
  const advancedStreak = currentStreak + ordersCount;
  const preStreakInfo = getTradeStreakMultiplier(currentStreak);
  const postStreakInfo = getTradeStreakMultiplier(advancedStreak);
  const streakMultiplier = postStreakInfo.multiplier;
  const streakBonusPercent = postStreakInfo.bonusPercent;
  const streakLeapAchieved = postStreakInfo.multiplier > preStreakInfo.multiplier;

  let streakLeapNotice: string | undefined;
  if (streakLeapAchieved) {
    streakLeapNotice = `Advanced from Streak ${currentStreak} to ${advancedStreak}! (Leaped to Tier ${postStreakInfo.bonusPercent}% Bonus!)`;
  }

  let baseCommodityTotal = 0;
  let subtotalBaseValue = 0;
  let rushBonusCoins = 0;
  let totalXp = 0;
  let totalGems = 0;
  let hasRushBounties = false;
  const clientRepGains: Record<string, number> = {};

  for (const order of orders) {
    const items =
      order.requiredItems ||
      order.requested?.map(r => ({
        itemId: r.itemId,
        quantity: r.qty,
        name: r.name,
        icon: r.emoji,
      })) ||
      [];

    let orderRawBase = 0;
    for (const it of items) {
      const profile = getItemEconomicProfile(it.itemId);
      orderRawBase += profile.baseValue * it.quantity;
    }
    if (order.waterRequired) {
      orderRawBase += Math.round(order.waterRequired * 6);
    }
    baseCommodityTotal += orderRawBase;

    // Apply contract tier multiplier & high-stakes bounty multiplier (5.0x)
    const contractTier: ContractEconomicTier = order.contractTier || 'tier1_local';
    const tierConfig = CONTRACT_TIER_CONFIG[contractTier] || CONTRACT_TIER_CONFIG.tier1_local;
    const highStakesMult = order.isHighStakes ? 5.0 : 1.0;
    const tierBase = Math.round(orderRawBase * tierConfig.multiplier * highStakesMult);

    // Rush multiplier (3.0x applied to that specific order's base portion)
    const isRush = Boolean(
      (order.type === 'rush' || order.isRushOrder) &&
      ((order.expiresAt && order.expiresAt > now) || (order.rushExpiresAt && order.rushExpiresAt > now))
    );

    let orderValueWithRush = tierBase;
    if (isRush) {
      hasRushBounties = true;
      const rushPortion = tierBase * 2.0; // The extra 2x over base
      rushBonusCoins += Math.round(rushPortion);
      orderValueWithRush = Math.round(tierBase * 3.0);
    }

    subtotalBaseValue += orderValueWithRush;

    // Aggregate rewards
    totalXp += order.rewards?.xp || order.xpReward || 15;
    totalGems += order.rewards?.gems || order.bonusGems || 0;

    const repGain = order.rewards?.reputationPoints || 15;
    const cId = order.clientId || 'mayor_barnaby';
    clientRepGains[cId] = (clientRepGains[cId] || 0) + repGain;
  }

  const tierMarkupTotal = Math.max(0, subtotalBaseValue - baseCommodityTotal - rushBonusCoins);

  // Bulk Volume Bonus (e.g. +15% of subtotalBaseValue)
  const bulkBonusCoins = Math.round(subtotalBaseValue * (volumeInfo.bonusPercent / 100));

  // Streak Multiplier Bonus
  const streakBonusCoins = Math.round(subtotalBaseValue * (postStreakInfo.bonusPercent / 100));

  // Client Perks Multipliers (Consolidated)
  const mayorLevel = clientReputation?.mayor_barnaby?.level || 1;
  const mayorMult = mayorLevel >= 5 ? 1.15 : (mayorLevel >= 2 ? 1.05 : 1.0);
  const crownBonus = relics?.royalCrownCrestUntil && relics.royalCrownCrestUntil > now ? 1.15 : 1.0;

  const prePerkTotal = subtotalBaseValue + bulkBonusCoins + streakBonusCoins;
  const postPerkTotal = Math.round(prePerkTotal * mayorMult * crownBonus);
  const clientPerkCoins = Math.max(0, postPerkTotal - prePerkTotal);

  const totalNetProceeds = Math.max(15, postPerkTotal);
  const totalBonusGoldEarned = Math.max(0, totalNetProceeds - baseCommodityTotal);

  const payrollDaysCovered = dailyPayrollRate > 0
    ? Math.round((totalNetProceeds / dailyPayrollRate) * 10) / 10
    : 0;

  return {
    ordersCount,
    baseCommodityTotal,
    tierMarkupTotal,
    subtotalBaseValue,
    bulkVolumeBonusPercent: volumeInfo.bonusPercent,
    bulkBonusCoins,
    currentStreak,
    advancedStreak,
    streakMultiplier,
    streakBonusPercent,
    streakBonusCoins,
    streakLeapAchieved,
    streakLeapNotice,
    hasRushBounties,
    rushBonusCoins,
    clientPerkCoins,
    totalNetProceeds,
    totalBonusGoldEarned,
    totalXp,
    totalGems,
    clientRepGains,
    rareFrontierDrops: volumeInfo.rareDrops,
    dailyPayrollBurnRate: dailyPayrollRate,
    payrollDaysCovered,
  };
}
