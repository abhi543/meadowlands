'use client';

import { useGameStore } from '@/game/store';
import { CROPS, PRODUCTS, BUILDINGS } from '@/game/data';

/** Get source hint for where to obtain a missing item */
function getItemSourceHint(itemId: string): string {
  if (itemId in CROPS) return `Grow ${CROPS[itemId as keyof typeof CROPS].name} on Farm`;
  if (itemId === 'egg') return 'Feed Chickens, then collect';
  if (itemId === 'egg_blue') return 'Pasture Araucana (Uncommon Chicken)';
  if (itemId === 'egg_obsidian') return 'Midnight Silkie (Rare Chicken)';
  if (itemId === 'egg_golden') return 'Solar Phoenix Hen (Legendary)';
  if (itemId === 'milk') return 'Feed Cows, then collect';
  if (itemId === 'milk_rich_cream') return 'Jersey Buttercup (Uncommon Cow)';
  if (itemId === 'milk_alpine') return 'Highland Shaggy Yak (Rare Cow)';
  if (itemId === 'milk_starlight') return 'Celestial Star-Bovine (Legendary)';
  if (itemId === 'wool') return 'Feed Sheep, then collect';
  if (itemId === 'wool_patterned') return 'Jacob Four-Horn (Uncommon Sheep)';
  if (itemId === 'wool_merino') return 'Merino Cloud Sheep (Rare Sheep)';
  if (itemId === 'wool_gilded') return 'Golden Fleece Ram (Legendary)';
  if (itemId === 'truffle') return 'Feed Pigs, then collect';
  if (itemId === 'truffle_white') return 'Berkshire Black (Uncommon Pig)';
  if (itemId === 'truffle_alba') return 'Iberian Bristle Boar (Rare Pig)';
  if (itemId === 'truffle_diamond') return 'Gilded Snout Chimera (Legendary)';
  if (itemId === 'fish') return 'Catch at Fishery';
  if (itemId === 'feed') return 'Craft at Feed Mill (wheat/corn)';
  if (itemId === 'bread') return 'Bake at Bakery (wheat + egg)';
  if (itemId === 'cheese') return 'Craft at Dairy (milk)';
  if (itemId === 'fabric') return 'Weave at Loom (wool)';
  if (itemId === 'yarn') return 'Spin at Loom (wool)';
  if (itemId === 'truffle_oil') return 'Press at Press (truffle)';
  if (itemId === 'honey') return 'Beekeeper or Bakery';
  if (itemId === 'honey_comb') return 'Beekeeper worker';
  if (itemId === 'wild_berries') return 'Forager worker or Farm';
  if (itemId === 'gold_nugget') return 'Prospector worker';
  if (itemId === 'cotton') return 'Grow Cotton on Farm';
  if (itemId === 'silk') return 'Weave at Textiles';
  if (itemId === 'sweater') return 'Craft at Tailor Shop (yarn)';
  if (itemId === 'pie') return 'Bake at Bakery';
  if (itemId === 'quilted_blanket') return 'Craft at Tailor Shop';
  if (itemId === 'savory_fish_pie') return 'Bake at Bakery (fish)';
  if (itemId === 'crab_bisque') return 'Craft at Dairy (fish)';
  // Territory-locked items
  if (itemId === 'iron_ore' || itemId === 'gold_ore') return 'Mine at Quarry Ridge (Parcel required)';
  if (itemId === 'apple' || itemId === 'cherry') return 'Grow in Sunken Grove Orchard (Parcel required)';
  if (itemId === 'smoked_trout') return 'Fish at Riverfront Estuary (Parcel required)';
  if (itemId === 'fine_sail') return 'Weave at Guild Loom in Highland Meadow (Parcel required)';
  // Check if it's a product made in a building
  for (const [bId, bDef] of Object.entries(BUILDINGS)) {
    for (const recipe of bDef.recipes) {
      if (recipe.output.productId === itemId) {
        return `Craft at ${bDef.name}`;
      }
    }
  }
  return 'Produce or gather';
}

import { useState, useEffect } from 'react';
import { playClockTickSound } from '@/lib/soundEffects';

export function OrderBoard() {
  const { orders, silo, barn, fulfillOrder, trashOrder } = useGameStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const now = Date.now();

  // Play ticking sound if any rush order is under 15 seconds
  useEffect(() => {
    const urgentRush = orders.find(
      o => o.isRushOrder && o.rushExpiresAt && (o.rushExpiresAt - now <= 15000) && (o.rushExpiresAt - now > 0)
    );
    if (urgentRush) {
      playClockTickSound();
    }
  }, [orders, now]);

  const isCropItem = (itemId: string): boolean => {
    return itemId in CROPS || itemId === 'feed' || itemId === 'cotton' || itemId === 'honey_comb' || itemId === 'wild_berries' || itemId === 'gold_nugget';
  };

  const canFulfill = (order: typeof orders[0]) => {
    for (const item of order.requested) {
      const storage = isCropItem(item.itemId) ? silo : barn;
      if ((storage[item.itemId] || 0) < item.qty) return false;
    }
    return true;
  };

  // Count how many orders are fulfillable
  const fulfillableCount = orders.filter(o => canFulfill(o)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          {'\u{1F69A}'} Delivery Board
        </h3>
        <span className="text-xs text-stone-500 dark:text-gray-400">
          {fulfillableCount > 0 && <span className="text-green-600 dark:text-green-400 font-medium">{fulfillableCount} ready</span>}
          {fulfillableCount > 0 && ' / '}
          {orders.length} orders
        </span>
      </div>

      {/* Quick hint when no orders can be fulfilled */}
      {orders.length > 0 && fulfillableCount === 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1.5">
          <span>{'\u{1F4E6}'}</span>
          <span>No orders ready to deliver. Produce items to match order requirements below.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {orders.map(order => {
          const fulfilled = canFulfill(order);

          // Find missing items for hint
          const missingItems: { name: string; emoji: string; have: number; need: number; source: string }[] = [];
          for (const item of order.requested) {
            const storage = isCropItem(item.itemId) ? silo : barn;
            const have = storage[item.itemId] || 0;
            if (have < item.qty) {
              missingItems.push({
                name: item.name,
                emoji: item.emoji,
                have,
                need: item.qty,
                source: getItemSourceHint(item.itemId),
              });
            }
          }

          const rushRemaining = Math.max(0, Math.ceil(((order.rushExpiresAt || 0) - now) / 1000));
          const isRushUrgent = rushRemaining <= 15;

          return (
            <div
              key={order.id}
              className={`rounded-xl border-2 p-3 transition-all ${
                order.isRushOrder
                  ? isRushUrgent
                    ? 'border-red-500 bg-red-950/20 shadow-md shadow-red-500/20'
                    : 'border-amber-500 bg-amber-950/10 shadow-md shadow-amber-500/20'
                  : fulfilled
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 shadow-sm'
                  : 'bg-white dark:bg-gray-900 border-stone-200 dark:border-gray-700'
              }`}
            >
              {/* VIP Rush Contract Header */}
              {order.isRushOrder && (
                <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b border-amber-500/30">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-amber-500 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                      <span>⚡</span> VIP RUSH
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-full ${
                    isRushUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-black/30 text-amber-300 border border-amber-500/30'
                  }`}>
                    ⏳ {rushRemaining}s
                  </span>
                </div>
              )}

              {/* Items Requested */}
              <div className="space-y-1.5 mb-3">
                {order.requested.map((item, i) => {
                  const storage = isCropItem(item.itemId) ? silo : barn;
                  const have = storage[item.itemId] || 0;
                  const enough = have >= item.qty;
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">{item.emoji}</span>
                        <span className="text-stone-700 dark:text-gray-300">{item.name}</span>
                      </span>
                      <span className={`font-mono text-xs font-semibold ${enough ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {have}/{item.qty}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Missing items hints */}
              {missingItems.length > 0 && (
                <div className="mb-3 space-y-1">
                  {missingItems.map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                      <span>{m.emoji}</span>
                      <span>Need {m.need - m.have} more {m.name}</span>
                      <span className="text-red-400 dark:text-red-500">{'\u2192'} {m.source}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Ready to deliver hint */}
              {fulfilled && (
                <div className="mb-3 flex items-center gap-1.5 text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 rounded px-2 py-1">
                  <span>{'\u2705'}</span>
                  <span className="font-medium">All items ready! Deliver now for rewards.</span>
                </div>
              )}

              {/* Rewards */}
              <div className="flex items-center gap-3 mb-2 text-xs flex-wrap">
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                  {'\u{1F4B0}'} {order.coinReward}
                  {order.isRushOrder && <span className="text-[9px] font-black bg-amber-500 text-stone-950 px-1 rounded ml-1">2X</span>}
                </span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                  {'\u2B50'} {order.xpReward} XP
                </span>
                {order.bonusGems ? (
                  <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-bold">
                    💎 +{order.bonusGems}
                  </span>
                ) : null}
                {order.relicFragmentReward ? (
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                    🏛️ +{order.relicFragmentReward} Frag
                  </span>
                ) : null}
              </div>

              {/* Breach fee warning */}
              {order.isRushOrder && (
                <div className="mb-2 text-[10px] text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <span>⚠️</span> Breach Fee: -{order.breachFee || 20} 🪙 if expired
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => fulfillOrder(order.id)}
                  disabled={!fulfilled}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                >
                  {'\u2705'} Deliver
                </button>
                <button
                  onClick={() => trashOrder(order.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-600 dark:text-gray-400 transition-colors"
                >
                  {'\u{1F5D1}\uFE0F'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
