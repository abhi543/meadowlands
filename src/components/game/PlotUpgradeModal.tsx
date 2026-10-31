'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  PLOT_SOIL_TIERS,
  getSoilTier,
  getPlotUnlockCost,
  MAX_PLOT_SOIL_LEVEL,
  MAX_FARM_PLOTS,
  type PlotSoilTierInfo,
} from '@/game/plotUpgrades';

interface PlotUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlotId?: number | null;
}

export function PlotUpgradeModal({ isOpen, onClose, selectedPlotId: initialPlotId }: PlotUpgradeModalProps) {
  const {
    plots,
    unlockedPlots,
    coins,
    upgradePlotLevel,
    upgradeAllPlots,
    unlockNextPlot,
  } = useGameStore();

  const [activePlotId, setActivePlotId] = useState<number>(initialPlotId ?? 0);
  const [activeTab, setActiveTab] = useState<'soil' | 'expansion'>('soil');

  if (!isOpen) return null;

  const currentPlot = plots[activePlotId] || plots[0];
  const plotLevel = currentPlot?.level || 1;
  const currentTier = getSoilTier(plotLevel);
  const isMaxPlotLevel = plotLevel >= MAX_PLOT_SOIL_LEVEL;
  const nextTier: PlotSoilTierInfo | null = isMaxPlotLevel ? null : getSoilTier(plotLevel + 1);

  const canUnlockMore = unlockedPlots < MAX_FARM_PLOTS;
  const nextPlotUnlockCost = getPlotUnlockCost(unlockedPlots);
  const canAffordUnlock = coins >= nextPlotUnlockCost;

  // Batch upgrade calculation
  const visiblePlots = plots.slice(0, unlockedPlots);
  const minLvl = Math.min(...visiblePlots.map(p => p.level || 1));
  const isAllMaxLevel = minLvl >= MAX_PLOT_SOIL_LEVEL;
  const lowestTierPlots = visiblePlots.filter(p => (p.level || 1) === minLvl);
  const nextBatchTier = isAllMaxLevel ? null : getSoilTier(minLvl + 1);
  const totalBatchCost = nextBatchTier ? lowestTierPlots.length * nextBatchTier.upgradeCostCoins : 0;
  const canAffordBatch = coins >= totalBatchCost && totalBatchCost > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-2xl bg-stone-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] text-stone-100 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-stone-600 mx-auto mt-2 mb-1 flex-shrink-0" />

        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950/80 via-stone-900 to-stone-950 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">🌱</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                Farmland Soil &amp; Plot Upgrades
              </h2>
              <p className="text-xs text-stone-400">
                Enhance soil fertility with coins for faster growth, bonus yields, and unlock new farm plots.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-stone-950 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs flex items-center gap-1 shadow-inner">
              <span>🪙</span>
              <span>{coins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-800 bg-stone-950/50 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('soil')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'soil'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <span>✨</span>
            <span>Soil Quality Tiers (Levels 1–5)</span>
          </button>
          <button
            onClick={() => setActiveTab('expansion')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'expansion'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <span>🗺️</span>
            <span>Plot Expansion ({unlockedPlots}/{MAX_FARM_PLOTS})</span>
            {canUnlockMore && canAffordUnlock && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {activeTab === 'soil' ? (
            <>
              {/* Plot Selector Strip */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-300 flex items-center gap-1.5">
                    <span>📌</span> Select Plot to Upgrade:
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Plot #{activePlotId + 1} Selected ({currentTier.emoji} {currentTier.name})
                  </span>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 p-2 bg-stone-950/70 rounded-xl border border-stone-800">
                  {visiblePlots.map((p) => {
                    const isSelected = p.id === activePlotId;
                    const tier = getSoilTier(p.level || 1);
                    return (
                      <button
                        key={p.id}
                        onClick={() => setActivePlotId(p.id)}
                        className={`p-1.5 rounded-lg border flex flex-col items-center justify-center transition-all text-center relative ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 shadow-sm'
                            : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                        title={`Plot #${p.id + 1} · Level ${p.level || 1} (${tier.name})`}
                      >
                        <span className="text-xs">{tier.emoji}</span>
                        <span className="text-[9px] font-mono font-bold mt-0.5">#{p.id + 1}</span>
                        <span className="text-[8px] opacity-75 font-black text-amber-400">L{p.level || 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Single Plot Upgrade Card */}
              <div className="rounded-xl border border-stone-800 bg-gradient-to-b from-stone-950/80 to-stone-900 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                      {currentTier.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-stone-100">
                          Plot #{activePlotId + 1}: {currentTier.name}
                        </h3>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${currentTier.badgeColor}`}>
                          Tier {currentTier.level} / {MAX_PLOT_SOIL_LEVEL}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {currentTier.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current vs Next Tier Comparison */}
                {!isMaxPlotLevel && nextTier && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80 space-y-1">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Current Status (Lvl {currentTier.level}):
                      </div>
                      <div className="text-stone-300 font-semibold flex items-center gap-1.5">
                        <span>{currentTier.emoji}</span>
                        <span>{currentTier.perkSummary}</span>
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {currentTier.speedBonusPct > 0 ? `+${currentTier.speedBonusPct}% Growth Speed` : 'Base Speed'}
                      </div>
                    </div>

                    <div className="bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/40 space-y-1">
                      <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Next Upgrade (Lvl {nextTier.level}):</span>
                        <span>🪙 {nextTier.upgradeCostCoins}</span>
                      </div>
                      <div className="text-amber-200 font-bold flex items-center gap-1.5">
                        <span>{nextTier.emoji}</span>
                        <span>{nextTier.perkSummary}</span>
                      </div>
                      <div className="text-[11px] text-amber-300/80">
                        {nextTier.description}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upgrade Button */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  {isMaxPlotLevel ? (
                    <div className="w-full py-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-purple-300 font-bold text-xs text-center flex items-center justify-center gap-2">
                      <span>✨</span>
                      <span>Maximum Soil Quality Reached (Celestial Soil)!</span>
                    </div>
                  ) : nextTier ? (
                    <button
                      onClick={() => upgradePlotLevel(activePlotId)}
                      disabled={coins < nextTier.upgradeCostCoins}
                      className={`w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                        coins >= nextTier.upgradeCostCoins
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/20 active:scale-98 cursor-pointer'
                          : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                      }`}
                    >
                      <span>⭐ Upgrade Plot #{activePlotId + 1} to Level {nextTier.level}</span>
                      <span className="font-mono bg-black/20 px-2 py-0.5 rounded-lg text-xs">
                        🪙 {nextTier.upgradeCostCoins} Coins
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Batch Upgrade Bar */}
              {!isAllMaxLevel && nextBatchTier && (
                <div className="bg-stone-950/90 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>Batch Upgrade All Level {minLvl} Plots ({lowestTierPlots.length} plots)</span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Instantly raise all {lowestTierPlots.length} plots to Level {nextBatchTier.level} ({nextBatchTier.name}).
                    </p>
                  </div>
                  <button
                    onClick={() => upgradeAllPlots()}
                    disabled={!canAffordBatch}
                    className={`py-2 px-3.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
                      canAffordBatch
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer'
                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <span>Upgrade All ({lowestTierPlots.length})</span>
                    <span className="font-mono bg-black/25 px-1.5 py-0.5 rounded text-[11px]">
                      🪙 {totalBatchCost}
                    </span>
                  </button>
                </div>
              )}

              {/* All Tiers Catalog */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Soil Quality Tier Catalog:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.values(PLOT_SOIL_TIERS).map((tier) => (
                    <div
                      key={tier.level}
                      className={`p-2.5 rounded-xl border bg-stone-950/70 space-y-1.5 ${
                        plotLevel === tier.level ? 'border-amber-400/80 ring-1 ring-amber-400/30' : 'border-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-stone-200 flex items-center gap-1.5">
                          <span>{tier.emoji}</span>
                          <span>{tier.name}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {tier.upgradeCostCoins > 0 ? `🪙${tier.upgradeCostCoins}` : 'Free'}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-300 font-semibold">
                        {tier.perkSummary}
                      </div>
                      <p className="text-[10px] text-stone-400 leading-tight">
                        {tier.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Plot Expansion Tab */
            <div className="space-y-4">
              <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-stone-100 flex items-center gap-2">
                      <span>🗺️</span> Farm Plot Capacity &amp; Expansion
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Purchase new farmland plots with coins to plant and harvest larger crop batches simultaneously.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-lg text-amber-300">
                      {unlockedPlots} / {MAX_FARM_PLOTS}
                    </span>
                    <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">
                      Plots Unlocked
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-stone-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(unlockedPlots / MAX_FARM_PLOTS) * 100}%` }}
                  />
                </div>
              </div>

              {/* Next Plot Card */}
              {canUnlockMore ? (
                <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-stone-900 to-stone-950 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
                        🔓
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-stone-100">
                          Unlock Plot #{unlockedPlots + 1}
                        </h4>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Tills fresh soil, instantly ready for planting and automated workforce labor.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-stone-400">Unlock Fee:</div>
                      <div className="font-mono font-bold text-base text-amber-300">
                        🪙 {nextPlotUnlockCost.toLocaleString()} Coins
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => unlockNextPlot()}
                    disabled={!canAffordUnlock}
                    className={`w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                      canAffordUnlock
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 shadow-emerald-500/20 active:scale-98 cursor-pointer'
                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <span>🔓 Unlock Plot #{unlockedPlots + 1}</span>
                    <span className="font-mono bg-black/20 px-2 py-0.5 rounded-lg text-xs">
                      🪙 {nextPlotUnlockCost.toLocaleString()} Coins
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-1">
                  <span className="text-2xl">🏆</span>
                  <h4 className="font-bold text-sm text-emerald-300">
                    Maximum Farm Estate Achieved!
                  </h4>
                  <p className="text-xs text-stone-400 max-w-md mx-auto">
                    All {MAX_FARM_PLOTS} farmland plots have been cleared, tilled, and unlocked. Focus on upgrading Soil Quality Tiers to maximize yield and speed!
                  </p>
                </div>
              )}

              {/* All 24 Plots Status Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Estate Plot Overview:
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {plots.map((plot) => {
                    const isUnlocked = plot.id < unlockedPlots;
                    const tier = getSoilTier(plot.level || 1);
                    return (
                      <div
                        key={plot.id}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center ${
                          isUnlocked
                            ? 'bg-stone-950/80 border-stone-800 text-stone-200'
                            : 'bg-stone-950/40 border-stone-800/40 text-stone-600 opacity-60'
                        }`}
                      >
                        <span className="text-base">{isUnlocked ? tier.emoji : '🔒'}</span>
                        <span className="text-[10px] font-mono font-bold mt-0.5">#{plot.id + 1}</span>
                        <span className="text-[9px] font-semibold text-stone-400">
                          {isUnlocked ? `L${plot.level || 1}` : 'Locked'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
