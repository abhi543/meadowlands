'use client';

import { useGameStore } from '@/game/store';
import { CROPS, PRODUCTS } from '@/game/data';

export function OrderBoard() {
  const { orders, silo, barn, fulfillOrder, trashOrder } = useGameStore();

  const canFulfill = (order: typeof orders[0]) => {
    for (const item of order.requested) {
      const isCrop = item.itemId in CROPS || item.itemId === 'feed';
      const storage = isCrop ? silo : barn;
      if ((storage[item.itemId] || 0) < item.qty) return false;
    }
    return true;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          🚚 Delivery Board
        </h3>
        <span className="text-xs text-stone-500 dark:text-gray-400">{orders.length} orders available</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {orders.map(order => {
          const fulfilled = canFulfill(order);
          return (
            <div
              key={order.id}
              className={`rounded-xl border-2 p-3 transition-all ${
                fulfilled
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 shadow-sm'
                  : 'bg-white dark:bg-gray-900 border-stone-200 dark:border-gray-700'
              }`}
            >
              {/* Items Requested */}
              <div className="space-y-1.5 mb-3">
                {order.requested.map((item, i) => {
                  const isCrop = item.itemId in CROPS || item.itemId === 'feed';
                  const storage = isCrop ? silo : barn;
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

              {/* Rewards */}
              <div className="flex items-center gap-3 mb-3 text-xs">
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                  💰 {order.coinReward}
                </span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                  ⭐ {order.xpReward} XP
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => fulfillOrder(order.id)}
                  disabled={!fulfilled}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                >
                  ✅ Deliver
                </button>
                <button
                  onClick={() => trashOrder(order.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-600 dark:text-gray-400 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
