'use client';

import { useState, useEffect } from 'react';
import { useGameStore, getStorageAvailableStock } from '@/game/store';
import { CROPS, PRODUCTS, BUILDINGS } from '@/game/data';
import {
  CLIENT_DEFINITIONS,
  REPUTATION_THRESHOLDS,
  getReputationInfo,
  type DeliveryOrder,
  type OrderType,
} from '@/game/deliveryData';
import {
  type FavorShopItem,
  FAVOR_SHOP_CATALOG,
  CLIENT_TIERS_CONFIG,
  getClientLevelFromXp,
} from '@/types/reputation';
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
import {
  canAddOrderToCaravan,
  validateCaravanCargo,
  getBulkVolumeTierInfo,
} from '@/game/caravanLogistics';
import { playClockTickSound, playCashRegisterSound, playDefeatSound } from '@/lib/soundEffects';

/** Source hint helper for missing items */
function getItemSourceHint(itemId: string): string {
  if (itemId in CROPS) return `Grow ${CROPS[itemId as keyof typeof CROPS].name} on Farm`;
  if (itemId === 'egg') return 'Feed Chickens in Pasture';
  if (itemId === 'milk') return 'Feed Cows in Barn';
  if (itemId === 'wool') return 'Feed Sheep in Pasture';
  if (itemId === 'truffle') return 'Feed Pigs in Pasture';
  if (itemId === 'fish') return 'Catch at Fishery Dock';
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
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'all' | 'local' | 'merchant' | 'noble' | 'timed' | 'favor_shop' | 'reputation'>('all');
  const [selectedOrderForRoute, setSelectedOrderForRoute] = useState<DeliveryOrder | null>(null);
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<{ id: string; message: string; hazard: boolean } | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [, setTick] = useState(0);

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
      const check = canAddOrderToCaravan(candidate, selectedOrders, silo, barn);
      if (check.canAdd) {
        setSelectedOrderIds(prev => [...prev, orderId]);
      }
    }
  };

  const handlePackAllFulfillable = () => {
    let currentPacked: DeliveryOrder[] = [];
    const packedIds: string[] = [];
    for (const order of orders) {
      const check = canAddOrderToCaravan(order, currentPacked, silo, barn);
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

  // Play ticking sound if any rush contract is under 15 seconds
  useEffect(() => {
    const urgentRush = orders.find(o => {
      const isTimed = o.type === 'rush' || o.type === 'futures' || o.isRushOrder;
      const expiry = o.expiresAt || o.rushExpiresAt;
      return isTimed && expiry && expiry - now <= 15000 && expiry - now > 0;
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
  const timedOrders = orders.filter(o => o.type === 'rush' || o.type === 'futures' || o.isRushOrder);

  let displayedOrders = orders;
  if (activeTab === 'local') displayedOrders = localOrders;
  else if (activeTab === 'merchant') displayedOrders = merchantOrders;
  else if (activeTab === 'noble') displayedOrders = nobleOrders;
  else if (activeTab === 'timed') displayedOrders = timedOrders;

  return (
    <div className="space-y-3.5">
      {/* Top Logistics & Economic Calibration Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border border-stone-700/80 rounded-2xl p-3 text-stone-100 shadow-md space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-700/60">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">🚚</span>
            <div>
              <h3 className="font-black text-sm tracking-wide text-white flex items-center gap-2">
                Meadowlands Macro-Contract Exchange
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Lv. {level} Tiered Economy
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                Mathematical production valuation, compounding artisan margins &amp; velocity trade streaks.
              </p>
            </div>
          </div>

          {/* Navigation Category Tabs */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'local'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>🏡 Local</span>
              <span className="text-[10px] opacity-75">({localOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('merchant')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'merchant'
                  ? 'bg-sky-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>🚢 Freight</span>
              <span className="text-[10px] opacity-75">({merchantOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('noble')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'noble'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>👑 Noble</span>
              <span className="text-[10px] opacity-75">({nobleOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('timed')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'timed'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>⚡ Timed</span>
              {timedOrders.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {timedOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('favor_shop')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'favor_shop'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-sm'
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
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'reputation'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>👥 Clients &amp; Perks</span>
            </button>
          </div>
        </div>

        {/* Standardized Economic Multipliers Calibration Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-medium">
          <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-amber-400 font-bold">🏡 Tier 1 Local:</span>
            <span className="font-bold text-emerald-400 font-mono">1.1x (+10%)</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-sky-400 font-bold">🚢 Tier 2 Freight:</span>
            <span className="font-bold text-sky-400 font-mono">1.4x (+40%)</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-purple-400 font-bold">👑 Tier 3 Noble:</span>
            <span className="font-bold text-purple-300 font-mono">2.0x (+100%)</span>
          </div>
          <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-red-400 font-bold">⚡ Courier Rush:</span>
            <span className="font-bold text-red-300 font-mono">3.0x Multiplier</span>
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
                    ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                    : 'bg-stone-800 text-stone-400 border border-stone-700'
                }`}>
                  {streakInfo.multiplier > 1.0
                    ? `Active Bonus: +${streakInfo.bonusPercent}% (${streakInfo.multiplier}x Payout)`
                    : '1.0x Baseline (0-2 Orders)'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate">
                {currentStreak === 0
                  ? 'Complete 3+ consecutive orders to unlock +25% bonus coins, or 5+ for +50% on all deliveries!'
                  : `Streak active! Maintain trade velocity within 45m (${streakMinutesRemaining}m remaining) to keep bonus.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono shrink-0 self-end sm:self-center">
            <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${currentStreak < 3 ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-stone-900 border-stone-800 text-stone-500'}`}>
              0-2: 1.0x
            </div>
            <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${currentStreak >= 3 && currentStreak < 5 ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'bg-stone-900 border-stone-800 text-stone-500'}`}>
              3-4: 1.25x (+25%)
            </div>
            <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${currentStreak >= 5 ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white font-black shadow-xs' : 'bg-stone-900 border-stone-800 text-stone-500'}`}>
              5+: 1.50x (+50%)
            </div>
          </div>
        </div>

        {/* VIP Favor & Utilities Ribbon */}
        <div className="pt-1.5 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
              <span>🎖️</span>
              <span>{globalReputation?.spendableFavor || 0} Favor</span>
            </span>
            <span className="text-stone-300 font-mono text-[11px] flex items-center gap-1 bg-stone-950/50 px-2 py-0.5 rounded-lg border border-stone-800">
              <span>🛡️</span>
              <span>{crisisShields || 0} Shields</span>
            </span>
            <span className="text-stone-300 font-mono text-[11px] flex items-center gap-1 bg-stone-950/50 px-2 py-0.5 rounded-lg border border-stone-800">
              <span>⚡</span>
              <span>{freeOverclocks || 0} Overdrives</span>
            </span>
            {(bonusStorageCapacity || 0) > 0 && (
              <span className="text-emerald-300 font-mono text-[11px] flex items-center gap-1 bg-stone-950/50 px-2 py-0.5 rounded-lg border border-stone-800">
                <span>📜</span>
                <span>+{bonusStorageCapacity} Storage</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('favor_shop')}
              className="px-2 py-1 rounded-lg text-[10px] font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center gap-1"
            >
              <span>🏛️ VIP Shop</span>
            </button>
            <button
              onClick={() => consumeOrderReroll()}
              disabled={(globalReputation?.spendableFavor || 0) < 15}
              className="px-2 py-1 rounded-lg text-[10px] font-black bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 border border-stone-700 transition-all flex items-center gap-1"
              title="Reroll all contracts for 15 Favor"
            >
              <span>🎲 Reroll Board (15🎖️)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dispatch result alert */}
      {dispatchResult && (
        <div
          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
            dispatchResult.hazard
              ? 'bg-red-950/40 border-red-500/60 text-red-200'
              : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
          }`}
        >
          <span>{dispatchResult.hazard ? '⚠️' : '🎉'}</span>
          <span>{dispatchResult.message}</span>
        </div>
      )}

      {/* Town Favor Shop Panel */}
      {activeTab === 'favor_shop' && <FavorShopView />}

      {/* Client Reputation Dossier Panel */}
      {activeTab === 'reputation' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-left">
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <span>👥</span>
                <span>Client Trust Milestones &amp; Permanent Perks</span>
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Fulfilling orders builds Lifetime Reputation XP. Each tier unlocked permanently enhances your farm operations.
              </p>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold self-start sm:self-auto font-mono">
              🎖️ {globalReputation?.spendableFavor || 0} Spendable Favor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {Object.values(CLIENT_DEFINITIONS).map(client => {
              const clientData = globalReputation?.clients?.[client.id] || {
                id: client.id,
                name: client.name,
                title: client.title,
                avatar: client.avatar,
                currentXp: clientReputation?.[client.id]?.xp || 0,
                currentLevel: clientReputation?.[client.id]?.level || 1,
                tiers: CLIENT_TIERS_CONFIG[client.id] || CLIENT_TIERS_CONFIG.mayor_barnaby,
              };

              const tiers = CLIENT_TIERS_CONFIG[client.id] || CLIENT_TIERS_CONFIG.mayor_barnaby;
              const lvlInfo = getClientLevelFromXp(clientData.currentXp, tiers);

              return (
                <div
                  key={client.id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 shadow-sm space-y-3 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-stone-800 flex items-center justify-center text-2xl shadow-inner border border-amber-200/60 dark:border-stone-700/60 select-none">
                        {client.avatar}
                      </div>
                      <div>
                        <div className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                          {client.name}
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60">
                            ⭐ Tier {lvlInfo.level}/5
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                          {client.title}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                        {clientData.currentXp} XP
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        Lifetime Rep
                      </div>
                    </div>
                  </div>

                  {/* Quote */}
                  <p className="text-[11px] italic text-stone-500 dark:text-stone-400 border-l-2 border-stone-300 dark:border-stone-700 pl-2 line-clamp-1">
                    &ldquo;{client.quote}&rdquo;
                  </p>

                  {/* Progress bar to next level */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                      <span>
                        {lvlInfo.isMaxLevel ? 'MAX MASTERY (TRUSTED ALLY)' : `Progress to Tier ${lvlInfo.level + 1}`}
                      </span>
                      <span>
                        {lvlInfo.isMaxLevel ? '1,000+ XP' : `${lvlInfo.currentLevelXp} / ${lvlInfo.neededForNext} XP`}
                      </span>
                    </div>
                    <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${lvlInfo.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 5-Tier Roadmap Cards */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                      <span>Perk Roadmap (Tiers 1–5)</span>
                      <span>{tiers.filter(t => lvlInfo.level >= t.level).length} / 5 Active</span>
                    </div>
                    <div className="space-y-1">
                      {tiers.map((tier) => {
                        const isUnlocked = lvlInfo.level >= tier.level;
                        return (
                          <div
                            key={tier.level}
                            className={`p-2 rounded-xl border text-xs transition-all ${
                              isUnlocked
                                ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/70 dark:border-amber-800/50'
                                : 'bg-stone-50/50 dark:bg-stone-900/40 border-stone-200/60 dark:border-stone-800/40 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                <span className={isUnlocked ? 'text-amber-500' : 'text-stone-400'}>
                                  {isUnlocked ? '✨' : '🔒'}
                                </span>
                                <span className={isUnlocked ? 'text-stone-900 dark:text-amber-200' : 'text-stone-500 dark:text-stone-400'}>
                                  Tier {tier.level}: {tier.perkTitle}
                                </span>
                              </div>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                                isUnlocked
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                              }`}>
                                {isUnlocked ? 'ACTIVE' : `${tier.requiredXp} XP`}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed pl-4">
                              {tier.perkDescription}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Delivery Contracts Board */}
      {(activeTab === 'all' || activeTab === 'local' || activeTab === 'merchant' || activeTab === 'noble' || activeTab === 'timed') && (
        <div className="space-y-3">
          {/* Contracts Header & Bulk Caravan Staging Controls */}
          <div className="bg-stone-900/80 border border-stone-750 p-2.5 sm:p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-sm">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30">🚚</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-xs uppercase tracking-wider text-white">
                    Bulk Caravan Staging:
                  </h4>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'Contract' : 'Contracts'} Packed
                  </span>
                  {selectedOrderIds.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      +{getBulkVolumeTierInfo(selectedOrderIds.length).bonusPercent}% Volume Bonus
                    </span>
                  )}
                  <span className="text-xs text-stone-500">
                    ({fulfillableCount} ready · {displayedOrders.length} active)
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Select contracts below to stack cargo into a single outgoing merchant caravan with compounding batch bonuses.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <button
                onClick={handlePackAllFulfillable}
                disabled={fulfillableCount === 0}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-40 disabled:from-stone-700 disabled:to-stone-800 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Automatically pack all non-conflicting ready orders into the caravan"
              >
                <span>📦</span>
                <span>Auto-Pack Ready ({fulfillableCount})</span>
              </button>

              {selectedOrderIds.length > 0 && (
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all cursor-pointer active:scale-95"
                  title="Clear all staged caravan orders"
                >
                  Clear ({selectedOrderIds.length})
                </button>
              )}
            </div>
          </div>

        {displayedOrders.length === 0 && (
          <div className="text-center py-8 bg-stone-50 dark:bg-stone-900/40 rounded-2xl border border-stone-200 dark:border-stone-800">
            <span className="text-3xl">📭</span>
            <p className="text-xs text-stone-500 mt-2 font-medium">No contracts in this category. New clients arriving shortly...</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {displayedOrders.map(order => {
            const clientDef = CLIENT_DEFINITIONS[order.clientId] || CLIENT_DEFINITIONS.mayor_barnaby;
            const clientRep = clientReputation?.[order.clientId] || { level: 1, xp: 0 };
            const fulfilled = checkOrderFulfillable(order);

            const isTimed = order.type === 'rush' || order.type === 'futures' || order.isRushOrder;
            const expiry = order.expiresAt || order.rushExpiresAt;
            const remainingSec = isTimed && expiry ? Math.max(0, Math.ceil((expiry - now) / 1000)) : null;
            const isCritical = remainingSec !== null && remainingSec <= 15;
            const isRushActive = Boolean(
              (order.type === 'rush' || order.isRushOrder) &&
              remainingSec !== null && remainingSec > 0
            );

            const contractTier: ContractEconomicTier = order.contractTier || inferContractTier(order.type, level);
            const tierConfig = CONTRACT_TIER_CONFIG[contractTier] || CONTRACT_TIER_CONFIG.tier1_local;

            // Missing items hints and required list
            const missingItems: { name: string; icon: string; have: number; need: number; source: string }[] = [];
            const required = order.requiredItems || (order.requested?.map(r => ({ itemId: r.itemId, quantity: r.qty, name: r.name, icon: r.emoji })) || []);
            for (const item of required) {
              const storage = isCropItem(item.itemId) ? silo : barn;
              const have = storage[item.itemId] || 0;
              if (have < item.quantity) {
                missingItems.push({
                  name: item.name,
                  icon: item.icon,
                  have,
                  need: item.quantity,
                  source: getItemSourceHint(item.itemId),
                });
              }
            }

            // Real-time Master Settlement Breakdown
            const settlement = calculateMasterSettlement(
              required,
              contractTier,
              currentStreak,
              isRushActive,
              dailyPayrollBurnRate
            );

            const isPacked = selectedOrderIds.includes(order.id);
            const otherSelected = selectedOrders.filter(o => o.id !== order.id);
            const addCheck = canAddOrderToCaravan(order, otherSelected, silo, barn);
            const canAdd = addCheck.canAdd;
            const conflictReason = addCheck.conflictReason;

            // Theme border styling per order type and tier
            let cardBorder = 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900';
            if (isPacked) {
              cardBorder = 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/30 ring-2 ring-emerald-500/80';
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
                          : conflictReason || 'Exceeds available barn stock alongside previously packed contracts'
                      }
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm font-black">{isPacked ? '✔' : canAdd ? '◻' : '🔒'}</span>
                        <span className="truncate">
                          {isPacked
                            ? 'Packed in Caravan'
                            : canAdd
                            ? 'Pack into Caravan'
                            : conflictReason || 'Exceeds Available Barn Stock'}
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

                    {/* Contract Tier Badge */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {contractTier === 'tier3_noble' ? (
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
                      {isRushActive && (
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
                          </span>
                          <span className={`font-mono text-xs font-bold ${
                            enough ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                          }`}>
                            {have}/{it.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Missing items guidance */}
                  {missingItems.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {missingItems.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[10px] text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 rounded-lg px-2 py-1"
                        >
                          <span className="truncate">Need {m.need - m.have} more {m.name}</span>
                          <span className="text-stone-400 truncate ml-1">{m.source}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transparent Contract Financial Settlement Receipt */}
                  <div className="bg-stone-950/70 dark:bg-stone-950/90 rounded-xl p-2.5 border border-stone-800 my-2 space-y-1 text-xs">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between border-b border-stone-800 pb-1">
                      <span className="flex items-center gap-1">🧾 Settlement Receipt</span>
                      <span className="text-amber-400 font-mono font-bold">{tierConfig.label}</span>
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
                      {settlement.isRush && (
                        <div className="flex items-center justify-between text-red-400 font-bold">
                          <span>Courier Rush Multiplier:</span>
                          <span>⚡ 3.0x</span>
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

                  {/* Payroll Coverage Benchmark Indicator for Tier 2 and Tier 3 Contracts */}
                  {(contractTier === 'tier2_merchant' || contractTier === 'tier3_noble') && (
                    <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-1.5">
                      <span className="text-sm shrink-0">🏦</span>
                      <span className="font-medium leading-tight">
                        {dailyPayrollBurnRate > 0 ? (
                          <>
                            This delivery funds <strong className="text-emerald-200 underline decoration-emerald-500/60 font-bold">{(settlement.finalCoinPayout / dailyPayrollBurnRate).toFixed(1)} days</strong> of active worker payroll and pantry upkeep.
                          </>
                        ) : (
                          <>
                            This high-tier delivery yields <strong className="text-emerald-200 font-bold">🪙{settlement.finalCoinPayout}</strong> to fund multi-day worker payroll vaults &amp; facility expansions.
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Penalty notice for timed orders */}
                  {isTimed && Boolean(order.penaltyCoins || order.breachFee) && (
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
                      className="py-1.5 px-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white disabled:text-stone-400 transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                      title="100% Guaranteed delivery via Safe Kingsway Highway"
                    >
                      <span>🛡️</span>
                      <span>Kingsway (Safe)</span>
                    </button>

                    <button
                      onClick={() => handleDispatch(order.id, 'wild')}
                      disabled={!fulfilled || isDispatching === order.id}
                      className="py-1.5 px-2 text-xs font-extrabold rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-40 disabled:from-stone-300 disabled:to-stone-400 text-white transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
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
                      className="text-[10px] font-bold text-stone-400 hover:text-rose-500 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20"
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
      </div>
      )}

      {/* Docked Bulk Freight Caravan Manifest Bar */}
      <CaravanManifestBar
        selectedOrders={selectedOrders}
        onClearSelection={() => setSelectedOrderIds([])}
      />
    </div>
  );
}
