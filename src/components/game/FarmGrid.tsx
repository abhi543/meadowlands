'use client';

import { useGameStore } from '@/game/store';
import { CROPS, type CropId } from '@/game/data';
import { useState } from 'react';
import { FarmWell } from './FarmWell';

const CROP_LIST = Object.values(CROPS);

export function FarmGrid() {
  const {
    plots,
    unlockedPlots,
    plantCrop,
    harvestPlot,
    plantAllCrops,
    harvestAllPlots,
    waterPlot,
    waterLevel,
    silo,
    coins,
    systemicEvent,
    extinguishBrushfire,
    captureLocust,
    relics,
    activeCrisis,
    resolveCrisisDefense,
  } = useGameStore();
  const [selectedCrop, setSelectedCrop] = useState<CropId>('wheat');

  const visiblePlots = plots.slice(0, unlockedPlots);

  // Count ready and empty plots for batch actions
  const readyCount = visiblePlots.filter(p => p.crop && p.ready).length;
  const emptyCount = visiblePlots.filter(p => !p.crop).length;
  const selectedCropDef = CROPS[selectedCrop];
  const totalPlantCost = emptyCount * selectedCropDef.seedCost;
  const canAffordPlantAll = selectedCropDef.seedCost === 0 || coins >= totalPlantCost;

  return (
    <div className="space-y-3.5">
      {/* Interactive Farm Well HUD */}
      <FarmWell />

      {/* Crop Selector Toolbar */}
      <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-2 border border-amber-200 dark:border-amber-800">
        <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1">
          {'🌱'} Select Crop & Tap Plot to Plant
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CROP_LIST.map(crop => (
            <button
              key={crop.id}
              onClick={() => setSelectedCrop(crop.id)}
              className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                selectedCrop === crop.id
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-amber-100 dark:hover:bg-amber-900/30'
              }`}
            >
              {crop.emoji} {crop.name}
              {crop.seedCost > 0 && <span className="text-xs opacity-70 ml-1">{'💰'}{crop.seedCost}</span>}
            </button>
          ))}
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
      <div className="flex gap-2 flex-wrap">
        {/* Harvest All */}
        <button
          onClick={() => harvestAllPlots()}
          disabled={readyCount === 0}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 flex items-center justify-center gap-2 ${
            readyCount > 0
              ? 'bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg shadow-green-200/50 active:scale-95'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed'
          }`}
        >
          <span className="text-lg">{'🌾'}</span>
          Harvest All
          {readyCount > 0 && (
            <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-xs font-bold">
              {readyCount}
            </span>
          )}
        </button>

        {/* Plant All */}
        <button
          onClick={() => plantAllCrops(selectedCrop)}
          disabled={emptyCount === 0 || !canAffordPlantAll}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 flex items-center justify-center gap-2 ${
            emptyCount > 0 && canAffordPlantAll
              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-200/50 active:scale-95'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 cursor-not-allowed'
          }`}
        >
          <span className="text-lg">{'🌱'}</span>
          Plant All {selectedCropDef.emoji}
          {emptyCount > 0 && (
            <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-xs font-bold">
              {emptyCount}
            </span>
          )}
          {totalPlantCost > 0 && (
            <span className="text-xs opacity-80">{'💰'}{totalPlantCost}</span>
          )}
        </button>
      </div>

      {/* Farm Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {visiblePlots.map(plot => {
          const isReady = plot.ready;
          const isGrowing = plot.crop && !plot.ready;
          const isEmpty = !plot.crop;
          const isWatered = Boolean(plot.isWatered);

          const hasBlight = activeCrisis?.type === 'crop_blight' &&
            activeCrisis?.resolvedStatus === 'pending' &&
            (activeCrisis?.targetIds.includes(plot.id) || activeCrisis?.targetIds.includes(String(plot.id)));

          const isOnFire = systemicEvent?.id === 'barn_fire' &&
            systemicEvent?.phase === 'active' &&
            systemicEvent?.activeFirePositions?.includes(plot.id);

          const hasLocust = systemicEvent?.id === 'locust_swarm' &&
            systemicEvent?.phase === 'active' &&
            systemicEvent?.locustPlotIds?.includes(plot.id);

          const progress = plot.crop && plot.plantedAt && !plot.ready
            ? Math.min(1, (Date.now() - plot.plantedAt) / (CROPS[plot.crop].growTimeSec * 1000))
            : 0;

          // Soil styling classes
          let soilClasses = '';
          if (hasBlight) {
            soilClasses = 'bg-purple-950/70 border-purple-500 animate-pulse ring-2 ring-purple-400 shadow-lg shadow-purple-500/40 cursor-pointer text-white';
          } else if (isOnFire) {
            soilClasses = 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 animate-pulse ring-2 ring-rose-400 shadow-lg shadow-rose-500/30 cursor-pointer';
          } else if (hasLocust) {
            soilClasses = 'bg-amber-100 dark:bg-amber-950/60 border-amber-600 animate-bounce ring-2 ring-amber-500 shadow-md cursor-pointer';
          } else if (isReady) {
            soilClasses = isWatered
              ? 'bg-[#3d2817] dark:bg-[#2b1c10] border-emerald-400 ring-2 ring-cyan-400/50 hover:scale-105 shadow-lg shadow-emerald-500/20 cursor-pointer text-white'
              : 'bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 hover:scale-105 shadow-green-200/50 shadow-lg cursor-pointer';
          } else if (isWatered) {
            // Watered soil: Dark, rich brown soil with blue sparkle badge
            soilClasses = 'bg-[#3b2716] dark:bg-[#2c1d10] border-cyan-400/80 ring-2 ring-cyan-400/40 shadow-md shadow-cyan-950/40 text-stone-100 cursor-pointer';
          } else if (isGrowing) {
            // Dry growing soil: Standard light-tan soil texture
            soilClasses = 'bg-[#eedbc5]/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 hover:border-cyan-400 cursor-pointer';
          } else {
            // Dry empty plot: Standard light-tan soil texture
            soilClasses = 'bg-[#f4e8d8]/80 dark:bg-stone-900/40 border-stone-300 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-100/40 cursor-pointer';
          }

          const handlePlotClick = () => {
            if (hasBlight) {
              resolveCrisisDefense('quarantine', plot.id);
            } else if (isOnFire) {
              extinguishBrushfire(plot.id);
            } else if (hasLocust) {
              captureLocust(plot.id);
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
            <button
              key={plot.id}
              onClick={handlePlotClick}
              className={`relative aspect-square rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center overflow-hidden ${soilClasses}`}
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
              ) : (
                <>
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
                    <div className="flex flex-col items-center">
                      <span className="text-2xl opacity-40">
                        {isWatered ? '💧' : '🟫'}
                      </span>
                      <span className="text-[9px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {isWatered ? 'Moist Soil' : 'Dry Soil'}
                      </span>
                    </div>
                  )}

                  {isGrowing && plot.crop && (
                    <div className="flex flex-col items-center">
                      <span className="text-xl">{CROPS[plot.crop].emoji}</span>
                      <span className={`text-[10px] font-semibold mt-0.5 ${
                        isWatered ? 'text-cyan-300' : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        {Math.round(progress * 100)}%
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
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Silo summary */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="font-semibold text-stone-600 dark:text-stone-400">Silo:</span>
        {Object.entries(silo).filter(([, v]) => v > 0).map(([k, v]) => (
          <span key={k} className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full text-stone-700 dark:text-stone-300">
            {k in CROPS ? CROPS[k as CropId].emoji : '🪹'} {v}
          </span>
        ))}
      </div>
    </div>
  );
}
