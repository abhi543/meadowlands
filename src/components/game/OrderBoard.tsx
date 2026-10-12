'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
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
import { FavorShopView } from '@/components/game/FavorShopView';
import { playClockTickSound, playCashRegisterSound, playDefeatSound } from '@/lib/soundEffects';

/** Source hint helper for missing items */
function getItemSourceHint(itemId: string): string {
  if (itemId in CROPS) return `Grow ${CROPS[itemId as keyof typeof CROPS].name} on Farm`;
  if (itemId === 'egg') return 'Feed Chickens in Pasture';
  if (itemId === 'milk') return 'Feed Cows in Barn';
  if (itemId === 'wool') return 'Feed Sheep in Pasture';
  if (itemId === 'truffle') return 'Feed Pigs in Pasture';
  if (itemId === 'fish') return 'Catch at Fishery Dock';
  if (itemId === 'feed') return 'Craft at Feed Mill';
  if (itemId === 'bread') return 'Bake at Bakery';
  if (itemId === 'cheese') return 'Craft at Dairy';
  if (itemId === 'fabric') return 'Weave at Loom';
  if (itemId === 'yarn') return 'Spin at Loom';
  if (itemId === 'truffle_oil') return 'Press at Oil Press';
  if (itemId === 'honey' || itemId === 'honey_comb') return 'Beekeeper worker / Hive';
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
    useOrderReroll,
    fulfillDeliveryOrder,
    trashOrder,
    level,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'all' | 'timed' | 'favor_shop' | 'reputation'>('all');
  const [selectedOrderForRoute, setSelectedOrderForRoute] = useState<DeliveryOrder | null>(null);
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<{ id: string; message: string; hazard: boolean } | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const now = Date.now();

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
    return itemId in CROPS || itemId === 'feed' || itemId === 'cotton' || itemId === 'honey_comb' || itemId === 'wild_berries' || itemId === 'gold_nugget';
  };

  const checkOrderFulfillable = (order: DeliveryOrder) => {
    const required = order.requiredItems || (order.requested?.map(r => ({ itemId: r.itemId, quantity: r.qty })) || []);
    for (const item of required) {
      const storage = isCropItem(item.itemId) ? silo : barn;
      if ((storage[item.itemId] || 0) < item.quantity) return false;
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
  const timedOrders = orders.filter(o => o.type === 'rush' || o.type === 'futures' || o.isRushOrder);

  const displayedOrders = activeTab === 'timed' ? timedOrders : orders;

  return (
    <div className="space-y-3.5">
      {/* Top Logistics & Economic Calibration Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border border-stone-700/80 rounded-2xl p-3 text-stone-100 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-700/60">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">🚚</span>
            <div>
              <h3 className="font-black text-sm tracking-wide text-white flex items-center gap-2">
                Meadowlands Logistics Engine
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Lv. {level} Contracts
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                Premium client contracts, persistent reputation perks &amp; route hazard logistics.
              </p>
            </div>
          </div>

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

        {/* Economic Calibration Rate Comparison Strip */}
        <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-medium">
          <div className="bg-stone-950/60 p-1.5 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-stone-400">🗑️ Shop Dump:</span>
            <span className="font-bold text-rose-400 font-mono">60% Value</span>
          </div>
          <div className="bg-stone-950/60 p-1.5 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-stone-400">📋 Standard:</span>
            <span className="font-bold text-emerald-400 font-mono">140% Coins</span>
          </div>
          <div className="bg-stone-950/60 p-1.5 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-stone-400">📈 Futures:</span>
            <span className="font-bold text-sky-400 font-mono">180% Coins</span>
          </div>
          <div className="bg-stone-950/60 p-1.5 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-stone-400">⚡ VIP Rush:</span>
            <span className="font-bold text-amber-400 font-mono">220% Coins</span>
          </div>
        </div>

        {/* VIP Favor & Utilities Ribbon */}
        <div className="mt-2 pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
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
              onClick={() => useOrderReroll()}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
      {(activeTab === 'all' || activeTab === 'timed') && (
        <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Active Delivery Contracts
          </h4>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {fulfillableCount > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {fulfillableCount} ready to dispatch
              </span>
            ) : (
              <span>0 ready</span>
            )}
            {' • '}{orders.length} orders
          </span>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-8 bg-stone-50 dark:bg-stone-900/40 rounded-2xl border border-stone-200 dark:border-stone-800">
            <span className="text-3xl">📭</span>
            <p className="text-xs text-stone-500 mt-2 font-medium">All contracts dispatched. New clients arriving shortly...</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {displayedOrders.map(order => {
            const clientDef = CLIENT_DEFINITIONS[order.clientId] || CLIENT_DEFINITIONS.mayor_barnaby;
            const clientRep = clientReputation?.[order.clientId] || { level: 1, xp: 0 };
            const fulfilled = checkOrderFulfillable(order);

            const isTimed = order.type === 'rush' || order.type === 'futures' || order.isRushOrder;
            const expiry = order.expiresAt || order.rushExpiresAt;
            const remainingSec = isTimed && expiry ? Math.max(0, Math.ceil((expiry - now) / 1000)) : null;
            const isCritical = remainingSec !== null && remainingSec <= 15;

            // Missing items hints
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

            // Theme border styling per order type
            let cardBorder = 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900';
            if (order.type === 'rush' || order.isRushOrder) {
              cardBorder = isCritical
                ? 'border-red-500 bg-red-950/20 shadow-md shadow-red-500/20 ring-1 ring-red-400'
                : 'border-amber-500/80 bg-amber-950/10 shadow-md shadow-amber-500/10';
            } else if (order.type === 'futures') {
              cardBorder = 'border-sky-500/80 bg-sky-950/10 shadow-md shadow-sky-500/10';
            } else if (order.type === 'town_project') {
              cardBorder = 'border-purple-500/80 bg-purple-950/10 shadow-md shadow-purple-500/10';
            } else if (fulfilled) {
              cardBorder = 'border-emerald-400/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm';
            }

            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 p-3 transition-all flex flex-col justify-between ${cardBorder}`}
              >
                <div>
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

                    {/* Contract Badge */}
                    <div className="flex-shrink-0">
                      {order.type === 'rush' || order.isRushOrder ? (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isCritical
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                        }`}>
                          <span>⚡</span> {remainingSec !== null ? `${remainingSec}s` : 'RUSH'}
                        </span>
                      ) : order.type === 'futures' ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 flex items-center gap-1">
                          <span>📈</span> {remainingSec !== null ? `${remainingSec}s` : 'FUTURES'}
                        </span>
                      ) : order.type === 'town_project' ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          <span>🏛️</span> TOWN PROJECT
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                          STANDARD
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Required Items */}
                  <div className="space-y-1.5 mb-2.5">
                    {required.map((it, i) => {
                      const storage = isCropItem(it.itemId) ? silo : barn;
                      const have = storage[it.itemId] || 0;
                      const enough = have >= it.quantity;

                      return (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base select-none">{it.icon}</span>
                            <span className="text-stone-700 dark:text-stone-300 font-medium truncate">
                              {it.name}
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

                  {/* Rewards summary strip */}
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2.5 text-xs flex-wrap mb-2">
                    <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-extrabold font-mono">
                      🪙 {order.rewards?.coins || order.coinReward}
                      {order.type === 'rush' || order.isRushOrder ? (
                        <span className="text-[9px] font-black bg-amber-500 text-stone-950 px-1 rounded ml-0.5">2.2X</span>
                      ) : order.type === 'futures' ? (
                        <span className="text-[9px] font-black bg-sky-500 text-white px-1 rounded ml-0.5">1.8X</span>
                      ) : (
                        <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-1 rounded ml-0.5">+140%</span>
                      )}
                    </span>

                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold font-mono">
                      ⭐ +{order.rewards?.xp || order.xpReward} XP
                    </span>

                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      💎 +{order.rewards?.reputationPoints || 15} Rep
                    </span>

                    {Boolean(order.rewards?.gems || order.bonusGems) && (
                      <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-300 font-black font-mono">
                        💎 +{order.rewards?.gems || order.bonusGems}
                      </span>
                    )}

                    {Boolean(order.rewards?.specialItem || order.relicFragmentReward) && (
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-300 font-black text-[10px] bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded-md border border-purple-300 dark:border-purple-700">
                        🎁 {order.rewards?.specialItem || 'Relic Frag'}
                      </span>
                    )}
                  </div>

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
    </div>
  );
}
