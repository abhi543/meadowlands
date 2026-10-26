'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore, type AnimalInstance } from '@/game/store';
import {
  ANIMALS,
  TIER_COLORS,
  TIER_LABELS,
  BREED_REGISTRY,
  type AnimalSpecies,
  type Tier,
} from '@/game/data';
import { TIER_SECTORS, TOTAL_PASTURE_CAPACITY, type AnimalTier, type SectorConfig } from '@/types/animals';
import { OverclockActionMenu } from './OverclockActionMenu';
import { AnimalProductsQuickReference } from './AnimalProductsQuickReference';
import { resolveWeatherProfileId } from '@/game/hydrologyEngine';
import { WEATHER_PROFILES } from '@/game/weatherEngine';
import { evaluateFaunaWeather, type FaunaWeatherEvaluation } from '@/game/faunaWeatherEngine';
import { getCircadianClock } from '@/game/shiftEngine';
import { getCoatDefinition, getTraitDefinition } from '@/game/livestockGeneticsEngine';

const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
const COSTS: Record<AnimalSpecies, number> = { chicken: 50, cow: 150, sheep: 200, pig: 300 };

const SECTOR_ORDER: AnimalTier[] = ['common', 'uncommon', 'rare', 'legendary'];

const SECTOR_EMOJIS: Record<AnimalTier, string> = {
  common: '🟢',
  uncommon: '🔵',
  rare: '🟣',
  legendary: '🟡',
};

const TIER_BORDER_STYLES: Record<AnimalTier, string> = {
  common: 'border-emerald-300 dark:border-emerald-500/40 shadow-sm shadow-emerald-500/10',
  uncommon: 'border-sky-300 dark:border-sky-500/40 shadow-sm shadow-sky-500/10',
  rare: 'border-purple-300 dark:border-purple-500/40 shadow-sm shadow-purple-500/10',
  legendary: 'border-amber-300 dark:border-amber-500/50 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/30',
};

export function AnimalsTab() {
  const {
    animals,
    silo,
    coins,
    level,
    feedAnimal,
    collectProduct,
    feedAllAnimals,
    collectAllProducts,
    buyAnimal,
    livestockReserve = [],
    moveToPasture,
    moveToReserve,
    sellReserveAnimal,
    unifiedWorkers,
    hireUnifiedWorker,
    toggleUnifiedWorkerMode,
    togglePauseUnifiedWorker,
    isAllWorkersPaused,
    specialistWorkers,
    wranglerPolicy,
    pastureWelfare,
    constructPastureShadeCanopy,
    digMudWallowTrench,
    digDrainageFurrows,
    spreadDryStrawBedding,
    buildElevatedPlatforms,
    toggleBarnDoorsLatched,
    muckOutPens,
    feedCalmingHerbs,
    thawFrozenTroughs,
    repairBrokenFences,
    hydrology,
    prehistoricSanctuary,
    domesticTroughs,
    farmEpochStart = 0,
  } = useGameStore();

  const clock = getCircadianClock(Date.now(), farmEpochStart || Date.now());
  const isNight = clock.currentPeriod === 'night';

  const isTessaActive = Boolean(
    !isAllWorkersPaused &&
    specialistWorkers?.worker_wrangler_tessa?.isHired &&
    specialistWorkers?.worker_wrangler_tessa?.isActive &&
    !specialistWorkers?.worker_wrangler_tessa?.isStriking
  );

  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showAnimalItemsModal, setShowAnimalItemsModal] = useState(false);
  const [showShelterControls, setShowShelterControls] = useState(false);
  const [selectedAnimalForWelfare, setSelectedAnimalForWelfare] = useState<AnimalInstance | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeWeatherId = resolveWeatherProfileId(hydrology?.weatherCondition);
  const activeProfile = WEATHER_PROFILES[activeWeatherId] || WEATHER_PROFILES.sunny;
  const tempC = hydrology?.weatherState?.temperatureC ?? activeProfile.defaultTempC;

  const faunaEval: FaunaWeatherEvaluation = evaluateFaunaWeather({
    activeWeatherId,
    temperatureC: tempC,
    isRainstormActive: false,
    pastureWelfare,
    sanctuary: prehistoricSanctuary,
    hasThermalCore: false,
    hasSiphonValve: Boolean(hydrology?.isSiphonActive),
    farmLevel: level,
  });

  // Compute global batch action counts
  const feedableAnimals = animals.filter(a => !a.fed && !a.productReady && a.age !== 'elder');
  const collectibleAnimals = animals.filter(a => a.productReady && a.cyclesRemaining > 0);

  let feedSim = silo.feed || 0;
  let canFeedCount = 0;
  for (const a of feedableAnimals) {
    const needed = ANIMALS[a.species].feedPerCycle;
    if (feedSim >= needed) {
      feedSim -= needed;
      canFeedCount++;
    }
  }

  const commonAnimalsCount = animals.filter(a => a.tier === 'common').length;
  const herderWorker = unifiedWorkers?.herder;

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col p-2 sm:p-3 box-border overflow-hidden select-none">
      
      {/* COMPACT TOP DASHBOARD CONTROL STRIP (Zero Scroll, fixed height ~38px) */}
      <div className="h-10 shrink-0 flex items-center justify-between gap-2 px-3 py-1 mb-2.5 rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-stone-200/90 dark:border-stone-800 shadow-sm backdrop-blur-md">
        
        {/* Left: Summary Title & Live Counters */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 font-black text-xs text-stone-800 dark:text-stone-100 tracking-wide shrink-0">
            <span className="text-base">🐾</span>
            <span className="hidden sm:inline">Livestock Pastures</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700/60 font-bold">
              {animals.length}/{TOTAL_PASTURE_CAPACITY} Pasture
            </span>
            {livestockReserve.length > 0 && (
              <button
                onClick={() => setShowReserveModal(true)}
                className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 font-bold transition-colors cursor-pointer"
                title="View Livestock Reserve"
              >
                📦 {livestockReserve.length} Reserve
              </button>
            )}
            <span className="hidden md:inline px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50 font-semibold">
              🫗 {silo.feed || 0} Feed
            </span>
          </div>
        </div>

        {/* Center: Compact Batch Actions & Automation Worker */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => collectAllProducts()}
            disabled={collectibleAnimals.length === 0}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs ${
              collectibleAnimals.length > 0
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:brightness-105 text-stone-950 font-black shadow-amber-300/40 active:scale-95'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700/50 cursor-not-allowed'
            }`}
          >
            <span>🧺</span>
            <span className="hidden sm:inline">Collect All</span>
            <span className="sm:hidden">Collect</span>
            {collectibleAnimals.length > 0 && (
              <span className="bg-stone-900/10 dark:bg-stone-950/20 px-1 rounded text-[10px] font-black">
                {collectibleAnimals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => feedAllAnimals()}
            disabled={canFeedCount === 0}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs ${
              canFeedCount > 0
                ? 'bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-bold shadow-blue-300/40 active:scale-95'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700/50 cursor-not-allowed'
            }`}
          >
            <span>🫗</span>
            <span className="hidden sm:inline">Feed All</span>
            <span className="sm:hidden">Feed</span>
            {canFeedCount > 0 && (
              <span className="bg-white/20 px-1 rounded text-[10px] font-black">
                {canFeedCount}
              </span>
            )}
          </button>

          {/* Livestock Rancher / Herder Worker Status */}
          {herderWorker?.isHired ? (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border shadow-xs transition-all ${
                herderWorker.isPaused || isAllWorkersPaused
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                  : 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-600/50'
              }`}
              title={`Livestock Rancher Lv.${herderWorker.level}: Automatically feeding & collecting animal products (${herderWorker.isPaused || isAllWorkersPaused ? 'Paused' : 'Active'})`}
            >
              <span className="text-sm">🤠</span>
              <span className="hidden md:inline font-bold">Rancher Lv.{herderWorker.level}</span>
              {herderWorker.isPaused || isAllWorkersPaused ? (
                <span className="px-1 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  ⏸️ Paused
                </span>
              ) : (
                <span className="flex h-2 w-2 relative" title="Worker actively feeding and gathering">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
              <button
                onClick={() => togglePauseUnifiedWorker('herder')}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 dark:bg-stone-800 hover:bg-white text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer font-semibold"
                title={herderWorker.isPaused ? "Resume Rancher" : "Pause Rancher"}
              >
                {herderWorker.isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              <button
                onClick={() => toggleUnifiedWorkerMode('herder')}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 dark:bg-stone-800 hover:bg-white text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer font-mono font-semibold"
                title="Toggle Mode (Barn = Deposit into Barn, Sell = Auto-Sell for coins)"
              >
                {herderWorker.autoSell ? '💰 Sell' : '📦 Barn'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => hireUnifiedWorker('herder')}
              disabled={level < 2 || coins < 100}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-40 text-stone-950 shadow-xs shadow-amber-300/30 transition-all active:scale-95 cursor-pointer"
              title={level < 2 ? 'Unlocks at Farm Level 2' : 'Hire Livestock Rancher (100 coins) to auto-feed animals and auto-collect products!'}
            >
              <span>🤠</span>
              <span className="hidden sm:inline">Hire Rancher</span>
              <span className="text-[10px] font-black opacity-80">{level < 2 ? 'Lv2' : '100🪙'}</span>
            </button>
          )}

          {/* Tessa Paddock Wrangler Badge */}
          {isTessaActive && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border border-emerald-400/50 shadow-xs"
              title={`Paddock Wrangler Tessa is feeding animals via ${wranglerPolicy?.strategy === 'gourmet_breeder' ? 'Gourmet Breeder (Favorites first)' : 'Budget Saver (Cheapest first)'} policy with a safety reserve floor of ${wranglerPolicy?.globalReserveFloor ?? 10} crops`}
            >
              <span className="text-sm">🌾</span>
              <span>
                Tessa: {wranglerPolicy?.strategy === 'gourmet_breeder' ? 'Gourmet Feed' : 'Budget Feed'} ({wranglerPolicy?.globalReserveFloor ?? 10} min)
              </span>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Adopt & Incubator Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowReserveModal(true)}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs transition-all flex items-center gap-1 active:scale-95"
            title="View livestock stored in holding reserve"
          >
            <span>📦</span>
            <span className="hidden sm:inline">Reserve</span>
            {livestockReserve.length > 0 && (
              <span className="bg-amber-500 text-stone-950 px-1 rounded text-[10px] font-black">
                {livestockReserve.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowAdoptModal(true)}
            disabled={commonAnimalsCount >= TIER_SECTORS.common.maxCapacity}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white shadow-xs shadow-emerald-200 dark:shadow-none transition-all flex items-center gap-1 active:scale-95"
            title="Adopt starter livestock into Common Pasture"
          >
            <span>➕</span>
            <span className="hidden sm:inline">Adopt</span>
          </button>

          <button
            onClick={() => setShowAnimalItemsModal(true)}
            className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 shadow-xs border border-amber-300/80 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
            title="View all items given by animals in one place"
          >
            <span>📋</span>
            <span className="hidden sm:inline">Animal Items</span>
          </button>
        </div>
      </div>

      {/* PASTURE CLIMATE & SHELTER CONTROLS BAR */}
      <div className="shrink-0 mb-2 p-2 rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-stone-200/90 dark:border-stone-800 shadow-sm backdrop-blur-md flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Weather Status Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 shadow-xs ${faunaEval.statusBadge.color}`}
              title={faunaEval.statusBadge.tooltip}
            >
              <span className="text-sm">{faunaEval.statusBadge.emoji}</span>
              <span>{faunaEval.statusBadge.text}</span>
            </span>

            {/* Environmental Conditions */}
            <span className="text-[11px] font-mono text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700/60 hidden sm:inline-flex items-center gap-1">
              <span>{activeProfile.emoji} {activeProfile.name}</span>
              <span>•</span>
              <span>{Math.round(tempC)}°C</span>
            </span>

            {/* Mitigations Active Pill */}
            {faunaEval.isMitigated && (
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-lg border border-teal-300 dark:border-teal-700/50 flex items-center gap-1">
                <span>🛡️ Mitigated:</span>
                <span className="truncate max-w-[180px]">{faunaEval.mitigationReasons.join(', ')}</span>
              </span>
            )}

            {/* Broken Fence Warning */}
            {pastureWelfare?.isFenceDamaged && (
              <button
                onClick={() => repairBrokenFences()}
                className="text-[11px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-lg border border-rose-400 animate-bounce cursor-pointer flex items-center gap-1 hover:brightness-105"
                title="Fence fractured in storm! Tap to repair for 30 coins."
              >
                <span>🔨 Broken Fence! Fix (30🪙)</span>
              </button>
            )}
          </div>

          {/* Quick Shelter Toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Barn Door Latch Toggle */}
            <button
              onClick={() => toggleBarnDoorsLatched()}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                pastureWelfare?.areBarnDoorsLatched
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-200'
              }`}
              title={pastureWelfare?.areBarnDoorsLatched ? "Barn doors latched shut! Animals safe from storm panic." : "Barn doors unlatched. Free pasture grazing permitted."}
            >
              <span>{pastureWelfare?.areBarnDoorsLatched ? '🔒 Latched' : '🔓 Unlatched'}</span>
            </button>

            {/* Muck Out Pens */}
            <button
              onClick={() => muckOutPens()}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title="Clean manure and mud slurry out of pens (+2 Compost, +1 Manure, cures foot rot)."
            >
              <span>🧹 Muck Out {pastureWelfare?.mudExposureSec ? `(${Math.round(pastureWelfare.mudExposureSec)}s)` : ''}</span>
            </button>

            {/* Thaw Troughs */}
            {faunaEval.isTroughFrozen && (
              <button
                onClick={() => thawFrozenTroughs()}
                className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-cyan-500 to-blue-500 text-white border border-cyan-300 animate-pulse transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Open troughs frozen solid! Heat with brazier/geothermal (15 coins) for 10m."
              >
                <span>🔥 Thaw Troughs (15🪙)</span>
              </button>
            )}

            {/* Feed Calming Herbs */}
            <button
              onClick={() => feedCalmingHerbs()}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title="Feed Lavender/Chamomile herbal mash to calm storm panic and cortisol spikes."
            >
              <span>🌿 Calming Herbs ({pastureWelfare?.calmingHerbsDoses ?? 3})</span>
            </button>

            {/* Expand / Collapse Shelter Infrastructure Drawer */}
            <button
              onClick={() => setShowShelterControls(!showShelterControls)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>🛠️ Shelters</span>
              <span className="text-[9px]">{showShelterControls ? '▲' : '▼'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Shelter Infrastructure Drawer */}
        {showShelterControls && (
          <div className="pt-2 border-t border-stone-200/80 dark:border-stone-700/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            {/* Canopy */}
            <button
              onClick={() => !pastureWelfare?.hasShadedCanopy && constructPastureShadeCanopy()}
              disabled={pastureWelfare?.hasShadedCanopy}
              className={`p-1.5 rounded-xl border flex flex-col items-start gap-0.5 text-left transition-all ${
                pastureWelfare?.hasShadedCanopy
                  ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 opacity-90'
                  : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 cursor-pointer'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                <span>☀️ Shade Canopy</span>
                {pastureWelfare?.hasShadedCanopy ? <span className="text-[9px] text-teal-600 font-black">✓ Built</span> : <span className="text-[9px] text-amber-600 font-black">50🪙</span>}
              </div>
              <span className="text-[9px] text-stone-500 dark:text-stone-400">Deflects extreme heat & UV</span>
            </button>

            {/* Mud Wallow */}
            <button
              onClick={() => !pastureWelfare?.hasMudWallow && digMudWallowTrench()}
              disabled={pastureWelfare?.hasMudWallow}
              className={`p-1.5 rounded-xl border flex flex-col items-start gap-0.5 text-left transition-all ${
                pastureWelfare?.hasMudWallow
                  ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 opacity-90'
                  : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 cursor-pointer'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                <span>💧 Mud Wallow</span>
                {pastureWelfare?.hasMudWallow ? <span className="text-[9px] text-teal-600 font-black">✓ Dug</span> : <span className="text-[9px] text-amber-600 font-black">40🪙</span>}
              </div>
              <span className="text-[9px] text-stone-500 dark:text-stone-400">Evaporative cooling for pigs/cows</span>
            </button>

            {/* Drainage Furrows */}
            <button
              onClick={() => !pastureWelfare?.hasDrainageFurrows && digDrainageFurrows()}
              disabled={pastureWelfare?.hasDrainageFurrows}
              className={`p-1.5 rounded-xl border flex flex-col items-start gap-0.5 text-left transition-all ${
                pastureWelfare?.hasDrainageFurrows
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 opacity-90'
                  : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 cursor-pointer'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                <span>🌊 Drainage Furrows</span>
                {pastureWelfare?.hasDrainageFurrows ? <span className="text-[9px] text-blue-600 font-black">✓ Dug</span> : <span className="text-[9px] text-amber-600 font-black">35🪙</span>}
              </div>
              <span className="text-[9px] text-stone-500 dark:text-stone-400">Diverts torrential rainwater</span>
            </button>

            {/* Elevated Platforms */}
            <button
              onClick={() => !pastureWelfare?.hasElevatedPlatforms && buildElevatedPlatforms()}
              disabled={pastureWelfare?.hasElevatedPlatforms}
              className={`p-1.5 rounded-xl border flex flex-col items-start gap-0.5 text-left transition-all ${
                pastureWelfare?.hasElevatedPlatforms
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 opacity-90'
                  : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 cursor-pointer'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                <span>🪵 Slatted Platforms</span>
                {pastureWelfare?.hasElevatedPlatforms ? <span className="text-[9px] text-amber-600 font-black">✓ Built</span> : <span className="text-[9px] text-amber-600 font-black">60🪙</span>}
              </div>
              <span className="text-[9px] text-stone-500 dark:text-stone-400">High & dry resting platforms</span>
            </button>
          </div>
        )}
      </div>

      {/* QUAD GRID CONTAINER (2x2 Equal Screen Real Estate, zero scroll) */}
      <div className="grid grid-cols-2 grid-rows-2 gap-2.5 flex-1 min-h-0">
        {SECTOR_ORDER.map(tier => {
          const config = TIER_SECTORS[tier];
          const sectorAnimals = animals.filter(a => a.tier === tier);
          const maxCapacity = config.maxCapacity;
          const filledSlots = sectorAnimals.slice(0, maxCapacity);
          const isCommon = tier === 'common';
          const emptyCount = Math.max(0, maxCapacity - filledSlots.length);

          return (
            <div
              key={tier}
              className={`rounded-2xl border-2 ${config.borderColor} ${TIER_BORDER_STYLES[tier]} bg-gradient-to-b ${config.bgGradient} p-2.5 sm:p-3 flex flex-col h-full min-h-0 overflow-hidden shadow-sm backdrop-blur-xs`}
            >
              
              {/* Sector Header (Compact, 1 Line, no overflow) */}
              <div className="flex items-center justify-between gap-1.5 pb-1.5 mb-1.5 border-b border-stone-200/80 dark:border-stone-700/60 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">{SECTOR_EMOJIS[tier]}</span>
                  <h3 className={`font-black text-xs sm:text-sm tracking-wide truncate ${config.textColor}`}>
                    {config.title}
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 border border-stone-200/90 dark:border-stone-700/60 font-bold shrink-0 shadow-2xs">
                    {sectorAnimals.length}/{maxCapacity}
                  </span>
                  {isTessaActive && (
                    <span
                      className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40 shrink-0 shadow-2xs"
                      title="Tessa the Gentle on duty: Auto-feeding unfed livestock & maintaining Well-Fed bonus"
                    >
                      <span>🌾</span>
                      <span>Well-Fed</span>
                    </span>
                  )}
                </div>

                {/* Passive Perk Badge & Tessa Mobile Icon */}
                <div className="shrink-0 flex items-center gap-1">
                  {isTessaActive && (
                    <span
                      className="md:hidden text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40"
                      title="Tessa: Well-Fed (+10% Mutation Luck)"
                    >
                      🌾
                    </span>
                  )}
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border truncate inline-block max-w-[170px] shadow-2xs ${config.badgeColor}`}
                    title={config.passivePerk}
                  >
                    {config.passivePerk}
                  </span>
                </div>
              </div>

              {/* Sub-Grid (scrollable for common up to 50 animals, fixed 2x2 for higher tiers) */}
              <div className={`gap-1.5 flex-1 min-h-0 ${
                isCommon
                  ? 'grid grid-cols-2 auto-rows-max overflow-y-auto pr-1'
                  : 'grid grid-cols-2 grid-rows-2 overflow-hidden'
              }`}>
                
                {/* Active Animal Slots */}
                {filledSlots.map(animal => {
                  const def = ANIMALS[animal.species];
                  const canFeed = !animal.fed && !animal.productReady && (silo.feed || 0) >= def.feedPerCycle;
                  const canCollect = animal.productReady;
                  const breedDef = BREED_REGISTRY[animal.breedId];
                  const breedName = breedDef?.name || TIER_LABELS[animal.tier];

                  const prodTimeSec = breedDef ? breedDef.baseIntervalMs / 1000 : def.productionTimeSec;
                  let prodProgress = 0;
                  if (animal.fed && animal.fedAt && !animal.productReady) {
                    const safeFedAt = Math.min(Date.now(), animal.fedAt);
                    prodProgress = Math.max(0, Math.min(1, (Date.now() - safeFedAt) / (prodTimeSec * 1000)));
                  }

                  const coatDef = getCoatDefinition(animal.species, animal.coat);
                  const traitDef = getTraitDefinition(animal.trait);
                  const generation = animal.generation || 0;

                  const isMutated = Boolean(animal.isMutated);
                  const isOverclocked = Boolean(
                    animal.isOverclocked && animal.overclockExpiresAt && animal.overclockExpiresAt > Date.now()
                  );
                  const isExhausted = Boolean(
                    animal.isExhausted && animal.exhaustedUntil && animal.exhaustedUntil > Date.now()
                  );
                  const isBreedingResting = Boolean(
                    animal.breedingCooldownExpiresAt && animal.breedingCooldownExpiresAt > Date.now()
                  );

                  return (
                    <div
                      key={animal.id}
                      className={`rounded-xl border p-2 flex flex-col justify-between min-h-0 text-center relative overflow-hidden transition-all shadow-xs hover:shadow-sm ${
                        isMutated
                          ? 'border-fuchsia-400 bg-gradient-to-br from-fuchsia-50/90 to-pink-50/70 dark:from-fuchsia-950/40 dark:to-pink-950/20 shadow-fuchsia-200/50 ring-1 ring-fuchsia-300 dark:ring-fuchsia-500/40'
                          : isOverclocked
                          ? 'border-amber-400 bg-gradient-to-br from-amber-50/90 to-yellow-50/70 dark:from-amber-950/40 dark:to-yellow-950/20 animate-pulse ring-1 ring-amber-300'
                          : isExhausted
                          ? 'border-stone-300 dark:border-stone-700 bg-stone-100/90 dark:bg-stone-900/90 opacity-75'
                          : canCollect
                          ? 'border-amber-400 bg-gradient-to-b from-amber-50 to-yellow-100/90 dark:from-yellow-950/40 dark:to-amber-950/20 shadow-md shadow-amber-200/50 dark:shadow-none ring-1.5 ring-amber-400/80 animate-pulse'
                          : animal.fed && !animal.productReady
                          ? 'border-sky-300 dark:border-sky-500/40 bg-sky-50/80 dark:bg-sky-950/30'
                          : 'border-stone-200/90 dark:border-stone-800 bg-white/95 dark:bg-stone-900/90 shadow-2xs hover:border-stone-300'
                      }`}
                    >
                      {/* Top Row: Emoji + Breed Name + Cycles */}
                      <div
                        className="min-h-0 cursor-pointer"
                        onClick={() => setSelectedAnimalForWelfare(animal)}
                        title={`Hydration: ${Math.round(animal.hydrationLevel ?? 90)}% • Tap to inspect welfare & genetics`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-base shrink-0 leading-none transition-transform ${
                              animal.weatherStress === 'heat_stressed'
                                ? 'animate-pulse scale-110'
                                : animal.weatherStress === 'freezing'
                                ? 'animate-bounce'
                                : animal.weatherStress === 'panicked'
                                ? 'animate-bounce'
                                : ''
                            }`}
                          >
                            {coatDef?.emoji || def.emoji}
                          </span>
                          <span
                            className="text-[11px] font-bold text-stone-800 dark:text-stone-100 truncate text-left flex-1"
                            title={breedName}
                          >
                            {breedName}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold border border-stone-200/60 dark:border-stone-700/60 shrink-0">
                            {animal.cyclesRemaining}c
                          </span>
                        </div>

                        {/* Generation, Coat & Trait Genetics Badges */}
                        <div className="flex items-center gap-1 flex-wrap mt-1">
                          {/* Generation Badge */}
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.2 rounded border shadow-2xs ${
                              generation === 0
                                ? 'bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800 dark:text-stone-400'
                                : generation === 1
                                ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/80 dark:text-amber-200 ring-1 ring-amber-400/40'
                            }`}
                            title={`Generation ${generation} (${generation === 0 ? 'Base Shop Stock' : `+${Math.round(generation * 12)}% Output Yield`})`}
                          >
                            {generation === 0 ? 'Shop Stock' : generation === 1 ? 'Gen 1' : `Gen ${generation}+`}
                          </span>

                          {/* Coat Badge */}
                          {coatDef && (
                            <span
                              className={`text-[8px] font-bold px-1.5 py-0.2 rounded border truncate max-w-[85px] ${coatDef.badgeColor}`}
                              title={`Coat: ${coatDef.name} (${coatDef.sellValueMultiplier}x Market Resale Value)\n${coatDef.description}`}
                            >
                              <span>{coatDef.emoji}</span> {coatDef.name.split(' ')[0]}
                            </span>
                          )}

                          {/* Trait Badge */}
                          {traitDef && (
                            <span
                              className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${traitDef.badgeColor}`}
                              title={`Specialized Trait: ${traitDef.name}\n${traitDef.detailedEffect}`}
                            >
                              <span>{traitDef.emoji}</span>
                              <span className="truncate max-w-[70px]">{traitDef.name}</span>
                            </span>
                          )}
                        </div>

                        {/* Mutated / Apex / Breeding & Environmental Status Badges */}
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {isMutated && (
                            <div className="text-[8px] font-black text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-100 dark:bg-fuchsia-950/80 px-1 py-0.2 rounded border border-fuchsia-300 dark:border-fuchsia-500/40 truncate text-left">
                              🧬 Apex (+50%)
                            </div>
                          )}
                          {isBreedingResting && (
                            <div
                              className="text-[8px] font-bold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-950/80 px-1 py-0.2 rounded border border-violet-300 dark:border-violet-700/60 truncate text-left"
                              title="Resting from breeding (produces and feeds normally!)"
                            >
                              ⏳ Rest
                            </div>
                          )}
                          {animal.weatherStress === 'heat_stressed' && (
                            <span className="text-[8px] font-black text-rose-700 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950/80 px-1 py-0.2 rounded border border-rose-400/50 animate-pulse" title="Heat Stressed: Water 2.5x | Manure -50%">
                              🥵 Panting
                            </span>
                          )}
                          {animal.weatherStress === 'freezing' && (
                            <span className="text-[8px] font-black text-cyan-700 dark:text-cyan-300 bg-cyan-100/90 dark:bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-400/50 animate-bounce" title="Freezing: Yield 0% Frozen Solid">
                              🥶 Shivering
                            </span>
                          )}
                          {animal.weatherStress === 'mud_soaked' && (
                            <span className="text-[8px] font-black text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80 px-1 py-0.2 rounded border border-amber-400/50" title="Mud Slurry: Muck out pens to sanitize">
                              🌧️ Muddy
                            </span>
                          )}
                          {animal.weatherStress === 'panicked' && (
                            <span className="text-[8px] font-black text-yellow-800 dark:text-yellow-200 bg-yellow-100/90 dark:bg-yellow-950/80 px-1 py-0.2 rounded border border-yellow-400/60 animate-bounce" title="Panicked: Fences at risk, feeding stopped">
                              ⚡ Panicked!
                            </span>
                          )}
                          {animal.hasFootRot && (
                            <span className="text-[8px] font-black text-white bg-rose-600 px-1 py-0.2 rounded shadow-2xs animate-pulse" title="Foot Rot! Pen soiled in mud for >60s. Muck out pens!">
                              🐾 Foot Rot
                            </span>
                          )}
                          {animal.weatherMitigated && faunaEval.condition !== 'mild' && (
                            <span className="text-[8px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100/90 dark:bg-teal-950/80 px-1 py-0.2 rounded border border-teal-400/40" title="Sheltered from atmospheric weather stress">
                              🛡️ Sheltered
                            </span>
                          )}
                          {/* Live Hydration Badge */}
                          <span
                            className="text-[8px] font-mono font-bold text-teal-800 dark:text-teal-200 bg-teal-100/90 dark:bg-teal-950/80 px-1 py-0.2 rounded border border-teal-300 dark:border-teal-700/60 truncate"
                            title={`Live Hydration: ${Math.round(animal.hydrationLevel ?? 90)}%`}
                          >
                            💧 {Math.round(animal.hydrationLevel ?? 90)}% Hydrated
                          </span>
                          {animal.isBeddingDryCaked && (
                            <span className="text-[8px] font-bold text-amber-800 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-950/80 px-1 py-0.2 rounded border border-amber-400/60" title="Bedding caked dry! Washdown needed to restore fluid runoff.">
                              🪣 Caked
                            </span>
                          )}
                          {/* Real-time Slurry Production Badge */}
                          {animal.age === 'elder' || (animal.cyclesRemaining !== undefined && animal.cyclesRemaining <= 0) ? (
                            <span
                              className="text-[8px] font-bold text-stone-500 bg-stone-200 dark:bg-stone-800 px-1 py-0.2 rounded border border-stone-300 dark:border-stone-700 truncate"
                              title="Retired Elder: Ceased biological production (0 L/min Slurry). Sell at Livestock Market."
                            >
                              👵 Retired (0 Slurry)
                            </span>
                          ) : isNight ? (
                            <span
                              className="text-[8px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-1 py-0.2 rounded border border-indigo-300 dark:border-indigo-700/60 truncate"
                              title="Night Rest: Animal is asleep in barn stall (0 L/min Slurry until morning)"
                            >
                              🌙 Asleep (0 Slurry)
                            </span>
                          ) : (
                            <span
                              className="text-[8px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80 px-1 py-0.2 rounded border border-amber-300 dark:border-amber-700/60 truncate"
                              title={`Active Daytime Slurry: +${(animal.species === 'cow' ? 2.5 : animal.species === 'pig' ? 1.5 : animal.species === 'sheep' ? 1.0 : 0.5).toFixed(1)} L/min piped directly to Gas Refinery intake`}
                            >
                              🚰 +{(animal.species === 'cow' ? 2.5 : animal.species === 'pig' ? 1.5 : animal.species === 'sheep' ? 1.0 : 0.5).toFixed(1)} L/m
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Production State / Action */}
                      <div className="my-0.5 min-h-0">
                        {canCollect ? (
                          <button
                            onClick={() => collectProduct(animal.id)}
                            className="w-full py-1 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:brightness-105 text-stone-950 font-black text-[11px] rounded-lg transition-transform active:scale-95 shadow-sm shadow-amber-300/40"
                          >
                            {def.productEmoji} Collect
                          </button>
                        ) : canFeed && animal.age !== 'elder' && !isExhausted ? (
                          <button
                            onClick={() => feedAnimal(animal.id)}
                            className="w-full py-1 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-bold text-[11px] rounded-lg transition-transform active:scale-95 shadow-sm shadow-blue-200 dark:shadow-none"
                          >
                            🫗 Feed
                          </button>
                        ) : animal.fed && !animal.productReady ? (
                          <div className="space-y-0.5">
                            <div className="w-full h-1.5 bg-sky-100 dark:bg-sky-950 rounded-full overflow-hidden border border-sky-200 dark:border-sky-800/60">
                              <div
                                className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${prodProgress * 100}%` }}
                              />
                            </div>
                            <div className="text-[9px] text-sky-700 dark:text-sky-300 font-mono font-medium">Producing...</div>
                          </div>
                        ) : animal.age === 'elder' ? (
                          <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Market Ready</div>
                        ) : (
                          <div className="text-[9px] text-stone-500 dark:text-stone-400 font-medium">Needs Feed 🫗</div>
                        )}
                      </div>

                      {/* Bottom Row: Micro Overclock Menu & Status */}
                      <div className="pt-0.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[9px] text-stone-500 dark:text-stone-400 min-h-0">
                        <span className="truncate">
                          {breedDef?.bonusDrop ? '⭐ +proc' : `${def.productYield}x ${def.product}`}
                        </span>

                        {animal.age !== 'elder' && (
                          <div className="shrink-0 flex items-center gap-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedAnimalForWelfare(animal); }}
                              className="px-1 py-0.5 rounded text-[10px] hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-teal-500 transition-colors cursor-pointer"
                              title="Inspect Environmental Welfare & Stress Card"
                            >
                              🔍
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveToReserve(animal.id); }}
                              className="px-1 py-0.5 rounded text-[10px] hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-amber-500 transition-colors cursor-pointer"
                              title="Store animal in Livestock Reserve"
                            >
                              📦
                            </button>
                            <OverclockActionMenu
                              entityId={`animal_${animal.id}`}
                              entityType="animal"
                              name={breedDef?.name || def.name}
                              compact={true}
                              className="scale-90 origin-right"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Empty Slot Placeholders */}
                {isCommon ? (
                  filledSlots.length === 0 ? (
                    Array.from({ length: 4 }).map((_, slotIdx) => (
                      <div
                        key={`empty-slot-common-${slotIdx}`}
                        className="rounded-xl border-2 border-dashed border-stone-200/90 dark:border-stone-800/80 bg-white/60 dark:bg-stone-950/30 p-2 flex flex-col items-center justify-center text-center space-y-1 min-h-[90px] hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-white/80 dark:hover:bg-stone-900/60 transition-all"
                      >
                        <span className="text-sm opacity-60">🟢</span>
                        <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
                          Slot Available
                        </div>
                        <button
                          onClick={() => setShowAdoptModal(true)}
                          className="px-2.5 py-0.5 text-[9px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs shadow-emerald-200 dark:shadow-none transition-all active:scale-95 cursor-pointer"
                        >
                          + Adopt
                        </button>
                      </div>
                    ))
                  ) : filledSlots.length < maxCapacity ? (
                    <div
                      key="adopt-more-common"
                      className="rounded-xl border-2 border-dashed border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-2 flex flex-col items-center justify-center text-center space-y-1 min-h-[90px] hover:border-emerald-400 hover:bg-emerald-50/70 transition-all"
                    >
                      <span className="text-sm opacity-70">➕</span>
                      <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        Pasture Open ({filledSlots.length}/50)
                      </div>
                      <button
                        onClick={() => setShowAdoptModal(true)}
                        className="px-2.5 py-0.5 text-[9px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs shadow-emerald-200 dark:shadow-none transition-all active:scale-95 cursor-pointer"
                      >
                        + Adopt More
                      </button>
                    </div>
                  ) : null
                ) : (
                  Array.from({ length: emptyCount }).map((_, slotIdx) => (
                    <div
                      key={`empty-slot-${tier}-${slotIdx}`}
                      className="rounded-xl border-2 border-dashed border-stone-200/90 dark:border-stone-800/80 bg-white/60 dark:bg-stone-950/30 p-2 flex flex-col items-center justify-center text-center space-y-1 min-h-0 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-white/80 dark:hover:bg-stone-900/60 transition-all"
                    >
                      <span className="text-sm opacity-60">{SECTOR_EMOJIS[tier]}</span>
                      <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
                        Slot Available
                      </div>

                      {livestockReserve.some(a => a.tier === tier) ? (
                        <button
                          onClick={() => setShowReserveModal(true)}
                          className="px-2 py-0.5 text-[9px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-black shadow-2xs shadow-amber-200 dark:shadow-none transition-all active:scale-95 cursor-pointer"
                        >
                          Deploy ({livestockReserve.filter(a => a.tier === tier).length})
                        </button>
                      ) : (
                        <span className="text-[9px] font-medium text-stone-400 dark:text-stone-500 italic">
                          Empty
                        </span>
                      )}
                    </div>
                  ))
                )}

              </div>

            </div>
          );
        })}
      </div>

      {/* QUICK ADOPT MODAL (Modal overlay, does not alter desktop viewport) */}
      {showAdoptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border-2 border-emerald-400 dark:border-emerald-500/50 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🟢</span>
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">Adopt Starter Livestock</h3>
              </div>
              <button
                onClick={() => setShowAdoptModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300">
              Select livestock to place directly into an available Common Pasture slot ({commonAnimalsCount}/4):
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {SPECIES_LIST.map(species => {
                const def = ANIMALS[species];
                const cost = COSTS[species];
                const canBuy = coins >= cost && commonAnimalsCount < 4;

                return (
                  <button
                    key={species}
                    onClick={() => {
                      if (canBuy) {
                        buyAnimal(species);
                        setShowAdoptModal(false);
                      }
                    }}
                    disabled={!canBuy}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 disabled:opacity-40 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-emerald-400 flex flex-col items-center justify-center transition-all text-center space-y-1 shadow-xs"
                  >
                    <span className="text-2xl">{def.emoji}</span>
                    <span className="text-xs font-bold capitalize text-stone-900 dark:text-white">{def.name}</span>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">🪙 {cost}</span>
                  </button>
                );
              })}
            </div>

            {commonAnimalsCount >= 4 && (
              <div className="text-center text-xs text-amber-600 dark:text-amber-400 font-medium">
                Common Pasture is at full capacity (4/4 slots).
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVESTOCK RESERVE MODAL */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border-2 border-amber-400 dark:border-amber-600/60 rounded-2xl p-5 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                    Livestock Reserve & Holding Barn
                    <span className="text-xs px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold">
                      {livestockReserve.length} Stored
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Animals stored when pastures are full (e.g. Common 4/4). Deploy them into active pastures anytime!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReserveModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            {livestockReserve.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl space-y-1">
                <div className="text-2xl">📦</div>
                <div className="font-bold text-stone-700 dark:text-stone-300">No animals in reserve right now</div>
                <div className="text-[11px] max-w-xs mx-auto">
                  When your Common Pasture is full (4/4), newly hatched common livestock will be safely preserved here!
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {livestockReserve.map(animal => {
                  const def = ANIMALS[animal.species];
                  const breedDef = BREED_REGISTRY[animal.breedId];
                  const breedName = breedDef?.name || TIER_LABELS[animal.tier];
                  const tierCount = animals.filter(a => a.tier === animal.tier).length;
                  const canDeploy = tierCount < 4;

                  return (
                    <div
                      key={animal.id}
                      className="rounded-xl border-2 p-2.5 bg-stone-50 dark:bg-stone-950/70 flex flex-col justify-between space-y-2"
                      style={{ borderColor: TIER_COLORS[animal.tier] }}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-0.5">{def.emoji}</div>
                        <div
                          className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded inline-block"
                          style={{
                            color: TIER_COLORS[animal.tier],
                            backgroundColor: `${TIER_COLORS[animal.tier]}20`,
                          }}
                        >
                          {TIER_LABELS[animal.tier]}
                        </div>
                        <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate mt-1" title={breedName}>
                          {breedName}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {animal.cyclesRemaining}/{animal.maxCycles} cycles
                        </div>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-stone-200 dark:border-stone-800">
                        <button
                          onClick={() => moveToPasture(animal.id)}
                          disabled={!canDeploy}
                          className="w-full py-1 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-xs"
                        >
                          {canDeploy ? 'Deploy to Pasture' : 'Pasture Full (4/4)'}
                        </button>
                        <button
                          onClick={() => sellReserveAnimal(animal.id)}
                          className="w-full py-1 text-[9px] font-semibold rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                        >
                          Sell to Market
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANIMAL ENVIRONMENTAL WELFARE INSPECTION MODAL */}
      {selectedAnimalForWelfare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-4 sm:p-5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 shadow-2xs">
                  {ANIMALS[selectedAnimalForWelfare.species]?.emoji}
                </span>
                <div>
                  <h3 className="font-black text-sm text-stone-900 dark:text-stone-100">
                    {BREED_REGISTRY[selectedAnimalForWelfare.breedId]?.name || ANIMALS[selectedAnimalForWelfare.species]?.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-500 dark:text-stone-400">
                    <span className="capitalize">{selectedAnimalForWelfare.species}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedAnimalForWelfare.tier}</span>
                    <span>•</span>
                    <span>{selectedAnimalForWelfare.cyclesRemaining} cycles left</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnimalForWelfare(null)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Active Environmental Weather Tag */}
            <div className={`p-2.5 rounded-xl border flex flex-col gap-1 ${faunaEval.statusBadge.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <span className="text-base">{faunaEval.statusBadge.emoji}</span>
                  <span>{faunaEval.statusBadge.text}</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/20">
                  {faunaEval.isMitigated ? '🛡️ Protected' : '⚠️ Stress Active'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{faunaEval.statusBadge.tooltip}</p>
            </div>

            {/* Genetics & Lineage Heritage */}
            {(() => {
              const modalCoatDef = getCoatDefinition(selectedAnimalForWelfare.species, selectedAnimalForWelfare.coat);
              const modalTraitDef = getTraitDefinition(selectedAnimalForWelfare.trait);
              const modalGen = selectedAnimalForWelfare.generation || 0;
              const modalOutputMult = selectedAnimalForWelfare.outputMultiplier || (1.0 + modalGen * 0.12);

              return (
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-stone-800 dark:text-stone-200 text-[11px] tracking-wide uppercase flex items-center gap-1.5">
                      <span>🧬</span> Lineage & Inherited Genetics
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                      modalGen === 0
                        ? 'bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800 dark:text-stone-400'
                        : modalGen === 1
                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/80 dark:text-amber-200'
                    }`}>
                      {modalGen === 0 ? 'Shop Stock (Baseline)' : `Generation ${modalGen} (+${Math.round((modalOutputMult - 1) * 100)}% Yield)`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col">
                      <span className="text-[10px] text-stone-400 font-semibold">Cosmetic Coat</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200 mt-0.5 flex items-center gap-1">
                        <span>{modalCoatDef.emoji}</span> {modalCoatDef.name}
                      </span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        {modalCoatDef.sellValueMultiplier}x Market Resale Value
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col">
                      <span className="text-[10px] text-stone-400 font-semibold">Specialized Trait</span>
                      {modalTraitDef ? (
                        <>
                          <span className="font-bold text-stone-800 dark:text-stone-200 mt-0.5 flex items-center gap-1">
                            <span>{modalTraitDef.emoji}</span> {modalTraitDef.name}
                          </span>
                          <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-medium mt-0.5 leading-tight">
                            {modalTraitDef.summary}
                          </span>
                        </>
                      ) : (
                        <span className="text-stone-400 text-[10px] mt-1 italic">
                          None (Standard Output)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Metabolism & Resource Shifts Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="font-black text-stone-800 dark:text-stone-200 text-[11px] tracking-wide uppercase">
                Metabolic & Resource Shifts
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {/* Water Drain */}
                <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 flex flex-col">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-semibold">
                    🚰 Water Consumption
                  </span>
                  <span className={`font-black text-xs mt-0.5 ${faunaEval.waterConsumptionMultiplier > 1.5 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-800 dark:text-stone-200'}`}>
                    {faunaEval.waterConsumptionMultiplier.toFixed(1)}x Baseline
                  </span>
                  <span className="text-[9px] text-stone-400">
                    {faunaEval.waterConsumptionMultiplier > 1.5 ? 'Depleting troughs rapidly' : 'Standard pasture drain'}
                  </span>
                </div>

                {/* Feed Intake */}
                <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 flex flex-col">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-semibold">
                    🌾 Feed / Caloric Burn
                  </span>
                  <span className={`font-black text-xs mt-0.5 ${faunaEval.feedConsumptionMultiplier > 1.0 ? 'text-cyan-600 dark:text-cyan-400' : faunaEval.feedConsumptionMultiplier < 1.0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-800 dark:text-stone-200'}`}>
                    {faunaEval.feedConsumptionMultiplier.toFixed(1)}x Appetite
                  </span>
                  <span className="text-[9px] text-stone-400">
                    {faunaEval.feedConsumptionMultiplier > 1.0 ? '+40% spike to maintain warmth' : faunaEval.feedConsumptionMultiplier < 1.0 ? '-30% heatwave lethargy' : 'Normal caloric intake'}
                  </span>
                </div>

                {/* Output Yields */}
                <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 flex flex-col">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-semibold">
                    🥛 Output Yields
                  </span>
                  <span className={`font-black text-xs mt-0.5 ${faunaEval.isYieldFrozen ? 'text-cyan-500' : faunaEval.yieldMultiplier < 1.0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {faunaEval.isYieldFrozen ? '0% Frozen Solid' : `${Math.round(faunaEval.yieldMultiplier * 100)}% Capacity`}
                  </span>
                  <span className="text-[9px] text-stone-400">
                    {faunaEval.isYieldFrozen ? 'Energy diverted to survival' : faunaEval.yieldMultiplier < 1.0 ? '-40% thermal penalty' : 'Full milk/wool/egg yields'}
                  </span>
                </div>

                {/* Nitrogen Manure */}
                <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 flex flex-col">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-semibold">
                    💩 Nitrogen Compost / Manure
                  </span>
                  <span className={`font-black text-xs mt-0.5 ${faunaEval.manureRateMultiplier < 0.6 ? 'text-rose-500' : 'text-stone-800 dark:text-stone-200'}`}>
                    {Math.round(faunaEval.manureRateMultiplier * 100)}% Rate
                  </span>
                  <span className="text-[9px] text-stone-400">
                    {faunaEval.manureRateMultiplier < 0.6 ? 'Halved nitrogen compost supply' : 'Normal manure replenishment'}
                  </span>
                </div>
              </div>

              {/* CO2 Breathing Canopy */}
              <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                  <span>💨 CO2 Breathing Canopy:</span>
                </span>
                <span className={`font-bold text-[11px] ${faunaEval.co2CanopyActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {faunaEval.co2CanopyActive ? 'Active (+40% crop buffer)' : 'Offline (Retreated Indoors)'}
                </span>
              </div>
            </div>

            {/* Active Player Mitigations */}
            <div className="space-y-1">
              <div className="font-black text-stone-800 dark:text-stone-200 text-[11px] tracking-wide uppercase">
                Pasture Mitigations & Perks
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {pastureWelfare?.hasShadedCanopy && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 font-bold">
                    ✓ Shade Canopy
                  </span>
                )}
                {pastureWelfare?.hasMudWallow && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 font-bold">
                    ✓ Mud Wallow
                  </span>
                )}
                {pastureWelfare?.hasDrainageFurrows && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold">
                    ✓ Drainage Furrows
                  </span>
                )}
                {pastureWelfare?.hasElevatedPlatforms && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold">
                    ✓ Elevated Platforms
                  </span>
                )}
                {pastureWelfare?.areBarnDoorsLatched && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold">
                    ✓ Barn Doors Latched
                  </span>
                )}
                {faunaEval.mitigationReasons.map((reason, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-bold">
                    ✓ {reason}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedAnimalForWelfare(null)}
              className="w-full py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs transition-colors cursor-pointer mt-1"
            >
              Done Inspecting
            </button>
          </div>
        </div>
      )}

      {/* Quick Reference of All Items Given by Animals */}
      <AnimalProductsQuickReference
        isOpen={showAnimalItemsModal}
        onClose={() => setShowAnimalItemsModal(false)}
      />
    </div>
  );
}
