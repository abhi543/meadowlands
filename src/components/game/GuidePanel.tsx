'use client';

import { useState } from 'react';
import {
  BUILDINGS, ANIMALS, CROPS, WORKERS, WATER_ZONES, ROD_TIERS, ROD_TIER_ORDER,
  PRODUCTS, BREED_REGISTRY, TIER_COLORS, TIER_LABELS, BIOMES, LURES,
  PARCEL_CONFIGS, PARCEL_ORDER, ESTATE_AURAS, FREIGHT_CONTRACT_TEMPLATES,
  WORKER_REGISTRY, WORKER_DIVISIONS, MILESTONE_RANKS,
  HOURLY_EVENTS,
  type AnimalSpecies, type Tier, type BiomeId, type LureTypeId,
} from '@/game/data';
import {
  CLIENT_DEFINITIONS,
  REPUTATION_THRESHOLDS,
  type ClientDefinition,
} from '@/game/deliveryData';
import {
  SYSTEMIC_EVENTS,
  EVENT_LEVEL_GATES,
  FAIR_ITEM_SCORES,
  type SystemicEventDef,
  type SystemicEventId,
} from '@/game/eventsData';
import { SUDDEN_EVENT_TEMPLATES } from '@/lib/eventDirector';

type GuideTab =
  | 'overview'
  | 'farm'
  | 'animals'
  | 'breeding'
  | 'production'
  | 'orders'
  | 'shop'
  | 'events'
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
  { id: 'overview',   label: 'All Pages Atlas', emoji: '🗺️', badge: '12 Sections' },
  { id: 'farm',       label: 'Farm & Well',     emoji: '🌾' },
  { id: 'animals',    label: 'Animals',         emoji: '🐔' },
  { id: 'breeding',   label: 'Breeding',        emoji: '🧬' },
  { id: 'production', label: 'Production',      emoji: '⚙️' },
  { id: 'orders',     label: 'Deliveries & Rep',emoji: '🚚', badge: 'Overhaul' },
  { id: 'shop',       label: 'Shop & Economy',  emoji: '🏪' },
  { id: 'events',     label: 'Events & Relics', emoji: '📡', badge: '10 Regional' },
  { id: 'workers',    label: 'Workers Hub',     emoji: '👷' },
  { id: 'fishery',    label: 'Fishery & Waters',emoji: '🎣' },
  { id: 'wilderness', label: 'Wilderness',      emoji: '🏕️' },
  { id: 'territory',  label: 'Territory & Map', emoji: '🧭' },
  { id: 'market',     label: 'Livestock Page',  emoji: '🐄' },
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
            Complete manual for all 12 game sections, production lines, delivery logistics, regional events, and automation.
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
        {activeTab === 'events'     && <EventsGuide />}
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
// 1. ALL PAGES ATLAS (Visual Breakdown of each of the 12 sections)
// -------------------------------------------------------------
function AllPagesAtlas({ onSelectTab }: { onSelectTab: (tab: GuideTab) => void }) {
  const pages = [
    {
      tabId: 'farm' as GuideTab,
      label: '1. Farm & Well (🌾)',
      role: 'Crops, Soil Plots & Hydration',
      desc: 'Plant crops across soil plots. Pump fresh water from the Farm Well to hydrate plots for a massive 2.0x growth speed boost and survive drought crises.',
      action: 'Learn Farm Mechanics',
      color: 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900/40',
    },
    {
      tabId: 'animals' as GuideTab,
      label: '2. Animals (🐔)',
      role: 'Livestock Care & Overclocking',
      desc: 'Nurture Chickens, Cows, Sheep, and Pigs. Feed them crafted feed, trigger high-speed Overclocking (3.0x speed), and collect eggs, milk, wool, and truffles.',
      action: 'Learn Animal Care',
      color: 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40',
    },
    {
      tabId: 'production' as GuideTab,
      label: '3. Produce (⚙️)',
      role: 'Manufacturing & Workshop Overclocks',
      desc: 'Transform raw farm harvest into artisan goods across 8 facilities: Animal Feed, Feed Mill, Bakery, Dairy, Loom, Press, Textiles, and Tailor Shop with overclock multipliers.',
      action: 'Explore Recipes',
      color: 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900/40',
    },
    {
      tabId: 'orders' as GuideTab,
      label: '4. Deliveries (🚚)',
      role: 'Logistics Engine & Client Reputations',
      desc: 'Fulfill premium orders (140%–220% value) for 5 recurring Client Personas. Manage Timed Rush & Futures contracts, and choose Safe Highway vs Wild Shortcut routes.',
      action: 'Read Logistics Guide',
      color: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40',
    },
    {
      tabId: 'shop' as GuideTab,
      label: '5. Shop (🏪)',
      role: 'Emergency Liquidation (60% Value)',
      desc: 'Clear warehouse bottlenecks by dumping surplus items at 60% liquidation rates. Quick "Sell All Surplus" button protects critical seeds and animal feed.',
      action: 'Read Shop Guide',
      color: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40',
    },
    {
      tabId: 'events' as GuideTab,
      label: '6. Events & Relics (📡)',
      role: 'Regional Phenomena & Horizon Radar',
      desc: 'Track 10 Regional Phenomena via live Horizon Radar anomaly ETAs, resolve 30s–75s sudden crises, and mount permanent relics in the Relics Vault.',
      action: 'Explore Regional Events',
      color: 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/40',
    },
    {
      tabId: 'workers' as GuideTab,
      label: '7. Workers (👷)',
      role: 'Automated Guilds & Idle Progress',
      desc: 'Hire 10 specialized workers across Field Hands, Autonomous Gatherers, and Guild Masters. Level them up (up to Lv.120) with Auto-Sell and Hoard modes.',
      action: 'Learn Automation',
      color: 'border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-900/40',
    },
    {
      tabId: 'fishery' as GuideTab,
      label: '8. Fishery (🎣)',
      role: 'Parallel Aquatic Harvesting',
      desc: '5 Water Zones (Pond, River, Estuary, Lake, Ocean) operating in parallel. Hire fishermen directly, upgrade rods, and fill the Aquatic Codex for gems.',
      action: 'Read Fishery Guide',
      color: 'border-cyan-200 bg-cyan-50/50 dark:bg-cyan-950/20 dark:border-cyan-900/40',
    },
    {
      tabId: 'wilderness' as GuideTab,
      label: '9. Wild (🏕️)',
      role: 'Scout Expeditions & Exotic Tiers',
      desc: 'Craft bait lures and send scouts to 4 uncharted wilderness biomes. Make mid-trail risk/reward decisions to bring home rare wild animal breeds.',
      action: 'Read Wilderness Guide',
      color: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40',
    },
    {
      tabId: 'territory' as GuideTab,
      label: '10. Map (🗺️)',
      role: 'Estate Expansion & Aura Buffs',
      desc: 'Clear land debris across 7 parcels. Unlock massive estate-wide auras (Irrigation, Logistics, Margins) and fulfill massive Freight Cargo Contracts.',
      action: 'Explore Territory Map',
      color: 'border-teal-200 bg-teal-50/50 dark:bg-teal-950/20 dark:border-teal-900/40',
    },
    {
      tabId: 'market' as GuideTab,
      label: '11. Market (💰)',
      role: 'Livestock Trading & Elder Retirement',
      desc: 'Purchase new animal stock across all tiers. Monitor your animals remaining life cycles, and sell Elder animals for large retirement payouts.',
      action: 'Explore Livestock Market',
      color: 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900/40',
    },
    {
      tabId: 'breeding' as GuideTab,
      label: '12. Breeding & Codex (🧬)',
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
          Meadowlands is an interlocking agricultural &amp; logistics sandbox. <strong>Farm plots</strong> (boosted by the <strong>Farm Well</strong>) produce crops feeding <strong>Animals</strong> and supplying <strong>Production</strong> buildings. Crafted products fulfill <strong>Client Delivery Contracts</strong> for 140%–220% payouts, leveling up persistent <strong>Client Reputation Perks</strong>. The <strong>Horizon Radar</strong> scans for 10 massive <strong>Regional Phenomena</strong> granting legendary <strong>Relics</strong>. Excess inventory liquidates at the <strong>Shop</strong>, and older animals retire at the <strong>Market</strong>!
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
// 2. FARM, CROPS & WELL GUIDE
// -------------------------------------------------------------
function FarmGuide() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🌾 Farm Plots &amp; Farm Well Hydration Guide
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          The foundation of your entire agricultural supply chain, now boosted by soil hydration.
        </p>
      </div>

      <div className="bg-stone-50 dark:bg-stone-900/40 rounded-lg p-3 text-xs space-y-1.5">
        <h5 className="font-bold text-stone-800 dark:text-gray-200">How Soil Plots Work:</h5>
        <ul className="list-disc ml-4 space-y-1 text-stone-600 dark:text-stone-300">
          <li><strong>Plots:</strong> You start with farmland plots arranged in an expandable grid.</li>
          <li><strong>Planting:</strong> Select a crop seed selector at the top, then tap an empty plot, or click <strong>Plant All</strong> to plant every empty plot in a single click.</li>
          <li><strong>Growth Progress:</strong> Each plot has an animated real-time progress bar. Once filled, the crop sparkles and displays a <strong>Harvest</strong> button.</li>
          <li><strong>Batch Harvesting:</strong> Use <strong>Harvest All</strong> to collect all ready crops simultaneously and gain instant player XP.</li>
          <li><strong>Instant Harvest Chance:</strong> Regional Sovereign Territory aura provides a 10% chance for instant maturity right after planting!</li>
        </ul>
      </div>

      {/* Farm Well & Soil Hydration Engine */}
      <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 rounded-lg p-3 text-xs text-cyan-800 dark:text-cyan-200 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">⛲</span>
          <h5 className="font-bold text-sm">Farm Well &amp; Soil Hydration System (2.0x Boost)</h5>
        </div>
        <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
          The Farm Well sits directly beside your plots, holding pressurized groundwater to irrigate parched soil.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700 dark:text-stone-300">
          <div className="bg-white/70 dark:bg-gray-800/60 p-2 rounded border border-cyan-200/60 dark:border-cyan-800/40">
            <span className="font-bold text-cyan-700 dark:text-cyan-300">💧 Manual Pumping &amp; Tank:</span>
            <p className="mt-0.5 text-[11px]">
              Tap the Well handle to pump fresh water (+1 💧 per tap). The well also naturally replenishes itself over time up to its maximum capacity (Base 50 💧).
            </p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/60 p-2 rounded border border-cyan-200/60 dark:border-cyan-800/40">
            <span className="font-bold text-cyan-700 dark:text-cyan-300">⚡ 2.0x Growth Speed (Watered):</span>
            <p className="mt-0.5 text-[11px]">
              Click <strong>Water All Plots</strong> to consume 1 💧 per plot. Hydrated soil sparkles blue and doubles growth speed — cutting crop timers by a full <strong>50%</strong>!
            </p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/60 p-2 rounded border border-cyan-200/60 dark:border-cyan-800/40">
            <span className="font-bold text-cyan-700 dark:text-cyan-300">🪙 Well Capacity Upgrades:</span>
            <p className="mt-0.5 text-[11px]">
              Invest farm coins to upgrade the Well Level. Each level expands total tank capacity (+25 💧) and quickens natural refill speed.
            </p>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/60 p-2 rounded border border-cyan-200/60 dark:border-cyan-800/40">
            <span className="font-bold text-cyan-700 dark:text-cyan-300">🔥 Crisis Defense:</span>
            <p className="mt-0.5 text-[11px]">
              During Drought and Brushfire phenomena, unwatered crops halt their timers completely. Keeping water stored in your well is essential to quench fires and protect harvests!
            </p>
          </div>
        </div>
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
                  ⏱️ Base: {crop.growTimeSec}s (Watered: {Math.ceil(crop.growTimeSec / 2)}s) • 📦 Yield: {crop.yieldCount}x into Silo
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
    case 'wheat': return 'Animal Feed (Produce), Artisan Bread (Bakery), Orders.';
    case 'corn': return 'Animal Feed (Produce), Orders.';
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
          🐔 Animals, Habitats &amp; Overclocking
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Feed livestock to produce eggs, milk, wool, and truffles, with optional overclock surges.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
        <h5 className="font-bold flex items-center gap-1.5">
          <span>🌾</span> The Feeding Loop:
        </h5>
        <p>1. Craft <strong>Animal Feed</strong> at the <strong>Animal Feed</strong> tab (🥣 Produce tab) using Wheat, Corn, Carrots, or Soybeans.</p>
        <p>2. Tap <strong>Feed</strong> on hungry animals (or <strong>Feed All</strong>).</p>
        <p>3. While eating, their production cycle timer ticks down.</p>
        <p>4. When finished, tap <strong>Collect</strong> to gather their yield into your Barn!</p>
      </div>

      {/* Unified 3-Tier Overclocking & Burnout System */}
      <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h5 className="font-bold text-sm text-amber-300">Global Coin-Based Overclock System</h5>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
            3 Operational Tiers
          </span>
        </div>
        <p className="text-stone-300 leading-relaxed">
          Need products immediately for a Timed Rush or Cargo Freight order? Tap <strong>⚡ Boost</strong> on any active animal, farm plot, building, fishery zone, or hired worker.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="bg-stone-900/80 p-2 rounded-lg border border-amber-500/30">
            <span className="font-bold text-amber-400">⚡ Tier 1: Shift Overtime</span>
            <p className="text-stone-400 mt-0.5">1.5x Speed • Base Cost • 0% Burnout Risk</p>
          </div>
          <div className="bg-stone-900/80 p-2 rounded-lg border border-orange-500/40">
            <span className="font-bold text-orange-400">🔥 Tier 2: Double Shift</span>
            <p className="text-stone-400 mt-0.5">2.5x Speed • 2.2x Cost • 15% Burnout Risk</p>
          </div>
          <div className="bg-stone-900/80 p-2 rounded-lg border border-rose-500/40">
            <span className="font-bold text-rose-400">💥 Tier 3: Adrenaline Overdrive</span>
            <p className="text-stone-400 mt-0.5">4.0x Speed + 1★ Yield • 4.5x Cost • 35% Risk</p>
          </div>
        </div>
        <div className="pt-1 border-t border-amber-900/40 text-[10px] text-stone-400 space-y-0.5">
          <p>🛑 <strong>Burnout State:</strong> If an entity burns out upon harvest/production completion, it enters an <strong>Exhausted</strong> state for 180s. Wait out the timer or pay a coin Vet/Mechanic fee to restore immediately.</p>
          <p>📈 <strong>Anti-Spam Decay:</strong> Each subsequent overclock within 10 minutes increases coin cost by +25%. Costs decay back to baseline after 10 minutes of normal operation.</p>
        </div>
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
                <div>⏱️ <strong>Cycle Time:</strong> {def.productionTimeSec}s (Overclocked: {Math.ceil(def.productionTimeSec / 3)}s)</div>
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
    <div className="space-y-4">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🧬 Breeding, Tier Mutation Engine &amp; Incubator
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Pair adult livestock in the Incubator to trigger upward tier mutations and hatch Rare &amp; Legendary breeds.
        </p>
      </div>

      {/* Tier Badges */}
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
              {tier === 'common' && '8 Base Cycles • 2m Hatch • Base Products'}
              {tier === 'uncommon' && '12 Base Cycles • 5m Hatch • +15% Drops'}
              {tier === 'rare' && '16 Base Cycles • 10m Hatch • +25% Drops'}
              {tier === 'legendary' && '20 Base Cycles • 20m Hatch • Periodic Gems!'}
            </div>
          </div>
        ))}
      </div>

      {/* Probability Mutation Table */}
      <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎲</span>
          <h5 className="font-bold text-xs uppercase tracking-wider text-violet-900 dark:text-violet-200">
            Tier Mutation Probability Engine
          </h5>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-violet-200 dark:border-violet-800/60 text-stone-500 dark:text-stone-400 text-[11px]">
                <th className="py-1.5 px-2">Parent Pair</th>
                <th className="py-1.5 px-2">Common</th>
                <th className="py-1.5 px-2">Uncommon</th>
                <th className="py-1.5 px-2">Rare</th>
                <th className="py-1.5 px-2">Legendary</th>
                <th className="py-1.5 px-2">Upward Mutation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-100 dark:divide-violet-900/40 text-[11px]">
              <tr>
                <td className="py-1.5 px-2 font-semibold">Common + Common</td>
                <td className="py-1.5 px-2 text-stone-500">85%</td>
                <td className="py-1.5 px-2 text-emerald-600 dark:text-emerald-400 font-bold">15%</td>
                <td className="py-1.5 px-2 text-stone-400">0%</td>
                <td className="py-1.5 px-2 text-stone-400">0%</td>
                <td className="py-1.5 px-2 text-emerald-600 dark:text-emerald-400 font-bold">+15% to Uncommon</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold">Common + Uncommon</td>
                <td className="py-1.5 px-2 text-stone-500">45%</td>
                <td className="py-1.5 px-2 text-emerald-600 dark:text-emerald-400">50%</td>
                <td className="py-1.5 px-2 text-sky-600 dark:text-sky-400 font-bold">5%</td>
                <td className="py-1.5 px-2 text-stone-400">0%</td>
                <td className="py-1.5 px-2 text-sky-600 dark:text-sky-400 font-bold">+5% Rare Jackpot</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold">Uncommon + Uncommon</td>
                <td className="py-1.5 px-2 text-stone-500">20%</td>
                <td className="py-1.5 px-2 text-emerald-600 dark:text-emerald-400">65%</td>
                <td className="py-1.5 px-2 text-sky-600 dark:text-sky-400 font-bold">15%</td>
                <td className="py-1.5 px-2 text-stone-400">0%</td>
                <td className="py-1.5 px-2 text-sky-600 dark:text-sky-400 font-bold">+15% to Rare</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold">Rare + Uncommon</td>
                <td className="py-1.5 px-2 text-stone-400">0%</td>
                <td className="py-1.5 px-2 text-emerald-600 dark:text-emerald-400">50%</td>
                <td className="py-1.5 px-2 text-sky-600 dark:text-sky-400">45%</td>
                <td className="py-1.5 px-2 text-amber-500 font-bold">5%</td>
                <td className="py-1.5 px-2 text-amber-500 font-bold">+5% Legendary Jackpot</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold">Rare + Rare</td>
                <td className="py-1.5 px-2 text-stone-400">0%</td>
                <td className="py-1.5 px-2 text-stone-400">0%</td>
                <td className="py-1.5 px-2 text-sky-600 dark:text-sky-400">88%</td>
                <td className="py-1.5 px-2 text-amber-500 font-bold">12%</td>
                <td className="py-1.5 px-2 text-amber-500 font-bold">+12% Legendary Jackpot</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 font-semibold">Legendary + Rare / Leg.</td>
                <td className="py-1.5 px-2 text-stone-400">0%</td>
                <td className="py-1.5 px-2 text-stone-400">0%</td>
                <td className="py-1.5 px-2 text-sky-600 dark:text-sky-400">65%</td>
                <td className="py-1.5 px-2 text-amber-500 font-bold">35%</td>
                <td className="py-1.5 px-2 text-amber-500 font-bold">+35% Legendary Offspring</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-stone-50 dark:bg-stone-900/40 rounded-xl p-3.5 text-xs space-y-2 text-stone-600 dark:text-stone-300">
        <h5 className="font-bold text-stone-800 dark:text-gray-200">Incubator Mechanics &amp; Secrets:</h5>
        <ul className="list-disc ml-4 space-y-1">
          <li><strong>Parents Never Consumed:</strong> Parents rest temporarily during mating and immediately return to their coop or pasture once incubation starts!</li>
          <li><strong>Active Incubator Slots:</strong> Track egg hatch timers in real time. Incubators can be expanded with gems to incubate multiple eggs simultaneously.</li>
          <li><strong>Coin Speedups:</strong> Need eggs hatched before a crisis or fair? Pay a coin speedup fee proportional to remaining time for instant hatch readiness.</li>
          <li><strong>Animated Egg Hatching Reveal:</strong> Tap to crack your eggs and discover their breed, stats, and mutation bonus with celebratory sound effects!</li>
          <li><strong>5% Apex Mutant Jackpot:</strong> Every egg has a bonus 5% roll to hatch as an Apex Mutant with permanent 1.5x production speed and +5 Gems!</li>
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
          ⚙️ Production Facilities &amp; Overclocking
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Craft raw agricultural items into high-margin artisan goods with facility overclocks.
        </p>
      </div>

      {/* Workshop Overclocking Banner */}
      <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 rounded-lg p-3 text-xs text-orange-900 dark:text-orange-200 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔨</span>
          <h5 className="font-bold text-sm">Workshop Overclocking &amp; Event Multipliers</h5>
        </div>
        <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
          Workshops can be temporarily pushed into overdrive to clear stacked recipe queues rapidly:
        </p>
        <ul className="list-disc ml-4 space-y-1 text-stone-700 dark:text-stone-300">
          <li><strong>3-Tier Overdrive Menu:</strong> Choose between Tier 1 (1.5x speed, 0% risk), Tier 2 (2.5x speed, 15% burnout risk), or Tier 3 (4.0x speed + 1 bonus craft, 35% risk).</li>
          <li><strong>Burnout &amp; Mechanic Service:</strong> Overclock burnout halts machinery for 180 seconds. Instantly restore operation by paying a Mechanic Tune-Up fee (25🪙) or wait out the clock.</li>
          <li><strong>Artisan Masterclass Event:</strong> During this regional event, the Bakery, Loom, and Cheese Press operate at <strong>4.0x speed with 0% ingredient waste</strong>!</li>
          <li><strong>Master Artisan's Ledger Relic:</strong> Winning this event relic permanently cuts machine crafting duration across the estate by a flat <strong>5%</strong>.</li>
        </ul>
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
// 6. DELIVERIES, CLIENT PERSONAS & LOGISTICS GUIDE
// -------------------------------------------------------------
function OrdersGuide() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🚚 Deliveries, Client Personas &amp; Logistics Engine
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          The high-margin economic core of Meadowlands: high payouts, persistent client perks, and route risk management.
        </p>
      </div>

      {/* Economic Calibration Callout */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-3.5 text-white shadow-md text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm flex items-center gap-1.5 text-blue-200">
            <span>⚖️</span> Economic Calibration: Shop Dump vs Delivery Board
          </span>
          <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
            Up to 220% Value
          </span>
        </div>
        <p className="text-blue-100 leading-relaxed">
          Selling directly in the Shop is an <strong>emergency liquidation dump paying only 60%</strong> of base value. 
          In contrast, fulfilling Delivery Board contracts pays <strong>140% to 220% premium rates</strong>, earns high Player XP, and builds <strong>Client Reputation</strong> to unlock permanent estate perks!
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-800/80 text-[11px]">
          <div className="bg-black/20 p-2 rounded">
            <span className="text-red-300 font-bold">🏪 Shop Liquidation:</span>
            <p className="text-blue-200 mt-0.5">60% Payout • Instant Cash • Clears Silo/Barn Overflow</p>
          </div>
          <div className="bg-black/20 p-2 rounded">
            <span className="text-emerald-300 font-bold">🚚 Delivery Board:</span>
            <p className="text-blue-200 mt-0.5">140%–220% Payout • XP Progression • Permanent Client Perks</p>
          </div>
        </div>
      </div>

      {/* Farm Level Calibration & Unlock Progression */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-2">
        <h5 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
          <span>🎯</span> Farm Level Order Calibration
        </h5>
        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          Delivery board contracts are <strong>strictly gated by your Farm Level</strong>. Clients will never request items you haven&apos;t unlocked yet, and contract complexity scales with your progress:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
          <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <span className="font-bold text-amber-700 dark:text-amber-400">🌱 Level 1 (Starter):</span>
            <p className="text-stone-600 dark:text-stone-300 mt-0.5">Standard contracts only. Requests 1–3 starter items: Wheat, Feed, Eggs, Fish.</p>
          </div>
          <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <span className="font-bold text-amber-700 dark:text-amber-400">🌽 Levels 2–3 (Apprentice):</span>
            <p className="text-stone-600 dark:text-stone-300 mt-0.5">Unlocks Corn, Milk, Bread, Carrots. Timed Rush contracts become available.</p>
          </div>
          <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <span className="font-bold text-amber-700 dark:text-amber-400">🧀 Levels 4–5 (Artisan):</span>
            <p className="text-stone-600 dark:text-stone-300 mt-0.5">Strawberries, Wool, Cheese, Pies, Sweaters. Advance Futures contracts unlock.</p>
          </div>
          <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <span className="font-bold text-amber-700 dark:text-amber-400">👑 Level 6+ (Master Estate):</span>
            <p className="text-stone-600 dark:text-stone-300 mt-0.5">Town Projects unlock. High-tier Truffles, Honey, Crab Bisque, Luxury Goods.</p>
          </div>
        </div>
      </div>

      {/* 5 Recurring Client Personas */}
      <div className="space-y-2">
        <h5 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-gray-400">
          5 Recurring Client Personas &amp; Reputation Perks
        </h5>
        <div className="grid grid-cols-1 gap-2.5">
          {Object.values(CLIENT_DEFINITIONS).map(c => (
            <div
              key={c.id}
              className="border border-stone-200 dark:border-gray-800 rounded-xl p-3 bg-stone-50/50 dark:bg-stone-900/40 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1.5 rounded-xl bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 shadow-sm">
                    {c.avatar}
                  </span>
                  <div>
                    <h6 className="font-bold text-sm text-stone-800 dark:text-gray-100">{c.name}</h6>
                    <span className="text-[10px] text-stone-500 dark:text-gray-400 font-medium">{c.title}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                  Reputation Lv.1–5
                </span>
              </div>

              <p className="text-[11px] italic text-stone-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/40 p-2 rounded border border-stone-200/50 dark:border-gray-800">
                "{c.quote}"
              </p>

              <div>
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider block mb-1">
                  ⭐ Persistent Reputation Perks (Levels 1 → 5):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                  {c.perks.map(p => (
                    <div key={p.level} className="flex items-start gap-1.5 text-stone-600 dark:text-stone-300">
                      <span className="font-bold text-amber-600 dark:text-amber-400">Lv.{p.level}:</span>
                      <span><strong>{p.perkName}</strong> — {p.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contract Types & Breach Penalties */}
      <div className="space-y-2">
        <h5 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-gray-400">
          Contract Classifications &amp; Risk Mechanics
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-2.5 bg-stone-50/50 dark:bg-stone-900/30">
            <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-gray-200 mb-1">
              <span>📦</span> Standard Delivery Contract
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              Permanent duration with zero time pressure. Provides solid 140% baseline coin payouts and steady client reputation gains.
            </p>
          </div>

          <div className="border border-amber-200 dark:border-amber-800/40 rounded-lg p-2.5 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200 mb-1">
              <span>⚡</span> Timed Rush Contract (90s Countdown)
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              Urgent request paying <strong>+40% to +80% bonus coins/XP</strong>. 
              <span className="text-red-600 dark:text-red-400 font-semibold block mt-1">
                ⚠️ Breach Penalty: If the 90s timer expires unfulfilled, you suffer a -15 Client Reputation penalty!
              </span>
            </p>
          </div>

          <div className="border border-purple-200 dark:border-purple-800/40 rounded-lg p-2.5 bg-purple-50/50 dark:bg-purple-950/20">
            <div className="flex items-center gap-1.5 font-bold text-purple-800 dark:text-purple-200 mb-1">
              <span>📜</span> Advance "Futures" Contract (180s Lock)
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              Forward commitment paying massive <strong>+80% to +120% payouts</strong> and bonus Gems. 
              <span className="text-red-600 dark:text-red-400 font-semibold block mt-1">
                ⚠️ Breach Penalty: Failure inflicts a severe -30 Client Reputation penalty and forfeiture!
              </span>
            </p>
          </div>

          <div className="border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200 mb-1">
              <span>🏛️</span> Collaborative Town Projects
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
              Massive bulk deliveries requested by the municipal council. Fulfilling them yields huge reputation windfalls and rare building deeds.
            </p>
          </div>
        </div>
      </div>

      {/* Route Logistics: Highway vs Wild Shortcut */}
      <div className="border border-blue-200 dark:border-blue-800/40 rounded-xl p-3 bg-blue-50/40 dark:bg-blue-950/20 text-xs space-y-2">
        <h5 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
          <span>🗺️</span> Route Logistics: Safe Kingsway Highway vs Wild Shortcut
        </h5>
        <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
          Every delivery order offers two dispatch routes with distinct risk/reward profiles:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-lg border border-blue-200 dark:border-blue-700">
            <span className="font-bold text-blue-700 dark:text-blue-300">🛣️ Safe Kingsway Highway:</span>
            <ul className="list-disc ml-3.5 mt-1 space-y-0.5 text-stone-600 dark:text-stone-300">
              <li>100% Guaranteed safe arrival.</li>
              <li>Standard delivery payout and client reputation.</li>
              <li>Zero hazard checks or ambush risks.</li>
            </ul>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 rounded-lg border border-amber-300 dark:border-amber-700">
            <span className="font-bold text-amber-700 dark:text-amber-300">🌲 Wild Bandit Shortcut:</span>
            <ul className="list-disc ml-3.5 mt-1 space-y-0.5 text-stone-600 dark:text-stone-300">
              <li><strong>+25% Extra Coin Bounty</strong> on successful delivery.</li>
              <li>Chance to scavenge bonus materials (Nails, Wood, Deeds).</li>
              <li><strong>25% Hazard Ambush Risk:</strong> If ambushed, wagon suffers a 40% cargo spoilage penalty!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Town Favor Shop & Dual-Track Progression */}
      <div className="border border-amber-300 dark:border-amber-800/60 rounded-xl p-3.5 bg-gradient-to-r from-amber-950/20 via-stone-900/40 to-amber-950/20 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5 text-sm">
            <span>🏛️</span> Town Favor Shop &amp; Dual-Track Reputation System
          </h5>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-500/40 font-mono">
            NEW FEATURE
          </span>
        </div>
        <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
          In Meadowlands, fulfilling delivery orders rewards a <strong>dual-track progression model</strong> that pairs permanent estate growth with flexible emergency utility:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/40 space-y-1">
            <span className="font-black text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <span>⭐</span> Track 1: Lifetime Reputation (Passive Perks)
            </span>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              Every point of reputation accumulated raises client trust tiers (Levels 1 to 5). Once reached, perks are <strong>permanently active farm-wide</strong>—such as coin bonuses, crafting speedups, and extra animal yields.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/40 space-y-1">
            <span className="font-black text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <span>🎖️</span> Track 2: Spendable Favor Tokens (VIP Utility Shop)
            </span>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              In addition to raising lifetime levels, earned points act as <strong>liquid Favor Tokens</strong>. Spend Favor in the Town Favor Shop tab on high-impact VIP items!
            </p>
          </div>
        </div>

        {/* 4 Favor Shop Items */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Favor Shop Catalog &amp; Effects:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-stone-200 dark:border-stone-800 flex items-start gap-2">
              <span className="text-xl">🛡️</span>
              <div>
                <span className="font-bold text-stone-800 dark:text-white">Emergency Crisis Shield (40 Favor)</span>
                <p className="text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  Automatically intercepts and neutralizes the next incoming radar disaster (Predator Raids, Blight, Flash Drought) with 0 losses!
                </p>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-stone-200 dark:border-stone-800 flex items-start gap-2">
              <span className="text-xl">⚡</span>
              <div>
                <span className="font-bold text-stone-800 dark:text-white">Instant Overclock Voucher (30 Favor)</span>
                <p className="text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  Grants 1 Free Tier 3 Overdrive (4.0x Speed + 1 Yield) with 0 coin cost and 0% burnout risk on any plot, animal, machine, or worker!
                </p>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-stone-200 dark:border-stone-800 flex items-start gap-2">
              <span className="text-xl">🎲</span>
              <div>
                <span className="font-bold text-stone-800 dark:text-white">VIP Contract Reroll (15 Favor)</span>
                <p className="text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  Instantly replaces all delivery board contracts with 6 fresh, high-value assignments without breach fees.
                </p>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-stone-900/60 p-2 rounded-lg border border-stone-200 dark:border-stone-800 flex items-start gap-2">
              <span className="text-xl">📜</span>
              <div>
                <span className="font-bold text-stone-800 dark:text-white">Municipal Granary Permit (80 Favor)</span>
                <p className="text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  Permanently expands both Silo and Barn storage capacity by +25 slots each across the entire homestead!
                </p>
              </div>
            </div>
          </div>
        </div>
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
          Clear warehouse bottlenecks by dumping surplus items at 60% liquidation value.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
        <h5 className="font-bold flex items-center gap-1.5">
          <span>⚠️</span> The 60% Liquidation Calibration Rule:
        </h5>
        <p>
          Direct Shop sales payout <strong>60% of base item value</strong> (`baseValue * 0.60`). 
          The Shop is purposefully calibrated as an <strong>emergency inventory relief valve</strong> to free up Silo and Barn capacity.
        </p>
        <p className="mt-1">
          Whenever possible, prioritize fulfilling <strong>Delivery Board Contracts</strong> for 140%–220% rates and client reputation perks!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-stone-800 dark:text-gray-200 mb-1">Single &amp; Bulk Selling</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            Sell individual quantities (e.g. 5x Carrots, 1x Sweater) or use <strong>Sell All of Item</strong> to liquidate your entire stack of a specific item at 60% liquidation value.
          </p>
        </div>
        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-stone-800 dark:text-gray-200 mb-1">Smart "Sell All Surplus" Button</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            The top <strong>Sell All Surplus</strong> button instantly liquidates all commercial inventory while automatically protecting your essential agricultural staples (Wheat, Corn, Feed).
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// 8. REGIONAL PHENOMENA & RELICS GUIDE
// -------------------------------------------------------------
function EventsGuide() {
  const [eventCategory, setEventCategory] = useState<'regional' | 'sudden' | 'hourly' | 'relics'>('regional');
  const [expandedEvent, setExpandedEvent] = useState<string | null>('county_fair');
  const [eventSearch, setEventSearch] = useState<string>('');

  const filteredRegionalEvents = Object.values(SYSTEMIC_EVENTS).filter(ev => {
    if (!eventSearch) return true;
    const q = eventSearch.toLowerCase();
    return (
      ev.name.toLowerCase().includes(q) ||
      ev.premise.toLowerCase().includes(q) ||
      ev.mechanicalShift.toLowerCase().includes(q) ||
      ev.grandReward.relicName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h4 className="font-bold text-base text-stone-800 dark:text-gray-100 flex items-center gap-2">
          📡 Comprehensive Event Encyclopedia &amp; Relics Vault
        </h4>
        <p className="text-xs text-stone-500 dark:text-gray-400">
          Master guides, stage-by-stage requirements, item scoring tables, and strategy blueprints for every event in Meadowlands.
        </p>
      </div>

      {/* Autonomous Horizon Radar Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-pink-900 to-amber-900 rounded-xl p-3.5 text-white shadow-md text-xs space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-black text-sm flex items-center gap-1.5 text-rose-200">
            <span>📡</span> Autonomous Horizon Radar Engine
          </span>
          <span className="text-[10px] bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full border border-white/30 animate-pulse">
            Live Anomaly Detection
          </span>
        </div>
        <p className="text-rose-100 leading-relaxed text-[11px]">
          The Horizon Radar constantly scans the atmospheric frontier. Regional phenomena trigger cyclically across 3 distinct lifecycle phases:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-rose-800/80 text-[11px]">
          <div className="bg-black/25 p-2 rounded-lg">
            <span className="text-amber-300 font-bold block">1. ⏱️ Forecast Phase</span>
            <p className="text-rose-200 mt-0.5 text-[10px] leading-snug">
              Radar warning alert with a prep timer (5–15 min). Stockpile raw crops and mill feed before the competition begins!
            </p>
          </div>
          <div className="bg-black/25 p-2 rounded-lg">
            <span className="text-emerald-300 font-bold block">2. ⚡ Active Phase</span>
            <p className="text-rose-200 mt-0.5 text-[10px] leading-snug">
              Special global modifiers activate (e.g. 4x workshop speed, flat 30s crops, 0s fishing cooldowns). Fulfill stages to claim rewards!
            </p>
          </div>
          <div className="bg-black/25 p-2 rounded-lg">
            <span className="text-purple-300 font-bold block">3. 🏆 Settlement Phase</span>
            <p className="text-rose-200 mt-0.5 text-[10px] leading-snug">
              Claim grand coin and gem jackpots and permanently install exclusive Relic Monuments into your Relics Vault!
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Category Navigation Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-x-auto">
        <button
          onClick={() => setEventCategory('regional')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            eventCategory === 'regional'
              ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <span>🎪</span>
          <span>10 Regional Master Events</span>
        </button>
        <button
          onClick={() => setEventCategory('sudden')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            eventCategory === 'sudden'
              ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <span>🚨</span>
          <span>Sudden Crises &amp; Bounties</span>
        </button>
        <button
          onClick={() => setEventCategory('hourly')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            eventCategory === 'hourly'
              ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <span>⏳</span>
          <span>Hourly Encounters</span>
        </button>
        <button
          onClick={() => setEventCategory('relics')}
          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            eventCategory === 'relics'
              ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <span>🏛️</span>
          <span>Relics Vault Directory</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. REGIONAL MASTER EVENTS TAB                             */}
      {/* ========================================================= */}
      {eventCategory === 'regional' && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search event name, rule, or relic reward..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="space-y-3">
            {filteredRegionalEvents.map(ev => {
              const minLevel = EVENT_LEVEL_GATES[ev.id] || 1;
              const isExpanded = expandedEvent === ev.id;
              const forecastMin = Math.round(ev.forecastDurationMs / 60000);
              const activeMin = Math.round(ev.activeDurationMs / 60000);
              const cooldownHr = Math.round(ev.cooldownMs / 3600000);

              return (
                <div
                  key={ev.id}
                  className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900/60 shadow-sm overflow-hidden transition-all"
                >
                  {/* Card Header */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          {ev.emoji}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-black text-sm text-stone-900 dark:text-white">
                              {ev.name}
                            </h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                              Lv.{minLevel}+
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                            {ev.badge}
                          </span>
                        </div>
                      </div>

                      {/* Timers Badge */}
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-2 py-1 rounded-lg">
                        <span>⏳ Prep: {forecastMin}m</span>
                        <span>•</span>
                        <span>⚡ Active: {activeMin}m</span>
                        <span>•</span>
                        <span>💤 CD: {cooldownHr}h</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {ev.premise}
                    </p>

                    {/* Mechanical Shift Box */}
                    <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 p-2.5 rounded-xl text-xs space-y-0.5">
                      <span className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                        <span>⚡</span> Active Global Rule:
                      </span>
                      <p className="text-stone-700 dark:text-stone-300 text-[11px] leading-relaxed">
                        {ev.mechanicalShift}
                      </p>
                    </div>

                    {/* Quick Grand Reward Banner */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ev.grandReward.relicEmoji}</span>
                        <div>
                          <span className="font-black text-stone-800 dark:text-stone-200 text-xs block">
                            {ev.grandReward.relicName}
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400">
                            {ev.grandReward.relicDescription}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap pl-2">
                        +{ev.grandReward.coins.toLocaleString()} 🪙<br />+{ev.grandReward.gems} 💎
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}
                      className="w-full mt-1 py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700/80 text-[11px] font-bold text-stone-700 dark:text-stone-300 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>{isExpanded ? '▲ Hide Full Stages & Walkthrough' : '▼ View Stage Requirements & Pro Strategy'}</span>
                    </button>
                  </div>

                  {/* Expanded Stage & Strategy Details */}
                  {isExpanded && (
                    <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40 p-3.5 space-y-3 animate-in fade-in">
                      {/* Objective Summary */}
                      <div className="text-xs">
                        <span className="font-black uppercase tracking-wider text-[10px] text-stone-500 dark:text-stone-400 block mb-1">
                          🎯 Event Objective
                        </span>
                        <p className="text-stone-700 dark:text-stone-300 font-medium">
                          {ev.objectiveSummary}
                        </p>
                      </div>

                      {/* Stage-by-Stage Breakdown */}
                      <div className="space-y-2">
                        <span className="font-black uppercase tracking-wider text-[10px] text-stone-500 dark:text-stone-400 block">
                          📋 Tiered Progression Stages ({ev.stages.length} Stages)
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {ev.stages.map(st => (
                            <div
                              key={st.stage}
                              className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-amber-600 dark:text-amber-400 text-xs">
                                    Stage {st.stage}: {st.title}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono font-bold">
                                    Target: {st.targetCount}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                                  {st.itemCategoryDesc}
                                  {st.requiredItemTypes && st.requiredItemTypes.length > 0 && (
                                    <span className="block text-[10px] text-stone-500 dark:text-stone-500 font-mono mt-0.5">
                                      Accepted: {st.requiredItemTypes.join(', ')}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40 whitespace-nowrap">
                                🎁 {st.rewardDescription}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Special Embedded Guide for County Fair Grand Derby */}
                      {ev.id === 'county_fair' && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2 text-xs">
                          <h6 className="font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                            <span>🎪</span> County Fair Exhibition Item Scoring Guide
                          </h6>
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                            Points are rarity-weighted. Submit goods in batches of 5, 25, or All from your Silo &amp; Barn:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                            <div className="bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                              <span className="font-black text-stone-700 dark:text-stone-300 block mb-0.5">⚪ Common (1 pt)</span>
                              <span className="text-stone-500 leading-tight block">Wheat, Corn, Egg, Milk, Feed, Carrot, Cotton</span>
                            </div>
                            <div className="bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                              <span className="font-black text-emerald-600 dark:text-emerald-400 block mb-0.5">🟢 Uncommon (3 pts)</span>
                              <span className="text-stone-500 leading-tight block">Strawberry, Soybean, Bread, Wool, Honey, Fish, Berries</span>
                            </div>
                            <div className="bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                              <span className="font-black text-purple-600 dark:text-purple-400 block mb-0.5">🟣 Rare (10 pts)</span>
                              <span className="text-stone-500 leading-tight block">Pumpkin, Cheese, Pie, Sweater, Truffle, Silk, Butter</span>
                            </div>
                            <div className="bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                              <span className="font-black text-amber-600 dark:text-amber-400 block mb-0.5">🌟 Legendary (25 pts)</span>
                              <span className="text-stone-500 leading-tight block">Gold Nugget, Golden Egg, Starlight Milk, Gilded Wool, Cake</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold italic">
                            💡 Speed Run Strategy: 24 Legendary items (25 pts each) or 60 Rare items (10 pts each) instantly achieves the 600-point Grand Championship!
                          </p>
                        </div>
                      )}

                      {/* Walkthrough & Pro Tips */}
                      <div className="bg-stone-100 dark:bg-stone-800/60 p-3 rounded-xl text-xs space-y-1">
                        <span className="font-black text-stone-800 dark:text-stone-200 text-[11px] uppercase tracking-wide flex items-center gap-1">
                          <span>💡</span> Pro Strategy &amp; Walkthrough
                        </span>
                        {ev.id === 'royal_fleet' && (
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                            During the 15-minute forecast, stockpile high-volume wheat and feed. In active phase, bake bread and pies continuously. Complete Stage 4 fine textiles using wool and sweaters to secure the 24-hour +15% delivery payout crest!
                          </p>
                        )}
                        {ev.id === 'barn_fire' && (
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                            Keep your well water supply topped off! When flare-ups spawn across your farm plots, immediately click them with bucket water to prevent scorched crops and unlock the Mineral Ash 3x growth boost.
                          </p>
                        )}
                        {ev.id === 'midnight_smuggler' && (
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                            The black market barge accepts valuable truffle products, silk, and starlight milk. Deliver all 3 contracts to win the Smuggler's Compass (-20% Wilderness expedition timers).
                          </p>
                        )}
                        {ev.id === 'locust_swarm' && (
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                            Locusts will hover over mature fields blocking regular harvests. Rapidly tap the locust entities to jar-capture 30 swarms. Stationing beekeepers passively repels them!
                          </p>
                        )}
                        {ev.id === 'salmon_run' && (
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                            The fishery dock cooldown is completely eliminated during this frenzy! Cast continuously to catch 15 migration salmon and unlock the prestigious 40,000 Coin Feast of Kings recipe!
                          </p>
                        )}
                        {ev.id === 'carnival_circus' && (
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                            Supply high volumes of animal feed, wheat, carrots, and berries to the carnival manager stall. Hitting 100 total feeds permanently awards the companion Circus Cub (+10% permanent XP)!
                          </p>
                        )}
                        {ev.id === 'alchemical_bloom' && (
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                            All plots enjoy flat 30-second crop growth during spore fog! Plant carrots or wheat rapidly to harvest 40 times and stock up on instant-finish Glowing Spore potions.
                          </p>
                        )}
                        {ev.id === 'artisan_masterclass' && (
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                            Workshops operate at 4x speed with ZERO ingredient loss! Stack bread, sweaters, and cheese to complete 20 crafts and permanently reduce machine crafting duration across the estate by 5%.
                          </p>
                        )}
                        {ev.id === 'ancient_ruins' && (
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                            Donate raw cotton, wool, gold nuggets, and truffle to clear the 3 temple chambers (120 total donations) to excavate the Ancient Sun Relic for a permanent +15% XP multiplier.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SUDDEN CRISES & BOUNTIES TAB                           */}
      {/* ========================================================= */}
      {eventCategory === 'sudden' && (
        <div className="space-y-3">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl p-3 text-xs text-red-900 dark:text-red-200 space-y-1">
            <h5 className="font-bold flex items-center gap-1.5">
              <span>🚨</span> High-Stakes Adrenaline Crises (30s–75s Countdown)
            </h5>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[11px]">
              Sudden crises trigger unpredictably on your Horizon Radar with glowing red screen pulses and an urgent ticking clock HUD.
              You must act before the timer expires to avert devastating livestock and crop losses!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {Object.entries(SUDDEN_EVENT_TEMPLATES).map(([key, ev]) => (
              <div
                key={key}
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  ev.type === 'CRISIS'
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{ev.emoji}</span>
                      <div>
                        <h6 className="font-black text-sm text-stone-900 dark:text-white">
                          {ev.title}
                        </h6>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                          ev.type === 'CRISIS' ? 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200' : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                        }`}>
                          {ev.type} • {ev.durationSeconds}s Timer • Lv.{ev.minLevel}+
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="p-2 rounded-lg bg-white/70 dark:bg-stone-900/70 border border-stone-200/50 dark:border-stone-800 text-[10px] space-y-1">
                    <div>
                      <strong className="text-stone-800 dark:text-stone-200">Action Required:</strong>{' '}
                      <span className="text-stone-600 dark:text-stone-400">
                        {ev.requiredAction.type === 'RAPID_TAP'
                          ? `Rapid-Tap button (${ev.requiredAction.targetCount} taps within ${ev.durationSeconds}s)`
                          : `Resource Sacrifice (${ev.requiredAction.resourceCost?.label})`}
                      </span>
                    </div>
                    {ev.penaltyOnFail.amountPercentage > 0 && (
                      <div className="text-rose-600 dark:text-rose-400 font-semibold">
                        ⚠️ Failure Penalty: {ev.penaltyOnFail.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 mt-2 flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  <span>Victory: +{ev.rewardOnSuccess.coins.toLocaleString()} 🪙 • +{ev.rewardOnSuccess.gems} 💎</span>
                  {ev.rewardOnSuccess.relicName && (
                    <span className="text-purple-600 dark:text-purple-300 truncate max-w-[120px]">
                      {ev.rewardOnSuccess.relicName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tactical Crisis Countermeasures */}
          <div className="p-3 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-xl space-y-2 text-xs">
            <h6 className="font-black text-stone-800 dark:text-stone-200 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <span>🛡️</span> Radar Crisis Tactical Countermeasures
            </h6>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                <span className="font-bold text-amber-700 dark:text-amber-400">🐺 Predator Ambush:</span>
                <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                  Rapidly tap the Alarm Bell to scare away wolves, or station a <strong>Guardian Sheepdog</strong> to automatically eliminate predators.
                </p>
              </div>
              <div className="bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">🍂 Blight Outbreak:</span>
                <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                  Administer Quarantine Vaccines to infected plots or deploy chemical fungicides before the infection bar hits 100%.
                </p>
              </div>
              <div className="bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                <span className="font-bold text-blue-700 dark:text-blue-400">💧 Drought Heatwave:</span>
                <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                  Pump the artisan well to irrigate parched soil. Upgrading the well grants larger emergency reserves.
                </p>
              </div>
              <div className="bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                <span className="font-bold text-purple-700 dark:text-purple-400">🛡️ Crisis Shields:</span>
                <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                  Purchase emergency crisis shields in the Town Favor Shop. Shields automatically negate any sudden crisis without resource loss!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. HOURLY WEATHER & VISITS TAB                            */}
      {/* ========================================================= */}
      {eventCategory === 'hourly' && (
        <div className="space-y-3">
          <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 rounded-xl p-3 text-xs text-sky-900 dark:text-sky-200 space-y-1">
            <h5 className="font-bold flex items-center gap-1.5">
              <span>⏳</span> Periodic Hourly Farm Encounters
            </h5>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[11px]">
              Every hour, a brief atmospheric weather phenomenon or wandering trader visits your estate for 3 to 15 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {Object.values(HOURLY_EVENTS).map(ev => {
              const durationMin = Math.round(ev.durationMs / 60000);
              return (
                <div
                  key={ev.type}
                  className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{ev.emoji}</span>
                        <div>
                          <h6 className="font-black text-sm text-stone-900 dark:text-white">{ev.name}</h6>
                          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                            Duration: {durationMin} Minutes
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-800 text-[10px] text-stone-500 dark:text-stone-400">
                    {ev.type === 'vip_chef' && '👨‍🍳 Tip: Deliver specialty bakery and dairy goods for 2.5x coin payouts.'}
                    {ev.type === 'crow_attack' && '🐦 Tip: Tap the crows hovering over plots to shoo them before they damage seeds.'}
                    {ev.type === 'rainstorm' && '⛈️ Tip: Plant slow crops like pumpkins and cotton; rain speeds growth by 50%!'}
                    {ev.type === 'smuggler' && '📦 Tip: Free mystery crate containing coins, gems, and rare seeds.'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. RELICS VAULT MASTER DIRECTORY TAB                      */}
      {/* ========================================================= */}
      {eventCategory === 'relics' && (
        <div className="space-y-3">
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-xl p-3 text-xs text-purple-900 dark:text-purple-200 space-y-1">
            <h5 className="font-bold flex items-center gap-1.5">
              <span>🏛️</span> The Relics Vault &amp; Permanent Monument Multipliers
            </h5>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[11px]">
              Relics are prestigious, permanent artifacts unlocked by completing the Settlement Phase of regional events.
              Once installed, their passive buffs stack across your entire estate!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {Object.values(SYSTEMIC_EVENTS).map(ev => (
              <div
                key={ev.id}
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 flex items-start gap-2.5 shadow-xs"
              >
                <span className="text-3xl p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  {ev.grandReward.relicEmoji}
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <h6 className="font-black text-xs text-stone-900 dark:text-white">
                      {ev.grandReward.relicName}
                    </h6>
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded">
                      {ev.emoji} {ev.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                    {ev.grandReward.relicDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
          <li><strong>Overclocking Workers:</strong> Tap <strong>⚡ Boost</strong> on any hired worker to push them into Overdrive (Tier 1: 1.5x, Tier 2: 2.5x, Tier 3: 4.0x speed + bonus item procs).</li>
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
          <li><strong>Zone Overclocking:</strong> Need fish immediately? Tap <strong>⚡ Boost</strong> on active water zones to trigger 1.5x–4.0x catch velocity + bonus fish yields!</li>
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
          🐄 Livestock Page &amp; Elder Animals
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
          Advanced strategies to accelerate your path to an automated agricultural and logistics empire.
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
          <h5 className="font-bold text-cyan-800 dark:text-cyan-300 mb-1">2. Pump the Well Before Planting High-Value Crops</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            Hydrated soil plots grow crops at <strong>2.0x speed</strong>! Before sowing slow-growing crops like Pumpkins or Cotton, tap the Farm Well to store water, hit <strong>Water All Plots</strong>, and cut their growth timers in half.
          </p>
        </div>

        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-blue-800 dark:text-blue-300 mb-1">3. Deliveries Over Shop Dumps (140%–220% vs 60%)</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            Never sell high-value artisan crafts directly at the Shop unless your barn is in emergency overflow. Delivery Board contracts pay <strong>140% to 220%</strong> of base value, grant high Player XP, and level up permanent client perks.
          </p>
        </div>

        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-amber-800 dark:text-amber-300 mb-1">4. Hedge Wild Shortcut Risks with Client Perks</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            The Wild Shortcut grants a juicy <strong>+25% coin bounty</strong> and material drops, but carries a 25% hazard ambush risk. Level up <strong>Captain Sterling</strong> (Fair Winds: -12% hazard failure) and <strong>Old Man Jed</strong> (Trailblazer: halves ambush penalty) to run high-profit wild routes safely!
          </p>
        </div>

        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-rose-800 dark:text-rose-300 mb-1">5. Stockpile for Radar Phenomena Forecasts</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            When the Horizon Radar detects an incoming event (like <em>The Royal Fleet</em> or <em>Travelling Carnival</em>), use the Forecast prep countdown to mill bulk animal feed, harvest wheat, and craft bread so you can blast through all stages the moment the event goes active!
          </p>
        </div>

        <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/30">
          <h5 className="font-bold text-stone-800 dark:text-gray-200 mb-1">6. Automate Feeding with Barn Overseer</h5>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            Once unlocked in the Workers tab, the Barn Overseer will automatically replenish troughs as long as your Silo contains Animal Feed. Keep your Animal Feed production running!
          </p>
        </div>
      </div>
    </div>
  );
}
