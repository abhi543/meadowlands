'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '@/game/store';
import {
  ESTATE_MENAGERIE_REGISTRY,
  FaunaDefinition,
  FaunaCategory,
  FAUNA_TIER_COLORS,
} from '@/data/estateMenagerieRegistry';
import { PREHISTORIC_SPECIES_REGISTRY } from '@/types/prehistoric';
import { ANIMALS } from '@/game/data';

interface EstateMenagerieModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function EstateMenagerieModal({ isOpen: propIsOpen, onClose: propOnClose }: EstateMenagerieModalProps) {
  const {
    isMenagerieModalOpen,
    setMenagerieModalOpen,
    animals = [],
    prehistoricSanctuary,
    domesticTroughs,
    silo,
    barn,
    refillDomesticTrough,
    collectDomesticHarvest,
    depositEnclosureFeed,
    collectEnclosureHarvest,
    refillAllFaunaTroughs,
    collectAllFaunaHarvests,
    totalFaunaHarvests = 0,
  } = useGameStore();

  const isModalOpen = propIsOpen !== undefined ? propIsOpen : isMenagerieModalOpen;
  const handleClose = () => {
    if (propOnClose) propOnClose();
    if (setMenagerieModalOpen) setMenagerieModalOpen(false);
  };

  const [activeFilter, setActiveFilter] = useState<'all' | FaunaCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReadyOnly, setFilterReadyOnly] = useState(false);
  const [filterLowTroughOnly, setFilterLowTroughOnly] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [highlightedAuraId, setHighlightedAuraId] = useState<string | null>(null);
  const [refillFeedback, setRefillFeedback] = useState<string | null>(null);

  // Ticking for live progress bars & countdowns
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Telemetry helper for a creature
  const getCreatureTelemetry = (fauna: FaunaDefinition) => {
    if (fauna.category === 'modern_farm') {
      const species = fauna.speciesKey || 'chicken';
      const speciesAnimals = animals.filter((a) => a.species === species);
      const headcount = speciesAnimals.length;

      // Domestic trough state
      const trough = domesticTroughs?.[species] || { foodUnits: 50, maxUnits: 100 };
      const troughLevel = Math.round(trough.foodUnits);
      const troughPct = Math.max(0, Math.min(100, (trough.foodUnits / trough.maxUnits) * 100));
      const isTroughEmpty = troughLevel <= 0;

      // Production & Readiness
      const readyAnimals = speciesAnimals.filter((a) => a.productReady);
      const readyCount = readyAnimals.length;
      const producingAnimals = speciesAnimals.filter((a) => a.fed && !a.productReady);

      // Countdown / progress computation
      let minTimeRemaining = fauna.baseIntervalSec;
      let maxProgressPct = 0;

      if (producingAnimals.length > 0) {
        for (const a of producingAnimals) {
          if (a.fedAt) {
            const elapsed = Math.max(0, (now - a.fedAt) / 1000);
            const remaining = Math.max(0, fauna.baseIntervalSec - elapsed);
            if (remaining < minTimeRemaining) {
              minTimeRemaining = Math.ceil(remaining);
            }
            const prog = Math.min(100, (elapsed / fauna.baseIntervalSec) * 100);
            if (prog > maxProgressPct) {
              maxProgressPct = prog;
            }
          }
        }
      } else if (readyCount > 0) {
        maxProgressPct = 100;
        minTimeRemaining = 0;
      }

      // Available dietary stock
      let availableDietStock = 0;
      for (const dietItemId of fauna.dietItemIds) {
        availableDietStock += (silo[dietItemId] || 0) + (barn[dietItemId] || 0);
      }

      // Active aura check: Must have living population and not empty trough
      const isAuraActive = headcount > 0 && !isTroughEmpty;

      return {
        headcount,
        troughLevel,
        troughMax: trough.maxUnits,
        troughPct,
        isTroughEmpty,
        readyCount,
        minTimeRemaining,
        progressPct: maxProgressPct,
        availableDietStock,
        isAuraActive,
        isProducing: producingAnimals.length > 0,
      };
    } else {
      // Prehistoric reserve
      const encKey = fauna.enclosureType;
      const enc = encKey ? prehistoricSanctuary?.enclosures?.[encKey] : undefined;
      const headcount = enc?.specimenCount || 0;
      const troughLevel = Math.round(enc?.troughFoodLiters || 0);
      const troughMax = enc?.maxTroughLiters || 100;
      const troughPct = Math.max(0, Math.min(100, (troughLevel / troughMax) * 100));
      const isTroughEmpty = troughLevel <= 0 || enc?.isStarving;
      const readyCount = enc?.harvestReadyCount || 0;

      const spec = fauna.prehistoricId ? PREHISTORIC_SPECIES_REGISTRY[fauna.prehistoricId] : undefined;
      const harvestPeriod = spec?.harvestPeriodSec || fauna.baseIntervalSec;
      const harvestProgress = enc?.harvestProgressSec || 0;
      const minTimeRemaining = Math.max(0, harvestPeriod - harvestProgress);
      const progressPct = harvestPeriod > 0 ? Math.min(100, (harvestProgress / harvestPeriod) * 100) : 0;

      // Dietary stock
      let availableDietStock = 0;
      for (const dietItemId of fauna.dietItemIds) {
        availableDietStock += (barn[dietItemId] || 0) + (silo[dietItemId] || 0);
      }

      const isAuraActive = headcount > 0 && !isTroughEmpty;

      return {
        headcount,
        troughLevel,
        troughMax,
        troughPct,
        isTroughEmpty,
        readyCount,
        minTimeRemaining,
        progressPct,
        availableDietStock,
        isAuraActive,
        isProducing: headcount > 0 && !isTroughEmpty && readyCount === 0,
      };
    }
  };

  // Filtered fauna list
  const filteredFauna = useMemo(() => {
    return ESTATE_MENAGERIE_REGISTRY.filter((f) => {
      // Category filter
      if (activeFilter !== 'all' && f.category !== activeFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesDrop = f.primaryDropName.toLowerCase().includes(q);
        const matchesAura = f.passiveAuraTitle.toLowerCase().includes(q) || f.passiveAuraDesc.toLowerCase().includes(q);
        const matchesEra = f.era.toLowerCase().includes(q);
        const matchesDiet = f.dietLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesDrop && !matchesAura && !matchesEra && !matchesDiet) {
          return false;
        }
      }

      const telemetry = getCreatureTelemetry(f);
      if (filterReadyOnly && telemetry.readyCount <= 0) {
        return false;
      }
      if (filterLowTroughOnly && telemetry.troughPct > 25) {
        return false;
      }

      return true;
    });
  }, [activeFilter, searchQuery, filterReadyOnly, filterLowTroughOnly, animals, prehistoricSanctuary, domesticTroughs, silo, barn, now]);

  // Overall statistics
  const overallStats = useMemo(() => {
    let totalLiving = 0;
    let readyTotal = 0;
    let activeAurasCount = 0;
    let fedCount = 0;

    for (const f of ESTATE_MENAGERIE_REGISTRY) {
      const telemetry = getCreatureTelemetry(f);
      totalLiving += telemetry.headcount;
      readyTotal += telemetry.readyCount;
      if (telemetry.isAuraActive) activeAurasCount++;
      if (telemetry.troughPct > 0) fedCount++;
    }

    return { totalLiving, readyTotal, activeAurasCount, fedCount };
  }, [animals, prehistoricSanctuary, domesticTroughs, silo, barn, now]);

  // Refill action handler
  const handleRefillTrough = (fauna: FaunaDefinition, amount?: number) => {
    if (fauna.category === 'modern_farm' && fauna.speciesKey) {
      const success = refillDomesticTrough(fauna.speciesKey, amount);
      if (success) {
        setRefillFeedback(`🥣 Refilled ${fauna.name} trough!`);
        setTimeout(() => setRefillFeedback(null), 2500);
      }
    } else if (fauna.category === 'prehistoric_reserve' && fauna.enclosureType) {
      const success = depositEnclosureFeed(fauna.enclosureType, amount || 100);
      if (success) {
        setRefillFeedback(`🥣 Refilled ${fauna.name} terrarium!`);
        setTimeout(() => setRefillFeedback(null), 2500);
      }
    }
  };

  // Collect action handler
  const handleCollectOutput = (fauna: FaunaDefinition) => {
    if (fauna.category === 'modern_farm' && fauna.speciesKey) {
      collectDomesticHarvest(fauna.speciesKey);
    } else if (fauna.category === 'prehistoric_reserve' && fauna.enclosureType) {
      collectEnclosureHarvest(fauna.enclosureType);
    }
  };

  // Batch actions
  const handleBatchRefillAll = () => {
    const result = refillAllFaunaTroughs();
    setRefillFeedback(`🌾 Batch refilled ${result.refilledDomestic + result.refilledPrehistoric} fauna troughs!`);
    setTimeout(() => setRefillFeedback(null), 3000);
  };

  const handleBatchCollectAll = () => {
    collectAllFaunaHarvests();
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md transition-all animate-fadeIn select-none">
      <div
        className={`relative w-full bg-gradient-to-b from-stone-900 via-stone-920 to-neutral-950 border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isExpanded ? 'h-[98vh] max-w-[98vw]' : 'h-[92vh] max-w-7xl'
        }`}
      >
        {/* --- MODAL HEADER & COMMAND RIBBON --- */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
          {/* Title & Lore Subheading */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 ring-1 ring-amber-300/40">
              📖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-amber-100 tracking-wide font-serif">
                  Estate Menagerie & Fauna Codex
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Unified Compendium
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Consolidated management of 4 Modern Farm Livestock & 6 Prehistoric Reserve Sanctuary Fauna.
              </p>
            </div>
          </div>

          {/* Quick Stats Pill Strip */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
            <div className="bg-stone-950/80 border border-stone-800 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
              <span className="text-stone-400 text-[10px] uppercase font-bold">Living Fauna:</span>
              <span className="font-black text-amber-300">{overallStats.totalLiving}</span>
            </div>
            <div className="bg-stone-950/80 border border-stone-800 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
              <span className="text-stone-400 text-[10px] uppercase font-bold">Active Auras:</span>
              <span className="font-black text-emerald-400">{overallStats.activeAurasCount}/10</span>
            </div>
            <div className="bg-stone-950/80 border border-stone-800 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
              <span className="text-stone-400 text-[10px] uppercase font-bold">Total Drops:</span>
              <span className="font-black text-cyan-300">{totalFaunaHarvests}</span>
            </div>
          </div>

          {/* Batch Actions & Window Controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Batch Refill All */}
            <button
              onClick={handleBatchRefillAll}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-amber-400/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              title="Refill all hungry troughs with available barn/silo stock"
            >
              <span>🥣</span>
              <span className="hidden sm:inline">Refill All</span>
            </button>

            {/* Batch Collect All */}
            <button
              onClick={handleBatchCollectAll}
              disabled={overallStats.readyTotal <= 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${
                overallStats.readyTotal > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 animate-pulse ring-2 ring-emerald-400/50'
                  : 'bg-stone-800/60 text-stone-500 border border-stone-800 cursor-not-allowed'
              }`}
              title="Collect all ready eggs, milk, wool, truffles, and prehistoric shed molts"
            >
              <span>✨</span>
              <span>Collect All ({overallStats.readyTotal})</span>
            </button>

            {/* Expand / Minimize Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-sm font-bold transition"
              title={isExpanded ? 'Restore window size' : 'Expand full-screen'}
            >
              {isExpanded ? '🗗' : '🗖'}
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-stone-800/80 hover:bg-rose-900/60 text-stone-400 hover:text-rose-200 text-base font-bold transition flex items-center justify-center border border-stone-700"
              title="Close Codex"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {refillFeedback && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-1 text-center text-xs font-bold text-amber-200 animate-pulse">
            {refillFeedback}
          </div>
        )}

        {/* --- TOP SUB-NAVIGATION & FILTER RIBBON --- */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-stone-950/60 border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Sub-Nav Buttons: Fixed parameters from Task Matrix */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
                activeFilter === 'all'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                  : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <span>🐾</span>
              <span>All Fauna (10)</span>
            </button>

            <button
              onClick={() => setActiveFilter('modern_farm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
                activeFilter === 'modern_farm'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-sm'
                  : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <span>🚜</span>
              <span>Farm Livestock (4)</span>
            </button>

            <button
              onClick={() => setActiveFilter('prehistoric_reserve')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
                activeFilter === 'prehistoric_reserve'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                  : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <span>🦖</span>
              <span>Prehistoric Sanctuary (6)</span>
            </button>
          </div>

          {/* Search & Quick Toggles */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            {/* Ready Toggle */}
            <button
              onClick={() => setFilterReadyOnly(!filterReadyOnly)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                filterReadyOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              ✨ Ready Only
            </button>

            {/* Low Trough Toggle */}
            <button
              onClick={() => setFilterLowTroughOnly(!filterLowTroughOnly)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                filterLowTroughOnly
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              🥣 Low Troughs
            </button>

            {/* Text Search */}
            <div className="relative min-w-[140px] sm:min-w-[180px]">
              <input
                type="text"
                placeholder="Search fauna, diet, drops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900/90 border border-stone-800 focus:border-amber-400 rounded-xl px-2.5 py-1 text-xs text-stone-200 placeholder-stone-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1 text-stone-500 hover:text-stone-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- MAIN SCROLLABLE CREATURE CARD GRID --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredFauna.map((fauna) => {
              const tel = getCreatureTelemetry(fauna);
              const tierStyle = FAUNA_TIER_COLORS[fauna.tier];
              const isAuraHighlighted = highlightedAuraId === fauna.id;

              return (
                <div
                  key={fauna.id}
                  id={`fauna-card-${fauna.id}`}
                  className={`relative rounded-2xl bg-gradient-to-b from-stone-900/95 via-stone-900/80 to-stone-950/95 border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg ${
                    tierStyle.border
                  } ${isAuraHighlighted ? 'ring-2 ring-amber-400 scale-[1.01]' : ''}`}
                >
                  {/* Top Ambient Glow by Rarity */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      fauna.tier === 'legendary'
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600'
                        : fauna.tier === 'rare'
                        ? 'bg-gradient-to-r from-sky-500 via-blue-400 to-sky-600'
                        : fauna.tier === 'uncommon'
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
                        : 'bg-stone-500'
                    }`}
                  />

                  <div className="p-4 sm:p-5 space-y-4">
                    {/* 1. CARD HEADER */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Entity Icon with Rarity Ring */}
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-inner border ${tierStyle.border} ${tierStyle.bgLight}`}
                        >
                          <span className="hover:scale-110 transition-transform">{fauna.emoji}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-base sm:text-lg text-stone-100 leading-tight">
                              {fauna.name}
                            </h3>
                          </div>
                          <div className="text-[11px] font-mono text-stone-400 italic leading-tight mt-0.5">
                            {fauna.scientificOrBreedName}
                          </div>
                        </div>
                      </div>

                      {/* Tier & Era Badge */}
                      <div className="text-right flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shadow-xs ${tierStyle.badge}`}
                        >
                          {fauna.tierBadgeLabel}
                        </span>
                        <span className="text-[9px] text-stone-400 font-mono">
                          {fauna.eraShort}
                        </span>
                      </div>
                    </div>

                    {/* 2. POPULATION & ENCLOSURE STATUS */}
                    <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🏠</span>
                          <span className="text-stone-300 font-bold">{fauna.enclosureName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tel.headcount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-stone-600'
                            }`}
                          />
                          <span
                            className={`font-mono font-bold text-xs ${
                              tel.headcount > 0 ? 'text-amber-300' : 'text-stone-500'
                            }`}
                          >
                            Living: {tel.headcount}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-stone-400 flex items-center justify-between font-mono border-t border-stone-800/60 pt-1">
                        <span className="truncate">{fauna.enclosureLinkStatus}</span>
                        <span className="text-emerald-400/80 shrink-0 font-bold ml-1">● Coupled</span>
                      </div>
                    </div>

                    {/* 3. TROUGH & DIET GAUGE */}
                    <div className="space-y-1.5 bg-stone-950/40 border border-stone-800/60 rounded-xl p-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <span>{fauna.dietEmoji}</span>
                          <span className="text-stone-300 font-bold text-[11px] truncate" title={fauna.dietLabel}>
                            {fauna.dietLabel}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] font-bold">
                          <span
                            className={
                              tel.troughPct > 35
                                ? 'text-emerald-400'
                                : tel.troughPct > 10
                                ? 'text-amber-400'
                                : 'text-rose-400 animate-pulse'
                            }
                          >
                            {tel.troughLevel}
                          </span>
                          <span className="text-stone-500"> / {tel.troughMax}</span>
                        </div>
                      </div>

                      {/* Feed Bar */}
                      <div className="h-2 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            tel.troughPct > 35
                              ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                              : tel.troughPct > 10
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                              : 'bg-gradient-to-r from-rose-600 to-red-500'
                          }`}
                          style={{ width: `${tel.troughPct}%` }}
                        />
                      </div>

                      {/* In-Storage Stock & Direct Refill Action */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        <span className="text-[10px] text-stone-400 font-mono truncate">
                          Stock: {tel.availableDietStock} units
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleRefillTrough(fauna, 25)}
                            disabled={tel.availableDietStock <= 0 || tel.troughLevel >= tel.troughMax}
                            className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-bold text-stone-300 border border-stone-700 transition"
                            title="Add 25 units"
                          >
                            +25
                          </button>
                          <button
                            onClick={() => handleRefillTrough(fauna)}
                            disabled={tel.availableDietStock <= 0 || tel.troughLevel >= tel.troughMax}
                            className="px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-black transition active:scale-95 cursor-pointer"
                            title="Refill trough to max capacity from barn & silo stock"
                          >
                            [ Refill Trough ]
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4. DROP PRODUCTION METER */}
                    <div className="space-y-1.5 bg-stone-950/40 border border-stone-800/60 rounded-xl p-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{fauna.primaryDropEmoji}</span>
                          <div>
                            <div className="text-stone-200 font-bold text-xs">{fauna.primaryDropName}</div>
                            <div className="text-[9px] text-stone-400 leading-tight">{fauna.primaryDropUsage}</div>
                          </div>
                        </div>

                        {tel.readyCount > 0 ? (
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 animate-bounce">
                            Ready: {tel.readyCount}
                          </span>
                        ) : tel.isTroughEmpty ? (
                          <span className="text-[10px] font-mono text-rose-400 font-bold">
                            ⏸️ Paused (Empty Trough)
                          </span>
                        ) : tel.headcount > 0 ? (
                          <span className="text-[10px] font-mono text-cyan-300 font-bold">
                            ⏳ {tel.minTimeRemaining}s
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-stone-500">
                            💤 Empty
                          </span>
                        )}
                      </div>

                      {/* Linear Animated Progress Bar */}
                      <div className="relative h-2 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            tel.readyCount > 0
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                              : tel.isTroughEmpty
                              ? 'bg-stone-600'
                              : 'bg-gradient-to-r from-cyan-500 to-sky-400'
                          }`}
                          style={{ width: `${tel.progressPct}%` }}
                        />
                        {tel.isProducing && !tel.isTroughEmpty && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        )}
                      </div>

                      {/* Collect Output Button */}
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => handleCollectOutput(fauna)}
                          disabled={tel.readyCount <= 0}
                          className={`w-full py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 active:scale-95 ${
                            tel.readyCount > 0
                              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 shadow-md ring-2 ring-amber-400/40 animate-pulse cursor-pointer'
                              : 'bg-stone-800/40 text-stone-600 border border-stone-800/60 cursor-not-allowed'
                          }`}
                        >
                          <span>{fauna.primaryDropEmoji}</span>
                          <span>
                            {tel.readyCount > 0
                              ? `Collect Output (${tel.readyCount})`
                              : 'Awaiting Next Output'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 5. ACTIVE ESTATE AURA BANNER (Highlighted Footer) */}
                  <div
                    className={`px-4 py-2.5 border-t transition-all ${
                      tel.isAuraActive
                        ? 'bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/40 border-amber-500/30 text-amber-200'
                        : 'bg-stone-950/80 border-stone-800/80 text-stone-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>{fauna.passiveAuraEmoji}</span>
                        <span className="font-extrabold text-[11px] text-amber-300">
                          {fauna.passiveAuraTitle}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full border ${
                          tel.isAuraActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-stone-800 text-stone-500 border-stone-700'
                        }`}
                      >
                        {tel.isAuraActive ? '🟢 Aura Active' : '⏸️ Paused'}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-tight">
                      {fauna.passiveAuraDesc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- 6. ESTATE AURAS SUMMARY BAR (PINNED BOTTOM DRAWER) --- */}
        <div className="shrink-0 p-3 sm:p-4 bg-stone-950/95 border-t border-amber-500/30 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                  Macro-Estate Auras Active ({overallStats.activeAurasCount}/10)
                </span>
                <span className="text-[10px] text-stone-400 hidden sm:inline">
                  • Driven by Fed Livestock & Sanctuary Fauna
                </span>
              </div>
              <div className="text-[11px] text-stone-400">
                Creatures provide passive weather shields, soil conditioning, and production boosts when troughs are maintained.
              </div>
            </div>
          </div>

          {/* Active Buff Pills Carousel / Ribbon */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none flex-wrap sm:flex-nowrap">
            {ESTATE_MENAGERIE_REGISTRY.map((fauna) => {
              const tel = getCreatureTelemetry(fauna);
              const isActive = tel.isAuraActive;

              return (
                <button
                  key={fauna.id}
                  onClick={() => {
                    setHighlightedAuraId(fauna.id);
                    const el = document.getElementById(`fauna-card-${fauna.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => setHighlightedAuraId(null), 2000);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono transition flex items-center gap-1 border shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                      : 'bg-stone-900/60 border-stone-800 text-stone-500 opacity-60 hover:opacity-80'
                  }`}
                  title={`${fauna.name}: ${fauna.passiveAuraTitle} — ${fauna.passiveAuraDesc}`}
                >
                  <span>{fauna.passiveAuraEmoji}</span>
                  <span className="font-extrabold">{fauna.passiveAuraSummary}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
