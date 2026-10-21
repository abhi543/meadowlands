'use client';

import { useGameStore } from '@/game/store';
import { CROPS, PRODUCTS, type CropId } from '@/game/data';
import { useState } from 'react';
import { OverclockActionMenu } from './OverclockActionMenu';
import { PlotUpgradeModal } from './PlotUpgradeModal';
import { getSoilTier, getPlotUnlockCost } from '@/game/plotUpgrades';
import { TOTAL_PASTURE_CAPACITY } from '@/types/animals';
import { getMoistureZone, resolveWeatherProfileId } from '@/game/hydrologyEngine';
import {
  WEATHER_PROFILES,
  getEstateWeatherModifier,
  type WeatherProfileId,
} from '@/game/weatherEngine';
import {
  CROP_NUTRIENT_PROFILES,
  isBatteryChargedForCrop,
  isSoilBatteryFull,
  type PlotSoilBattery,
} from '@/game/soilEnergyEngine';
import {
  playSoilEnergyChime,
  playTiredSoilAlert,
  playFloodWashSound,
  playBioDressingSound,
} from '@/lib/soundEffects';

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
    flushPlotBed,
    applyUniversalBioDressing,
    waterPlot,
    waterLevel,
    maxWaterLevel,
    pumpWell,
    waterAllPlots,
    silo,
    barn = {},
    coins,
    globalReputation,
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
  const [activeActionPlotId, setActiveActionPlotId] = useState<number | null>(null);
  const [flushingPlotId, setFlushingPlotId] = useState<number | null>(null);
  const [flushedFloatingTextPlotId, setFlushedFloatingTextPlotId] = useState<number | null>(null);
  const [bioDressingPlotId, setBioDressingPlotId] = useState<number | null>(null);
  const [bioDressingFloatingTextPlotId, setBioDressingFloatingTextPlotId] = useState<number | null>(null);

  const handleFlushBed = (plotId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const success = flushPlotBed(plotId);
    if (!success) return;
    setFlushingPlotId(plotId);
    setFlushedFloatingTextPlotId(plotId);
    setActiveActionPlotId(null);
    setTimeout(() => {
      setFlushingPlotId(null);
    }, 2000);
    setTimeout(() => {
      setFlushedFloatingTextPlotId(null);
    }, 2600);
  };

  const handleApplyBioDressing = (plotId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const success = applyUniversalBioDressing(plotId);
    if (!success) return;
    setBioDressingPlotId(plotId);
    setBioDressingFloatingTextPlotId(plotId);
    setActiveActionPlotId(null);
    setTimeout(() => {
      setBioDressingPlotId(null);
    }, 1200);
    setTimeout(() => {
      setBioDressingFloatingTextPlotId(null);
    }, 2200);
  };


  const visiblePlots = plots.slice(0, unlockedPlots);
  const towerWater = hydrology?.towerLiters || 0;

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

  // Atmospheric Weather & Estate Modifier State
  const activeWeatherId: WeatherProfileId = resolveWeatherProfileId(hydrology?.weatherCondition);
  const activeProfile = WEATHER_PROFILES[activeWeatherId] || WEATHER_PROFILES.sunny;
  const estateModifier = getEstateWeatherModifier(activeWeatherId);
  const weatherState = hydrology?.weatherState;
  const tempC = weatherState?.temperatureC ?? activeProfile.defaultTempC;
  const humidityPct = weatherState?.relativeHumidityPct ?? activeProfile.defaultHumidityPct;

  return (
    <div className="space-y-3.5">
      {/* Environmental Weather & Estate Modifier Banner */}
      <div
        className={`rounded-2xl p-3 sm:p-3.5 border transition-all duration-300 shadow-lg flex flex-wrap items-center justify-between gap-3 ${
          estateModifier.severity === 'danger'
            ? 'bg-gradient-to-r from-rose-950/95 via-red-950/90 to-amber-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/50'
            : estateModifier.severity === 'warning'
            ? 'bg-gradient-to-r from-amber-950/95 via-orange-950/90 to-stone-900/95 border-amber-500/80 text-amber-100 shadow-amber-950/50'
            : estateModifier.severity === 'benefit'
            ? 'bg-gradient-to-r from-emerald-950/95 via-teal-950/90 to-cyan-950/95 border-emerald-400/80 text-emerald-100 shadow-emerald-950/50'
            : 'bg-gradient-to-r from-stone-900/95 via-stone-850 to-stone-900/95 border-stone-700/80 text-stone-200 shadow-md'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            {estateModifier.icon || activeProfile.emoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs sm:text-sm tracking-wide uppercase text-white flex items-center gap-1.5">
                <span>{activeProfile.emoji}</span>
                <span>{activeProfile.name}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold border ${
                estateModifier.severity === 'danger'
                  ? 'bg-rose-900/80 border-rose-400 text-rose-200 animate-pulse'
                  : estateModifier.severity === 'warning'
                  ? 'bg-amber-900/80 border-amber-400 text-amber-200'
                  : estateModifier.severity === 'benefit'
                  ? 'bg-emerald-900/80 border-emerald-400 text-emerald-200 animate-pulse'
                  : 'bg-stone-800 border-stone-600 text-stone-300'
              }`}>
                {estateModifier.categoryLabel}
              </span>
              <span className="text-[11px] font-mono opacity-80">
                🌡️ {tempC}°C · 💧 {humidityPct}% RH
              </span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold mt-0.5 text-white/95 tracking-tight flex items-center gap-1.5">
              <span>{estateModifier.bannerText}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={() => {
              if (onSelectTab) onSelectTab('water');
              else setSluiceModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
            title="Open Estate Hydrology & Sluice Console"
          >
            <span>🌊 Sluice:</span>
            <span className={hydrology?.sluiceGatesOpen ? 'text-emerald-300 font-black' : 'text-stone-400'}>
              {hydrology?.sluiceGatesOpen ? 'OPEN' : 'CLOSED'}
            </span>
            <span className="text-[10px] opacity-75">({Math.round(hydrology?.towerLiters || 0)}L Tower)</span>
          </button>
        </div>
      </div>
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

      {/* Crop Selector Toolbar */}
      <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-2.5 border border-amber-200 dark:border-amber-800 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <span>🌱</span>
            <span>Select Crop & Tap Plot to Plant</span>
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
              if (isDepleted) {
                // Tapping an empty depleted plot toggles contextual actions: [ 🌊 Flush Bed ] / [ 🧪 Bio-Dressing ]
                setActiveActionPlotId(prev => prev === plot.id ? null : plot.id);
              } else {
                plantCrop(plot.id, selectedCrop);
              }
            } else if (isGrowing) {
              // Tapping growing crop toggles contextual action bubble: [ ❌ Uproot & Till Under ]
              setActiveActionPlotId(prev => prev === plot.id ? null : plot.id);
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
              className={`relative aspect-square rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center overflow-hidden select-none ${soilClasses} ${
                plot.gases?.hasAnyPenalty
                  ? 'ring-2 ring-yellow-400 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.75)] animate-pulse'
                  : ''
              }`}
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

                  {/* Gas Metric Penalty Flash Alert (Yellow alert when any gas enters penalty zone) */}
                  {plot.gases?.hasAnyPenalty && (
                    <div
                      className="absolute top-5 left-1 flex items-center gap-0.5 px-1 py-0.2 rounded bg-yellow-500/30 border border-yellow-400 text-yellow-300 text-[7px] sm:text-[8px] font-black animate-pulse z-20 shadow-xs"
                      title={
                        plot.gases.isAnoxiaSuffocated
                          ? 'Root Anoxia / Suffocation: Crop timer completely paused!'
                          : plot.gases.isParchedDoubleDrain
                          ? 'Parched Ground: Crop water consumption doubled!'
                          : plot.gases.isPenaltyNitrogen
                          ? 'Low Nitrogen: 1x Harvest yield penalty!'
                          : 'Gas Penalty Alert'
                      }
                    >
                      <span>⚠️</span>
                      <span>
                        {plot.gases.isAnoxiaSuffocated
                          ? 'Anoxia'
                          : plot.gases.isParchedDoubleDrain
                          ? 'Parched'
                          : plot.gases.isPenaltyNitrogen
                          ? 'Low N'
                          : 'Gas Alert'}
                      </span>
                    </div>
                  )}

                  {/* Mini Dynamic Gas Meter Live Indicator Strip */}
                  {plot.gases && (
                    <div
                      className="absolute top-5 right-1 flex items-center gap-0.5 px-1 py-0.2 rounded bg-stone-950/85 backdrop-blur-xs border border-stone-700/80 text-[7px] sm:text-[8px] font-mono z-15 pointer-events-none select-none text-stone-300 shadow-2xs"
                      title={`Dynamic Atmospheric Gases:\nCO₂: ${plot.gases.co2}% ${plot.gases.co2Arrow} (${plot.gases.co2BreakdownText})\nO₂:  ${plot.gases.o2}% ${plot.gases.o2Arrow} (${plot.gases.o2BreakdownText})\nN:   ${plot.gases.nitrogen}% ${plot.gases.nitrogenArrow} (${plot.gases.nitrogenBreakdownText})`}
                    >
                      <span className={plot.gases.isPenaltyCo2 ? 'text-yellow-400 font-bold' : plot.gases.co2 > 60 ? 'text-emerald-300 font-bold' : ''}>
                        C{plot.gases.co2}%{plot.gases.co2Arrow}
                      </span>
                      <span className="text-stone-600">·</span>
                      <span className={plot.gases.isPenaltyO2 ? 'text-yellow-400 font-bold' : ''}>
                        O{plot.gases.o2}%{plot.gases.o2Arrow}
                      </span>
                      <span className="text-stone-600">·</span>
                      <span className={plot.gases.isPenaltyNitrogen ? 'text-yellow-400 font-bold' : plot.gases.nitrogen >= 70 ? 'text-teal-300 font-bold' : ''}>
                        N{plot.gases.nitrogen}%{plot.gases.nitrogenArrow}
                      </span>
                    </div>
                  )}

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
                          : plot.crop === 'peas'
                          ? 'bg-emerald-400 border border-white ring-2 ring-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
                          : `border-2 border-stone-500 bg-stone-900 ${
                              isHovered && selectedProfile?.fuelType === 'green'
                                ? 'border-amber-400 ring-2 ring-amber-400 animate-ping'
                                : ''
                            }`
                      }`}
                      title={plot.crop === 'peas' && !battery.green ? '🟢 Recharging Leaf Fuel via Peas (Active)!' : undefined}
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
                            <span>Restorative Crop</span>
                          </div>
                          <span className="text-[8px] font-bold text-teal-300/95 mt-0.5 text-center leading-tight">
                            Fully recharges 🟢 Green Energy on harvest
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
                            className="mt-1 flex flex-wrap items-center justify-center gap-1 z-40 max-w-[96%]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              disabled={towerWater < 15}
                              onClick={(e) => handleFlushBed(plot.id, e)}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-tight flex items-center gap-0.5 shadow-md border ${
                                towerWater >= 15
                                  ? towerWater >= 200
                                    ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white border-blue-400 cursor-pointer'
                                    : 'bg-amber-600 hover:bg-amber-500 active:scale-95 text-white border-amber-400 cursor-pointer'
                                  : 'bg-stone-800 text-stone-400 border-stone-600 cursor-not-allowed opacity-75'
                              }`}
                              title={
                                towerWater >= 200
                                  ? 'Flush bed with 15L Tower Water to instantly restore all nutrients'
                                  : towerWater >= 15
                                  ? `Stage 1 Override: Uses 15L Tower Water (${Math.round(towerWater)}L available)`
                                  : `Tower Water below 15L (${Math.round(towerWater)}L) — Refill Tower first`
                              }
                            >
                              <span>🌊</span>
                              <span>Flush Bed</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleApplyBioDressing(plot.id, e)}
                              className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[8px] font-black tracking-tight flex items-center gap-0.5 cursor-pointer shadow-md border border-emerald-400"
                              title="Apply Universal Bio-Dressing (Instant 100% Recharge, uses 1 dose or auto-buys for 10 Favor / 25 Coins)"
                            >
                              <span>🧪</span>
                              <span>
                                {(barn?.universal_bio_dressing || 0) > 0
                                  ? `Bio-Dress (${barn.universal_bio_dressing})`
                                  : (globalReputation?.spendableFavor || 0) >= 10
                                  ? 'Bio-Dress (10🎖️)'
                                  : coins >= 25
                                  ? 'Bio-Dress (25🪙)'
                                  : 'Bio-Dress'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => applyCompostToProps(plot.id)}
                              className="px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 text-[8px] font-black tracking-tight flex items-center gap-0.5 cursor-pointer shadow-md"
                              title="Add compost/manure to instantly refill battery (5🪙 or free from barn)"
                            >
                              <span>💩</span>
                              <span>Compost</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCrop('peas');
                                plantCrop(plot.id, 'peas');
                              }}
                              className="px-1.5 py-0.5 rounded bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-[8px] font-black tracking-tight flex items-center gap-0.5 cursor-pointer shadow-md"
                              title="Plant restorative Peas to recharge 🟢 Leaf/Stem fuel in 30s"
                            >
                              <span>🫛</span>
                              <span>Peas</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Contextual Action Bubble for Empty Depleted Plot */}
                  {isEmpty && isDepleted && (activeActionPlotId === plot.id || isHovered) && (
                    <div
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-stone-950/95 border border-cyan-400/90 px-2 py-1 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={towerWater < 15}
                        onClick={(e) => handleFlushBed(plot.id, e)}
                        className={`px-2 py-0.5 rounded-lg text-white text-[9px] font-black tracking-tight flex items-center gap-1 shadow-md transition-all border ${
                          towerWater >= 15
                            ? towerWater >= 200
                              ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 border-blue-400 cursor-pointer'
                              : 'bg-amber-600 hover:bg-amber-500 active:scale-95 border-amber-400 cursor-pointer'
                            : 'bg-stone-800 text-stone-400 border-stone-600 cursor-not-allowed opacity-75'
                        }`}
                        title={
                          towerWater >= 200
                            ? 'Instantly restore all depleted nutrient lights using 15L Gravity Tower water'
                            : towerWater >= 15
                            ? `Stage 1 Override: Uses 15L Tower Water (${Math.round(towerWater)}L available)`
                            : `Tower Water too low (<15L available)`
                        }
                      >
                        <span>🌊</span>
                        <span>Flush Bed (-15L Tower Water)</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleApplyBioDressing(plot.id, e)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[9px] font-black tracking-tight flex items-center gap-1 cursor-pointer shadow-md transition-all border border-emerald-400"
                        title="Apply Universal Bio-Dressing: 100% nutrient recharge & blight cleanse (Uses 1 dose or auto-buys for 10 Favor / 25 Coins)"
                      >
                        <span>🧪</span>
                        <span>
                          {(barn?.universal_bio_dressing || 0) > 0
                            ? `Bio-Dressing (${barn.universal_bio_dressing})`
                            : (globalReputation?.spendableFavor || 0) >= 10
                            ? 'Bio-Dress (10 🎖️)'
                            : coins >= 25
                            ? 'Bio-Dress (25 🪙)'
                            : 'Bio-Dress (Shop)'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyCompostToProps(plot.id);
                        }}
                        className="px-1.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 text-[9px] font-black tracking-tight flex items-center gap-0.5 cursor-pointer shadow-md"
                        title="Add compost/manure to instantly refill battery (5🪙 or free from barn)"
                      >
                        <span>💩</span>
                        <span>Compost</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          plantCrop(plot.id, selectedCrop);
                          setActiveActionPlotId(null);
                        }}
                        className="px-1.5 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-300 text-[9px] font-bold border border-stone-600 cursor-pointer shadow-sm"
                        title="Plant crop anyway (will suffer 1x harvest and slow growth)"
                      >
                        <span>🌱</span>
                        <span>Plant {selectedCropDef.name}</span>
                      </button>
                    </div>
                  )}

                  {/* Contextual Action Bubble for Growing Crop */}
                  {isGrowing && (activeActionPlotId === plot.id || isHovered) && (
                    <div
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-stone-950/95 border border-amber-400/90 px-2 py-1 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >

                      <button
                        type="button"
                        onClick={(e) => handleApplyBioDressing(plot.id, e)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[9px] font-black tracking-tight flex items-center gap-1 cursor-pointer shadow-md transition-all border border-emerald-400"
                        title="Apply Universal Bio-Dressing: restores 100% soil energy & clears negative modifiers (Uses 1 dose or auto-buys for 10 Favor / 25 Coins)"
                      >
                        <span>🧪</span>
                        <span>
                          {(barn?.universal_bio_dressing || 0) > 0
                            ? `Bio-Dressing (${barn.universal_bio_dressing})`
                            : (globalReputation?.spendableFavor || 0) >= 10
                            ? 'Bio-Dress (10 🎖️)'
                            : coins >= 25
                            ? 'Bio-Dress (25 🪙)'
                            : 'Bio-Dress (Shop)'}
                        </span>
                      </button>
                      {!isWatered && waterLevel > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            waterPlot(plot.id);
                          }}
                          className="px-1.5 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[9px] font-black tracking-tight flex items-center gap-0.5 cursor-pointer shadow-md transition-all border border-blue-400"
                          title="Water plot (+100% growth speed)"
                        >
                          <span>💧</span>
                          <span>Water</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* 2-second water pooling animation over the dirt */}
                  {flushingPlotId === plot.id && (
                    <div className="absolute inset-0 z-40 bg-blue-600/50 backdrop-blur-[1px] flex flex-col items-center justify-center animate-in fade-in duration-200 pointer-events-none overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-700/70 via-cyan-500/40 to-transparent animate-pulse" />
                      <span className="text-3xl animate-bounce z-10">🌊</span>
                      <div className="absolute w-16 h-16 rounded-full border-2 border-cyan-200/80 animate-ping" />
                      <span className="text-[9px] font-black text-white mt-1 uppercase tracking-wider drop-shadow-md z-10">
                        Flushing Bed...
                      </span>
                    </div>
                  )}

                  {/* Floating feedback text after flush */}
                  {flushedFloatingTextPlotId === plot.id && (
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-50 px-2 py-0.5 rounded-full bg-blue-950/95 border border-cyan-400 text-cyan-200 text-[8px] sm:text-[9px] font-black shadow-2xl animate-bounce pointer-events-none whitespace-nowrap">
                      Soil Flushed — Nutrients Restored!
                    </div>
                  )}

                  {/* 1.2-second bio-dressing sparkle animation */}
                  {bioDressingPlotId === plot.id && (
                    <div className="absolute inset-0 z-40 bg-emerald-950/70 backdrop-blur-[1px] flex flex-col items-center justify-center animate-in fade-in duration-200 pointer-events-none">
                      <span className="text-3xl animate-bounce z-10">🧪</span>
                      <div className="absolute w-14 h-14 rounded-full border-2 border-emerald-300 animate-ping" />
                      <span className="text-[9px] font-black text-emerald-200 mt-1 uppercase tracking-wider drop-shadow-md z-10">
                        Enriching Loam...
                      </span>
                    </div>
                  )}

                  {/* Floating feedback text after bio-dressing */}
                  {bioDressingFloatingTextPlotId === plot.id && (
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-50 px-2 py-0.5 rounded-full bg-emerald-950/95 border border-emerald-400 text-emerald-200 text-[8px] sm:text-[9px] font-black shadow-2xl animate-bounce pointer-events-none whitespace-nowrap">
                      ✨ Bio-Dressing Applied — Nutrients 100%!
                    </div>
                  )}



                  {/* Crop Hover Inspection Stamp during Severe Weather / Growing */}
                  {isGrowing && isHovered && (
                    <div className="absolute inset-0 z-35 bg-stone-950/92 backdrop-blur-[2px] flex flex-col items-center justify-center p-1 text-center animate-in fade-in duration-150 select-none pointer-events-none">
                      <span className="text-xl sm:text-2xl animate-pulse">
                        {plot.isTimerFrozen || plot.isFrostbitten ? '❄️' : (plot.isHeatWilted ? '🥀' : (plot.phenologyBadgeEmoji || '🌱'))}
                      </span>
                      <div className={`mt-0.5 px-1.5 py-0.5 rounded-lg border text-[8px] sm:text-[9px] font-black leading-tight shadow-lg max-w-[95%] ${
                        plot.isTimerFrozen || plot.isFrostbitten
                          ? 'bg-sky-950 text-sky-200 border-sky-400 animate-pulse'
                          : plot.isHeatWilted
                          ? 'bg-rose-950 text-rose-200 border-rose-400 animate-pulse'
                          : 'bg-stone-900 text-amber-200 border-amber-500/70'
                      }`}>
                        {plot.weatherModifierText || (plot.isTimerFrozen ? '❄️ Frozen: Requires heat source to continue growth' : plot.phenologyBadgeText || 'Standard Growth')}
                      </div>
                      <span className="text-[8px] font-bold text-stone-300 mt-0.5">
                        {plot.isTimerFrozen ? '❄️ Timer Frozen' : `Progress: ${Math.round(progress * 100)}%`}
                      </span>
                    </div>
                  )}

                  {isGrowing && plot.crop && (
                    <div className="flex flex-col items-center">
                      <span className="text-xl">{CROPS[plot.crop].emoji}</span>
                      <span className={`text-[10px] font-semibold mt-0.5 ${
                        plot.isTimerFrozen || plot.isFrostbitten
                          ? 'text-sky-300 font-black animate-pulse'
                          : plot.isHeatWilted
                          ? 'text-orange-400 font-bold'
                          : isWatered ? 'text-cyan-300' : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        {plot.isTimerFrozen || plot.isFrostbitten ? '❄️ Frozen' : plot.isHeatWilted ? '🥀 Wilted' : `${Math.round(progress * 100)}%`}
                      </span>
                      {plot.crop === 'peas' && (
                        <span className="text-[8px] font-black text-emerald-300 bg-emerald-950/90 px-1.5 py-0.2 rounded-full border border-emerald-400/80 animate-pulse mt-0.5">
                          ⚡ Recharging 🟢 Leaf
                        </span>
                      )}


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

                  {/* Climate-Driven Phenology & Weather Modifier Badge */}
                  {plot.crop && (plot.weatherModifierText || plot.phenologyBadgeEmoji) && (
                    <span
                      className={`absolute bottom-1 left-1 flex items-center gap-0.5 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-bold border z-10 backdrop-blur-xs shadow-xs ${
                        plot.isTimerFrozen || plot.isFrostbitten
                          ? 'bg-sky-950/95 border-sky-400 text-sky-200 animate-pulse'
                          : 'bg-stone-900/90 border-stone-700/80 text-amber-200'
                      }`}
                      title={plot.weatherModifierText || plot.phenologyBadgeText || ''}
                    >
                      <span>{plot.isTimerFrozen || plot.isFrostbitten ? '❄️' : (plot.phenologyBadgeEmoji || '🌦️')}</span>
                      <span className="truncate max-w-[65px] hidden xs:inline">
                        {plot.isTimerFrozen || plot.isFrostbitten
                          ? 'Frozen'
                          : (plot.weatherModifierText?.split(':')[0]?.trim() || plot.phenologyBadgeText?.split('(')[0]?.trim())}
                      </span>
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

                  {/* Dynamic Gas Tick Live Hover Inspection Card */}
                  {isHovered && plot.gases && (
                    <div
                      className={`absolute inset-x-1 bottom-1 z-50 bg-stone-950/95 border-2 rounded-xl p-2 shadow-2xl backdrop-blur-md pointer-events-none select-none text-left animate-in fade-in zoom-in-95 duration-100 ${
                        plot.gases.hasAnyPenalty
                          ? 'border-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.65)]'
                          : 'border-amber-400/80 shadow-black/80'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-stone-800">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                          <span>💨</span> Gas Tick Cycle
                        </span>
                        {plot.gases.hasAnyPenalty ? (
                          <span className="px-1.5 py-0.2 rounded bg-yellow-400 text-stone-950 text-[8px] font-black animate-pulse flex items-center gap-0.5">
                            <span>⚠️</span> PENALTY ZONE
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono text-emerald-400 font-bold">
                            LIVE
                          </span>
                        )}
                      </div>

                      {/* Metric lines with dynamic live arrows and active modifiers */}
                      <div className="space-y-0.5 font-mono text-[9px] sm:text-[10px] leading-tight">
                        {/* Carbon Dioxide */}
                        <div className={`flex items-center justify-between gap-1 ${
                          plot.gases.isPenaltyCo2 ? 'text-yellow-300 font-bold' : plot.gases.co2 > 60 ? 'text-emerald-300' : 'text-stone-200'
                        }`}>
                          <span className="font-bold">CO₂: {plot.gases.co2}% {plot.gases.co2Arrow}</span>
                          <span className="text-[8px] sm:text-[9px] text-stone-300 font-sans truncate">
                            ({plot.gases.co2BreakdownText})
                          </span>
                        </div>

                        {/* Oxygen */}
                        <div className={`flex items-center justify-between gap-1 ${
                          plot.gases.isPenaltyO2 ? 'text-yellow-300 font-bold' : 'text-cyan-300'
                        }`}>
                          <span className="font-bold">O₂:  {plot.gases.o2}% {plot.gases.o2Arrow}</span>
                          <span className="text-[8px] sm:text-[9px] text-stone-300 font-sans truncate">
                            ({plot.gases.o2BreakdownText})
                          </span>
                        </div>

                        {/* Nitrogen */}
                        <div className={`flex items-center justify-between gap-1 ${
                          plot.gases.isPenaltyNitrogen ? 'text-yellow-300 font-bold' : plot.gases.nitrogen >= 70 ? 'text-teal-300' : 'text-stone-200'
                        }`}>
                          <span className="font-bold">N:   {plot.gases.nitrogen}% {plot.gases.nitrogenArrow}</span>
                          <span className="text-[8px] sm:text-[9px] text-stone-300 font-sans truncate">
                            ({plot.gases.nitrogenBreakdownText})
                          </span>
                        </div>
                      </div>

                      {/* Net Gameplay Output Summary */}
                      <div className="mt-1 pt-1 border-t border-stone-800 text-[8px] leading-tight">
                        {plot.gases.isAnoxiaSuffocated ? (
                          <div className="text-yellow-300 font-black flex items-center gap-1 animate-pulse">
                            <span>🛑</span>
                            <span>Root Anoxia — Crop timer paused!</span>
                          </div>
                        ) : plot.gases.isParchedDoubleDrain ? (
                          <div className="text-yellow-300 font-black flex items-center gap-1">
                            <span>🔥</span>
                            <span>Parched Ground — 2x water drain!</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-stone-400">
                            <span>
                              {plot.gases.growthSpeedMultiplier > 1 ? (
                                <strong className="text-emerald-300">
                                  ⚡ Boosted (+{((plot.gases.growthSpeedMultiplier - 1) * 100).toFixed(0)}% spd)
                                </strong>
                              ) : (
                                'Standard Speed'
                              )}
                            </span>
                            <span className="font-mono text-teal-300 font-bold">
                              {plot.gases.nitrogenYieldMultiplier}x Harvest Yield
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
