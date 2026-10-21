'use client';

import { useGameStore } from '@/game/store';
import { CROPS, PRODUCTS, type CropId } from '@/game/data';
import { useState } from 'react';
import { OverclockActionMenu } from './OverclockActionMenu';
import { PlotUpgradeModal } from './PlotUpgradeModal';
import { getSoilTier, getPlotUnlockCost } from '@/game/plotUpgrades';
import { TOTAL_PASTURE_CAPACITY } from '@/types/animals';
import { getMoistureZone } from '@/game/hydrologyEngine';
import {
  CROP_NUTRIENT_PROFILES,
  isBatteryChargedForCrop,
  isSoilBatteryFull,
  type PlotSoilBattery,
} from '@/game/soilEnergyEngine';
import { playSoilEnergyChime, playTiredSoilAlert } from '@/lib/soundEffects';

const CROP_LIST = Object.values(CROPS);

interface FarmGridProps {
  onSelectTab?: (tab: 'animals' | 'market' | 'water') => void;
}

export function FarmGrid({ onSelectTab }: FarmGridProps) {
  const {
    plots,
    unlockedPlots,
    plantCrop,
    harvestPlot,
    plantAllCrops,
    harvestAllPlots,
    applyCompostToProps,
    applyCompostToAllPlots,
    waterPlot,
    waterLevel,
    maxWaterLevel,
    pumpWell,
    waterAllPlots,
    silo,
    barn = {},
    coins,
    systemicEvent,
    extinguishBrushfire,
    captureLocust,
    relics,
    activeCrisis,
    resolveCrisisDefense,
    entityOverclocks,
    cureEntityExhaustion,
    unlockNextPlot,
    hydrology,
    setSluiceModalOpen,
    toggleEmergencySpillway,
    clearWitheredCrop,
    animals = [],
    livestockReserve = [],
  } = useGameStore();
  const [selectedCrop, setSelectedCrop] = useState<CropId>('wheat');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlotForUpgrade, setSelectedPlotForUpgrade] = useState<number | null>(null);
  const [hoveredPlotId, setHoveredPlotId] = useState<number | null>(null);

  const visiblePlots = plots.slice(0, unlockedPlots);

  // Livestock summary stats
  const chickensCount = animals.filter(a => a.species === 'chicken').length;
  const cowsCount = animals.filter(a => a.species === 'cow').length;
  const sheepCount = animals.filter(a => a.species === 'sheep').length;
  const pigsCount = animals.filter(a => a.species === 'pig').length;
  const readyCollectCount = animals.filter(a => a.productReady).length;
  const hungryCount = animals.filter(a => !a.fed && !a.productReady && a.age !== 'elder').length;
  const totalFarmAnimals = animals.length + livestockReserve.length;

  // Count ready, empty, and unwatered plots for batch actions
  const readyCount = visiblePlots.filter(p => p.crop && p.ready).length;
  const emptyCount = visiblePlots.filter(p => !p.crop).length;
  const unwateredCount = visiblePlots.filter(p => !p.isWatered).length;
  const tiredPlotsCount = visiblePlots.filter(p => !isSoilBatteryFull(p.soilBattery)).length;
  const effectiveMaxWater = maxWaterLevel || 10;
  const isWellFull = waterLevel >= effectiveMaxWater;
  const canWaterAll = waterLevel > 0 && unwateredCount > 0;
  const waterableCount = Math.min(waterLevel, unwateredCount);
  const selectedCropDef = CROPS[selectedCrop];
  const totalPlantCost = emptyCount * selectedCropDef.seedCost;
  const canAffordPlantAll = selectedCropDef.seedCost === 0 || coins >= totalPlantCost;

  return (
    <div className="space-y-3.5">
      {/* Flash Flood Crisis Warning Banner */}
      {hydrology?.isFlashFloodActive && (
        <div className="bg-gradient-to-r from-rose-950/95 via-red-950/90 to-amber-950/95 border-2 border-rose-500 rounded-2xl p-3 sm:p-4 text-white shadow-xl shadow-rose-950/80 animate-pulse flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl animate-bounce">🌊</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs sm:text-sm tracking-wide uppercase text-rose-200">
                  Flash Flood Crisis Active!
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-rose-950 border border-rose-400 text-rose-300">
                  ⏱️ {Math.ceil(hydrology.floodHazardRemainingSec || 180)}s to Root Rot
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-rose-200/80 mt-0.5 leading-snug">
                Torrents breaching canal network! Open the Emergency Spillway to divert 120 L/sec runoff off-map and deposit rich Alluvial Silt.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggleEmergencySpillway()}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-lg border-2 cursor-pointer active:scale-95 transition-all ${
              hydrology.isSpillwayOpen
                ? 'bg-teal-600 hover:bg-teal-500 text-white border-teal-300'
                : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-300 animate-bounce'
            }`}
          >
            {hydrology.isSpillwayOpen ? '🛑 Close Spillway (Draining)' : '🚨 Open Emergency Spillway'}
          </button>
        </div>
      )}


      {/* Farm Livestock & Animals Overview Widget */}
      <div className="bg-gradient-to-r from-amber-50/90 via-stone-50 to-orange-50/80 dark:from-stone-900/90 dark:via-stone-850 dark:to-stone-900/90 rounded-2xl p-3 border border-amber-200/90 dark:border-amber-900/50 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-400/20 border border-amber-300 dark:border-amber-700/80 flex items-center justify-center text-xl shrink-0 shadow-2xs">
            🐾
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                Farm Animals
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
                {animals.length}/{TOTAL_PASTURE_CAPACITY} Pastures
              </span>
              {livestockReserve.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 shadow-2xs">
                  📦 {livestockReserve.length} Reserve
                </span>
              )}
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                ({totalFarmAnimals} total on farm)
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium bg-white/80 dark:bg-stone-800/80 px-1.5 py-0.5 rounded border border-stone-200/60 dark:border-stone-700/60">
                🐔 <span className="font-bold">{chickensCount}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-medium bg-white/80 dark:bg-stone-800/80 px-1.5 py-0.5 rounded border border-stone-200/60 dark:border-stone-700/60">
                🐄 <span className="font-bold">{cowsCount}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-medium bg-white/80 dark:bg-stone-800/80 px-1.5 py-0.5 rounded border border-stone-200/60 dark:border-stone-700/60">
                🐑 <span className="font-bold">{sheepCount}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-medium bg-white/80 dark:bg-stone-800/80 px-1.5 py-0.5 rounded border border-stone-200/60 dark:border-stone-700/60">
                🐷 <span className="font-bold">{pigsCount}</span>
              </span>

              {readyCollectCount > 0 && (
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 animate-pulse text-[11px]">
                  🧺 {readyCollectCount} ready!
                </span>
              )}
              {hungryCount > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 bg-sky-100/80 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-300 dark:border-sky-800 text-[11px]">
                  🫗 {hungryCount} hungry
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
          <button
            onClick={() => onSelectTab?.('animals')}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🐔 Pastures</span>
            <span>➔</span>
          </button>
          <button
            onClick={() => onSelectTab?.('market')}
            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 active:scale-95 text-stone-700 dark:text-stone-300 font-semibold text-xs border border-stone-200 dark:border-stone-700 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>🐄 Livestock</span>
          </button>
        </div>
      </div>

      {/* Crop Selector Toolbar & Soil Battery Agronomy Legend */}
      <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-2.5 border border-amber-200 dark:border-amber-800 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <span>🌱</span>
            <span>Select Crop & Tap Plot to Plant</span>
          </div>

          {/* Intuitive 3-Color Agronomy Soil Battery Legend (Zero academic jargon) */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold flex-wrap">
            <span className="text-stone-700 dark:text-stone-300">⚡ Soil Fuel:</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <span>🟢</span>
              <span>Leaf/Stem</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-400 text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <span>🟡</span>
              <span>Root</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 border border-rose-400 text-rose-800 dark:text-rose-300 flex items-center gap-1">
              <span>🔴</span>
              <span>Fruit/Flower</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 border border-teal-400 text-teal-800 dark:text-teal-300 flex items-center gap-1">
              <span>🫛</span>
              <span>Restorative (Refills 🟢)</span>
            </span>
          </div>
        </div>

        {/* Seed Packets with Upper-Corner Colored Nutrient Fuel Dots */}
        <div className="flex gap-2 flex-wrap">
          {CROP_LIST.map(crop => {
            const profile = CROP_NUTRIENT_PROFILES[crop.id];
            const isSelected = selectedCrop === crop.id;
            return (
              <button
                key={crop.id}
                type="button"
                onClick={() => setSelectedCrop(crop.id)}
                className={`relative px-3 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer select-none ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105 ring-2 ring-amber-400/50'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                }`}
                title={`${crop.name} — Requires ${profile?.fuelLabel || 'Soil Energy'}`}
              >
                {/* Seed Menu Upper-Corner Nutrient Color Dot */}
                {profile && (
                  <span
                    className="absolute -top-1.5 -right-1.5 text-xs bg-stone-900/90 rounded-full w-4 h-4 flex items-center justify-center border border-white/40 shadow-sm"
                    title={profile.fuelLabel}
                  >
                    {profile.badgeDot}
                  </span>
                )}
                <span>{crop.emoji}</span> {crop.name}
                {crop.seedCost > 0 && (
                  <span className="text-[11px] opacity-75 ml-1.5 font-mono">
                    💰{crop.seedCost}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Systemic Simulation Modifiers */}
      {(Boolean(relics.mineralAshUntil && relics.mineralAshUntil > Date.now()) || (systemicEvent?.id === 'alchemical_bloom' && systemicEvent?.phase === 'active')) && (
        <div className="flex gap-2 flex-wrap">
          {Boolean(relics.mineralAshUntil && relics.mineralAshUntil > Date.now()) && (
            <div className="flex-1 py-1 px-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span className="text-base">🌋</span>
              <span>Mineral-Rich Ash Soil: 3× Crop Growth Speed Active</span>
            </div>
          )}
          {systemicEvent?.id === 'alchemical_bloom' && systemicEvent?.phase === 'active' && (
            <div className="flex-1 py-1 px-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span className="text-base">🍄</span>
              <span>Alchemical Spore Fog: 30s Growth Clamped + Spore Drops!</span>
            </div>
          )}
        </div>
      )}

      {/* Batch Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* Harvest All */}
        <button
          onClick={() => harvestAllPlots()}
          disabled={readyCount === 0}
          className={`px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 ${
            readyCount > 0
              ? 'bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-md shadow-green-200/50 active:scale-95'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed'
          }`}
        >
          <span className="text-base sm:text-lg">{'🌾'}</span>
          Harvest All
          {readyCount > 0 && (
            <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold">
              {readyCount}
            </span>
          )}
        </button>

        {/* Restore Soil (Compost Bailout) */}
        <button
          onClick={() => applyCompostToAllPlots()}
          disabled={tiredPlotsCount === 0}
          className={`px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 ${
            tiredPlotsCount > 0
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 animate-pulse cursor-pointer'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed'
          }`}
          title={tiredPlotsCount > 0 ? `Apply organic compost to all ${tiredPlotsCount} tired plots to refill battery to 100% full` : 'All plot batteries are at 100% energy!'}
        >
          <span className="text-base sm:text-lg">{'💩'}</span>
          <span>Restore Soil</span>
          {tiredPlotsCount > 0 && (
            <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold">
              {tiredPlotsCount} Tired
            </span>
          )}
        </button>

        {/* Plant All */}
        <button
          onClick={() => plantAllCrops(selectedCrop)}
          disabled={emptyCount === 0 || !canAffordPlantAll}
          className={`px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 ${
            emptyCount > 0 && canAffordPlantAll
              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200/50 active:scale-95'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed'
          }`}
        >
          <span className="text-base sm:text-lg">{'🌱'}</span>
          Plant All
          {emptyCount > 0 && (
            <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold">
              {emptyCount}
            </span>
          )}
          {totalPlantCost > 0 && (
            <span className="text-[10px] sm:text-xs opacity-80">{'💰'}{totalPlantCost}</span>
          )}
        </button>

        {/* Water All */}
        <button
          onClick={() => {
            if (waterLevel <= 0) {
              useGameStore.getState().addNotification('Well is dry (0 💧)! Tap Pump Well to draw water.', '💧', 'info');
              return;
            }
            if (unwateredCount === 0) {
              useGameStore.getState().addNotification('All plots are already hydrated! 💧', '💧', 'info');
              return;
            }
            waterAllPlots();
          }}
          className={`px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 active:scale-95 ${
            canWaterAll
              ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-200/50'
              : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40'
          }`}
        >
          <span className="text-base sm:text-lg">{'💧'}</span>
          Water All
          {canWaterAll ? (
            <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold">
              {waterableCount}
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs opacity-80">
              ({unwateredCount === 0 ? 'Full' : '0💧'})
            </span>
          )}
        </button>

        {/* Pump Well */}
        <button
          onClick={() => {
            if (isWellFull) {
              useGameStore.getState().addNotification(`Well is already full (${waterLevel}/${effectiveMaxWater} 💧)! Water crops to use water.`, '⛲', 'info');
              return;
            }
            pumpWell();
          }}
          className={`px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 active:scale-95 ${
            !isWellFull
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-md shadow-blue-200/50'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40'
          }`}
        >
          <span className="text-base sm:text-lg">{'⛲'}</span>
          Pump Well
          <span className="bg-black/15 dark:bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold">
            {waterLevel}/{effectiveMaxWater}💧
          </span>
        </button>

        {/* Upgrade Plots with Coins */}
        <button
          onClick={() => {
            setSelectedPlotForUpgrade(null);
            setIsUpgradeModalOpen(true);
          }}
          className="col-span-2 sm:col-span-4 lg:col-span-1 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 active:scale-95 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <span className="text-base sm:text-lg">{'🌱'}</span>
          <span>Upgrade Soil</span>
          <span className="bg-black/25 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold text-amber-200">
            🪙 L1–5
          </span>
        </button>

        {/* Gravity Sluice Console Button */}
        <button
          onClick={() => {
            if (onSelectTab) onSelectTab('water');
            else setSluiceModalOpen(true);
          }}
          className="col-span-2 sm:col-span-4 lg:col-span-1 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 active:scale-95 bg-gradient-to-r from-cyan-800 via-sky-800 to-blue-900 hover:from-cyan-700 hover:to-sky-700 text-white border-cyan-500 shadow-md shadow-cyan-950/40 cursor-pointer"
          title="Open Estate Hydrological Sluice & Canal Console"
        >
          <span className="text-base sm:text-lg">{'🌊'}</span>
          <span>Sluice</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold border ${
            hydrology?.sluiceGatesOpen
              ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 animate-pulse'
              : 'bg-black/25 text-stone-300 border-stone-600'
          }`}>
            {hydrology?.sluiceGatesOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </button>
      </div>

      {/* Farm Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 sm:gap-2.5">
        {visiblePlots.map(plot => {
          const isReady = plot.ready;
          const isGrowing = plot.crop && !plot.ready;
          const isEmpty = !plot.crop;
          const isWatered = Boolean(plot.isWatered);
          const isWithered = Boolean(plot.isWithered);
          const hasRootRot = Boolean(plot.hasRootRot);

          const moisturePct = plot.moistureLevel !== undefined ? plot.moistureLevel : (isWatered ? 70 : 35);
          const moistureZone = getMoistureZone(moisturePct);

          const hasBlight = activeCrisis?.type === 'crop_blight' &&
            activeCrisis?.resolvedStatus === 'pending' &&
            (activeCrisis?.targetIds.includes(plot.id) || activeCrisis?.targetIds.includes(String(plot.id)));

          const isOnFire = systemicEvent?.id === 'barn_fire' &&
            systemicEvent?.phase === 'active' &&
            systemicEvent?.activeFirePositions?.includes(plot.id);

          const hasLocust = systemicEvent?.id === 'locust_swarm' &&
            systemicEvent?.phase === 'active' &&
            systemicEvent?.locustPlotIds?.includes(plot.id);

          const plotOverclock = entityOverclocks?.[`plot_${plot.id}`];
          const isPlotExhausted = Boolean(plotOverclock?.isExhausted && plotOverclock.exhaustedUntil && Date.now() < plotOverclock.exhaustedUntil);
          const exhaustionRemainingSec = isPlotExhausted && plotOverclock?.exhaustedUntil
            ? Math.max(0, Math.ceil((plotOverclock.exhaustedUntil - Date.now()) / 1000))
            : 0;

          const plotLevel = plot.level || 1;
          const soilTier = getSoilTier(plotLevel);
          const soilSpeedMult = 1 + (soilTier.speedBonusPct / 100);
          const waterMult = (isWatered || soilTier.autoHydrate) ? 2.0 : 1.0;
          const moistureSpeedMult = isWithered ? 0 : moistureZone.growthSpeedMultiplier;
          const siltSpeedMult = (plot.alluvialSiltCyclesRemaining && plot.alluvialSiltCyclesRemaining > 0) ? 1.20 : 1.0;

          // Soil Battery Energy State
          const battery: PlotSoilBattery = plot.soilBattery || { green: true, yellow: true, red: true };
          const isBatteryFull = isSoilBatteryFull(battery);
          const isDepleted = !isBatteryFull;
          const isHovered = hoveredPlotId === plot.id;
          const selectedProfile = CROP_NUTRIENT_PROFILES[selectedCrop];
          const isChargedForSelected = isBatteryChargedForCrop(battery, selectedCrop);

          const progress = plot.crop && plot.plantedAt && !plot.ready
            ? Math.min(1, ((Date.now() - plot.plantedAt) * soilSpeedMult * waterMult * moistureSpeedMult * siltSpeedMult) / (CROPS[plot.crop].growTimeSec * 1000))
            : 0;

          // Soil styling classes with hydrological dynamics & soil battery energy
          let soilClasses = '';
          if (hasBlight) {
            soilClasses = 'bg-purple-950/70 border-purple-500 animate-pulse ring-2 ring-purple-400 shadow-lg shadow-purple-500/40 cursor-pointer text-white';
          } else if (isOnFire) {
            soilClasses = 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 animate-pulse ring-2 ring-rose-400 shadow-lg shadow-rose-500/30 cursor-pointer';
          } else if (hasLocust) {
            soilClasses = 'bg-amber-100 dark:bg-amber-950/60 border-amber-600 animate-bounce ring-2 ring-amber-500 shadow-md cursor-pointer';
          } else if (isPlotExhausted) {
            // Burnout / exhausted soil
            soilClasses = 'bg-stone-900 border-rose-600/80 ring-2 ring-rose-500/40 shadow-rose-950/50 shadow-md cursor-pointer text-rose-200';
          } else if (isWithered) {
            // Withered desiccated crop: dry cracked soil with rose warning border
            soilClasses = 'bg-stone-900 border-rose-600/90 ring-2 ring-rose-500/50 shadow-rose-950/60 shadow-md cursor-pointer text-rose-300';
          } else if (hasRootRot) {
            // Flooded / root rot soil: soggy blue-gray bed with warning glow
            soilClasses = 'bg-blue-950/80 border-blue-400 animate-pulse ring-2 ring-blue-400/50 shadow-blue-950/60 shadow-md cursor-pointer text-blue-200';
          } else if (isReady) {
            soilClasses = moistureZone.id === 'optimal'
              ? 'bg-[#3d2817] dark:bg-[#2b1c10] border-emerald-400 ring-2 ring-emerald-400/60 hover:scale-105 shadow-lg shadow-emerald-500/30 cursor-pointer text-white'
              : 'bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 hover:scale-105 shadow-green-200/50 shadow-lg cursor-pointer';
          } else if (moistureZone.id === 'optimal') {
            // Optimal capillary loam: Rich dark chocolate soil with emerald/cyan aeration ring
            soilClasses = isDepleted
              ? 'bg-gradient-to-br from-[#736d65] to-[#59554f] border-amber-500/70 ring-1 ring-amber-500/40 text-stone-200 cursor-pointer'
              : 'bg-[#3b2716] dark:bg-[#2c1d10] border-emerald-400/80 ring-2 ring-emerald-400/40 shadow-md shadow-emerald-950/40 text-stone-100 cursor-pointer';
          } else if (moistureZone.id === 'waterlogged' || moistureZone.id === 'saturated') {
            // Saturated soil
            soilClasses = 'bg-[#2b2724] dark:bg-[#1e1c1b] border-cyan-400/70 ring-1 ring-cyan-400/40 text-cyan-200 cursor-pointer';
          } else if (moistureZone.id === 'desiccated') {
            // Desiccated earth: dusty cracked pale soil
            soilClasses = 'bg-[#e8d5be] dark:bg-stone-900/80 border-rose-500/60 ring-1 ring-rose-400/40 text-rose-300 cursor-pointer';
          } else if (isGrowing) {
            // Growing soil (highlight tired soil with amber outline if planted depleted)
            soilClasses = plot.plantedInDepletedSoil
              ? 'bg-gradient-to-br from-[#7a756e] to-[#635f58] border-amber-500/70 ring-1 ring-amber-500/40 text-amber-200 cursor-pointer'
              : 'bg-[#eedbc5]/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 hover:border-cyan-400 cursor-pointer';
          } else {
            // Empty plot dirt appearance:
            // Full Energy: Plot surface renders as rich, dark, damp brown soil.
            // Depleted Energy: Plot surface visibly changes to pale, dry, cracked gray dirt with subtle withered patches.
            soilClasses = isBatteryFull
              ? 'bg-gradient-to-br from-[#2f1b0c] via-[#3d2410] to-[#201206] border-[#663b1a] text-amber-100 shadow-md hover:border-amber-400 cursor-pointer'
              : 'bg-gradient-to-br from-[#96918a] via-[#827d76] to-[#69645e] border-stone-400 text-stone-200 shadow-inner hover:border-amber-300 cursor-pointer';
          }

          const handlePlotClick = () => {
            if (isWithered) {
              clearWitheredCrop(plot.id);
            } else if (hasBlight) {
              resolveCrisisDefense('quarantine', plot.id);
            } else if (isOnFire) {
              extinguishBrushfire(plot.id);
            } else if (hasLocust) {
              captureLocust(plot.id);
            } else if (isPlotExhausted) {
              cureEntityExhaustion(`plot_${plot.id}`, 'plot');
            } else if (isReady) {
              harvestPlot(plot.id);
            } else if (isEmpty) {
              plantCrop(plot.id, selectedCrop);
            } else if (isGrowing && !isWatered) {
              // Tapping unwatered growing crop waters it to double speed!
              if (waterLevel > 0) {
                waterPlot(plot.id);
              }
            }
          };

          return (
            <div
              key={plot.id}
              role="button"
              tabIndex={0}
              onMouseEnter={() => {
                setHoveredPlotId(plot.id);
                if (!plot.crop) {
                  if (selectedProfile?.isRestorative || isChargedForSelected) {
                    playSoilEnergyChime();
                  } else {
                    playTiredSoilAlert();
                  }
                }
              }}
              onMouseLeave={() => {
                if (hoveredPlotId === plot.id) {
                  setHoveredPlotId(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePlotClick();
                }
              }}
              onClick={handlePlotClick}
              className={`relative aspect-square rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center overflow-hidden select-none ${soilClasses}`}
            >
              {/* Crisis Overlay 0: Crop Blight */}
              {hasBlight ? (
                <div className="flex flex-col items-center justify-center p-1">
                  <span className="text-2xl animate-bounce">☣️</span>
                  <span className="text-[9px] font-black uppercase text-purple-200 bg-purple-900/90 px-1.5 py-0.5 rounded mt-0.5 border border-purple-400">
                    Quarantine!
                  </span>
                </div>
              ) : isOnFire ? (
                /* Crisis Overlay 1: Brushfire */
                <div className="flex flex-col items-center justify-center p-1">
                  <span className="text-2xl animate-bounce">🔥</span>
                  <span className="text-[9px] font-black uppercase text-rose-700 dark:text-rose-300 bg-white/80 dark:bg-black/60 px-1 rounded mt-0.5">
                    Extinguish!
                  </span>
                </div>
              ) : hasLocust ? (
                /* Crisis Overlay 2: Locust Swarm */
                <div className="flex flex-col items-center justify-center p-1">
                  <span className="text-2xl animate-pulse">🦗</span>
                  <span className="text-[9px] font-black uppercase text-amber-800 dark:text-amber-200 bg-white/80 dark:bg-black/60 px-1 rounded mt-0.5">
                    Catch!
                  </span>
                </div>
              ) : isPlotExhausted ? (
                /* Burnout Overlay: Exhausted Soil */
                <div className="flex flex-col items-center justify-center p-1" onClick={(e) => e.stopPropagation()}>
                  <span className="text-2xl animate-pulse">🪨</span>
                  <span className="text-[9px] font-black uppercase text-rose-300 bg-rose-950/90 px-1.5 py-0.5 rounded mt-0.5 border border-rose-500/50">
                    Exhausted ({exhaustionRemainingSec}s)
                  </span>
                  <button
                    type="button"
                    disabled={coins < 20}
                    onClick={() => cureEntityExhaustion(`plot_${plot.id}`, 'plot')}
                    className={`mt-1 px-2 py-0.5 text-[9px] font-black rounded-md transition-all shadow-sm ${
                      coins >= 20
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 active:scale-95'
                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    🌱 Revitalize (20🪙)
                  </button>
                </div>
              ) : isWithered ? (
                /* Withered Crop Overlay: Desiccated for 30 minutes */
                <div className="flex flex-col items-center justify-center p-1" onClick={(e) => { e.stopPropagation(); clearWitheredCrop(plot.id); }}>
                  <span className="text-2xl animate-pulse">🥀</span>
                  <span className="text-[9px] font-black uppercase text-rose-300 bg-rose-950/95 px-1.5 py-0.5 rounded mt-0.5 border border-rose-500/60">
                    Withered!
                  </span>
                  <button
                    type="button"
                    onClick={() => clearWitheredCrop(plot.id)}
                    className="mt-1 px-1.5 py-0.5 text-[8px] font-black rounded bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-xs cursor-pointer active:scale-95"
                  >
                    Clear (Hoe)
                  </button>
                </div>
              ) : (
                <>
                  {/* Soil Moisture Zone Pill & Root Rot Indicator */}
                  <div className="absolute top-1 left-1 flex items-center gap-1 z-10 pointer-events-none">
                    <span className={`px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-mono font-black border backdrop-blur-md ${
                      moistureZone.id === 'optimal'
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400 shadow-xs'
                        : moistureZone.id === 'waterlogged'
                        ? 'bg-blue-950/90 text-blue-300 border-blue-400 animate-pulse'
                        : moistureZone.id === 'desiccated'
                        ? 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse'
                        : 'bg-stone-900/80 text-amber-300 border-stone-700'
                    }`} title={`${moistureZone.name}: ${Math.round(moisturePct)}% (${moistureZone.badgeText})`}>
                      💧{Math.round(moisturePct)}%
                    </span>
                    {hasRootRot && (
                      <span className="text-[9px] animate-pulse" title="Root Rot: Yield halved (-50%)!">🪱</span>
                    )}
                  </div>

                  {/* 3-Color Soil Battery Persistent Mini-Bar (Floating Plot Meter) */}
                  <div
                    className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-stone-950/85 backdrop-blur-xs border border-stone-700/80 shadow-md z-20 pointer-events-none select-none"
                    title={`Soil Battery: 🟢Leaf ${battery.green ? 'Full' : 'Depleted'} · 🟡Root ${battery.yellow ? 'Full' : 'Depleted'} · 🔴Fruit ${battery.red ? 'Full' : 'Depleted'}`}
                  >
                    {/* 🟢 Green Light (Leaf / Stem fuel) */}
                    <span
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 ${
                        battery.green
                          ? `bg-emerald-400 shadow-[0_0_6px_#34d399] ${
                              isHovered && selectedProfile?.fuelType === 'green'
                                ? 'ring-2 ring-white scale-125 animate-pulse'
                                : ''
                            }`
                          : `border-2 border-stone-500 bg-stone-900 ${
                              isHovered && selectedProfile?.fuelType === 'green'
                                ? 'border-amber-400 ring-2 ring-amber-400 animate-ping'
                                : ''
                            }`
                      }`}
                    />

                    {/* 🟡 Yellow Light (Root fuel) */}
                    <span
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 ${
                        battery.yellow
                          ? `bg-amber-400 shadow-[0_0_6px_#fbbf24] ${
                              isHovered && selectedProfile?.fuelType === 'yellow'
                                ? 'ring-2 ring-white scale-125 animate-pulse'
                                : ''
                            }`
                          : `border-2 border-stone-500 bg-stone-900 ${
                              isHovered && selectedProfile?.fuelType === 'yellow'
                                ? 'border-amber-400 ring-2 ring-amber-400 animate-ping'
                              : ''
                            }`
                      }`}
                    />

                    {/* 🔴 Red Light (Fruit / Flower fuel) */}
                    <span
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 ${
                        battery.red
                          ? `bg-rose-500 shadow-[0_0_6px_#f43f5e] ${
                              isHovered && selectedProfile?.fuelType === 'red'
                                ? 'ring-2 ring-white scale-125 animate-pulse'
                                : ''
                            }`
                          : `border-2 border-stone-500 bg-stone-900 ${
                              isHovered && selectedProfile?.fuelType === 'red'
                                ? 'border-amber-400 ring-2 ring-amber-400 animate-ping'
                                : ''
                            }`
                      }`}
                    />
                  </div>

                  {/* Hydration Sparkle Badge: ⚡ 2x Speed */}
                  {isWatered && (
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.2 rounded-md bg-cyan-600/90 text-white text-[8px] sm:text-[9px] font-black border border-cyan-300 shadow-sm animate-pulse z-10">
                      <span>⚡</span>
                      <span>2x Speed</span>
                    </div>
                  )}

                  {/* Water Prompt Indicator for unwatered growing crops */}
                  {isGrowing && !isWatered && waterLevel > 0 && (
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.2 rounded-md bg-blue-600/90 hover:bg-blue-500 text-white text-[8px] sm:text-[9px] font-bold border border-blue-300 shadow-sm animate-bounce z-10">
                      <span>💧</span>
                      <span>Water</span>
                    </div>
                  )}

                  {/* Overclock Action Menu for Growing Plots */}
                  {isGrowing && (
                    <div
                      className="absolute top-1 left-1 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <OverclockActionMenu
                        entityId={`plot_${plot.id}`}
                        entityType="plot"
                        name={`Plot #${plot.id + 1}`}
                        compact={true}
                      />
                    </div>
                  )}

                  {/* Progress bar for growing crops */}
                  {isGrowing && plot.crop && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${isWatered ? 'bg-cyan-950/60' : 'bg-amber-100 dark:bg-amber-900'}`}>
                      <div
                        className={`h-full rounded-r transition-all ${
                          isWatered
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]'
                            : 'bg-amber-400 dark:bg-amber-500'
                        }`}
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  )}

                  {isEmpty && (
                    <div className="flex flex-col items-center select-none">
                      <span className="text-2xl filter drop-shadow">
                        {isDepleted ? '🪨' : (isWatered ? '💧' : '🌱')}
                      </span>
                      <span className={`text-[9px] font-bold mt-0.5 ${
                        isDepleted ? 'text-stone-300' : 'text-amber-200/90'
                      }`}>
                        {isDepleted ? 'Tired Soil' : (isWatered ? 'Moist Soil' : 'Full Energy')}
                      </span>
                    </div>
                  )}

                  {/* Drag & Hover Visual Stamp / Pre-Plant Previews */}
                  {isEmpty && isHovered && (
                    <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[1px] flex flex-col items-center justify-center p-1 animate-in fade-in duration-150">
                      {selectedProfile?.isRestorative ? (
                        <>
                          <div className="px-2 py-1 rounded-lg bg-teal-950/95 border-2 border-teal-400 text-teal-200 text-[9px] sm:text-[10px] font-black shadow-xl flex items-center gap-1 animate-pulse">
                            <span>🫛</span>
                            <span>Recharges 🟢 Energy</span>
                          </div>
                          <span className="text-[8px] font-bold text-teal-300/90 mt-0.5">
                            Restorative Legume
                          </span>
                        </>
                      ) : isChargedForSelected ? (
                        <>
                          <div className="px-2 py-1 rounded-lg bg-emerald-950/95 border-2 border-emerald-400 text-emerald-300 text-[10px] sm:text-xs font-black shadow-xl flex items-center gap-1 animate-pulse">
                            <span>✨</span>
                            <span>+3 Harvest (Fast)</span>
                          </div>
                          <span className="text-[8px] font-bold text-emerald-300/90 mt-0.5">
                            Full Energy Match
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="px-1.5 py-0.5 rounded-lg bg-amber-950/95 border-2 border-amber-500 text-amber-300 text-[9px] sm:text-[10px] font-black shadow-xl flex items-center gap-1 animate-pulse">
                            <span>⚠️</span>
                            <span>Only 1x Harvest (Slow)</span>
                          </div>
                          {/* Floating Quick Fix Hint Bubble directly on plot */}
                          <div
                            className="mt-1 flex items-center gap-1 z-40"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => applyCompostToProps(plot.id)}
                              className="px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 text-[8px] font-black tracking-tight flex items-center gap-0.5 cursor-pointer shadow-md"
                              title="Add compost/manure to instantly refill battery"
                            >
                              <span>💩</span>
                              <span>Add Compost</span>
                            </button>
                            <span className="text-[8px] text-stone-300 font-bold">or</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCrop('peas');
                                plantCrop(plot.id, 'peas');
                              }}
                              className="px-1.5 py-0.5 rounded bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-[8px] font-black tracking-tight flex items-center gap-0.5 cursor-pointer shadow-md"
                              title="Plant restorative Peas to recharge 🟢 Leaf/Stem fuel"
                            >
                              <span>🫛</span>
                              <span>Plant Peas</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {isGrowing && plot.crop && (
                    <div className="flex flex-col items-center">
                      <span className="text-xl">{CROPS[plot.crop].emoji}</span>
                      <span className={`text-[10px] font-semibold mt-0.5 ${
                        plot.isFrostbitten
                          ? 'text-sky-300 font-bold'
                          : plot.isHeatWilted
                          ? 'text-orange-400 font-bold'
                          : isWatered ? 'text-cyan-300' : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        {plot.isFrostbitten ? '🧊 Frostbitten' : plot.isHeatWilted ? '🥀 Wilted' : `${Math.round(progress * 100)}%`}
                      </span>
                    </div>
                  )}

                  {isReady && plot.crop && (
                    <div className="flex flex-col items-center animate-bounce">
                      <span className="text-2xl">{CROPS[plot.crop].emoji}</span>
                      <span className="text-[10px] font-bold text-green-600 dark:text-green-300">
                        {'✂️'} Harvest
                      </span>
                    </div>
                  )}

                  {/* Climate-Driven Phenology Badge */}
                  {plot.crop && plot.phenologyBadgeEmoji && (
                    <span
                      className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-bold bg-stone-900/90 border border-stone-700/80 text-amber-200 z-10 backdrop-blur-xs shadow-xs"
                      title={plot.phenologyBadgeText || ''}
                    >
                      <span>{plot.phenologyBadgeEmoji}</span>
                      <span className="truncate max-w-[60px] hidden xs:inline">{plot.phenologyBadgeText?.split('(')[0]?.trim()}</span>
                    </span>
                  )}

                  {/* Alluvial Silt Deposit Badge */}
                  {Boolean(plot.alluvialSiltCyclesRemaining && plot.alluvialSiltCyclesRemaining > 0) && (
                    <span
                      className={`absolute ${plot.crop && plot.phenologyBadgeEmoji ? 'bottom-5' : 'bottom-1'} left-1 flex items-center gap-0.5 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-black bg-amber-950/90 border border-amber-400 text-amber-300 z-10 backdrop-blur-xs shadow-xs animate-pulse`}
                      title={`✨ Alluvial Silt Deposit: +20% Maturation Speed & Free Organic Fertilizer (${plot.alluvialSiltCyclesRemaining} crop cycles remaining)`}
                    >
                      <span>✨</span>
                      <span>Silt +20%</span>
                    </span>
                  )}

                  {/* Soil Tier Badge (Click to upgrade with coins) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlotForUpgrade(plot.id);
                      setIsUpgradeModalOpen(true);
                    }}
                    className={`absolute bottom-1 right-1 flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-black border z-10 transition-transform hover:scale-110 cursor-pointer ${soilTier.badgeColor}`}
                    title={`Plot #${plot.id + 1} Soil: ${soilTier.name} (Level ${plotLevel}) · Click to upgrade with coins`}
                  >
                    <span>{soilTier.emoji}</span>
                    <span>L{plotLevel}</span>
                  </button>
                </>
              )}
            </div>
          );
        })}

        {/* Next Locked Plot Card in the grid */}
        {unlockedPlots < plots.length && (
          <button
            onClick={() => unlockNextPlot()}
            className="relative aspect-square rounded-xl border-2 border-dashed border-amber-500/60 hover:border-amber-400 bg-amber-950/20 hover:bg-amber-950/40 transition-all flex flex-col items-center justify-center text-center p-1.5 group cursor-pointer active:scale-95 shadow-inner"
            title={`Unlock Plot #${unlockedPlots + 1} for 🪙${getPlotUnlockCost(unlockedPlots)}`}
          >
            <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">🔒</span>
            <span className="text-[9px] font-mono font-bold text-amber-300 mt-0.5">
              Plot #{unlockedPlots + 1}
            </span>
            <span className="text-[8px] font-bold bg-amber-500/20 text-amber-200 border border-amber-500/40 px-1 py-0.2 rounded mt-0.5">
              🪙{getPlotUnlockCost(unlockedPlots)}
            </span>
          </button>
        )}
      </div>

      {/* Silo summary */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="font-semibold text-stone-600 dark:text-stone-400">Silo:</span>
        {Object.entries(silo).filter(([, v]) => v > 0).map(([k, v]) => {
          const emoji = k in CROPS ? CROPS[k as CropId].emoji : (PRODUCTS[k as keyof typeof PRODUCTS]?.emoji || '🌾');
          const isSilver = k.endsWith('_silver');
          const isGold = k.endsWith('_gold');
          const isPrismatic = k.endsWith('_prismatic');
          return (
            <span
              key={k}
              className={`px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                isPrismatic
                  ? 'bg-purple-900/30 text-purple-300 border border-purple-500/40 shadow-xs'
                  : isGold
                  ? 'bg-amber-900/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : isSilver
                  ? 'bg-slate-800 text-slate-200 border border-slate-600'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              <span>{emoji}</span>
              <span>{v}</span>
            </span>
          );
        })}
      </div>

      {/* Plot Upgrade Modal */}
      <PlotUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        selectedPlotId={selectedPlotForUpgrade}
      />
    </div>
  );
}
