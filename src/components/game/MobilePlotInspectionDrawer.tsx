'use client';

import React from 'react';
import type { Plot } from '@/game/data';
import { CROPS, type CropId } from '@/game/data';
import { getSoilTier } from '@/game/plotUpgrades';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface MobilePlotInspectionDrawerProps {
  plot: Plot | null;
  isOpen: boolean;
  onClose: () => void;
  onHarvest?: (id: number) => void;
  onPlant?: (id: number) => void;
  onCure?: (id: number) => void;
  onClearWithered?: (id: number) => void;
  onUpgradeSoil?: (id: number) => void;
}

export function MobilePlotInspectionDrawer({
  plot,
  isOpen,
  onClose,
  onHarvest,
  onPlant,
  onCure,
  onClearWithered,
  onUpgradeSoil,
}: MobilePlotInspectionDrawerProps) {
  if (!plot) return null;

  const crop = plot.crop ? CROPS[plot.crop as CropId] : null;
  const soilTier = getSoilTier(plot.level || 1);
  const isReady = plot.stage === 'ready';
  const isGrowing = plot.stage === 'growing';
  const isEmpty = plot.stage === 'empty';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[70vh] rounded-t-3xl p-4 bg-stone-900 border-t border-stone-700 text-stone-100 flex flex-col"
      >
        <div className="w-10 h-1.5 rounded-full bg-stone-600 mx-auto mb-2 flex-shrink-0" />

        <SheetHeader className="p-0 border-b border-stone-800 pb-2">
          <SheetTitle className="text-base font-bold text-stone-100 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>🌱 Plot #{plot.id + 1}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                Tier {plot.level || 1} ({soilTier.name})
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="py-3 space-y-3 flex-1 overflow-y-auto">
          {crop ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-800/80 border border-stone-700">
              <span className="text-3xl">{crop.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-stone-200">{crop.name}</div>
                <div className="text-xs text-stone-400 capitalize">
                  Status: {plot.isWithered ? '🥀 Withered' : isReady ? '✨ Ready for Harvest' : '🌱 Growing'}
                </div>
                {plot.harvestGrade && (
                  <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                    Projected Grade: Tier {plot.harvestGrade}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-stone-800/50 border border-dashed border-stone-700 text-center text-xs text-stone-400">
              Plot is tilled and ready for seed planting.
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Moisture</span>
              <span className="text-sky-300 font-bold text-sm">{Math.round(plot.moisture || 0)}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-700">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Nitrogen Nutrients</span>
              <span className="text-emerald-300 font-bold text-sm">{Math.round(plot.nitrogen || 0)}%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {isReady && onHarvest && (
              <button
                type="button"
                onClick={() => {
                  onHarvest(plot.id);
                  onClose();
                }}
                className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🌾</span> Harvest Crop
              </button>
            )}

            {plot.isWithered && onClearWithered && (
              <button
                type="button"
                onClick={() => {
                  onClearWithered(plot.id);
                  onClose();
                }}
                className="py-3 px-3 rounded-xl bg-rose-700 hover:bg-rose-600 font-bold text-xs text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🥀</span> Clear Withered
              </button>
            )}

            {isEmpty && onPlant && (
              <button
                type="button"
                onClick={() => {
                  onPlant(plot.id);
                  onClose();
                }}
                className="py-3 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🌱</span> Plant Selected
              </button>
            )}

            {onUpgradeSoil && (
              <button
                type="button"
                onClick={() => {
                  onUpgradeSoil(plot.id);
                  onClose();
                }}
                className="py-3 px-3 rounded-xl bg-stone-700 hover:bg-stone-600 font-bold text-xs text-stone-200 border border-stone-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🪴</span> Soil Upgrades
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
