'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore, type ActiveBreeding, type AnimalInstance } from '@/game/store';
import {
  ANIMALS,
  TIER_COLORS,
  TIER_LABELS,
  BREED_REGISTRY,
  BREEDING_SLOT_UPGRADES,
  type AnimalSpecies,
  type Tier,
} from '@/game/data';
import {
  getBreedingOddsBreakdown,
  INCUBATION_TIMES,
} from '@/utils/breedingLogic';
import {
  playGoldRushFanfare,
  playVictoryChime,
  playRapidTapSound,
  playCashRegisterSound,
  playDefeatSound,
  playClockTickSound,
} from '@/lib/soundEffects';

const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];

interface BreedingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BreedingModal({ isOpen, onClose }: BreedingModalProps) {
  const {
    animals,
    coins,
    gems,
    level,
    breedingSlots,
    activeBreedings,
    breedAnimals,
    speedUpBreeding,
    claimHatchedAnimal,
    upgradeBreedingSlot,
    animalCapacity,
    hatchReveal,
    clearHatchReveal,
  } = useGameStore();

  const [selectedSpecies, setSelectedSpecies] = useState<AnimalSpecies>('chicken');
  const [parent1Id, setParent1Id] = useState<string | null>(null);
  const [parent2Id, setParent2Id] = useState<string | null>(null);
  const [crackTaps, setCrackTaps] = useState(0);
  const [isHatchingRevealed, setIsHatchingRevealed] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Clock tick for live countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset crack animation when new hatchReveal opens
  useEffect(() => {
    if (hatchReveal) {
      setCrackTaps(0);
      setIsHatchingRevealed(false);
    }
  }, [hatchReveal]);

  if (!isOpen) return null;

  // Selected parent animal objects
  const parent1 = animals.find(a => a.id === parent1Id && a.species === selectedSpecies);
  const parent2 = animals.find(a => a.id === parent2Id && a.species === selectedSpecies);

  // Available animals of selected species that aren't fed/breeding/elder
  const availableAnimals = animals.filter(
    a => a.species === selectedSpecies && !a.fed && !a.productReady && a.age !== 'elder'
  );

  // Species info & habitat capacity
  const speciesDef = ANIMALS[selectedSpecies];
  const currentCount = animals.filter(a => a.species === selectedSpecies).length;
  const maxCap = animalCapacity[selectedSpecies] || speciesDef.capacity;
  const isHabitatFull = currentCount >= maxCap;

  // Odds breakdown if both parents are selected
  const oddsBreakdown = parent1 && parent2
    ? getBreedingOddsBreakdown(parent1.tier, parent2.tier)
    : null;

  // Slot upgrade info
  const nextSlotUpgrade = BREEDING_SLOT_UPGRADES.find(u => u.slotIndex === breedingSlots + 1);

  // Handlers
  const handleSelectAnimal = (animal: AnimalInstance) => {
    if (parent1Id === animal.id) {
      setParent1Id(null);
      return;
    }
    if (parent2Id === animal.id) {
      setParent2Id(null);
      return;
    }
    if (!parent1Id) {
      setParent1Id(animal.id);
    } else if (!parent2Id) {
      setParent2Id(animal.id);
    } else {
      // replace parent 2
      setParent2Id(animal.id);
    }
  };

  const handleStartBreeding = () => {
    if (!parent1Id || !parent2Id) return;
    if (activeBreedings.length >= breedingSlots) {
      playDefeatSound();
      return;
    }
    const success = breedAnimals(parent1Id, parent2Id);
    if (success) {
      setParent1Id(null);
      setParent2Id(null);
    }
  };

  const handleSpeedUp = (breedingId: string) => {
    speedUpBreeding(breedingId);
  };

  const handleHatch = (breedingId: string) => {
    claimHatchedAnimal(breedingId);
  };

  const handleCrackEgg = () => {
    const nextTaps = crackTaps + 1;
    setCrackTaps(nextTaps);
    playRapidTapSound(nextTaps);

    if (nextTaps >= 3) {
      setIsHatchingRevealed(true);
      if (hatchReveal?.animal.tier === 'legendary' || hatchReveal?.animal.isMutated) {
        playGoldRushFanfare();
      } else {
        playVictoryChime();
      }
    }
  };

  const handleCloseReveal = () => {
    clearHatchReveal();
    setCrackTaps(0);
    setIsHatchingRevealed(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border-2 border-violet-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-violet-950/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-950/80 via-purple-950/80 to-stone-900 px-6 py-4 border-b border-violet-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30">
              🧬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide">
                  Animal Breeding & Incubator
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-400/30 px-2 py-0.5 rounded-full">
                  Mutation Engine v2
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Pair purebred livestock to trigger upward mutations into Rare & Legendary breeds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-all border border-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

          {/* SECTION 1: ACTIVE INCUBATOR SLOTS */}
          <div className="bg-stone-950/60 border border-violet-900/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥚</span>
                <h3 className="font-bold text-sm text-stone-100 tracking-wide uppercase">
                  Incubator Chambers ({activeBreedings.length}/{breedingSlots} Active)
                </h3>
              </div>
              {nextSlotUpgrade && (
                <button
                  onClick={upgradeBreedingSlot}
                  disabled={level < nextSlotUpgrade.unlockLevel || gems < nextSlotUpgrade.costGems}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white shadow transition-all flex items-center gap-1.5"
                >
                  <span>💎</span>
                  Unlock Slot {nextSlotUpgrade.slotIndex} ({nextSlotUpgrade.costGems} Gems)
                  {level < nextSlotUpgrade.unlockLevel && ` • Lv.${nextSlotUpgrade.unlockLevel}`}
                </button>
              )}
            </div>

            {/* Grid of Incubator Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: breedingSlots }).map((_, slotIdx) => {
                const breeding = activeBreedings[slotIdx];

                if (breeding) {
                  const elapsed = now - breeding.startedAt;
                  const remainingSec = Math.max(0, Math.ceil((breeding.durationMs - elapsed) / 1000));
                  const progress = Math.min(1, elapsed / breeding.durationMs);
                  const isReady = remainingSec <= 0;
                  const speedUpCost = Math.max(5, Math.ceil(remainingSec * 0.5));
                  const spDef = ANIMALS[breeding.species];

                  const parent1Obj = animals.find(a => a.id === breeding.parent1Id);
                  const parent2Obj = animals.find(a => a.id === breeding.parent2Id);
                  const p1Label = parent1Obj ? (BREED_REGISTRY[parent1Obj.breedId]?.name || TIER_LABELS[parent1Obj.tier]) : 'Parent';
                  const p2Label = parent2Obj ? (BREED_REGISTRY[parent2Obj.breedId]?.name || TIER_LABELS[parent2Obj.tier]) : 'Parent';

                  const formatTime = (sec: number) => {
                    const m = Math.floor(sec / 60);
                    const s = sec % 60;
                    return `${m}:${s < 10 ? '0' : ''}${s}`;
                  };

                  return (
                    <div
                      key={breeding.id}
                      className={`relative rounded-xl border-2 p-3 transition-all flex flex-col justify-between overflow-hidden ${
                        isReady
                          ? 'border-amber-400 bg-gradient-to-b from-amber-950/60 to-stone-900 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50'
                          : 'border-violet-600/40 bg-stone-900/90'
                      }`}
                    >
                      {/* Background aura on ready */}
                      {isReady && (
                        <div className="absolute inset-0 bg-radial from-amber-500/10 to-transparent pointer-events-none animate-pulse" />
                      )}

                      <div>
                        {/* Header: Species + Slot */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">{spDef?.emoji}</span>
                            <span className="text-xs font-bold text-white capitalize">
                              {spDef?.name} Egg
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                            Slot #{slotIdx + 1}
                          </span>
                        </div>

                        {/* Animated Egg Centerpiece */}
                        <div className="my-2 flex flex-col items-center justify-center py-1">
                          <div
                            className={`text-4xl transition-transform ${
                              isReady
                                ? 'animate-bounce cursor-pointer hover:scale-110 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                                : 'animate-[wiggle_2s_ease-in-out_infinite]'
                            }`}
                            onClick={() => isReady && handleHatch(breeding.id)}
                          >
                            🥚
                          </div>
                          <div className="text-[11px] font-medium text-stone-300 mt-1 truncate max-w-[90%] text-center">
                            {p1Label} × {p2Label}
                          </div>
                        </div>

                        {/* Progress Bar & Countdown */}
                        {!isReady ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                              <span>Incubating...</span>
                              <span className="text-violet-300 font-bold">{formatTime(remainingSec)}</span>
                            </div>
                            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                              <div
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
                                style={{ width: `${progress * 100}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-1">
                            <span className="inline-flex items-center gap-1 text-xs font-black text-amber-400 animate-pulse uppercase tracking-wider">
                              ✨ Ready to Hatch!
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="mt-3 pt-2 border-t border-stone-800/80">
                        {isReady ? (
                          <button
                            onClick={() => handleHatch(breeding.id)}
                            className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs rounded-lg shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <span>🎉</span>
                            HATCH EGG! (Reveal)
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSpeedUp(breeding.id)}
                            disabled={coins < speedUpCost}
                            className="w-full py-1.5 bg-violet-600/80 hover:bg-violet-600 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 border border-violet-500/50"
                          >
                            <span>⚡</span>
                            Speed Up (🪙 {speedUpCost})
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // Empty Unlocked Slot
                return (
                  <div
                    key={`empty-${slotIdx}`}
                    className="rounded-xl border-2 border-dashed border-stone-800 bg-stone-900/40 p-4 flex flex-col items-center justify-center text-center space-y-2 min-h-[160px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-stone-800/60 flex items-center justify-center text-lg text-stone-500 border border-stone-700">
                      🪹
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-400">
                        Slot #{slotIdx + 1} Empty
                      </div>
                      <div className="text-[10px] text-stone-600 mt-0.5">
                        Select two parents below to start incubation
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: PARENT SELECTION & PROBABILITY ENGINE */}
          <div className="space-y-4">
            
            {/* Species Selector Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                {SPECIES_LIST.map(species => {
                  const def = ANIMALS[species];
                  const count = animals.filter(a => a.species === species).length;
                  const isSelected = selectedSpecies === species;

                  return (
                    <button
                      key={species}
                      onClick={() => {
                        setSelectedSpecies(species);
                        setParent1Id(null);
                        setParent2Id(null);
                      }}
                      className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-600/30'
                          : 'bg-stone-900 text-stone-400 border-stone-800 hover:bg-stone-800 hover:text-stone-200'
                      }`}
                    >
                      <span className="text-base">{def.emoji}</span>
                      <span className="capitalize">{def.name}s</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-stone-300">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Habitat Capacity Badge */}
              <div className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium ${
                isHabitatFull
                  ? 'bg-red-950/60 border-red-500/40 text-red-300'
                  : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}>
                <span>{speciesDef.habitatEmoji}</span>
                <span>{speciesDef.habitat}: {currentCount}/{maxCap}</span>
                {isHabitatFull && <span className="font-bold text-red-400">(FULL)</span>}
              </div>
            </div>

            {/* Parent Matched Breeding Bench */}
            <div className="bg-gradient-to-r from-stone-900 via-violet-950/30 to-stone-900 border border-violet-900/50 rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Parent 1 Card Slot */}
                <div className="border border-stone-800 bg-stone-950/70 rounded-xl p-3 flex flex-col justify-between min-h-[120px]">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-violet-400">
                      Parent 1 (Dam / Sire)
                    </span>
                    {parent1 && (
                      <button
                        onClick={() => setParent1Id(null)}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {parent1 ? (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
                        style={{
                          borderColor: TIER_COLORS[parent1.tier],
                          backgroundColor: `${TIER_COLORS[parent1.tier]}15`,
                        }}
                      >
                        {speciesDef.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded"
                            style={{
                              color: TIER_COLORS[parent1.tier],
                              backgroundColor: `${TIER_COLORS[parent1.tier]}20`,
                            }}
                          >
                            {TIER_LABELS[parent1.tier]}
                          </span>
                          {parent1.isMutated && (
                            <span className="text-[9px] font-bold text-fuchsia-300 bg-fuchsia-950 px-1 rounded border border-fuchsia-500/40">
                              Apex Mutant
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white truncate mt-0.5">
                          {BREED_REGISTRY[parent1.breedId]?.name || `${speciesDef.name}`}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {parent1.cyclesRemaining}/{parent1.maxCycles} lifetime cycles
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500 py-3">
                      <span className="text-xl mb-1">➕</span>
                      <span className="text-xs">Select Parent 1 from list below</span>
                    </div>
                  )}
                </div>

                {/* Parent 2 Card Slot */}
                <div className="border border-stone-800 bg-stone-950/70 rounded-xl p-3 flex flex-col justify-between min-h-[120px]">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-fuchsia-400">
                      Parent 2 (Dam / Sire)
                    </span>
                    {parent2 && (
                      <button
                        onClick={() => setParent2Id(null)}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {parent2 ? (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
                        style={{
                          borderColor: TIER_COLORS[parent2.tier],
                          backgroundColor: `${TIER_COLORS[parent2.tier]}15`,
                        }}
                      >
                        {speciesDef.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded"
                            style={{
                              color: TIER_COLORS[parent2.tier],
                              backgroundColor: `${TIER_COLORS[parent2.tier]}20`,
                            }}
                          >
                            {TIER_LABELS[parent2.tier]}
                          </span>
                          {parent2.isMutated && (
                            <span className="text-[9px] font-bold text-fuchsia-300 bg-fuchsia-950 px-1 rounded border border-fuchsia-500/40">
                              Apex Mutant
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white truncate mt-0.5">
                          {BREED_REGISTRY[parent2.breedId]?.name || `${speciesDef.name}`}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {parent2.cyclesRemaining}/{parent2.maxCycles} lifetime cycles
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500 py-3">
                      <span className="text-xl mb-1">➕</span>
                      <span className="text-xs">Select Parent 2 from list below</span>
                    </div>
                  )}
                </div>

              </div>

              {/* REAL-TIME MUTATION PROBABILITY ENGINE DISPLAY */}
              {parent1 && parent2 && oddsBreakdown && (
                <div className="bg-stone-950/90 border border-violet-500/40 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📊</span>
                      <h4 className="text-xs font-black text-white tracking-wider uppercase">
                        Offspring Tier Probability Breakdown
                      </h4>
                    </div>
                    {oddsBreakdown.upwardMutationChance > 0 && (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-400/50 animate-pulse">
                        ⚡ {oddsBreakdown.upwardMutationChance}% Upward Mutation Chance!
                      </span>
                    )}
                  </div>

                  {/* Tier Probability Bars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Common */}
                    <div className="bg-stone-900 border border-stone-800 rounded-lg p-2 text-center">
                      <div className="text-[10px] font-bold text-stone-400 uppercase">Common</div>
                      <div className="text-lg font-black text-stone-300 font-mono">
                        {oddsBreakdown.common}%
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-stone-400 transition-all duration-300"
                          style={{ width: `${oddsBreakdown.common}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-stone-500 mt-1">2m hatch</div>
                    </div>

                    {/* Uncommon */}
                    <div className="bg-stone-900 border border-emerald-950 rounded-lg p-2 text-center">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase">Uncommon</div>
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        {oddsBreakdown.uncommon}%
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${oddsBreakdown.uncommon}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-stone-500 mt-1">5m hatch</div>
                    </div>

                    {/* Rare */}
                    <div className="bg-stone-900 border border-sky-950 rounded-lg p-2 text-center">
                      <div className="text-[10px] font-bold text-sky-400 uppercase">Rare</div>
                      <div className="text-lg font-black text-sky-400 font-mono">
                        {oddsBreakdown.rare}%
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 transition-all duration-300"
                          style={{ width: `${oddsBreakdown.rare}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-stone-500 mt-1">10m hatch</div>
                    </div>

                    {/* Legendary */}
                    <div className="bg-stone-900 border border-amber-950 rounded-lg p-2 text-center">
                      <div className="text-[10px] font-bold text-amber-400 uppercase">Legendary</div>
                      <div className="text-lg font-black text-amber-400 font-mono">
                        {oddsBreakdown.legendary}%
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${oddsBreakdown.legendary}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-stone-500 mt-1">20m hatch</div>
                    </div>
                  </div>

                  {/* Bonus info banner */}
                  <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                    <span className="italic">{oddsBreakdown.description}</span>
                    <span className="text-[10px] text-violet-300">
                      🧬 +5% Apex Mutant Jackpot Chance (+50% permanent speed)
                    </span>
                  </div>

                  {/* Start Breeding Button */}
                  <button
                    onClick={handleStartBreeding}
                    disabled={activeBreedings.length >= breedingSlots || isHabitatFull}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black text-sm rounded-xl shadow-lg shadow-violet-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>🥚</span>
                    <span>Start Incubation ({activeBreedings.length}/{breedingSlots} slots)</span>
                  </button>

                  {isHabitatFull && (
                    <div className="text-center text-xs text-red-400 font-medium">
                      ⚠️ Cannot start breeding: {speciesDef.habitat} is currently full ({maxCap}/{maxCap}).
                    </div>
                  )}
                  {activeBreedings.length >= breedingSlots && (
                    <div className="text-center text-xs text-amber-400 font-medium">
                      ⚠️ Incubator chambers full. Unlock an additional slot or wait for current eggs to hatch!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List of Available Animals to Pick As Parents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Available {speciesDef.name}s on Farm ({availableAnimals.length})
                </h4>
                <span className="text-[11px] text-stone-500">
                  Tap an animal to select as parent
                </span>
              </div>

              {availableAnimals.length < 2 ? (
                <div className="border border-stone-800 bg-stone-900/50 rounded-xl p-6 text-center text-stone-400 space-y-2">
                  <div className="text-3xl">{speciesDef.emoji}</div>
                  <div className="text-sm font-bold text-stone-300">
                    Need at least 2 available {speciesDef.name.toLowerCase()}s
                  </div>
                  <div className="text-xs text-stone-500 max-w-sm mx-auto">
                    Ensure your animals are not resting, uncollected, or exhausted. You can buy additional livestock in the Coop / Barn tab!
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {availableAnimals.map(animal => {
                    const breedDef = BREED_REGISTRY[animal.breedId];
                    const breedName = breedDef?.name || TIER_LABELS[animal.tier];
                    const isParent1 = parent1Id === animal.id;
                    const isParent2 = parent2Id === animal.id;
                    const isSelected = isParent1 || isParent2;

                    return (
                      <button
                        key={animal.id}
                        onClick={() => handleSelectAnimal(animal)}
                        className={`rounded-xl border p-2.5 text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-violet-400 bg-violet-950/80 shadow-md shadow-violet-500/30 ring-2 ring-violet-400'
                            : 'border-stone-800 bg-stone-900/80 hover:border-stone-600 hover:bg-stone-800/80'
                        }`}
                      >
                        {/* Selected parent badge */}
                        {isParent1 && (
                          <span className="absolute top-1.5 right-1.5 bg-violet-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                            P1
                          </span>
                        )}
                        {isParent2 && (
                          <span className="absolute top-1.5 right-1.5 bg-fuchsia-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                            P2
                          </span>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-lg">{speciesDef.emoji}</span>
                            <span
                              className="text-[9px] font-black uppercase px-1 rounded leading-tight"
                              style={{
                                color: TIER_COLORS[animal.tier],
                                backgroundColor: `${TIER_COLORS[animal.tier]}20`,
                              }}
                            >
                              {TIER_LABELS[animal.tier]}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white truncate" title={breedName}>
                            {breedName}
                          </div>
                        </div>

                        <div className="mt-2 pt-1 border-t border-stone-800/60 text-[10px] text-stone-400 flex justify-between items-center">
                          <span>{animal.cyclesRemaining}/{animal.maxCycles} cycles</span>
                          {animal.isMutated && <span className="text-fuchsia-400 font-bold">🧬 Apex</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ANIMATED CELEBRATORY EGG-HATCHING REVEAL MODAL */}
      {hatchReveal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-gradient-to-b from-stone-900 via-stone-950 to-black border-2 border-amber-400/60 rounded-3xl p-6 text-center shadow-2xl shadow-amber-500/40 overflow-hidden">
            
            {/* Ambient Background Burst */}
            <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent pointer-events-none animate-pulse" />

            {!isHatchingRevealed ? (
              /* STAGE 1: CRACKING THE EGG */
              <div className="space-y-6 py-6 relative z-10">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                    ✨ Egg Incubation Complete ✨
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    Tap to Hatch Your Egg!
                  </h3>
                  <p className="text-xs text-stone-400">
                    Lineage: {hatchReveal.parent1BreedName} × {hatchReveal.parent2BreedName}
                  </p>
                </div>

                {/* Wobbling / Cracking Interactive Egg */}
                <div className="py-4">
                  <button
                    onClick={handleCrackEgg}
                    className="relative text-8xl focus:outline-none transition-transform active:scale-90 select-none animate-[wiggle_1.5s_ease-in-out_infinite]"
                  >
                    🥚
                    {crackTaps > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-amber-300 font-black text-4xl animate-ping">
                        💥
                      </span>
                    )}
                  </button>
                  <div className="text-xs font-mono font-bold text-amber-300 mt-2">
                    {crackTaps === 0 && 'Tap egg to crack! (0/3)'}
                    {crackTaps === 1 && 'Cracking... Keep tapping! (1/3)'}
                    {crackTaps === 2 && 'Almost ready to burst! (2/3)'}
                  </div>
                </div>

                <div className="w-48 h-2 bg-stone-800 rounded-full mx-auto overflow-hidden border border-stone-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-200"
                    style={{ width: `${(crackTaps / 3) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              /* STAGE 2: REVEALED ANIMAL CELEBRATION */
              <div className="space-y-5 py-2 relative z-10 animate-in zoom-in-75 duration-300">
                
                {/* Rarity Flare Header */}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                    style={{
                      color: TIER_COLORS[hatchReveal.animal.tier],
                      backgroundColor: `${TIER_COLORS[hatchReveal.animal.tier]}25`,
                      border: `1px solid ${TIER_COLORS[hatchReveal.animal.tier]}60`,
                    }}
                  >
                    ✨ {TIER_LABELS[hatchReveal.animal.tier]} Offspring Hatched! ✨
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-wide mt-1">
                    {hatchReveal.breedName}
                  </h3>
                </div>

                {/* Giant Avatar & Sparkle Burst */}
                <div className="relative py-4 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl shadow-2xl relative"
                    style={{
                      borderColor: TIER_COLORS[hatchReveal.animal.tier],
                      borderWidth: '3px',
                      backgroundColor: `${TIER_COLORS[hatchReveal.animal.tier]}15`,
                      boxShadow: `0 0 30px ${TIER_COLORS[hatchReveal.animal.tier]}40`,
                    }}
                  >
                    {ANIMALS[hatchReveal.animal.species]?.emoji}
                    <span className="absolute -top-2 -right-2 text-2xl animate-bounce">
                      ✨
                    </span>
                  </div>
                </div>

                {/* Badges: Upward Mutation & Codex Discovery */}
                <div className="space-y-2">
                  {hatchReveal.wasMutationUp && (
                    <div className="bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-400/60 rounded-xl p-2.5 text-xs text-emerald-200 font-bold flex items-center justify-center gap-2 shadow-sm">
                      <span>🎉</span>
                      <span>SUCCESSFUL UPWARD TIER MUTATION!</span>
                    </div>
                  )}

                  {hatchReveal.animal.isMutated && (
                    <div className="bg-gradient-to-r from-fuchsia-950/80 to-purple-950/80 border border-fuchsia-400/60 rounded-xl p-2.5 text-xs text-fuchsia-200 font-bold flex items-center justify-center gap-2 shadow-sm">
                      <span>🧬</span>
                      <span>APEX MUTANT DISCOVERED! +50% Permanent Speed</span>
                    </div>
                  )}

                  {hatchReveal.isNewCodex && (
                    <div className="bg-gradient-to-r from-amber-950/80 to-yellow-950/80 border border-amber-400/60 rounded-xl p-2.5 text-xs text-amber-200 font-bold flex items-center justify-center gap-2 shadow-sm">
                      <span>📘</span>
                      <span>NEW CODEX DISCOVERY! +{hatchReveal.gemReward} 💎 Gems</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-3 text-xs text-stone-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Species:</span>
                    <span className="font-bold capitalize">{hatchReveal.animal.species}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Lifespan:</span>
                    <span className="font-bold">{hatchReveal.animal.maxCycles} Product Cycles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Parentage:</span>
                    <span className="font-bold text-stone-400">{hatchReveal.parent1BreedName} × {hatchReveal.parent2BreedName}</span>
                  </div>
                </div>

                {/* Claim Button */}
                <button
                  onClick={handleCloseReveal}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>🌾</span>
                  Welcome to the Farm!
                </button>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
