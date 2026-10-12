'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  WATER_ZONES, FISH_SPECIES, ROD_TIERS, ROD_TIER_ORDER,
  TIER_COLORS, TIER_LABELS,
  type WaterZoneId, type Tier,
} from '@/game/data';
import { OverclockActionMenu } from './OverclockActionMenu';

const ZONE_ORDER: WaterZoneId[] = ['zone_pond', 'zone_river', 'zone_estuary', 'zone_lake', 'zone_ocean'];

export function FisheryPanel() {
  const {
    fishery, level, coins, gems, barn, farmhands, autonomousWorkers, unifiedWorkers,
    unlockFisheryZone, upgradeFishingRod, buyFarmhand, hireUnifiedWorker,
  } = useGameStore();

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
  const dockMaster = unifiedWorkers?.fisherman;
  const autoTrawler = unifiedWorkers?.auto_fisherman;
  const isDockMasterHired = Boolean(dockMaster?.isHired);
  const isAutoTrawlerHired = Boolean(autoTrawler?.isHired);
  const autonomousFishermanCount = autonomousWorkers.filter(w => w.type === 'fisherman').length;

  const totalFishermenActive = fishermanFarmhands.length + (isDockMasterHired ? 1 : 0) + (isAutoTrawlerHired ? 1 : 0) + autonomousFishermanCount;
  const hasFisherman = totalFishermenActive > 0;
  const hasSlicker = fishermanFarmhands.some(fh => fh.equippedOutfit === 'fisherman_slicker');

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
              <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                {'\u{1F3A3}'} {totalFishermenActive} fisherman{totalFishermenActive > 1 ? 'men' : ''} active
              </div>
            ) : (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                No fisherman active
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

      {/* Fishermen Crew & Hiring Section */}
      <div className="bg-white dark:bg-gray-900 border border-sky-200 dark:border-sky-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{'\u{1F3A3}'}</span>
            <div>
              <h4 className="text-sm font-bold text-stone-800 dark:text-gray-200">
                Fishermen Crew
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-gray-400">
                Hire fishermen to catch fish continuously across unlocked waters.
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            hasFisherman
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
          }`}>
            {hasFisherman ? `${totalFishermenActive} on Duty` : 'Idle (Hire Below)'}
          </span>
        </div>

        {/* Notice banner when idle */}
        {!hasFisherman && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg p-2.5 flex items-center justify-between gap-2">
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <span className="font-bold">Water zones are idle!</span> Hire a fisherman to start catching fish automatically.
            </div>
            <button
              onClick={() => buyFarmhand('fisherman')}
              disabled={coins < 100}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white shadow-sm transition-all whitespace-nowrap"
            >
              Hire Now {'\u{1F4B0}'}100
            </button>
          </div>
        )}

        {/* Fisherman Hiring Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Card 1: Dock Fisherman (Farmhand) */}
          <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-2.5 bg-stone-50/60 dark:bg-stone-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-stone-800 dark:text-gray-200 flex items-center gap-1.5">
                  <span>{'\u{1F3A3}'}</span> Dock Fisherman
                </span>
                {fishermanFarmhands.length > 0 && (
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5 rounded">
                    x{fishermanFarmhands.length} Hired
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-gray-400 leading-tight mb-2">
                Available from Lv.1. Directly operates fishing lines across all unlocked waters.
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-gray-800">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {'\u{1F4B0}'} 100
              </span>
              <button
                onClick={() => buyFarmhand('fisherman')}
                disabled={coins < 100}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
              >
                {fishermanFarmhands.length > 0 ? '+ Hire Another' : 'Hire Fisherman'}
              </button>
            </div>
          </div>

          {/* Card 2: Dock Master (Guild Worker) */}
          <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-2.5 bg-stone-50/60 dark:bg-stone-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-stone-800 dark:text-gray-200 flex items-center gap-1.5">
                  <span>{'\u2693'}</span> Dock Master
                </span>
                {isDockMasterHired ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                    Lv.{dockMaster?.level} Active
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 dark:text-gray-500">
                    Req. Lv.6
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-gray-400 leading-tight mb-2">
                Guild master with auto-sell/hoard modes and trout discovery bonuses.
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-gray-800">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {'\u{1F4B0}'} 300
              </span>
              {isDockMasterHired ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  {'\u2713'} Guild Member
                </span>
              ) : (
                <button
                  onClick={() => hireUnifiedWorker('fisherman')}
                  disabled={level < 6 || coins < 300}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                >
                  {level < 6 ? 'Lv.6 Required' : 'Hire Master'}
                </button>
              )}
            </div>
          </div>
        </div>
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
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
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
                {isUnlocked && (
                  <OverclockActionMenu
                    entityId={`fishery_${zoneId}`}
                    entityType="fishery"
                    name={zone.name}
                    compact={true}
                  />
                )}
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
                    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-lg p-2 mt-1">
                      <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                        {'\u26A0\uFE0F'} Idle — Needs an active fisherman
                      </div>
                      <button
                        onClick={() => buyFarmhand('fisherman')}
                        disabled={coins < 100}
                        className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-all shadow-sm"
                      >
                        Hire ({'\u{1F4B0}'}100)
                      </button>
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
