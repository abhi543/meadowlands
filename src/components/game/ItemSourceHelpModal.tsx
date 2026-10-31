'use client';

import { useState, useMemo, useEffect } from 'react';
import { CROPS, ANIMALS, BUILDINGS } from '@/game/data';

export interface ItemProcurementInfo {
  id: string;
  name: string;
  emoji: string;
  category: 'crop' | 'animal' | 'kitchen' | 'fishery' | 'hydrology' | 'artisan' | 'material';
  categoryLabel: string;
  facility: string;
  tabTarget: string;
  timeEstimate: string;
  ingredients?: string;
  instructions: string;
}

export const ITEM_PROCUREMENT_REGISTRY: Record<string, ItemProcurementInfo> = {
  // Hydrology Water
  water: {
    id: 'water',
    name: 'Pressurized Water',
    emoji: '💧',
    category: 'hydrology',
    categoryLabel: 'Hydrology',
    facility: 'Deep Well & Gravity Tower',
    tabTarget: 'Hydrology Tab (💧)',
    timeEstimate: 'Instant / Auto-pumping',
    instructions: 'Open the Hydrology tab. Activate the Deep Well manual pump or draw pressurized water directly from the Elevated Gravity Tower & Rain Cistern.',
  },
  emergency_siphon_valve: {
    id: 'emergency_siphon_valve',
    name: 'Emergency Siphon Float Valve',
    emoji: '🚰',
    category: 'hydrology',
    categoryLabel: 'Hydrology Equipment',
    facility: 'Sluice Console / Workshop / Favor Shop',
    tabTarget: 'Hydrology Gauge (💧) or Workshop',
    timeEstimate: 'Instant (1-Click Install) or 30s craft',
    ingredients: '2 Mineral Slabs + 4 Wheat (or 250 Coins Quick-Install)',
    instructions: 'Click the Gravity Tower or open Sluice Console to 1-click Quick Install for 250 Coins (or 1 in Bag), buy in Town Favor Shop (15 Favor), or craft in the Workshop!',
  },

  // Raw Crops
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    emoji: '🌾',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '2 mins (120s)',
    ingredients: 'Free baseline seed',
    instructions: 'Click an empty farm plot on your farm grid. Select Wheat seeds to plant. Water the plot to cut maturation time in half!',
  },
  corn: {
    id: 'corn',
    name: 'Corn',
    emoji: '🌽',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '2 mins (120s)',
    ingredients: 'Free baseline seed',
    instructions: 'Plant corn seeds in tilled soil plots. Harvest with a scythe once golden kernels mature.',
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    emoji: '🥕',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '3 mins (180s)',
    ingredients: '5 Coins per seed',
    instructions: 'Purchase carrot seeds in seed selector on empty plots. Great for stew recipes and horse forage.',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Strawberry',
    emoji: '🍓',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '4 mins (240s)',
    ingredients: '10 Coins per seed',
    instructions: 'Plant strawberry patches in warm irrigated soil. Essential for high-value bakery berry pies and tarts.',
  },
  soybean: {
    id: 'soybean',
    name: 'Soybean',
    emoji: '🫛',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '6 mins (360s)',
    ingredients: '15 Coins per seed',
    instructions: 'Plant soybean pods. Yields protein-rich beans used in culinary dishes and specialized livestock feed.',
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Pumpkin',
    emoji: '🎃',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '20 mins (1200s)',
    ingredients: '25 Coins per seed',
    instructions: 'High-tier autumn gourds. Large bulk commodity required for noble autumn feasts and pumpkin pottage.',
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    emoji: '🌿',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '2 mins (120s)',
    ingredients: '12 Coins per seed',
    instructions: 'Harvest fluffy cotton bolls. Feed into the Loom or Tailor Shop to craft fabrics and cozy blankets.',
  },
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    emoji: '🌻',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '2 mins (120s)',
    ingredients: '10 Coins per seed',
    instructions: 'Sunny weather crop. Yields rich golden sunflower seeds perfect for Press oil processing and forage seed blends.',
  },
  sorghum: {
    id: 'sorghum',
    name: 'Sorghum',
    emoji: '🌾',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '2 mins (120s)',
    ingredients: '10 Coins per seed',
    instructions: 'Hardy drought-resistant grain. Mill into nutritious livestock feed or supply town grain reserves.',
  },
  paddy_rice: {
    id: 'paddy_rice',
    name: 'Paddy Rice',
    emoji: '🌾',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '2 mins (120s)',
    ingredients: '12 Coins per seed',
    instructions: 'Monsoon and wet soil crop. Cook in the Bakery into savory Steamed Rice Bowls.',
  },
  sweet_potato: {
    id: 'sweet_potato',
    name: 'Sweet Potato',
    emoji: '🍠',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '2 mins (120s)',
    ingredients: '14 Coins per seed',
    instructions: 'Nutritious root crop. Roast in the Bakery into Sweet Potato Wedges.',
  },
  tea_bush: {
    id: 'tea_bush',
    name: 'Tea Bush',
    emoji: '🍵',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '2 mins (120s)',
    ingredients: '12 Coins per seed',
    instructions: 'Aromatic green leaves. Brew in the Bakery into Ceremonial Matcha Tea.',
  },
  dragon_fruit: {
    id: 'dragon_fruit',
    name: 'Dragon Fruit',
    emoji: '🐉',
    category: 'crop',
    categoryLabel: 'Crops & Fields',
    facility: 'Farm Soil Plot',
    tabTarget: 'Farm Tab (🌱)',
    timeEstimate: '2 mins (120s)',
    ingredients: '25 Coins per seed',
    instructions: 'Vibrant exotic cactus fruit. Freeze into Dragon Fruit Sorbet at the Bakery.',
  },

  // Animal Commodities
  egg: {
    id: 'egg',
    name: 'Farm Egg',
    emoji: '🥚',
    category: 'animal',
    categoryLabel: 'Livestock',
    facility: 'Chicken Coop',
    tabTarget: 'Animals Tab (🐾)',
    timeEstimate: '1 min (60s)',
    ingredients: '1x Animal Feed per cycle',
    instructions: 'Navigate to Animals tab -> Coop. Feed your chickens with Animal Feed. Collect fresh farm eggs when ready.',
  },
  milk: {
    id: 'milk',
    name: 'Fresh Milk',
    emoji: '🥛',
    category: 'animal',
    categoryLabel: 'Livestock',
    facility: 'Cow Barn',
    tabTarget: 'Animals Tab (🐾)',
    timeEstimate: '2 mins (120s)',
    ingredients: '2x Animal Feed per cycle',
    instructions: 'Feed cows in the Barn using Animal Feed. Collect rich cream milk for cheese-making and bakery recipes.',
  },
  wool: {
    id: 'wool',
    name: 'Sheep Wool',
    emoji: '🧶',
    category: 'animal',
    categoryLabel: 'Livestock',
    facility: 'Sheep Pasture',
    tabTarget: 'Animals Tab (🐾)',
    timeEstimate: '2.5 mins (150s)',
    ingredients: '2x Animal Feed per cycle',
    instructions: 'Feed sheep in the pasture. Shear thick fleece wool used in Loom spinning and tailored sweaters.',
  },
  truffle: {
    id: 'truffle',
    name: 'Forest Truffle',
    emoji: '🍄',
    category: 'animal',
    categoryLabel: 'Livestock',
    facility: 'Pig Pasture',
    tabTarget: 'Animals Tab (🐾)',
    timeEstimate: '3 mins (180s)',
    ingredients: '2x Animal Feed per cycle',
    instructions: 'Feed pasture pigs. Their foraging snouts will unearth rare subterranean truffles.',
  },
  feed: {
    id: 'feed',
    name: 'Animal Feed',
    emoji: '🌾',
    category: 'crop',
    categoryLabel: 'Crafted Feed',
    facility: 'Feed Mill (Produce)',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '30s',
    ingredients: '1x Wheat + 1x Corn',
    instructions: 'Mill wheat and corn together in the Feed Mill or Animal Feed craft section to produce nutritious animal kibble.',
  },

  // Kitchen & Bakery
  bread: {
    id: 'bread',
    name: 'Crusty Bread',
    emoji: '🍞',
    category: 'kitchen',
    categoryLabel: 'Bakery & Meals',
    facility: 'Town Bakery',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '1 min (60s)',
    ingredients: '2x Wheat',
    instructions: 'Open the Produce tab -> Bakery. Add 2 units of harvested wheat into the stone hearth oven.',
  },
  cheese: {
    id: 'cheese',
    name: 'Artisan Cheese',
    emoji: '🧀',
    category: 'kitchen',
    categoryLabel: 'Bakery & Meals',
    facility: 'Dairy Press',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '1.5 mins (90s)',
    ingredients: '2x Fresh Milk',
    instructions: 'Open the Produce tab -> Dairy. Curd and press 2 units of fresh milk into aged wheels of cheese.',
  },
  pie: {
    id: 'pie',
    name: 'Berry Pie',
    emoji: '🥧',
    category: 'kitchen',
    categoryLabel: 'Bakery & Meals',
    facility: 'Town Bakery',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '2 mins (120s)',
    ingredients: '1x Bread + 2x Strawberry',
    instructions: 'Bake inside the Bakery. Combine golden crusty bread dough with fresh ripe strawberries.',
  },
  savory_fish_pie: {
    id: 'savory_fish_pie',
    name: 'Savory Fish Pie',
    emoji: '🥧',
    category: 'kitchen',
    categoryLabel: 'Bakery & Meals',
    facility: 'Town Bakery',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '2.5 mins (150s)',
    ingredients: '1x Fish + 1x Bread + 1x Carrot',
    instructions: 'Bake in the Bakery combining fresh river fish, bread crust, and crisp garden carrots.',
  },
  crab_bisque: {
    id: 'crab_bisque',
    name: 'Crab Bisque',
    emoji: '🍲',
    category: 'kitchen',
    categoryLabel: 'Bakery & Meals',
    facility: 'Town Bakery / Kitchen',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '2 mins (120s)',
    ingredients: '1x Mud Crab + 1x Milk',
    instructions: 'Simmer sweet mud crab meat with rich dairy milk to prepare this gourmet coastal specialty.',
  },
  golden_cornbread: {
    id: 'golden_cornbread',
    name: 'Golden Cornbread',
    emoji: '🍞',
    category: 'kitchen',
    categoryLabel: 'Bakery & Meals',
    facility: 'Town Bakery',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '2 mins (120s)',
    ingredients: '2x Corn + 1x Egg',
    instructions: 'Bake stoneground cornmeal with fresh eggs in the Bakery oven for a hearty Southern bread.',
  },

  // Fishery
  fish: {
    id: 'fish',
    name: 'Fresh Fish',
    emoji: '🐟',
    category: 'fishery',
    categoryLabel: 'Fishery Docks',
    facility: 'Fishery Dock',
    tabTarget: 'Fishery Tab (🎣)',
    timeEstimate: '30s - 1 min',
    instructions: 'Cast fishing lines, set bait, or assign automated fisherman lines at the Fishery dock.',
  },
  catfish: {
    id: 'catfish',
    name: 'River Catfish',
    emoji: '🐟',
    category: 'fishery',
    categoryLabel: 'Fishery Docks',
    facility: 'Deep River Dock',
    tabTarget: 'Fishery Tab (🎣)',
    timeEstimate: '1 min',
    instructions: 'Angle for bottom-feeding catfish in slow river pools using berry or worm bait.',
  },
  mud_crab: {
    id: 'mud_crab',
    name: 'Mud Crab',
    emoji: '🦀',
    category: 'fishery',
    categoryLabel: 'Fishery Docks',
    facility: 'Crab Pots / Docks',
    tabTarget: 'Fishery Tab (🎣)',
    timeEstimate: '1.5 mins',
    instructions: 'Set submerged mesh crab traps along the tidal banks at the Fishery.',
  },

  // Textiles & Artisan
  fabric: {
    id: 'fabric',
    name: 'Woven Fabric',
    emoji: '🧵',
    category: 'artisan',
    categoryLabel: 'Loom & Textiles',
    facility: 'Guild Loom',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '1 min (60s)',
    ingredients: '2x Cotton',
    instructions: 'Weave raw cotton fibers on the Guild Loom into bolts of smooth woven textile.',
  },
  yarn: {
    id: 'yarn',
    name: 'Spun Yarn',
    emoji: '🧶',
    category: 'artisan',
    categoryLabel: 'Loom & Textiles',
    facility: 'Guild Loom / Spinning Wheel',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '1 min (60s)',
    ingredients: '1x Sheep Wool',
    instructions: 'Spin sheared sheep fleece into durable skeins of warm yarn at the Loom.',
  },
  sweater: {
    id: 'sweater',
    name: 'Knitted Sweater',
    emoji: '🧶',
    category: 'artisan',
    categoryLabel: 'Loom & Textiles',
    facility: 'Tailor Shop',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '2 mins (120s)',
    ingredients: '2x Yarn',
    instructions: 'Knit cozy winter sweaters in the Tailor Shop using spun wool yarn.',
  },
  quilted_blanket: {
    id: 'quilted_blanket',
    name: 'Quilted Blanket',
    emoji: '🛌',
    category: 'artisan',
    categoryLabel: 'Loom & Textiles',
    facility: 'Tailor Shop',
    tabTarget: 'Produce Tab (⚙️)',
    timeEstimate: '3 mins (180s)',
    ingredients: '2x Fabric + 1x Wool',
    instructions: 'Craft patterned insulating blankets in the Tailor Shop using cotton fabric and soft wool.',
  },

  // Forage & Minerals
  wild_berries: {
    id: 'wild_berries',
    name: 'Wild Berries',
    emoji: '🍇',
    category: 'crop',
    categoryLabel: 'Farm Crops & Forage',
    facility: 'Farm Plots / Forager',
    tabTarget: 'Farm Tab (🌱) or Workers (👷)',
    timeEstimate: '150 seconds or passive gather',
    instructions: 'Plant Wild Berry seeds on tilled farm plots, or assign a Forager worker to passively gather them.',
  },
  honey_comb: {
    id: 'honey_comb',
    name: 'Honey Comb',
    emoji: '🍯',
    category: 'material',
    categoryLabel: 'Forage & Wilderness',
    facility: 'Apiary / Beekeeper',
    tabTarget: 'Workers Tab (👷)',
    timeEstimate: 'Passive gather',
    instructions: 'Assign an Apiary Tender or Beekeeper worker to gather natural raw honeycombs.',
  },
  gold_nugget: {
    id: 'gold_nugget',
    name: 'Gold Nugget',
    emoji: '⭐',
    category: 'material',
    categoryLabel: 'Quarry & Mines',
    facility: 'Deep Quarry / Prospector',
    tabTarget: 'Map (Territory) / Workers',
    timeEstimate: 'Excavation & Prospecting',
    instructions: 'Unlock the South Quarry parcel or assign Prospector specialists to excavate precious gold ore.',
  },
  co2_cylinder: {
    id: 'co2_cylinder',
    name: 'Pressurized CO₂ Cylinder',
    emoji: '💨',
    category: 'material',
    categoryLabel: 'Gas Bottling Refinery',
    facility: 'Heavy Hydraulic Gas Compressor',
    tabTarget: 'Gas Lab Tab (🏭)',
    timeEstimate: '60s compression cycle',
    ingredients: '40L Raw Slurry + 10 Dry Chaff Bundles',
    instructions: 'Compress in the Gas Bottling Refinery using 40L livestock slurry and 10 dry chaff bundles threshed from grain harvests. Direct export value: 45 Coins.',
  },
  oxygen_canister: {
    id: 'oxygen_canister',
    name: 'Refined Oxygen Canister',
    emoji: '🫧',
    category: 'material',
    categoryLabel: 'Gas Bottling Refinery',
    facility: 'Heavy Hydraulic Gas Compressor',
    tabTarget: 'Gas Lab Tab (🏭)',
    timeEstimate: '60s compression cycle',
    ingredients: '30L Gravity Water + 5 Green Biomass',
    instructions: 'Compress in the Gas Bottling Refinery using 30L clean pressurized tower water and 5 green biomass leaves (peas/soybeans). Direct export value: 65 Coins.',
  },
  nitrogen_dewar: {
    id: 'nitrogen_dewar',
    name: 'Liquid Nitrogen Dewar',
    emoji: '❄️',
    category: 'material',
    categoryLabel: 'Gas Bottling Refinery',
    facility: 'Heavy Hydraulic Gas Compressor',
    tabTarget: 'Gas Lab Tab (🏭)',
    timeEstimate: '60s compression cycle',
    ingredients: '50L Concentrated Slurry + 1 Thermal Fuel (or 15 Coins)',
    instructions: 'Compress in the Gas Bottling Refinery using 50L concentrated livestock slurry and 1 thermal fuel charge. Direct export value: 110 Coins.',
  },
};

/**
 * Returns procurement hint for any item id
 */
export function getItemProcurementDetails(itemId: string): ItemProcurementInfo {
  if (ITEM_PROCUREMENT_REGISTRY[itemId]) {
    return ITEM_PROCUREMENT_REGISTRY[itemId];
  }

  // Check crops
  if (itemId in CROPS) {
    const c = CROPS[itemId as keyof typeof CROPS];
    return {
      id: itemId,
      name: c.name,
      emoji: c.emoji,
      category: 'crop',
      categoryLabel: 'Crops & Fields',
      facility: 'Farm Soil Plot',
      tabTarget: 'Farm Tab (🌱)',
      timeEstimate: `${c.growTimeSec}s`,
      instructions: `Plant ${c.name} seeds on empty farm plots. Irrigate with water to boost growth speed.`,
    };
  }

  // Check animals
  for (const [, aDef] of Object.entries(ANIMALS)) {
    if (aDef.product === itemId) {
      return {
        id: itemId,
        name: aDef.product,
        emoji: aDef.productEmoji,
        category: 'animal',
        categoryLabel: 'Livestock',
        facility: aDef.habitat,
        tabTarget: 'Animals Tab (🐾)',
        timeEstimate: `${aDef.productionTimeSec}s`,
        instructions: `Feed ${aDef.name}s in the ${aDef.habitat} with Animal Feed to collect ${aDef.product}.`,
      };
    }
  }

  // Check building recipes
  for (const [, bDef] of Object.entries(BUILDINGS)) {
    for (const recipe of bDef.recipes) {
      if (recipe.output.productId === itemId) {
        return {
          id: itemId,
          name: recipe.name,
          emoji: recipe.emoji,
          category: 'kitchen',
          categoryLabel: bDef.name,
          facility: bDef.name,
          tabTarget: 'Produce Tab (⚙️)',
          timeEstimate: `${recipe.timeSec}s`,
          ingredients: recipe.inputs.map(i => `${i.qty}x ${i.productId}`).join(' + '),
          instructions: `Craft at ${bDef.name} in Produce tab using ${recipe.inputs.map(i => `${i.qty}x ${i.productId}`).join(', ')}.`,
        };
      }
    }
  }

  return {
    id: itemId,
    name: itemId.replace(/_/g, ' '),
    emoji: '📦',
    category: 'material',
    categoryLabel: 'General Commodity',
    facility: 'Farm & Outposts',
    tabTarget: 'Farm / Produce Tab',
    timeEstimate: 'Variable',
    instructions: `Procure or craft ${itemId.replace(/_/g, ' ')} through farm facilities, animal care, or artisan production.`,
  };
}

interface ItemSourceHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightItemIds?: string[];
  contractTitle?: string;
}

export function ItemSourceHelpModal({
  isOpen,
  onClose,
  highlightItemIds = [],
  contractTitle,
}: ItemSourceHelpModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const allItems = useMemo(() => {
    return Object.values(ITEM_PROCUREMENT_REGISTRY);
  }, []);

  const highlightedItems = useMemo(() => {
    if (!highlightItemIds || highlightItemIds.length === 0) return [];
    return highlightItemIds.map(id => getItemProcurementDetails(id));
  }, [highlightItemIds]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tabTarget.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.instructions.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [allItems, searchTerm, categoryFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-stone-900 border border-stone-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b border-stone-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              📖
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300 tracking-wide flex items-center gap-2">
                Logistics &amp; Item Procurement Field Guide
              </h2>
              <p className="text-xs text-stone-400">
                {contractTitle
                  ? `Required items for: ${contractTitle}`
                  : 'Instant production reference: where to grow crops, care for animals, bake meals, and pump water.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            title="Close Guide (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Highlighted Contract Section if opened from specific card */}
          {highlightedItems.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>Items Needed for this Specific Contract</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400/80 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {highlightedItems.length} requisitions
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {highlightedItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-stone-950/80 border border-amber-400/40 shadow-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.emoji}</span>
                        <div>
                          <div className="font-extrabold text-xs text-stone-100">{item.name}</div>
                          <div className="text-[10px] text-amber-400 font-medium">{item.facility}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full">
                        ⏱️ {item.timeEstimate}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-300 leading-relaxed bg-stone-900/60 p-2 rounded-lg border border-stone-800">
                      {item.instructions}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                      <span className="font-semibold text-emerald-400">➡️ {item.tabTarget}</span>
                      {item.ingredients && (
                        <span className="truncate text-stone-400">Needs: {item.ingredients}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Category Filter Toolbar */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search item, seed, bread, fish, water, or building..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'all', label: 'All Items', icon: '🌟' },
                { id: 'hydrology', label: 'Hydrology Water', icon: '💧' },
                { id: 'crop', label: 'Crops', icon: '🌱' },
                { id: 'animal', label: 'Livestock', icon: '🐾' },
                { id: 'kitchen', label: 'Bakery & Meals', icon: '🥖' },
                { id: 'fishery', label: 'Fishery', icon: '🎣' },
                { id: 'artisan', label: 'Loom & Textiles', icon: '🧶' },
                { id: 'material', label: 'Materials', icon: '📦' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                      : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Full Item Cards Directory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800 hover:border-stone-700 transition-all space-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-1 border-b border-stone-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xl select-none">{item.emoji}</span>
                      <div>
                        <div className="font-extrabold text-xs text-stone-200 flex items-center gap-1.5">
                          {item.name}
                          <span className="text-[9px] font-mono text-stone-400 bg-stone-900 px-1.5 py-0.2 rounded border border-stone-800">
                            {item.categoryLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-400/90 font-medium">
                          {item.facility}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded-full border border-stone-800">
                      ⏱️ {item.timeEstimate}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-300 leading-relaxed mt-1.5">
                    {item.instructions}
                  </p>
                </div>

                <div className="pt-1.5 border-t border-stone-800 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span>➡️</span>
                    <span>{item.tabTarget}</span>
                  </span>
                  {item.ingredients && (
                    <span className="text-stone-400 truncate max-w-[140px]" title={item.ingredients}>
                      {item.ingredients}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-10 text-stone-500 space-y-2">
              <span className="text-3xl">🔍</span>
              <div className="text-sm font-medium">No items found matching &quot;{searchTerm}&quot;</div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                }}
                className="text-xs text-amber-400 underline font-bold"
              >
                Clear search and filters
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 text-center text-xs text-stone-400 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Tip: Water farm plots in the Hydrology tab to cut crop growth time by 50%!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-colors shadow-sm cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
