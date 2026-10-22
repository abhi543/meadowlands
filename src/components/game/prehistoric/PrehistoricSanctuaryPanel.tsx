'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  PREHISTORIC_SPECIES_REGISTRY,
  EnclosureTypeId,
  PrehistoricSpeciesId,
} from '@/types/prehistoric';
import { FrontierTrailModal } from './FrontierTrailModal';
import { SlurryCollectionModal } from '../SlurryCollectionModal';

export function PrehistoricSanctuaryPanel() {
  const {
    amberBioLab,
    prehistoricSanctuary,
    hydrology,
    barn,
    silo,
    startSpecimenIncubation,
    collectRevivedSpecimen,
    depositEnclosureFeed,
    collectEnclosureHarvest,
    setMenagerieModalOpen,
    slurryPits,
    activeSumpModalPitId,
    setActiveSumpModalPitId,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<EnclosureTypeId | 'biolab'>('enclosure_silt_terrarium');
  const [isTrailModalOpen, setIsTrailModalOpen] = useState(false);
  const [selectedIncubationSpecies, setSelectedIncubationSpecies] = useState<Record<number, PrehistoricSpeciesId>>({
    1: 'asaphid_trilobite',
    2: 'meganeura',
    3: 'dimetrodon',
  });

  const sanctuary = prehistoricSanctuary;
  const bioLab = amberBioLab;
  const towerWater = hydrology?.towerLiters || 0;

  // Calculate total living ancient fauna
  const totalCreatures = Object.values(sanctuary?.enclosures || {}).reduce(
    (sum, enc) => sum + (enc.specimenCount || 0),
    0
  );

  return (
    <div className="space-y-6 text-stone-100">
      {/* --- TOP BANNER: Sanctuary Overview & Frontier Trail Quick Launch --- */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950/60 to-stone-900 border border-amber-500/30 p-5 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl">🏛️</span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Palaeontological Research & Fauna Reserve
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-wide">
              Prehistoric Sanctuary & Amber Bio-Lab
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl mt-1 leading-relaxed">
              Excavate Earth’s ancient strata across 5 geological eras. Revive preserved organisms in closed-loop
              hydraulic chambers, feed primeval enclosures with farm outputs, and project macro-estate weather & growth auras.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-black/50 border border-white/10 px-3.5 py-2 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-stone-400">Living Fauna</div>
              <div className="text-xl font-black text-amber-300 font-mono">{totalCreatures}</div>
            </div>

            <div className="bg-black/50 border border-white/10 px-3.5 py-2 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-stone-400">Gravity Tower</div>
              <div className="text-xl font-black text-cyan-300 font-mono">{towerWater}L</div>
            </div>

            <button
              onClick={() => setMenagerieModalOpen(true)}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center space-x-2 cursor-pointer"
              title="Open Unified Estate Menagerie & Fauna Codex Compendium"
            >
              <span>📖</span>
              <span>Estate Menagerie</span>
            </button>

            <button
              onClick={() => setIsTrailModalOpen(true)}
              className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-black text-xs tracking-wider uppercase shadow-lg active:scale-95 transition flex items-center space-x-2"
            >
              <span>🧭</span>
              <span>Launch Trail</span>
            </button>

            <button
              onClick={() => setActiveSumpModalPitId('pit_sanctuary')}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-800 via-amber-800 to-rose-900 hover:brightness-110 text-white border border-rose-500/50 font-black text-xs tracking-wider uppercase shadow-lg active:scale-95 transition flex items-center space-x-2 cursor-pointer"
              title="Inspect Industrial Sluice Vat & Primeval Slurry Output (+50% Distillation Speed)"
            >
              <span>🚰</span>
              <span>Sluice Vat ({Math.round(slurryPits?.pit_sanctuary?.currentLiters || 0)}L)</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB NAVIGATION BAR --- */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-stone-800 scrollbar-none">
        {/* Enclosure Tabs */}
        {Object.values(sanctuary?.enclosures || {}).map((enc) => {
          const spec = PREHISTORIC_SPECIES_REGISTRY[enc.speciesId];
          const isActive = activeTab === enc.enclosureId;

          return (
            <button
              key={enc.enclosureId}
              onClick={() => setActiveTab(enc.enclosureId)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-2 border ${
                isActive
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <span>{spec?.emoji || '🐾'}</span>
              <span>{spec?.name || enc.name}</span>
              {enc.specimenCount > 0 && (
                <span className="ml-1 text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-full">
                  {enc.specimenCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Amber Bio-Lab Tab */}
        <button
          onClick={() => setActiveTab('biolab')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-2 border ${
            activeTab === 'biolab'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md'
              : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-cyan-200 hover:border-stone-700'
          }`}
        >
          <span>🧬</span>
          <span>The Amber Bio-Lab</span>
          {bioLab?.chambers.some((c) => c.status === 'READY_TO_REVIVE') && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          )}
        </button>
      </div>

      {/* --- TAB CONTENT AREA --- */}
      {activeTab === 'biolab' ? (
        /* ================= AMBER BIO-LAB VIEW ================= */
        <div className="space-y-6">
          {/* Bio-Lab Coupling Card */}
          <div className="bg-stone-900 border border-cyan-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Closed-Loop Hydraulic Pipeline
                </span>
                <h2 className="text-xl font-black text-white font-serif mt-0.5">
                  The Amber Bio-Lab Incubation Bay
                </h2>
                <p className="text-xs text-stone-300">
                  Requires continuous cold-water volume pumped directly from the Elevated Gravity Tower. If the tower
                  hits 0L, chambers enter a suspended uncooled state risking specimen decay.
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="bg-black/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-right">
                  <div className="text-[10px] text-stone-400 uppercase font-bold">Gravity Tower Connection</div>
                  <div className="text-sm font-mono font-bold text-cyan-300">{towerWater}L Live Storage</div>
                </div>
              </div>
            </div>

            {/* Incubation Chambers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bioLab?.chambers.map((ch) => {
                const spec = ch.speciesId ? PREHISTORIC_SPECIES_REGISTRY[ch.speciesId] : null;
                const isReady = ch.status === 'READY_TO_REVIVE';
                const isSuspended = ch.status === 'SUSPENDED_UNCOOLED';
                const isIncubating = ch.status === 'INCUBATING';
                const isDecayed = ch.status === 'DECAYED';
                const isEmpty = ch.status === 'EMPTY';

                return (
                  <div
                    key={ch.chamberId}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                      isReady
                        ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/30'
                        : isSuspended
                        ? 'bg-amber-950/40 border-amber-500/60 animate-pulse'
                        : isDecayed
                        ? 'bg-red-950/40 border-red-500/50'
                        : isIncubating
                        ? 'bg-cyan-950/30 border-cyan-500/40'
                        : 'bg-stone-950/60 border-stone-800'
                    }`}
                  >
                    <div>
                      {/* Chamber Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-stone-300">
                          Chamber #{ch.chamberId}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isReady
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isSuspended
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isDecayed
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : isIncubating
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {ch.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Chamber Content */}
                      {isEmpty ? (
                        <div className="py-4 space-y-3">
                          <div className="text-center text-3xl opacity-40">🧬</div>
                          <div className="text-xs text-stone-400 text-center">Chamber sanitized and ready for core insertion.</div>

                          {/* Specimen Selection Form */}
                          <div className="space-y-2 pt-2 border-t border-stone-800">
                            <label className="text-[11px] font-bold text-stone-300 block">Select Specimen:</label>
                            <select
                              value={selectedIncubationSpecies[ch.chamberId] || 'asaphid_trilobite'}
                              onChange={(e) =>
                                setSelectedIncubationSpecies((prev) => ({
                                  ...prev,
                                  [ch.chamberId]: e.target.value as PrehistoricSpeciesId,
                                }))
                              }
                              className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg p-2 focus:ring-1 focus:ring-cyan-500 outline-none"
                            >
                              {Object.values(PREHISTORIC_SPECIES_REGISTRY).map((s) => {
                                const fossilCount = barn[s.fossilItemId] || 0;
                                return (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.era}) - {fossilCount}x fossil
                                  </option>
                                );
                              })}
                            </select>

                            {(() => {
                              const targetSpecies = PREHISTORIC_SPECIES_REGISTRY[
                                selectedIncubationSpecies[ch.chamberId] || 'asaphid_trilobite'
                              ];
                              const fossilCount = barn[targetSpecies?.fossilItemId] || 0;
                              const hasFossil = fossilCount > 0;
                              const hasWater = towerWater >= (targetSpecies?.incubationTowerWaterLiters || 0);

                              return (
                                <div className="space-y-2">
                                  <div className="text-[10px] space-y-1 text-stone-400 bg-black/40 p-2 rounded-lg">
                                    <div className="flex justify-between">
                                      <span>Core Fossil:</span>
                                      <span className={hasFossil ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>
                                        {targetSpecies?.fossilName} ({fossilCount} available)
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Tower Cooling:</span>
                                      <span className={hasWater ? 'text-cyan-300 font-bold' : 'text-rose-400 font-bold'}>
                                        {targetSpecies?.incubationTowerWaterLiters}L required
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    disabled={!hasFossil || !hasWater}
                                    onClick={() =>
                                      startSpecimenIncubation(
                                        ch.chamberId,
                                        selectedIncubationSpecies[ch.chamberId] || 'asaphid_trilobite'
                                      )
                                    }
                                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition ${
                                      hasFossil && hasWater
                                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md active:scale-95'
                                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {!hasFossil ? 'Missing Fossil Core' : !hasWater ? 'Insufficient Tower Water' : 'Engage Chamber'}
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 space-y-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-3xl">{spec?.emoji || '🧬'}</span>
                            <div>
                              <div className="text-sm font-bold text-white">{spec?.name}</div>
                              <div className="text-xs text-stone-400 italic">{spec?.scientificName}</div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-stone-400">Synthesis Progress:</span>
                              <span className="font-mono text-cyan-300 font-bold">
                                {Math.round(ch.progressPct)}%
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden border border-white/10">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isReady ? 'bg-emerald-500' : isSuspended ? 'bg-amber-500' : 'bg-cyan-500'
                                }`}
                                style={{ width: `${ch.progressPct}%` }}
                              />
                            </div>
                          </div>

                          {isSuspended && (
                            <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-lg text-[11px] text-amber-200 space-y-1">
                              <div className="font-bold flex items-center space-x-1">
                                <span>⚠️ Cooling Piped Interrupted!</span>
                              </div>
                              <div>Tower has 0L. Uncooled timer: {ch.uncooledSecElapsed}s / 180s before specimen decay.</div>
                            </div>
                          )}

                          {isReady && (
                            <button
                              onClick={() => collectRevivedSpecimen(ch.chamberId)}
                              className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs shadow-md active:scale-95 transition"
                            >
                              🌟 Revive & Transfer to Sanctuary
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ================= SANCTUARY ENCLOSURE VIEW ================= */
        (() => {
          const enc = sanctuary?.enclosures[activeTab];
          if (!enc) return null;
          const spec = PREHISTORIC_SPECIES_REGISTRY[enc.speciesId];
          const dietItemId = spec?.dietProductId;
          const dietStock = (barn[dietItemId] || 0) + (silo[dietItemId] || 0);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Specimen Enclosure Card */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                  {/* Status Banner */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                          {spec?.era} Era Sanctuary Enclosure
                        </span>
                        <span className="text-xs text-stone-400">| {enc.name}</span>
                      </div>
                      <h2 className="text-2xl font-black text-white font-serif mt-0.5">
                        {spec?.emoji} {spec?.name}
                      </h2>
                      <p className="text-xs text-stone-300 italic">{spec?.scientificName}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          enc.specimenCount === 0
                            ? 'bg-stone-800 border-stone-700 text-stone-400'
                            : enc.isStarving
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {enc.specimenCount === 0
                          ? 'Unoccupied'
                          : enc.isStarving
                          ? '🥀 Starving (Passive Inactive)'
                          : '✨ Active & Nourished'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-stone-300 leading-relaxed mb-6">{spec?.lore}</p>

                  {/* Specimen Counts & Visual Representation */}
                  <div className="p-4 bg-black/40 border border-stone-800 rounded-xl mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{spec?.avatar || spec?.emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-white">Living Population</div>
                        <div className="text-xs text-stone-400">Maintained specimens in this paddock</div>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-amber-300 font-mono">
                      {enc.specimenCount}
                    </div>
                  </div>

                  {/* Dietary Schedule & Food Trough Level */}
                  <div className="p-4 bg-stone-950/70 border border-stone-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{spec?.dietEmoji}</span>
                        <span className="text-xs font-bold text-stone-200">
                          Dietary Sustenance: {spec?.dietName}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400">
                        In Barn/Silo: <span className="font-mono text-amber-300 font-bold">{dietStock}</span>
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-semibold">
                        <span className="text-stone-400">Trough Level:</span>
                        <span className="font-mono text-amber-300">
                          {Math.round(enc.troughFoodLiters)} / {enc.maxTroughLiters} Liters
                        </span>
                      </div>
                      <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden border border-white/10">
                        <div
                          className={`h-full transition-all duration-300 ${
                            enc.troughFoodLiters > 30 ? 'bg-amber-500' : 'bg-rose-600 animate-pulse'
                          }`}
                          style={{ width: `${Math.max(0, Math.min(100, enc.troughFoodLiters))}%` }}
                        />
                      </div>
                    </div>

                    {/* Deposit Feed Buttons */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        disabled={dietStock < 5 || enc.troughFoodLiters >= enc.maxTroughLiters}
                        onClick={() => depositEnclosureFeed(enc.enclosureId, 5)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-stone-200 border border-stone-700 transition"
                      >
                        +5 Feed
                      </button>
                      <button
                        disabled={dietStock < 20 || enc.troughFoodLiters >= enc.maxTroughLiters}
                        onClick={() => depositEnclosureFeed(enc.enclosureId, 20)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-stone-200 border border-stone-700 transition"
                      >
                        +20 Feed
                      </button>
                      <button
                        disabled={dietStock <= 0 || enc.troughFoodLiters >= enc.maxTroughLiters}
                        onClick={() => depositEnclosureFeed(enc.enclosureId, 100)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-stone-950 transition"
                      >
                        Fill Max
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Estate Aura & Periodic Harvest Drop */}
              <div className="space-y-5">
                {/* Estate-Wide Passive Card */}
                <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <span className="text-xl">🌟</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Macro-Simulation Estate Buff</span>
                  </div>

                  <h3 className="text-lg font-bold text-white font-serif">{spec?.estatePassiveTitle}</h3>
                  <p className="text-xs text-stone-300 leading-relaxed">{spec?.estatePassiveDesc}</p>

                  <div className="p-3 bg-black/40 border border-stone-800 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Current Status:</span>
                      <span className={enc.specimenCount > 0 && !enc.isStarving ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>
                        {enc.specimenCount === 0 ? 'No Specimens' : enc.isStarving ? 'Inactive (Starving)' : 'Active Across Estate ✓'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Periodic Harvest Drop Card */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{spec?.harvestEmoji}</span>
                      <span className="text-xs font-bold text-stone-200">Periodic Shed Drop:</span>
                    </div>
                    <span className="text-xs font-bold text-amber-300">{spec?.harvestName}</span>
                  </div>

                  {/* Progress to Next Drop */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-stone-400">Next Shed Progress:</span>
                      <span className="font-mono text-stone-300">
                        {enc.harvestProgressSec}s / {spec?.harvestPeriodSec}s
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (enc.harvestProgressSec / (spec?.harvestPeriodSec || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Ready to Harvest Counter */}
                  <div className="p-3 bg-black/40 border border-stone-800 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-stone-400">Available to Gather:</span>
                    <span className="text-lg font-black text-amber-300 font-mono">
                      {enc.harvestReadyCount}x
                    </span>
                  </div>

                  <button
                    disabled={enc.harvestReadyCount <= 0}
                    onClick={() => collectEnclosureHarvest(enc.enclosureId)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      enc.harvestReadyCount > 0
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black shadow-lg shadow-amber-500/20 active:scale-95'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                    }`}
                  >
                    <span>✨</span>
                    <span>Gather Shed Harvest ({enc.harvestReadyCount})</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* --- FRONTIER TRAIL MODAL POPUP --- */}
      <FrontierTrailModal
        isOpen={isTrailModalOpen}
        onClose={() => setIsTrailModalOpen(false)}
      />

      {/* --- SLURRY SUMP & PRIMEVAL BIOREACTOR VAT MODAL --- */}
      <SlurryCollectionModal
        isOpen={Boolean(activeSumpModalPitId)}
        onClose={() => setActiveSumpModalPitId(null)}
        initialPitId={activeSumpModalPitId || 'pit_sanctuary'}
      />
    </div>
  );
}
