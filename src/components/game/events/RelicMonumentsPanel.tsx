'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { formatEventTimeLeft } from '@/lib/eventNotifications';

interface RelicMonumentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RelicMonumentsPanel({ isOpen, onClose }: RelicMonumentsPanelProps) {
  const {
    relics,
    claimCountyFairTrophy,
    applyGlowingSpore,
  } = useGameStore();

  if (!isOpen) return null;

  const now = Date.now();

  const lastClaim = relics.lastCountyFairGemClaim || 0;
  const isTrophyClaimable = relics.countyFairTrophy && (now - lastClaim >= 24 * 60 * 60 * 1000);
  const trophyCooldownLeft = Math.max(0, 24 * 60 * 60 * 1000 - (now - lastClaim));

  const crownActive = Boolean(relics.royalCrownCrestUntil && relics.royalCrownCrestUntil > now);
  const ashActive = Boolean(relics.mineralAshUntil && relics.mineralAshUntil > now);

  const RELIC_LIST = [
    {
      id: 'royal_crown_crest',
      name: 'Royal Crown Crest',
      icon: '👑',
      type: 'Timed Aura (24h)',
      active: crownActive,
      description: '+15% coin payouts on all delivery orders.',
      statusText: crownActive && relics.royalCrownCrestUntil
        ? `Active: ${formatEventTimeLeft(relics.royalCrownCrestUntil - now)} remaining`
        : 'Inactive (Unlocked via Royal Fleet Provision)',
    },
    {
      id: 'mineral_ash_soil',
      name: 'Mineral-Rich Ash Soil',
      icon: '🌋',
      type: 'Timed Aura (60m)',
      active: ashActive,
      description: '3× crop growth speed farm-wide.',
      statusText: ashActive && relics.mineralAshUntil
        ? `Active: ${formatEventTimeLeft(relics.mineralAshUntil - now)} remaining`
        : 'Inactive (Unlocked via Drought & Brushfire)',
    },
    {
      id: 'smugglers_compass',
      name: "Smuggler's Compass",
      icon: '🧭',
      type: 'Permanent Relic',
      active: relics.smugglersCompass,
      description: 'Permanently reduces Wilderness Outpost expedition timers by 20%.',
      statusText: relics.smugglersCompass ? 'Permanent Relic Active' : 'Locked (Unlocked via Midnight Smuggler)',
    },
    {
      id: 'super_feed_mash',
      name: 'Super-Feed Mash',
      icon: '🌾',
      type: 'Consumable Charges',
      active: relics.superFeedCharges > 0,
      description: 'Guarantees livestock double yield on next harvest cycle.',
      statusText: `${relics.superFeedCharges} Charges available`,
    },
    {
      id: 'county_fair_trophy',
      name: 'County Fair Grand Trophy',
      icon: '🏆',
      type: 'Daily Generator Monument',
      active: relics.countyFairTrophy,
      description: 'Generates 3 Gems every 24 hours.',
      statusText: relics.countyFairTrophy
        ? (isTrophyClaimable ? '3 Gems Ready to Claim!' : `Next in ${formatEventTimeLeft(trophyCooldownLeft)}`)
        : 'Locked (Unlocked via County Fair Grand Derby)',
      action: relics.countyFairTrophy ? (
        <button
          onClick={() => claimCountyFairTrophy()}
          disabled={!isTrophyClaimable}
          className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
            isTrophyClaimable
              ? 'bg-amber-400 hover:bg-amber-300 text-stone-900 shadow-md animate-bounce'
              : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
          }`}
        >
          {isTrophyClaimable ? 'Claim +3 💎' : 'Claimed'}
        </button>
      ) : null,
    },
    {
      id: 'feast_of_kings',
      name: 'Feast of Kings Recipe',
      icon: '🍲',
      type: 'Luxury Merchant Recipe',
      active: relics.feastOfKingsUnlocked,
      description: 'Luxury dish liquidating to visiting caravan merchants for 40,000 Coins.',
      statusText: relics.feastOfKingsUnlocked ? 'Recipe Unlocked in Kitchen' : 'Locked (Unlocked via Golden Salmon Migration)',
    },
    {
      id: 'circus_cub',
      name: 'Rescued Circus Cub',
      icon: '🦁',
      type: 'Sanctuary Companion',
      active: relics.circusCub,
      description: 'Rare sanctuary companion animal granting +10% farm experience.',
      statusText: relics.circusCub ? 'Rescued & Living in Sanctuary (+10% XP)' : 'Locked (Unlocked via Travelling Carnival)',
    },
    {
      id: 'glowing_spores',
      name: 'Glowing Alchemical Spores',
      icon: '🍄',
      type: 'Instant-Finish Potion Supply',
      active: relics.glowingSpores > 0,
      description: 'Instant-finish brewing material for industrial machinery.',
      statusText: `${relics.glowingSpores} units in alchemical vault`,
      action: relics.glowingSpores > 0 ? (
        <button
          onClick={() => applyGlowingSpore('bakery', 0)}
          className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm"
        >
          Use Potion (-1)
        </button>
      ) : null,
    },
    {
      id: 'master_artisan_ledger',
      name: "Master Artisan's Ledger",
      icon: '📖',
      type: 'Permanent Relic',
      active: relics.masterArtisanLedger,
      description: 'Permanently reduces all machine crafting durations farm-wide by 5%.',
      statusText: relics.masterArtisanLedger ? 'Permanent 5% Craft Speed Buff Active' : 'Locked (Unlocked via Artisan Masterclass)',
    },
    {
      id: 'ancient_sun_relic',
      name: 'Ancient Sun Relic',
      icon: '☀️',
      type: 'Permanent Monument',
      active: relics.ancientSunRelic,
      description: 'Permanent artifact monument providing +15% multiplier to all player XP gains.',
      statusText: relics.ancientSunRelic ? 'Permanent +15% XP Multiplier Active' : 'Locked (Unlocked via Ancient Subterranean Excavation)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none">🏛️</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                Estate Hall of Fame
              </span>
              <h3 className="font-black text-lg text-stone-900 dark:text-white leading-tight">
                Relics &amp; Grand Monuments
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* List of 10 Artifacts */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {RELIC_LIST.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                item.active
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/80 shadow-sm'
                  : 'bg-stone-50/40 dark:bg-stone-850/40 border-stone-200/60 dark:border-stone-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-3xl select-none flex-shrink-0 mt-0.5">{item.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-stone-900 dark:text-white truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                    {item.description}
                  </p>
                  <p className={`text-[11px] font-semibold mt-1 ${
                    item.active
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-stone-400 dark:text-stone-500'
                  }`}>
                    {item.statusText}
                  </p>
                </div>
              </div>

              {item.action && (
                <div className="flex-shrink-0 ml-2">
                  {item.action}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-xs bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
}
