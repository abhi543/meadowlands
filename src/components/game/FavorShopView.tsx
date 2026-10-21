'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { FAVOR_SHOP_CATALOG } from '@/types/reputation';

export function FavorShopView() {
  const {
    globalReputation,
    crisisShields,
    freeOverclocks,
    bonusStorageCapacity,
    purchaseFavorItem,
    workshopLoadout,
    barn,
    coins,
  } = useGameStore();

  const isSiphonInstalled = Boolean(workshopLoadout?.emergencySiphonInstalled);
  const siphonInBag = barn?.emergency_siphon_valve || 0;

  const spendableFavor = globalReputation?.spendableFavor || 0;

  return (
    <div className="space-y-3 animate-in fade-in">
      {/* VIP Treasury Header */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border border-amber-500/40 text-left shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl select-none">🏛️</span>
              <h4 className="font-black text-sm text-amber-200">
                Town Favor Shop &amp; VIP Utility Exchange
              </h4>
            </div>
            <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">
              Fulfill delivery contracts to earn spendable Favor Tokens. Purchase emergency crisis defense shields, instant production overdrive vouchers, VIP contract rerolls, and permanent granary expansion permits.
            </p>
          </div>
          <div className="bg-black/60 border border-amber-500/50 rounded-xl px-3 py-2 text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Liquid Balance</div>
            <div className="text-xl font-black text-amber-300 font-mono flex items-center justify-end gap-1">
              <span>🎖️</span>
              <span>{spendableFavor}</span>
              <span className="text-xs text-amber-400 font-sans font-medium">Favor</span>
            </div>
          </div>
        </div>

        {/* Active Inventory / Benefits Active Strip */}
        <div className="mt-3 pt-2.5 border-t border-amber-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-stone-900/60 rounded-lg p-1.5 border border-stone-800">
            <div className="text-[10px] text-stone-400">Active Shields</div>
            <div className="text-xs font-black text-sky-300 font-mono">🛡️ {crisisShields || 0} Ready</div>
          </div>
          <div className="bg-stone-900/60 rounded-lg p-1.5 border border-stone-800">
            <div className="text-[10px] text-stone-400">Overdrive Vouchers</div>
            <div className="text-xs font-black text-amber-300 font-mono">⚡ {freeOverclocks || 0} Free</div>
          </div>
          <div className="bg-stone-900/60 rounded-lg p-1.5 border border-stone-800">
            <div className="text-[10px] text-stone-400">Granary Expansion</div>
            <div className="text-xs font-black text-emerald-300 font-mono">📜 +{bonusStorageCapacity || 0} Slots</div>
          </div>
          <div className="bg-stone-900/60 rounded-lg p-1.5 border border-stone-800">
            <div className="text-[10px] text-stone-400">Bio-Dressing</div>
            <div className="text-xs font-black text-teal-300 font-mono">🧪 {barn?.universal_bio_dressing || 0} Doses</div>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {FAVOR_SHOP_CATALOG.map((item) => {
          const isBioDressing = item.type === 'universal_bio_dressing';
          const canAffordFavor = spendableFavor >= item.costFavor;
          const canAffordCoins = isBioDressing && coins >= 25;
          const canAfford = canAffordFavor || canAffordCoins;
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between text-left space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-xl shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h5 className="font-black text-xs text-stone-900 dark:text-white">
                        {item.title}
                      </h5>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300/60 dark:border-amber-700/60 px-2 py-0.5 rounded-lg text-right shrink-0">
                    <span className="font-black text-xs font-mono text-amber-900 dark:text-amber-200">
                      {item.costFavor} 🎖️
                    </span>
                    {isBioDressing && (
                      <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                        or 25 🪙
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between gap-2">
                <span className="text-[10px] text-stone-400 font-mono">
                  {item.type === 'crisis_shield' && `In Inventory: ${crisisShields || 0}`}
                  {item.type === 'instant_overclock' && `Vouchers: ${freeOverclocks || 0}`}
                  {item.type === 'order_reroll' && `Refreshes all 6 orders`}
                  {item.type === 'barn_permit' && `Permit Bonus: +${bonusStorageCapacity || 0}`}
                  {item.type === 'siphon_valve' && (isSiphonInstalled ? '✅ Installed in Tower' : siphonInBag > 0 ? `In Bag: ${siphonInBag}` : 'Not Installed')}
                  {item.type === 'universal_bio_dressing' && `In Bag: ${barn?.universal_bio_dressing || 0} Doses (Pack of 3)`}
                </span>

                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => purchaseFavorItem(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-1 ${
                    canAfford
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 active:scale-95'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>
                    {canAffordFavor
                      ? 'Purchase (10 🎖️)'
                      : canAffordCoins
                      ? 'Emergency Buy (25 🪙)'
                      : `Need ${item.costFavor - spendableFavor} Favor`}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
