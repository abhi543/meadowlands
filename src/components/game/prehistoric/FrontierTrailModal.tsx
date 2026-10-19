'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import {
  FRONTIER_STRATA_REGISTRY,
  FRONTIER_STRATA_SEQUENCE,
  PREHISTORIC_SPECIES_REGISTRY,
  EventActionType,
} from '@/types/prehistoric';

interface FrontierTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FrontierTrailModal({ isOpen, onClose }: FrontierTrailModalProps) {
  const {
    activeTrailRun,
    hydrology,
    barn,
    silo,
    startTrailRun,
    resolveTrailEventAction,
    advanceTrailNode,
    bankAndExtractTrailLoot,
  } = useGameStore();

  if (!isOpen) return null;

  const run = activeTrailRun;

  // Morale Status Badge Calculation
  const getMoraleBadge = (morale: number) => {
    if (morale >= 70) {
      return { text: 'Resolute', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', emoji: '🛡️' };
    }
    if (morale >= 30) {
      return { text: 'Shaken', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', emoji: '⚠️' };
    }
    if (morale > 0) {
      return { text: 'Exhausted', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', emoji: '🥀' };
    }
    return { text: 'Broken', color: 'bg-red-700/30 text-red-400 border-red-600/50', emoji: '💀' };
  };

  const moraleBadge = run ? getMoraleBadge(run.morale) : null;
  const currentStrata = run ? FRONTIER_STRATA_REGISTRY[run.activeStrataId] : null;
  const towerWater = hydrology?.towerLiters || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-stone-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-stone-100">
        
        {/* --- HEADER: Strata Banner, Node Progress & Morale Bar --- */}
        <div className={`p-4 sm:p-5 border-b border-stone-800 bg-gradient-to-r ${currentStrata?.bgGradient || 'from-stone-900 to-stone-950'} relative`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{currentStrata?.emoji || '🧭'}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white font-serif">
                    {currentStrata?.name || 'Frontier Trail Expedition'}
                  </h2>
                  <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-stone-200 border border-white/20">
                    {currentStrata?.era || 'Primeval Era'}
                  </span>
                </div>
                <p className="text-xs text-stone-300 line-clamp-1">{currentStrata?.description || 'Active deep-stratum archaeological search.'}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-stone-300 hover:text-white border border-white/10 transition"
              title="Close Modal"
            >
              ✕
            </button>
          </div>

          {/* Node Strata Sequence (1 to 5) */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {FRONTIER_STRATA_SEQUENCE.map((sId, idx) => {
              const nodeNum = idx + 1;
              const sDef = FRONTIER_STRATA_REGISTRY[sId];
              const isPast = run ? nodeNum < run.currentNodeIndex : false;
              const isCurrent = run ? nodeNum === run.currentNodeIndex : false;
              const isFuture = run ? nodeNum > run.currentNodeIndex : true;

              return (
                <div
                  key={sId}
                  className={`p-2 rounded-lg border text-center transition ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30 text-amber-200'
                      : isPast
                      ? 'bg-stone-800/80 border-stone-700 text-stone-400 opacity-80'
                      : 'bg-black/30 border-stone-800 text-stone-500'
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-wider mb-0.5">
                    Node {nodeNum}
                  </div>
                  <div className="text-xs truncate font-medium">{sDef.name.split(' ')[0]}</div>
                  {nodeNum >= 4 && (
                    <span className="inline-block mt-0.5 text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded font-mono">
                      2x Rarity
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Morale Bar & Weather Cost Badges */}
          {run && (
            <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-2/3">
                <div className="flex justify-between items-center text-xs mb-1 font-semibold">
                  <span className="flex items-center space-x-1.5 text-stone-200">
                    <span>Expedition Morale:</span>
                    <span className="font-mono text-amber-300">{run.morale} / 100</span>
                  </span>
                  {moraleBadge && (
                    <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${moraleBadge.color} flex items-center space-x-1`}>
                      <span>{moraleBadge.emoji}</span>
                      <span>{moraleBadge.text}</span>
                    </span>
                  )}
                </div>
                <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden border border-white/10">
                  <div
                    className={`h-full transition-all duration-300 ${
                      run.morale >= 70
                        ? 'bg-emerald-500'
                        : run.morale >= 30
                        ? 'bg-amber-500'
                        : 'bg-rose-600 animate-pulse'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, run.morale))}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs text-stone-300 shrink-0">
                <span className="flex items-center space-x-1 bg-stone-800/80 px-2.5 py-1 rounded-lg border border-stone-700">
                  <span>🚰 Tower Water:</span>
                  <span className="font-mono text-cyan-300 font-bold">{towerWater}L</span>
                </span>
                <span className="flex items-center space-x-1 bg-stone-800/80 px-2.5 py-1 rounded-lg border border-stone-700">
                  <span>⛅ Weather:</span>
                  <span className="text-amber-200 font-medium">{hydrology?.weatherCondition || 'Fair'}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* --- MAIN BODY: Active Dilemma or Run Launcher --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {!run || run.isCompleted || run.isFailed ? (
            /* Launcher Screen */
            <div className="text-center py-10 px-4 max-w-lg mx-auto space-y-4">
              <div className="text-6xl animate-bounce">🧭</div>
              <h3 className="text-2xl font-bold text-white font-serif">Frontier Trail Procedural Engine</h3>
              <p className="text-sm text-stone-300 leading-relaxed">
                Equip tools, draw pressurized water from the Elevated Gravity Tower, and venture through 5 sequential
                deep-strata biomes to excavate Earth’s primeval fauna fossils and intact amber specimens.
              </p>

              {run?.isFailed && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs text-left space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <span>💀 Previous Expedition Overwhelmed:</span>
                  </div>
                  <div>Morale hit 0. 50% of cached minerals were lost and delicate organic embryos perished.</div>
                </div>
              )}

              {run?.isExtracted && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs text-left">
                  <div className="font-bold">⛺ Safe Extraction Completed!</div>
                  <div>All excavated fossil specimens and amber cores safely banked in estate storage.</div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => startTrailRun()}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition text-base"
                >
                  Embark on Frontier Trail Expedition (Node 1)
                </button>
              </div>
            </div>
          ) : (
            /* Active Node Event Dilemma Card */
            <div className="space-y-5">
              {run.currentEventCard && (
                <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-5 shadow-inner">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Strata {run.currentNodeIndex} / 5 Dilemma
                      </span>
                      <h3 className="text-xl font-black text-white font-serif mt-0.5">
                        {run.currentEventCard.ambientEmoji} {run.currentEventCard.title}
                      </h3>
                    </div>
                    {run.currentNodeIndex >= 4 && (
                      <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                        ⭐ 2x Legendary Drop Rate Active
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-stone-300 leading-relaxed mb-4">
                    {run.currentEventCard.dilemmaText}
                  </p>

                  {/* Outcome Message Banner if Resolved */}
                  {run.resolvedEventChoice && run.eventOutcomeMessage && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center space-x-2">
                      <span className="text-lg">📜</span>
                      <span>{run.eventOutcomeMessage}</span>
                    </div>
                  )}

                  {/* 3 Action Branches */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* 1. Specialized Tool Action */}
                    {(() => {
                      const branch = run.currentEventCard.actions.specialized;
                      const reqItem = branch.requiredItem;
                      const hasItem = reqItem
                        ? ((barn[reqItem.id] || 0) + (silo[reqItem.id] || 0)) >= reqItem.qty
                        : true;
                      const isChosen = run.resolvedEventChoice === 'specialized_tool';
                      const isLocked = Boolean(run.resolvedEventChoice);

                      return (
                        <div
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                            isChosen
                              ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400'
                              : 'bg-stone-900/90 border-stone-800 hover:border-amber-500/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-amber-300">Specialized Tool</span>
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                {Math.round(branch.successRate * 100)}% Success
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1.5">{branch.label}</h4>
                            <p className="text-xs text-stone-400 leading-normal mb-3">{branch.description}</p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-stone-800/80">
                            {reqItem && (
                              <div className="text-[11px] flex items-center justify-between">
                                <span className="text-stone-400">Requires Gear:</span>
                                <span className={hasItem ? 'text-emerald-300 font-semibold' : 'text-rose-400 font-semibold'}>
                                  {reqItem.qty}x {reqItem.name} {hasItem ? '✓' : '(Missing)'}
                                </span>
                              </div>
                            )}

                            <button
                              disabled={isLocked || !hasItem}
                              onClick={() => resolveTrailEventAction('specialized_tool')}
                              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition ${
                                isChosen
                                  ? 'bg-amber-500 text-stone-950 font-black'
                                  : isLocked || !hasItem
                                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                                  : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md active:scale-95'
                              }`}
                            >
                              {isChosen ? 'Executed' : hasItem ? 'Engage Tool Action' : 'Missing Gear'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. Hydrological / Estate Resource Action */}
                    {(() => {
                      const branch = run.currentEventCard.actions.hydrological;
                      const reqWater = branch.requiredTowerWaterLiters || 0;
                      const hasWater = towerWater >= reqWater;
                      const reqItem = branch.requiredItem;
                      const hasItem = reqItem
                        ? ((barn[reqItem.id] || 0) + (silo[reqItem.id] || 0)) >= reqItem.qty
                        : true;
                      const canAfford = hasWater && hasItem;
                      const isChosen = run.resolvedEventChoice === 'hydrological_resource';
                      const isLocked = Boolean(run.resolvedEventChoice);

                      return (
                        <div
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                            isChosen
                              ? 'bg-cyan-500/20 border-cyan-400 ring-1 ring-cyan-400'
                              : 'bg-stone-900/90 border-stone-800 hover:border-cyan-500/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-cyan-300">Hydraulic / Resource</span>
                              <span className="text-xs font-mono font-bold text-cyan-400">
                                {Math.round(branch.successRate * 100)}% Success
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1.5">{branch.label}</h4>
                            <p className="text-xs text-stone-400 leading-normal mb-3">{branch.description}</p>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
                            {reqWater > 0 && (
                              <div className="text-[11px] flex items-center justify-between">
                                <span className="text-stone-400">Tower Water:</span>
                                <span className={hasWater ? 'text-cyan-300 font-semibold' : 'text-rose-400 font-semibold'}>
                                  {reqWater}L (Tower: {towerWater}L) {hasWater ? '✓' : '⚠️'}
                                </span>
                              </div>
                            )}
                            {reqItem && (
                              <div className="text-[11px] flex items-center justify-between">
                                <span className="text-stone-400">Produce:</span>
                                <span className={hasItem ? 'text-emerald-300 font-semibold' : 'text-rose-400 font-semibold'}>
                                  {reqItem.qty}x {reqItem.name} {hasItem ? '✓' : '(Missing)'}
                                </span>
                              </div>
                            )}

                            <button
                              disabled={isLocked || !canAfford}
                              onClick={() => resolveTrailEventAction('hydrological_resource')}
                              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition ${
                                isChosen
                                  ? 'bg-cyan-500 text-stone-950 font-black'
                                  : isLocked || !canAfford
                                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md active:scale-95'
                              }`}
                            >
                              {isChosen ? 'Executed' : canAfford ? 'Pump Water & Flush' : 'Insufficient Resources'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. Cautious Scavenge / Bypass */}
                    {(() => {
                      const branch = run.currentEventCard.actions.cautious;
                      const isChosen = run.resolvedEventChoice === 'cautious_scavenge';
                      const isLocked = Boolean(run.resolvedEventChoice);

                      return (
                        <div
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                            isChosen
                              ? 'bg-stone-500/20 border-stone-400 ring-1 ring-stone-400'
                              : 'bg-stone-900/90 border-stone-800 hover:border-stone-500/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-stone-300">Cautious Scavenge</span>
                              <span className="text-xs font-mono font-bold text-stone-400">100% Safe</span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1.5">{branch.label}</h4>
                            <p className="text-xs text-stone-400 leading-normal mb-3">{branch.description}</p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-stone-800/80">
                            <div className="text-[11px] text-stone-400">Zero hazard risk. Conserves team stamina.</div>
                            <button
                              disabled={isLocked}
                              onClick={() => resolveTrailEventAction('cautious_scavenge')}
                              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition ${
                                isChosen
                                  ? 'bg-stone-400 text-stone-950 font-black'
                                  : isLocked
                                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                                  : 'bg-stone-700 hover:bg-stone-600 text-stone-100 shadow-md active:scale-95'
                              }`}
                            >
                              {isChosen ? 'Executed' : 'Safely Scavenge & Bypass'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- BOTTOM TRAY: Isolated Rucksack & Navigation Choices --- */}
        {run && !run.isCompleted && !run.isFailed && (
          <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Loot Rucksack Display */}
            <div className="flex-1 w-full sm:w-auto">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <span>🎒 Unbanked Loot Rucksack (At Risk):</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Fossils */}
                {Object.entries(run.rucksack.fossils).map(([fId, qty]) => (
                  <span key={fId} className="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-xs font-medium text-amber-200">
                    🐚 {qty}x {fId.replace('fossil_', '').replace(/_/g, ' ')}
                  </span>
                ))}
                {/* Amber Pieces */}
                {run.rucksack.amberSpecimens > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-xs font-medium text-amber-300">
                    ✨ {run.rucksack.amberSpecimens} Amber Core
                  </span>
                )}
                {/* Mineral Slabs */}
                {run.rucksack.mineralSlabs > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-xs font-medium text-stone-300">
                    🪨 {run.rucksack.mineralSlabs} Slabs
                  </span>
                )}
                {/* Embryos */}
                {Object.entries(run.rucksack.preservedEmbryos).map(([eId, qty]) => (
                  <span key={eId} className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-xs font-medium text-rose-300">
                    🧬 {qty}x {eId} Embryo
                  </span>
                ))}
                {/* Coins */}
                {run.rucksack.coins > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 border border-yellow-500/40 text-xs font-mono font-bold text-yellow-300">
                    🪙 {run.rucksack.coins}c
                  </span>
                )}
                {Object.keys(run.rucksack.fossils).length === 0 &&
                  run.rucksack.amberSpecimens === 0 &&
                  run.rucksack.mineralSlabs === 0 &&
                  run.rucksack.coins === 0 && (
                    <span className="text-xs text-stone-500 italic">Rucksack empty (embark on node dilemma)</span>
                  )}
              </div>
            </div>

            {/* Navigation Buttons: Bank vs Push */}
            <div className="flex items-center space-x-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => bankAndExtractTrailLoot()}
                className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 font-bold text-xs tracking-wide transition active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <span>⛺</span>
                <span>Bank Loot & Return Home</span>
              </button>

              <button
                disabled={!run.resolvedEventChoice}
                onClick={() => advanceTrailNode()}
                className={`flex-1 sm:flex-initial py-2.5 px-5 rounded-xl text-xs font-black tracking-wide transition active:scale-95 flex items-center justify-center space-x-1.5 ${
                  run.resolvedEventChoice
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 shadow-lg shadow-amber-500/20'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                }`}
              >
                <span>🧭</span>
                <span>
                  {run.currentNodeIndex >= 5 ? 'Finalize Expedition' : `Push to Node ${run.currentNodeIndex + 1}`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
