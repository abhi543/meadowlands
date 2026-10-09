'use client';

import { useGameStore } from '@/game/store';
import { CROPS, PRODUCTS, type CropId } from '@/game/data';

export function ShopPanel() {
  const { silo, barn, coins, sellItem } = useGameStore();

  const allItems: { id: string; name: string; emoji: string; qty: number; sellPrice: number; isCrop: boolean }[] = [];

  // Crops from silo
  for (const [id, def] of Object.entries(CROPS)) {
    const qty = silo[id] || 0;
    if (qty > 0) allItems.push({ id, name: def.name, emoji: def.emoji, qty, sellPrice: Math.max(1, Math.floor(def.seedCost / 2) + 1), isCrop: true });
  }

  // Other silo items
  const siloExtras: { id: string; name: string; emoji: string; sellPrice: number }[] = [
    { id: 'feed', name: 'Animal Feed', emoji: '\u{1FAD9}', sellPrice: 2 },
    { id: 'cotton', name: 'Cotton', emoji: '\u{1F33F}', sellPrice: 6 },
    { id: 'honey_comb', name: 'Honey Comb', emoji: '\u{1F36F}', sellPrice: 12 },
    { id: 'wild_berries', name: 'Wild Berries', emoji: '\u{1F347}', sellPrice: 8 },
    { id: 'gold_nugget', name: 'Gold Nugget', emoji: '\u2B50', sellPrice: 50 },
  ];
  for (const extra of siloExtras) {
    const qty = silo[extra.id] || 0;
    if (qty > 0) allItems.push({ id: extra.id, name: extra.name, emoji: extra.emoji, qty, sellPrice: extra.sellPrice, isCrop: true });
  }

  // Products from barn
  for (const [id, def] of Object.entries(PRODUCTS)) {
    const qty = barn[id] || 0;
    if (qty > 0) allItems.push({ id, name: def.name, emoji: def.emoji, qty, sellPrice: def.sellPrice, isCrop: false });
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
        {'\u{1F3EA}'} Sell Items
      </h3>

      {allItems.length === 0 ? (
        <div className="text-center py-8 text-sm text-stone-400 dark:text-gray-500 italic">
          Nothing to sell yet. Harvest crops and produce goods first!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allItems.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg border border-stone-200 dark:border-gray-700 p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <div className="text-sm font-medium text-stone-800 dark:text-gray-200">{item.name}</div>
                  <div className="text-xs text-stone-500 dark:text-gray-400">Have: {item.qty} {'\u2022'} {'\u{1F4B0}'}{item.sellPrice}/ea</div>
                </div>
              </div>
              <div className="flex gap-1">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
