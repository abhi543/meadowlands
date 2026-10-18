'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  WATER_ZONES, FISH_SPECIES, ROD_TIERS, ROD_TIER_ORDER,
  TIER_COLORS, TIER_LABELS,
  type WaterZoneId,
} from '@/game/data';
import {
  ZONE_ECOSYSTEM_CONFIGS,
  isZoneFishingPaused,
  calculatePondEvaporationLitersPerMin,
  calculateClimateSensitivity,
  calculateVolumeMultiplier,
  calculateActiveSpawnInterval,
  calculateActiveCatchIntervalMs,
  POND_HYDROLOGY,
  type ZoneUpgradeTier,
  getZoneUpgradeDef,
  getZoneMaxStationSlots,
  computeDockMasterAssignments,
  type ZoneCrewAllocation,
  type FisheryCrewPolicy,
} from '@/game/aquaticEcosystem';
import { OverclockActionMenu } from './OverclockActionMenu';

const ZONE_ORDER: WaterZoneId[] = ['zone_pond', 'zone_river', 'zone_estuary', 'zone_lake', 'zone_ocean'];

function formatTimeSec(seconds: number): string {
  if (seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function FisheryPanel() {
  const {
    fishery, hydrology, level, coins, gems, barn, farmhands, autonomousWorkers, unifiedWorkers,
    unlockFisheryZone, upgradeFishingRod, upgradeWaterZoneTier, buyFarmhand, hireUnifiedWorker,
    refillPondFromTower, manualCatchFish,
    setSustainableRotation, setCatchHandlingPolicy, pinWorkerToZone, unpinWorkerFromZone,
  } = useGameStore();

  // Re-render every second for progress bars & spawn clocks
  const [now, setNow] = useState(Date.now());
  const [castingZoneId, setCastingZoneId] = useState<WaterZoneId | null>(null);

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

  // Crew Policies & Dock Master Workforce Allocation
  const crewPolicy: FisheryCrewPolicy = fishery.crew?.policy || {
    sustainableRotation: true,
    catchHandling: 'auto-sell-common',
  };
  const pinnedWorkersMap: Record<WaterZoneId, number> = fishery.crew?.pinnedWorkers || {
    zone_pond: 0,
    zone_river: 0,
    zone_estuary: 0,
    zone_lake: 0,
    zone_ocean: 0,
  };

  const dockMasterAssignments = computeDockMasterAssignments({
    unlockedZones: fishery.unlockedZones,
    totalWorkforce: totalFishermenActive,
    pinnedWorkers: pinnedWorkersMap,
    zoneEcosystem: fishery.zoneEcosystem || {},
    sustainableRotation: crewPolicy.sustainableRotation,
  });

  const availableFreeWorkers = Math.max(0, totalFishermenActive - dockMasterAssignments.totalPinned);

  // Meteorological & Hydrological Context
  const atmos = hydrology?.weatherState;
  const tempC = atmos?.temperatureC !== undefined ? atmos.temperatureC : 27;
  const humidity = atmos?.relativeHumidityPct !== undefined ? atmos.relativeHumidityPct : 40;
  const towerLiters = hydrology?.towerLiters !== undefined ? hydrology.towerLiters : 0;
  const towerCap = hydrology?.towerCapacityLiters !== undefined ? hydrology.towerCapacityLiters : 800;
  const pondVolume = fishery.pondWaterVolume !== undefined ? fishery.pondWaterVolume : POND_HYDROLOGY.INITIAL_VOLUME_LITERS;
  const pondEvapRate = calculatePondEvaporationLitersPerMin(tempC, humidity);

  // Aggregated Stock Telemetry
  let totalCurrentStock = 0;
  let totalStockCap = 0;
  let depletedZonesCount = 0;
  let frozenZonesCount = 0;

  for (const zId of fishery.unlockedZones) {
    const cfg = ZONE_ECOSYSTEM_CONFIGS[zId];
    const eco = fishery.zoneEcosystem?.[zId] || {
      currentStock: cfg.stockCap,
      maxStock: cfg.stockCap,
      spawnProgressSec: 0,
      isDepleted: false,
    };
    totalCurrentStock += eco.currentStock;
    totalStockCap += eco.maxStock;
    if (isZoneFishingPaused(eco.currentStock, eco.maxStock, eco.isDepleted)) depletedZonesCount++;
    const climate = calculateClimateSensitivity(zId, tempC);
    if (climate.isFrozen) frozenZonesCount++;
  }

  const handleManualCast = (zoneId: WaterZoneId) => {
    setCastingZoneId(zoneId);
    manualCatchFish(zoneId);
    setTimeout(() => {
      setCastingZoneId(null);
    }, 700);
  };

  return (
    <div className="space-y-3.5">
      {/* Environmental & Aquatic Telemetry Bar */}
      <div className="bg-gradient-to-r from-sky-900/90 via-slate-900 to-indigo-950 border border-sky-600/40 rounded-xl p-3 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 bg-sky-800/50 rounded-lg border border-sky-500/30">
              {tempC < 2 ? '❄️' : tempC > 38 ? '🔥' : '🌊'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-200 uppercase tracking-wider">
                  Aquatic Climate Engine
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  tempC < 2
                    ? 'bg-blue-900/80 text-blue-200 border-blue-400 animate-pulse'
                    : tempC > 38
                    ? 'bg-amber-900/80 text-amber-200 border-amber-400'
                    : 'bg-emerald-900/80 text-emerald-200 border-emerald-400'
                }`}>
                  {tempC < 2 ? 'Sub-Zero Frost' : tempC > 38 ? 'Severe Heatwave' : 'Mild Season'}
                </span>
              </div>
              <div className="text-[11px] text-sky-300/80 flex items-center gap-2 mt-0.5">
                <span>🌡️ Ambient Temp: <strong className="text-white">{tempC.toFixed(1)}°C</strong></span>
                <span>•</span>
                <span>💧 Relative Humidity: <strong className="text-white">{Math.round(humidity)}%</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div className="bg-sky-950/60 border border-sky-700/40 rounded-lg px-2.5 py-1.5">
              <div className="text-[10px] text-sky-400 font-semibold">Active Fish Stocks</div>
              <div className="text-sm font-bold text-white flex items-center gap-1 justify-end">
                <span>🐟</span>
                <span>{totalCurrentStock} / {totalStockCap}</span>
              </div>
            </div>

            <div className="bg-sky-950/60 border border-sky-700/40 rounded-lg px-2.5 py-1.5">
              <div className="text-[10px] text-sky-400 font-semibold">Elevated Tower</div>
              <div className="text-sm font-bold text-white flex items-center gap-1 justify-end">
                <span>🗼</span>
                <span>{Math.round(towerLiters)} / {towerCap}L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-sky-800/40 text-[11px]">
          <span className="text-sky-300 font-medium">Zone Ecosystem Telemetry:</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
            ● {fishery.unlockedZones.length - depletedZonesCount - frozenZonesCount} Active
          </span>
          {depletedZonesCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-700/60 animate-pulse font-semibold">
              ⏳ {depletedZonesCount} Paused (Restocking to Full)
            </span>
          )}
          {frozenZonesCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-700/60 animate-pulse font-semibold">
              🧊 {frozenZonesCount} Frozen
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-sky-950/60 text-sky-300 border border-sky-700/50 ml-auto">
            Baseline R:D Ratio: <strong>2.0x</strong>
          </span>
        </div>
      </div>

      {/* Rod Info + Fisherman Status */}
      <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎣</span>
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
              🐟 {barn.fish || 0}
            </div>
            {hasFisherman ? (
              <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                🎣 {totalFishermenActive} fisherman{totalFishermenActive > 1 ? 'men' : ''} active
              </div>
            ) : (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                No fisherman active
              </div>
            )}
          </div>
        </div>

        {hasSlicker && (
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-2 font-medium">
            🥼 Fisherman Slicker equipped: -33% catch interval across all water zones
          </div>
        )}

        {/* Rod Upgrade Button */}
        {nextRod && (
          <button
            onClick={upgradeFishingRod}
            disabled={level < nextRod.unlockLevel || coins < nextRod.costCoins}
            className="w-full py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors shadow-sm"
          >
            Upgrade to {nextRod.name} 💰{nextRod.costCoins}
            {level < nextRod.unlockLevel && ` (Lv.${nextRod.unlockLevel})`}
          </button>
        )}
        {!nextRod && (
          <div className="text-[10px] text-center text-sky-500 dark:text-sky-400 font-medium">Max rod tier reached!</div>
        )}
      </div>

      {/* Fishermen Crew & Dock Master Allocation Command */}
      <div className="bg-white dark:bg-gray-900 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl p-1 bg-sky-50 dark:bg-sky-950/70 rounded-lg border border-sky-200 dark:border-sky-800">
              ⚓
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-stone-800 dark:text-gray-100">
                  Fishermen Crew & Dock Master Command
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  hasFisherman
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                }`}>
                  {hasFisherman ? `${totalFishermenActive} Active Angler${totalFishermenActive > 1 ? 's' : ''}` : 'Idle (Hire Below)'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-gray-400">
                Automated smart-balanced rotation with zone station caps (S<sub>max</sub>) and tactical manual pinning.
              </p>
            </div>
          </div>

          {/* Telemetry Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 font-semibold text-sky-800 dark:text-sky-300">
              🎣 {totalFishermenActive} Total
            </span>
            <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-semibold text-indigo-700 dark:text-indigo-300">
              📌 {dockMasterAssignments.totalPinned} Pinned
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-semibold text-emerald-700 dark:text-emerald-300">
              🤖 {dockMasterAssignments.totalAutoAssigned} Auto
            </span>
            <span className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 font-semibold text-stone-600 dark:text-stone-300">
              🏠 {dockMasterAssignments.totalBunkhouseReserve} Bunkhouse
            </span>
          </div>
        </div>

        {/* Notice banner when idle */}
        {!hasFisherman && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg p-2.5 flex items-center justify-between gap-2">
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <span className="font-bold">Waters are unstaffed!</span> Hire fishermen or the Dock Master below to automatically harvest unlocked water bodies.
            </div>
            <button
              onClick={() => buyFarmhand('fisherman')}
              disabled={coins < 100}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              Hire Now 💰100
            </button>
          </div>
        )}

        {/* Dock Master Guild Policies */}
        <div className="bg-stone-50/70 dark:bg-stone-900/50 rounded-xl p-2.5 border border-stone-200 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-gray-300">
            <span className="flex items-center gap-1.5">
              <span>📜</span> Dock Master Guild Policies
            </span>
            <span className="text-[10px] text-stone-400 font-normal">Applies dynamically to all unpinned auto-routing anglers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Policy 1: Harvest Rotation */}
            <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-lg p-2 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700 dark:text-gray-300">
                  Harvest Aggression Mode
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                  crewPolicy.sustainableRotation
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {crewPolicy.sustainableRotation ? 'Sustainable' : 'Full Deplete'}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-gray-400 leading-tight">
                {crewPolicy.sustainableRotation
                  ? 'Auto-anglers evacuate water bodies at ≤20% stock, rotating to healthier waters to prevent full restock lockout.'
                  : 'Anglers harvest zones down to 0 stock, triggering a full restocking recovery pause.'}
              </p>
              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-stone-100 dark:border-gray-800">
                <button
                  onClick={() => setSustainableRotation(true)}
                  className={`py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                    crewPolicy.sustainableRotation
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  🌿 Sustainable (20%)
                </button>
                <button
                  onClick={() => setSustainableRotation(false)}
                  className={`py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                    !crewPolicy.sustainableRotation
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  ⚔️ Strip-Mine (0%)
                </button>
              </div>
            </div>

            {/* Policy 2: Catch Handling Logistics */}
            <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-lg p-2 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700 dark:text-gray-300">
                  Catch Priority & Logistics
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                  crewPolicy.catchHandling === 'auto-sell-common'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                }`}>
                  {crewPolicy.catchHandling === 'auto-sell-common' ? 'Auto-Sell Common' : 'Hoard All'}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-gray-400 leading-tight">
                {crewPolicy.catchHandling === 'auto-sell-common'
                  ? 'Common fish (Carp, Trout, Mud Crab, Arctic Char, Tuna) auto-sold for coins on catch. Rare & culinary species saved to Barn.'
                  : 'All caught species stored in Barn inventory without auto-selling.'}
              </p>
              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-stone-100 dark:border-gray-800">
                <button
                  onClick={() => setCatchHandlingPolicy('auto-sell-common')}
                  className={`py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                    crewPolicy.catchHandling === 'auto-sell-common'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  💰 Auto-Sell Common
                </button>
                <button
                  onClick={() => setCatchHandlingPolicy('hoard-all')}
                  className={`py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                    crewPolicy.catchHandling === 'hoard-all'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  📦 Hoard All in Barn
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Harbor Station Allocation Overview */}
        {hasFisherman && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-700 dark:text-gray-300 flex items-center gap-1.5">
                <span>📍</span> Harbor Station Distribution
              </span>
              <span className="text-[10px] text-stone-400 dark:text-gray-500">
                Free Anglers in Pool: <strong className="text-stone-700 dark:text-gray-200">{availableFreeWorkers}</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
              {fishery.unlockedZones.map(zId => {
                const alloc = dockMasterAssignments.zoneAssignments[zId] || { pinned: 0, autoAssigned: 0, maxSlots: 2, totalAssigned: 0, isProtectedLowStock: false, isPausedRestocking: false, score: -1 };
                const totalStationed = alloc.pinned + alloc.autoAssigned;
                const zName = WATER_ZONES[zId].name;
                const isFull = totalStationed >= alloc.maxSlots;

                return (
                  <div
                    key={zId}
                    className={`rounded-lg p-2 border text-center transition-all ${
                      alloc.isProtectedLowStock
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : isFull
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800'
                        : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-gray-800'
                    }`}
                  >
                    <div className="text-[10px] font-semibold text-stone-600 dark:text-gray-300 truncate">
                      {zName}
                    </div>
                    <div className="text-xs font-bold text-stone-800 dark:text-gray-100 my-0.5">
                      🎣 {totalStationed}/{alloc.maxSlots}
                    </div>
                    <div className="text-[9px] text-stone-400 dark:text-gray-500 flex items-center justify-center gap-1">
                      <span>📌 {alloc.pinned}</span>
                      <span>•</span>
                      <span>🤖 {alloc.autoAssigned}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fisherman Hiring Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Card 1: Dock Fisherman (Farmhand) */}
          <div className="border border-stone-200 dark:border-gray-800 rounded-lg p-2.5 bg-stone-50/60 dark:bg-stone-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-stone-800 dark:text-gray-200 flex items-center gap-1.5">
                  <span>🎣</span> Dock Fisherman
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
                💰 100
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
                  <span>⚓</span> Dock Master
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
                Guild master with auto-sell/hoard modes and rare trout discovery bonuses.
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-gray-800">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                💰 300
              </span>
              {isDockMasterHired ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Guild Member
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

      {/* Water Zones Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-stone-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>🌊</span> Dynamic Water Zones ({fishery.unlockedZones.length}/5 Unlocked)
          </h4>
          <span className="text-[11px] text-stone-500 dark:text-gray-400">
            Replenishment Ratio: R = 2.0 × M<sub>tier</sub>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {ZONE_ORDER.map(zoneId => {
            const zone = WATER_ZONES[zoneId];
            const cfg = ZONE_ECOSYSTEM_CONFIGS[zoneId];
            const isUnlocked = fishery.unlockedZones.includes(zoneId);
            const lastCatch = fishery.lastCatchTimestamps[zoneId] || 0;

            const eco = fishery.zoneEcosystem?.[zoneId] || {
              currentStock: cfg.stockCap,
              maxStock: cfg.stockCap,
              spawnProgressSec: 0,
              isDepleted: false,
              tier: 1,
            };

            const tier = (eco.tier || 1) as ZoneUpgradeTier;
            const currentDef = getZoneUpgradeDef(zoneId, tier);
            const isMaxTier = tier >= 5;
            const nextTier = (tier + 1) as ZoneUpgradeTier;
            const nextDef = !isMaxTier ? getZoneUpgradeDef(zoneId, nextTier) : null;

            // Dock Master Allocation Telemetry for this zone
            const zoneAlloc = dockMasterAssignments.zoneAssignments[zoneId] || {
              pinned: 0,
              autoAssigned: 0,
              maxSlots: getZoneMaxStationSlots(zoneId, tier),
              totalAssigned: 0,
              isProtectedLowStock: false,
              isPausedRestocking: false,
              score: -1,
            };
            const totalZoneAnglers = zoneAlloc.pinned + zoneAlloc.autoAssigned;

            const isPond = zoneId === 'zone_pond';
            const curPondVol = isPond ? pondVolume : undefined;

            // Meteorological & Hydrological Calculations
            const climate = calculateClimateSensitivity(zoneId, tempC);
            const volInfo = calculateVolumeMultiplier(zoneId, curPondVol);
            const spawnInfo = calculateActiveSpawnInterval(zoneId, tempC, curPondVol, tier);

            // Effective worker catch interval scaled by stationed anglers
            const baseCatchIntervalMs = calculateActiveCatchIntervalMs({
              zoneId,
              rodSpeedMultiplier: currentRod.speedMultiplier,
              hasSlicker,
              overclockMultiplier: 1.0,
              waterVolume: curPondVol,
              tier,
            });
            const effectiveCatchIntervalMs = totalZoneAnglers > 0
              ? Math.max(800, Math.round(baseCatchIntervalMs / totalZoneAnglers))
              : baseCatchIntervalMs;

            // UI State Machine Determination
            const isPausedUntilFull = isZoneFishingPaused(eco.currentStock, eco.maxStock, eco.isDepleted);
            let zoneStatus: 'LOCKED' | 'FROZEN' | 'DEPLETED' | 'RECHARGING' | 'ACTIVE' = 'ACTIVE';
            if (!isUnlocked) {
              zoneStatus = 'LOCKED';
            } else if (climate.isFrozen) {
              zoneStatus = 'FROZEN';
            } else if (isPausedUntilFull) {
              zoneStatus = eco.currentStock <= 0 ? 'DEPLETED' : 'RECHARGING';
            } else {
              zoneStatus = 'ACTIVE';
            }

            // Catch Progress for Workers
            let catchProgress = 0;
            let catchCountdownSec = 0;
            if (isUnlocked && lastCatch > 0) {
              const elapsed = now - lastCatch;
              catchProgress = Math.min(1, elapsed / effectiveCatchIntervalMs);
              catchCountdownSec = Math.max(0, Math.ceil((effectiveCatchIntervalMs - elapsed) / 1000));
            }

            // Recharge countdowns
            const singleFishSec = spawnInfo.activeSpawnTickSec;
            const singleRemainingSec = singleFishSec < Infinity
              ? Math.max(0, Math.ceil(singleFishSec - eco.spawnProgressSec))
              : 0;
            const missingFish = Math.max(0, eco.maxStock - eco.currentStock);
            const totalRemainingSec = singleFishSec < Infinity && missingFish > 0
              ? Math.max(0, Math.ceil((missingFish - 1) * singleFishSec + singleRemainingSec))
              : 0;

            const stockPct = Math.round((eco.currentStock / eco.maxStock) * 100);
            const isCasting = castingZoneId === zoneId;

            return (
              <div
                key={zoneId}
                className={`rounded-xl border-2 p-3.5 transition-all shadow-sm ${
                  !isUnlocked
                    ? 'bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-gray-800 opacity-80'
                    : zoneStatus === 'DEPLETED'
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/70'
                    : zoneStatus === 'RECHARGING'
                    ? 'bg-amber-50/30 dark:bg-amber-950/15 border-amber-300 dark:border-amber-900/60'
                    : zoneStatus === 'FROZEN'
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-900/70'
                    : 'bg-white dark:bg-gray-900 border-sky-200 dark:border-sky-800/80'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1 bg-sky-50 dark:bg-sky-950/60 rounded-lg border border-sky-200 dark:border-sky-800">
                      {zone.emoji}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-sm text-stone-800 dark:text-gray-100 flex items-center gap-1.5">
                          <span>{zone.name}</span>
                          <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-300 dark:border-indigo-800 px-1.5 py-0.5 rounded">
                            [Tier {tier}/5]
                          </span>
                        </h5>
                        {isUnlocked && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            zoneStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-400'
                              : zoneStatus === 'RECHARGING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-400 animate-pulse'
                              : zoneStatus === 'DEPLETED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-500 animate-pulse'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-400 animate-pulse'
                          }`}>
                            {zoneStatus === 'ACTIVE' && 'ACTIVE'}
                            {zoneStatus === 'RECHARGING' && `RESTOCKING (${eco.currentStock}/${eco.maxStock})`}
                            {zoneStatus === 'DEPLETED' && 'EXHAUSTED / DEPLETED'}
                            {zoneStatus === 'FROZEN' && 'SURFACE FROZEN'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentDef.name}</span>
                        <span>•</span>
                        <span className="capitalize font-semibold text-stone-600 dark:text-gray-300">{cfg.habitatClassification}</span>
                        <span>•</span>
                        <span>Tier Mult: <strong>{cfg.tierMultiplier.toFixed(1)}x</strong> (R: {cfg.replenishRatio.toFixed(1)}x)</span>
                        <span>•</span>
                        <span>{zone.species.length} species</span>
                      </p>
                    </div>
                  </div>

                  {isUnlocked && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {/* Station Capacity Pill */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700 flex items-center gap-1 shadow-2xs">
                        <span>⚓</span>
                        <span>{totalZoneAnglers}/{zoneAlloc.maxSlots} Stations</span>
                        <span className="text-stone-400 dark:text-gray-400 font-normal">
                          (📌{zoneAlloc.pinned}, 🤖{zoneAlloc.autoAssigned})
                        </span>
                      </span>

                      {/* Tactical Pin / Unpin Button Pair */}
                      <div className="inline-flex items-center rounded-lg border border-indigo-300 dark:border-indigo-700 overflow-hidden shadow-2xs">
                        <button
                          onClick={() => pinWorkerToZone(zoneId)}
                          disabled={availableFreeWorkers <= 0 || zoneAlloc.pinned >= zoneAlloc.maxSlots}
                          title={
                            zoneAlloc.pinned >= zoneAlloc.maxSlots
                              ? 'Station capacity limit reached for this tier'
                              : availableFreeWorkers <= 0
                              ? 'No unpinned free-roaming anglers available in pool'
                              : 'Pin 1 angler permanently to this zone (fishes past 20% down to 0)'
                          }
                          className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-r border-indigo-200 dark:border-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>📌</span>
                          <span>Pin</span>
                        </button>
                        <button
                          onClick={() => unpinWorkerFromZone(zoneId)}
                          disabled={zoneAlloc.pinned <= 0}
                          title={zoneAlloc.pinned <= 0 ? 'No pinned anglers on this zone' : 'Release 1 pinned angler back to Dock Master auto-pool'}
                          className="px-2 py-0.5 text-[10px] font-bold bg-stone-50 hover:bg-stone-100 dark:bg-stone-900/70 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>✕</span>
                          <span>Unpin</span>
                        </button>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${climate.colorClass}`}>
                        {climate.statusBadge}
                      </span>
                      <OverclockActionMenu
                        entityId={`fishery_${zoneId}`}
                        entityType="fishery"
                        name={zone.name}
                        compact={true}
                      />
                      {isMaxTier ? (
                        <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-400 flex items-center gap-1 shadow-xs">
                          <span>★</span>
                          <span>MAX TIER REACHED</span>
                        </span>
                      ) : nextDef ? (
                        <div className="relative group">
                          <button
                            onClick={() => upgradeWaterZoneTier(zoneId)}
                            disabled={coins < nextDef.costCoins}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 text-white shadow-xs transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                          >
                            <span>⬆️</span>
                            <span>Upgrade to Tier {nextTier} ({nextDef.costCoins.toLocaleString()} 🪙)</span>
                          </button>
                          <div className="absolute right-0 top-full mt-1.5 z-30 hidden group-hover:block w-64 p-2.5 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none text-left">
                            <div className="font-bold text-amber-300 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between text-[11px]">
                              <span>Tier {nextTier}: {nextDef.name}</span>
                              <span className="text-emerald-400">{nextDef.costCoins.toLocaleString()} 🪙</span>
                            </div>
                            <p className="text-[10px] text-slate-300 mb-2 leading-tight">{nextDef.description}</p>
                            <div className="space-y-1 text-[10px]">
                              <div className="flex items-center justify-between text-emerald-400 font-semibold">
                                <span>Capacity:</span>
                                <span>+{nextDef.stockCap - currentDef.stockCap} Fish ({currentDef.stockCap} → {nextDef.stockCap})</span>
                              </div>
                              <div className="flex items-center justify-between text-sky-400 font-semibold">
                                <span>Catch Speed:</span>
                                <span>-{(currentDef.catchIntervalSec - nextDef.catchIntervalSec).toFixed(1)}s ({currentDef.catchIntervalSec.toFixed(1)}s → {nextDef.catchIntervalSec.toFixed(1)}s)</span>
                              </div>
                              <div className="flex items-center justify-between text-purple-400 font-semibold">
                                <span>Spawn Speed:</span>
                                <span>+25% faster ({currentDef.spawnTickSec.toFixed(1)}s → {nextDef.spawnTickSec.toFixed(1)}s)</span>
                              </div>
                              {nextDef.towerLitersCost && (
                                <div className="flex items-center justify-between text-blue-300 text-[9px] pt-1 border-t border-slate-800">
                                  <span>Gravity Tower:</span>
                                  <span>-{nextDef.towerLitersCost}L on upgrade</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {isUnlocked ? (
                  <div className="space-y-2.5">
                    {/* Population Stock Progress & Capacity */}
                    <div className="bg-stone-50/80 dark:bg-stone-900/50 rounded-lg p-2.5 border border-stone-200/80 dark:border-gray-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-700 dark:text-gray-300 flex items-center gap-1">
                          <span>🐟</span> Population Stock
                        </span>
                        <span className="font-bold text-stone-800 dark:text-gray-200">
                          {eco.currentStock} / {eco.maxStock} Fish
                          <span className="text-[10px] text-stone-400 dark:text-gray-500 ml-1">({stockPct}%)</span>
                        </span>
                      </div>

                      {/* Stock Bar */}
                      <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            stockPct > 50
                              ? 'bg-emerald-500'
                              : stockPct > 20
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${stockPct}%` }}
                        />
                      </div>

                      {/* Spawning Telemetry */}
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        {climate.isFrozen ? (
                          <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
                            <span>🧊</span> Reproduction paused — Surface iced over (&lt;2°C)
                          </span>
                        ) : eco.currentStock < eco.maxStock ? (
                          <>
                            <span className="text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1">
                              <span>⏱️</span> +1 fish in <strong>{singleRemainingSec}s</strong>
                              <span className="text-[10px] text-stone-400">({singleFishSec.toFixed(1)}s/tick)</span>
                            </span>
                            <span className="text-stone-500 dark:text-gray-400 font-semibold">
                              Full in {formatTimeSec(totalRemainingSec)}
                            </span>
                          </>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span>✓</span> Population at Maximum Ecological Capacity ({eco.maxStock} Fish)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Farmstead Pond Hydrological Coupling & Elevated Tower Integration */}
                    {isPond && (
                      <div className="bg-sky-50/70 dark:bg-sky-950/40 rounded-lg p-2.5 border border-sky-200/80 dark:border-sky-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                            <span>💧</span> Water Depth Reservoir
                          </span>
                          <span className="font-bold text-sky-800 dark:text-sky-300">
                            {Math.round(curPondVol ?? 3000)} / {POND_HYDROLOGY.MAX_CAPACITY_LITERS} L
                            <span className="text-[10px] text-sky-600 dark:text-sky-400 ml-1">
                              ({Math.round(((curPondVol ?? 3000) / POND_HYDROLOGY.MAX_CAPACITY_LITERS) * 100)}%)
                            </span>
                          </span>
                        </div>

                        {/* Water Level Bar */}
                        <div className="w-full h-2 bg-sky-200 dark:bg-sky-900/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              volInfo.isLowDepth ? 'bg-amber-500' : 'bg-sky-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, ((curPondVol ?? 3000) / POND_HYDROLOGY.MAX_CAPACITY_LITERS) * 100))}%`,
                            }}
                          />
                        </div>

                        {/* Evaporation telemetry */}
                        <div className="flex items-center justify-between text-[11px] text-sky-700 dark:text-sky-300">
                          <span className="flex items-center gap-1">
                            <span>☀️</span> Evaporative Loss: <strong>-{pondEvapRate.toFixed(1)} L/min</strong>
                          </span>
                          <span className="text-[10px] text-sky-600/80 dark:text-sky-400/80">
                            Tower Reserve: <strong>{Math.round(towerLiters)}L</strong>
                          </span>
                        </div>

                        {/* Low Depth Amber Warning Alert */}
                        {volInfo.isLowDepth && (
                          <div className="bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 rounded-md p-1.5 text-xs text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>LOW DEPTH: Fish crowded and sluggish! Catch time doubled (10s) & spawn speed halved (0.5x).</span>
                          </div>
                        )}

                        {/* Refill Pond from Elevated Gravity Tower Button */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[10px] text-sky-800 dark:text-sky-300">
                            <strong>Oxygenated Shock:</strong> Top-off grants instant <strong>+5 Fish</strong> recovery bonus!
                          </div>
                          <button
                            onClick={refillPondFromTower}
                            disabled={towerLiters < POND_HYDROLOGY.REFILL_DEDUCTION_LITERS || (curPondVol ?? 3000) >= POND_HYDROLOGY.MAX_CAPACITY_LITERS}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white shadow-sm transition-all whitespace-nowrap flex items-center gap-1"
                          >
                            <span>⛲</span>
                            <span>Refill Pond (+100L)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Fishing Operations: Worker Progress & Manual Cast Line */}
                    <div className="pt-1 space-y-2">
                      {/* Sustainable Low-Stock Evacuation Badge */}
                      {zoneAlloc.isProtectedLowStock && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg p-2 text-xs text-emerald-900 dark:text-emerald-200 font-medium flex items-center gap-2">
                          <span>🌿</span>
                          <span>
                            <strong>Sustainable Low-Stock Evacuation:</strong> Auto-anglers evacuated (Stock &le; 20% cap) to protect breeding pool from hitting 0 and triggering restock pause. Rotated to healthier waters.
                          </span>
                        </div>
                      )}

                      {/* Waiting for Spawn Badge for Pinned Workers */}
                      {eco.currentStock <= 0 && zoneAlloc.pinned > 0 && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800 rounded-lg p-2 text-xs text-indigo-900 dark:text-indigo-200 font-medium flex items-center gap-2">
                          <span>📌</span>
                          <span>
                            <strong>Waiting for Spawn:</strong> {zoneAlloc.pinned} pinned angler(s) on watch. Catching will resume immediately upon the first +1 fish tick.
                          </span>
                        </div>
                      )}

                      {climate.isFrozen ? (
                        <div className="bg-blue-100/70 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-800 rounded-lg p-2 text-xs text-blue-900 dark:text-blue-200 font-semibold flex items-center gap-2">
                          <span>🧊</span>
                          <span>Surface bed is frozen solid. Fishing lines cannot penetrate ice layer until ambient temperature rises (&ge;2°C).</span>
                        </div>
                      ) : isPausedUntilFull ? (
                        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg p-2.5 flex items-center justify-between gap-2">
                          <div className="text-xs text-amber-900 dark:text-amber-200">
                            <span className="font-bold">
                              {eco.currentStock <= 0 ? '⚠️ EXHAUSTED (PAUSED):' : '⏳ RESTOCKING (PAUSED):'}
                            </span>{' '}
                            {eco.currentStock <= 0
                              ? `Fish population depleted! Natural recharge in progress (+1 in ${singleRemainingSec}s). Fishing paused until 100% full.`
                              : `Resting until 100% full capacity (${eco.currentStock}/${eco.maxStock} fish). Full in ${Math.floor(totalRemainingSec / 60)}m ${totalRemainingSec % 60}s. Fishing resumes only after full.`}
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-md border whitespace-nowrap ${
                            eco.currentStock <= 0
                              ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 border-rose-400'
                              : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-400'
                          }`}>
                            {eco.currentStock <= 0 ? 'Depleted (Paused)' : `Restocking (${eco.currentStock}/${eco.maxStock})`}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Worker Catch Bar (if fisherman active) */}
                          {totalZoneAnglers > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-gray-300 font-medium">
                                <span className="flex items-center gap-1">
                                  <span>🎣</span> Worker Catch Progress ({totalZoneAnglers} Angler{totalZoneAnglers > 1 ? 's' : ''}: 📌{zoneAlloc.pinned}, 🤖{zoneAlloc.autoAssigned})
                                </span>
                                <span>Next catch in <strong>{catchCountdownSec}s</strong></span>
                              </div>
                              <div className="w-full h-2 bg-sky-100 dark:bg-sky-950 rounded-full overflow-hidden border border-sky-200 dark:border-sky-900">
                                <div
                                  className="h-full bg-sky-500 rounded-full transition-all duration-200"
                                  style={{ width: `${catchProgress * 100}%` }}
                                />
                              </div>
                            </div>
                          ) : totalFishermenActive > 0 ? (
                            <div className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-gray-800 rounded-lg p-2 text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between">
                              <span>⚓ No anglers stationed here (Auto-anglers routed elsewhere or resting in Bunkhouse)</span>
                              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">0/{zoneAlloc.maxSlots} Stations</span>
                            </div>
                          ) : (
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-2 text-xs text-amber-700 dark:text-amber-300">
                              ℹ️ Automated lines idle. Hire a fisherman above for passive harvest.
                            </div>
                          )}

                          {/* Manual "Cast Line" Action Button */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-200/60 dark:border-gray-800">
                            <span className="text-[11px] text-stone-500 dark:text-gray-400">
                              Manual Harvest (-1 Fish Stock)
                            </span>
                            <button
                              onClick={() => handleManualCast(zoneId)}
                              disabled={isCasting || eco.currentStock <= 0 || isPausedUntilFull}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg text-white shadow-sm transition-all flex items-center gap-1.5 ${
                                isCasting
                                  ? 'bg-amber-500 scale-95'
                                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-gray-300 dark:disabled:bg-gray-700'
                              }`}
                            >
                              <span>{isCasting ? '🌊' : '🎣'}</span>
                              <span>{isCasting ? 'Hooking Fish...' : 'Cast Line'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Locked Zone State */
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-gray-800">
                    <div className="text-xs text-stone-500 dark:text-gray-400">
                      {level < zone.unlockLevel
                        ? `Requires Farm Lv.${zone.unlockLevel} to unlock`
                        : 'Ready for exploration and unlock!'}
                    </div>
                    {level >= zone.unlockLevel && (
                      <button
                        onClick={() => unlockFisheryZone(zoneId)}
                        disabled={
                          (zone.unlockCostCoins ? coins < zone.unlockCostCoins : false) ||
                          (zone.unlockCostGems ? gems < zone.unlockCostGems : false)
                        }
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors shadow-sm"
                      >
                        Unlock 💰{zone.unlockCostCoins || 0}{zone.unlockCostGems ? ` 💎${zone.unlockCostGems}` : ''}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Aquatic Codex */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-stone-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>📖</span> Aquatic Codex (Species Log)
        </h4>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 p-3">
            {(Object.values(FISH_SPECIES)).map(sp => {
              const codexKey = `fish_${sp.id}`;
              const discovered = fishery.fishCodex[codexKey];
              const owned = barn[sp.id] || 0;

              return (
                <div
                  key={sp.id}
                  className="rounded-lg border-2 p-1.5 text-center transition-all shadow-xs"
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
                        <div className="text-[8px] text-stone-400 dark:text-gray-500 font-semibold">x{owned}</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-lg mb-0.5 opacity-20 grayscale">❓</div>
                      <div className="text-[9px] text-stone-400 dark:text-gray-500 font-medium">
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
