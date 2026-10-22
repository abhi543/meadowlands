// ============================================================================
// FRESHNESS RATING SYSTEM & PERISHABLE QUALITY ENGINE
// ============================================================================

export type FreshnessTier = 'pristine' | 'standard' | 'stale' | 'spoiled';

export interface PerishableItemDef {
  itemId: string;
  name: string;
  category: 'raw_crop' | 'dairy' | 'bakery' | 'prepared_meal' | 'fish';
  baseDecayDurationSec: number; // Duration from 100% to 0%
}

export interface PerishableBatch {
  id: string;
  itemId: string;
  quantity: number;
  harvestedAt: number;
  maxLifetimeSec: number;
}

// Registry of all perishable items and their base decay spans
export const PERISHABLE_DEFINITIONS: Record<string, PerishableItemDef> = {
  // Raw Crops (12 to 18 minutes baseline life)
  wheat: { itemId: 'wheat', name: 'Wheat', category: 'raw_crop', baseDecayDurationSec: 900 },
  corn: { itemId: 'corn', name: 'Corn', category: 'raw_crop', baseDecayDurationSec: 900 },
  carrot: { itemId: 'carrot', name: 'Carrot', category: 'raw_crop', baseDecayDurationSec: 720 },
  strawberry: { itemId: 'strawberry', name: 'Strawberry', category: 'raw_crop', baseDecayDurationSec: 600 },
  tomato: { itemId: 'tomato', name: 'Tomato', category: 'raw_crop', baseDecayDurationSec: 720 },
  sunflower: { itemId: 'sunflower', name: 'Sunflower', category: 'raw_crop', baseDecayDurationSec: 900 },
  soybean: { itemId: 'soybean', name: 'Soybean', category: 'raw_crop', baseDecayDurationSec: 1080 },
  pumpkin: { itemId: 'pumpkin', name: 'Pumpkin', category: 'raw_crop', baseDecayDurationSec: 1200 },
  wild_berries: { itemId: 'wild_berries', name: 'Wild Berries', category: 'raw_crop', baseDecayDurationSec: 540 },
  wild_berries_silver: { itemId: 'wild_berries_silver', name: 'Silver Wild Berries', category: 'raw_crop', baseDecayDurationSec: 720 },
  wild_berries_gold: { itemId: 'wild_berries_gold', name: 'Golden Wild Berries', category: 'raw_crop', baseDecayDurationSec: 900 },
  wild_berries_prismatic: { itemId: 'wild_berries_prismatic', name: 'Prismatic Wild Berries', category: 'raw_crop', baseDecayDurationSec: 1500 },

  // Dairy & Animal Goods (8 to 15 minutes)
  milk: { itemId: 'milk', name: 'Fresh Milk', category: 'dairy', baseDecayDurationSec: 600 },
  egg: { itemId: 'egg', name: 'Farm Egg', category: 'dairy', baseDecayDurationSec: 900 },
  cheese: { itemId: 'cheese', name: 'Artisan Cheese', category: 'dairy', baseDecayDurationSec: 1200 },
  butter: { itemId: 'butter', name: 'Creamery Butter', category: 'dairy', baseDecayDurationSec: 720 },

  // Bakery & Prepared Meals (12 to 20 minutes)
  bread: { itemId: 'bread', name: 'Crusty Bread', category: 'bakery', baseDecayDurationSec: 900 },
  pie: { itemId: 'pie', name: 'Berry Pie', category: 'bakery', baseDecayDurationSec: 1080 },
  savory_fish_pie: { itemId: 'savory_fish_pie', name: 'Savory Fish Pie', category: 'prepared_meal', baseDecayDurationSec: 900 },
  crab_bisque: { itemId: 'crab_bisque', name: 'Crab Bisque', category: 'prepared_meal', baseDecayDurationSec: 720 },
  golden_cornbread: { itemId: 'golden_cornbread', name: 'Golden Cornbread', category: 'bakery', baseDecayDurationSec: 1200 },
  royal_pumpkin_pottage: { itemId: 'royal_pumpkin_pottage', name: 'Royal Pumpkin Pottage', category: 'prepared_meal', baseDecayDurationSec: 1200 },
  prismatic_berry_tart: { itemId: 'prismatic_berry_tart', name: 'Prismatic Berry Tart', category: 'bakery', baseDecayDurationSec: 1500 },

  // Seafood & Fishery Catch (6 to 10 minutes)
  fish: { itemId: 'fish', name: 'Fresh Catch', category: 'fish', baseDecayDurationSec: 480 },
  catfish: { itemId: 'catfish', name: 'Catfish', category: 'fish', baseDecayDurationSec: 480 },
  salmon: { itemId: 'salmon', name: 'Salmon', category: 'fish', baseDecayDurationSec: 540 },
  trout: { itemId: 'trout', name: 'River Trout', category: 'fish', baseDecayDurationSec: 540 },
  mud_crab: { itemId: 'mud_crab', name: 'Mud Crab', category: 'fish', baseDecayDurationSec: 600 },
};

/**
 * Checks if an item is considered perishable
 */
export function isItemPerishable(itemId: string): boolean {
  return itemId in PERISHABLE_DEFINITIONS;
}

/**
 * Calculates current freshness percentage (0-100) from timestamps
 */
export function calculateFreshnessPercent(harvestedAt: number, maxLifetimeSec: number, now: number = Date.now()): number {
  if (!harvestedAt || !maxLifetimeSec) return 100;
  const elapsedSec = (now - harvestedAt) / 1000;
  if (elapsedSec <= 0) return 100;
  if (elapsedSec >= maxLifetimeSec) return 0;
  const remainingFraction = 1 - (elapsedSec / maxLifetimeSec);
  return Math.max(0, Math.min(100, Math.round(remainingFraction * 100)));
}

/**
 * Determines the Freshness Tier matching specification:
 * - Pristine: 100% - 85%
 * - Standard: 84% - 40%
 * - Stale: 39% - 1%
 * - Spoiled: 0%
 */
export function getFreshnessTier(freshnessPercent: number): FreshnessTier {
  if (freshnessPercent >= 85) return 'pristine';
  if (freshnessPercent >= 40) return 'standard';
  if (freshnessPercent > 0) return 'stale';
  return 'spoiled';
}

export interface FreshnessMeta {
  tier: FreshnessTier;
  percent: number;
  label: string;
  badgeEmoji: string;
  badgeClass: string;
  ringColor: string;
  secondsUntilDegradation: number;
}

/**
 * Returns complete UI presentation metadata for an item's freshness state
 */
export function getFreshnessMeta(
  harvestedAt: number,
  maxLifetimeSec: number,
  now: number = Date.now()
): FreshnessMeta {
  const percent = calculateFreshnessPercent(harvestedAt, maxLifetimeSec, now);
  const tier = getFreshnessTier(percent);
  const elapsedSec = Math.max(0, (now - harvestedAt) / 1000);

  let secondsUntilDegradation = 0;
  if (tier === 'pristine') {
    // Threshold to Standard is 85% remaining, meaning 15% elapsed
    const pristineLimitSec = maxLifetimeSec * 0.15;
    secondsUntilDegradation = Math.max(0, Math.round(pristineLimitSec - elapsedSec));
  } else if (tier === 'standard') {
    // Threshold to Stale is 40% remaining, meaning 60% elapsed
    const standardLimitSec = maxLifetimeSec * 0.60;
    secondsUntilDegradation = Math.max(0, Math.round(standardLimitSec - elapsedSec));
  } else if (tier === 'stale') {
    // Threshold to Spoiled is 0% remaining, meaning 100% elapsed
    secondsUntilDegradation = Math.max(0, Math.round(maxLifetimeSec - elapsedSec));
  }

  switch (tier) {
    case 'pristine':
      return {
        tier: 'pristine',
        percent,
        label: '★ Pristine',
        badgeEmoji: '✨',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 ring-1 ring-emerald-500/30',
        ringColor: '#10b981',
        secondsUntilDegradation,
      };
    case 'standard':
      return {
        tier: 'standard',
        percent,
        label: 'Standard',
        badgeEmoji: '🌱',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
        ringColor: '#3b82f6',
        secondsUntilDegradation,
      };
    case 'stale':
      return {
        tier: 'stale',
        percent,
        label: 'Stale',
        badgeEmoji: '🍂',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        ringColor: '#f59e0b',
        secondsUntilDegradation,
      };
    case 'spoiled':
    default:
      return {
        tier: 'spoiled',
        percent: 0,
        label: 'Spoiled',
        badgeEmoji: '🥀',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
        ringColor: '#ef4444',
        secondsUntilDegradation: 0,
      };
  }
}

/**
 * Formats remaining seconds as readable countdown string (e.g. "4m 12s")
 */
export function formatDecayCountdown(seconds: number): string {
  if (seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
