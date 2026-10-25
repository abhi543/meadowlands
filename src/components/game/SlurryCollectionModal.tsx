'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  type SlurryPitId,
  type SlurryViscosity,
  SPECIES_SLURRY_REGISTRY,
} from '@/game/slurryEngine';
import {
  playWashdownHoseSound,
  playSlurryScoopSound,
  playSumpValveSound,
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
    desc: 'Lowest solid content (~8%). Free-flowing runoff easily pumped through collection lines.',
  },
  fibrous_pellets: {
    label: 'Fibrous Pellets (Needs Macerator)',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    desc: 'Pelletized ruminant waste. High fibrous lignin requires mechanical agitator to prevent pipe clogging.',
  },
  fibrous_emulsion: {
    label: 'Fibrous Emulsion (High Buffering)',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    desc: 'Heavy straw-and-manure emulsion. High buffering capacity; yields rich, balanced organic compost matter.',
  },
  sludge: {
    label: 'Sludge (High Solids · Uric Rich)',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    desc: 'High solid content (~35%) rich in uric acid. High wash-down water ratio needed; triggers sharp soil energy spikes.',
  },
  primeval_heavy: {
    label: 'Primeval Heavy (Ancient Archaea)',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-400/30',
    desc: 'Prehistoric microbial flora & minerals. Supercharges soil fertility and organic compost potency.',
  },
};

export function SlurryCollectionModal({ isOpen, onClose, initialPitId = 'pit_swine' }: SlurryCollectionModalProps) {
  const {
    slurryPits,
    fillSlurryDrum,
    hitchSlurryTanker,
    toggleSumpCover,
    installPitAgitator,
    togglePitAutomationPipe,
    sprayAndWashdownStalls,
    barn = {},
    coins,
  } = useGameStore();

  const [selectedPitId, setSelectedPitId] = useState<SlurryPitId>(initialPitId);

  if (!isOpen) return null;

  const currentPits = slurryPits || {};
  const pit = currentPits[selectedPitId] || currentPits.pit_swine;

  const fillPercent = pit ? Math.min(100, Math.round((pit.currentLiters / pit.maxCapacityLiters) * 100)) : 0;
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

  const handleWashdownStalls = () => {
    playWashdownHoseSound();
    sprayAndWashdownStalls();
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
                  Slurry Collection &amp; Sump Hub
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Drainage &amp; Organic Fertilizer
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Species-specific fluid yields, viscosity ratings, and organic fertilizer storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWashdownStalls}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-sm"
              title="Wash down stall bedding with hose"
            >
              <span>🚿</span> Washdown Stalls
            </button>
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
                    Dilution &amp; Weather Status
                  </div>
                  <div className="text-xs text-stone-300">
                    Dilution Factor: <span className="font-mono text-cyan-300">{pit.dilutionFactor.toFixed(2)}x</span>
                    {pit.isDilutedByRain && (
                      <span className="text-blue-400 ml-1.5 font-bold">(-20% nutrient potency per liter)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Organic Fertilizer Profile & Actions */}
              <div className="flex flex-col justify-between space-y-4 p-4 rounded-xl bg-stone-900/60 border border-stone-800">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Organic Fertilizer Profile
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/80 border border-stone-800">
                      <span className="text-xs flex items-center gap-1.5 text-stone-300">
                        <span>🧪</span> Fertilizer Grade:
                      </span>
                      <span className="font-mono font-bold text-amber-300 text-xs">
                        {pit.viscosityRating === 'primeval_heavy' ? 'Primeval Humus' : 'Bio-Organic Liquid'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/80 border border-stone-800">
                      <span className="text-xs flex items-center gap-1.5 text-stone-300">
                        <span>🌱</span> Soil Nutrition:
                      </span>
                      <span className="font-mono font-bold text-emerald-300 text-xs">
                        {pit.viscosityRating === 'sludge' ? 'Concentrated' : 'Balanced'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/80 border border-stone-800">
                      <span className="text-xs flex items-center gap-1.5 text-stone-300">
                        <span>💧</span> Fluid Volume:
                      </span>
                      <span className="font-mono font-bold text-cyan-300 text-xs">
                        {Math.round(pit.currentLiters)} L Available
                      </span>
                    </div>

                    {pit.viscosityRating === 'primeval_heavy' && (
                      <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-300 font-bold flex items-center gap-1.5">
                        <span>🧬</span> Primeval Archaea Soil Dressing Active!
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
                      className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black text-xs transition shadow-sm cursor-pointer"
                      title="Draw 50L into inventory drum"
                    >
                      🛢️ Fill 50L Drum
                    </button>

                    <button
                      onClick={handleHitchTanker}
                      disabled={pit.currentLiters < 50}
                      className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs transition shadow-sm cursor-pointer"
                      title="Hitch tanker to transport 500L for field application"
                    >
                      🚜 Hitch Tanker
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button
                      onClick={handleToggleCover}
                      className={`py-1.5 px-2 rounded-lg border font-bold transition cursor-pointer ${
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
                      className={`py-1.5 px-2 rounded-lg border font-bold transition disabled:opacity-50 cursor-pointer ${
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
                    className={`w-full py-1.5 px-2 rounded-lg border font-bold text-xs transition cursor-pointer ${
                      pit.automatedIntakePipe
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                    }`}
                    title="Toggle direct pipeline to central collection holding vat"
                  >
                    {pit.automatedIntakePipe
                      ? '🔗 Automated Pipe: Connected to Central Vat'
                      : '🔌 Connect Automation PVC Pipe'}
                  </button>
                </div>
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
