'use client';

import { useState } from 'react';
import {
  BUILDINGS, ANIMALS, CROPS, WORKERS, WATER_ZONES, ROD_TIERS, ROD_TIER_ORDER,
  PRODUCTS, BREED_REGISTRY, TIER_COLORS, TIER_LABELS, BIOMES, LURES,
  PARCEL_CONFIGS, PARCEL_ORDER, ESTATE_AURAS, FREIGHT_CONTRACT_TEMPLATES,
  WORKER_REGISTRY, WORKER_DIVISIONS, MILESTONE_RANKS,
  type AnimalSpecies, type Tier, type BiomeId, type LureTypeId,
} from '@/game/data';

type GuideTab =
  | 'overview'
  | 'farm'
  | 'animals'
  | 'breeding'
  | 'production'
  | 'orders'
  | 'shop'
  | 'workers'
  | 'fishery'
  | 'wilderness'
  | 'territory'
  | 'market'
  | 'tips';

interface TabItem {
  id: GuideTab;
  label: string;
  emoji: string;
  badge?: string;
}

const GUIDE_TABS: TabItem[] = [
  { id: 'overview',   label: 'All Pages Atlas', emoji: '🗺️', badge: '11 Pages' },
  { id: 'farm',       label: 'Farm & Crops',    emoji: '🌾' },
  { id: 'animals',    label: 'Animals',         emoji: '🐔' },
  { id: 'breeding',   label: 'Breeding',        emoji: '🧬' },
  { id: 'production', label: 'Production',      emoji: '⚙️' },
  { id: 'orders',     label: 'Orders & XP',     emoji: '🚚' },
  { id: 'shop',       label: 'Shop & Economy',  emoji: '🏪' },
  { id: 'workers',    label: 'Workers Hub',     emoji: '👷' },
  { id: 'fishery',    label: 'Fishery & Waters',emoji: '🎣' },
  { id: 'wilderness', label: 'Wilderness',      emoji: '🏕️' },
  { id: 'territory',  label: 'Territory & Map', emoji: '🧭' },
  { id: 'market',     label: 'Market & Elders', emoji: '💰' },
  { id: 'tips',       label: 'Pro Strategies',  emoji: '💡' },
];

export function GuidePanel() {
  const [activeTab, setActiveTab] = useState<GuideTab>('overview');

  return (
    <div className="space-y-3 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-gray-800 pb-2">
        <div>
          <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
            📖 Meadowlands Comprehensive Guide
          </h3>
          <p className="text-xs text-stone-500 dark:text-gray-400">
            Complete manual for all 11 game sections, production lines, and idle automation.
          </p>
        </div>
      </div>

      {/* Horizontal Nav Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {GUIDE_TABS.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-stone-600 dark:text-gray-300 border-stone-200 dark:border-gray-700 hover:bg-stone-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
              {t.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-800 p-3.5 text-sm text-stone-700 dark:text-gray-300 space-y-4">
        {activeTab === 'overview'   && <AllPagesAtlas onSelectTab={setActiveTab} />}
        {activeTab === 'farm'       && <FarmGuide />}
        {activeTab === 'animals'    && <AnimalsGuide />}
        {activeTab === 'breeding'   && <BreedingGuide />}
        {activeTab === 'production' && <ProductionChainGuide />}
        {activeTab === 'orders'     && <OrdersGuide />}
        {activeTab === 'shop'       && <ShopGuide />}
        {activeTab === 'workers'    && <WorkersGuide />}
        {activeTab === 'fishery'    && <FisheryGuide />}
        {activeTab === 'wilderness' && <WildernessGuide />}
        {activeTab === 'territory'  && <TerritoryGuide />}
        {activeTab === 'market'     && <MarketGuide />}
        {activeTab === 'tips'       && <TipsGuide />}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 1. ALL PAGES ATLAS (Visual Breakdown of each of the 11 tabs)
// -------------------------------------------------------------
function AllPagesAtlas({ onSelectTab }: { onSelectTab: (tab: GuideTab) => void }) {
  const pages = [
    {
      tabId: 'farm' as GuideTab,
      label: '1. Farm (🌾)',
      role: 'Core Agricultural Engine',
      desc: 'Plant crops on 9 soil plots. Crops grow in real-time and feed into the Silo, livestock feeding troughs, and crafting bakeries.',
      action: 'Learn Farm Mechanics',
      color: 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900/40',
    },
    {
      tabId: 'animals' as GuideTab,
      label: '2. Animals (🐔)',
      role: 'Livestock & Feed Cycles',
      desc: 'Nurture Chickens, Cows, Sheep, and Pigs. Feed them animal feed crafted from wheat/corn. Harvest eggs, milk, wool, and truffles.',
      action: 'Learn Animal Care',
      color: 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40',
    },
    {
      tabId: 'production' as GuideTab,
      label: '3. Produce (⚙️)',
      role: 'Artisan Manufacturing & Value Add',
      desc: 'Transform raw farm output into high-value goods across 7 buildings: Feed Mill, Bakery, Dairy, Loom, Press, Tailor Shop, and Textiles.',
      action: 'Explore Recipes',
      color: 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900/40',
    },
    {
      tabId: 'orders' as GuideTab,
      label: '4. Orders (🚚)',
      role: 'Logistics, Leveling & XP Progression',
      desc: 'Deliver goods to merchants and townsfolk on the Order Board. Earn coins and XP to level up (up to Max Level 50) and unlock new content.',
      action: 'Read Orders Guide',
      color: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40',
    },
    {
      tabId: 'shop' as GuideTab,
      label: '5. Shop (🏪)',
      role: 'Inventory Liquidation & Quick Cash',
      desc: 'Sell surplus harvested crops from your Silo and crafted goods from your Barn. Instant "Sell All" button clears storage for fast cash.',
      action: 'Read Shop Guide',
      color: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40',
    },
    {
      tabId: 'workers' as GuideTab,
      label: '6. Workers (👷)',
      role: 'Automated Guilds & Idle Progress',
      desc: 'Hire 10 specialized workers across Field Hands, Autonomous Gatherers, and Guild Masters. Level them up (up to Lv.120) with Auto-Sell and Hoard modes.',
      action: 'Learn Automation',
      color: 'border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-900/40',
    },
    {
      tabId: 'fishery' as GuideTab,
      label: '7. Fishery (🎣)',
      role: 'Parallel Aquatic Harvesting',
      desc: '5 Water Zones (Pond, River, Estuary, Lake, Ocean) operating in parallel. Hire fishermen directly, upgrade rods, and fill the Aquatic Codex for gems.',
      action: 'Read Fishery Guide',
      color: 'border-cyan-200 bg-cyan-50/50 dark:bg-cyan-950/20 dark:border-cyan-900/40',
    },
    {
      tabId: 'wilderness' as GuideTab,
      label: '8. Wild (🏕️)',
      role: 'Scout Expeditions & Exotic Tiers',
      desc: 'Craft bait lures and send scouts to 4 uncharted wilderness biomes. Make mid-trail risk/reward decisions to bring home rare wild animal breeds.',
      action: 'Read Wilderness Guide',
      color: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40',
    },
    {
      tabId: 'territory' as GuideTab,
      label: '9. Map (🗺️)',
      role: 'Estate Expansion & Aura Buffs',
      desc: 'Clear land debris across 7 parcels. Unlock massive estate-wide auras (Irrigation, Logistics, Margins) and fulfill massive Freight Cargo Contracts.',
      action: 'Explore Territory Map',
      color: 'border-teal-200 bg-teal-50/50 dark:bg-teal-950/20 dark:border-teal-900/40',
    },
    {
      tabId: 'market' as GuideTab,
      label: '10. Market (💰)',
      role: 'Livestock Trading & Elder Retirement',
      desc: 'Purchase new animal stock across all tiers. Monitor your animals remaining life cycles, and sell Elder animals for large retirement payouts.',
      action: 'Explore Livestock Market',
      color: 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900/40',
    },
    {
      tabId: 'breeding' as GuideTab,
      label: '11. Breeding & Codex (🧬)',
      role: 'Genetics, Mutations & Codex Gems',
      desc: 'Pair two adult animals in Breeding Pens to hatch higher-tier offspring (Uncommon, Rare, Legendary) and unlock permanent Codex Gem bounties.',
      action: 'Learn Breeding System',
      color: 'border-pink-200 bg-pink-50/50 dark:bg-pink-950/20 dark:border-pink-900/40',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-3 text-xs text-sky-800 dark:text-sky-200">
        <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5">
          <span>🌟</span> How the Meadowlands Economy Connects
        </h4>
        <p className="leading-relaxed">
          Meadowlands is designed as an interlocking idle farming sandbox. <strong>Farm plots</strong> produce crops which feed <strong>Animals</strong> and supply <strong>Production</strong> buildings. Crafted products fulfill <strong>Orders</strong> for XP and level-ups, unlocking new <strong>Water Zones</strong>, <strong>Workers</strong>, and <strong>Territories</strong>. Excess stock liquidates in the <strong>Shop</strong>, and older animals sell at the <strong>Market</strong> to fund further estate expansion!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {pages.map(p => (
          <div
            key={p.label}
            className={`border rounded-xl p-3 flex flex-col justify-between transition-all ${p.color}`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-stone-800 dark:text-gray-100">{p.label}</span>
                <span className="text-[10px] font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">{p.role}</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-gray-300 leading-snug mb-2.5">
                {p.desc}
              </p>
            </div>
            <button
              onClick={() => onSelectTab(p.tabId)}
              className="text-left text-xs font-bold text-stone-800 dark:text-stone-200 hover:underline flex items-center gap-1"
            >
              <span>{p.action}</span>
              <span>→</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. FARM & CROPS GUIDE
// -------------------------------------------------------------
function FarmGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🌾 Farm & Soil Plots Guide
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          The foundation of your entire agricultural supply chain.
        </p>
      </div>

      <div className="bg-stone-50 dark:bg-stone-900/40 rounded-lg p-3 text-xs space-y-1.5">
        <h5 className="font-bold text-stone-800 dark:text-gray-200">How Soil Plots Work:</h5>
        <ul className="list-disc ml-4 space-y-1 text-stone-600 dark:text-stone-300">
          <li><strong>Plots:</strong> You start with 9 farmland plots arranged in a 3×3 grid.</li>
          <li><strong>Planting:</strong> Select a crop seed selector at the top, then tap an empty plot, or click <strong>Plant All</strong> to plant every empty plot in a single click.</li>
          <li><strong>Growth Progress:</strong> Each plot has an animated real-time progress bar. Once filled, the crop sparkles and displays a <strong>Harvest</strong> button.</li>
          <li><strong>Batch Harvesting:</strong> Use <strong>Harvest All</strong> to collect all ready crops simultaneously and gain instant player XP.</li>
          <li><strong>Instant Harvest Chance:</strong> Regional Sovereign Territory aura provides a 10% chance for instant maturity right after planting!</li>
        </ul>
      </div>

      {/* Crop table */}
      <div>
        <h5 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-gray-400 mb-1.5">
          Available Crop Roster
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(CROPS).map(([id, crop]) => (
            <div key={id} className="border border-stone-200 dark:border-gray-800 rounded-lg p-2.5 bg-stone-50/50 dark:bg-stone-900/30 flex items-start gap-2">
              <span className="text-2xl">{crop.emoji}</span>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-gray-200">{crop.name}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    Cost: 🪙{crop.seedCost}
                  </span>
                </div>
                <div className="text-stone-500 dark:text-gray-400 mt-0.5">
                  ⏱️ Growth: {crop.growTimeSec}s • 📦 Yield: {crop.yieldCount}x into Silo
                </div>
                <div className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 italic">
                  Used for: {getCropUsage(id)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getCropUsage(cropId: string): string {
  switch (cropId) {
    case 'wheat': return 'Animal Feed (Feed Mill), Artisan Bread (Bakery), Orders.';
    case 'corn': return 'Animal Feed (Feed Mill), Orders.';
    case 'carrot': return 'Fruit & Veggie Pies (Bakery), high-tier orders.';
    case 'strawberry': return 'Glazed Berry Pastry Lure (Wilderness), Bakery Pies.';
    case 'soybean': return 'Tofu & Soy Press processing, specialized contracts.';
    case 'pumpkin': return 'Holiday VIP Orders, seasonal recipes.';
    case 'cotton': return 'Tailor Shop, Fine Fabric, Quilted Blankets, Yarn.';
    default: return 'Orders & Direct selling.';
  }
}

// -------------------------------------------------------------
// 3. ANIMALS GUIDE
// -------------------------------------------------------------
function AnimalsGuide() {
  const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🐔 Animals & Habitat Care
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Feed livestock to produce eggs, milk, wool, and truffles.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
        <h5 className="font-bold flex items-center gap-1.5">
          <span>🌾</span> The Feeding Loop:
        </h5>
        <p>1. Craft <strong>Animal Feed</strong> at the <strong>Feed Mill</strong> (⚙️ Produce tab) using Wheat + Corn.</p>
        <p>2. Tap <strong>Feed</strong> on hungry animals (or <strong>Feed All</strong>).</p>
        <p>3. While eating, their production cycle timer ticks down.</p>
        <p>4. When finished, tap <strong>Collect</strong> to gather their yield into your Barn!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SPECIES_LIST.map(sp => {
          const def = ANIMALS[sp];
          return (
            <div key={sp} className="border border-stone-200 dark:border-gray-800 rounded-xl p-3 bg-stone-50/50 dark:bg-stone-900/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{def.emoji}</span>
                <div>
                  <h5 className="font-bold text-sm text-stone-800 dark:text-gray-200">{def.name}</h5>
                  <p className="text-xs text-stone-500 dark:text-gray-400">
                    Product: {def.productEmoji} {def.product}
                  </p>
                </div>
              </div>
              <div className="text-xs space-y-1 text-stone-600 dark:text-stone-300">
                <div>⏱️ <strong>Cycle Time:</strong> {def.productionTimeSec}s</div>
                <div>🥣 <strong>Feed Consumption:</strong> {def.feedPerCycle} Feed per cycle</div>
                <div>🏠 <strong>Base Capacity:</strong> {def.capacity} animals (Upgradeable)</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. BREEDING & GENETICS GUIDE
// -------------------------------------------------------------
function BreedingGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🧬 Breeding, Tiers &amp; Genetic Codex
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Combine animals to mutate into higher tiers and discover lucrative breed products.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['common', 'uncommon', 'rare', 'legendary'] as Tier[]).map(tier => (
          <div
            key={tier}
            className="border rounded-lg p-2.5 text-center text-xs"
            style={{ borderColor: TIER_COLORS[tier] + '80', backgroundColor: TIER_COLORS[tier] + '12' }}
          >
            <div className="font-bold capitalize" style={{ color: TIER_COLORS[tier] }}>
              {tier} Tier
            </div>
            <div className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">
              {tier === 'common' && '8 Base Cycles • Base Products'}
              {tier === 'uncommon' && '12 Base Cycles • +15% Bonus Drops'}
              {tier === 'rare' && '16 Base Cycles • +25% Bonus Drops'}
              {tier === 'legendary' && '20 Base Cycles • Periodic Gem Drops!'}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-stone-50 dark:bg-stone-900/40 rounded-lg p-3 text-xs space-y-1.5 text-stone-600 dark:text-stone-300">
        <h5 className="font-bold text-stone-800 dark:text-gray-200">Genetic Rules to Remember:</h5>
        <ul className="list-disc ml-4 space-y-1">
          <li><strong>Parents:</strong> Select two animals of the same species. Breeding does not consume parents; they return to their pasture after mating!</li>
          <li><strong>Offspring:</strong> Offspring inherit species traits with a strong probability of upgrading to the next tier (e.g. Common + Common can yield Uncommon).</li>
          <li><strong>Codex Gem Bounties:</strong> Every new breed discovered registers in your Codex and pays out immediate <strong>Gems</strong>!</li>
          <li><strong>Important Notice:</strong> High-tier breeds yield special variants (e.g., Gilded Wool, Golden Eggs). Always keep at least 1 Common animal if standard recipes demand regular Wool or Eggs!</li>
        </ul>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. PRODUCTION CHAINS GUIDE
// -------------------------------------------------------------
function ProductionChainGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          ⚙️ Production Facilities &amp; Factories
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Craft raw agricultural items into high-margin artisan goods.
        </p>
      </div>

      <div className="space-y-2.5">
        {Object.values(BUILDINGS).map(b => (
          <div key={b.id} className="border border-stone-200 dark:border-gray-800 rounded-xl p-3 bg-stone-50/50 dark:bg-stone-900/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{b.emoji}</span>
                <div>
                  <h5 className="font-bold text-sm text-stone-800 dark:text-gray-200">{b.name}</h5>
                  <p className="text-[11px] text-stone-500 dark:text-gray-400">
                    Queue Slots: {b.queueSlots} • Unlocks at Level {b.unlockLevel || 1}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-stone-200/60 dark:border-gray-800">
              {b.recipes.map(r => (
                <div key={r.id} className="text-xs flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-stone-700 dark:text-gray-300">
                      {r.inputs.map(i => `${i.qty}x ${i.productId}`).join(' + ')}
                    </span>
                    <span>→</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {r.output.qty}x {r.output.productId}
                    </span>
                  </div>
                  <span className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
                    ⏱️ {r.timeSec}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 6. ORDERS & DELIVERIES GUIDE
// -------------------------------------------------------------
function OrdersGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🚚 Delivery Board, Orders &amp; Leveling
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          The primary driver of Player XP, leveling milestones, and early coins.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
        <h5 className="font-bold">Order Board Rules:</h5>
        <ul className="list-disc ml-4 space-y-1">
          <li><strong>6 Active Slots:</strong> The board maintains 6 concurrent orders requested by local townsfolk.</li>
          <li><strong>Fulfillment:</strong> When you have the requested items in your Silo or Barn, tap <strong>Fulfill</strong> to deliver the crate, earn coins, and gain XP.</li>
          <li><strong>Trashing Unwanted Orders:</strong> If an order requests items you cannot yet make, click the <strong>Trash (🗑️)</strong> icon. The slot will reset with a new order!</li>
          <li><strong>VIP Chef Delivery:</strong> Hourly events trigger high-value Chef Orders paying out bonus Gems alongside huge coins.</li>
          <li><strong>County Domain Aura:</strong> Claiming 4 parcels on the Territory Map cuts order refresh timers by <strong>50%</strong>!</li>
        </ul>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 7. SHOP & ECONOMY GUIDE
// -------------------------------------------------------------
function ShopGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🏪 General Store &amp; Inventory Liquidation
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Convert warehouse surpluses directly into liquid capital.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-stone-800 dark:text-gray-200 mb-1">Single &amp; Bulk Selling</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            Sell individual items (e.g. 5x Carrots, 1x Sweater) or use <strong>Sell All of Item</strong> to liquidate your full stock of a specific product at fair market prices.
          </p>
        </div>
        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-stone-800 dark:text-gray-200 mb-1">Instant "Sell All" Button</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            The top <strong>Sell All Surplus</strong> button instantly liquidates all commercial inventory while automatically protecting essential raw materials (Wheat, Corn, Feed).
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 8. WORKERS & GUILDS GUIDE
// -------------------------------------------------------------
function WorkersGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          👷 Workers &amp; Guild Automation
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Automate your farm with 10 specialized workers across 3 Guild Divisions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-2.5 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-violet-700 dark:text-violet-400">Division A: Field Crew</h5>
          <p className="text-stone-500 dark:text-gray-400 mt-1">
            Farmer, Timberjack, Dock Master, and Artisan. Speed up plot harvests, wood orchards, and factory crafting.
          </p>
        </div>
        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-2.5 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-amber-700 dark:text-amber-400">Division B: Autonomous</h5>
          <p className="text-stone-500 dark:text-gray-400 mt-1">
            Automated Trawler, Beekeeper, Forager, Merchant, Prospector. Passively gather wild goods and honey.
          </p>
        </div>
        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-2.5 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-blue-700 dark:text-blue-400">Division C: Logistics</h5>
          <p className="text-stone-500 dark:text-gray-400 mt-1">
            Barn Overseer. Automatically refills empty animal feeding troughs from your silo feed supply!
          </p>
        </div>
      </div>

      <div className="bg-stone-50 dark:bg-stone-900/40 rounded-lg p-3 text-xs space-y-1.5 text-stone-600 dark:text-stone-300">
        <h5 className="font-bold text-stone-800 dark:text-gray-200">Worker Perks &amp; Milestones:</h5>
        <ul className="list-disc ml-4 space-y-1">
          <li><strong>Auto-Sell vs Hoard Mode:</strong> Toggle workers to either directly sell their yields for instant coins or hoard items into your storage for complex recipes.</li>
          <li><strong>Level Upgrades:</strong> Upgrade workers up to Level 120 using x1, x10, or MAX bulk upgrade modes.</li>
          <li><strong>Hopper Buffer (Lv.40):</strong> Workers buffer overflow cycles so no production is wasted while offline!</li>
          <li><strong>Gem Procs (Lv.60):</strong> Workers gain a 5% chance to drop raw Gems every completed cycle.</li>
        </ul>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 9. FISHERY & WATERS GUIDE
// -------------------------------------------------------------
function FisheryGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🎣 Fishery &amp; Aquatic Codex
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Multi-zone fishing operating in parallel across freshwater, estuary, and ocean waters.
        </p>
      </div>

      <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 rounded-lg p-3 text-xs text-cyan-800 dark:text-cyan-200 space-y-1.5">
        <h5 className="font-bold">Fishery Essentials:</h5>
        <ul className="list-disc ml-4 space-y-1">
          <li><strong>Hiring Fishermen:</strong> All unlocked water zones require an active fisherman to cast lines. You can hire a Dock Fisherman directly in the Fishery tab for 🪙100!</li>
          <li><strong>Parallel Catching:</strong> Once hired, every unlocked zone runs its own timer simultaneously.</li>
          <li><strong>Rod Tiers:</strong> Upgrade your fishing rod from Bamboo → Ash → Carbon → Golden → Mythic Net to speed up catches by up to +250% and dramatically boost Rare and Legendary catches.</li>
          <li><strong>Aquatic Codex:</strong> Discovering each new fish species grants permanent Codex Gem bounties!</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {Object.values(WATER_ZONES).map(z => (
          <div key={z.id} className="border border-stone-200 dark:border-gray-800 rounded-lg p-2.5 bg-stone-50/50 dark:bg-stone-900/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{z.emoji}</span>
              <div>
                <span className="font-bold text-stone-800 dark:text-gray-200">{z.name}</span>
                <span className="text-[10px] text-stone-500 dark:text-gray-400 block capitalize">
                  {z.waterType} • Unlocks Lv.{z.unlockLevel}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-stone-600 dark:text-stone-300">
              Fish species: {z.species.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 10. WILDERNESS EXPEDITIONS GUIDE
// -------------------------------------------------------------
function WildernessGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🏕️ Wilderness Expeditions &amp; Trail Encounters
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Dispatch scouts to deep wilderness biomes to bring home wild animal stock.
        </p>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-3 text-xs text-emerald-800 dark:text-emerald-200 space-y-1.5">
        <h5 className="font-bold">How Expeditions Work:</h5>
        <ul className="list-disc ml-4 space-y-1">
          <li><strong>1. Craft Lures:</strong> Bake specific bait lures (Sweet Seed, Berry Pastry, Truffle Mash, Celestial Ambrosia) at the Bakery.</li>
          <li><strong>2. Dispatch:</strong> Pay the expedition fee and assign a Farmhand scout to target an unlocked biome.</li>
          <li><strong>3. Mid-Trail Decision:</strong> Halfway through the journey, your scout faces a choice (Safe Route vs Risky Route). Safe guarantees a catch; Risky offers legendary creatures at the hazard of losing the lure!</li>
          <li><strong>4. Animal Return:</strong> Rescued animals are automatically transferred into your pastures!</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {Object.values(BIOMES).map(b => (
          <div key={b.id} className="border border-stone-200 dark:border-gray-800 rounded-lg p-2.5 bg-stone-50/50 dark:bg-stone-900/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{b.emoji}</span>
              <div>
                <span className="font-bold text-stone-800 dark:text-gray-200">{b.name}</span>
                <span className="text-[10px] text-stone-500 dark:text-gray-400 block">
                  Req. Lv.{b.unlockLevel} • Fee: 🪙{b.dispatchFee.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-snug">{b.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 11. TERRITORY & ESTATE MAP GUIDE
// -------------------------------------------------------------
function TerritoryGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🗺️ Territory Expansion &amp; Freight Contracts
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Expand your estate borders, unlock powerful passive auras, and fulfill global freight contracts.
        </p>
      </div>

      <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 rounded-lg p-3 text-xs text-teal-800 dark:text-teal-200 space-y-1.5">
        <h5 className="font-bold">Territory Progression:</h5>
        <ul className="list-disc ml-4 space-y-1">
          <li><strong>7 Expandable Parcels:</strong> From Core Homestead to East River Basin, South Quarry, and Port Basin.</li>
          <li><strong>Clearing Debris:</strong> Unlocked land starts covered in wild weeds, river stones, deadwood logs, and stone ruins. Tap to assign workers to clear them.</li>
          <li><strong>Estate Auras:</strong> Claiming more parcels triggers estate-wide buffs:
            <ul className="list-circle ml-4 mt-1 space-y-0.5">
              <li>2 Parcels: <strong>River Settlement</strong> (-10% crop growth timer).</li>
              <li>4 Parcels: <strong>County Domain</strong> (-50% order refresh timer).</li>
              <li>6 Parcels: <strong>Grand Agricultural Estate</strong> (+15% coin yield on all orders).</li>
              <li>7 Parcels: <strong>Regional Sovereign</strong> (+10% instant harvest chance).</li>
            </ul>
          </li>
          <li><strong>Port Basin Freight Contracts:</strong> Unlocking the Port Basin allows accepting massive shipping orders paying over 🪙100,000+ coins and rare gear blueprints!</li>
        </ul>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 12. LIVESTOCK MARKET & ELDERS GUIDE
// -------------------------------------------------------------
function MarketGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          💰 Livestock Market &amp; Elder Animals
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Trade live animals and understand life cycle depreciation.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/40 rounded-lg p-3 text-xs text-yellow-800 dark:text-yellow-200 space-y-1.5">
        <h5 className="font-bold">The Animal Lifecycle &amp; Elders:</h5>
        <ul className="list-disc ml-4 space-y-1">
          <li><strong>Life Cycles:</strong> Every animal is born with a finite number of production cycles (e.g. 8 for Common, up to 20+ for Legendary).</li>
          <li><strong>Aging:</strong> Each time an animal is fed and harvested, 1 cycle is consumed.</li>
          <li><strong>Retirement into Elder:</strong> When all cycles are exhausted, the animal becomes an <strong>Elder</strong> and ceases product output.</li>
          <li><strong>Retirement Payout:</strong> Elders can be sold at the Livestock Market for a large cash sum! Higher tier elders (like Gilded Fleece Rams) payout massive bonuses.</li>
          <li><strong>Re-stocking:</strong> Use the proceeds to purchase fresh young stock or breed the next generation!</li>
        </ul>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 13. PRO STRATEGIES & TIPS GUIDE
// -------------------------------------------------------------
function TipsGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          💡 Master Strategies &amp; Pro Tips
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Advanced strategies to accelerate your path to an automated agricultural empire.
        </p>
      </div>

      <div className="space-y-2 text-xs">
        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-stone-800 dark:text-gray-200 mb-1">1. Keep a Common Animal of Each Species</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            High-tier animals produce exclusive luxury goods (e.g. Gilded Wool, Rich Cream). If all your sheep are Legendary, you won't have regular Wool for Bakery and Loom sweaters. Keep at least 1 Common sheep and cow in your barns!
          </p>
        </div>

        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-stone-800 dark:text-gray-200 mb-1">2. Hire Fishermen Early</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            Fishing runs continuously in the background across all unlocked waters. Hire a 🪙100 Dock Fisherman right away in the Fishery tab to accumulate fish passively for high-value Fish Pie orders.
          </p>
        </div>

        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-stone-800 dark:text-gray-200 mb-1">3. Automate Feeding with Barn Overseer</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            Once unlocked in the Workers tab, the Barn Overseer will automatically replenish troughs as long as your Silo contains Animal Feed. Keep your Feed Mill running!
          </p>
        </div>

        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-stone-800 dark:text-gray-200 mb-1">4. Reinvest Elder Sales into Territory Expansion</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            Elder payouts provide instant lump-sum cash. Channel this capital into unlocking territory parcels to activate powerful estate-wide speed and profit auras.
          </p>
        </div>
      </div>
    </div>
  );
}
