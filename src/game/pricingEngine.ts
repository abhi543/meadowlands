// ============================================================================
// Project Meadowlands — Standardized Mathematical Pricing Engine & Value Curves
// Implements: Stage 0 (Crops), Stage 1 (Artisan), Stage 2 (Culinary), Stage 3 (Wilderness),
// and Master Tiered Contract Settlement Engine
// ============================================================================

export type EconomicStage = 0 | 1 | 2 | 3;
export type ItemEconomicCategory = 'crop' | 'animal' | 'raw_forage' | 'artisan' | 'culinary' | 'wilderness' | 'other';
export type ContractEconomicTier = 'tier1_local' | 'tier2_merchant' | 'tier3_noble';

export interface ItemValuationDetails {
  id: string;
  name: string;
  icon: string;
  stage: EconomicStage;
  category: ItemEconomicCategory;
  baseValue: number;
  formulaDescription: string;
  breakdownText: string;
  distinctIngredientsCount?: number;
  complexityBonusPercent?: number;
  artisanMultiplier?: number;
  culinaryMultiplier?: number;
}

export interface ContractSettlementBreakdown {
  baseCommodityValue: number;
  tier: ContractEconomicTier;
  tierLabel: string;
  tierMultiplier: number;
  tierMarkupPercent: number; // e.g. 10, 40, 100
  streak: number;
  streakMultiplier: number;
  streakBonusPercent: number; // e.g. 0, 25, 50
  isRush: boolean;
  rushMultiplier: number; // 3.0 or 1.0
  isHighStakes?: boolean;
  highStakesMultiplier?: number; // 5.0 or 1.0
  waterValue?: number;
  waterRequired?: number;
  finalCoinPayout: number;
  payrollDaysCovered?: number;
}

// ----------------------------------------------------------------------------
// STAGE 0: Soil Cultivation & Raw Forage
// Formula: Raw Crop Value = (Seed Purchase Price * 2.0) + ((Growth Duration Sec / 60) * 2.5)
// ----------------------------------------------------------------------------
export const STAGE_0_RAW_CROPS: Record<string, { seedCost: number; growTimeSec: number; name: string; icon: string }> = {
  // Legacy staples
  wheat:       { seedCost: 1,  growTimeSec: 120,  name: 'Wheat',       icon: '🌾' },
  corn:        { seedCost: 1,  growTimeSec: 120,  name: 'Corn',        icon: '🌽' },
  carrot:      { seedCost: 5,  growTimeSec: 180,  name: 'Carrot',      icon: '🥕' },
  strawberry:  { seedCost: 10, growTimeSec: 240, name: 'Strawberry',  icon: '🍓' },
  cotton:      { seedCost: 12, growTimeSec: 300, name: 'Cotton',      icon: '🌿' },
  soybean:     { seedCost: 15, growTimeSec: 360, name: 'Soybean',     icon: '🫘' },
  pumpkin:     { seedCost: 25, growTimeSec: 1200, name: 'Pumpkin',     icon: '🎃' },
  peas:        { seedCost: 2,  growTimeSec: 30,  name: 'Peas',        icon: '🫛' },
  wild_berries:{ seedCost: 6,  growTimeSec: 150, name: 'Wild Berries', icon: '🍇' },

  // A. Common & Temperate Weather Crops
  sunflower:   { seedCost: 10, growTimeSec: 120, name: 'Sunflower',    icon: '🌻' },
  okra:        { seedCost: 10, growTimeSec: 120, name: 'Okra',         icon: '🫛' },
  sorghum:     { seedCost: 10, growTimeSec: 120, name: 'Sorghum',      icon: '🌾' },
  spinach:     { seedCost: 10, growTimeSec: 120, name: 'Spinach',      icon: '🥬' },
  eggplant:    { seedCost: 12, growTimeSec: 120, name: 'Eggplant',     icon: '🍆' },
  wasabi:      { seedCost: 15, growTimeSec: 120, name: 'Wasabi',       icon: '🌿' },
  tea_bush:    { seedCost: 12, growTimeSec: 120, name: 'Tea Bush',     icon: '🍵' },

  // B. Severe & Cold Weather Crops
  paddy_rice:  { seedCost: 12, growTimeSec: 120, name: 'Paddy Rice',   icon: '🌾' },
  peanut:      { seedCost: 12, growTimeSec: 120, name: 'Peanut',       icon: '🥜' },
  sweet_potato:{ seedCost: 14, growTimeSec: 120, name: 'Sweet Potato', icon: '🍠' },
  turnip:      { seedCost: 12, growTimeSec: 120, name: 'Turnip',       icon: '🪴' },
  taro:        { seedCost: 15, growTimeSec: 120, name: 'Taro',         icon: '🥔' },
  kale:        { seedCost: 14, growTimeSec: 120, name: 'Kale',         icon: '🥬' },
  winter_rye:  { seedCost: 12, growTimeSec: 120, name: 'Winter Rye',   icon: '🌾' },

  // C. Extreme & Cataclysmic Weather Crops
  water_chestnut:        { seedCost: 20, growTimeSec: 120, name: 'Water Chestnut',        icon: '🌰' },
  dragon_fruit:          { seedCost: 25, growTimeSec: 120, name: 'Dragon Fruit',          icon: '🐉' },
  arctic_moss_campion:   { seedCost: 25, growTimeSec: 120, name: 'Arctic Moss Campion',   icon: '🌸' },
  bambara_groundnut:     { seedCost: 22, growTimeSec: 120, name: 'Bambara Groundnut',     icon: '🥜' },
  bioluminescent_shroom: { seedCost: 30, growTimeSec: 120, name: 'Bioluminescent Shroom', icon: '🍄' },
  prickly_pear_cactus:   { seedCost: 20, growTimeSec: 120, name: 'Prickly Pear Cactus',   icon: '🌵' },
};

export function calculateRawCropValue(seedCost: number, growTimeSec: number): number {
  const effectiveSeedCost = Math.max(1, seedCost);
  const maturationMinutes = growTimeSec / 60;
  const rawValue = (effectiveSeedCost * 2.0) + (maturationMinutes * 2.5);
  return Math.max(3, Math.round(rawValue));
}

// ----------------------------------------------------------------------------
// ANIMAL RAW COMMODITIES (Primary Products based on Feed Cycle + Livestock Tier)
// ----------------------------------------------------------------------------
export const ANIMAL_COMMODITY_BASES: Record<string, { baseValue: number; name: string; icon: string }> = {
  // Chickens (Egg tier)
  egg:               { baseValue: 8,   name: 'Egg',               icon: '🥚' },
  egg_blue:          { baseValue: 15,  name: 'Blue Egg',          icon: '🥚' },
  egg_obsidian:      { baseValue: 30,  name: 'Obsidian Egg',      icon: '🥚' },
  egg_golden:        { baseValue: 70,  name: 'Golden Egg',        icon: '🥚' },

  // Cows (Milk tier)
  milk:              { baseValue: 20,  name: 'Milk',              icon: '🥛' },
  milk_rich_cream:   { baseValue: 38,  name: 'Rich Cream',        icon: '🥛' },
  milk_alpine:       { baseValue: 72,  name: 'Alpine Milk',       icon: '🥛' },
  milk_starlight:    { baseValue: 160, name: 'Starlight Milk',    icon: '🥛' },

  // Sheep (Wool tier)
  wool:              { baseValue: 35,  name: 'Wool',              icon: '🧶' },
  wool_patterned:    { baseValue: 65,  name: 'Patterned Wool',    icon: '🧶' },
  wool_merino:       { baseValue: 120, name: 'Merino Wool',       icon: '🧶' },
  wool_gilded:       { baseValue: 260, name: 'Gilded Wool',       icon: '🧶' },

  // Pigs (Truffle tier)
  truffle:           { baseValue: 65,  name: 'Truffle',           icon: '🍄' },
  truffle_white:     { baseValue: 130, name: 'White Truffle',     icon: '🍄' },
  truffle_alba:      { baseValue: 260, name: 'Alba Truffle',      icon: '🍄' },
  truffle_diamond:   { baseValue: 550, name: 'Diamond Truffle',   icon: '🍄' },

  // Fishery Catches
  fish:              { baseValue: 25,  name: 'River Fish',        icon: '🐟' },
  catfish:           { baseValue: 32,  name: 'Catfish',           icon: '🐟' },
  perch:             { baseValue: 48,  name: 'Perch',             icon: '🐟' },
  trout:             { baseValue: 28,  name: 'Trout',             icon: '🐟' },
  salmon:            { baseValue: 45,  name: 'Salmon',            icon: '🐟' },
  bass:              { baseValue: 55,  name: 'Bass',              icon: '🐟' },
  mud_crab:          { baseValue: 30,  name: 'Mud Crab',          icon: '🦀' },
  snapper:           { baseValue: 50,  name: 'Snapper',           icon: '🐟' },
  barramundi:        { baseValue: 70,  name: 'Barramundi',        icon: '🐟' },
  arctic_char:       { baseValue: 42,  name: 'Arctic Char',       icon: '🐟' },
  golden_trout:      { baseValue: 80,  name: 'Golden Trout',      icon: '🐟' },
  sturgeon:          { baseValue: 110, name: 'Sturgeon',          icon: '🐟' },
  tuna:              { baseValue: 60,  name: 'Tuna',              icon: '🐟' },
  marlin:            { baseValue: 140, name: 'Marlin',            icon: '🐟' },
  lanternfish:       { baseValue: 280, name: 'Lanternfish',       icon: '🐟' },

  // Raw Wild Forage & Byproducts
  chaff:             { baseValue: 3,   name: 'Chaff & Husks',     icon: '🌾' },
  honey_comb:        { baseValue: 25,  name: 'Honey Comb',        icon: '🍯' },
  wild_berries:      { baseValue: 18,  name: 'Wild Berries',      icon: '🍇' },
  gold_nugget:       { baseValue: 120, name: 'Gold Nugget',       icon: '⭐' },
  horn_shavings:     { baseValue: 35,  name: 'Horn Shavings',     icon: '🪨' },
  lanolin_balm:      { baseValue: 50,  name: 'Lanolin Balm',      icon: '🧴' },
  ancient_coin:      { baseValue: 130, name: 'Ancient Coin',      icon: '🪙' },
};

// ----------------------------------------------------------------------------
// STAGE 1: Secondary Processing & Artisan Transformation
// Formula: (Sum(Inputs) * 3.0) + ((Machine Minutes / 5) * 8.0)
// ----------------------------------------------------------------------------
export const ARTISAN_MULTIPLIER = 3.0;
export const ARTISAN_TIME_RATE = 8.0; // 8 Coins per 5 minutes

export function calculateArtisanProductValue(
  inputsSum: number,
  timeSec: number,
  outputQty = 1
): { unitValue: number; formulaDescription: string; breakdownText: string } {
  const machineMinutes = timeSec / 60;
  const timeBonus = (machineMinutes / 5) * ARTISAN_TIME_RATE;
  const totalValue = (inputsSum * ARTISAN_MULTIPLIER) + timeBonus;
  const unitValue = Math.max(1, Math.round(totalValue / Math.max(1, outputQty)));

  return {
    unitValue,
    formulaDescription: `Artisan Transformation: 3.0x input value + ${timeBonus.toFixed(1)} time premium`,
    breakdownText: `3.0x × ${Math.round(inputsSum)}c inputs + ${(timeBonus).toFixed(0)}c processing (${Math.round(machineMinutes)}m)`,
  };
}

// ----------------------------------------------------------------------------
// STAGE 2: Culinary Creations & Kitchen Recipes
// Formula: (Sum(Inputs) * 4.0) * (1 + [N - 1] * 0.15)
// ----------------------------------------------------------------------------
export const CULINARY_MULTIPLIER = 4.0;
export const CULINARY_DIVERSITY_BONUS = 0.15; // +15% per unique ingredient beyond the first

export function calculateCulinaryProductValue(
  inputsSum: number,
  distinctIngredientCount: number,
  outputQty = 1
): { unitValue: number; formulaDescription: string; breakdownText: string; complexityBonusPercent: number } {
  const distinct = Math.max(1, distinctIngredientCount);
  const complexityScalar = 1 + (distinct - 1) * CULINARY_DIVERSITY_BONUS;
  const complexityBonusPercent = Math.round((complexityScalar - 1) * 100);
  const totalValue = (inputsSum * CULINARY_MULTIPLIER) * complexityScalar;
  const unitValue = Math.max(1, Math.round(totalValue / Math.max(1, outputQty)));

  return {
    unitValue,
    formulaDescription: `Culinary Masterwork: 4.0x input compounding + ${complexityBonusPercent}% complexity bonus`,
    breakdownText: `4.0x × ${Math.round(inputsSum)}c inputs × ${complexityScalar.toFixed(2)} (${distinct} ingredients)`,
    complexityBonusPercent,
  };
}

// ----------------------------------------------------------------------------
// STAGE 3: Wilderness Expedition Resources & Wild Materials
// Formula: Base Rarity Value * (1 + Expedition Duration in Hours * 0.25)
// ----------------------------------------------------------------------------
export const WILDERNESS_RISK_RATE = 0.25; // +25% per trek hour

export const WILDERNESS_MATERIAL_TIERS: Record<string, { rarity: 'common' | 'uncommon' | 'rare' | 'legendary'; base: number; defaultHours: number; name: string; icon: string }> = {
  scrap_timber:   { rarity: 'common',    base: 30,  defaultHours: 1,  name: 'Scrap Timber',   icon: '🪵' },
  wild_herbs:     { rarity: 'uncommon',  base: 90,  defaultHours: 2,  name: 'Wild Herbs',     icon: '🌿' },
  river_pearl:    { rarity: 'uncommon',  base: 90,  defaultHours: 3,  name: 'River Pearl',    icon: '🦪' },
  mountain_slate: { rarity: 'rare',      base: 220, defaultHours: 4,  name: 'Mountain Slate', icon: '🪨' },
  fossil_bark:    { rarity: 'rare',      base: 220, defaultHours: 6,  name: 'Fossil Bark',    icon: '🍂' },
  mythical_ore:   { rarity: 'legendary', base: 600, defaultHours: 8,  name: 'Mythical Ore',   icon: '🔮' },

  // Prehistoric Strata Fossils & Minerals
  fossil_trilobite_carapace: { rarity: 'uncommon', base: 300, defaultHours: 4, name: 'Intact Trilobite Carapace', icon: '🐚' },
  amber_meganeura_wing:    { rarity: 'rare', base: 450, defaultHours: 5, name: 'Amber-Encased Giant Wing', icon: '✨' },
  fossil_arthropleura_plates: { rarity: 'rare', base: 480, defaultHours: 5, name: 'Segmented Exoskeleton Plates', icon: '🧱' },
  fossil_dimetrodon_spine: { rarity: 'rare', base: 600, defaultHours: 6, name: 'Mineralized Dorsal Sail Spine', icon: '🦴' },
  fossil_titanoboa_vertebra: { rarity: 'legendary', base: 800, defaultHours: 7, name: 'Petrified Vertebral Column', icon: '🦴' },
  cryo_mammoth_tissue:     { rarity: 'legendary', base: 1000, defaultHours: 8, name: 'Cryo-Preserved Core Tissue', icon: '❄️' },
  amber_specimen:          { rarity: 'uncommon', base: 150, defaultHours: 3, name: 'Primeval Amber Core', icon: '✨' },
  mineral_slab:            { rarity: 'common', base: 80, defaultHours: 2, name: 'Fossiliferous Mineral Slab', icon: '🪨' },

  // Prehistoric Shed Harvest Commodities
  chitin_molt_plates:      { rarity: 'uncommon', base: 200, defaultHours: 4, name: 'Chitin Molt Plates', icon: '🛡️' },
  prismatic_wing_membrane: { rarity: 'rare', base: 350, defaultHours: 5, name: 'Prismatic Wing Membranes', icon: '🪽' },
  primeval_humus:          { rarity: 'uncommon', base: 250, defaultHours: 4, name: 'Supercharged Primeval Humus', icon: '🍂' },
  thermal_scutes:          { rarity: 'rare', base: 400, defaultHours: 6, name: 'Shed Thermal Scutes', icon: '🔥' },
  serpent_slough:          { rarity: 'rare', base: 500, defaultHours: 6, name: 'Massive Serpent Slough', icon: '📜' },
  insulated_down_wool:     { rarity: 'legendary', base: 600, defaultHours: 7, name: 'Insulated Down Wool', icon: '🧶' },

  // Workshop Tool, Hardware & Hydraulic Upgrades
  reinforced_sluice_seal:  { rarity: 'uncommon', base: 180, defaultHours: 4, name: 'Reinforced Sluice Gate Seal', icon: '🛡️🔧' },
  hardened_chitin_trowel:  { rarity: 'uncommon', base: 320, defaultHours: 6, name: 'Hardened Chitin Trowel', icon: '⛏️✨' },
  subsoil_aquifer_casing:  { rarity: 'rare', base: 650, defaultHours: 8, name: 'Subsoil Aquifer Casing', icon: '🏗️💧' },
  prismatic_light_lens:    { rarity: 'rare', base: 850, defaultHours: 10, name: 'Prismatic Light Lens', icon: '🔍🌈' },
  thermal_retaining_core:  { rarity: 'legendary', base: 950, defaultHours: 12, name: 'Thermal Retaining Core', icon: '🔥💎' },
};

export function calculateWildMaterialValue(
  materialId: string,
  durationHours?: number
): { unitValue: number; formulaDescription: string; breakdownText: string } {
  const def = WILDERNESS_MATERIAL_TIERS[materialId] || { rarity: 'common', base: 30, defaultHours: 1, name: materialId, icon: '📦' };
  const hours = durationHours !== undefined ? durationHours : def.defaultHours;
  const multiplier = 1 + (hours * WILDERNESS_RISK_RATE);
  const unitValue = Math.round(def.base * multiplier);

  return {
    unitValue,
    formulaDescription: `Wild Expedition Yield: ${def.rarity.toUpperCase()} tier base (${def.base}c) + ${Math.round(hours * 25)}% trek duration risk`,
    breakdownText: `${def.base}c base × ${(multiplier).toFixed(2)} (${hours}h trek risk)`,
  };
}

// ----------------------------------------------------------------------------
// RECIPE CATALOG CLASSIFICATION & CALCULATED CACHE
// ----------------------------------------------------------------------------

interface RecipeValuationConfig {
  stage: 1 | 2;
  inputs: { id: string; qty: number }[];
  outputQty: number;
  timeSec: number;
  name: string;
  icon: string;
}

export const KNOWN_RECIPE_VALUATIONS: Record<string, RecipeValuationConfig> = {
  // Artisan (Stage 1: 3.0x + time)
  feed:              { stage: 1, inputs: [{ id: 'wheat', qty: 2 }], outputQty: 3, timeSec: 60, name: 'Animal Feed', icon: '🥣' },
  cheese:            { stage: 1, inputs: [{ id: 'milk', qty: 2 }], outputQty: 1, timeSec: 60, name: 'Cheese', icon: '🧀' },
  rich_butter:       { stage: 1, inputs: [{ id: 'milk_rich_cream', qty: 2 }], outputQty: 1, timeSec: 75, name: 'Rich Butter', icon: '🧈' },
  alpine_cheese:     { stage: 1, inputs: [{ id: 'milk_alpine', qty: 2 }], outputQty: 1, timeSec: 90, name: 'Alpine Cheese', icon: '🧀' },
  yarn:              { stage: 1, inputs: [{ id: 'wool', qty: 1 }], outputQty: 2, timeSec: 60, name: 'Yarn', icon: '🧵' },
  yarn_patterned:    { stage: 1, inputs: [{ id: 'wool_patterned', qty: 1 }], outputQty: 3, timeSec: 45, name: 'Patterned Yarn', icon: '🧵' },
  sweater:           { stage: 1, inputs: [{ id: 'wool', qty: 3 }], outputQty: 1, timeSec: 60, name: 'Sweater', icon: '🧥' },
  merino_sweater:    { stage: 1, inputs: [{ id: 'wool_merino', qty: 2 }], outputQty: 1, timeSec: 90, name: 'Merino Sweater', icon: '🧥' },
  golden_shawl:      { stage: 1, inputs: [{ id: 'wool_gilded', qty: 3 }], outputQty: 1, timeSec: 120, name: 'Golden Shawl', icon: '🧣' },
  truffle_oil:       { stage: 1, inputs: [{ id: 'truffle', qty: 2 }], outputQty: 1, timeSec: 90, name: 'Truffle Oil', icon: '🫒' },
  honey:             { stage: 1, inputs: [{ id: 'honey_comb', qty: 2 }], outputQty: 1, timeSec: 60, name: 'Honey', icon: '🍯' },
  silk:              { stage: 1, inputs: [{ id: 'cotton', qty: 4 }], outputQty: 1, timeSec: 60, name: 'Silk', icon: '🧵' },
  lure_basic:        { stage: 1, inputs: [{ id: 'wheat', qty: 6 }, { id: 'carrot', qty: 4 }], outputQty: 1, timeSec: 120, name: 'Seed Cluster', icon: '🌾' },
  quilted_blanket:   { stage: 1, inputs: [{ id: 'yarn', qty: 4 }, { id: 'wool', qty: 2 }], outputQty: 1, timeSec: 120, name: 'Quilted Blanket', icon: '🧶' },

  // Culinary (Stage 2: 4.0x * (1 + (N-1)*0.15))
  bread:             { stage: 2, inputs: [{ id: 'wheat', qty: 3 }, { id: 'egg', qty: 1 }], outputQty: 1, timeSec: 60, name: 'Bake Bread', icon: '🍞' },
  pie:               { stage: 2, inputs: [{ id: 'bread', qty: 1 }, { id: 'strawberry', qty: 2 }], outputQty: 1, timeSec: 60, name: 'Berry Pie', icon: '🥧' },
  savory_fish_pie:   { stage: 2, inputs: [{ id: 'fish', qty: 2 }, { id: 'wheat', qty: 2 }, { id: 'egg', qty: 1 }], outputQty: 1, timeSec: 75, name: 'Savory Fish Pie', icon: '🥧' },
  crab_bisque:       { stage: 2, inputs: [{ id: 'fish', qty: 3 }, { id: 'milk', qty: 1 }], outputQty: 1, timeSec: 90, name: 'Crab Bisque', icon: '🍲' },
  golden_cake:       { stage: 2, inputs: [{ id: 'egg_golden', qty: 1 }, { id: 'bread', qty: 1 }], outputQty: 1, timeSec: 90, name: 'Golden Cake', icon: '🎂' },
  lure_berry:        { stage: 2, inputs: [{ id: 'pie', qty: 1 }, { id: 'strawberry', qty: 4 }], outputQty: 1, timeSec: 150, name: 'Berry Pastry', icon: '🍓' },
  lure_truffle:      { stage: 2, inputs: [{ id: 'truffle_oil', qty: 1 }, { id: 'cheese', qty: 2 }], outputQty: 1, timeSec: 180, name: 'Truffle Mash', icon: '🍄' },
  lure_nectar:       { stage: 2, inputs: [{ id: 'truffle_oil', qty: 2 }, { id: 'sweater', qty: 2 }, { id: 'fish', qty: 6 }], outputQty: 1, timeSec: 300, name: 'Ambrosia', icon: '✨' },

  // Gourmet Culinary & Quality Artisan Recipes
  sunflower_oil:           { stage: 1, inputs: [{ id: 'sunflower', qty: 2 }], outputQty: 1, timeSec: 60, name: 'Golden Sunflower Oil', icon: '🌻🫒' },
  rice_bowl:               { stage: 2, inputs: [{ id: 'paddy_rice', qty: 2 }, { id: 'egg', qty: 1 }], outputQty: 1, timeSec: 60, name: 'Steamed Rice Bowl', icon: '🍚' },
  sweet_potato_fries:      { stage: 2, inputs: [{ id: 'sweet_potato', qty: 2 }], outputQty: 1, timeSec: 60, name: 'Roasted Sweet Potato Wedges', icon: '🍠✨' },
  taro_chips:              { stage: 2, inputs: [{ id: 'taro', qty: 2 }], outputQty: 1, timeSec: 60, name: 'Crispy Taro Chips', icon: '🥔✨' },
  matcha_tea:              { stage: 1, inputs: [{ id: 'tea_bush', qty: 2 }], outputQty: 1, timeSec: 60, name: 'Ceremonial Matcha Tea', icon: '🍵✨' },
  dragon_fruit_smoothie:   { stage: 2, inputs: [{ id: 'dragon_fruit', qty: 2 }], outputQty: 1, timeSec: 75, name: 'Dragon Fruit Sorbet', icon: '🐉🍧' },
  golden_cornbread:        { stage: 2, inputs: [{ id: 'corn_gold', qty: 2 }, { id: 'egg', qty: 1 }], outputQty: 1, timeSec: 75, name: 'Golden Cornbread', icon: '🍞⭐' },
  prismatic_berry_tart:    { stage: 2, inputs: [{ id: 'strawberry_prismatic', qty: 1 }, { id: 'wheat_silver', qty: 2 }, { id: 'honey', qty: 1 }], outputQty: 1, timeSec: 120, name: 'Prismatic Berry Tart', icon: '🥧🌈' },
  glazed_silver_carrots:   { stage: 2, inputs: [{ id: 'carrot_silver', qty: 2 }, { id: 'honey', qty: 1 }], outputQty: 1, timeSec: 60, name: 'Glazed Silver Carrots', icon: '🥕✨' },
  royal_pumpkin_pottage:   { stage: 2, inputs: [{ id: 'pumpkin_gold', qty: 1 }, { id: 'milk_rich_cream', qty: 1 }], outputQty: 1, timeSec: 90, name: 'Royal Pumpkin Pottage', icon: '🍲👑' },
  grand_prismatic_jam:     { stage: 1, inputs: [{ id: 'strawberry_prismatic', qty: 1 }, { id: 'honey_comb', qty: 2 }], outputQty: 1, timeSec: 120, name: 'Grand Prismatic Jam', icon: '🍯🌈' },
  silver_woven_quilt:      { stage: 1, inputs: [{ id: 'cotton_silver', qty: 2 }, { id: 'yarn', qty: 2 }], outputQty: 1, timeSec: 90, name: 'Silverweave Bedspread', icon: '🧶✨' },
  prismatic_silk_tapestry: { stage: 1, inputs: [{ id: 'cotton_prismatic', qty: 2 }, { id: 'silk', qty: 1 }], outputQty: 1, timeSec: 150, name: 'Prismatic Silk Tapestry', icon: '🧵🌈' },

  // Gourmet Seafood Masterworks
  crispy_fried_catfish:    { stage: 2, inputs: [{ id: 'catfish', qty: 1 }, { id: 'corn', qty: 2 }], outputQty: 1, timeSec: 60, name: 'Crispy Fried Catfish', icon: '🐟🌽' },
  herb_grilled_trout:      { stage: 2, inputs: [{ id: 'trout', qty: 1 }, { id: 'wheat', qty: 2 }], outputQty: 1, timeSec: 60, name: 'Herb-Grilled Trout', icon: '🐟🌿' },
  steamed_mud_crab:        { stage: 2, inputs: [{ id: 'mud_crab', qty: 1 }, { id: 'carrot', qty: 2 }], outputQty: 1, timeSec: 75, name: 'Spiced Steamed Mud Crab', icon: '🦀✨' },
  pan_seared_salmon:       { stage: 2, inputs: [{ id: 'salmon', qty: 1 }, { id: 'honey', qty: 1 }], outputQty: 1, timeSec: 90, name: 'Pan-Seared Honey Salmon', icon: '🍣🍯' },
  smoked_tuna_steak:       { stage: 2, inputs: [{ id: 'tuna', qty: 1 }, { id: 'soybean', qty: 2 }], outputQty: 1, timeSec: 100, name: 'Smoked Tuna Steak', icon: '🐟🔥' },
  golden_trout_meuniere:   { stage: 2, inputs: [{ id: 'golden_trout', qty: 1 }, { id: 'rich_butter', qty: 1 }], outputQty: 1, timeSec: 110, name: 'Gilded Trout Meunière', icon: '🐟⭐' },
  imperial_sturgeon_caviar:{ stage: 2, inputs: [{ id: 'sturgeon', qty: 1 }, { id: 'bread', qty: 1 }], outputQty: 1, timeSec: 120, name: 'Imperial Sturgeon Caviar', icon: '🥣⭐' },
  marlin_tartare:          { stage: 2, inputs: [{ id: 'marlin', qty: 1 }, { id: 'citrus_tea', qty: 1 }], outputQty: 1, timeSec: 140, name: 'Grand Marlin Tartare', icon: '🐟👑' },
  luminescent_chowder:     { stage: 2, inputs: [{ id: 'lanternfish', qty: 1 }, { id: 'milk_rich_cream', qty: 1 }, { id: 'pumpkin', qty: 1 }], outputQty: 1, timeSec: 180, name: 'Luminescent Abyss Chowder', icon: '🍲🌈' },

  // Workshop Tool, Hardware & Hydraulic Upgrades
  reinforced_sluice_seal:  { stage: 1, inputs: [{ id: 'chitin_molt_plates', qty: 2 }, { id: 'mineral_slab', qty: 2 }], outputQty: 1, timeSec: 60, name: 'Reinforced Sluice Gate Seal', icon: '🛡️🔧' },
  hardened_chitin_trowel:  { stage: 1, inputs: [{ id: 'chitin_molt_plates', qty: 3 }, { id: 'fired_hardwood', qty: 2 }], outputQty: 1, timeSec: 90, name: 'Hardened Chitin Trowel', icon: '⛏️✨' },
  subsoil_aquifer_casing:  { stage: 1, inputs: [{ id: 'chitin_molt_plates', qty: 5 }, { id: 'mineral_slab', qty: 4 }], outputQty: 1, timeSec: 120, name: 'Subsoil Aquifer Casing', icon: '🏗️💧' },
  prismatic_light_lens:    { stage: 1, inputs: [{ id: 'prismatic_wing_membrane', qty: 2 }, { id: 'tempered_glass', qty: 2 }], outputQty: 1, timeSec: 150, name: 'Prismatic Light Lens', icon: '🔍🌈' },
  thermal_retaining_core:  { stage: 1, inputs: [{ id: 'thermal_scutes', qty: 2 }, { id: 'mineral_slab', qty: 4 }], outputQty: 1, timeSec: 180, name: 'Thermal Retaining Core', icon: '🔥💎' },

  // Gas Bottling & Export Commodities (Hydraulic Gas Compressor)
  co2_cylinder:            { stage: 1, inputs: [{ id: 'chaff', qty: 10 }], outputQty: 1, timeSec: 60, name: 'Pressurized CO₂ Cylinder', icon: '🫧' },
  oxygen_canister:         { stage: 1, inputs: [{ id: 'wheat', qty: 5 }], outputQty: 1, timeSec: 60, name: 'Refined Oxygen Canister', icon: '🫁' },
  nitrogen_dewar:          { stage: 1, inputs: [{ id: 'fired_hardwood', qty: 1 }], outputQty: 1, timeSec: 60, name: 'Liquid Nitrogen Dewar', icon: '❄️' },
  ethylene_cylinder:       { stage: 1, inputs: [{ id: 'cull_biomass', qty: 15 }], outputQty: 1, timeSec: 45, name: 'Ethylene Cylinder', icon: '🍇' },
  ozone_canister:          { stage: 1, inputs: [{ id: 'oxygen_canister', qty: 1 }], outputQty: 1, timeSec: 30, name: 'Ozone Canister', icon: '⚡' },
  sulfur_dioxide_flask:    { stage: 1, inputs: [{ id: 'raw_sulfur', qty: 15 }], outputQty: 1, timeSec: 60, name: 'Sulfur Dioxide Flask', icon: '🌋' },
  phosphine_bomb:          { stage: 1, inputs: [{ id: 'bone_meal', qty: 10 }], outputQty: 1, timeSec: 75, name: 'Phosphine Heavy Bomb', icon: '☣️' },
};

// Internal computed memoization cache
const ITEM_VALUATION_CACHE: Map<string, ItemValuationDetails> = new Map();

/**
 * Recursively resolves the mathematically derived economic valuation for any item in the game.
 */
export function getItemEconomicProfile(itemId: string): ItemValuationDetails {
  if (ITEM_VALUATION_CACHE.has(itemId)) {
    return ITEM_VALUATION_CACHE.get(itemId)!;
  }

  // 1. Check Stage 0: Raw Crops
  if (STAGE_0_RAW_CROPS[itemId]) {
    const c = STAGE_0_RAW_CROPS[itemId];
    const value = calculateRawCropValue(c.seedCost, c.growTimeSec);
    const details: ItemValuationDetails = {
      id: itemId,
      name: c.name,
      icon: c.icon,
      stage: 0,
      category: 'crop',
      baseValue: value,
      formulaDescription: `Stage 0 Raw Harvest: Seed Cost (${c.seedCost}c × 2.0) + Growth Time (${c.growTimeSec / 60}m × 2.5c/min)`,
      breakdownText: `${(c.seedCost * 2).toFixed(0)}c seed recovery + ${(c.growTimeSec / 60 * 2.5).toFixed(0)}c field time`,
    };
    ITEM_VALUATION_CACHE.set(itemId, details);
    return details;
  }

  // 1b. Check Quality Harvest Crops (Silver / Gold / Prismatic)
  const qualityMatch = itemId.match(/^([a-z_]+)_(silver|gold|prismatic)$/);
  if (qualityMatch) {
    const [, baseCrop, quality] = qualityMatch;
    if (STAGE_0_RAW_CROPS[baseCrop]) {
      const c = STAGE_0_RAW_CROPS[baseCrop];
      const baseVal = calculateRawCropValue(c.seedCost, c.growTimeSec);
      const mult = quality === 'prismatic' ? 4.5 : quality === 'gold' ? 2.5 : 1.5;
      const val = Math.round(baseVal * mult);
      const qBadge = quality === 'prismatic' ? '🌈 Prismatic' : quality === 'gold' ? '⭐ Gold' : '✨ Silver';
      const details: ItemValuationDetails = {
        id: itemId,
        name: `${qBadge} ${c.name}`,
        icon: `${c.icon}${quality === 'prismatic' ? '🌈' : quality === 'gold' ? '⭐' : '✨'}`,
        stage: 0,
        category: 'crop',
        baseValue: val,
        formulaDescription: `Stage 0 Premium Crop: ${qBadge} grade (${mult}x over base ${baseVal}c)`,
        breakdownText: `${val}c premium harvest valuation (${mult}x)`,
      };
      ITEM_VALUATION_CACHE.set(itemId, details);
      return details;
    }
  }

  // 2. Check Animal Primary Commodities
  if (ANIMAL_COMMODITY_BASES[itemId]) {
    const a = ANIMAL_COMMODITY_BASES[itemId];
    const isForage = itemId === 'wild_berries' || itemId === 'honey_comb' || itemId === 'gold_nugget';
    const details: ItemValuationDetails = {
      id: itemId,
      name: a.name,
      icon: a.icon,
      stage: 0,
      category: isForage ? 'raw_forage' : 'animal',
      baseValue: a.baseValue,
      formulaDescription: isForage
        ? `Stage 0 Wild Forage: Natural yield value derived from collection interval`
        : `Stage 0 Livestock Commodity: Derived from feed cycle cost and breed rarity tier`,
      breakdownText: isForage ? `Wild harvest baseline: ${a.baseValue}c` : `Feed cycle & animal upkeep base: ${a.baseValue}c`,
    };
    ITEM_VALUATION_CACHE.set(itemId, details);
    return details;
  }

  // 3. Check Wilderness Materials
  if (WILDERNESS_MATERIAL_TIERS[itemId]) {
    const w = calculateWildMaterialValue(itemId);
    const meta = WILDERNESS_MATERIAL_TIERS[itemId];
    const details: ItemValuationDetails = {
      id: itemId,
      name: meta.name,
      icon: meta.icon,
      stage: 3,
      category: 'wilderness',
      baseValue: w.unitValue,
      formulaDescription: w.formulaDescription,
      breakdownText: w.breakdownText,
    };
    ITEM_VALUATION_CACHE.set(itemId, details);
    return details;
  }

  // 4. Check Processed Recipes (Artisan Stage 1 or Culinary Stage 2)
  if (KNOWN_RECIPE_VALUATIONS[itemId]) {
    const r = KNOWN_RECIPE_VALUATIONS[itemId];
    // Recursively resolve inputs sum
    let inputsSum = 0;
    const distinctIngredients = r.inputs.length;
    for (const input of r.inputs) {
      const inputProfile = getItemEconomicProfile(input.id);
      inputsSum += inputProfile.baseValue * input.qty;
    }

    if (r.stage === 1) {
      // Artisan Transformation (3.0x + time)
      const artisanCalc = calculateArtisanProductValue(inputsSum, r.timeSec, r.outputQty);
      const details: ItemValuationDetails = {
        id: itemId,
        name: r.name,
        icon: r.icon,
        stage: 1,
        category: 'artisan',
        baseValue: artisanCalc.unitValue,
        artisanMultiplier: ARTISAN_MULTIPLIER,
        formulaDescription: artisanCalc.formulaDescription,
        breakdownText: artisanCalc.breakdownText,
      };
      ITEM_VALUATION_CACHE.set(itemId, details);
      return details;
    } else {
      // Culinary Masterwork (4.0x * (1 + (N-1)*0.15))
      const culinaryCalc = calculateCulinaryProductValue(inputsSum, distinctIngredients, r.outputQty);
      const details: ItemValuationDetails = {
        id: itemId,
        name: r.name,
        icon: r.icon,
        stage: 2,
        category: 'culinary',
        baseValue: culinaryCalc.unitValue,
        culinaryMultiplier: CULINARY_MULTIPLIER,
        distinctIngredientsCount: distinctIngredients,
        complexityBonusPercent: culinaryCalc.complexityBonusPercent,
        formulaDescription: culinaryCalc.formulaDescription,
        breakdownText: culinaryCalc.breakdownText,
      };
      ITEM_VALUATION_CACHE.set(itemId, details);
      return details;
    }
  }

  // Fallback for unknown items
  const fallback: ItemValuationDetails = {
    id: itemId,
    name: itemId.replace(/_/g, ' '),
    icon: '📦',
    stage: 0,
    category: 'other',
    baseValue: 10,
    formulaDescription: 'Baseline standardized trade value',
    breakdownText: '10c standard minimum',
  };
  ITEM_VALUATION_CACHE.set(itemId, fallback);
  return fallback;
}

/**
 * Universal economic base price getter for any item.
 */
export function getDerivedItemPrice(itemId: string): number {
  return getItemEconomicProfile(itemId).baseValue;
}

// ----------------------------------------------------------------------------
// MASTER CONTRACT SETTLEMENT ENGINE
// Formula: Total Payout = Sum(Item Base Values) * Tier Multiplier * Streak Multiplier * Rush Multiplier
// ----------------------------------------------------------------------------

export const CONTRACT_TIER_CONFIG: Record<ContractEconomicTier, { label: string; multiplier: number; markupPercent: number; badgeColor: string }> = {
  tier1_local:    { label: 'Local Request',    multiplier: 1.1, markupPercent: 10,  badgeColor: 'amber' },
  tier2_merchant: { label: 'Merchant Freight', multiplier: 1.4, markupPercent: 40,  badgeColor: 'blue' },
  tier3_noble:    { label: 'Noble Decree',     multiplier: 2.0, markupPercent: 100, badgeColor: 'purple' },
};

export function getTradeStreakMultiplier(streak: number): { multiplier: number; bonusPercent: number } {
  if (streak >= 5) return { multiplier: 1.50, bonusPercent: 50 };
  if (streak >= 3) return { multiplier: 1.25, bonusPercent: 25 };
  return { multiplier: 1.00, bonusPercent: 0 };
}

/**
 * Computes complete itemized settlement breakdown for a contract.
 */
export function calculateMasterSettlement(
  items: { itemId: string; quantity: number }[],
  tier: ContractEconomicTier,
  streak = 0,
  isRush = false,
  dailyPayrollRate = 0,
  waterRequired = 0,
  isHighStakes = false
): ContractSettlementBreakdown {
  const tierConfig = CONTRACT_TIER_CONFIG[tier] || CONTRACT_TIER_CONFIG.tier1_local;
  const streakInfo = getTradeStreakMultiplier(streak);
  const rushMultiplier = isRush ? 3.0 : 1.0;
  // High-stakes contracts command a premium 5.0x bounty multiplier delivering substantial payouts
  const highStakesMultiplier = isHighStakes ? 5.0 : 1.0;

  let baseCommodityValue = 0;
  for (const it of items) {
    const profile = getItemEconomicProfile(it.itemId);
    baseCommodityValue += profile.baseValue * it.quantity;
  }

  // Pressurized hydrology water demand value (6 coins per Liter base)
  const waterValue = waterRequired > 0 ? Math.round(waterRequired * 6) : 0;
  baseCommodityValue += waterValue;

  const rawFinal = baseCommodityValue * tierConfig.multiplier * streakInfo.multiplier * rushMultiplier * highStakesMultiplier;
  const finalCoinPayout = Math.max(15, Math.round(rawFinal));

  let payrollDaysCovered: number | undefined;
  if (dailyPayrollRate > 0) {
    payrollDaysCovered = Math.round((finalCoinPayout / dailyPayrollRate) * 10) / 10;
  }

  return {
    baseCommodityValue,
    tier,
    tierLabel: tierConfig.label,
    tierMultiplier: tierConfig.multiplier,
    tierMarkupPercent: tierConfig.markupPercent,
    streak,
    streakMultiplier: streakInfo.multiplier,
    streakBonusPercent: streakInfo.bonusPercent,
    isRush,
    rushMultiplier,
    isHighStakes,
    highStakesMultiplier,
    waterValue,
    waterRequired,
    finalCoinPayout,
    payrollDaysCovered,
  };
}

/**
 * Infers the contract tier from order properties and player level.
 */
export function inferContractTier(type: string, safeLevel: number): ContractEconomicTier {
  if (type === 'town_project' || safeLevel >= 15) return 'tier3_noble';
  if (type === 'futures' || safeLevel >= 5) return 'tier2_merchant';
  return 'tier1_local';
}
