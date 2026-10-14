import { CROPS, PRODUCTS, type CropId, type ProductId } from '@/game/data';
import { BarnItem, BarnItemCategory, BarnItemLockMap } from '@/types/inventory';
import { getItemEconomicProfile } from '@/game/pricingEngine';

// Static base values & categories mapping for all items
export interface ItemCatalogMeta {
  id: string;
  name: string;
  icon: string;
  category: BarnItemCategory;
  baseValue: number;
  isEdibleFeed: boolean;
}

export const ITEM_CATALOG_META: Record<string, ItemCatalogMeta> = {
  // Crops
  wheat: { id: 'wheat', name: 'Wheat', icon: '🌾', category: 'crop', baseValue: 1, isEdibleFeed: true },
  corn: { id: 'corn', name: 'Corn', icon: '🌽', category: 'crop', baseValue: 1, isEdibleFeed: true },
  carrot: { id: 'carrot', name: 'Carrot', icon: '🥕', category: 'crop', baseValue: 3, isEdibleFeed: true },
  strawberry: { id: 'strawberry', name: 'Strawberry', icon: '🍓', category: 'crop', baseValue: 6, isEdibleFeed: true },
  cotton: { id: 'cotton', name: 'Cotton', icon: '🌿', category: 'crop', baseValue: 6, isEdibleFeed: true },
  soybean: { id: 'soybean', name: 'Soybean', icon: '🫛', category: 'crop', baseValue: 8, isEdibleFeed: true },
  pumpkin: { id: 'pumpkin', name: 'Pumpkin', icon: '🎃', category: 'crop', baseValue: 15, isEdibleFeed: true },

  // Forage & Raw Extras
  wild_berries: { id: 'wild_berries', name: 'Wild Berries', icon: '🍇', category: 'forage', baseValue: 8, isEdibleFeed: true },
  honey_comb: { id: 'honey_comb', name: 'Honey Comb', icon: '🍯', category: 'forage', baseValue: 12, isEdibleFeed: false },
  gold_nugget: { id: 'gold_nugget', name: 'Gold Nugget', icon: '⭐', category: 'forage', baseValue: 50, isEdibleFeed: false },

  // Artisan & Manufactured
  feed: { id: 'feed', name: 'Animal Feed', icon: '🫗', category: 'artisan', baseValue: 2, isEdibleFeed: true },
  bread: { id: 'bread', name: 'Bread', icon: '🍞', category: 'artisan', baseValue: 20, isEdibleFeed: false },
  cheese: { id: 'cheese', name: 'Cheese', icon: '🧀', category: 'artisan', baseValue: 25, isEdibleFeed: false },
  pie: { id: 'pie', name: 'Pie', icon: '🥧', category: 'artisan', baseValue: 35, isEdibleFeed: false },
  sweater: { id: 'sweater', name: 'Sweater', icon: '🧥', category: 'artisan', baseValue: 40, isEdibleFeed: false },
  truffle_oil: { id: 'truffle_oil', name: 'Truffle Oil', icon: '🫒', category: 'artisan', baseValue: 50, isEdibleFeed: false },
  yarn: { id: 'yarn', name: 'Yarn', icon: '🧵', category: 'artisan', baseValue: 18, isEdibleFeed: false },
  quilted_blanket: { id: 'quilted_blanket', name: 'Quilted Blanket', icon: '🧶', category: 'artisan', baseValue: 65, isEdibleFeed: false },
  savory_fish_pie: { id: 'savory_fish_pie', name: 'Savory Fish Pie', icon: '🥧', category: 'artisan', baseValue: 55, isEdibleFeed: false },
  crab_bisque: { id: 'crab_bisque', name: 'Crab Bisque', icon: '🍲', category: 'artisan', baseValue: 70, isEdibleFeed: false },
  honey: { id: 'honey', name: 'Honey', icon: '🍯', category: 'artisan', baseValue: 22, isEdibleFeed: false },
  silk: { id: 'silk', name: 'Silk', icon: '🧵', category: 'artisan', baseValue: 30, isEdibleFeed: false },
  rich_butter: { id: 'rich_butter', name: 'Rich Butter', icon: '🧈', category: 'artisan', baseValue: 35, isEdibleFeed: false },
  alpine_cheese: { id: 'alpine_cheese', name: 'Alpine Cheese', icon: '🧀', category: 'artisan', baseValue: 60, isEdibleFeed: false },
  golden_cake: { id: 'golden_cake', name: 'Golden Cake', icon: '🎂', category: 'artisan', baseValue: 120, isEdibleFeed: false },
  merino_sweater: { id: 'merino_sweater', name: 'Merino Sweater', icon: '🧥', category: 'artisan', baseValue: 90, isEdibleFeed: false },
  golden_shawl: { id: 'golden_shawl', name: 'Golden Shawl', icon: '🧣', category: 'artisan', baseValue: 180, isEdibleFeed: false },
  lure_basic: { id: 'lure_basic', name: 'Seed Cluster', icon: '🌾', category: 'artisan', baseValue: 15, isEdibleFeed: false },
  lure_berry: { id: 'lure_berry', name: 'Berry Pastry', icon: '🍓', category: 'artisan', baseValue: 45, isEdibleFeed: false },
  lure_truffle: { id: 'lure_truffle', name: 'Truffle Mash', icon: '🍄', category: 'artisan', baseValue: 80, isEdibleFeed: false },
  lure_nectar: { id: 'lure_nectar', name: 'Ambrosia', icon: '✨', category: 'artisan', baseValue: 200, isEdibleFeed: false },

  // Animal Products
  egg: { id: 'egg', name: 'Egg', icon: '🥚', category: 'animal_product', baseValue: 5, isEdibleFeed: false },
  egg_blue: { id: 'egg_blue', name: 'Blue Egg', icon: '🥚', category: 'animal_product', baseValue: 8, isEdibleFeed: false },
  egg_obsidian: { id: 'egg_obsidian', name: 'Obsidian Egg', icon: '🥚', category: 'animal_product', baseValue: 15, isEdibleFeed: false },
  egg_golden: { id: 'egg_golden', name: 'Golden Egg', icon: '🥚', category: 'animal_product', baseValue: 30, isEdibleFeed: false },
  milk: { id: 'milk', name: 'Milk', icon: '🥛', category: 'animal_product', baseValue: 8, isEdibleFeed: false },
  milk_rich_cream: { id: 'milk_rich_cream', name: 'Rich Cream', icon: '🥛', category: 'animal_product', baseValue: 14, isEdibleFeed: false },
  milk_alpine: { id: 'milk_alpine', name: 'Alpine Milk', icon: '🥛', category: 'animal_product', baseValue: 22, isEdibleFeed: false },
  milk_starlight: { id: 'milk_starlight', name: 'Starlight Milk', icon: '🥛', category: 'animal_product', baseValue: 45, isEdibleFeed: false },
  wool: { id: 'wool', name: 'Wool', icon: '🧶', category: 'animal_product', baseValue: 10, isEdibleFeed: false },
  wool_patterned: { id: 'wool_patterned', name: 'Patterned Wool', icon: '🧶', category: 'animal_product', baseValue: 18, isEdibleFeed: false },
  wool_merino: { id: 'wool_merino', name: 'Merino Wool', icon: '🧶', category: 'animal_product', baseValue: 30, isEdibleFeed: false },
  wool_gilded: { id: 'wool_gilded', name: 'Gilded Wool', icon: '🧶', category: 'animal_product', baseValue: 55, isEdibleFeed: false },
  truffle: { id: 'truffle', name: 'Truffle', icon: '🍄', category: 'animal_product', baseValue: 15, isEdibleFeed: false },
  truffle_white: { id: 'truffle_white', name: 'White Truffle', icon: '🍄', category: 'animal_product', baseValue: 25, isEdibleFeed: false },
  truffle_alba: { id: 'truffle_alba', name: 'Alba Truffle', icon: '🍄', category: 'animal_product', baseValue: 42, isEdibleFeed: false },
  truffle_diamond: { id: 'truffle_diamond', name: 'Diamond Truffle', icon: '🍄', category: 'animal_product', baseValue: 80, isEdibleFeed: false },
  fish: { id: 'fish', name: 'Fish', icon: '🐟', category: 'animal_product', baseValue: 12, isEdibleFeed: false },
  horn_shavings: { id: 'horn_shavings', name: 'Horn Shavings', icon: '🪨', category: 'animal_product', baseValue: 12, isEdibleFeed: false },
  lanolin_balm: { id: 'lanolin_balm', name: 'Lanolin Balm', icon: '🧴', category: 'animal_product', baseValue: 20, isEdibleFeed: false },
  ancient_coin: { id: 'ancient_coin', name: 'Ancient Coin', icon: '🪙', category: 'animal_product', baseValue: 50, isEdibleFeed: false },

  // Frontier Expedition Materials
  scrap_timber: { id: 'scrap_timber', name: 'Scrap Timber', icon: '🪵', category: 'forage', baseValue: 120, isEdibleFeed: false },
  wild_herbs: { id: 'wild_herbs', name: 'Wild Herbs', icon: '🌿', category: 'forage', baseValue: 180, isEdibleFeed: true },
  river_pearl: { id: 'river_pearl', name: 'River Pearl', icon: '🦪', category: 'forage', baseValue: 350, isEdibleFeed: false },
  mountain_slate: { id: 'mountain_slate', name: 'Mountain Slate', icon: '🪨', category: 'forage', baseValue: 450, isEdibleFeed: false },
  fossil_bark: { id: 'fossil_bark', name: 'Fossil Bark', icon: '🍂', category: 'forage', baseValue: 750, isEdibleFeed: false },
  mythical_ore: { id: 'mythical_ore', name: 'Mythical Ore', icon: '🔮', category: 'forage', baseValue: 1800, isEdibleFeed: false },
};

export const SPECIES_FAVORITE_CROPS: Record<string, string[]> = {
  chicken: ['corn', 'wheat', 'strawberry', 'wild_berries', 'feed'],
  cow: ['wheat', 'carrot', 'soybean', 'corn', 'feed'],
  sheep: ['wheat', 'cotton', 'soybean', 'carrot', 'feed'],
  pig: ['carrot', 'pumpkin', 'wild_berries', 'corn', 'feed'],
};

/**
 * Builds the complete list of Barn & Silo items including automation lock states.
 */
export function getAllBarnItems(
  silo: Record<string, number> = {},
  barn: Record<string, number> = {},
  locks: BarnItemLockMap = {}
): BarnItem[] {
  const allIds = new Set([...Object.keys(silo), ...Object.keys(barn), ...Object.keys(ITEM_CATALOG_META)]);
  const items: BarnItem[] = [];

  for (const id of allIds) {
    const meta = ITEM_CATALOG_META[id] || {
      id,
      name: id.replace(/_/g, ' '),
      icon: '📦',
      category: 'crop' as BarnItemCategory,
      baseValue: 1,
      isEdibleFeed: false,
    };

    const qty = (silo[id] || 0) + (barn[id] || 0);
    const lockInfo = locks[id];
    const econProfile = getItemEconomicProfile(id);

    items.push({
      id,
      name: econProfile.name || meta.name,
      icon: econProfile.icon || meta.icon,
      category: meta.category,
      quantity: qty,
      baseValue: econProfile.baseValue,
      formulaDescription: econProfile.formulaDescription,
      breakdownText: econProfile.breakdownText,
      isLockedForWorkers: Boolean(lockInfo?.isLockedForWorkers),
      customReserveThreshold: lockInfo?.customReserveThreshold,
    });
  }

  // Sort by category order (crops first, then forage, artisan, animal products), then by name
  const catOrder: Record<BarnItemCategory, number> = {
    crop: 0,
    forage: 1,
    artisan: 2,
    animal_product: 3,
  };

  return items.sort((a, b) => {
    const cDiff = catOrder[a.category] - catOrder[b.category];
    if (cDiff !== 0) return cDiff;
    return a.name.localeCompare(b.name);
  });
}
