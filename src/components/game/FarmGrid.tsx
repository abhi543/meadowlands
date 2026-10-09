'use client';

import { useGameStore } from '@/game/store';
import { CROPS, type CropId } from '@/game/data';
import { useState } from 'react';

const CROP_LIST = Object.values(CROPS);

export function FarmGrid() {
  const { plots, unlockedPlots, plantCrop, harvestPlot, silo } = useGameStore();
  const [selectedCrop, setSelectedCrop] = useState<CropId>('wheat');

  const visiblePlots = plots.slice(0, unlockedPlots);

  return (
    <div className="space-y-3">
      {/* Crop Selector Toolbar */}
      <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-2 border border-amber-200 dark:border-amber-800">
        <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1">
          {'\u{1F331}'} Select Crop & Tap Plot to Plant
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
              {crop.seedCost > 0 && <span className="text-xs opacity-70 ml-1">{'\u{1F4B0}'}{crop.seedCost}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Farm Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {visiblePlots.map(plot => {
          const isReady = plot.ready;
          const isGrowing = plot.crop && !plot.ready;
          const isEmpty = !plot.crop;

          const progress = plot.crop && plot.plantedAt && !plot.ready
            ? Math.min(1, (Date.now() - plot.plantedAt) / (CROPS[plot.crop].growTimeSec * 1000))
            : 0;

          return (
            <button
              key={plot.id}
              onClick={() => {
                if (isReady) harvestPlot(plot.id);
                else if (isEmpty) plantCrop(plot.id, selectedCrop);
              }}
              className={`relative aspect-square rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center overflow-hidden ${
                isReady
                  ? 'bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 hover:scale-105 shadow-green-200/50 shadow-lg cursor-pointer'
                  : isGrowing
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 cursor-default'
                  : 'bg-stone-50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer'
              }`}
            >
              {/* Progress bar for growing crops */}
              {isGrowing && plot.crop && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-amber-100 dark:bg-amber-900">
                  <div
                    className="h-full bg-amber-400 dark:bg-amber-500 rounded-r transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              )}

              {isEmpty && (
                <span className="text-2xl opacity-30">{'\u{1F7EB}'}</span>
              )}

              {isGrowing && plot.crop && (
                <div className="flex flex-col items-center">
                  <span className="text-xl">{CROPS[plot.crop].emoji}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
              )}

              {isReady && plot.crop && (
                <div className="flex flex-col items-center animate-bounce">
                  <span className="text-2xl">{CROPS[plot.crop].emoji}</span>
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400">{'\u2702\uFE0F'} Harvest</span>
                </div>
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
            {k in CROPS ? CROPS[k as CropId].emoji : '\u{1FAD9}'} {v}
          </span>
        ))}
      </div>
    </div>
  );
}
