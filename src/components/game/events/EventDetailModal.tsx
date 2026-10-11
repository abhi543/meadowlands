'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { SYSTEMIC_EVENTS, FAIR_ITEM_SCORES, type SystemicEventId } from '@/game/eventsData';
import { formatEventTimeLeft } from '@/lib/eventNotifications';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRelics?: () => void;
}

export function EventDetailModal({ isOpen, onClose, onOpenRelics }: EventDetailModalProps) {
  const {
    systemicEvent,
    silo,
    barn,
    advanceSystemicEventPhase,
    deliverFleetCrates,
    extinguishBrushfire,
    captureLocust,
    deliverSmugglerContract,
    submitCountyFairProduce,
    catchMigrationFish,
    supplyCarnivalFeeds,
    donateRuinsMaterials,
    claimSystemicGrandReward,
    dismissSystemicEvent,
    triggerSystemicEvent,
    systemicEventCooldowns,
    level,
  } = useGameStore();

  const [, setTick] = useState(0);
  const [selectedFairItem, setSelectedFairItem] = useState<string>('wheat');

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const activeEventState = systemicEvent;
  const def = activeEventState ? SYSTEMIC_EVENTS[activeEventState.id] : null;
  const now = Date.now();

  const expiryTime = activeEventState
    ? (activeEventState.phase === 'forecast' ? activeEventState.forecastEndsAt : activeEventState.activeEndsAt)
    : 0;
  const remainingMs = Math.max(0, expiryTime - now);

  // Helper to determine inventory quantity
  const getStock = (itemId: string) => (silo[itemId] || 0) + (barn[itemId] || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none">{def ? def.emoji : '⚡'}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                  High-Stakes Crisis Engine
                </span>
                {activeEventState && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    activeEventState.phase === 'forecast'
                      ? 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200'
                      : activeEventState.phase === 'active'
                      ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                      : 'bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200'
                  }`}>
                    {activeEventState.phase}
                  </span>
                )}
              </div>
              <h3 className="font-black text-lg text-stone-900 dark:text-white leading-tight">
                {def ? def.name : 'Systemic Event Registry'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeEventState && def ? (
            <>
              {/* Narrative & Countdown Card */}
              <div className={`p-4 rounded-2xl border text-white shadow-md relative overflow-hidden bg-gradient-to-br ${
                activeEventState.phase === 'forecast'
                  ? 'from-amber-600 via-orange-600 to-amber-700 border-amber-400'
                  : activeEventState.phase === 'active'
                  ? 'from-rose-700 via-red-600 to-amber-800 border-rose-500'
                  : 'from-amber-600 via-yellow-500 to-amber-700 border-yellow-300 text-stone-900'
              }`}>
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold tracking-wide uppercase opacity-90">
                      {activeEventState.phase === 'forecast'
                        ? '⏳ Forecast Window'
                        : activeEventState.phase === 'active'
                        ? '⚡ Crisis Underway'
                        : '🎉 Event Settlement'}
                    </span>
                    <h4 className="text-base font-black leading-snug drop-shadow-sm">
                      {def.premise}
                    </h4>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-xl text-right flex-shrink-0">
                    <div className="text-[10px] font-semibold text-amber-200 uppercase">
                      Time Remaining
                    </div>
                    <div className="font-mono font-black text-base text-white">
                      {formatEventTimeLeft(remainingMs)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/20 text-xs font-medium opacity-95">
                  <span className="font-bold underline">Mechanical Shift:</span> {def.mechanicalShift}
                </div>
              </div>

              {/* Multi-Stage Checkpoint Rail */}
              <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-stone-500 dark:text-stone-400 tracking-wider">
                    Milestone Progress ({activeEventState.currentStage} of {def.stages.length})
                  </span>
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    {activeEventState.progress} / {def.stages[activeEventState.currentStage - 1]?.targetCount || 100} Target
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (activeEventState.progress / (def.stages[activeEventState.currentStage - 1]?.targetCount || 1)) * 100)}%`,
                    }}
                  />
                </div>

                {/* Stage Nodes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {def.stages.map((stage) => {
                    const isDone = activeEventState.currentStage > stage.stage;
                    const isCurrent = activeEventState.currentStage === stage.stage;

                    return (
                      <div
                        key={stage.stage}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isDone
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : isCurrent
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/40'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400 opacity-60'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase">
                          Stage {stage.stage} {isDone ? '✓' : ''}
                        </div>
                        <div className="text-xs font-bold truncate mt-0.5">
                          {stage.title}
                        </div>
                        <div className="text-[11px] font-semibold mt-1">
                          {stage.targetCount} units
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Gameplay Interaction Area */}
              <div className="bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-stone-500 dark:text-stone-400 tracking-wider">
                    Operational Control
                  </span>
                  <span className="text-xs text-stone-500">
                    Target: {def.objectiveSummary}
                  </span>
                </div>

                {/* Event 1: Royal Fleet Provision */}
                {activeEventState.id === 'royal_fleet' && (
                  <div className="space-y-2">
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      Pack commodities into the royal shipping crates before departure:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => deliverFleetCrates([{ itemId: 'wheat', qty: Math.min(5, getStock('wheat')) || 1 }])}
                        disabled={getStock('wheat') < 1}
                        className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <span>📦 Pack Wheat ({getStock('wheat')})</span>
                      </button>
                      <button
                        onClick={() => deliverFleetCrates([{ itemId: 'corn', qty: Math.min(5, getStock('corn')) || 1 }])}
                        disabled={getStock('corn') < 1}
                        className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <span>🚢 Pack Corn ({getStock('corn')})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Event 2: Drought & Brushfire */}
                {activeEventState.id === 'barn_fire' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        🔥 Active Brushfires: {activeEventState.activeFirePositions?.length || 0}
                      </span>
                      <span className="text-stone-500">
                        Tap burning farm plots or use emergency well pump
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const firstFire = activeEventState.activeFirePositions?.[0];
                        if (firstFire !== undefined) extinguishBrushfire(firstFire);
                      }}
                      disabled={(activeEventState.activeFirePositions?.length || 0) === 0}
                      className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>🪣 Dispatch Well Bucket (Extinguish 1 Fire)</span>
                    </button>
                  </div>
                )}

                {/* Event 3: Midnight Smuggler */}
                {activeEventState.id === 'midnight_smuggler' && (
                  <div className="space-y-2">
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      The smuggler accepts rare farm yields in exchange for black-market influence:
                    </p>
                    <div className="space-y-1.5">
                      {[
                        { id: 1, label: 'Contract #1: 3x Fresh Milk', item: 'milk', qty: 3 },
                        { id: 2, label: 'Contract #2: 2x Apple Pie', item: 'pie', qty: 2 },
                        { id: 3, label: 'Contract #3: 2x Wool Sweater', item: 'sweater', qty: 2 },
                      ].map((contract) => {
                        const completedCount = activeEventState.smugglerContractsCompleted || 0;
                        const isDone = completedCount >= contract.id;
                        const hasStock = getStock(contract.item) >= contract.qty;

                        return (
                          <div
                            key={contract.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                          >
                            <span className="font-bold text-purple-700 dark:text-purple-300">
                              📜 {contract.label} (Stock: {getStock(contract.item)})
                            </span>
                            <button
                              onClick={() => deliverSmugglerContract([{ itemId: contract.item, qty: contract.qty }])}
                              disabled={isDone || !hasStock}
                              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : hasStock
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow'
                                  : 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                              }`}
                            >
                              {isDone ? 'Fulfilled ✓' : 'Deliver'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Event 4: Wild Locust Swarm */}
                {activeEventState.id === 'locust_swarm' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        🦗 Active Swarms: {activeEventState.locustPlotIds?.length || 0}
                      </span>
                      <span className="text-stone-500">
                        Locusts Captured: {activeEventState.progress} / 30
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const firstLocust = activeEventState.locustPlotIds?.[0];
                        if (firstLocust !== undefined) captureLocust(firstLocust);
                      }}
                      disabled={(activeEventState.locustPlotIds?.length || 0) === 0}
                      className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>🫙 Deploy Beekeeper Smoke Jar (Capture 1 Swarm)</span>
                    </button>
                  </div>
                )}

                {/* Event 5: County Fair Grand Derby */}
                {activeEventState.id === 'county_fair' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-700 dark:text-stone-300">
                        🎪 Exhibition Score: {activeEventState.fairPoints || activeEventState.progress} pts
                      </span>
                      <span className="text-stone-500">
                        Tiers: 100 / 300 / 600 pts
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedFairItem}
                        onChange={(e) => setSelectedFairItem(e.target.value)}
                        className="flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs rounded-xl p-2 font-medium"
                      >
                        {Object.entries(FAIR_ITEM_SCORES).map(([itemId, itemScore]) => {
                          const stock = getStock(itemId);
                          return (
                            <option key={itemId} value={itemId}>
                              {itemId} ({itemScore.points} pts) — Stock: {stock}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        onClick={() => {
                          const sendQty = Math.min(5, getStock(selectedFairItem)) || 1;
                          submitCountyFairProduce([{ itemId: selectedFairItem, qty: sendQty }]);
                        }}
                        disabled={getStock(selectedFairItem) < 1}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                      >
                        Submit Produce
                      </button>
                    </div>
                  </div>
                )}

                {/* Event 6: Golden Salmon Migration */}
                {activeEventState.id === 'salmon_run' && (
                  <div className="space-y-2">
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      Riverfront dock cooldowns removed! Instant bite rate active:
                    </p>
                    <button
                      onClick={() => catchMigrationFish()}
                      className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>🎣 Cast Golden Net (Catch Migration Fish)</span>
                    </button>
                  </div>
                )}

                {/* Event 7: Travelling Carnival Menagerie */}
                {activeEventState.id === 'carnival_circus' && (
                  <div className="space-y-2">
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      Supply raw grains, fruit, and milled feed bags to the carnival stall:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const sendQty = Math.min(5, getStock('wheat')) || 1;
                          supplyCarnivalFeeds([{ itemId: 'wheat', qty: sendQty }]);
                        }}
                        disabled={getStock('wheat') < 1}
                        className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                      >
                        🎪 Supply Wheat ({getStock('wheat')})
                      </button>
                      <button
                        onClick={() => {
                          const sendQty = Math.min(5, getStock('feed')) || 1;
                          supplyCarnivalFeeds([{ itemId: 'feed', qty: sendQty }]);
                        }}
                        disabled={getStock('feed') < 1}
                        className="py-2.5 px-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                      >
                        🦁 Supply Animal Feed ({getStock('feed')})
                      </button>
                    </div>
                  </div>
                )}

                {/* Event 8: Luminescent Spore Fog */}
                {activeEventState.id === 'alchemical_bloom' && (
                  <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                    <p>
                      🍄 <strong>Bioluminescent Spore Fog Active:</strong> All crop growth times clamped to 30s!
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Harvesters have a 50% chance to yield instant-finish Glowing Spores.
                    </p>
                    <div className="font-bold text-stone-800 dark:text-stone-200">
                      Crops Harvested: {activeEventState.progress} / 40
                    </div>
                  </div>
                )}

                {/* Event 9: Wandering Guild Craftsmen */}
                {activeEventState.id === 'artisan_masterclass' && (
                  <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                    <p>
                      ⚡ <strong>4× Machine Hyper-Drive Active:</strong> Bakery, Loom, and Cheese Press operate at 4× speed!
                    </p>
                    <div className="font-bold text-stone-800 dark:text-stone-200">
                      Artisan Goods Crafted: {activeEventState.progress} / 20
                    </div>
                  </div>
                )}

                {/* Event 10: Ancient Subterranean Excavation */}
                {activeEventState.id === 'ancient_ruins' && (
                  <div className="space-y-2">
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      Donate building supplies (softwood, iron, stone, rope) to clear ancient chambers:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const sendQty = Math.min(5, getStock('softwood')) || 1;
                          donateRuinsMaterials([{ itemId: 'softwood', qty: sendQty }]);
                        }}
                        disabled={getStock('softwood') < 1}
                        className="py-2.5 px-3 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                      >
                        ⛏️ Donate Wood ({getStock('softwood')})
                      </button>
                      <button
                        onClick={() => {
                          const sendQty = Math.min(5, getStock('cotton')) || 1;
                          donateRuinsMaterials([{ itemId: 'cotton', qty: sendQty }]);
                        }}
                        disabled={getStock('cotton') < 1}
                        className="py-2.5 px-3 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                      >
                        🏛️ Donate Fiber ({getStock('cotton')})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* High-Yield Reward Payload Card */}
              <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 p-4 rounded-2xl border border-amber-300/80 dark:border-amber-700/80 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  🎁 Grand Bounty Payload
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700">
                    <span className="text-xs text-stone-500 block">Coins</span>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                      +{def.grandReward.coins.toLocaleString()} 🪙
                    </span>
                  </div>
                  <div className="bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700">
                    <span className="text-xs text-stone-500 block">Gems</span>
                    <span className="text-sm font-black text-sky-500">
                      +{def.grandReward.gems} 💎
                    </span>
                  </div>
                  <div className="bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700">
                    <span className="text-xs text-stone-500 block">Relic / Artifact</span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate block">
                      {def.grandReward.relicName}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 italic text-center">
                  ✨ {def.grandReward.relicDescription}
                </p>
              </div>

              {/* Settlement Claim or Actions */}
              {activeEventState.phase === 'settlement' ? (
                <button
                  onClick={() => {
                    claimSystemicGrandReward();
                    onClose();
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-stone-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/40 ring-4 ring-yellow-400/40 active:scale-98 transition-all flex items-center justify-center gap-2 animate-bounce"
                >
                  <span>🎉 CLAIM EVENT REWARDS</span>
                  <span>🏆</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => advanceSystemicEventPhase()}
                    className="flex-1 py-2.5 px-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-all"
                  >
                    ⏩ Fast-Forward Phase
                  </button>
                  <button
                    onClick={() => {
                      dismissSystemicEvent();
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition-all border border-rose-200 dark:border-rose-900"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </>
          ) : (
            /* No Active Event - Radar Station & Phenomena Codex (Surprise-driven) */
            <div className="space-y-4">
              <div className="text-center py-4 bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-800/50 dark:to-stone-800/20 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-700/60">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Horizon Radar: Active Scanning</span>
                </div>
                <h4 className="font-black text-lg text-stone-900 dark:text-white">
                  Clear Skies on the Estate
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto mt-1 leading-relaxed">
                  Crises, royal expeditions, wandering smugglers, and seasonal festivals arrive as <b>unpredictable surprises</b> as your farm flourishes. Keep your silos stocked and crops watered to claim rare relics when they strike!
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Regional Phenomena Field Guide (10 Total)
                  </h5>
                  <span className="text-[11px] text-stone-400">Farm Level {level}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(SYSTEMIC_EVENTS).map((ev) => {
                    const cooldownUntil = systemicEventCooldowns[ev.id] || 0;
                    const isCooling = cooldownUntil > now;
                    const hoursLeft = Math.ceil((cooldownUntil - now) / 3600000);

                    return (
                      <div
                        key={ev.id}
                        className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/60 text-left transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-2xl select-none flex-shrink-0">
                              {ev.emoji}
                            </span>
                            <div className="min-w-0">
                              <div className="font-black text-xs text-stone-900 dark:text-white truncate">
                                {ev.name}
                              </div>
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                                {ev.badge} • Active: {Math.round(ev.activeDurationMs / 60000)}m
                              </div>
                            </div>
                          </div>
                          <div>
                            {isCooling ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400">
                                ⏳ Cooldown ({hoursLeft}h)
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                ⚡ Watching
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                          {ev.premise}
                        </p>

                        <div className="pt-1 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-600 dark:text-stone-300 flex items-center justify-between">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Relic: {ev.grandReward.relicName} {ev.grandReward.relicEmoji}
                          </span>
                          <span>
                            +{ev.grandReward.gems} 💎
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center justify-between">
          {onOpenRelics && (
            <button
              onClick={onOpenRelics}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5"
            >
              <span>🏛️ View Relics &amp; Monuments</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold text-xs bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
