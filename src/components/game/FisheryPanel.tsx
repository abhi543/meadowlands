'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  WATER_ZONES, FISH_SPECIES, ROD_TIERS, ROD_TIER_ORDER,
  TIER_COLORS, TIER_LABELS,
  type WaterZoneId, type Tier,
} from '@/game/data';

const ZONE_ORDER: WaterZoneId[] = ['zone_pond', 'zone_river', 'zone_estuary', 'zone_lake', 'zone_ocean'];

export function FisheryPanel() {
  const { fishery, level, coins, gems, barn, farmhands, autonomousWorkers, unlockFisheryZone, upgradeFishingRod } = useGameStore();

  // Re-render every second for progress bars
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentRod = ROD_TIERS[fishery.rodTier];
  const currentRodIdx = ROD_TIER_ORDER.indexOf(fishery.rodTier);
  const nextRod = currentRodIdx < ROD_TIER_ORDER.length - 1 ? ROD_TIERS[ROD_TIER_ORDER[currentRodIdx + 1]] : null;

  const fishermanFarmhands = farmhands.filter(f => f.role === 'fisherman');
  const fishermanCount = fishermanFarmhands.length;
  const autonomousFisherman = autonomousWorkers.filter(w => w.type === 'fisherman').length;
  const hasFisherman = fishermanCount > 0 || autonomousFisherman > 0;
  const hasSlicker = fishermanFarmhands.some(fh => fh.equippedOutfit === 'fisherman_slicker');

  // Total fish count in barn
  const totalFish = Object.entries(barn)
    .filter(([k]) => k === 'fish' || (FISH_SPECIES as Record<string, unknown>)[k])
    .reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="space-y-3">
      {/* Rod Info + Fisherman Status */}
      <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{'\u{1F3A3}'}</span>
            <div>
              <div className="text-sm font-semibold text-sky-800 dark:text-sky-300">
                {currentRod.name}
              </div>
              <div className="text-xs text-sky-600 dark:text-sky-400">
                Speed: {Math.round(currentRod.speedMultiplier * 100)}%
                {currentRod.rareBoost > 0 && ` | +${Math.round(currentRod.rareBoost * 100)}% rare`}
                {currentRod.legendaryBoost > 0 && ` | +${Math.round(currentRod.legendaryBoost * 100)}% legendary`}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-sky-700 dark:text-sky-300">
              {'\u{1F41F}'} {barn.fish || 0}
            </div>
            {hasFisherman ? (
              <div className="text-[10px] text-sky-500 dark:text-sky-400">
                {fishermanCount + autonomousFisherman} fisherman active
              </div>
            ) : (
              <div className="text-[10px] text-amber-500 dark:text-amber-400 font-medium">
                Hire a fisherman!
              </div>
            )}
          </div>
        </div>

        {hasSlicker && (
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-2">
            {'\u{1F9E5}'} Fisherman Slicker equipped: -33% catch time
          </div>
        )}

        {/* Rod Upgrade Button */}
        {nextRod && (
          <button
            onClick={upgradeFishingRod}
            disabled={level < nextRod.unlockLevel || coins < nextRod.costCoins}
            className="w-full py-1.5 text-xs font-medium rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
          >
            Upgrade to {nextRod.name} {'\u{1F4B0}'}{nextRod.costCoins}
            {level < nextRod.unlockLevel && ` (Lv.${nextRod.unlockLevel})`}
          </button>
        )}
        {!nextRod && (
          <div className="text-[10px] text-center text-sky-500 dark:text-sky-400">Max rod tier reached!</div>
        )}
      </div>

      {/* Zone Cards */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">
          Water Zones
        </h4>
        {ZONE_ORDER.map(zoneId => {
          const zone = WATER_ZONES[zoneId];
          const isUnlocked = fishery.unlockedZones.includes(zoneId);
          const lastCatch = fishery.lastCatchTimestamps[zoneId] || 0;

          let progress = 0;
          let countdownSec = 0;
          if (isUnlocked && lastCatch > 0) {
            const interval = zone.baseIntervalMs * currentRod.speedMultiplier * (hasSlicker ? 0.67 : 1);
            const elapsed = now - lastCatch;
            progress = Math.min(1, elapsed / interval);
            countdownSec = Math.max(0, Math.ceil((interval - elapsed) / 1000));
          }

          return (
            <div
              key={zoneId}
              className={`rounded-xl border-2 p-3 transition-all ${
                isUnlocked
                  ? 'bg-white dark:bg-gray-900 border-sky-200 dark:border-sky-800'
                  : 'bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-gray-700 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{zone.emoji}</span>
                  <div>
                    <h5 className="font-semibold text-sm text-stone-800 dark:text-gray-200">
                      {zone.name}
                      {isUnlocked && (
                        <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </h5>
                    <p className="text-xs text-stone-500 dark:text-gray-400">
                      {zone.waterType} {'\u2022'} {zone.species.length} species
                    </p>
                  </div>
                </div>
              </div>

              {isUnlocked ? (
                <>
                  {hasFisherman ? (
                    <>
                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-sky-100 dark:bg-sky-900 rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full bg-sky-400 dark:bg-sky-500 rounded-full transition-all"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-sky-600 dark:text-sky-400 text-right">
                        Next catch in {countdownSec}s
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      Hire a Fisherman (Workers tab) to start catching!
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-stone-500 dark:text-gray-400">
                    {level < zone.unlockLevel
                      ? `Requires Lv.${zone.unlockLevel} to unlock`
                      : 'Ready to unlock!'}
                  </div>
                  {level >= zone.unlockLevel && (
                    <button
                      onClick={() => unlockFisheryZone(zoneId)}
                      disabled={
                        (zone.unlockCostCoins ? coins < zone.unlockCostCoins : false) ||
                        (zone.unlockCostGems ? gems < zone.unlockCostGems : false)
                      }
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                    >
                      Unlock {'\u{1F4B0}'}{zone.unlockCostCoins || 0}{zone.unlockCostGems ? ` \u{1F48E}${zone.unlockCostGems}` : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Aquatic Codex */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">
          Aquatic Codex
        </h4>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-3">
            {(Object.values(FISH_SPECIES)).map(sp => {
              const codexKey = `fish_${sp.id}`;
              const discovered = fishery.fishCodex[codexKey];
              const owned = barn[sp.id] || 0;

              return (
                <div
                  key={sp.id}
                  className="rounded-lg border-2 p-1.5 text-center transition-all"
                  style={{
                    borderColor: discovered ? TIER_COLORS[sp.tier] : '#e5e7eb',
                    backgroundColor: discovered ? `${TIER_COLORS[sp.tier]}15` : 'transparent',
                  }}
                >
                  {discovered ? (
                    <>
                      <div className="text-lg mb-0.5">{sp.emoji}</div>
                      <div className="text-[9px] font-bold" style={{ color: TIER_COLORS[sp.tier] }}>
                        {sp.name}
                      </div>
                      <div className="text-[8px] text-stone-500 dark:text-gray-400">
                        {TIER_LABELS[sp.tier]}
                      </div>
                      {owned > 0 && (
                        <div className="text-[8px] text-stone-400 dark:text-gray-500">x{owned}</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-lg mb-0.5 opacity-20 grayscale">{'\u2753'}</div>
                      <div className="text-[9px] text-stone-400 dark:text-gray-500">
                        {TIER_LABELS[sp.tier]}
                      </div>
                      <div className="text-[8px] text-stone-300 dark:text-gray-600 italic">
                        {sp.hint}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
