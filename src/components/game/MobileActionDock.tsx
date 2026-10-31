'use client';

import React from 'react';
import { useGameStore } from '@/game/store';

interface MobileActionDockProps {
  onOpenProduce?: () => void;
  onOpenOrders?: () => void;
  onOpenBarn?: () => void;
  className?: string;
}

export function MobileActionDock({
  onOpenProduce,
  onOpenOrders,
  onOpenBarn,
  className = '',
}: MobileActionDockProps) {
  const harvestAllPlots = useGameStore(s => s.harvestAllPlots);
  const plots = useGameStore(s => s.plots);
  const unlockedPlots = useGameStore(s => s.unlockedPlots);

  const readyCount = plots.slice(0, unlockedPlots).filter(p => p.stage === 'ready' || p.isWithered).length;

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-2xl bg-stone-950/80 backdrop-blur-md border border-stone-700/60 shadow-2xl safe-bottom select-none ${className}`}
    >
      {/* Primary Tap Action: Harvest All */}
      <button
        type="button"
        onClick={() => harvestAllPlots()}
        disabled={readyCount === 0}
        className={`relative min-w-[52px] h-[52px] rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all active:scale-90 touch-manipulation border ${
          readyCount > 0
            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
            : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
        }`}
        title="Harvest All Ready Crops"
      >
        <span className="text-xl leading-none">🌾</span>
        <span className="text-[10px] font-black uppercase mt-0.5">Harvest</span>
        {readyCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black shadow-sm">
            {readyCount}
          </span>
        )}
      </button>

      {/* Quick Action: Barn Inventory */}
      {onOpenBarn && (
        <button
          type="button"
          onClick={onOpenBarn}
          className="min-w-[50px] h-[52px] rounded-xl flex flex-col items-center justify-center font-bold text-xs bg-stone-800/90 hover:bg-stone-700 active:scale-90 text-stone-200 border border-stone-600/50 touch-manipulation"
          title="Open Barn & Storage"
        >
          <span className="text-lg leading-none">🏠</span>
          <span className="text-[10px] mt-0.5">Barn</span>
        </button>
      )}

      {/* Quick Action: Refinery / Produce */}
      {onOpenProduce && (
        <button
          type="button"
          onClick={onOpenProduce}
          className="min-w-[50px] h-[52px] rounded-xl flex flex-col items-center justify-center font-bold text-xs bg-stone-800/90 hover:bg-stone-700 active:scale-90 text-stone-200 border border-stone-600/50 touch-manipulation"
          title="Open Processing & Gas Lab"
        >
          <span className="text-lg leading-none">⚙️</span>
          <span className="text-[10px] mt-0.5">Produce</span>
        </button>
      )}

      {/* Quick Action: Deliveries */}
      {onOpenOrders && (
        <button
          type="button"
          onClick={onOpenOrders}
          className="min-w-[50px] h-[52px] rounded-xl flex flex-col items-center justify-center font-bold text-xs bg-stone-800/90 hover:bg-stone-700 active:scale-90 text-stone-200 border border-stone-600/50 touch-manipulation"
          title="Open Orders & Contracts"
        >
          <span className="text-lg leading-none">🚚</span>
          <span className="text-[10px] mt-0.5">Orders</span>
        </button>
      )}
    </div>
  );
}
