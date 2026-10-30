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
  CROP_PHENOLOGY_REGISTRY,
  getEstateWeatherModifier,
  type WeatherProfileId,
} from '@/game/weatherEngine';
import { evaluateFaunaWeather } from '@/game/faunaWeatherEngine';
import { getCircadianClock } from '@/game/shiftEngine';
import { calculatePlotCureCost } from '@/game/cropDiseaseEngine';
import {
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
    flushPlotBed,
    applyUniversalBioDressing,
    witherAllPlants,
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
    toggleEmergencySpillway,
    clearWitheredCrop,
    curePlotDisease,
    cureAllDiseases,
    washHandTools,
    solarizePlotBed,
    clearDiseasedCrop,
    isToolContaminated,
    animals = [],
    livestockReserve = [],
    farmEpochStart,
    level,
    pastureWelfare,
    prehistoricSanctuary,
  } = useGameStore();
  const [selectedCrop, setSelectedCrop] = useState<CropId>('wheat');
  const [hoveredCropId, setHoveredCropId] = useState<CropId | null>(null);
  const [cropCategoryFilter, setCropCategoryFilter] = useState<'all' | 'temperate' | 'severe' | 'extreme' | 'legacy'>('all');
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

  // Count ready, empty, and crop-bearing plots for batch actions
  const readyOrWitheredCount = visiblePlots.filter(p => p.crop && (p.ready || p.isWithered)).length;
  const alreadyWitheredCount = visiblePlots.filter(p => p.crop && p.isWithered).length;
  const cropsToWitherCount = visiblePlots.filter(p => p.crop && !p.isWithered).length;
  const anyCropsOnFarm = visiblePlots.some(p => p.crop); // growing OR withered
  const diseasedPlots = visiblePlots.filter(p => p.disease && (p.disease.stage === 'active' || p.disease.stage === 'warning'));
  const diseasedPlotsCount = diseasedPlots.length;
  const totalCureCost = diseasedPlots.reduce((sum, p) => sum + calculatePlotCureCost(p.crop), 0);
  const canAffordCureAll = coins >= totalCureCost;
  const emptyCount = visiblePlots.filter(p => !p.crop).length;
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

  const faunaEval = evaluateFaunaWeather({
    activeWeatherId,
    temperatureC: tempC,
    isRainstormActive: false,
    pastureWelfare,
    sanctuary: prehistoricSanctuary,
    hasThermalCore: false,
    hasSiphonValve: Boolean(hydrology?.isSiphonActive),
    farmLevel: level,
  });

  // 1-Day Weather Timing (30 real minutes per day: 10m morning, 20m night)
  const clock = getCircadianClock(Date.now(), farmEpochStart || Date.now());
  const dayRemainingSec = Math.max(0, 1800 - clock.cycleElapsedSeconds);
  const dayRemainingMin = Math.floor(dayRemainingSec / 60);
  const dayRemainingSecFormatted = `${dayRemainingMin}:${(dayRemainingSec % 60).toString().padStart(2, '0')}`;
  const isMorningPhase = clock.activeShift === 'morning';

  // Pre-plant stamp hover feedback calculation
  const previewCropId = hoveredCropId || selectedCrop;
  const previewCrop = CROPS[previewCropId] || CROPS.wheat;
  let previewCropRoleLabel = 'Standard Crop';
  if (previewCropId === 'peas' || previewCropId === 'soybean') {
    previewCropRoleLabel = '🫛 Legume Restorer';
  } else if (previewCropId === 'wheat' || previewCropId === 'corn' || previewCropId === 'cotton') {
    previewCropRoleLabel = '🌾 Heavy Feeder';
  } else if (previewCropId === 'carrot') {
    previewCropRoleLabel = '🥕 Root Aerator';
  } else if (previewCropId === 'strawberry' || previewCropId === 'pumpkin' || previewCropId === 'wild_berries') {
    previewCropRoleLabel = '🍓 Fruit & Berry Feeder';
  }

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

        {/* 1-Day Weather Front Telemetry Badge & Remaining Time */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-mono font-bold bg-black/40 border border-white/20 text-white flex items-center gap-1.5 shadow-inner">
            <span>📅</span>
            <span>Day {clock.currentDay} Weather</span>
            <span className="opacity-50">•</span>
            <span className={isMorningPhase ? 'text-amber-300' : 'text-indigo-300 font-semibold'}>
              {isMorningPhase ? '☀️ Morning (10m)' : '🌙 Night (20m)'}
            </span>
          </span>
          <span className="px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-mono font-bold bg-black/40 border border-white/20 text-amber-300 flex items-center gap-1 shadow-inner" title="Time remaining before next daily weather front transition">
            <span>⏳</span>
            <span>{dayRemainingSecFormatted} left</span>
          </span>
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

      {/* Tool Sanitation Warning Banner */}
      {isToolContaminated && (
        <div className="bg-gradient-to-r from-red-950/95 via-rose-950/90 to-amber-950/95 border-2 border-rose-500 rounded-2xl p-3 sm:p-4 text-white shadow-xl shadow-rose-950/80 animate-pulse flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl animate-bounce">🧼</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs sm:text-sm tracking-wide uppercase text-rose-200">
                  ⚠️ Hand Tools Contaminated with Crop Pathogens!
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-rose-950 border border-rose-400 text-rose-300">
                  50% Infection Risk on Replanting
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-rose-200/80 mt-0.5 leading-snug">
                Harvesting blighted crops infected your hand scythe. Wash tools in clean trough water to restore sanitation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => washHandTools()}
            className="px-4 py-2 rounded-xl font-black text-xs sm:text-sm tracking-wide bg-blue-600 hover:bg-blue-500 text-white border-2 border-blue-300 cursor-pointer active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          >
            <span>🧼</span>
            <span>Wash Hand Tools (-2L Water)</span>
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

              {/* Fauna Environmental Climate Status Tag */}
              {faunaEval && faunaEval.condition !== 'mild' && (
                <button
                  onClick={() => onSelectTab?.('animals')}
                  className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded border text-[11px] shadow-2xs cursor-pointer hover:brightness-105 ${faunaEval.statusBadge.color}`}
                  title={faunaEval.statusBadge.tooltip}
                >
                  <span>{faunaEval.statusBadge.emoji}</span>
                  <span className="truncate max-w-[170px]">{faunaEval.statusBadge.text.split('|')[0].trim()}</span>
                </button>
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

        {/* Seed Packets */}
        <div className="flex gap-2 flex-wrap">
          {CROP_LIST.filter(crop => {
            const pheno = CROP_PHENOLOGY_REGISTRY[crop.id];
            if (cropCategoryFilter === 'all') return true;
            if (cropCategoryFilter === 'temperate') {
              return ['sunflower', 'okra', 'sorghum', 'spinach', 'eggplant', 'wasabi', 'tea_bush', 'soybean'].includes(crop.id);
            }
            if (cropCategoryFilter === 'severe') {
              return ['paddy_rice', 'strawberry', 'peanut', 'sweet_potato', 'turnip', 'taro', 'kale', 'winter_rye'].includes(crop.id);
            }
            if (cropCategoryFilter === 'extreme') {
              return ['water_chestnut', 'dragon_fruit', 'arctic_moss_campion', 'bambara_groundnut', 'bioluminescent_shroom', 'prickly_pear_cactus'].includes(crop.id);
            }
            if (cropCategoryFilter === 'legacy') {
              return ['wheat', 'corn', 'carrot', 'pumpkin', 'cotton', 'peas', 'wild_berries'].includes(crop.id);
            }
            return true;
          }).map(crop => {
            const isSelected = selectedCrop === crop.id;
            return (
              <button
                key={crop.id}
                type="button"
                onClick={() => setSelectedCrop(crop.id)}
                onMouseEnter={() => setHoveredCropId(crop.id)}
                onMouseLeave={() => setHoveredCropId(null)}
                className={`relative px-3 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer select-none ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105 ring-2 ring-amber-400/50'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                }`}
                title={`Base Time: 2m 00s | Optimal Weather: ${CROP_PHENOLOGY_REGISTRY[crop.id]?.optimalWeather ? `${WEATHER_PROFILES[CROP_PHENOLOGY_REGISTRY[crop.id].optimalWeather]?.emoji} ${WEATHER_PROFILES[CROP_PHENOLOGY_REGISTRY[crop.id].optimalWeather]?.name}` : 'Any'}`}
              >
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

        {/* Pre-Plant Stamp Feedback */}
        <div className="mt-2 pt-2 border-t border-amber-200/80 dark:border-amber-900/60">
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
              <span className="text-base">{previewCrop.emoji}</span>
              <span>Selected Crop: {previewCrop.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 font-semibold border border-amber-500/30">
                {previewCropRoleLabel}
              </span>
            </div>
            {/* Crop Seed Hover Card Requirements */}
            <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700">
              <span className="text-amber-900 dark:text-amber-200">⏱️ Base Time: <strong>2m 00s</strong></span>
              <span className="text-amber-700 dark:text-amber-400">|</span>
              <span className="text-amber-900 dark:text-amber-200">
                🌤️ Optimal Weather: {CROP_PHENOLOGY_REGISTRY[previewCropId]?.optimalWeather ? (
                  <strong>{WEATHER_PROFILES[CROP_PHENOLOGY_REGISTRY[previewCropId].optimalWeather]?.emoji} {WEATHER_PROFILES[CROP_PHENOLOGY_REGISTRY[previewCropId].optimalWeather]?.name}</strong>
                ) : '☀️ Sunny'}
              </span>
              {CROP_PHENOLOGY_REGISTRY[previewCropId]?.traitName && (
                <>
                  <span className="text-amber-700 dark:text-amber-400 hidden md:inline">|</span>
                  <span className="text-amber-800 dark:text-amber-300 hidden md:inline">
                    ✨ <em>{CROP_PHENOLOGY_REGISTRY[previewCropId].traitName}</em>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
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
          disabled={readyOrWitheredCount === 0}
          className={`px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 ${
            readyOrWitheredCount > 0
              ? 'bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-md shadow-green-200/50 active:scale-95'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed'
          }`}
        >
          <span className="text-base sm:text-lg">{'🌾'}</span>
          Harvest All
          {readyOrWitheredCount > 0 && (
            <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold">
              {readyOrWitheredCount}
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

        {/* Cure All Diseases */}
        <button
          onClick={() => cureAllDiseases()}
          disabled={diseasedPlotsCount === 0 || !canAffordCureAll}
          className={`px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 active:scale-95 ${
            diseasedPlotsCount > 0 && canAffordCureAll
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-md shadow-emerald-300/40 cursor-pointer animate-pulse'
              : diseasedPlotsCount > 0 && !canAffordCureAll
                ? 'bg-amber-900/60 text-amber-200 border-amber-600/70 cursor-not-allowed opacity-80'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed'
          }`}
          title={
            diseasedPlotsCount > 0
              ? `Auto-cure all ${diseasedPlotsCount} diseased plots for ${totalCureCost} Coins (2x seed cost rule, min 5c per plot).${!canAffordCureAll ? ` (Need ${totalCureCost - coins} more Coins)` : ''}`
              : 'Auto-apply the correct remedy to all diseased plots'
          }
        >
          <span className="text-base sm:text-lg">{'💊'}</span>
          <span>Cure All</span>
          {diseasedPlotsCount > 0 && (
            <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold">
              {diseasedPlotsCount}
            </span>
          )}
          {diseasedPlotsCount > 0 && (
            <span className={`text-[10px] sm:text-xs font-mono font-bold ${!canAffordCureAll ? 'text-amber-300' : 'opacity-90'}`}>
              {'💰'}{totalCureCost}
            </span>
          )}
        </button>

        {/* Wither All Plants / Clear Withered */}
        <button
          onClick={() => witherAllPlants()}
          disabled={!anyCropsOnFarm}
          className={`px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 active:scale-95 ${
            anyCropsOnFarm
              ? alreadyWitheredCount > 0 && cropsToWitherCount === 0
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-md shadow-amber-200/50 cursor-pointer'
                : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-md shadow-rose-200/50 cursor-pointer'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed'
          }`}
          title={alreadyWitheredCount > 0 && cropsToWitherCount === 0
            ? 'Clear all withered crop debris from beds'
            : 'Instantly wither all growing/ready crops across all plots'}
        >
          <span className="text-base sm:text-lg">{'🥀'}</span>
          <span>
            {alreadyWitheredCount > 0 && cropsToWitherCount === 0
              ? 'Clear Withered'
              : 'Wither All'}
          </span>
          {anyCropsOnFarm && (
            <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold">
              {alreadyWitheredCount > 0 && cropsToWitherCount === 0 ? alreadyWitheredCount : cropsToWitherCount || alreadyWitheredCount}
            </span>
          )}
        </button>

        {/* Upgrade Plots with Coins */}
        <button
          onClick={() => {
            setSelectedPlotForUpgrade(null);
            setIsUpgradeModalOpen(true);
          }}
          className="px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all border-2 flex items-center justify-center gap-1.5 active:scale-95 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <span className="text-base sm:text-lg">{'🌱'}</span>
          <span>Upgrade Soil</span>
          <span className="bg-black/25 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold text-amber-200">
            🪙 L1–5
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

          // Dynamic Crop Disease & Soil Contamination Status
          const isDiseaseActive = Boolean(plot.disease && plot.disease.stage === 'active');
          const isDiseaseWarning = Boolean(plot.disease && plot.disease.stage === 'warning');
          const isContaminatedDirt = Boolean(plot.isContaminatedDirt);

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
          const moistureSpeedMult = isWithered ? 0.40 : Math.max(0.40, moistureZone.growthSpeedMultiplier);
          const siltSpeedMult = (plot.alluvialSiltCyclesRemaining && plot.alluvialSiltCyclesRemaining > 0) ? 1.20 : 1.0;

          const isHovered = hoveredPlotId === plot.id;

          const progress = plot.crop && plot.plantedAt && !plot.ready
            ? (plot.growthProgress !== undefined
                ? plot.growthProgress
                : Math.min(1, ((Date.now() - plot.plantedAt) * soilSpeedMult * waterMult * moistureSpeedMult * siltSpeedMult) / (CROPS[plot.crop].growTimeSec * 1000)))
            : 0;
          const currentGrowthSpeed = plot.growthSpeedMultiplier ?? (moistureSpeedMult * soilSpeedMult * waterMult);

          // Soil styling classes with hydrological dynamics
          let soilClasses = '';
          if (hasBlight) {
            soilClasses = 'bg-purple-950/70 border-purple-500 animate-pulse ring-2 ring-purple-400 shadow-lg shadow-purple-500/40 cursor-pointer text-white';
          } else if (isDiseaseActive) {
            if (plot.disease?.type === 'root_rot') {
              soilClasses = 'bg-gradient-to-br from-[#121f28] to-[#0a1217] border-amber-500 ring-2 ring-amber-400/80 shadow-lg shadow-amber-950/70 cursor-pointer text-amber-200 animate-pulse';
            } else if (plot.disease?.type === 'foliar_mildew') {
              soilClasses = 'bg-gradient-to-br from-[#2a2d2f] to-[#1e2022] border-stone-300 ring-2 ring-stone-200/80 shadow-lg shadow-stone-900/60 cursor-pointer text-stone-100';
            } else {
              soilClasses = 'bg-gradient-to-br from-[#2b1f14] to-[#1c1209] border-rose-600 ring-2 ring-rose-500/80 shadow-lg shadow-rose-950/70 cursor-pointer text-rose-200 animate-pulse';
            }
          } else if (isDiseaseWarning) {
            soilClasses = 'bg-stone-900 border-amber-400 ring-2 ring-amber-400/90 shadow-lg shadow-amber-500/40 cursor-pointer text-amber-200 animate-pulse';
          } else if (isEmpty && isContaminatedDirt) {
            soilClasses = 'bg-gradient-to-br from-[#2c1d1d] via-[#241515] to-[#180c0c] border-rose-500 ring-2 ring-rose-500/70 shadow-inner cursor-pointer text-rose-300';
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
            soilClasses = 'bg-[#3b2716] dark:bg-[#2c1d10] border-emerald-400/80 ring-2 ring-emerald-400/40 shadow-md shadow-emerald-950/40 text-stone-100 cursor-pointer';
          } else if (moistureZone.id === 'waterlogged' || moistureZone.id === 'saturated') {
            // Saturated soil
            soilClasses = 'bg-[#2b2724] dark:bg-[#1e1c1b] border-cyan-400/70 ring-1 ring-cyan-400/40 text-cyan-200 cursor-pointer';
          } else if (moistureZone.id === 'desiccated') {
            // Desiccated earth: dusty cracked pale soil
            soilClasses = 'bg-[#e8d5be] dark:bg-stone-900/80 border-rose-500/60 ring-1 ring-rose-400/40 text-rose-300 cursor-pointer';
          } else if (isGrowing) {
            soilClasses = 'bg-[#eedbc5]/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 hover:border-cyan-400 cursor-pointer';
          } else {
            // Empty plot dirt appearance: Rich dark damp brown soil
            soilClasses = 'bg-gradient-to-br from-[#2f1b0c] via-[#3d2410] to-[#201206] border-[#663b1a] text-amber-100 shadow-md hover:border-amber-400 cursor-pointer';
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
            } else if (isDiseaseActive || isDiseaseWarning) {
              setActiveActionPlotId(prev => prev === plot.id ? null : plot.id);
            } else if (isEmpty && isContaminatedDirt) {
              setActiveActionPlotId(prev => prev === plot.id ? null : plot.id);
            } else if (isReady) {
              harvestPlot(plot.id);
            } else if (isEmpty) {
              plantCrop(plot.id, selectedCrop);
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
                  {/* Soil Moisture Zone Pill */}
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
                  </div>

                  {/* Hydration Sparkle Badge: ⚡ 2x Speed */}
                  {isWatered && (
                    <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.2 rounded-md bg-cyan-600/90 text-white text-[8px] sm:text-[9px] font-black border border-cyan-300 shadow-sm animate-pulse z-10">
                      <span>⚡</span>
                      <span>2x Speed</span>
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

                  {/* Progress bar for growing crops (Progression with Drag) */}
                  {isGrowing && plot.crop && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-stone-900/80 border-t border-stone-800/60 overflow-visible z-20">
                      <div
                        className={`h-full rounded-r transition-all duration-300 ${
                          currentGrowthSpeed >= 0.95
                            ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_8px_rgba(34,197,94,0.7)]'
                            : currentGrowthSpeed >= 0.65
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-400 bg-[linear-gradient(45deg,rgba(0,0,0,0.25)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.25)_50%,rgba(0,0,0,0.25)_75%,transparent_75%,transparent)] bg-[length:8px_8px] animate-pulse border-r border-yellow-300'
                            : 'bg-gradient-to-r from-amber-600 to-amber-700 shadow-[0_0_8px_rgba(217,119,6,0.8)]'
                        }`}
                        style={{ width: `${Math.max(3, progress * 100)}%` }}
                        title={`Speed: ${currentGrowthSpeed.toFixed(2)}x (${currentGrowthSpeed < 0.65 ? 'Sluggish: Soggy Soil' : currentGrowthSpeed < 0.95 ? 'Mild Delay' : 'Optimal Speed'})`}
                      />
                      {currentGrowthSpeed < 0.65 && (
                        <span className="absolute -top-3.5 right-0.5 text-[10px] leading-none animate-bounce z-25 pointer-events-none" title="Sluggish: Soggy Soil (0.4x Speed Drag)">
                          🐌
                        </span>
                      )}
                    </div>
                  )}

                  {isEmpty && (
                    isContaminatedDirt ? (
                      <div className="flex flex-col items-center select-none text-center p-1">
                        <span className="text-2xl animate-pulse">☣️</span>
                        <span className="text-[8px] font-black uppercase text-rose-300 bg-rose-950/90 px-1 py-0.5 rounded border border-rose-500/60 mt-0.5">
                          Contaminated Dirt
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1 justify-center z-40" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => solarizePlotBed(plot.id)}
                            className="px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 text-[8px] font-black cursor-pointer shadow-md"
                            title="Solarize soil with clear tarp to eradicate lingering pathogens"
                          >
                            ☀️ Solarize
                          </button>
                          <button
                            type="button"
                            onClick={() => curePlotDisease(plot.id, 'apply_lime')}
                            className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[8px] font-black cursor-pointer shadow-md border border-rose-400"
                            title="Apply Slaked Lime to neutralize soil bed"
                          >
                            ☣️ Lime
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center select-none">
                        <span className="text-2xl filter drop-shadow">
                          {isWatered ? '💧' : '🌱'}
                        </span>
                        <span className="text-[9px] font-bold mt-0.5 text-amber-200/90">
                          {isWatered ? 'Moist Soil' : 'Ready to Plant'}
                        </span>
                      </div>
                    )
                  )}

                  {/* Drag & Hover Visual Stamp / Pre-Plant Previews */}
                  {isEmpty && isHovered && (
                    <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[1px] flex flex-col items-center justify-center p-1 animate-in fade-in duration-150">
                      <div className="px-2 py-1 rounded-lg bg-emerald-950/95 border-2 border-emerald-400 text-emerald-300 text-[10px] sm:text-xs font-black shadow-xl flex items-center gap-1 animate-pulse">
                        <span>{previewCrop.emoji}</span>
                        <span>Plant {previewCrop.name}</span>
                      </div>
                      <span className="text-[8px] font-bold text-emerald-300/90 mt-0.5">
                        {previewCrop.growTimeSec}s · +{previewCrop.yieldCount} Harvest
                      </span>
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
                        title="Apply Universal Bio-Dressing: restores soil & clears negative modifiers (Uses 1 dose or auto-buys for 10 Favor / 25 Coins)"
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
                    <div className="absolute inset-0 z-35 bg-stone-950/94 backdrop-blur-[2px] flex flex-col items-center justify-center p-1 text-center animate-in fade-in duration-150 select-none pointer-events-none">
                      <span className="text-xl sm:text-2xl animate-pulse">
                        {currentGrowthSpeed < 0.65 ? '🐌' : (plot.isHeatWilted ? '🥀' : (plot.phenologyBadgeEmoji || '🌱'))}
                      </span>
                      <div className={`mt-0.5 px-1.5 py-0.5 rounded-lg border text-[8px] sm:text-[9px] font-black leading-tight shadow-lg max-w-[95%] ${
                        currentGrowthSpeed < 0.65
                          ? 'bg-amber-950 text-amber-200 border-amber-400 animate-pulse'
                          : currentGrowthSpeed < 0.95
                          ? 'bg-yellow-950 text-yellow-200 border-yellow-400'
                          : 'bg-emerald-950 text-emerald-200 border-emerald-400'
                      }`}>
                        {plot.weatherModifierText || plot.phenologyBadgeText || `Growth Velocity: ${currentGrowthSpeed.toFixed(2)}x`}
                      </div>
                      {/* Expected Yield Outlook Inspection Badge */}
                      <div className={`mt-1 px-1.5 py-0.5 rounded border text-[7.5px] sm:text-[8px] font-black leading-tight max-w-[95%] shadow-md ${
                        plot.harvestGrade === 'B'
                          ? 'bg-amber-950/90 border-amber-400 text-amber-200'
                          : plot.harvestGrade === 'C'
                          ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                          : 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                      }`}>
                        {plot.harvestGrade === 'B'
                          ? 'Current Outlook: 📦 Grade B (Standard) — Aerate to save Grade A!'
                          : plot.harvestGrade === 'C'
                          ? 'Current Outlook: ⚠️ Grade C (Stunted) — Heavy Soil Stress!'
                          : 'Current Outlook: 🌟 Grade A (Pristine) — 3x Items & Seed Return!'}
                      </div>
                      <span className="text-[8px] font-bold text-stone-300 mt-0.5">
                        {`Progress: ${Math.round(progress * 100)}% (${currentGrowthSpeed.toFixed(2)}x spd)`}
                      </span>
                    </div>
                  )}

                  {/* Expected Yield Outlook Badge (Always visible on plot during growth) */}
                  {isGrowing && (
                    <span
                      className={`absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-black z-20 border shadow-xs ${
                        plot.harvestGrade === 'C'
                          ? 'bg-rose-950/90 border-rose-500/80 text-rose-300'
                          : plot.harvestGrade === 'B'
                          ? 'bg-amber-950/90 border-amber-400/80 text-amber-300'
                          : 'bg-emerald-950/90 border-emerald-400/80 text-emerald-300'
                      }`}
                      title={
                        plot.harvestGrade === 'B'
                          ? 'Current Outlook: 📦 Grade B (Standard) — Aerate to save Grade A!'
                          : plot.harvestGrade === 'C'
                          ? 'Current Outlook: ⚠️ Grade C (Stunted) — Heavy Stress'
                          : 'Current Outlook: 🌟 Grade A (Pristine) — 3x Items & Seed Return'
                      }
                    >
                      {plot.harvestGrade === 'B' ? '📦 Grade B' : plot.harvestGrade === 'C' ? '⚠️ Grade C' : '🌟 Grade A'}
                    </span>
                  )}

                  {/* Early Disease Risk Amber Alert Badge */}
                  {isDiseaseWarning && plot.disease && (
                    <div className="absolute top-1 left-1 flex items-center gap-1 z-30 pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-amber-500 text-stone-950 border border-amber-200 shadow-md animate-bounce flex items-center gap-0.5">
                        <span>⚠️</span>
                        <span>Risk ({Math.round(plot.disease.warningTimerSec)}s)</span>
                      </span>
                    </div>
                  )}

                  {/* Active Inspection Card (Hover or Click) */}
                  {(isDiseaseActive || isDiseaseWarning) && plot.disease && (activeActionPlotId === plot.id || isHovered) && (
                    <div
                      className="absolute -top-14 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center bg-stone-950/98 border-2 border-amber-400 p-2 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none whitespace-nowrap min-w-[210px]"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between w-full gap-2 border-b border-stone-700/80 pb-1 mb-1">
                        <span className="text-[10px] font-black text-amber-300 flex items-center gap-1">
                          <span>{plot.disease.emoji}</span>
                          <span>{plot.disease.name}</span>
                        </span>
                        <span className="text-[9px] font-mono font-bold text-rose-400">
                          ⏱️ {Math.round(plot.disease.timeRemainingSec || plot.disease.warningTimerSec)}s
                        </span>
                      </div>

                      <div className="text-[8px] text-stone-300 leading-tight mb-1 text-center w-full">
                        <span className="text-stone-400">Cause:</span> <span className="font-semibold text-amber-200">{plot.disease.causeDescription}</span>
                      </div>

                      <div className="flex items-center gap-1 w-full justify-center mt-0.5">
                        {plot.disease.type === 'root_rot' && (
                          <button
                            type="button"
                            onClick={() => curePlotDisease(plot.id, 'dig_drain')}
                            className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[9px] font-black cursor-pointer shadow-md border border-teal-300 flex items-center gap-1 active:scale-95"
                            title="Slice an emergency drainage ditch or till bed with Hand Hoe (Boosts O2 > 50%)"
                          >
                            <span>🪱</span>
                            <span>[ Dig Drain ]</span>
                          </button>
                        )}

                        {plot.disease.type === 'foliar_mildew' && (
                          <button
                            type="button"
                            onClick={() => curePlotDisease(plot.id, 'prune_mildew')}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black cursor-pointer shadow-md border border-emerald-300 flex items-center gap-1 active:scale-95"
                            title="Prune diseased leaves with Shears & apply milk wash"
                          >
                            <span>✂️</span>
                            <span>[ Prune Foliage ]</span>
                          </button>
                        )}

                        {plot.disease.type === 'bacterial_soft_rot' && (
                          <button
                            type="button"
                            onClick={() => curePlotDisease(plot.id, 'apply_lime')}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black cursor-pointer shadow-md border border-rose-300 flex items-center gap-1 active:scale-95"
                            title="Dress dirt with Slaked Lime / Bio-Char to neutralize pathogens"
                          >
                            <span>☣️</span>
                            <span>[ Apply Lime ]</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => clearDiseasedCrop(plot.id)}
                          className="px-1.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-rose-300 text-[8px] font-bold border border-stone-600 cursor-pointer shadow-sm active:scale-95"
                          title="Remove ruined plant with Hand Hoe"
                        >
                          <span>🧹 Clear</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isGrowing && plot.crop && (
                    <div className="flex flex-col items-center">
                      {isDiseaseActive && plot.disease ? (
                        <>
                          <div className="relative">
                            <span className="text-xl opacity-60 grayscale filter">{CROPS[plot.crop].emoji}</span>
                            <span className="absolute -top-1 -right-2 text-base animate-bounce">{plot.disease.emoji}</span>
                          </div>
                          <span className="text-[9px] font-black text-rose-300 bg-rose-950/90 px-1 py-0.2 rounded border border-rose-500/60 mt-0.5 animate-pulse">
                            {plot.disease.type === 'root_rot' ? 'Root Rot' : plot.disease.type === 'foliar_mildew' ? 'Mildew Spores' : 'Soft Rot'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">{CROPS[plot.crop].emoji}</span>
                          <span className={`text-[10px] font-semibold mt-0.5 ${
                            currentGrowthSpeed < 0.65
                              ? 'text-amber-400 font-bold'
                              : currentGrowthSpeed < 0.95
                              ? 'text-yellow-300 font-semibold'
                              : isWatered ? 'text-cyan-300' : 'text-emerald-400 dark:text-emerald-300'
                          }`}>
                            {currentGrowthSpeed < 0.65
                              ? `🐌 ${Math.round(progress * 100)}%`
                              : plot.isHeatWilted
                              ? `🥀 ${Math.round(progress * 100)}%`
                              : `${Math.round(progress * 100)}%`}
                          </span>
                        </>
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
                  {plot.crop && (
                    (() => {
                      const isNative = plot.phenologyBadgeEmoji === '✨' || (plot.phenologyBadgeText && plot.phenologyBadgeText.includes('In Native Element'));
                      const isStrain = currentGrowthSpeed < 0.65 || (plot.phenologyBadgeText && plot.phenologyBadgeText.includes('Weather Strain'));
                      
                      const badgeClasses = isNative
                        ? 'bg-gradient-to-r from-amber-500/90 via-yellow-400/90 to-amber-600/90 border-yellow-200 text-stone-950 font-black shadow-lg shadow-yellow-500/50 animate-pulse ring-1 ring-yellow-300'
                        : isStrain
                        ? 'bg-amber-950/95 border-amber-500/90 text-amber-200 font-bold shadow-md shadow-amber-900/40 ring-1 ring-amber-600/60'
                        : 'bg-stone-900/90 border-stone-700/80 text-amber-200 font-bold';

                      const badgeIcon = isNative ? '✨' : (isStrain ? '🌧️' : (plot.phenologyBadgeEmoji || '🌱'));
                      const badgeTitle = isNative
                        ? `✨ In Native Element: ${(plot.growthSpeedMultiplier || 1.3).toFixed(1)}× Speed | Grade A Locked`
                        : isStrain
                        ? '🌧️ Weather Strain: 0.5× Speed | Protect via Trench/Cover'
                        : (plot.weatherModifierText || plot.phenologyBadgeText || 'Normal');

                      const displayText = isNative
                        ? 'Native 1.3x'
                        : isStrain
                        ? 'Strain 0.5x'
                        : (plot.weatherModifierText?.split(':')[0]?.trim() || plot.phenologyBadgeText?.split('(')[0]?.trim() || 'Standard');

                      return (
                        <span
                          className={`absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] border z-10 backdrop-blur-xs ${badgeClasses}`}
                          title={badgeTitle}
                        >
                          <span>{badgeIcon}</span>
                          <span className="truncate max-w-[70px] hidden xs:inline font-mono">
                            {displayText}
                          </span>
                        </span>
                      );
                    })()
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
