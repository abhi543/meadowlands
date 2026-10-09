'use client';

import { useGameStore } from '@/game/store';
import { HOURLY_EVENTS, CROPS, PRODUCTS } from '@/game/data';

export function EventBanner() {
  const { activeEvent, silo, barn, shooCrow, fulfillChefOrder, openSmugglerCrate } = useGameStore();
  const now = Date.now();

  if (!activeEvent) return null;

  const eventDef = HOURLY_EVENTS[activeEvent.type];
  const elapsed = now - activeEvent.startedAt;
  const remaining = Math.max(0, Math.ceil((eventDef.durationMs - elapsed) / 1000));
  const progress = Math.min(1, elapsed / eventDef.durationMs);

  // Check if chef order can be fulfilled
  const canFulfillChef = () => {
    if (!activeEvent.chefOrder) return false;
    for (const item of activeEvent.chefOrder.requested) {
      const isCrop = item.itemId in CROPS || item.itemId === 'feed' || item.itemId === 'cotton' || item.itemId === 'honey_comb' || item.itemId === 'wild_berries' || item.itemId === 'gold_nugget';
      const storage = isCrop ? silo : barn;
      if ((storage[item.itemId] || 0) < item.qty) return false;
    }
    return true;
  };

  const bgColors: Record<string, string> = {
    vip_chef: 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-700 dark:to-orange-700',
    crow_attack: 'bg-gradient-to-r from-red-500 to-rose-500 dark:from-red-700 dark:to-rose-700',
    rainstorm: 'bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-700 dark:to-blue-700',
    smuggler: 'bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-700 dark:to-indigo-700',
  };

  return (
    <div className={`${bgColors[activeEvent.type] || 'bg-gray-500'} rounded-xl p-3 shadow-lg text-white mb-3`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{eventDef.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">{eventDef.name}</h4>
            <span className="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full">
              {remaining}s
            </span>
          </div>
          <p className="text-xs opacity-90 mt-0.5">{eventDef.description}</p>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-white/60 rounded-full transition-all"
              style={{ width: `${(1 - progress) * 100}%` }}
            />
          </div>

          {/* Event-specific UI */}
          {activeEvent.type === 'vip_chef' && activeEvent.chefOrder && (
            <div className="mt-2 bg-white/10 rounded-lg p-2">
              <div className="text-xs font-medium mb-1">Chef Order:</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {activeEvent.chefOrder.requested.map((item, i) => {
                  const isCrop = item.itemId in CROPS || item.itemId === 'feed' || item.itemId === 'cotton' || item.itemId === 'honey_comb' || item.itemId === 'wild_berries' || item.itemId === 'gold_nugget';
                  const storage = isCrop ? silo : barn;
                  const have = storage[item.itemId] || 0;
                  const enough = have >= item.qty;
                  return (
                    <span key={i} className={`text-xs ${enough ? 'text-green-200' : 'text-red-200'}`}>
                      {item.emoji} {item.name} {have}/{item.qty}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs mb-2">
                <span>{'\u{1F4B0}'}{activeEvent.chefOrder.coinReward}</span>
                <span>{'\u2B50'}{activeEvent.chefOrder.xpReward}XP</span>
                <span>{'\u{1F48E}'}{activeEvent.chefOrder.gemReward}</span>
              </div>
              <button
                onClick={fulfillChefOrder}
                disabled={!canFulfillChef()}
                className="w-full py-1.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-500 text-amber-900 disabled:bg-white/20 disabled:text-white/50 transition-colors"
              >
                {'\u2705'} Fulfill Order
              </button>
            </div>
          )}

          {activeEvent.type === 'crow_attack' && (
            <div className="mt-2">
              <p className="text-xs mb-2">
                Crows on {activeEvent.crowPlotIds?.length || 0} plot{((activeEvent.crowPlotIds?.length || 0) > 1) ? 's' : ''}! Tap to shoo them away!
              </p>
              <button
                onClick={shooCrow}
                className="w-full py-1.5 text-xs font-bold rounded-lg bg-red-400 hover:bg-red-500 text-red-900 transition-colors"
              >
                {'\u{1F426}'} Shoo Crows!
              </button>
            </div>
          )}

          {activeEvent.type === 'rainstorm' && (
            <div className="mt-2 text-xs">
              {'\u{1F327}\uFE0F'} All crop growth speed +50%!
            </div>
          )}

          {activeEvent.type === 'smuggler' && (
            <div className="mt-2">
              <p className="text-xs mb-2">
                {activeEvent.smugglerCrates || 0} crate{((activeEvent.smugglerCrates || 0) > 1) ? 's' : ''} available to open!
              </p>
              <button
                onClick={openSmugglerCrate}
                disabled={(activeEvent.smugglerCrates || 0) <= 0}
                className="w-full py-1.5 text-xs font-bold rounded-lg bg-purple-400 hover:bg-purple-500 text-purple-900 disabled:bg-white/20 disabled:text-white/50 transition-colors"
              >
                {'\u{1F4E6}'} Open Crate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
