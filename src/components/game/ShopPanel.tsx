'use client';

import { useGameStore } from '@/game/store';
import { CROPS, PRODUCTS, type CropId } from '@/game/data';
import { useState } from 'react';

export function ShopPanel() {
  const { silo, barn, coins, sellItem, sellAllOfItem, sellAllItems } = useGameStore();
  const [qtyOverride, setQtyOverride] = useState<Record<string, number>>({});

  const allItems: { id: string; name: string; emoji: string; qty: number; sellPrice: number; isCrop: boolean }[] = [];

  // Crops from silo (exclude wheat, corn)
  const SHOP_HIDDEN_CROPS = new Set(['wheat', 'corn']);
  for (const [id, def] of Object.entries(CROPS)) {
    if (SHOP_HIDDEN_CROPS.has(id)) continue;
    const qty = silo[id] || 0;
    if (qty > 0) allItems.push({ id, name: def.name, emoji: def.emoji, qty, sellPrice: Math.max(1, Math.floor(def.seedCost / 2) + 1), isCrop: true });
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
    if (qty > 0) allItems.push({ id: extra.id, name: extra.name, emoji: extra.emoji, qty, sellPrice: extra.sellPrice, isCrop: true });
  }

  // Products from barn (exclude feed)
  const SHOP_HIDDEN_PRODUCTS = new Set(['feed']);
  for (const [id, def] of Object.entries(PRODUCTS)) {
    if (SHOP_HIDDEN_PRODUCTS.has(id)) continue;
    const qty = barn[id] || 0;
    if (qty > 0) allItems.push({ id, name: def.name, emoji: def.emoji, qty, sellPrice: def.sellPrice, isCrop: false });
  }

  const totalValue = allItems.reduce((sum, item) => sum + item.sellPrice * item.qty, 0);

  return (
    <div className="space-y-3">
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
                      <div className="text-sm font-medium text-stone-800 dark:text-gray-200">{item.name}</div>
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
    </div>
  );
}
