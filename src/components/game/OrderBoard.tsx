'use client';

import { useState, useEffect } from 'react';
import { useGameStore, getStorageAvailableStock } from '@/game/store';
import { CROPS, BUILDINGS } from '@/game/data';
import {
  CLIENT_DEFINITIONS,
  getReputationInfo,
  type DeliveryOrder,
} from '@/game/deliveryData';
import { getAvailableHydrologyWater } from '@/game/hydrologyEngine';
import {
  calculateMasterSettlement,
  getItemEconomicProfile,
  getTradeStreakMultiplier,
  inferContractTier,
  CONTRACT_TIER_CONFIG,
  type ContractEconomicTier,
} from '@/game/pricingEngine';
import { calculateStaffUpkeep } from '@/data/workerUpkeep';
import { FavorShopView } from '@/components/game/FavorShopView';
import { CaravanManifestBar } from './CaravanManifestBar';
import { ItemSourceHelpModal } from './ItemSourceHelpModal';
import {
  canAddOrderToCaravan,
} from '@/game/caravanLogistics';
import { playClockTickSound, playCashRegisterSound, playDefeatSound } from '@/lib/soundEffects';

/** Source hint helper for missing items */
function getItemSourceHint(itemId: string): string {
  if (itemId === 'water') return 'Hydrology Tab -> Well Pump or Elevated Gravity Tower';
  if (itemId in CROPS) return `Grow ${CROPS[itemId as keyof typeof CROPS].name} on Farm`;
  if (itemId === 'egg') return 'Feed Chickens in Pasture';
  if (itemId === 'milk') return 'Feed Cows in Barn';
  if (itemId === 'wool') return 'Feed Sheep in Pasture';
  if (itemId === 'truffle') return 'Feed Pigs in Pasture';
  if (itemId === 'fish') return 'Catch at Fishery Dock';
  if (itemId === 'catfish' || itemId === 'mud_crab' || itemId === 'trout' || itemId === 'salmon') return 'Catch at Fishery Dock';
  if (itemId === 'feed') return 'Craft in Animal Feed tab (Produce)';
  if (itemId === 'bread') return 'Bake at Bakery';
  if (itemId === 'cheese') return 'Craft at Dairy';
  if (itemId === 'fabric') return 'Weave at Loom';
  if (itemId === 'yarn') return 'Spin at Loom';
  if (itemId === 'truffle_oil') return 'Press at Oil Press';
  if (itemId === 'honey') return 'Press at Press building (requires 2x Honey Comb)';
  if (itemId === 'honey_comb') return 'Beekeeper worker / Apiary Tender (Workers tab, Hoard mode)';
  if (itemId === 'wild_berries') return 'Forager worker or Farm';
  if (itemId === 'gold_nugget') return 'Prospector worker or Mine';
  if (itemId === 'cotton') return 'Grow Cotton on Farm';
  if (itemId === 'silk') return 'Weave at Textiles facility';
  if (itemId === 'sweater') return 'Craft at Tailor Shop';
  if (itemId === 'pie') return 'Bake at Bakery (1x Bread + 2x Strawberries)';
  if (itemId === 'quilted_blanket') return 'Craft at Tailor Shop';
  if (itemId === 'savory_fish_pie') return 'Bake at Bakery';
  if (itemId === 'crab_bisque') return 'Bake at Bakery';
  if (itemId === 'golden_cornbread') return 'Bake at Bakery (2x Corn + 1x Egg)';
  for (const [, bDef] of Object.entries(BUILDINGS)) {
    for (const recipe of bDef.recipes) {
      if (recipe.output.productId === itemId) {
        return `Craft at ${bDef.name}`;
      }
    }
  }
  return 'Gather or harvest on farm';
}

export function OrderBoard() {
  const {
    orders,
    silo,
    barn,
    clientReputation,
    globalReputation,
    crisisShields,
    freeOverclocks,
    bonusStorageCapacity,
    purchaseFavorItem,
    consumeOrderReroll,
    fulfillDeliveryOrder,
    trashOrder,
    level,
    tradeStreak,
    lastTradeStreakTimestamp,
    unifiedWorkers,
    specialistWorkers,
    payrollVaultCoins,
    staffPantry,
    hydrology,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'all' | 'local' | 'merchant' | 'noble' | 'timed' | 'favor_shop' | 'reputation'>('all');
  const [selectedOrderForRoute, setSelectedOrderForRoute] = useState<DeliveryOrder | null>(null);
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<{ id: string; message: string; hazard: boolean } | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [, setTick] = useState(0);

  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpHighlightIds, setHelpHighlightIds] = useState<string[]>([]);
  const [helpContractTitle, setHelpContractTitle] = useState<string | undefined>(undefined);

  // Automatically deselect orders that were fulfilled or rerolled
  useEffect(() => {
    setSelectedOrderIds(prev => prev.filter(id => orders.some(o => o.id === id)));
  }, [orders]);

  const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));

  const toggleOrderInCaravan = (orderId: string) => {
    if (selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    } else {
      const candidate = orders.find(o => o.id === orderId);
      if (!candidate) return;
      const check = canAddOrderToCaravan(candidate, selectedOrders, silo, barn, getAvailableHydrologyWater(hydrology));
      if (check.canAdd) {
        setSelectedOrderIds(prev => [...prev, orderId]);
      }
    }
  };

  const handlePackAllFulfillable = () => {
    let currentPacked: DeliveryOrder[] = [];
    const packedIds: string[] = [];
    for (const order of orders) {
      const check = canAddOrderToCaravan(order, currentPacked, silo, barn, getAvailableHydrologyWater(hydrology));
      if (check.canAdd) {
        currentPacked.push(order);
        packedIds.push(order.id);
      }
    }
    setSelectedOrderIds(packedIds);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const now = Date.now();

  // Trade Velocity Streak Engine (resets after 45 minutes of trade inactivity)
  const streakValid = Boolean(lastTradeStreakTimestamp && (now - lastTradeStreakTimestamp <= 45 * 60 * 1000));
  const currentStreak = streakValid ? (tradeStreak || 0) : 0;
  const streakInfo = getTradeStreakMultiplier(currentStreak);
  const streakMinutesRemaining = (streakValid && lastTradeStreakTimestamp)
    ? Math.max(1, Math.ceil((lastTradeStreakTimestamp + 45 * 60 * 1000 - now) / 60000))
    : 0;

  // Real-time Staff Upkeep Telemetry for Payroll Coverage Benchmarks
  const staffTelemetry = calculateStaffUpkeep(unifiedWorkers, specialistWorkers, payrollVaultCoins, staffPantry);
  const dailyPayrollBurnRate = staffTelemetry.baseDailyPayroll;

  // Play ticking sound if any rush or high-stakes contract is under 20 seconds
  useEffect(() => {
    const urgentRush = orders.find(o => {
      const isTimed = o.type === 'rush' || o.type === 'futures' || o.isRushOrder || o.isHighStakes;
      const expiry = o.expiresAt || o.rushExpiresAt;
      return isTimed && expiry && expiry - now <= 20000 && expiry - now > 0;
    });
    if (urgentRush) {
      playClockTickSound();
    }
  }, [orders, now]);

  const isCropItem = (itemId: string): boolean => {
    if (itemId in CROPS || itemId === 'feed' || itemId === 'cotton' || itemId === 'honey_comb' || itemId === 'wild_berries' || itemId === 'gold_nugget') {
      return true;
    }
    if (itemId.endsWith('_silver') || itemId.endsWith('_gold') || itemId.endsWith('_prismatic')) {
      const base = itemId.replace(/_(silver|gold|prismatic)$/, '');
      if (base in CROPS) return true;
    }
    return false;
  };

  const checkOrderFulfillable = (order: DeliveryOrder) => {
    const required = order.requiredItems || (order.requested?.map(r => ({ itemId: r.itemId, quantity: r.qty })) || []);
    for (const item of required) {
      if (getStorageAvailableStock(silo, barn, item.itemId) < item.quantity) return false;
    }
    // Check hydrology pressurized water requirement
    if (order.waterRequired && getAvailableHydrologyWater(hydrology) < order.waterRequired) {
      return false;
    }
    return true;
  };

  const handleDispatch = (orderId: string, route: 'safe' | 'wild') => {
    setIsDispatching(orderId);
    setTimeout(() => {
      const res = fulfillDeliveryOrder(orderId, route);
      setIsDispatching(null);
      setSelectedOrderForRoute(null);
      if (res && res.message) {
        setDispatchResult({ id: orderId, message: res.message, hazard: Boolean(res.hazardEncountered) });
        setTimeout(() => setDispatchResult(null), 5000);
      }
    }, 450);
  };

  const fulfillableCount = orders.filter(o => checkOrderFulfillable(o)).length;
  const localOrders = orders.filter(o => (o.contractTier || inferContractTier(o.type, level)) === 'tier1_local');
  const merchantOrders = orders.filter(o => (o.contractTier || inferContractTier(o.type, level)) === 'tier2_merchant');
  const nobleOrders = orders.filter(o => (o.contractTier || inferContractTier(o.type, level)) === 'tier3_noble');
  const timedOrders = orders.filter(o => o.type === 'rush' || o.type === 'futures' || o.isRushOrder || o.isHighStakes);

  let displayedOrders = orders;
  if (activeTab === 'local') displayedOrders = localOrders;
  else if (activeTab === 'merchant') displayedOrders = merchantOrders;
  else if (activeTab === 'noble') displayedOrders = nobleOrders;
  else if (activeTab === 'timed') displayedOrders = timedOrders;

  return (
    <div className="space-y-4">
      {/* Top Logistics & Economic Calibration Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-700/80 rounded-2xl p-3.5 text-stone-100 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-700/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              🚚
            </span>
            <div>
              <h3 className="font-black text-sm tracking-wide text-white flex items-center gap-2">
                Meadowlands Macro-Contract Exchange
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Lv. {level} Tiered Economy
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Supply civic townsfolk, high-stakes couriers, and noble estates with crops, perishables, and pressurized water.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Help & Item Procurement Guide Button */}
            <button
              type="button"
              onClick={() => {
                setHelpHighlightIds([]);
                setHelpContractTitle(undefined);
                setIsHelpOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
              title="Open step-by-step guide for where to get and produce every item"
            >
              <span className="text-sm">❓</span>
              <span>Where to Get Items</span>
            </button>

            {/* Quick-Pack All Fulfillable Caravan Cargo */}
            <button
              onClick={handlePackAllFulfillable}
              disabled={fulfillableCount === 0}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 disabled:text-stone-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              title="Automatically stages all currently deliverable contracts into the bulk freight caravan"
            >
              <span>📦</span>
              <span>Stage All Ready ({fulfillableCount})</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Filter Strip */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>📋 All</span>
              <span className="text-[10px] opacity-75">({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'local'
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>🏡 Local</span>
              <span className="text-[10px] opacity-75">({localOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('merchant')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'merchant'
                  ? 'bg-sky-500 text-white shadow-sm font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>🚢 Freight</span>
              <span className="text-[10px] opacity-75">({merchantOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('noble')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'noble'
                  ? 'bg-purple-500 text-white shadow-sm font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>👑 Noble</span>
              <span className="text-[10px] opacity-75">({nobleOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('timed')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'timed'
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>⚡ Timed &amp; High-Stakes</span>
              {timedOrders.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {timedOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('favor_shop')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'favor_shop'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-sm font-black'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/40 hover:bg-amber-900/40'
              }`}
            >
              <span>🏛️ Favor Shop</span>
              <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full bg-black/40 text-amber-200">
                {globalReputation?.spendableFavor || 0}🎖️
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reputation')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'reputation'
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>👥 Clients &amp; Perks</span>
            </button>
          </div>
        </div>

        {/* Standardized Economic Multipliers & High-Stakes Calibration Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px] font-medium">
          <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-amber-400 font-bold">🏡 Local:</span>
            <span className="font-bold text-emerald-400 font-mono">1.1x (+10%)</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-sky-400 font-bold">🚢 Freight:</span>
            <span className="font-bold text-sky-400 font-mono">1.4x (+40%)</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-purple-400 font-bold">👑 Noble:</span>
            <span className="font-bold text-purple-300 font-mono">2.0x (+100%)</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-xl border border-amber-500/50 flex items-center justify-between">
            <span className="text-amber-300 font-black">👑 High-Stakes:</span>
            <span className="font-black text-amber-400 font-mono">5.0x (+400%)</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-xl border border-emerald-500/50 flex items-center justify-between">
            <span className="text-emerald-300 font-bold">✨ Pristine Bonus:</span>
            <span className="font-bold text-emerald-300 font-mono">+50% Coins</span>
          </div>
        </div>

        {/* Trade Velocity Streak Engine Banner */}
        <div className="bg-gradient-to-r from-amber-950/70 via-stone-950 to-amber-950/70 border border-amber-500/40 rounded-xl p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl animate-pulse shrink-0">🔥</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs sm:text-sm text-amber-200">
                  Trade Velocity Streak: {currentStreak} Orders Completed
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  currentStreak >= 5
                    ? 'bg-red-500 text-white shadow-xs'
                    : currentStreak >= 3
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'bg-stone-800 text-stone-400'
                }`}>
                  +{streakInfo.bonusPercent}% Surcharge ({streakInfo.multiplier}x)
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate">
                {currentStreak >= 5
                  ? 'Maximum trade velocity active! All contract coin payouts boosted by +50%!'
                  : currentStreak >= 3
                  ? 'High trade momentum! Complete 2 more contracts to leap to the +50% velocity tier!'
                  : 'Complete consecutive contracts to build momentum and unlock up to +50% coin bonuses across all dispatches.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right shrink-0">
            {streakValid && streakMinutesRemaining > 0 && (
              <span className="text-[10px] text-amber-400/90 font-mono bg-stone-900 px-2 py-1 rounded-lg border border-stone-800">
                ⏳ Streak Expires: {streakMinutesRemaining}m
              </span>
            )}
            <span className="text-xs font-bold text-amber-300/80">
              {streakInfo.multiplier > 1.0 ? `Active: ${streakInfo.multiplier}x Multiplier` : 'Base: 1.0x'}
            </span>
          </div>
        </div>
      </div>

      {/* Dispatch feedback toast */}
      {dispatchResult && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
            dispatchResult.hazard
              ? 'bg-red-950/80 border-red-500 text-red-200'
              : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
          }`}
        >
          <span className="text-base select-none">{dispatchResult.hazard ? '⚠️' : '✅'}</span>
          <span>{dispatchResult.message}</span>
        </div>
      )}

      {/* Main Tab Panels */}
      {activeTab === 'favor_shop' ? (
        <FavorShopView />
      ) : activeTab === 'reputation' ? (
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h4 className="font-black text-sm text-white">Client Reputation Dossier &amp; Permanent Perks</h4>
            <span className="text-xs text-amber-400 font-mono">
              Spendable Civic Favor: {globalReputation?.spendableFavor || 0}🎖️
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(CLIENT_DEFINITIONS).map(([clientId, client]) => {
              const rep = clientReputation?.[clientId] || { level: 1, xp: 0 };
              const repInfo = getReputationInfo(rep.xp, client);

              return (
                <div key={clientId} className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none">{client.avatar}</span>
                      <div>
                        <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                          {client.name}
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            Lv. {repInfo.level}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400">{client.title}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                      <span>Progression:</span>
                      <span>{repInfo.currentLevelXp} / {repInfo.neededForNext} XP</span>
                    </div>
                    <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${repInfo.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-300 italic bg-stone-900/60 p-2 rounded-lg border border-stone-850">
                    &quot;{client.quote}&quot;
                  </div>

                  <div className="text-[10px] text-stone-400 space-y-0.5">
                    <div className="font-bold text-stone-300">Active Unlocked Benefit:</div>
                    <div className="text-emerald-400">{repInfo.currentPerk.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Orders Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedOrders.map(order => {
            const clientDef = CLIENT_DEFINITIONS[order.clientId] || CLIENT_DEFINITIONS.mayor_barnaby;
            const clientRep = clientReputation?.[order.clientId] || { level: 1, xp: 0 };
            const fulfilled = checkOrderFulfillable(order);

            const isHighStakes = Boolean(order.isHighStakes);
            const isTimed = order.type === 'rush' || order.type === 'futures' || order.isRushOrder || isHighStakes;
            const expiry = order.expiresAt || order.rushExpiresAt;
            const remainingSec = isTimed && expiry ? Math.max(0, Math.ceil((expiry - now) / 1000)) : null;
            const isCritical = remainingSec !== null && remainingSec <= 30;
            const isRushActive = Boolean(
              (order.type === 'rush' || order.isRushOrder || isHighStakes) &&
              remainingSec !== null && remainingSec > 0
            );

            const contractTier: ContractEconomicTier = order.contractTier || inferContractTier(order.type, level);
            const tierConfig = CONTRACT_TIER_CONFIG[contractTier] || CONTRACT_TIER_CONFIG.tier1_local;

            // Missing items hints and required list
            const missingItems: { name: string; icon: string; have: number; need: number; source: string; itemId: string }[] = [];
            const required = order.requiredItems || (order.requested?.map(r => ({ itemId: r.itemId, quantity: r.qty, name: r.name, icon: r.emoji })) || []);
            
            for (const item of required) {
              const storage = isCropItem(item.itemId) ? silo : barn;
              const have = storage[item.itemId] || 0;
              if (have < item.quantity) {
                missingItems.push({
                  itemId: item.itemId,
                  name: item.name,
                  icon: item.icon,
                  have,
                  need: item.quantity,
                  source: getItemSourceHint(item.itemId),
                });
              }
            }

            // Hydrology pressurized water missing check
            if (order.waterRequired && getAvailableHydrologyWater(hydrology) < order.waterRequired) {
              missingItems.push({
                itemId: 'water',
                name: 'Pressurized Water',
                icon: '💧',
                have: getAvailableHydrologyWater(hydrology),
                need: order.waterRequired,
                source: getItemSourceHint('water'),
              });
            }

            // Real-time Master Settlement Breakdown
            const settlement = calculateMasterSettlement(
              required,
              contractTier,
              currentStreak,
              isRushActive,
              dailyPayrollBurnRate,
              order.waterRequired || 0,
              isHighStakes
            );

            const isPacked = selectedOrderIds.includes(order.id);
            const otherSelected = selectedOrders.filter(o => o.id !== order.id);
            const addCheck = canAddOrderToCaravan(order, otherSelected, silo, barn, getAvailableHydrologyWater(hydrology));
            const canAdd = addCheck.canAdd;
            const conflictReason = addCheck.conflictReason;

            // Theme border styling per order type and tier
            let cardBorder = 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900';
            if (isPacked) {
              cardBorder = 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/30 ring-2 ring-emerald-500/80';
            } else if (isHighStakes) {
              cardBorder = isCritical
                ? 'border-red-500 bg-gradient-to-b from-red-950/40 via-stone-900 to-stone-950 shadow-xl shadow-red-500/20 ring-2 ring-red-400'
                : 'border-amber-400 bg-gradient-to-b from-amber-950/30 via-stone-900 to-stone-950 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/50';
            } else if (isRushActive) {
              cardBorder = isCritical
                ? 'border-red-500 bg-red-950/20 shadow-md shadow-red-500/20 ring-1 ring-red-400'
                : 'border-amber-500/80 bg-amber-950/10 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30';
            } else if (contractTier === 'tier3_noble') {
              cardBorder = 'border-purple-500/80 bg-purple-950/10 shadow-md shadow-purple-500/10 ring-1 ring-purple-400/30';
            } else if (contractTier === 'tier2_merchant') {
              cardBorder = 'border-sky-500/80 bg-sky-950/10 shadow-md shadow-sky-500/10 ring-1 ring-sky-400/30';
            } else if (fulfilled) {
              cardBorder = 'border-emerald-400/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm';
            }

            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 p-3 transition-all flex flex-col justify-between ${cardBorder}`}
              >
                <div>
                  {/* Bulk Caravan Staging Selector Toggle */}
                  <div className="pb-2 mb-2 border-b border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => toggleOrderInCaravan(order.id)}
                      disabled={!isPacked && !canAdd}
                      className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-black flex items-center justify-between gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
                        isPacked
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/20 ring-1 ring-emerald-400'
                          : canAdd
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 hover:border-amber-500/60'
                          : 'bg-stone-100 dark:bg-stone-850 text-stone-400 border border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-60'
                      }`}
                      title={
                        isPacked
                          ? 'Click to remove this contract from the staged caravan'
                          : canAdd
                          ? 'Click to pack this contract into the bulk caravan'
                          : conflictReason || 'Exceeds available barn/silo/water stock alongside previously packed contracts'
                      }
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm font-black">{isPacked ? '✔' : canAdd ? '◻' : '🔒'}</span>
                        <span className="truncate">
                          {isPacked
                            ? 'Packed in Caravan'
                            : canAdd
                            ? 'Pack into Caravan'
                            : conflictReason || 'Exceeds Available Stock'}
                        </span>
                      </div>
                      {isPacked ? (
                        <span className="text-[9px] bg-black/40 text-emerald-200 px-1.5 py-0.2 rounded-full font-mono shrink-0">
                          STAGED
                        </span>
                      ) : canAdd ? (
                        <span className="text-[10px] text-amber-500 dark:text-amber-300 font-mono shrink-0">
                          +Stack
                        </span>
                      ) : null}
                    </button>
                  </div>

                  {/* Client & Contract Type Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl select-none flex-shrink-0">{clientDef.avatar}</span>
                      <div className="min-w-0">
                        <div className="font-black text-xs text-stone-900 dark:text-white truncate flex items-center gap-1.5">
                          {clientDef.name}
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                            Rep Lv. {clientRep.level}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 truncate">
                          {clientDef.title}
                        </div>
                      </div>
                    </div>

                    {/* Contract Tier Badge & Where to Get Help Button */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const ids = required.map(it => it.itemId);
                          if (order.waterRequired) ids.push('water');
                          setHelpHighlightIds(ids);
                          setHelpContractTitle(`${clientDef.name}'s Contract`);
                          setIsHelpOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 text-[10px] font-extrabold transition-all flex items-center gap-1 border border-stone-700/60 cursor-pointer shadow-xs active:scale-95"
                        title="Click to view step-by-step instructions on where to produce all items for this contract"
                      >
                        <span>❓</span>
                        <span className="hidden sm:inline">Where to Get</span>
                      </button>

                      {isHighStakes ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-extrabold flex items-center gap-1 shadow-sm">
                          <span>👑</span> High-Stakes (5x)
                        </span>
                      ) : contractTier === 'tier3_noble' ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          <span>👑</span> Noble (+100%)
                        </span>
                      ) : contractTier === 'tier2_merchant' ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 flex items-center gap-1">
                          <span>🚢</span> Freight (+40%)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          🏡 Local (+10%)
                        </span>
                      )}

                      {isRushActive && !isHighStakes && (
                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                          isCritical
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40'
                        }`}>
                          <span>⚡</span> 3.0x {remainingSec !== null ? `${remainingSec}s` : 'RUSH'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* High-Stakes Contract Live Alert Banner */}
                  {isHighStakes && (
                    <div className="mb-2 p-2 rounded-xl bg-gradient-to-r from-amber-950/70 via-stone-900 to-amber-950/70 border border-amber-500/50 text-[10px] space-y-1">
                      <div className="flex items-center justify-between font-black text-amber-300">
                        <span className="flex items-center gap-1">
                          <span>👑</span>
                          <span>HIGH-STAKES BOUNTY (5.0x MULTIPLIER)</span>
                        </span>
                        <span className={`font-mono text-xs font-black ${
                          isCritical ? 'text-red-400 animate-pulse' : 'text-amber-400'
                        }`}>
                          ⏳ {remainingSec !== null ? `${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s` : 'RUSH'}
                        </span>
                      </div>
                      <div className="text-stone-300 flex items-center justify-between text-[10px]">
                        <span className="text-rose-400 font-bold">⚠️ Breach Penalty:</span>
                        <span className="font-mono text-rose-300 font-bold">
                          -{order.penaltyCoins} Coins &amp; -{order.penaltyReputation || 15} Client Rep on failure
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Required Items with Unit Valuations */}
                  <div className="space-y-1.5 mb-2.5">
                    {required.map((it, i) => {
                      const storage = isCropItem(it.itemId) ? silo : barn;
                      const have = storage[it.itemId] || 0;
                      const enough = have >= it.quantity;
                      const itemProfile = getItemEconomicProfile(it.itemId);

                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-stone-100/50 dark:border-stone-800/50 last:border-0">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base select-none">{it.icon}</span>
                            <span className="text-stone-700 dark:text-stone-300 font-medium truncate">
                              {it.name}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono" title={`Derived Base Value: ${itemProfile.baseValue}c`}>
                              (🪙{itemProfile.baseValue}/ea)
                            </span>
                            {it.isPerishable && (
                              <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 shrink-0">
                                ✨ Pristine Bonus Eligible
                              </span>
                            )}
                          </span>
                          <span className={`font-mono text-xs font-bold ${
                            enough ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                          }`}>
                            {have}/{it.quantity}
                          </span>
                        </div>
                      );
                    })}

                    {/* Hydrology Pressurized Water Requirement Row */}
                    {order.waterRequired && (
                      <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-sky-950/40 border border-sky-500/40 text-sky-200 mt-1">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className="text-base select-none">💧</span>
                          <span className="font-semibold truncate">Pressurized Water</span>
                          <span className="text-[10px] text-sky-400/80 font-mono">
                            (Hydrology Tower)
                          </span>
                        </span>
                        <span className={`font-mono text-xs font-bold ${
                          getAvailableHydrologyWater(hydrology) >= order.waterRequired
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}>
                          {getAvailableHydrologyWater(hydrology)}/{order.waterRequired} L
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Missing items guidance with interactive help button */}
                  {missingItems.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {missingItems.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[10px] text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 rounded-lg px-2 py-1 gap-1"
                        >
                          <div className="truncate">
                            <span className="font-bold">{m.icon} Need {m.need - m.have} more {m.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-stone-400 truncate hidden sm:inline">{m.source}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setHelpHighlightIds([m.itemId]);
                                setHelpContractTitle(`${m.name} Procurement`);
                                setIsHelpOpen(true);
                              }}
                              className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer transition-colors"
                              title="Click to view detailed instructions on how to get this missing item"
                            >
                              ❓ Guide
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transparent Contract Financial Settlement Receipt */}
                  <div className="bg-stone-950/70 dark:bg-stone-950/90 rounded-xl p-2.5 border border-stone-800 my-2 space-y-1 text-xs">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between border-b border-stone-800 pb-1">
                      <span className="flex items-center gap-1">🧾 Settlement Receipt</span>
                      <span className="text-amber-400 font-mono font-bold">
                        {isHighStakes ? '👑 High-Stakes Tier' : tierConfig.label}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-[10px] font-mono pt-0.5">
                      <div className="flex items-center justify-between text-stone-300">
                        <span className="text-stone-400">Base Commodity Value:</span>
                        <span>🪙 {settlement.baseCommodityValue}</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-300">
                        <span className="text-stone-400">Contract Tier Markup:</span>
                        <span className="text-sky-300 font-bold">+{settlement.tierMarkupPercent}% ({settlement.tierMultiplier}x)</span>
                      </div>
                      {settlement.streakMultiplier > 1.0 && (
                        <div className="flex items-center justify-between text-amber-300 font-bold">
                          <span className="text-stone-400">Trade Streak Bonus:</span>
                          <span>+{settlement.streakBonusPercent}% ({settlement.streakMultiplier}x)</span>
                        </div>
                      )}
                      {settlement.isRush && !isHighStakes && (
                        <div className="flex items-center justify-between text-red-400 font-bold">
                          <span>Courier Rush Multiplier:</span>
                          <span>⚡ 3.0x</span>
                        </div>
                      )}
                      {isHighStakes && (
                        <div className="flex items-center justify-between text-amber-300 font-black">
                          <span>👑 High-Stakes Bounty Multiplier:</span>
                          <span>⚡ 5.0x (+400%)</span>
                        </div>
                      )}
                      {Boolean(order.waterRequired) && (
                        <div className="flex items-center justify-between text-sky-300 font-bold">
                          <span>💧 Pressurized Water ({order.waterRequired}L):</span>
                          <span>+{Math.round((order.waterRequired || 0) * 6)} 🪙</span>
                        </div>
                      )}
                      {Boolean(order.rewards?.pristineBonusCoins) && (
                        <div className="flex items-center justify-between text-emerald-300 font-bold">
                          <span>✨ Pristine Freshness Bonus:</span>
                          <span>+{order.rewards.pristineBonusCoins} 🪙 (+50%)</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-1.5 border-t border-stone-800 flex items-center justify-between font-black">
                      <span className="text-stone-300 text-xs">Net Settlement Payout:</span>
                      <span className="text-amber-400 font-mono text-sm sm:text-base font-extrabold tracking-tight drop-shadow-sm">
                        🪙 {settlement.finalCoinPayout} COINS
                      </span>
                    </div>

                    {/* Secondary XP & Rep badges */}
                    <div className="pt-1 border-t border-stone-800/60 flex items-center gap-2 text-[10px] flex-wrap text-stone-400">
                      <span className="text-blue-400 font-bold">⭐ +{order.rewards?.xp || order.xpReward} XP</span>
                      <span className="text-emerald-400 font-bold">💎 +{order.rewards?.reputationPoints || 15} Rep</span>
                      {Boolean(order.rewards?.gems || order.bonusGems) && (
                        <span className="text-cyan-400 font-bold">💎 +{order.rewards?.gems || order.bonusGems} Gems</span>
                      )}
                      {Boolean(order.rewards?.specialItem || order.relicFragmentReward) && (
                        <span className="text-purple-300 font-bold">🎁 {order.rewards?.specialItem || 'Relic Frag'}</span>
                      )}
                    </div>
                  </div>

                  {/* Payroll Coverage Benchmark Indicator */}
                  {(contractTier === 'tier2_merchant' || contractTier === 'tier3_noble' || isHighStakes) && (
                    <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-1.5">
                      <span className="text-sm shrink-0">🏦</span>
                      <span className="font-medium leading-tight">
                        {dailyPayrollBurnRate > 0 ? (
                          <>
                            This delivery funds <strong className="text-emerald-200 underline decoration-emerald-500/60 font-bold">{(settlement.finalCoinPayout / dailyPayrollBurnRate).toFixed(1)} days</strong> of active worker payroll and pantry upkeep.
                          </>
                        ) : (
                          <>
                            This high-stakes delivery yields <strong className="text-emerald-200 font-bold">🪙{settlement.finalCoinPayout}</strong> to fund multi-day worker payroll vaults &amp; expansions.
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Penalty notice for timed / high-stakes orders */}
                  {isTimed && !isHighStakes && Boolean(order.penaltyCoins || order.breachFee) && (
                    <div className="mb-2 text-[10px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Breach Penalty: -{order.penaltyCoins || order.breachFee} 🪙 if expired/cancelled</span>
                    </div>
                  )}
                </div>

                {/* Route Logistics Dispatch Actions */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleDispatch(order.id, 'safe')}
                      disabled={!fulfilled || isDispatching === order.id}
                      className="py-1.5 px-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white disabled:text-stone-400 transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                      title="100% Guaranteed delivery via Safe Kingsway Highway"
                    >
                      <span>🛡️</span>
                      <span>Kingsway (Safe)</span>
                    </button>

                    <button
                      onClick={() => handleDispatch(order.id, 'wild')}
                      disabled={!fulfilled || isDispatching === order.id}
                      className="py-1.5 px-2 text-xs font-extrabold rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-40 disabled:from-stone-300 disabled:to-stone-400 text-white transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                      title="25% Hazard risk for +25% bonus coins & wild salvage item!"
                    >
                      <span>🌲</span>
                      <span>Wild (+25% ⚡)</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] text-stone-400">
                      Safe: 100% • Wild: 25% hazard risk
                    </span>
                    <button
                      onClick={() => trashOrder(order.id)}
                      className="text-[10px] font-bold text-stone-400 hover:text-rose-500 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                      title="Cancel this order contract"
                    >
                      <span>🗑️</span>
                      <span>Cancel Contract</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Docked Bulk Freight Caravan Manifest Bar */}
      <CaravanManifestBar
        selectedOrders={selectedOrders}
        onClearSelection={() => setSelectedOrderIds([])}
      />

      {/* Item Source & Procurement Help Modal */}
      <ItemSourceHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        highlightItemIds={helpHighlightIds}
        contractTitle={helpContractTitle}
      />
    </div>
  );
}
