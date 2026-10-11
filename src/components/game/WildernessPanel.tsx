'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/store';
import { RogueliteExpeditionMap } from './RogueliteExpeditionMap';
import {
  ANIMALS, BIOMES, LURES, TIER_COLORS, TIER_LABELS,
  type BiomeId, type LureTypeId, type Tier,
} from '@/game/data';

const BIOME_ORDER: BiomeId[] = ['biome_woods', 'biome_ridge', 'biome_caves', 'biome_peaks'];
const LURE_ORDER: LureTypeId[] = ['lure_basic', 'lure_berry', 'lure_truffle', 'lure_nectar'];

export function WildernessPanel() {
  const {
    level, coins, barn, farmhands, animals, animalCapacity,
    wilderness, launchExpedition, resolveExpeditionChoice,
  } = useGameStore();

  const activeExpeditions = wilderness.activeExpeditions;
  const busyFarmhandIds = new Set(activeExpeditions.map(e => e.farmhandId));
  const idleFarmhands = farmhands.filter(fh => !busyFarmhandIds.has(fh.id));

  return (
    <div className="space-y-4">
      {/* Step 2: Roguelite Wild Expeditions (Push-Your-Luck Exploration) */}
      <RogueliteExpeditionMap />
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 dark:from-emerald-900 dark:to-teal-900 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏕️</span>
          <div>
            <h2 className="font-bold text-lg">Wilderness Outpost</h2>
            <p className="text-emerald-200 text-xs">Dispatch farmhands on wildlife rescue expeditions</p>
          </div>
        </div>
      </div>

      {/* Active Expeditions */}
      {activeExpeditions.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-stone-700 dark:text-gray-300 flex items-center gap-2">
            ⏳ Active Expeditions ({activeExpeditions.length})
          </h3>
          {activeExpeditions.map(exp => {
            const biome = BIOMES[exp.biomeId];
            const lure = LURES[exp.lureId];
            const elapsed = Date.now() - exp.startedAt;
            const progress = Math.min(1, elapsed / exp.durationMs);
            const remaining = Math.max(0, exp.durationMs - elapsed);
            const remainingSec = Math.ceil(remaining / 1000);
            const farmhand = farmhands.find(fh => fh.id === exp.farmhandId);

            return (
              <div key={exp.id} className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{biome.emoji}</span>
                    <div>
                      <div className="font-medium text-sm text-stone-800 dark:text-gray-200">{biome.name}</div>
                      <div className="text-xs text-stone-500 dark:text-gray-400">
                        {farmhand?.role || 'Farmhand'} · {lure.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-stone-500 dark:text-gray-400 font-mono">
                    {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, '0')}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-stone-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>

                {/* Midpoint Choice */}
                {exp.pendingChoice && !exp.midpointResolved && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 space-y-2">
                    <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                      ⚡ Trail Encounter
                    </div>
                    <p className="text-sm text-stone-700 dark:text-gray-300">{exp.pendingChoice.prompt}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolveExpeditionChoice(exp.id, false)}
                        className="flex-1 py-2 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors"
                      >
                        🌿 {exp.pendingChoice.safeLabel}
                      </button>
                      <button
                        onClick={() => resolveExpeditionChoice(exp.id, true)}
                        className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors animate-pulse"
                      >
                        ⚡ {exp.pendingChoice.riskyLabel}
                      </button>
                    </div>
                  </div>
                )}

                {exp.midpointResolved && (
                  <div className={`text-[10px] font-medium px-2 py-1 rounded-md inline-block ${
                    exp.riskyChosen
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  }`}>
                    {exp.riskyChosen ? '⚡ Risky path chosen' : '🌿 Safe path chosen'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Biome Destinations */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-stone-700 dark:text-gray-300">🗺️ Destinations</h3>
        {BIOME_ORDER.map(biomeId => {
          const biome = BIOMES[biomeId];
          const isUnlocked = level >= biome.unlockLevel;
          const isLocked = !isUnlocked;

          return (
            <div key={biomeId} className={`rounded-xl border p-3 space-y-2 ${
              isLocked
                ? 'bg-stone-50 dark:bg-gray-900/50 border-stone-200 dark:border-gray-700 opacity-60'
                : 'bg-white dark:bg-gray-900 border-stone-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{biome.emoji}</span>
                  <div>
                    <div className="font-medium text-sm text-stone-800 dark:text-gray-200">{biome.name}</div>
                    <div className="text-xs text-stone-500 dark:text-gray-400">{biome.description}</div>
                  </div>
                </div>
                {isLocked && (
                  <span className="text-[10px] bg-stone-200 dark:bg-gray-700 text-stone-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                    Lv {biome.unlockLevel}
                  </span>
                )}
              </div>

              {/* Species Pool Preview */}
              <div className="flex flex-wrap gap-1">
                {biome.speciesPool.map((sp, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${TIER_COLORS[sp.tier]}20`,
                      color: TIER_COLORS[sp.tier],
                      border: `1px solid ${TIER_COLORS[sp.tier]}40`,
                    }}
                  >
                    {ANIMALS[sp.species].emoji} {TIER_LABELS[sp.tier]}
                  </span>
                ))}
              </div>

              {/* Dispatch Details */}
              {isUnlocked && (
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-gray-400">
                  <span>⏱️ {Math.floor(biome.baseDurationMs / 60_000)} min · 💰 {biome.dispatchFee.toLocaleString()}</span>
                </div>
              )}

              {/* Dispatch Button */}
              {isUnlocked && idleFarmhands.length > 0 && (
                <DispatchDrawer
                  biomeId={biomeId}
                  biome={biome}
                  idleFarmhands={idleFarmhands}
                  coins={coins}
                  barn={barn}
                  animals={animals}
                  animalCapacity={animalCapacity}
                  launchExpedition={launchExpedition}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Lure Crafting Reference */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-stone-700 dark:text-gray-300">🪤 Lure Guide</h3>
        <div className="grid grid-cols-2 gap-2">
          {LURE_ORDER.map(lureId => {
            const lure = LURES[lureId];
            const owned = barn[lure.productId] || 0;
            return (
              <div key={lureId} className="bg-stone-50 dark:bg-gray-800/50 rounded-lg p-2 text-center">
                <div className="text-lg">{lure.emoji}</div>
                <div className="text-[10px] font-medium text-stone-700 dark:text-gray-300">{lure.name}</div>
                <div className="text-[9px]" style={{ color: TIER_COLORS[lure.targetTier] }}>
                  Targets {TIER_LABELS[lure.targetTier]}
                </div>
                {lure.timeMultiplier < 1 && (
                  <div className="text-[9px] text-blue-500">-{Math.round((1 - lure.timeMultiplier) * 100)}% time</div>
                )}
                <div className={`text-[10px] font-bold mt-0.5 ${owned > 0 ? 'text-green-600 dark:text-green-400' : 'text-stone-400 dark:text-gray-500'}`}>
                  Owned: {owned}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Dispatch Drawer ---
function DispatchDrawer({
  biomeId,
  biome,
  idleFarmhands,
  coins,
  barn,
  animals,
  animalCapacity,
  launchExpedition,
}: {
  biomeId: BiomeId;
  biome: typeof BIOMES[BiomeId];
  idleFarmhands: { id: string; role: string; level: number }[];
  coins: number;
  barn: Record<string, number>;
  animals: { species: string }[];
  animalCapacity: Record<string, number>;
  launchExpedition: (biomeId: BiomeId, farmhandId: string, lureId: LureTypeId) => void;
}) {
  const [selectedFarmhand, setSelectedFarmhand] = useState<string | null>(null);
  const [selectedLure, setSelectedLure] = useState<LureTypeId | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const canAfford = coins >= biome.dispatchFee;
  const hasLure = selectedLure && (barn[LURES[selectedLure].productId] || 0) > 0;
  const canDispatch = selectedFarmhand && selectedLure && canAfford && hasLure;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2"
      >
        🧭 Launch Expedition
      </button>

      {isOpen && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 space-y-3">
          {/* Farmhand Selection */}
          <div>
            <label className="text-[10px] font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider">Select Farmhand</label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {idleFarmhands.map(fh => (
                <button
                  key={fh.id}
                  onClick={() => setSelectedFarmhand(fh.id)}
                  className={`py-1.5 px-2 text-xs rounded-lg border-2 transition-all ${
                    selectedFarmhand === fh.id
                      ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-stone-200 dark:border-gray-700 text-stone-600 dark:text-gray-400 hover:border-emerald-300'
                  }`}
                >
                  {fh.role} (Lv{fh.level})
                </button>
              ))}
            </div>
          </div>

          {/* Lure Selection */}
          <div>
            <label className="text-[10px] font-medium text-stone-600 dark:text-gray-400 uppercase tracking-wider">Select Lure</label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {LURE_ORDER.map(lureId => {
                const lure = LURES[lureId];
                const qty = barn[lure.productId] || 0;
                const available = qty > 0;
                return (
                  <button
                    key={lureId}
                    onClick={() => available && setSelectedLure(lureId)}
                    disabled={!available}
                    className={`py-1.5 px-2 text-xs rounded-lg border-2 transition-all ${
                      selectedLure === lureId
                        ? 'border-amber-500 bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300'
                        : available
                        ? 'border-stone-200 dark:border-gray-700 text-stone-600 dark:text-gray-400 hover:border-amber-300'
                        : 'border-stone-200 dark:border-gray-700 text-stone-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {lure.emoji} {lure.name} ({qty})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dispatch Summary */}
          {canDispatch && (
            <button
              onClick={() => {
                launchExpedition(biomeId, selectedFarmhand!, selectedLure!);
                setIsOpen(false);
                setSelectedFarmhand(null);
                setSelectedLure(null);
              }}
              className="w-full py-2.5 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              🧭 Launch — 💰{biome.dispatchFee.toLocaleString()}
            </button>
          )}
          {!canAfford && (
            <div className="text-xs text-red-500 text-center">Need 💰{biome.dispatchFee.toLocaleString()} to dispatch</div>
          )}
        </div>
      )}
    </div>
  );
}
