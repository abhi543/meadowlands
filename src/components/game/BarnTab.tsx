'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import { getAllBarnItems } from '@/utils/barnInventory';
import { BarnItemCategory, BarnItem } from '@/types/inventory';
import { CROPS, PRODUCTS } from '@/game/data';

interface BarnTabProps {
  onSelectTab?: (tab: string) => void;
}

export function BarnTab({ onSelectTab }: BarnTabProps) {
  const {
    silo,
    barn,
    level,
    bonusStorageCapacity,
    wranglerPolicy,
    barnItemLocks = {},
    toggleBarnItemLock,
    setBarnItemCustomReserve,
  } = useGameStore();

  const [activeCategory, setActiveCategory] = useState<BarnItemCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLockedOnly, setFilterLockedOnly] = useState(false);

  // Storage calculations
  const storageBonus = bonusStorageCapacity || 0;
  const siloUsed = Object.values(silo || {}).reduce((a, b) => a + b, 0);
  const siloMax = 50 + level * 5 + storageBonus;
  const barnUsed = Object.values(barn || {}).reduce((a, b) => a + b, 0);
  const barnMax = 30 + level * 3 + storageBonus;

  // Build items array
  const allItems = getAllBarnItems(silo, barn, barnItemLocks);

  // Filter items
  const filteredItems = allItems.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (filterLockedOnly && !item.isLockedForWorkers) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
    }
    return true;
  });

  const lockedCount = allItems.filter(i => i.isLockedForWorkers).length;
  const globalFloor = wranglerPolicy?.globalReserveFloor ?? 10;

  return (
    <div className="space-y-4">
      {/* Top Banner / Dashboard Bar */}
      <div className="bg-gradient-to-r from-amber-700 via-stone-800 to-stone-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl border border-amber-600/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🏠</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg sm:text-xl text-amber-200">
                  Barn & Silo Inventory
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Storage Vault
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Manage farm reserves and toggle worker feeding locks to protect your crafting and order supplies.
              </p>
            </div>
          </div>
        </div>

        {/* Capacity Gauges */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl px-3 py-2 flex items-center gap-3 shadow-inner">
            <div className="text-2xl">🌾</div>
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400">Silo Capacity</div>
              <div className="text-sm font-black font-mono text-stone-200">
                <span className={siloUsed >= siloMax ? 'text-red-400' : 'text-emerald-400'}>{siloUsed}</span> / {siloMax}
              </div>
            </div>
          </div>

          <div className="bg-stone-950/70 border border-stone-800 rounded-xl px-3 py-2 flex items-center gap-3 shadow-inner">
            <div className="text-2xl">🏠</div>
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400">Barn Capacity</div>
              <div className="text-sm font-black font-mono text-stone-200">
                <span className={barnUsed >= barnMax ? 'text-red-400' : 'text-amber-400'}>{barnUsed}</span> / {barnMax}
              </div>
            </div>
          </div>

          {/* Quick Caretaker Policy Pill */}
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('farmhands')}
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Configure Tessa's feeding strategy in Workers tab"
            >
              <span>🌾</span>
              <span>Tessa Policy: {wranglerPolicy?.strategy === 'gourmet_breeder' ? 'Gourmet' : 'Budget'}</span>
              <span className="text-[10px] opacity-75">➔</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          {(
            [
              { id: 'all', label: 'All Items', icon: '📦' },
              { id: 'crop', label: 'Crops (Feed)', icon: '🌾' },
              { id: 'forage', label: 'Forage', icon: '🍇' },
              { id: 'artisan', label: 'Artisan', icon: '⚙️' },
              { id: 'animal_product', label: 'Animal Goods', icon: '🐾' },
            ] as const
          ).map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Lock Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setFilterLockedOnly(!filterLockedOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterLockedOnly
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
            }`}
          >
            <span>🔒</span>
            <span>Locked ({lockedCount})</span>
          </button>

          <div className="relative flex-1 md:w-48">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="absolute left-2.5 top-1.5 text-xs text-stone-400 pointer-events-none">🔍</span>
          </div>
        </div>
      </div>

      {/* Grid of Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white/50 dark:bg-stone-900/40 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-400 text-sm">
          No matching items found in Barn or Silo storage.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredItems.map(item => {
            const isLocked = item.isLockedForWorkers;
            const customReserve = item.customReserveThreshold;
            const effectiveFloor = customReserve !== undefined ? customReserve : globalFloor;
            const isFeedCrop = item.category === 'crop' || item.id === 'feed' || item.id === 'wild_berries';

            return (
              <div
                key={item.id}
                className={`relative rounded-2xl border p-3.5 transition-all flex flex-col justify-between overflow-hidden shadow-sm ${
                  isLocked
                    ? 'border-rose-400/40 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/15 ring-1 ring-rose-500/20'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 hover:border-amber-400/50 dark:hover:border-stone-700'
                }`}
              >
                {/* Top: Icon, Identity, Quantity & Lock Toggle */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                          {item.name}
                        </h4>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-black text-amber-700 dark:text-amber-300 font-mono">
                            {item.quantity} in stock
                          </span>
                          <span>·</span>
                          <span className="text-[10px]">🪙 {item.baseValue}/ea</span>
                        </div>
                      </div>
                    </div>

                    {/* Inline Lock Toggle Button */}
                    <button
                      onClick={() => toggleBarnItemLock(item.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-95 shrink-0 ${
                        isLocked
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                      }`}
                      title={
                        isLocked
                          ? 'Locked: Workers and caretakers will NOT consume this crop!'
                          : 'Unlocked: Eligible for automated caretaker animal feeding.'
                      }
                    >
                      <span>{isLocked ? '🔒' : '🔓'}</span>
                      <span className="text-[11px]">{isLocked ? 'Locked' : 'Unlocked'}</span>
                    </button>
                  </div>

                  {/* Feeding Automation Status Pill */}
                  <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono border-t border-stone-100 dark:border-stone-800/80 pt-2">
                    <span className="text-stone-400">Worker Status:</span>
                    {isLocked ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                        <span>🛡️</span> Protected (No Feed)
                      </span>
                    ) : item.quantity <= effectiveFloor ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <span>⚠️</span> At/Below Floor ({effectiveFloor})
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <span>✨</span> Available ({item.quantity - effectiveFloor} surplus)
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Custom Reserve Threshold Controls */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800/80">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-stone-500 dark:text-stone-400">Reserve Floor:</span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                      {customReserve !== undefined ? `${customReserve} (Custom)` : `${globalFloor} (Global)`}
                    </span>
                  </div>

                  {/* Quick Floor Preset Stepper */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      onClick={() => setBarnItemCustomReserve(item.id, undefined)}
                      className={`flex-1 py-1 rounded text-center font-bold transition-colors ${
                        customReserve === undefined
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                          : 'bg-stone-100 dark:bg-stone-800/60 text-stone-500 hover:bg-stone-200'
                      }`}
                      title="Use global Wrangler reserve floor"
                    >
                      Default
                    </button>
                    {[5, 10, 25, 50].map(val => (
                      <button
                        key={val}
                        onClick={() => setBarnItemCustomReserve(item.id, val)}
                        className={`flex-1 py-1 rounded text-center font-bold transition-colors ${
                          customReserve === val
                            ? 'bg-indigo-500 text-white shadow-2xs'
                            : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BarnTab;
