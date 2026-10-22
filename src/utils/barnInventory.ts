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
  // Crops & Agricultural Byproducts
  chaff: { id: 'chaff', name: 'Chaff & Husks', icon: '🌾', category: 'crop', baseValue: 2, isEdibleFeed: true },
  wheat: { id: 'wheat', name: 'Wheat', icon: '🌾', category: 'crop', baseValue: 1, isEdibleFeed: true },
  corn: { id: 'corn', name: 'Corn', icon: '🌽', category: 'crop', baseValue: 1, isEdibleFeed: true },
  carrot: { id: 'carrot', name: 'Carrot', icon: '🥕', category: 'crop', baseValue: 3, isEdibleFeed: true },
  strawberry: { id: 'strawberry', name: 'Strawberry', icon: '🍓', category: 'crop', baseValue: 6, isEdibleFeed: true },
  cotton: { id: 'cotton', name: 'Cotton', icon: '🌿', category: 'crop', baseValue: 6, isEdibleFeed: true },
  soybean: { id: 'soybean', name: 'Soybean', icon: '🫛', category: 'crop', baseValue: 8, isEdibleFeed: true },
  pumpkin: { id: 'pumpkin', name: 'Pumpkin', icon: '🎃', category: 'crop', baseValue: 15, isEdibleFeed: true },

  // Dedicated Quality Crops (Silver / Gold / Prismatic)
  wheat_silver: { id: 'wheat_silver', name: 'Silver Wheat', icon: '🌾✨', category: 'crop', baseValue: 8, isEdibleFeed: true },
  wheat_gold: { id: 'wheat_gold', name: 'Golden Wheat', icon: '🌾⭐', category: 'crop', baseValue: 15, isEdibleFeed: true },
  wheat_prismatic: { id: 'wheat_prismatic', name: 'Prismatic Wheat', icon: '🌾🌈', category: 'crop', baseValue: 30, isEdibleFeed: true },

  corn_silver: { id: 'corn_silver', name: 'Silver Corn', icon: '🌽✨', category: 'crop', baseValue: 8, isEdibleFeed: true },
  corn_gold: { id: 'corn_gold', name: 'Golden Corn', icon: '🌽⭐', category: 'crop', baseValue: 15, isEdibleFeed: true },
  corn_prismatic: { id: 'corn_prismatic', name: 'Prismatic Corn', icon: '🌽🌈', category: 'crop', baseValue: 30, isEdibleFeed: true },

  carrot_silver: { id: 'carrot_silver', name: 'Silver Carrot', icon: '🥕✨', category: 'crop', baseValue: 12, isEdibleFeed: true },
  carrot_gold: { id: 'carrot_gold', name: 'Golden Carrot', icon: '🥕⭐', category: 'crop', baseValue: 22, isEdibleFeed: true },
  carrot_prismatic: { id: 'carrot_prismatic', name: 'Prismatic Carrot', icon: '🥕🌈', category: 'crop', baseValue: 45, isEdibleFeed: true },

  strawberry_silver: { id: 'strawberry_silver', name: 'Silver Strawberry', icon: '🍓✨', category: 'crop', baseValue: 18, isEdibleFeed: true },
  strawberry_gold: { id: 'strawberry_gold', name: 'Golden Strawberry', icon: '🍓⭐', category: 'crop', baseValue: 35, isEdibleFeed: true },
  strawberry_prismatic: { id: 'strawberry_prismatic', name: 'Prismatic Strawberry', icon: '🍓🌈', category: 'crop', baseValue: 75, isEdibleFeed: true },

  soybean_silver: { id: 'soybean_silver', name: 'Silver Soybean', icon: '🫛✨', category: 'crop', baseValue: 20, isEdibleFeed: true },
  soybean_gold: { id: 'soybean_gold', name: 'Golden Soybean', icon: '🫛⭐', category: 'crop', baseValue: 40, isEdibleFeed: true },
  soybean_prismatic: { id: 'soybean_prismatic', name: 'Prismatic Soybean', icon: '🫛🌈', category: 'crop', baseValue: 85, isEdibleFeed: true },

  pumpkin_silver: { id: 'pumpkin_silver', name: 'Silver Pumpkin', icon: '🎃✨', category: 'crop', baseValue: 40, isEdibleFeed: true },
  pumpkin_gold: { id: 'pumpkin_gold', name: 'Golden Pumpkin', icon: '🎃⭐', category: 'crop', baseValue: 75, isEdibleFeed: true },
  pumpkin_prismatic: { id: 'pumpkin_prismatic', name: 'Prismatic Pumpkin', icon: '🎃🌈', category: 'crop', baseValue: 160, isEdibleFeed: true },

  cotton_silver: { id: 'cotton_silver', name: 'Silver Cotton', icon: '🌿✨', category: 'crop', baseValue: 15, isEdibleFeed: true },
  cotton_gold: { id: 'cotton_gold', name: 'Golden Cotton', icon: '🌿⭐', category: 'crop', baseValue: 28, isEdibleFeed: true },
  cotton_prismatic: { id: 'cotton_prismatic', name: 'Prismatic Cotton', icon: '🌿🌈', category: 'crop', baseValue: 60, isEdibleFeed: true },

  wild_berries: { id: 'wild_berries', name: 'Wild Berries', icon: '🍇', category: 'crop', baseValue: 8, isEdibleFeed: true },
  wild_berries_silver: { id: 'wild_berries_silver', name: 'Silver Wild Berries', icon: '🍇✨', category: 'crop', baseValue: 16, isEdibleFeed: true },
  wild_berries_gold: { id: 'wild_berries_gold', name: 'Golden Wild Berries', icon: '🍇⭐', category: 'crop', baseValue: 32, isEdibleFeed: true },
  wild_berries_prismatic: { id: 'wild_berries_prismatic', name: 'Prismatic Wild Berries', icon: '🍇🌈', category: 'crop', baseValue: 70, isEdibleFeed: true },

  // Forage & Raw Extras
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

  // Gourmet Culinary & Quality Artisan
  golden_cornbread: { id: 'golden_cornbread', name: 'Golden Cornbread', icon: '🍞⭐', category: 'artisan', baseValue: 95, isEdibleFeed: false },
  prismatic_berry_tart: { id: 'prismatic_berry_tart', name: 'Prismatic Berry Tart', icon: '🥧🌈', category: 'artisan', baseValue: 260, isEdibleFeed: false },
  glazed_silver_carrots: { id: 'glazed_silver_carrots', name: 'Glazed Silver Carrots', icon: '🥕✨', category: 'artisan', baseValue: 85, isEdibleFeed: false },
  royal_pumpkin_pottage: { id: 'royal_pumpkin_pottage', name: 'Royal Pumpkin Pottage', icon: '🍲👑', category: 'artisan', baseValue: 180, isEdibleFeed: false },
  grand_prismatic_jam: { id: 'grand_prismatic_jam', name: 'Grand Prismatic Jam', icon: '🍯🌈', category: 'artisan', baseValue: 280, isEdibleFeed: false },
  prismatic_silk_tapestry: { id: 'prismatic_silk_tapestry', name: 'Prismatic Silk Tapestry', icon: '🧵🌈', category: 'artisan', baseValue: 350, isEdibleFeed: false },
  silver_woven_quilt: { id: 'silver_woven_quilt', name: 'Silverweave Bedspread', icon: '🧶✨', category: 'artisan', baseValue: 140, isEdibleFeed: false },

  // Gourmet Seafood Masterworks
  crispy_fried_catfish: { id: 'crispy_fried_catfish', name: 'Crispy Fried Catfish', icon: '🐟🌽', category: 'artisan', baseValue: 55, isEdibleFeed: false },
  herb_grilled_trout: { id: 'herb_grilled_trout', name: 'Herb-Grilled Trout', icon: '🐟🌿', category: 'artisan', baseValue: 48, isEdibleFeed: false },
  steamed_mud_crab: { id: 'steamed_mud_crab', name: 'Spiced Steamed Mud Crab', icon: '🦀✨', category: 'artisan', baseValue: 65, isEdibleFeed: false },
  pan_seared_salmon: { id: 'pan_seared_salmon', name: 'Pan-Seared Honey Salmon', icon: '🍣🍯', category: 'artisan', baseValue: 85, isEdibleFeed: false },
  smoked_tuna_steak: { id: 'smoked_tuna_steak', name: 'Smoked Tuna Steak', icon: '🐟🔥', category: 'artisan', baseValue: 95, isEdibleFeed: false },
  golden_trout_meuniere: { id: 'golden_trout_meuniere', name: 'Gilded Trout Meunière', icon: '🐟⭐', category: 'artisan', baseValue: 135, isEdibleFeed: false },
  imperial_sturgeon_caviar: { id: 'imperial_sturgeon_caviar', name: 'Imperial Sturgeon Caviar', icon: '🥣⭐', category: 'artisan', baseValue: 210, isEdibleFeed: false },
  marlin_tartare: { id: 'marlin_tartare', name: 'Grand Marlin Tartare', icon: '🐟👑', category: 'artisan', baseValue: 240, isEdibleFeed: false },
  luminescent_chowder: { id: 'luminescent_chowder', name: 'Luminescent Abyss Chowder', icon: '🍲🌈', category: 'artisan', baseValue: 380, isEdibleFeed: false },

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

  // Prehistoric Frontier Tools
  amber_chisel: { id: 'amber_chisel', name: 'Amber Chisel', icon: '🔨', category: 'artisan', baseValue: 250, isEdibleFeed: false },
  excavation_pickaxe: { id: 'excavation_pickaxe', name: 'Excavation Pickaxe', icon: '⛏️', category: 'artisan', baseValue: 350, isEdibleFeed: false },
  thermal_solvent: { id: 'thermal_solvent', name: 'Thermal Solvent', icon: '🧪', category: 'artisan', baseValue: 400, isEdibleFeed: false },

  // Prehistoric Fossils & Strata Minerals
  fossil_trilobite_carapace: { id: 'fossil_trilobite_carapace', name: 'Intact Trilobite Carapace', icon: '🐚', category: 'forage', baseValue: 600, isEdibleFeed: false },
  amber_meganeura_wing: { id: 'amber_meganeura_wing', name: 'Amber-Encased Giant Wing', icon: '✨', category: 'forage', baseValue: 850, isEdibleFeed: false },
  fossil_arthropleura_plates: { id: 'fossil_arthropleura_plates', name: 'Segmented Exoskeleton Plates', icon: '🧱', category: 'forage', baseValue: 900, isEdibleFeed: false },
  fossil_dimetrodon_spine: { id: 'fossil_dimetrodon_spine', name: 'Mineralized Dorsal Sail Spine', icon: '🦴', category: 'forage', baseValue: 1200, isEdibleFeed: false },
  fossil_titanoboa_vertebra: { id: 'fossil_titanoboa_vertebra', name: 'Petrified Vertebral Column', icon: '🦴', category: 'forage', baseValue: 1600, isEdibleFeed: false },
  cryo_mammoth_tissue: { id: 'cryo_mammoth_tissue', name: 'Cryo-Preserved Core Tissue', icon: '❄️', category: 'forage', baseValue: 2200, isEdibleFeed: false },
  amber_specimen: { id: 'amber_specimen', name: 'Primeval Amber Core', icon: '✨', category: 'forage', baseValue: 300, isEdibleFeed: false },
  mineral_slab: { id: 'mineral_slab', name: 'Fossiliferous Mineral Slab', icon: '🪨', category: 'forage', baseValue: 150, isEdibleFeed: false },

  // Prehistoric Diets
  algae_paste: { id: 'algae_paste', name: 'Algae Paste', icon: '🧪', category: 'artisan', baseValue: 45, isEdibleFeed: true },
  insect_mash: { id: 'insect_mash', name: 'Insect Mash', icon: '🥣', category: 'artisan', baseValue: 60, isEdibleFeed: true },
  crushed_grain_mash: { id: 'crushed_grain_mash', name: 'Crushed Grain Mash', icon: '🌾', category: 'artisan', baseValue: 50, isEdibleFeed: true },
  mountain_hay_bales: { id: 'mountain_hay_bales', name: 'Mountain Hay Bales', icon: '🌾', category: 'artisan', baseValue: 70, isEdibleFeed: true },

  // Prehistoric Harvest Products
  chitin_molt_plates: { id: 'chitin_molt_plates', name: 'Chitin Molt Plates', icon: '🛡️', category: 'animal_product', baseValue: 400, isEdibleFeed: false },
  prismatic_wing_membrane: { id: 'prismatic_wing_membrane', name: 'Prismatic Wing Membranes', icon: '🪽', category: 'animal_product', baseValue: 650, isEdibleFeed: false },
  primeval_humus: { id: 'primeval_humus', name: 'Supercharged Primeval Humus', icon: '🍂', category: 'forage', baseValue: 500, isEdibleFeed: false },
  thermal_scutes: { id: 'thermal_scutes', name: 'Shed Thermal Scutes', icon: '🔥', category: 'animal_product', baseValue: 750, isEdibleFeed: false },
  serpent_slough: { id: 'serpent_slough', name: 'Massive Serpent Slough', icon: '📜', category: 'animal_product', baseValue: 950, isEdibleFeed: false },
  insulated_down_wool: { id: 'insulated_down_wool', name: 'Insulated Down Wool', icon: '🧶', category: 'animal_product', baseValue: 1100, isEdibleFeed: false },

  // Amber Bio-Lab Infrastructure Materials
  fired_hardwood: { id: 'fired_hardwood', name: 'Fired Hardwood', icon: '🪵', category: 'artisan', baseValue: 120, isEdibleFeed: false },
  tempered_glass: { id: 'tempered_glass', name: 'Tempered Glass Panes', icon: '🪟', category: 'artisan', baseValue: 180, isEdibleFeed: false },
  copper_pipes: { id: 'copper_pipes', name: 'Copper Pipes', icon: '🔧', category: 'artisan', baseValue: 220, isEdibleFeed: false },
  geothermal_relics: { id: 'geothermal_relics', name: 'Geothermal Relics', icon: '🏺', category: 'forage', baseValue: 500, isEdibleFeed: false },

  // Workshop Tool, Hardware & Hydraulic Upgrades
  reinforced_sluice_seal: { id: 'reinforced_sluice_seal', name: 'Reinforced Sluice Gate Seal', icon: '🛡️🔧', category: 'artisan', baseValue: 180, isEdibleFeed: false },
  hardened_chitin_trowel: { id: 'hardened_chitin_trowel', name: 'Hardened Chitin Trowel', icon: '⛏️✨', category: 'artisan', baseValue: 320, isEdibleFeed: false },
  subsoil_aquifer_casing: { id: 'subsoil_aquifer_casing', name: 'Subsoil Aquifer Casing', icon: '🏗️💧', category: 'artisan', baseValue: 650, isEdibleFeed: false },
  prismatic_light_lens: { id: 'prismatic_light_lens', name: 'Prismatic Light Lens', icon: '🔍🌈', category: 'artisan', baseValue: 850, isEdibleFeed: false },
  thermal_retaining_core: { id: 'thermal_retaining_core', name: 'Thermal Retaining Core', icon: '🔥💎', category: 'artisan', baseValue: 950, isEdibleFeed: false },
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
