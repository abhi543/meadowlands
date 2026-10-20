'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  COMMISSARY_FOOD_ITEMS,
  FOOD_CATEGORY_INFO,
  type FoodCategory,
  calculateStaffUpkeep,
} from '@/data/workerUpkeep';

interface StaffPantryRestockDeckProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StaffPantryRestockDeck({ isOpen, onClose }: StaffPantryRestockDeckProps) {
  const {
    silo,
    barn,
    staffPantry,
    payrollVaultCoins,
    unifiedWorkers,
    specialistWorkers,
    transferToStaffPantry,
    returnFromStaffPantry,
  } = useGameStore();

  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | 'all'>('all');
  const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const telemetry = calculateStaffUpkeep(
    unifiedWorkers,
    specialistWorkers,
    payrollVaultCoins,
    staffPantry
  );

  const getAvailableStock = (itemId: string, category: FoodCategory) => {
    if (category === 'crop') {
      return (silo[itemId] || 0) + (barn[itemId] || 0);
    }
    return barn[itemId] || 0;
  };

  const getTransferQty = (itemId: string, maxAvailable: number) => {
    const raw = transferQuantities[itemId];
    if (raw === undefined) return Math.min(1, maxAvailable);
    return Math.max(1, Math.min(raw, maxAvailable));
  };

  const setQty = (itemId: string, val: number, maxAvailable: number) => {
    const clamped = Math.max(1, Math.min(val, maxAvailable));
    setTransferQuantities((prev) => ({ ...prev, [itemId]: clamped }));
  };

  const handleTransfer = (itemId: string, category: FoodCategory) => {
    const maxAvail = getAvailableStock(itemId, category);
    const qty = getTransferQty(itemId, maxAvail);
    if (qty <= 0 || maxAvail <= 0) return;
    transferToStaffPantry(itemId, qty);
    setTransferQuantities((prev) => ({ ...prev, [itemId]: 1 }));
  };

  const handleReturn = (itemId: string, qty: number) => {
    returnFromStaffPantry(itemId, qty);
  };

  // Filter and sort food items (in-stock items prioritize at top)
  const foodItemsList = Object.values(COMMISSARY_FOOD_ITEMS)
    .filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.name.toLowerCase().includes(q) || item.categoryLabel.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const stockA = getAvailableStock(a.id, a.category);
      const stockB = getAvailableStock(b.id, b.category);
      if (stockA > 0 && stockB <= 0) return -1;
      if (stockB > 0 && stockA <= 0) return 1;
      return a.name.localeCompare(b.name);
    });

  // Staged food items
  const stagedEntries = Object.entries(staffPantry).filter(([_, qty]) => qty > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-stone-900 border border-amber-500/40 shadow-2xl shadow-black text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 p-4 sm:p-5 shrink-0 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">🍲</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-amber-300">
                  Staff Pantry Restock Deck
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Isolated Buffer
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Staged rations for daily staff consumption. Main Barn & Silo are protected from auto-draws.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors text-base font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Real-Time Food Category Telemetry Bar */}
        <div className="p-3 bg-stone-950/60 border-b border-stone-800 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {(['crop', 'dairy', 'protein', 'meal'] as FoodCategory[]).map((cat) => {
              const info = FOOD_CATEGORY_INFO[cat];
              const staged = telemetry.stagedFoodUnitsByCategory[cat] || 0;
              const demand = telemetry.dailyFoodDemands[cat] || 0;
              const runway = demand > 0 ? (staged / demand).toFixed(1) : '∞';
              const isShort = demand > 0 && staged < demand;

              return (
                <div
                  key={cat}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    isShort ? 'bg-red-950/30 border-red-500/40 text-red-200' : `${info.bg}`
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{info.icon}</span>
                    <div>
                      <div className="font-bold text-[11px] text-stone-300">{info.label}</div>
                      <div className="text-[10px] text-stone-400">
                        {demand > 0 ? `Need: ${demand}/day` : 'No demand'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-amber-300">{staged} Staged</div>
                    <div className={`text-[10px] font-semibold ${isShort ? 'text-red-400' : 'text-emerald-400'}`}>
                      {runway === '∞' ? 'Fully Stocked' : `${runway}d Runway`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Filter Tabs & Dish Search */}
        <div className="px-4 py-2 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-stone-900/50">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold text-stone-400 mr-1">Filter:</span>
            {(['all', 'meal', 'protein', 'dairy', 'crop'] as const).map((cat) => {
              const isActive = categoryFilter === cat;
              const label = cat === 'all' ? 'All Edibles' : FOOD_CATEGORY_INFO[cat].label;
              const icon = cat === 'all' ? '🍽️' : FOOD_CATEGORY_INFO[cat].icon;

              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center min-w-[160px] max-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full bg-stone-950 border border-stone-700/80 rounded-lg px-2.5 py-1 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/80"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-stone-400 hover:text-stone-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Split View Content: Home Barn Inventory (Left) vs Staff Pantry (Right) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-800 overflow-hidden">
          {/* Left Column: Home Barn & Silo (Available to Transfer) */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-3 bg-stone-950/40 border-b border-stone-800/80 flex items-center justify-between shrink-0">
              <span className="font-bold text-xs text-stone-300 flex items-center gap-1.5">
                <span>🏡</span> Home Barn & Silo Stock
              </span>
              <span className="text-[11px] text-stone-400">Select units to stage</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {foodItemsList.map((item) => {
                const maxAvail = getAvailableStock(item.id, item.category);
                const currentQty = getTransferQty(item.id, maxAvail);
                const catInfo = FOOD_CATEGORY_INFO[item.category];

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      maxAvail > 0
                        ? 'bg-stone-950/70 border-stone-800 hover:border-amber-500/40'
                        : 'bg-stone-950/30 border-stone-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-stone-200 truncate">{item.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold border ${catInfo.bg} ${catInfo.text}`}>
                            {catInfo.label}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            Stock: <b className="text-amber-400">{maxAvail}</b>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transfer controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {maxAvail > 0 ? (
                        <>
                          <div className="flex items-center bg-stone-900 border border-stone-700 rounded-lg overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() => setQty(item.id, currentQty - 1, maxAvail)}
                              className="px-2 py-1 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                            >
                              -
                            </button>
                            <span className="px-2 font-bold text-amber-300 min-w-6 text-center">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQty(item.id, currentQty + 1, maxAvail)}
                              className="px-2 py-1 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQty(item.id, maxAvail, maxAvail)}
                            className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                          >
                            Max
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransfer(item.id, item.category)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            Stage ➔
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-stone-500 italic px-2">Depleted</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Staged Staff Pantry Inventory */}
          <div className="flex flex-col h-full overflow-hidden bg-stone-950/20">
            <div className="p-3 bg-stone-950/40 border-b border-stone-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                  <span>🔒</span> Staged Pantry Stock
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
                  {telemetry.totalStagedFoodUnits} units
                </span>
              </div>
              {stagedEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    for (const [id, qty] of stagedEntries) {
                      returnFromStaffPantry(id, qty);
                    }
                  }}
                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Return All to Barn
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {stagedEntries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-500 space-y-2">
                  <span className="text-4xl opacity-50">🥣</span>
                  <div className="font-bold text-sm text-stone-400">Pantry is Currently Empty</div>
                  <p className="text-xs max-w-xs text-stone-500">
                    Workers consume 1 food unit matching their diet tier each settlement cycle. Transfer edible crops, dairy, proteins, or meals from the left column to prevent strikes!
                  </p>
                </div>
              ) : (
                stagedEntries.map(([fId, qty]) => {
                  const meta = COMMISSARY_FOOD_ITEMS[fId] || {
                    id: fId,
                    name: fId,
                    icon: '🍲',
                    category: 'crop' as FoodCategory,
                    categoryLabel: 'Food',
                  };
                  const catInfo = FOOD_CATEGORY_INFO[meta.category];

                  return (
                    <div
                      key={fId}
                      className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/15 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{meta.icon}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-stone-200 truncate">{meta.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold border ${catInfo.bg} ${catInfo.text}`}>
                              {catInfo.label}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold">
                              Staged: {qty}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Return controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReturn(fId, 1)}
                          className="px-2 py-1 text-[11px] font-bold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                          title="Return 1 unit back to Home Barn"
                        >
                          ⬅️ 1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReturn(fId, qty)}
                          className="px-2 py-1 text-[11px] font-bold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                          title="Return all units back to Home Barn"
                        >
                          ⬅️ All ({qty})
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-400">
            <span>Operational Buffer: </span>
            <b className="text-emerald-400">{telemetry.operationalRunwayDays.toFixed(1)} Days</b>
            <span className="ml-2 text-stone-500">
              (Limiting: {telemetry.limitingFactor.toUpperCase()})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done Staging
          </button>
        </div>
      </div>
    </div>
  );
}
