import { WorkerRole } from '@/game/data';
import { SpecialistWorkerId } from '@/data/workerCatalog';

export type FoodCategory = 'crop' | 'dairy' | 'protein' | 'meal';
export type MoraleTier = 'inspired' | 'content' | 'grumbling' | 'striking' | 'deserted' | 'sabbatical';

export interface WorkerUpkeepConfig {
  roleOrId: string;
  name: string;
  emoji: string;
  baseDailyWage: number;
  dietaryCategory: FoodCategory;
  dietaryUnits: number;
  favoriteRecipe: string;
  favoriteRecipeName: string;
  favoriteRecipeEmoji: string;
  isSpecialist?: boolean;
}

export interface FoodItemMeta {
  id: string;
  name: string;
  icon: string;
  category: FoodCategory;
  categoryLabel: string;
}

// 1. Edible Items Registered in the Commissary Pantry
export const COMMISSARY_FOOD_ITEMS: Record<string, FoodItemMeta> = {
  // Raw Standard Crops
  wheat: { id: 'wheat', name: 'Wheat', icon: '🌾', category: 'crop', categoryLabel: 'Crops' },
  corn: { id: 'corn', name: 'Corn', icon: '🌽', category: 'crop', categoryLabel: 'Crops' },
  carrot: { id: 'carrot', name: 'Carrot', icon: '🥕', category: 'crop', categoryLabel: 'Crops' },
  strawberry: { id: 'strawberry', name: 'Strawberry', icon: '🍓', category: 'crop', categoryLabel: 'Crops' },
  soybean: { id: 'soybean', name: 'Soybean', icon: '🫛', category: 'crop', categoryLabel: 'Crops' },
  pumpkin: { id: 'pumpkin', name: 'Pumpkin', icon: '🎃', category: 'crop', categoryLabel: 'Crops' },
  cotton: { id: 'cotton', name: 'Cotton', icon: '🌿', category: 'crop', categoryLabel: 'Crops' },
  wild_berries: { id: 'wild_berries', name: 'Wild Berries', icon: '🍇', category: 'crop', categoryLabel: 'Crops' },
  honey_comb: { id: 'honey_comb', name: 'Honey Comb', icon: '🍯', category: 'crop', categoryLabel: 'Crops' },

  // Dedicated Quality Harvest Crops (Silver / Gold / Prismatic)
  wheat_silver: { id: 'wheat_silver', name: 'Silver Wheat', icon: '🌾✨', category: 'crop', categoryLabel: 'Quality Crops' },
  wheat_gold: { id: 'wheat_gold', name: 'Golden Wheat', icon: '🌾⭐', category: 'crop', categoryLabel: 'Quality Crops' },
  wheat_prismatic: { id: 'wheat_prismatic', name: 'Prismatic Wheat', icon: '🌾🌈', category: 'crop', categoryLabel: 'Quality Crops' },
  corn_silver: { id: 'corn_silver', name: 'Silver Corn', icon: '🌽✨', category: 'crop', categoryLabel: 'Quality Crops' },
  corn_gold: { id: 'corn_gold', name: 'Golden Corn', icon: '🌽⭐', category: 'crop', categoryLabel: 'Quality Crops' },
  corn_prismatic: { id: 'corn_prismatic', name: 'Prismatic Corn', icon: '🌽🌈', category: 'crop', categoryLabel: 'Quality Crops' },
  carrot_silver: { id: 'carrot_silver', name: 'Silver Carrot', icon: '🥕✨', category: 'crop', categoryLabel: 'Quality Crops' },
  carrot_gold: { id: 'carrot_gold', name: 'Golden Carrot', icon: '🥕⭐', category: 'crop', categoryLabel: 'Quality Crops' },
  carrot_prismatic: { id: 'carrot_prismatic', name: 'Prismatic Carrot', icon: '🥕🌈', category: 'crop', categoryLabel: 'Quality Crops' },
  strawberry_silver: { id: 'strawberry_silver', name: 'Silver Strawberry', icon: '🍓✨', category: 'crop', categoryLabel: 'Quality Crops' },
  strawberry_gold: { id: 'strawberry_gold', name: 'Golden Strawberry', icon: '🍓⭐', category: 'crop', categoryLabel: 'Quality Crops' },
  strawberry_prismatic: { id: 'strawberry_prismatic', name: 'Prismatic Strawberry', icon: '🍓🌈', category: 'crop', categoryLabel: 'Quality Crops' },
  soybean_silver: { id: 'soybean_silver', name: 'Silver Soybean', icon: '🫛✨', category: 'crop', categoryLabel: 'Quality Crops' },
  soybean_gold: { id: 'soybean_gold', name: 'Golden Soybean', icon: '🫛⭐', category: 'crop', categoryLabel: 'Quality Crops' },
  soybean_prismatic: { id: 'soybean_prismatic', name: 'Prismatic Soybean', icon: '🫛🌈', category: 'crop', categoryLabel: 'Quality Crops' },
  pumpkin_silver: { id: 'pumpkin_silver', name: 'Silver Pumpkin', icon: '🎃✨', category: 'crop', categoryLabel: 'Quality Crops' },
  pumpkin_gold: { id: 'pumpkin_gold', name: 'Golden Pumpkin', icon: '🎃⭐', category: 'crop', categoryLabel: 'Quality Crops' },
  pumpkin_prismatic: { id: 'pumpkin_prismatic', name: 'Prismatic Pumpkin', icon: '🎃🌈', category: 'crop', categoryLabel: 'Quality Crops' },

  // Dairy Products & Cheeses
  milk: { id: 'milk', name: 'Milk', icon: '🥛', category: 'dairy', categoryLabel: 'Dairy' },
  milk_rich_cream: { id: 'milk_rich_cream', name: 'Rich Cream', icon: '🥛', category: 'dairy', categoryLabel: 'Dairy' },
  milk_alpine: { id: 'milk_alpine', name: 'Alpine Milk', icon: '🥛', category: 'dairy', categoryLabel: 'Dairy' },
  milk_starlight: { id: 'milk_starlight', name: 'Starlight Milk', icon: '🥛', category: 'dairy', categoryLabel: 'Dairy' },
  rich_butter: { id: 'rich_butter', name: 'Rich Butter', icon: '🧈', category: 'dairy', categoryLabel: 'Dairy' },
  cheese: { id: 'cheese', name: 'Farmstead Cheese', icon: '🧀', category: 'dairy', categoryLabel: 'Dairy' },
  alpine_cheese: { id: 'alpine_cheese', name: 'Alpine Cheese', icon: '🧀', category: 'dairy', categoryLabel: 'Dairy' },

  // Animal Protein & Fishery Catches
  egg: { id: 'egg', name: 'Egg', icon: '🥚', category: 'protein', categoryLabel: 'Protein' },
  egg_blue: { id: 'egg_blue', name: 'Blue Egg', icon: '🥚', category: 'protein', categoryLabel: 'Protein' },
  egg_obsidian: { id: 'egg_obsidian', name: 'Obsidian Egg', icon: '🥚', category: 'protein', categoryLabel: 'Protein' },
  egg_golden: { id: 'egg_golden', name: 'Golden Egg', icon: '🥚', category: 'protein', categoryLabel: 'Protein' },
  fish: { id: 'fish', name: 'Common Fish', icon: '🐟', category: 'protein', categoryLabel: 'Protein' },
  catfish: { id: 'catfish', name: 'Catfish', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  trout: { id: 'trout', name: 'Trout', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  mud_crab: { id: 'mud_crab', name: 'Mud Crab', icon: '🦀', category: 'protein', categoryLabel: 'Fishery Protein' },
  salmon: { id: 'salmon', name: 'Salmon', icon: '🍣', category: 'protein', categoryLabel: 'Fishery Protein' },
  tuna: { id: 'tuna', name: 'Tuna', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  golden_trout: { id: 'golden_trout', name: 'Golden Trout', icon: '🐟⭐', category: 'protein', categoryLabel: 'Fishery Protein' },
  sturgeon: { id: 'sturgeon', name: 'Sturgeon', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  marlin: { id: 'marlin', name: 'Marlin', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  lanternfish: { id: 'lanternfish', name: 'Lanternfish', icon: '🐡', category: 'protein', categoryLabel: 'Fishery Protein' },
  perch: { id: 'perch', name: 'Perch', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  bass: { id: 'bass', name: 'Bass', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  snapper: { id: 'snapper', name: 'Snapper', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  barramundi: { id: 'barramundi', name: 'Barramundi', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  arctic_char: { id: 'arctic_char', name: 'Arctic Char', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  carp: { id: 'carp', name: 'Carp', icon: '🐟', category: 'protein', categoryLabel: 'Fishery Protein' },
  truffle: { id: 'truffle', name: 'Truffle', icon: '🍄', category: 'protein', categoryLabel: 'Protein' },
  truffle_white: { id: 'truffle_white', name: 'White Truffle', icon: '🍄', category: 'protein', categoryLabel: 'Protein' },
  truffle_alba: { id: 'truffle_alba', name: 'Alba Truffle', icon: '🍄', category: 'protein', categoryLabel: 'Protein' },
  truffle_diamond: { id: 'truffle_diamond', name: 'Diamond Truffle', icon: '🍄', category: 'protein', categoryLabel: 'Protein' },

  // Prepared Kitchen Meals, Bakery Confections & Gourmet Seafood
  bread: { id: 'bread', name: 'Bread', icon: '🍞', category: 'meal', categoryLabel: 'Bakery' },
  pie: { id: 'pie', name: 'Fruit Pie', icon: '🥧', category: 'meal', categoryLabel: 'Bakery' },
  savory_fish_pie: { id: 'savory_fish_pie', name: 'Savory Fish Pie', icon: '🥧', category: 'meal', categoryLabel: 'Bakery' },
  crab_bisque: { id: 'crab_bisque', name: 'Crab Bisque', icon: '🍲', category: 'meal', categoryLabel: 'Culinary Soup' },
  golden_cake: { id: 'golden_cake', name: 'Golden Cake', icon: '🎂', category: 'meal', categoryLabel: 'Bakery' },
  honey: { id: 'honey', name: 'Raw Honey', icon: '🍯', category: 'meal', categoryLabel: 'Preserves' },
  citrus_tea: { id: 'citrus_tea', name: 'Citrus Herb Tea', icon: '🍵', category: 'meal', categoryLabel: 'Beverages' },
  golden_cornbread: { id: 'golden_cornbread', name: 'Golden Cornbread', icon: '🍞⭐', category: 'meal', categoryLabel: 'Bakery' },
  prismatic_berry_tart: { id: 'prismatic_berry_tart', name: 'Prismatic Berry Tart', icon: '🥧🌈', category: 'meal', categoryLabel: 'Bakery' },
  glazed_silver_carrots: { id: 'glazed_silver_carrots', name: 'Glazed Silver Carrots', icon: '🥕✨', category: 'meal', categoryLabel: 'Kitchen Gourmet' },
  royal_pumpkin_pottage: { id: 'royal_pumpkin_pottage', name: 'Royal Pumpkin Pottage', icon: '🍲👑', category: 'meal', categoryLabel: 'Kitchen Gourmet' },
  grand_prismatic_jam: { id: 'grand_prismatic_jam', name: 'Grand Prismatic Jam', icon: '🍯🌈', category: 'meal', categoryLabel: 'Preserves' },
  crispy_fried_catfish: { id: 'crispy_fried_catfish', name: 'Crispy Fried Catfish', icon: '🐟🌽', category: 'meal', categoryLabel: 'Seafood Kitchen' },
  herb_grilled_trout: { id: 'herb_grilled_trout', name: 'Herb-Grilled Trout', icon: '🐟🌿', category: 'meal', categoryLabel: 'Seafood Kitchen' },
  steamed_mud_crab: { id: 'steamed_mud_crab', name: 'Spiced Steamed Mud Crab', icon: '🦀✨', category: 'meal', categoryLabel: 'Seafood Kitchen' },
  pan_seared_salmon: { id: 'pan_seared_salmon', name: 'Pan-Seared Honey Salmon', icon: '🍣🍯', category: 'meal', categoryLabel: 'Seafood Kitchen' },
  smoked_tuna_steak: { id: 'smoked_tuna_steak', name: 'Smoked Tuna Steak', icon: '🐟🔥', category: 'meal', categoryLabel: 'Seafood Kitchen' },
  golden_trout_meuniere: { id: 'golden_trout_meuniere', name: 'Gilded Trout Meunière', icon: '🐟⭐', category: 'meal', categoryLabel: 'Seafood Kitchen' },
  imperial_sturgeon_caviar: { id: 'imperial_sturgeon_caviar', name: 'Imperial Sturgeon Caviar', icon: '🥣⭐', category: 'meal', categoryLabel: 'Seafood Kitchen' },
  marlin_tartare: { id: 'marlin_tartare', name: 'Grand Marlin Tartare', icon: '🐟👑', category: 'meal', categoryLabel: 'Seafood Kitchen' },
  luminescent_chowder: { id: 'luminescent_chowder', name: 'Luminescent Abyss Chowder', icon: '🍲🌈', category: 'meal', categoryLabel: 'Seafood Kitchen' },
  lure_berry: { id: 'lure_berry', name: 'Glazed Berry Pastry', icon: '🍓✨', category: 'meal', categoryLabel: 'Bakery' },
  lure_truffle: { id: 'lure_truffle', name: 'Aromatic Truffle Mash', icon: '🍄✨', category: 'meal', categoryLabel: 'Kitchen Gourmet' },
  lure_nectar: { id: 'lure_nectar', name: 'Celestial Ambrosia', icon: '✨', category: 'meal', categoryLabel: 'Kitchen Gourmet' },
  lure_basic: { id: 'lure_basic', name: 'Sweet Seed Cluster', icon: '🌾', category: 'meal', categoryLabel: 'Snacks' },
};

// 2. Upkeep configurations for all workers
export const WORKER_UPKEEP_ROSTER: Record<string, WorkerUpkeepConfig> = {
  // Division A: Farmhands
  farmer: {
    roleOrId: 'farmer',
    name: 'Field Hand',
    emoji: '👨‍🌾',
    baseDailyWage: 12,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'bread',
    favoriteRecipeName: 'Fresh Bread',
    favoriteRecipeEmoji: '🍞',
  },
  herder: {
    roleOrId: 'herder',
    name: 'Livestock Rancher',
    emoji: '🤠',
    baseDailyWage: 16,
    dietaryCategory: 'dairy',
    dietaryUnits: 1,
    favoriteRecipe: 'alpine_cheese',
    favoriteRecipeName: 'Aged Alpine Cheese',
    favoriteRecipeEmoji: '🧀',
  },
  lumberjack: {
    roleOrId: 'lumberjack',
    name: 'Timberjack',
    emoji: '🪓',
    baseDailyWage: 14,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'golden_cornbread',
    favoriteRecipeName: 'Golden Cornbread',
    favoriteRecipeEmoji: '🍞⭐',
  },
  fisherman: {
    roleOrId: 'fisherman',
    name: 'Dock Master',
    emoji: '🎣',
    baseDailyWage: 18,
    dietaryCategory: 'protein',
    dietaryUnits: 1,
    favoriteRecipe: 'herb_grilled_trout',
    favoriteRecipeName: 'Herb-Grilled Trout',
    favoriteRecipeEmoji: '🐟🌿',
  },
  artisan: {
    roleOrId: 'artisan',
    name: 'Guild Craftsman',
    emoji: '🧑‍🎨',
    baseDailyWage: 22,
    dietaryCategory: 'meal',
    dietaryUnits: 1,
    favoriteRecipe: 'prismatic_berry_tart',
    favoriteRecipeName: 'Prismatic Berry Tart',
    favoriteRecipeEmoji: '🥧🌈',
  },

  // Division B: Feed Millers
  feed_miller_wheat: {
    roleOrId: 'feed_miller_wheat',
    name: 'Grain Feed Miller',
    emoji: '🌾',
    baseDailyWage: 14,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'bread',
    favoriteRecipeName: 'Wheat Loaf',
    favoriteRecipeEmoji: '🍞',
  },
  feed_miller_corn: {
    roleOrId: 'feed_miller_corn',
    name: 'Corn Feed Miller',
    emoji: '🌽',
    baseDailyWage: 16,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'golden_cornbread',
    favoriteRecipeName: 'Golden Cornbread',
    favoriteRecipeEmoji: '🍞⭐',
  },
  feed_miller_carrot: {
    roleOrId: 'feed_miller_carrot',
    name: 'Carrot Feed Miller',
    emoji: '🥕',
    baseDailyWage: 18,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'glazed_silver_carrots',
    favoriteRecipeName: 'Glazed Silver Carrots',
    favoriteRecipeEmoji: '🥕✨',
  },
  feed_miller_soy: {
    roleOrId: 'feed_miller_soy',
    name: 'Soy Protein Miller',
    emoji: '🫘',
    baseDailyWage: 20,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'savory_fish_pie',
    favoriteRecipeName: 'Protein Pie',
    favoriteRecipeEmoji: '🥧',
  },

  // Division C: Autonomous Specialists
  auto_fisherman: {
    roleOrId: 'auto_fisherman',
    name: 'Automated Trawler',
    emoji: '🎣',
    baseDailyWage: 22,
    dietaryCategory: 'protein',
    dietaryUnits: 1,
    favoriteRecipe: 'crispy_fried_catfish',
    favoriteRecipeName: 'Crispy Fried Catfish',
    favoriteRecipeEmoji: '🐟🌽',
  },
  beekeeper: {
    roleOrId: 'beekeeper',
    name: 'Apiary Tender',
    emoji: '🍯',
    baseDailyWage: 25,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'grand_prismatic_jam',
    favoriteRecipeName: 'Grand Prismatic Jam',
    favoriteRecipeEmoji: '🍯🌈',
  },
  forager: {
    roleOrId: 'forager',
    name: 'Wilderness Scout',
    emoji: '🍇',
    baseDailyWage: 24,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'lure_berry',
    favoriteRecipeName: 'Glazed Berry Pastry',
    favoriteRecipeEmoji: '🍓✨',
  },
  merchant: {
    roleOrId: 'merchant',
    name: 'Roadside Peddler',
    emoji: '💰',
    baseDailyWage: 30,
    dietaryCategory: 'meal',
    dietaryUnits: 1,
    favoriteRecipe: 'imperial_sturgeon_caviar',
    favoriteRecipeName: 'Imperial Sturgeon Caviar',
    favoriteRecipeEmoji: '🥣⭐',
  },
  prospector: {
    roleOrId: 'prospector',
    name: 'Quarry Miner',
    emoji: '⛏️',
    baseDailyWage: 35,
    dietaryCategory: 'protein',
    dietaryUnits: 1,
    favoriteRecipe: 'pan_seared_salmon',
    favoriteRecipeName: 'Pan-Seared Honey Salmon',
    favoriteRecipeEmoji: '🍣🍯',
  },

  // Division D: Utility Specialists
  alchemist: {
    roleOrId: 'alchemist',
    name: 'Botanical Synthesizer',
    emoji: '⚗️',
    baseDailyWage: 32,
    dietaryCategory: 'meal',
    dietaryUnits: 1,
    favoriteRecipe: 'lure_nectar',
    favoriteRecipeName: 'Celestial Ambrosia',
    favoriteRecipeEmoji: '✨',
  },
  barn_overseer: {
    roleOrId: 'barn_overseer',
    name: 'Quartermaster',
    emoji: '📦',
    baseDailyWage: 28,
    dietaryCategory: 'dairy',
    dietaryUnits: 1,
    favoriteRecipe: 'alpine_cheese',
    favoriteRecipeName: 'Reserve Alpine Cheese',
    favoriteRecipeEmoji: '🧀',
  },
  cellar_ager: {
    roleOrId: 'cellar_ager',
    name: 'Vintage Sommelier',
    emoji: '🍷',
    baseDailyWage: 36,
    dietaryCategory: 'meal',
    dietaryUnits: 1,
    favoriteRecipe: 'royal_pumpkin_pottage',
    favoriteRecipeName: 'Royal Pumpkin Pottage',
    favoriteRecipeEmoji: '🍲👑',
  },
  tinkerer: {
    roleOrId: 'tinkerer',
    name: 'Machinist',
    emoji: '🔧',
    baseDailyWage: 40,
    dietaryCategory: 'meal',
    dietaryUnits: 1,
    favoriteRecipe: 'steamed_mud_crab',
    favoriteRecipeName: 'Spiced Steamed Mud Crab',
    favoriteRecipeEmoji: '🦀✨',
  },

  // Specialist Contract Staff
  worker_caravaner_orin: {
    roleOrId: 'worker_caravaner_orin',
    name: 'Orin the Trailrunner',
    emoji: '🚜',
    baseDailyWage: 25,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'golden_cornbread',
    favoriteRecipeName: 'Trail Cornbread',
    favoriteRecipeEmoji: '🍞⭐',
    isSpecialist: true,
  },
  worker_wrangler_tessa: {
    roleOrId: 'worker_wrangler_tessa',
    name: 'Tessa the Gentle',
    emoji: '🌾',
    baseDailyWage: 30,
    dietaryCategory: 'dairy',
    dietaryUnits: 1,
    favoriteRecipe: 'cheese',
    favoriteRecipeName: 'Fresh Cottage Cheese',
    favoriteRecipeEmoji: '🧀',
    isSpecialist: true,
  },
  worker_stablemaster_elric: {
    roleOrId: 'worker_stablemaster_elric',
    name: 'Master Elric',
    emoji: '🧬',
    baseDailyWage: 40,
    dietaryCategory: 'meal',
    dietaryUnits: 1,
    favoriteRecipe: 'luminescent_chowder',
    favoriteRecipeName: 'Luminescent Abyss Chowder',
    favoriteRecipeEmoji: '🍲🌈',
    isSpecialist: true,
  },
  worker_feedmaster_barnaby: {
    roleOrId: 'worker_feedmaster_barnaby',
    name: 'Barnaby the Feed Master',
    emoji: '🥣',
    baseDailyWage: 28,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'prismatic_berry_tart',
    favoriteRecipeName: 'Prismatic Berry Tart',
    favoriteRecipeEmoji: '🥧🌈',
    isSpecialist: true,
  },
};

// 3. Guild Overhead Tax Scaler
export function getGuildTaxRate(activeStaffCount: number): number {
  if (activeStaffCount <= 2) return 0.0;
  if (activeStaffCount <= 4) return 0.15;
  if (activeStaffCount <= 6) return 0.35;
  return 0.60;
}

// 4. Morale speed multiplier
export function getMoraleSpeedMultiplier(morale?: MoraleTier): number {
  switch (morale) {
    case 'inspired':
      return 1.2;
    case 'grumbling':
      return 0.5;
    case 'striking':
    case 'deserted':
      return 0.0;
    case 'content':
    default:
      return 1.0;
  }
}

// 5. Category icons and titles
export const FOOD_CATEGORY_INFO: Record<FoodCategory, { label: string; icon: string; bg: string; text: string }> = {
  crop: { label: 'Raw Crops', icon: '🌾', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
  dairy: { label: 'Dairy', icon: '🥛', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400' },
  protein: { label: 'Protein', icon: '🥚', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400' },
  meal: { label: 'Kitchen Meals', icon: '🍞', bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400' },
};

// 6. Upkeep Telemetry and Calculations
export interface StaffUpkeepTelemetry {
  activeStaffCount: number;
  baseDailyPayroll: number;
  guildTaxRate: number;
  guildTaxAmount: number;
  totalDailyWageBurn: number;
  dailyFoodDemands: Record<FoodCategory, number>;
  totalDailyFoodUnits: number;
  stagedCoins: number;
  coinRunwayDays: number;
  stagedFoodUnitsByCategory: Record<FoodCategory, number>;
  totalStagedFoodUnits: number;
  foodRunwayDays: number;
  limitingFactor: 'coins' | 'food' | 'balanced' | 'none';
  operationalRunwayDays: number;
  workerUpkeeps: Record<string, {
    config: WorkerUpkeepConfig;
    isHired: boolean;
    isActive: boolean;
    isPaused?: boolean;
    isWageSecured: boolean;
    isRationAvailable: boolean;
    isFavoriteInPantry: boolean;
    morale: MoraleTier;
    missedCycles: number;
  }>;
}

export function calculateStaffUpkeep(
  unifiedWorkers: Record<string, any> = {},
  specialistWorkers: Record<string, any> = {},
  payrollVaultCoins: number = 0,
  staffPantry: Record<string, number> = {}
): StaffUpkeepTelemetry {
  const workerUpkeeps: StaffUpkeepTelemetry['workerUpkeeps'] = {};
  let baseDailyPayroll = 0;
  let activeStaffCount = 0;

  const dailyFoodDemands: Record<FoodCategory, number> = {
    crop: 0,
    dairy: 0,
    protein: 0,
    meal: 0,
  };

  // Count staged food units per category
  const stagedFoodUnitsByCategory: Record<FoodCategory, number> = {
    crop: 0,
    dairy: 0,
    protein: 0,
    meal: 0,
  };
  let totalStagedFoodUnits = 0;

  for (const [itemId, qty] of Object.entries(staffPantry)) {
    if (qty > 0 && COMMISSARY_FOOD_ITEMS[itemId]) {
      const cat = COMMISSARY_FOOD_ITEMS[itemId].category;
      stagedFoodUnitsByCategory[cat] += qty;
      totalStagedFoodUnits += qty;
    }
  }

  // Evaluate all workers in the upkeep roster
  for (const [id, config] of Object.entries(WORKER_UPKEEP_ROSTER)) {
    let isHired = false;
    let isActive = false;
    let isPaused = false;
    let morale: MoraleTier = 'content';
    let missedCycles = 0;

    if (config.isSpecialist) {
      const sp = specialistWorkers[id];
      if (sp) {
        isHired = Boolean(sp.isHired);
        isActive = Boolean(sp.isActive);
        isPaused = !sp.isActive;
        morale = sp.moraleTier || (sp.isStriking ? 'striking' : 'content');
        missedCycles = sp.missedCycles || 0;
      }
    } else {
      const uw = unifiedWorkers[id];
      if (uw) {
        isHired = Boolean(uw.isHired);
        isActive = Boolean(uw.isHired && !uw.isPaused);
        isPaused = Boolean(uw.isPaused);
        morale = uw.moraleTier || 'content';
        missedCycles = uw.missedCycles || 0;
      }
    }

    if (isHired && isActive) {
      activeStaffCount += 1;
      baseDailyPayroll += config.baseDailyWage;
      dailyFoodDemands[config.dietaryCategory] += config.dietaryUnits;
    }

    const hasFav = (staffPantry[config.favoriteRecipe] || 0) > 0;
    const hasCategoryFood = stagedFoodUnitsByCategory[config.dietaryCategory] > 0;
    const hasAnyMeal = stagedFoodUnitsByCategory['meal'] > 0;

    workerUpkeeps[id] = {
      config,
      isHired,
      isActive,
      isPaused,
      isWageSecured: false, // Calculated after tax
      isRationAvailable: hasCategoryFood || hasFav || hasAnyMeal,
      isFavoriteInPantry: hasFav,
      morale,
      missedCycles,
    };
  }

  // Guild Tax Scaler
  const guildTaxRate = getGuildTaxRate(activeStaffCount);
  const guildTaxAmount = Math.round(baseDailyPayroll * guildTaxRate);
  const totalDailyWageBurn = baseDailyPayroll + guildTaxAmount;

  // Update per-worker wage security
  let remainingSimulatedCoins = payrollVaultCoins;
  for (const id of Object.keys(workerUpkeeps)) {
    const w = workerUpkeeps[id];
    if (w.isHired && w.isActive) {
      const workerWageCost = Math.round(w.config.baseDailyWage * (1 + guildTaxRate));
      if (remainingSimulatedCoins >= workerWageCost) {
        w.isWageSecured = true;
        remainingSimulatedCoins -= workerWageCost;
      } else {
        w.isWageSecured = false;
      }
    }
  }

  // Coin runway
  const coinRunwayDays = totalDailyWageBurn > 0
    ? Number((payrollVaultCoins / totalDailyWageBurn).toFixed(1))
    : Infinity;

  // Food runway
  let totalDailyFoodUnits = 0;
  let minCategoryFoodRunway = Infinity;
  let hasFoodDemand = false;

  for (const cat of ['crop', 'dairy', 'protein', 'meal'] as FoodCategory[]) {
    const demand = dailyFoodDemands[cat];
    totalDailyFoodUnits += demand;
    if (demand > 0) {
      hasFoodDemand = true;
      const catRunway = stagedFoodUnitsByCategory[cat] / demand;
      if (catRunway < minCategoryFoodRunway) {
        minCategoryFoodRunway = catRunway;
      }
    }
  }

  const foodRunwayDays = hasFoodDemand
    ? Number(minCategoryFoodRunway.toFixed(1))
    : Infinity;

  // Limiting Factor
  let limitingFactor: StaffUpkeepTelemetry['limitingFactor'] = 'none';
  let operationalRunwayDays = 0;

  if (activeStaffCount === 0) {
    limitingFactor = 'none';
    operationalRunwayDays = Infinity;
  } else if (!isFinite(coinRunwayDays) && !isFinite(foodRunwayDays)) {
    limitingFactor = 'balanced';
    operationalRunwayDays = Infinity;
  } else if (coinRunwayDays < foodRunwayDays) {
    limitingFactor = 'coins';
    operationalRunwayDays = coinRunwayDays;
  } else if (foodRunwayDays < coinRunwayDays) {
    limitingFactor = 'food';
    operationalRunwayDays = foodRunwayDays;
  } else {
    limitingFactor = 'balanced';
    operationalRunwayDays = coinRunwayDays;
  }

  return {
    activeStaffCount,
    baseDailyPayroll,
    guildTaxRate,
    guildTaxAmount,
    totalDailyWageBurn,
    dailyFoodDemands,
    totalDailyFoodUnits,
    stagedCoins: payrollVaultCoins,
    coinRunwayDays,
    stagedFoodUnitsByCategory,
    totalStagedFoodUnits,
    foodRunwayDays,
    limitingFactor,
    operationalRunwayDays: isFinite(operationalRunwayDays) ? operationalRunwayDays : 999,
    workerUpkeeps,
  };
}

// 7. Settlement Cycle Execution (Strict Isolation: Deducts strictly from staging buffers)
export function processUpkeepSettlement(params: {
  unifiedWorkers: Record<string, any>;
  specialistWorkers: Record<string, any>;
  payrollVaultCoins: number;
  staffPantry: Record<string, number>;
}): {
  payrollVaultCoins: number;
  staffPantry: Record<string, number>;
  updatedUnifiedWorkers: Record<string, any>;
  updatedSpecialistWorkers: Record<string, any>;
  paidCount: number;
  strikeCount: number;
  inspiredCount: number;
  grumblingCount: number;
  desertedWorkers: string[];
} {
  let { payrollVaultCoins, staffPantry } = params;
  const updatedUnifiedWorkers = { ...params.unifiedWorkers };
  const updatedSpecialistWorkers = { ...params.specialistWorkers };
  const updatedPantry = { ...staffPantry };

  // Determine active workers
  const activeEntries: { id: string; config: WorkerUpkeepConfig; isSpecialist: boolean }[] = [];
  for (const [id, config] of Object.entries(WORKER_UPKEEP_ROSTER)) {
    if (config.isSpecialist) {
      const sp = updatedSpecialistWorkers[id];
      if (sp && sp.isHired && sp.isActive) {
        activeEntries.push({ id, config, isSpecialist: true });
      }
    } else {
      const uw = updatedUnifiedWorkers[id];
      if (uw && uw.isHired && !uw.isPaused) {
        activeEntries.push({ id, config, isSpecialist: false });
      }
    }
  }

  const taxRate = getGuildTaxRate(activeEntries.length);
  let paidCount = 0;
  let inspiredCount = 0;
  let grumblingCount = 0;
  let strikeCount = 0;
  const desertedWorkers: string[] = [];

  for (const entry of activeEntries) {
    const { id, config, isSpecialist } = entry;
    const workerWageCost = Math.round(config.baseDailyWage * (1 + taxRate));

    const canAffordWage = payrollVaultCoins >= workerWageCost;

    // Check food: favorite dish or any item in category
    let canAffordFood = false;
    let isFavoriteFed = false;
    let chosenFoodId: string | null = null;

    if ((updatedPantry[config.favoriteRecipe] || 0) > 0) {
      canAffordFood = true;
      isFavoriteFed = true;
      chosenFoodId = config.favoriteRecipe;
    } else {
      // 1. Try matching dietary category first
      for (const [fId, qty] of Object.entries(updatedPantry)) {
        if (qty > 0 && COMMISSARY_FOOD_ITEMS[fId]?.category === config.dietaryCategory) {
          canAffordFood = true;
          chosenFoodId = fId;
          break;
        }
      }
      // 2. Luxury fallback: any prepared kitchen meal or delicacy can feed staff
      if (!canAffordFood) {
        for (const [fId, qty] of Object.entries(updatedPantry)) {
          if (qty > 0 && COMMISSARY_FOOD_ITEMS[fId]?.category === 'meal') {
            canAffordFood = true;
            chosenFoodId = fId;
            break;
          }
        }
      }
    }

    const currentWorker = isSpecialist ? updatedSpecialistWorkers[id] : updatedUnifiedWorkers[id];
    let missed = currentWorker?.missedCycles || 0;
    let morale: MoraleTier = currentWorker?.moraleTier || 'content';
    let isStriking = false;
    let isHired = true;
    let isActive = isSpecialist ? currentWorker?.isActive ?? true : true;

    if (canAffordWage && canAffordFood) {
      // Both wage and ration satisfied
      payrollVaultCoins -= workerWageCost;
      if (chosenFoodId) {
        updatedPantry[chosenFoodId] = Math.max(0, (updatedPantry[chosenFoodId] || 1) - 1);
        if (updatedPantry[chosenFoodId] === 0) {
          delete updatedPantry[chosenFoodId];
        }
      }

      missed = 0;
      morale = isFavoriteFed ? 'inspired' : 'content';
      isStriking = false;
      paidCount += 1;
      if (isFavoriteFed) inspiredCount += 1;
    } else {
      // Shortfall: deduct partial coin if available
      if (canAffordWage) {
        payrollVaultCoins -= workerWageCost;
      }

      missed += 1;
      if (missed === 1) {
        morale = 'grumbling';
        grumblingCount += 1;
      } else if (missed >= 2 && missed < 4) {
        morale = 'striking';
        isStriking = true;
        strikeCount += 1;
      } else if (missed >= 4) {
        morale = 'deserted';
        isStriking = true;
        isHired = false;
        isActive = false;
        desertedWorkers.push(config.name);
      }
    }

    if (isSpecialist) {
      updatedSpecialistWorkers[id] = {
        ...currentWorker,
        isHired,
        isActive,
        isStriking,
        moraleTier: morale,
        missedCycles: missed,
        lastPaidAt: canAffordWage ? Date.now() : currentWorker?.lastPaidAt,
        lastFedAt: canAffordFood ? Date.now() : currentWorker?.lastFedAt,
      };
    } else {
      updatedUnifiedWorkers[id] = {
        ...currentWorker,
        isHired,
        moraleTier: morale,
        missedCycles: missed,
        lastPaidAt: canAffordWage ? Date.now() : currentWorker?.lastPaidAt,
        lastFedAt: canAffordFood ? Date.now() : currentWorker?.lastFedAt,
      };
    }
  }

  return {
    payrollVaultCoins,
    staffPantry: updatedPantry,
    updatedUnifiedWorkers,
    updatedSpecialistWorkers,
    paidCount,
    strikeCount,
    inspiredCount,
    grumblingCount,
    desertedWorkers,
  };
}

