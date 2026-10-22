'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  type SlurryPitId,
  type SlurryViscosity,
  SPECIES_SLURRY_REGISTRY,
  estimateGasLabOutputs,
} from '@/game/slurryEngine';
import {
  playWashdownHoseSound,
  playSlurryScoopSound,
  playSumpValveSound,
  playDigesterDistillSound,
} from '@/lib/soundEffects';

interface SlurryCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPitId?: SlurryPitId;
}

const VISCOSITY_LABELS: Record<SlurryViscosity, { label: string; badge: string; desc: string }> = {
  fluid: {
    label: 'Fluid (High Runoff)',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    desc: 'Lowest solid content (~8%). Optimal rapid anaerobic breakdown and maximum methane release.',
  },
  semi_fluid: {
    label: 'Semi-Fluid',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    desc: 'Succulent diet runoff; free-flowing and easily pumped through collection lines.',
  },
  fibrous_pellets: {
    label: 'Fibrous Pellets (Needs Macerator)',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    desc: 'Pelletized ruminant waste. High fibrous lignin requires mechanical agitator to prevent pipe clogging.',
  },
  fibrous_emulsion: {
    label: 'Fibrous Emulsion (High Buffering)',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    desc: 'Heavy straw-and-manure emulsion. High buffering capacity; yields balanced CO2 and liquid Nitrogen.',
  },
  sludge: {
    label: 'Sludge (High Solids · Uric Rich)',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    desc: 'High solid content (~35%) rich in uric acid. High wash-down water ratio needed; triggers sharp Nitrogen spikes.',
  },
  primeval_heavy: {
    label: 'Primeval Heavy (Ancient Archaea)',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-400/30',
    desc: 'Prehistoric microbial flora & minerals. Speeds gas distillation by +50% and supercharges soil nitrogen.',
  },
};

export function SlurryCollectionModal({ isOpen, onClose, initialPitId = 'pit_swine' }: SlurryCollectionModalProps) {
  const {
    slurryPits,
    gasProductionLab,
    fillSlurryDrum,
    hitchSlurryTanker,
    toggleSumpCover,
    installPitAgitator,
    togglePitAutomationPipe,
    feedSlurryToDigester,
    applyLiquidNitrogenToAllPlots,
    pipeBiogasCo2ToCanopy,
    feedChaffToDigester,
    sprayAndWashdownStalls,
    barn = {},
    silo = {},
    coins,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'sump' | 'gas_lab'>('sump');
  const [selectedPitId, setSelectedPitId] = useState<SlurryPitId>(initialPitId);

  if (!isOpen) return null;

  const currentPits = slurryPits || {};
  const pit = currentPits[selectedPitId] || currentPits.pit_swine;
  const gasLab = gasProductionLab;

  const fillPercent = pit ? Math.min(100, Math.round((pit.currentLiters / pit.maxCapacityLiters) * 100)) : 0;
  const gasYield = pit ? estimateGasLabOutputs(pit.currentLiters, pit.speciesBreakdown, pit.dilutionFactor) : null;
  const viscInfo = pit ? (VISCOSITY_LABELS[pit.viscosityRating] || VISCOSITY_LABELS.fluid) : VISCOSITY_LABELS.fluid;

  const handleFillDrum = () => {
    if (!pit || pit.currentLiters < 50) return;
    playSumpValveSound();
    playSlurryScoopSound();
    fillSlurryDrum(selectedPitId);
  };

  const handleHitchTanker = () => {
    if (!pit || pit.currentLiters < 50) return;
    playSumpValveSound();
    hitchSlurryTanker(selectedPitId);
  };

  const handleToggleCover = () => {
    playSumpValveSound();
    toggleSumpCover(selectedPitId);
  };

  const handleInstallAgitator = () => {
    if (coins < 150) return;
    playSumpValveSound();
    installPitAgitator(selectedPitId);
  };

  const handleToggleAutoPipe = () => {
    playSumpValveSound();
    togglePitAutomationPipe(selectedPitId);
  };

  const handleFeedDigesterFromPit = () => {
    playDigesterDistillSound();
    feedSlurryToDigester('pit', selectedPitId);
  };

  const handleApplyLiquidNAll = () => {
    playWashdownHoseSound();
    applyLiquidNitrogenToAllPlots();
  };

  const handlePipeCo2 = () => {
    playDigesterDistillSound();
    pipeBiogasCo2ToCanopy();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-stone-900 border border-amber-500/40 rounded-3xl shadow-2xl text-stone-100 flex flex-col scrollbar-thin">
        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-stone-950/95 border-b border-stone-800 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-amber-500/20 border border-amber-500/40">🚰</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white font-serif tracking-wide">
                  Slurry Hub & Gas Production Lab
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Anaerobic Digester & Sump Mechanics
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Species-specific fluid yields, viscosity ratings, and biochemical distillation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-stone-800/80 p-1 border border-stone-700/80 text-xs font-bold">
              <button
                onClick={() => setActiveTab('sump')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'sump'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Pen Collection Sumps
              </button>
              <button
                onClick={() => setActiveTab('gas_lab')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'gas_lab'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Gas Lab & Digester ({gasLab?.digesterCurrentLiters || 0}L)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'sump' ? (
            <>
              {/* Pit Selector Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(Object.keys(currentPits) as SlurryPitId[]).map((pid) => {
                  const p = currentPits[pid];
                  const isSelected = selectedPitId === pid;
                  const pct = Math.min(100, Math.round((p.currentLiters / p.maxCapacityLiters) * 100));

                  return (
                    <button
                      key={pid}
                      onClick={() => setSelectedPitId(pid)}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-gradient-to-b from-amber-950/60 to-stone-900 shadow-md ring-1 ring-amber-400/50'
                          : 'border-stone-800 bg-stone-950/60 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white truncate">{p.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">{pct}%</span>
                      </div>
                      <div className="text-[11px] text-amber-300 font-mono mt-1 font-bold">
                        {Math.round(p.currentLiters)}L / {p.maxCapacityLiters}L
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pct >= 90 ? 'bg-rose-500' : pct >= 60 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {p.isFrozen && (
                        <div className="text-[9px] text-cyan-400 font-bold mt-1">❄️ Frozen Jam</div>
                      )}
                      {p.isDilutedByRain && (
                        <div className="text-[9px] text-blue-400 font-bold mt-1">🌧️ Rain Diluted</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Pit Deep-Dive Telemetry */}
              {pit && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-stone-950/70 border border-stone-800">
                  {/* Left Column: Visual Fluid Reservoir */}
                  <div className="flex flex-col items-center justify-between p-4 rounded-xl bg-stone-900/80 border border-stone-800 text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Sump Reservoir Level
                    </div>

                    <div className="relative w-28 h-44 rounded-2xl border-2 border-stone-700 bg-stone-950 overflow-hidden my-3 shadow-inner flex flex-col justify-end p-1">
                      <div
                        className={`w-full rounded-xl transition-all duration-500 flex items-center justify-center ${
                          pit.viscosityRating === 'primeval_heavy'
                            ? 'bg-gradient-to-t from-rose-900 via-amber-800 to-amber-600'
                            : pit.viscosityRating === 'fluid'
                            ? 'bg-gradient-to-t from-emerald-900 via-teal-700 to-cyan-600'
                            : pit.viscosityRating === 'sludge'
                            ? 'bg-gradient-to-t from-purple-950 via-violet-800 to-fuchsia-700'
                            : 'bg-gradient-to-t from-amber-900 via-yellow-800 to-amber-600'
                        }`}
                        style={{ height: `${Math.max(8, fillPercent)}%` }}
                      >
                        <span className="text-[11px] font-black text-white drop-shadow font-mono">
                          {fillPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-mono font-bold text-white">
                      {Math.round(pit.currentLiters)} L <span className="text-stone-400">/ {pit.maxCapacityLiters} L</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1 justify-center">
                      {pit.isCovered ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          🛡️ Weather Covered
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⚠️ Open Pit (Rain Risk)
                        </span>
                      )}
                      {pit.hasAgitatorMacerator && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          ⚙️ Agitator Active
                        </span>
                      )}
                      {pit.automatedIntakePipe && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          🚰 PVC Pipe Online
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Fluid Viscosity & Species Breakdown */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                        Fluid Viscosity Rating
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold inline-block ${viscInfo.badge}`}>
                        {viscInfo.label}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                        {viscInfo.desc}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                        Species Slurry Breakdown
                      </div>
                      <div className="space-y-1.5">
                        {Object.entries(pit.speciesBreakdown).length > 0 ? (
                          Object.entries(pit.speciesBreakdown).map(([sp, liters]) => {
                            const prof = SPECIES_SLURRY_REGISTRY[sp];
                            const name = prof?.name || sp;
                            const share = Math.round((liters / Math.max(1, pit.currentLiters)) * 100);

                            return (
                              <div
                                key={sp}
                                className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-stone-900 border border-stone-800"
                              >
                                <span className="font-semibold text-stone-200">{name}</span>
                                <span className="font-mono text-amber-300 font-bold">
                                  {Math.round(liters)}L ({share}%)
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-stone-500 italic">No slurry contributions recorded yet.</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                        Dilution & Climate Status
                      </div>
                      <div className="text-xs text-stone-300">
                        Dilution Factor: <span className="font-mono text-cyan-300">{pit.dilutionFactor.toFixed(2)}x</span>
                        {pit.isDilutedByRain && (
                          <span className="text-blue-400 ml-1.5 font-bold">(-20% gas potency per liter)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Expected Gas Lab Output Profile */}
                  <div className="flex flex-col justify-between space-y-4 p-4 rounded-xl bg-stone-900/60 border border-stone-800">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                        Expected Gas Lab Output
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/80 border border-stone-800">
                          <span className="text-xs flex items-center gap-1.5">
                            <span>⚡</span> Methane (CH₄):
                          </span>
                          <span className="font-mono font-bold text-amber-300">
                            +{gasYield?.estimatedMethaneLiters || 0} L
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/80 border border-stone-800">
                          <span className="text-xs flex items-center gap-1.5">
                            <span>💨</span> Biogas CO₂:
                          </span>
                          <span className="font-mono font-bold text-teal-300">
                            +{gasYield?.estimatedCo2Liters || 0} L
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/80 border border-stone-800">
                          <span className="text-xs flex items-center gap-1.5">
                            <span>🧪</span> Liquid Nitrogen:
                          </span>
                          <span className="font-mono font-bold text-cyan-300">
                            +{gasYield?.estimatedLiquidNitrogenLiters || 0} L
                          </span>
                        </div>

                        {gasYield && gasYield.primevalDistillationBoostPercent > 0 && (
                          <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-300 font-bold flex items-center gap-1.5">
                            <span>🧬</span> +{gasYield.primevalDistillationBoostPercent}% Primeval Distillation Speed!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pit Actions */}
                    <div className="space-y-2 pt-2 border-t border-stone-800">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleFillDrum}
                          disabled={pit.currentLiters < 50}
                          className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black text-xs transition shadow-sm"
                          title="Draw 50L into inventory drum"
                        >
                          🛢️ Fill 50L Drum
                        </button>

                        <button
                          onClick={handleHitchTanker}
                          disabled={pit.currentLiters < 50}
                          className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs transition shadow-sm"
                          title="Hitch tanker to transport 500L to Digester"
                        >
                          🚜 Hitch Tanker
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <button
                          onClick={handleToggleCover}
                          className={`py-1.5 px-2 rounded-lg border font-bold transition ${
                            pit.isCovered
                              ? 'bg-teal-950/60 text-teal-300 border-teal-500/40 hover:bg-teal-900/60'
                              : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                          }`}
                        >
                          {pit.isCovered ? '✓ Covered (Protected)' : '☂️ Put Weather Cover'}
                        </button>

                        <button
                          onClick={handleInstallAgitator}
                          disabled={pit.hasAgitatorMacerator || coins < 150}
                          className={`py-1.5 px-2 rounded-lg border font-bold transition disabled:opacity-50 ${
                            pit.hasAgitatorMacerator
                              ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                              : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                          }`}
                          title="Install mechanical agitator (150 coins)"
                        >
                          {pit.hasAgitatorMacerator ? '✓ Agitator Active' : '⚙️ Agitator (150c)'}
                        </button>
                      </div>

                      <button
                        onClick={handleToggleAutoPipe}
                        className={`w-full py-1.5 px-2 rounded-lg border font-bold text-xs transition ${
                          pit.automatedIntakePipe
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                        }`}
                        title="Toggle direct pipeline to Gas Lab intake manifold"
                      >
                        {pit.automatedIntakePipe
                          ? '🔗 Automated Pipe: Connected to Digester'
                          : '🔌 Connect Automation PVC Pipe'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Gas Production Lab (Anaerobic Digester & Nitrogen Processing) */
            <div className="space-y-6">
              {/* Top Digester Tank Status */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/40 border border-amber-500/40">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚗️</span>
                      <h3 className="text-lg font-black text-white font-serif">
                        Industrial Anaerobic Digester Tank
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        {gasLab.isDigesting ? 'Active Fermentation' : 'Idle / Standby'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      Converts animal slurry into clean Methane (CH₄), agricultural Biogas CO₂, and concentrated Liquid Nitrogen.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-stone-400">Distillation Speed</div>
                      <div className="text-lg font-mono font-black text-amber-300">
                        {gasLab.distillationSpeedMultiplier.toFixed(1)}x
                      </div>
                    </div>
                    <button
                      onClick={handleFeedDigesterFromPit}
                      className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition"
                    >
                      + Feed 50L Slurry
                    </button>
                    <button
                      onClick={() => feedChaffToDigester(10)}
                      disabled={(silo?.chaff || 0) < 10}
                      className="py-2.5 px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border border-amber-600/40 text-amber-300 font-bold text-xs uppercase tracking-wider shadow transition active:scale-95 flex items-center gap-1.5"
                      title="Feed 10x Chaff & Husks into the Anaerobic Digester (+30L Carbonaceous Biomass Substrate)"
                    >
                      <span>🌾</span>
                      <span>+ 10x Chaff ({silo?.chaff || 0})</span>
                    </button>
                  </div>
                </div>

                {/* Digester Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono font-bold text-stone-300">
                    <span>Digester Tank: {Math.round(gasLab.digesterCurrentLiters)}L / {gasLab.digesterMaxCapacityLiters}L</span>
                    <span>Batch Progress: {Math.round(gasLab.digestionProgress)}%</span>
                  </div>
                  <div className="w-full h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-300"
                      style={{ width: `${gasLab.digestionProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 3 Gas Storage Tanks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Methane CH4 */}
                <div className="p-4 rounded-2xl bg-stone-950/80 border border-amber-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase">
                      <span>⚡ Biogas Methane (CH₄)</span>
                      <span>Tank #1</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-400 my-2">
                      {gasLab.storedBiogasMethane} L
                    </div>
                    <p className="text-[11px] text-stone-400">
                      High-caloric renewable fuel for thermal brazier thawing, generators, and artisan ovens.
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] text-amber-300/80 font-mono font-bold">
                    Clean Energy Stored
                  </div>
                </div>

                {/* 2. Biogas CO2 */}
                <div className="p-4 rounded-2xl bg-stone-950/80 border border-teal-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase">
                      <span>💨 Biogas CO₂</span>
                      <span>Canopy Line</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-teal-400 my-2">
                      {gasLab.storedBiogasCo2} L
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Injected straight into crop plots to boost photosynthesis above 80% CO₂ (+20%–40% growth speed).
                    </p>
                  </div>
                  <button
                    onClick={handlePipeCo2}
                    disabled={gasLab.storedBiogasCo2 < 50}
                    className="mt-3 py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold text-xs transition"
                  >
                    Pipe CO₂ to Canopy (-50L)
                  </button>
                </div>

                {/* 3. Liquid Nitrogen Bio-Liquor */}
                <div className="p-4 rounded-2xl bg-stone-950/80 border border-cyan-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase">
                      <span>🧪 Liquid Nitrogen</span>
                      <span>Bio-Liquor</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-cyan-400 my-2">
                      {gasLab.storedLiquidNitrogen} L
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Supercharged bio-fertilizer digestate. Instantly restores plot Nitrogen to 100% for 3x harvest yields.
                    </p>
                  </div>
                  <button
                    onClick={handleApplyLiquidNAll}
                    disabled={gasLab.storedLiquidNitrogen < 20}
                    className="mt-3 py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs transition"
                  >
                    Apply Liquid N to Crops
                  </button>
                </div>
              </div>

              {/* Distillation Modifiers & Primeval Slurry Perk */}
              <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🦖</span>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Primeval Microbial Flora Booster
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Sanctuary mega-fauna slurry contains primeval archaea that accelerate distillation speed by +50%.
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-rose-300 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/40">
                  {gasLab.distillationSpeedMultiplier > 1.0 ? 'Active (+50% Speed)' : 'Standard (1.0x)'}
                </div>
              </div>

              {/* Agronomic Ecosystem Callout: Oxygen Gas (O2) */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-cyan-300">
                  <span className="text-base">🫧</span>
                  <span>Ecosystem Agronomy Note: Oxygen Gas (O₂) &amp; Anaerobic Digestion</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  The Gas Chamber operates in a strictly <strong>anaerobic (zero-oxygen) environment</strong> — methanogenic microbes ferment slurry and chaff biomass into clean Methane (CH₄), CO₂, and Nitrogen without oxygen. 
                </p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  <strong>Oxygen Gas (O₂)</strong> is an aerobic soil metric maintained across your <strong>Farm Plots</strong>. Optimal soil O₂ is <strong>45%–75%</strong>; values below 20% freeze crop growth from root suffocation. You can restore plot O₂ by tilling with a hoe (instant 60%), harvesting root crops like Carrots (+20%), or clearing waterlogged soil.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between px-6 py-4 bg-stone-950/95 border-t border-stone-800">
          <div className="text-xs text-stone-400 flex items-center gap-2">
            <span>🪣 Barn Inventory:</span>
            <span className="text-white font-mono font-bold">
              {barn.drum_slurry || 0} Slurry Drums · {barn.bucket_slurry_swine || 0} Swine Buckets
            </span>
          </div>

          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Close Sump Hub
          </button>
        </div>
      </div>
    </div>
  );
}
