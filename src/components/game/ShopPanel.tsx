'use client';

import { useGameStore } from '@/game/store';
import { CROPS, PRODUCTS } from '@/game/data';
import { useState, useEffect } from 'react';
import { FavorShopView } from '@/components/game/FavorShopView';

export function ShopPanel() {
  const {
    silo,
    barn,
    sellItem,
    sellAllOfItem,
    sellAllItems,
    marketTrends,
    marketNewsTicker,
    marketNextRefresh,
    globalReputation,
  } = useGameStore();

  const [shopMode, setShopMode] = useState<'sell' | 'favor'>('sell');
  const [qtyOverride, setQtyOverride] = useState<Record<string, number>>({});
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const getDynamicPrice = (itemId: string, basePrice: number) => {
    const trend = marketTrends[itemId];
    const mult = trend ? trend.multiplier : 1.0;
    const effective = Math.max(1, Math.round(basePrice * mult * 0.60));
    return { effective, mult, trendType: trend ? trend.trend : ('neutral' as const) };
  };

  const allItems: {
    id: string;
    name: string;
    emoji: string;
    qty: number;
    basePrice: number;
    sellPrice: number;
    multiplier: number;
    trend: 'up' | 'down' | 'neutral';
    isCrop: boolean;
  }[] = [];

  // Crops from silo (exclude wheat, corn)
  const SHOP_HIDDEN_CROPS = new Set(['wheat', 'corn']);
  for (const [id, def] of Object.entries(CROPS)) {
    if (SHOP_HIDDEN_CROPS.has(id)) continue;
    const qty = silo[id] || 0;
    if (qty > 0) {
      const base = Math.max(1, Math.floor(def.seedCost / 2) + 1);
      const { effective, mult, trendType } = getDynamicPrice(id, base);
      allItems.push({
        id,
        name: def.name,
        emoji: def.emoji,
        qty,
        basePrice: base,
        sellPrice: effective,
        multiplier: mult,
        trend: trendType,
        isCrop: true,
      });
    }
  }

  // Other silo items (exclude feed)
  const siloExtras: { id: string; name: string; emoji: string; sellPrice: number }[] = [
    { id: 'cotton', name: 'Cotton', emoji: '🌿', sellPrice: 6 },
    { id: 'honey_comb', name: 'Honey Comb', emoji: '🍯', sellPrice: 12 },
    { id: 'wild_berries', name: 'Wild Berries', emoji: '🍇', sellPrice: 8 },
    { id: 'gold_nugget', name: 'Gold Nugget', emoji: '⭐', sellPrice: 50 },
  ];
  for (const extra of siloExtras) {
    const qty = silo[extra.id] || 0;
    if (qty > 0) {
      const { effective, mult, trendType } = getDynamicPrice(extra.id, extra.sellPrice);
      allItems.push({
        id: extra.id,
        name: extra.name,
        emoji: extra.emoji,
        qty,
        basePrice: extra.sellPrice,
        sellPrice: effective,
        multiplier: mult,
        trend: trendType,
        isCrop: true,
      });
    }
  }

  // Products from barn (exclude feed)
  const SHOP_HIDDEN_PRODUCTS = new Set(['feed']);
  for (const [id, def] of Object.entries(PRODUCTS)) {
    if (SHOP_HIDDEN_PRODUCTS.has(id)) continue;
    const qty = barn[id] || 0;
    if (qty > 0) {
      const { effective, mult, trendType } = getDynamicPrice(id, def.sellPrice);
      allItems.push({
        id,
        name: def.name,
        emoji: def.emoji,
        qty,
        basePrice: def.sellPrice,
        sellPrice: effective,
        multiplier: mult,
        trend: trendType,
        isCrop: false,
      });
    }
  }

  const totalValue = allItems.reduce((sum, item) => sum + item.sellPrice * item.qty, 0);
  const now = Date.now();
  const refreshCountdownSec = Math.max(0, Math.ceil((marketNextRefresh - now) / 1000));

  return (
    <div className="space-y-3">
      {/* Top Navigation Mode Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShopMode('sell')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              shopMode === 'sell'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <span>🏪</span>
            <span>Commodity Liquidation (Sell)</span>
          </button>
          <button
            onClick={() => setShopMode('favor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              shopMode === 'favor'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 hover:bg-amber-100'
            }`}
          >
            <span>🏛️</span>
            <span>Town Favor Shop</span>
            <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full bg-black/30 text-amber-200">
              {globalReputation?.spendableFavor || 0}🎖️
            </span>
          </button>
        </div>
      </div>

      {shopMode === 'favor' ? (
        <FavorShopView />
      ) : (
        <>
          {/* Dynamic Commodity Exchange Ticker */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-100 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <span>📈</span>
            <span className="uppercase tracking-wider">Commodity Exchange</span>
          </div>
          <div className="text-[10px] text-stone-400 font-mono">
            Next fluctuation: {Math.floor(refreshCountdownSec / 60)}m {refreshCountdownSec % 60}s
          </div>
        </div>

        {marketNewsTicker && (
          <div className="flex items-center gap-2 bg-stone-950/70 px-2.5 py-1.5 rounded-lg border border-amber-500/30 text-xs">
            <span className="text-sm animate-pulse">📢</span>
            <span className="text-amber-200 font-medium truncate flex-1">
              {marketNewsTicker.headline}
            </span>
            <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {marketNewsTicker.multiplier}x
            </span>
          </div>
        )}
      </div>

      {/* Liquidation Dump Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">📦</span>
          <span className="leading-snug text-[11px]">
            <b>Instant Dump Liquidation (60% Value):</b> Quick-dump items to clear silo/barn capacity. For <b>140% to 220% premium payouts</b> + Client Reputation perks, deliver via the <b>Delivery Board</b>!
          </span>
        </div>
      </div>

      {/* Header with Sell All */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          {'🏪'} Sell Items
        </h3>
        {allItems.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 dark:text-gray-400">
              Total: {'💰'}{totalValue}
            </span>
            <button
              onClick={() => sellAllItems()}
              className="px-4 py-2 text-sm font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-200/50 active:scale-95 flex items-center gap-1.5"
            >
              <span>{'💰'}</span>
              Sell All
              <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-xs font-bold">{allItems.length}</span>
            </button>
          </div>
        )}
      </div>

      {allItems.length === 0 ? (
        <div className="text-center py-8 text-sm text-stone-400 dark:text-gray-500 italic">
          Nothing to sell yet. Harvest crops and produce goods first!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allItems.map(item => {
            const customQty = qtyOverride[item.id] ?? 1;
            const sellValue = item.sellPrice * item.qty;

            return (
              <div key={item.id} className="bg-white dark:bg-gray-900 rounded-lg border border-stone-200 dark:border-gray-700 p-2.5 space-y-2">
                {/* Top row: item info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-stone-800 dark:text-gray-200">{item.name}</span>
                        {item.trend === 'up' && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            📈 {item.multiplier}x
                          </span>
                        )}
                        {item.trend === 'down' && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            📉 {item.multiplier}x
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-gray-400">
                        Have: {item.qty} • {'💰'}{item.sellPrice}/ea
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{'💰'}{sellValue}</div>
                  </div>
                </div>

                {/* Bottom row: sell controls */}
                <div className="flex items-center gap-1.5">
                  {/* Quick sell buttons */}
                  <button
                    onClick={() => sellItem(item.id, 1)}
                    className="px-2 py-1 text-xs font-medium rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                  >
                    Sell 1
                  </button>
                  {item.qty >= 5 && (
                    <button
                      onClick={() => sellItem(item.id, 5)}
                      className="px-2 py-1 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                    >
                      Sell 5
                    </button>
                  )}
                  {item.qty >= 10 && (
                    <button
                      onClick={() => sellItem(item.id, 10)}
                      className="px-2 py-1 text-xs font-medium rounded-md bg-amber-700 hover:bg-amber-800 text-white transition-colors"
                    >
                      Sell 10
                    </button>
                  )}
                  {/* Custom qty sell */}
                  {item.qty > 10 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <input
                        type="number"
                        min={1}
                        max={item.qty}
                        value={customQty}
                        onChange={e => setQtyOverride(prev => ({ ...prev, [item.id]: Math.max(1, Math.min(item.qty, parseInt(e.target.value) || 1)) }))}
                        className="w-12 px-1.5 py-1 text-xs text-center rounded-md border border-stone-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-stone-800 dark:text-gray-200"
                      />
                      <button
                        onClick={() => {
                          sellItem(item.id, customQty);
                          setQtyOverride(prev => ({ ...prev, [item.id]: 1 }));
                        }}
                        disabled={customQty > item.qty}
                        className="px-2 py-1 text-xs font-medium rounded-md bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                      >
                        Sell
                      </button>
                    </div>
                  )}
                  {/* Sell All of this item */}
                  <button
                    onClick={() => sellAllOfItem(item.id)}
                    className="px-2 py-1 text-xs font-bold rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors ml-auto"
                  >
                    All
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
