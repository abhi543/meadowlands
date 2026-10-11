'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';

const DEPTH_NODES = [
  { depth: 1, name: 'Whispering Outpost', emoji: '🌲', hazardRate: '15%', mult: '1x' },
  { depth: 2, name: 'Foggy Ridge', emoji: '🌫️', hazardRate: '35%', mult: '2x' },
  { depth: 3, name: 'Cavern Depths', emoji: '🦇', hazardRate: '55%', mult: '4x' },
  { depth: 4, name: 'Crystal Chasms', emoji: '💎', hazardRate: '75%', mult: '8x' },
  { depth: 5, name: 'Ancient Hollow', emoji: '👑', hazardRate: '95%', mult: '16x' },
];

export function RogueliteExpeditionMap() {
  const {
    wildExpedition,
    startRogueliteExpedition,
    progressRogueliteNode,
    resolveRogueliteHazard,
    extractRogueliteLoot,
    craftRogueliteRations,
    buyRogueliteRetreatTool,
    coins,
  } = useGameStore();

  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    isActive,
    currentDepth,
    partyStamina,
    rations,
    retreatTools,
    accumulatedLoot,
    currentNodeStatus,
    currentEncounter,
    workerCooldownUntil,
    history,
  } = wildExpedition;

  const now = Date.now();
  const isCooldown = Boolean(workerCooldownUntil && now < workerCooldownUntil);
  const cooldownSec = isCooldown ? Math.ceil((workerCooldownUntil! - now) / 1000) : 0;

  const staminaColor =
    partyStamina > 60
      ? 'bg-emerald-500'
      : partyStamina > 25
      ? 'bg-amber-500'
      : 'bg-rose-500 animate-pulse';

  return (
    <div className="bg-stone-900 border-2 border-stone-800 rounded-2xl p-4 text-stone-100 shadow-xl space-y-4">
      {/* Header & Resource Gauges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏕️</span>
            <div>
              <h3 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                Roguelite Wild Expedition
                {isActive && (
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Depth {currentDepth} / 5
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-stone-400">
                Push-your-luck deep exploration · 2x rewards per depth · Wipeout forfeits 75% loot
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Supplies Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            disabled={coins < 20}
            onClick={craftRogueliteRations}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              coins >= 20
                ? 'bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/50 active:scale-95'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
            }`}
            title="Restore +40 Stamina & +2 Rations"
          >
            <span>🥖</span>
            <span>+2 Rations (20 🪙)</span>
          </button>

          <button
            disabled={coins < 30}
            onClick={buyRogueliteRetreatTool}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              coins >= 30
                ? 'bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/50 active:scale-95'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
            }`}
            title="Safe Escape Tool (bypasses hazard)"
          >
            <span>💣</span>
            <span>+1 Escape Bomb (30 🪙)</span>
          </button>
        </div>
      </div>

      {/* Stamina & Inventory Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-stone-300 flex items-center gap-1">
              <span>⚡</span> Party Stamina
            </span>
            <span className="font-mono font-bold text-white">{partyStamina} / 100</span>
          </div>
          <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${staminaColor}`}
              style={{ width: `${Math.min(100, Math.max(0, partyStamina))}%` }}
            />
          </div>
        </div>

        <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Rations</span>
            <span className="font-black text-amber-300 text-sm">{rations} Packets</span>
          </div>
          <span className="text-xl">🥖</span>
        </div>

        <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-stone-400 block text-[10px] uppercase font-bold">Retreat Tools</span>
            <span className="font-black text-purple-300 text-sm">{retreatTools} Smoke Bombs</span>
          </div>
          <span className="text-xl">💣</span>
        </div>
      </div>

      {/* 5-Depth Node Map Display */}
      <div className="bg-stone-950/80 rounded-xl p-3 border border-stone-800/80 space-y-2">
        <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
          🗺️ Expedition Route (Depth 1 to 5)
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {DEPTH_NODES.map(node => {
            const isCurrent = isActive && currentDepth === node.depth;
            const isPassed = isActive && currentDepth > node.depth;
            const isAhead = isActive && currentDepth < node.depth;

            return (
              <div
                key={node.depth}
                className={`p-2 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105 shadow-lg shadow-amber-500/20'
                    : isPassed
                    ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300 opacity-90'
                    : isAhead
                    ? 'bg-stone-900 border-stone-800 text-stone-500 opacity-60'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400'
                }`}
              >
                <div className="text-lg mb-0.5">{node.emoji}</div>
                <div className="text-[10px] font-black truncate">{node.name}</div>
                <div className="text-[9px] font-mono text-amber-300 font-bold">{node.mult} Loot</div>
                <div className="text-[8px] font-mono text-rose-400 font-semibold">{node.hazardRate} Risk</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accumulated Loot Box */}
      <div className="bg-gradient-to-r from-amber-950/30 to-stone-900 p-3 rounded-xl border border-amber-800/30 flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
            🎒 Accumulated Unbanked Loot
          </span>
          <div className="flex items-center gap-3 text-xs font-black mt-0.5">
            <span className="text-amber-200">🪙 {accumulatedLoot.coins}</span>
            <span className="text-cyan-300">💎 {accumulatedLoot.gems}</span>
            <span className="text-emerald-300">🧬 {accumulatedLoot.geneTokens} Tokens</span>
            {accumulatedLoot.relicFragments > 0 && (
              <span className="text-purple-300">🏛️ {accumulatedLoot.relicFragments} Frags</span>
            )}
          </div>
        </div>

        {isActive && (
          <button
            onClick={extractRogueliteLoot}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-stone-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            🏆 EXTRACT SAFELY (Bank 100%)
          </button>
        )}
      </div>

      {/* Expedition Action Interface */}
      {!isActive ? (
        <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 text-center space-y-3">
          {isCooldown ? (
            <div className="space-y-1">
              <span className="text-2xl animate-pulse">⏳</span>
              <h4 className="font-bold text-amber-400 text-sm">Workers Recovering from Wipeout</h4>
              <p className="text-xs text-stone-400 font-mono">Cooldown active: {cooldownSec}s remaining</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="font-black text-white text-sm">Ready for Wild Expedition</h4>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Assemble a search party. Delve through deep wilderness nodes. Each cleared node doubles your loot!
              </p>
              <button
                onClick={startRogueliteExpedition}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                🚀 DISPATCH EXPEDITION (Costs 15 ⚡)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Active Expedition Loop */
        <div className="space-y-3">
          {/* Node Status Banner */}
          {currentNodeStatus === 'ready' && (
            <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 text-center space-y-3">
              <h4 className="font-bold text-white text-sm">
                Standing at Depth {currentDepth}: {DEPTH_NODES[currentDepth - 1]?.name}
              </h4>
              <p className="text-xs text-stone-400">
                Scout this territory to discover hidden supply caches or confront regional hazards.
              </p>
              <button
                onClick={progressRogueliteNode}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs transition-transform active:scale-95"
              >
                🧭 SCOUT & EXPLORE NODE
              </button>
            </div>
          )}

          {/* Hazard Encounter Decision Tree */}
          {currentNodeStatus === 'hazard' && currentEncounter && (
            <div className="p-4 bg-rose-950/40 rounded-xl border-2 border-rose-600/80 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">{currentEncounter.emoji}</span>
                <div>
                  <span className="text-[10px] font-black uppercase text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded-full border border-rose-500/50">
                    Hazard Encounter ({currentEncounter.hazardChance}% Danger)
                  </span>
                  <h4 className="font-black text-rose-200 text-sm">{currentEncounter.title}</h4>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                {currentEncounter.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => resolveRogueliteHazard(true)}
                  disabled={retreatTools <= 0 && rations <= 0}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                    retreatTools > 0 || rations > 0
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 active:scale-95'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  }`}
                >
                  <span>🛡️</span>
                  <span>Use Escape Tool / Ration (Bypass)</span>
                </button>

                <button
                  onClick={() => resolveRogueliteHazard(false)}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-rose-600/30 active:scale-95"
                >
                  ⚡ Endure Hazard (Take Stamina Dmg)
                </button>
              </div>
            </div>
          )}

          {/* Cleared Node: Push Your Luck Decision */}
          {currentNodeStatus === 'cleared' && (
            <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-500/80 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <h4 className="font-black text-emerald-300 text-sm">
                      Depth {currentDepth} Cleared!
                    </h4>
                    <p className="text-xs text-stone-300">
                      Loot added to bag. Will you extract safely or push your luck deeper?
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={extractRogueliteLoot}
                  className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-xl text-xs transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  🏆 EXTRACT SAFELY (Bank 100%)
                </button>

                {currentDepth < 5 ? (
                  <button
                    onClick={() => {
                      useGameStore.setState(s => ({
                        wildExpedition: {
                          ...s.wildExpedition,
                          currentDepth: s.wildExpedition.currentDepth + 1,
                          currentNodeStatus: 'ready',
                          currentEncounter: null,
                        },
                      }));
                    }}
                    className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black rounded-xl text-xs transition-transform active:scale-95 shadow-md shadow-amber-500/20"
                  >
                    ⚔️ DELVE DEEPER (Depth {currentDepth + 1}) 2x LOOT!
                  </button>
                ) : (
                  <button
                    onClick={extractRogueliteLoot}
                    className="py-2.5 px-3 bg-amber-400 text-stone-950 font-black rounded-xl text-xs"
                  >
                    👑 MAXIMUM DEPTH REACHED! EXTRACT!
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Log */}
      {history.length > 0 && (
        <div className="text-[10px] text-stone-500 font-mono space-y-0.5 border-t border-stone-800 pt-2">
          <span className="font-bold uppercase tracking-wider text-stone-400">Expedition Log:</span>
          {history.slice(0, 3).map((line, idx) => (
            <div key={idx} className="truncate">{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
