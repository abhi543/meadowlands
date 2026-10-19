'use client';

import { useGameStore, isCropItem, getStorageAvailableStock } from '@/game/store';
import { BUILDINGS, PRODUCTS, CROPS, FISH_SPECIES, WORKER_REGISTRY, type BuildingId, type RecipeDef, type WorkerRole } from '@/game/data';
import { useState } from 'react';
import { OverclockActionMenu } from './OverclockActionMenu';
import { getItemEconomicProfile } from '@/game/pricingEngine';

const BUILDING_LIST: BuildingId[] = ['animal_feed', 'feed_mill', 'bakery', 'dairy', 'loom', 'press', 'textiles', 'tailor_shop', 'workshop'];

const FEED_MILLER_ROLES: { role: WorkerRole; feedName: string; cropName: string; icon: string }[] = [
  { role: 'feed_miller_wheat', feedName: 'Grain Feed', cropName: 'Wheat', icon: '🌾' },
  { role: 'feed_miller_corn', feedName: 'Corn Feed', cropName: 'Corn', icon: '🌽' },
  { role: 'feed_miller_carrot', feedName: 'Carrot Blend', cropName: 'Carrot', icon: '🥕' },
  { role: 'feed_miller_soy', feedName: 'Soy Chow', cropName: 'Soybean', icon: '🫘' },
];

const BUILDING_THEME: Record<BuildingId, {
  emoji: string; color: string; bgActive: string; borderActive: string;
  headerFrom: string; headerTo: string; headerText: string; headerSub: string;
  progressColor: string; craftBtn: string; craftBtnHover: string;
}> = {
  animal_feed: { emoji: '🥣', color: 'text-amber-700 dark:text-amber-300', bgActive: 'bg-amber-500 dark:bg-amber-600', borderActive: 'border-amber-600', headerFrom: 'from-amber-100', headerTo: 'to-yellow-100', headerText: 'text-amber-950 dark:text-amber-100', headerSub: 'text-amber-800 dark:text-amber-300', progressColor: 'bg-amber-500 dark:bg-amber-400', craftBtn: 'bg-amber-500 hover:bg-amber-600', craftBtnHover: 'bg-amber-600 hover:bg-amber-700' },
  feed_mill: { emoji: '\u2699\uFE0F', color: 'text-slate-600 dark:text-slate-300', bgActive: 'bg-slate-500 dark:bg-slate-600', borderActive: 'border-slate-600', headerFrom: 'from-slate-100', headerTo: 'to-gray-100', headerText: 'text-slate-900 dark:text-slate-100', headerSub: 'text-slate-700 dark:text-slate-300', progressColor: 'bg-slate-400 dark:bg-slate-500', craftBtn: 'bg-slate-500 hover:bg-slate-600', craftBtnHover: 'bg-slate-600 hover:bg-slate-700' },
  bakery: { emoji: '\u{1F3ED}', color: 'text-orange-600 dark:text-orange-300', bgActive: 'bg-orange-500 dark:bg-orange-600', borderActive: 'border-orange-600', headerFrom: 'from-orange-100', headerTo: 'to-amber-100', headerText: 'text-orange-900 dark:text-orange-100', headerSub: 'text-orange-700 dark:text-orange-300', progressColor: 'bg-orange-400 dark:bg-orange-500', craftBtn: 'bg-orange-500 hover:bg-orange-600', craftBtnHover: 'bg-orange-600 hover:bg-orange-700' },
  dairy: { emoji: '\u{1F9C0}', color: 'text-yellow-600 dark:text-yellow-300', bgActive: 'bg-yellow-500 dark:bg-yellow-600', borderActive: 'border-yellow-600', headerFrom: 'from-yellow-100', headerTo: 'to-amber-50', headerText: 'text-yellow-900 dark:text-yellow-100', headerSub: 'text-yellow-700 dark:text-yellow-300', progressColor: 'bg-yellow-400 dark:bg-yellow-500', craftBtn: 'bg-yellow-500 hover:bg-yellow-600', craftBtnHover: 'bg-yellow-600 hover:bg-yellow-700' },
  loom: { emoji: '\u{1F9F5}', color: 'text-purple-600 dark:text-purple-300', bgActive: 'bg-purple-500 dark:bg-purple-600', borderActive: 'border-purple-600', headerFrom: 'from-purple-100', headerTo: 'to-violet-100', headerText: 'text-purple-900 dark:text-purple-100', headerSub: 'text-purple-700 dark:text-purple-300', progressColor: 'bg-purple-400 dark:bg-purple-500', craftBtn: 'bg-purple-500 hover:bg-purple-600', craftBtnHover: 'bg-purple-600 hover:bg-purple-700' },
  press: { emoji: '\u{1FAD2}', color: 'text-emerald-600 dark:text-emerald-300', bgActive: 'bg-emerald-500 dark:bg-emerald-600', borderActive: 'border-emerald-600', headerFrom: 'from-emerald-100', headerTo: 'to-green-50', headerText: 'text-emerald-900 dark:text-emerald-100', headerSub: 'text-emerald-700 dark:text-emerald-300', progressColor: 'bg-emerald-400 dark:bg-emerald-500', craftBtn: 'bg-emerald-500 hover:bg-emerald-600', craftBtnHover: 'bg-emerald-600 hover:bg-emerald-700' },
  textiles: { emoji: '\u{1F33F}', color: 'text-teal-600 dark:text-teal-300', bgActive: 'bg-teal-500 dark:bg-teal-600', borderActive: 'border-teal-600', headerFrom: 'from-teal-100', headerTo: 'to-cyan-50', headerText: 'text-teal-900 dark:text-teal-100', headerSub: 'text-teal-700 dark:text-teal-300', progressColor: 'bg-teal-400 dark:bg-teal-500', craftBtn: 'bg-teal-500 hover:bg-teal-600', craftBtnHover: 'bg-teal-600 hover:bg-teal-700' },
  tailor_shop: { emoji: '\u{1F9E5}', color: 'text-rose-600 dark:text-rose-300', bgActive: 'bg-rose-500 dark:bg-rose-600', borderActive: 'border-rose-600', headerFrom: 'from-rose-100', headerTo: 'to-pink-50', headerText: 'text-rose-900 dark:text-rose-100', headerSub: 'text-rose-700 dark:text-rose-300', progressColor: 'bg-rose-400 dark:bg-rose-500', craftBtn: 'bg-rose-500 hover:bg-rose-600', craftBtnHover: 'bg-rose-600 hover:bg-rose-700' },
  workshop: { emoji: '🔨', color: 'text-amber-800 dark:text-amber-300', bgActive: 'bg-amber-700 dark:bg-amber-600', borderActive: 'border-amber-700', headerFrom: 'from-amber-100', headerTo: 'to-stone-100', headerText: 'text-amber-950 dark:text-amber-100', headerSub: 'text-amber-900 dark:text-amber-300', progressColor: 'bg-amber-600 dark:bg-amber-500', craftBtn: 'bg-amber-700 hover:bg-amber-800', craftBtnHover: 'bg-amber-800 hover:bg-amber-900' },
};

function getIngredientSourceHint(itemId: string): string {
  if (itemId in CROPS) return `Grow ${CROPS[itemId as keyof typeof CROPS].name} on Farm`;
  if (itemId === 'egg') return 'Collect from Chickens';
  if (itemId === 'egg_blue') return 'Pasture Araucana (Uncommon Chicken)';
  if (itemId === 'egg_obsidian') return 'Midnight Silkie (Rare Chicken)';
  if (itemId === 'egg_golden') return 'Solar Phoenix Hen (Legendary)';
  if (itemId === 'milk') return 'Collect from Cows';
  if (itemId === 'milk_rich_cream') return 'Jersey Buttercup (Uncommon Cow)';
  if (itemId === 'milk_alpine') return 'Highland Shaggy Yak (Rare Cow)';
  if (itemId === 'milk_starlight') return 'Celestial Star-Bovine (Legendary)';
  if (itemId === 'wool') return 'Collect from Sheep';
  if (itemId === 'wool_patterned') return 'Jacob Four-Horn (Uncommon Sheep)';
  if (itemId === 'wool_merino') return 'Merino Cloud Sheep (Rare Sheep)';
  if (itemId === 'wool_gilded') return 'Golden Fleece Ram (Legendary)';
  if (itemId === 'truffle') return 'Collect from Pigs';
  if (itemId === 'truffle_white') return 'Berkshire Black (Uncommon Pig)';
  if (itemId === 'truffle_alba') return 'Iberian Bristle Boar (Rare Pig)';
  if (itemId === 'truffle_diamond') return 'Gilded Snout Chimera (Legendary)';
  // Breed bonus drops
  if (itemId === 'soft_down_feather') return 'Proc: Pasture Araucana (10% chance)';
  if (itemId === 'glossy_quill') return 'Proc: Midnight Silkie (20% chance)';
  if (itemId === 'churned_butter') return 'Proc: Jersey Buttercup (15% chance)';
  if (itemId === 'yak_wool') return 'Proc: Highland Shaggy Yak (25% chance)';
  if (itemId === 'horn_shavings') return 'Proc: Jacob Four-Horn (15% chance)';
  if (itemId === 'lanolin_balm') return 'Proc: Merino Cloud Sheep (25% chance)';
  if (itemId === 'ancient_coin') return 'Proc: Berkshire Black (15% chance)';
  if (itemId === 'foraged_nut') return 'Proc: Iberian Bristle Boar (25% chance)';
  if (itemId === 'ancient_hoard') return 'Proc: Gilded Snout Chimera (100%)';
  if (itemId === 'fish') return 'Catch at Fishery or use Auto-Fisher';
  if (itemId === 'feed') return 'Craft in Animal Feed tab';
  if (itemId === 'bread') return 'Bake at Bakery';
  if (itemId === 'cheese') return 'Craft at Dairy';
  if (itemId === 'fabric') return 'Weave at Loom';
  if (itemId === 'yarn') return 'Spin at Loom';
  if (itemId === 'truffle_oil') return 'Press at Press';
  if (itemId === 'honey') return 'Press at Press building (requires 2x Honey Comb)';
  if (itemId === 'honey_comb') return 'Beekeeper / Apiary Tender (Workers tab, Hoard mode)';
  if (itemId === 'wild_berries') return 'Forager (Hoard mode) or grow';
  if (itemId === 'gold_nugget') return 'Prospector (Hoard mode)';
  if (itemId === 'cotton') return 'Grow Cotton on Farm';
  if (itemId === 'silk') return 'Weave at Textiles';
  if (itemId === 'sweater') return 'Craft at Tailor Shop';
  if (itemId === 'pie') return 'Bake at Bakery';
  // Supply chain: crafted from breed-specific products
  if (itemId === 'golden_shawl') return 'Weave at Loom (3 Gilded Wool)';
  if (itemId === 'merino_sweater') return 'Weave at Loom (2 Merino Wool)';
  if (itemId === 'rich_butter') return 'Churn at Dairy (2 Rich Cream)';
  if (itemId === 'alpine_cheese') return 'Age at Dairy (2 Alpine Milk)';
  if (itemId === 'golden_cake') return 'Bake at Bakery (Golden Egg + Bread)';
  // Quality Crops
  if (itemId.endsWith('_silver')) return 'Harvest Silver Crop from Hydrated Farm Soil';
  if (itemId.endsWith('_gold')) return 'Harvest Gold Crop from Optimal Soil (40-80% Moisture)';
  if (itemId.endsWith('_prismatic')) return 'Harvest Prismatic Crop (Rainbow Sunshower bonus)';
  // Fish Species Hints
  if (itemId === 'catfish') return 'Catch in Stillwater or River (Fishery)';
  if (itemId === 'trout') return 'Catch in River (Fishery)';
  if (itemId === 'mud_crab') return 'Catch in Estuary or Pond (Fishery)';
  if (itemId === 'salmon') return 'Catch in River Upstream (Fishery)';
  if (itemId === 'tuna') return 'Catch in Ocean Deep (Fishery)';
  if (itemId === 'golden_trout') return 'Catch in Alpine Waters (Fishery)';
  if (itemId === 'sturgeon') return 'Catch in Ancient Waters (Fishery)';
  if (itemId === 'marlin') return 'Catch in Ocean Deep (Rare, Fishery)';
  if (itemId === 'lanternfish') return 'Catch in Abyssal Trench (Legendary, Fishery)';
  // Territory-locked items
  if (itemId === 'iron_ore' || itemId === 'gold_ore') return 'Mine at Quarry Ridge (Parcel required)';
  if (itemId === 'apple' || itemId === 'cherry') return 'Grow in Sunken Grove Orchard (Parcel required)';
  if (itemId === 'smoked_trout') return 'Fish at Riverfront Estuary (Parcel required)';
  if (itemId === 'fine_sail') return 'Weave at Guild Loom in Highland Meadow (Parcel required)';
  // Prehistoric & Workshop Materials
  if (itemId === 'chitin_molt_plates') return 'Shed by Asaphid Trilobite in Prehistoric Sanctuary';
  if (itemId === 'prismatic_wing_membrane') return 'Shed by Meganeura in Prehistoric Sanctuary';
  if (itemId === 'thermal_scutes') return 'Shed by Dimetrodon in Prehistoric Sanctuary';
  if (itemId === 'mineral_slab') return 'Frontier Trail Strata Scavenge & Outpost';
  if (itemId === 'fired_hardwood') return 'Cured in Workshop or Bio-Lab';
  if (itemId === 'tempered_glass') return 'Tempered in Workshop or Bio-Lab';
  return 'Produce or gather';
}

function getItemEmoji(itemId: string): string {
  if (itemId in CROPS) return CROPS[itemId as keyof typeof CROPS].emoji;
  if (itemId in PRODUCTS) return PRODUCTS[itemId as keyof typeof PRODUCTS].emoji;
  if (itemId in FISH_SPECIES) return (FISH_SPECIES as any)[itemId].emoji;
  return '\u{1F4E6}';
}

function getItemName(itemId: string): string {
  if (itemId in CROPS) return CROPS[itemId as keyof typeof CROPS].name;
  if (itemId in PRODUCTS) return PRODUCTS[itemId as keyof typeof PRODUCTS].name;
  if (itemId in FISH_SPECIES) return (FISH_SPECIES as any)[itemId].name;
  if (itemId === 'feed') return 'Feed';
  return itemId;
}

function canCraftRecipe(recipe: RecipeDef, silo: Record<string, number>, barn: Record<string, number>): boolean {
  for (const input of recipe.inputs) {
    const have = getStorageAvailableStock(silo, barn, input.productId);
    if (have < input.qty) return false;
  }
  return true;
}

function calcMaxCraftable(recipe: RecipeDef, silo: Record<string, number>, barn: Record<string, number>): number {
  let max = Infinity;
  for (const input of recipe.inputs) {
    const available = getStorageAvailableStock(silo, barn, input.productId);
    max = Math.min(max, Math.floor(available / input.qty));
  }
  return max === Infinity ? 0 : max;
}

export function ProductionPanel() {
  const {
    productionQueues,
    silo,
    barn,
    level,
    coins,
    startProduction,
    collectProduction,
    startProductionAll,
    collectProductionAll,
    buildingOverclocks,
    toggleBuildingOverclock,
    cureBuildingExhaustion,
    unifiedWorkers,
    hireUnifiedWorker,
    toggleUnifiedWorkerMode,
    togglePauseUnifiedWorker,
    isAllWorkersPaused,
    togglePauseAllWorkers,
    specialistWorkers,
  } = useGameStore();
  const [activeBuilding, setActiveBuilding] = useState<BuildingId>('animal_feed');
  const [, setTick] = useState(0);

  // 1-second interval for overclock timers
  useState(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  });

  const building = BUILDINGS[activeBuilding];
  const queue = productionQueues[activeBuilding] || [];
  const isLocked = building.unlockLevel ? level < building.unlockLevel : false;
  const doneCount = queue.filter(s => s.done).length;
  const activeCount = queue.filter(s => !s.done).length;
  const theme = BUILDING_THEME[activeBuilding];
  const freeSlots = building.queueSlots - activeCount;

  const overclockState = buildingOverclocks[activeBuilding] || {
    isOverclocked: false,
    expiresAt: null,
    isExhausted: false,
    exhaustedUntil: null,
  };
  const isOverclocked = Boolean(overclockState.isOverclocked && overclockState.expiresAt && overclockState.expiresAt > Date.now());
  const isExhausted = Boolean(overclockState.isExhausted && overclockState.exhaustedUntil && overclockState.exhaustedUntil > Date.now());
  const overclockRemaining = isOverclocked ? Math.max(0, Math.ceil(((overclockState.expiresAt || 0) - Date.now()) / 1000)) : 0;
  const exhaustedRemaining = isExhausted ? Math.max(0, Math.ceil(((overclockState.exhaustedUntil || 0) - Date.now()) / 1000)) : 0;

  return (
    <div className="space-y-3">
      {/* Building Tabs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
        {BUILDING_LIST.map(bId => {
          const b = BUILDINGS[bId];
          const t = BUILDING_THEME[bId];
          const q = productionQueues[bId] || [];
          const slots = q.filter(s => !s.done).length;
          const done = q.filter(s => s.done).length;
          const locked = b.unlockLevel ? level < b.unlockLevel : false;
          const isActive = activeBuilding === bId;
          const bOverclock = buildingOverclocks[bId];
          const bIsOverclocked = Boolean(bOverclock?.isOverclocked && bOverclock?.expiresAt && bOverclock?.expiresAt > Date.now());
          const bIsExhausted = Boolean(bOverclock?.isExhausted && bOverclock?.exhaustedUntil && bOverclock?.exhaustedUntil > Date.now());

          return (
            <button
              key={bId}
              onClick={() => setActiveBuilding(bId)}
              className={`py-2 px-1.5 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 border-2 relative ${
                isActive
                  ? `${t.bgActive} text-white ${t.borderActive} shadow-lg scale-105`
                  : `bg-white dark:bg-gray-800 ${t.color} border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600`
              } ${locked ? 'opacity-40' : ''}`}
            >
              {bIsOverclocked && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-amber-500 rounded-full px-1 animate-pulse">
                  ⚡
                </span>
              )}
              {bIsExhausted && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-rose-500 rounded-full px-1">
                  💤
                </span>
              )}
              <span className={`transition-transform duration-200 ${isActive ? 'text-2xl' : 'text-xl'}`}>{t.emoji}</span>
              <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{b.name}</span>
              {slots > 0 && <span className={`text-[9px] font-bold px-1.5 rounded-full ${isActive ? 'bg-white/30 text-white' : 'bg-orange-400 text-white'}`}>{slots}</span>}
              {done > 0 && !isActive && <span className="text-[9px] font-bold px-1.5 rounded-full bg-green-500 text-white animate-pulse">{done}{'\u2705'}</span>}
              {locked && <span className="text-[10px]">{'\u{1F512}'}</span>}
            </button>
          );
        })}
      </div>

      {/* Active Building Detail */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 overflow-hidden">
        <div className={`bg-gradient-to-r ${theme.headerFrom} dark:from-gray-800 ${theme.headerTo} dark:to-gray-800 px-4 py-3 border-b border-stone-200 dark:border-gray-700`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{theme.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-lg ${theme.headerText}`}>{building.name}</h3>
                </div>
                <p className={`text-xs ${theme.headerSub}`}>
                  {isLocked ? '\u{1F512} Unlock at Level ' + building.unlockLevel : `Queue: ${activeCount}/${building.queueSlots} slots`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Overclock / Exhaustion Controls */}
              {!isLocked && (
                <OverclockActionMenu
                  entityId={`building_${activeBuilding}`}
                  entityType="building"
                  name={building.name}
                />
              )}

              {!isLocked && doneCount > 0 && (
                <button onClick={() => collectProductionAll(activeBuilding)} className="px-4 py-2 text-sm font-bold rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all shadow-lg shadow-green-200/50 active:scale-95 flex items-center gap-1.5">
                  <span>{'\u2705'}</span> Collect All <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-xs font-bold">{doneCount}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {isLocked ? (
          <div className="p-6 text-center space-y-2">
            <div className="text-3xl">{'\u{1F512}'}</div>
            <p className="text-sm text-stone-400 dark:text-gray-500 italic">Reach Level {building.unlockLevel} to unlock this building!</p>
            <p className="text-xs text-stone-400 dark:text-gray-500">Current level: {level} {'\u2014'} need {(building.unlockLevel || 0) - level} more</p>
          </div>
        ) : (
          <>
            {/* Queue Full Hint */}
            {freeSlots <= 0 && (
              <div className="mx-3 mt-3 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1.5">
                <span>{'\u{1F4E6}'}</span>
                <span className="font-medium">Queue full!</span>
                <span>Wait for items to finish or collect completed ones to free slots.</span>
              </div>
            )}

            {/* Feed Millers Automation Roster for All Feed Types */}
            {activeBuilding === 'animal_feed' && (
              <div className="mx-3 mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-300 dark:border-amber-700/60 shadow-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥣</span>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-stone-800 dark:text-stone-100 flex items-center gap-1.5 flex-wrap">
                        Feed Millers Guild (All Animal Feed Types)
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          {FEED_MILLER_ROLES.filter(f => unifiedWorkers?.[f.role]?.isHired && !unifiedWorkers?.[f.role]?.isPaused).length}/4 Active
                        </span>
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Hire specialized millers to automate feed production for every grain and livestock type.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {specialistWorkers?.worker_feedmaster_barnaby?.isHired && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/50 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 shadow-xs">
                        <span className="text-sm">🥣</span>
                        <span>Barnaby: +30% Speed, +1 Bonus</span>
                      </div>
                    )}
                    {FEED_MILLER_ROLES.some(f => unifiedWorkers?.[f.role]?.isHired) && (
                      <button
                        onClick={() => {
                          const anyActive = FEED_MILLER_ROLES.some(f => unifiedWorkers?.[f.role]?.isHired && !unifiedWorkers?.[f.role]?.isPaused);
                          FEED_MILLER_ROLES.forEach(f => {
                            const w = unifiedWorkers?.[f.role];
                            if (w?.isHired && (anyActive ? !w.isPaused : w.isPaused)) {
                              togglePauseUnifiedWorker(f.role);
                            }
                          });
                        }}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white/80 dark:bg-stone-800 hover:bg-white text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Toggle pause on all hired feed millers"
                      >
                        {FEED_MILLER_ROLES.some(f => unifiedWorkers?.[f.role]?.isHired && !unifiedWorkers?.[f.role]?.isPaused)
                          ? '⏸️ Pause Millers'
                          : '▶️ Resume Millers'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {FEED_MILLER_ROLES.map(({ role, feedName, cropName, icon }) => {
                    const cfg = WORKER_REGISTRY[role];
                    const worker = unifiedWorkers?.[role];
                    const isHired = Boolean(worker?.isHired);
                    const isPaused = Boolean(worker?.isPaused);
                    const canAfford = coins >= cfg.baseCost;
                    const isUnlocked = level >= cfg.unlockLevel;

                    return (
                      <div
                        key={role}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isHired
                            ? isPaused
                              ? 'bg-amber-50/70 dark:bg-stone-900/90 border-amber-500/50 shadow-xs opacity-90'
                              : 'bg-white/90 dark:bg-stone-900/90 border-amber-400/80 shadow-xs'
                            : 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-90'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xl">{icon}</span>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-stone-800 dark:text-stone-100 truncate">
                                {cfg.name}
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-stone-500 truncate">
                                {cropName} &rarr; {feedName}
                              </div>
                            </div>
                          </div>
                          {isHired && (
                            <div className="flex items-center gap-1 shrink-0">
                              {isPaused && (
                                <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                  ⏸️ Paused
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                Lv.{worker?.level || 1}
                              </span>
                            </div>
                          )}
                        </div>

                        {isHired ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                                {isPaused ? (
                                  <>
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                                    <span className="text-amber-600 dark:text-amber-400 font-semibold">Paused</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                    <span>{worker?.autoSell ? 'Auto-Selling' : 'Milling to Silo'}</span>
                                  </>
                                )}
                              </span>
                              <span className="font-semibold text-stone-600 dark:text-stone-300">
                                {worker?.stats?.totalItemsProduced || 0} batches
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                onClick={() => togglePauseUnifiedWorker(role)}
                                className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-0.5 shadow-xs active:scale-95 ${
                                  isPaused
                                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 border-emerald-400'
                                    : 'bg-stone-100 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                                }`}
                                title={isPaused ? "Resume this miller" : "Temporarily pause this miller"}
                              >
                                <span>{isPaused ? '▶️ Resume' : '⏸️ Pause'}</span>
                              </button>
                              <button
                                onClick={() => toggleUnifiedWorkerMode(role)}
                                className="py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-0.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700"
                                title="Toggle between Hoard mode (deposits feed in Silo) and Auto-Sell (converts to coins)"
                              >
                                <span>{worker?.autoSell ? '🪙 Sell' : '🥣 Silo'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                              {!isUnlocked ? `Unlocks at Lv.${cfg.unlockLevel}` : `Cost: ${cfg.baseCost}🪙`}
                            </div>
                            <button
                              onClick={() => hireUnifiedWorker(role)}
                              disabled={!isUnlocked || !canAfford}
                              className="w-full py-1 px-1.5 rounded-lg text-[10px] font-bold text-stone-900 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-40 transition-all active:scale-95 cursor-pointer shadow-xs disabled:cursor-not-allowed"
                            >
                              {!isUnlocked ? `Reach Lv.${cfg.unlockLevel}` : `Hire (${cfg.baseCost}🪙)`}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recipes */}
            <div className="p-3 space-y-2">
              <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">Recipes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {building.recipes.map(recipe => {
                const canCraft = canCraftRecipe(recipe, silo, barn);
                const maxCraftable = calcMaxCraftable(recipe, silo, barn);
                const canCraftAll = Math.min(maxCraftable, freeSlots);
                const queueFull = activeCount >= building.queueSlots;

                const missingIngredients: { name: string; emoji: string; have: number; need: number; source: string }[] = [];
                for (const inp of recipe.inputs) {
                  const have = getStorageAvailableStock(silo, barn, inp.productId);
                  if (have < inp.qty) {
                    missingIngredients.push({ name: getItemName(inp.productId), emoji: getItemEmoji(inp.productId), have, need: inp.qty, source: getIngredientSourceHint(inp.productId) });
                  }
                }

                const outputProfile = getItemEconomicProfile(recipe.output.productId);
                const totalOutputValue = outputProfile.baseValue * recipe.output.qty;

                return (
                  <div key={recipe.id} className="bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2.5 border border-stone-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-sm text-stone-800 dark:text-gray-100 truncate">
                            {recipe.emoji} {recipe.name}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400" title={`Derived Base Value: ${outputProfile.baseValue}c per unit`}>
                              🪙 {totalOutputValue}
                            </span>
                            {recipe.output.qty > 1 && (
                              <span className="text-[10px] text-stone-400 dark:text-stone-500 ml-1">({outputProfile.baseValue}c/ea)</span>
                            )}
                          </div>
                        </div>

                        {outputProfile.breakdownText && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-300/90 font-medium italic mt-0.5 flex items-center gap-1 truncate" title={outputProfile.formulaDescription}>
                            <span>✨</span>
                            <span className="truncate">{outputProfile.breakdownText}</span>
                          </div>
                        )}

                        <div className="text-xs text-stone-500 dark:text-gray-400 mt-1">
                          {recipe.inputs.map(inp => `${getItemEmoji(inp.productId)}${inp.qty} ${getItemName(inp.productId)} (${getStorageAvailableStock(silo, barn, inp.productId)} avail)`).join(' + ')} {'\u2192'} {getItemEmoji(recipe.output.productId)}{recipe.output.qty}
                          <span className={`ml-2 ${theme.headerSub}`}>{'\u23F1'} {recipe.timeSec}s</span>
                        </div>
                        {maxCraftable > 0 && <div className="text-[10px] text-stone-400 dark:text-gray-500 mt-0.5">Can craft: {maxCraftable}x | Free slots: {freeSlots}</div>}
                      </div>
                      <div className="flex items-center gap-1.5 ml-1 shrink-0">
                        <button onClick={() => startProduction(activeBuilding, recipe)} disabled={!canCraft || queueFull} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${theme.craftBtn} disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors`}>Craft</button>
                        <button onClick={() => startProductionAll(activeBuilding, recipe)} disabled={canCraftAll <= 0} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${theme.craftBtnHover} disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors flex items-center gap-1`}>
                          <span>{'\u26A1'}</span> All {canCraftAll > 0 && <span className="bg-white/30 px-1 py-0.5 rounded text-[10px] font-bold">{canCraftAll}</span>}
                        </button>
                      </div>
                    </div>

                    {/* Missing ingredients hint */}
                    {missingIngredients.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {missingIngredients.map((m, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                            <span>{m.emoji}</span>
                            <span className="font-medium">{m.name}: {m.have}/{m.need}</span>
                            <span className="text-red-400 dark:text-red-500">{'\u2192'} {m.source}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Queue full but ingredients ready */}
                    {!canCraft && canCraftRecipe(recipe, silo, barn) && queueFull && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                        <span>{'\u{1F4E6}'}</span>
                        <span>Ingredients ready, but queue is full. Wait or collect finished items.</span>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>

            {/* Production Queue */}
            {queue.length > 0 && (
              <div className="p-3 pt-0 space-y-2">
                <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">In Progress ({activeCount} active, {doneCount} done)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {queue.map((slot, idx) => {
                    const progress = slot.done ? 1 : Math.min(1, (Date.now() - slot.startedAt) / (slot.durationSec * 1000));
                    const recipe = building.recipes.find(r => r.id === slot.recipeId);
                    const remainingSec = Math.round((1 - progress) * slot.durationSec);
                    return (
                      <div key={idx} className={`flex items-center gap-2 rounded-lg p-2 border ${slot.done ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-stone-50 dark:bg-stone-900/30 border-stone-100 dark:border-gray-800'}`}>
                        <span className="text-lg">{slot.recipeEmoji || recipe?.emoji || '\u2699\uFE0F'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-stone-700 dark:text-gray-300 truncate">{slot.recipeName || recipe?.name}</div>
                          <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${slot.done ? 'bg-green-500' : theme.progressColor}`} style={{ width: `${progress * 100}%` }} />
                          </div>
                          {!slot.done && remainingSec > 0 && <div className="text-[10px] text-stone-400 dark:text-gray-500 mt-0.5">{remainingSec}s remaining</div>}
                        </div>
                        {slot.done ? (
                          <button onClick={() => collectProduction(activeBuilding, idx)} className="px-2.5 py-1 text-xs font-bold rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors shrink-0">{'\u2705'}</button>
                        ) : (
                          <span className="text-[10px] text-stone-500 dark:text-gray-400 shrink-0">{remainingSec}s</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
