'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { WildExpedition3D } from './WildExpedition3D';
import {
  ANIMALS, BIOMES, LURES, TIER_COLORS, TIER_LABELS,
  type AnimalSpecies, type Tier,
} from '@/game/data';
import {
  EXPEDITION_PRESETS, FRONTIER_MATERIALS,
  type ExpeditionPresetId, type CratedBeast,
} from '@/types/expeditions';
import { ITEM_CATALOG_META } from '@/utils/barnInventory';

const PRESET_KEYS: ExpeditionPresetId[] = ['1h', '4h', '8h', '12h'];

function formatTimeHHMMSS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function WildernessPanel() {
  const {
    level, coins, silo, barn, farmhands, animals, animalCapacity,
    wilderness, stagingWagonProvisions,
    packWagonItem, unpackWagonItem, clearWagonStaging,
    launchLongExpedition, recallExpeditionEarly, claimExpeditionSpoils,
    shipFrontierMaterialToBarn, shipAllFrontierMaterialsToBarn,
    transferCratedBeastToPasture, stationCratedBeastAtOutpost,
    unstationBeastFromOutpost, releaseCratedBeastToWild,
    returnLeftoverRationsToBarn, specialistWorkers,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'console' | 'cache' | 'holding' | 'stationed'>('console');
  const [selectedPresetId, setSelectedPresetId] = useState<ExpeditionPresetId>('1h');
  const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({});
  const [selectedFarmhandId, setSelectedFarmhandId] = useState<string | null>(null);
  const [inspectedBeast, setInspectedBeast] = useState<CratedBeast | null>(null);
  const [confirmRecallExpId, setConfirmRecallExpId] = useState<string | null>(null);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Real-time ticking for countdown clocks
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isOrinActive = Boolean(
    specialistWorkers?.worker_caravaner_orin?.isHired &&
    specialistWorkers?.worker_caravaner_orin?.isActive &&
    !specialistWorkers?.worker_caravaner_orin?.isStriking
  );

  const activeExpeditions = wilderness.activeExpeditions || [];
  const activeExpedition = activeExpeditions.find(e => e.status === 'active');
  const completedExpedition = activeExpeditions.find(e => e.status === 'completed' || e.status === 'recalled');

  const frontierCache = wilderness.frontierCache || {};
  const cacheTotalCount = Object.values(frontierCache).reduce((sum, q) => sum + q, 0);
  const campHoldingPens = wilderness.campHoldingPens || [];
  const stationedBeasts = wilderness.stationedBeasts || [];

  const currentPreset = EXPEDITION_PRESETS[selectedPresetId];
  const stagedProvisions = stagingWagonProvisions || {};
  const totalStagedRations = Object.values(stagedProvisions).reduce((sum, q) => sum + q, 0);
  const meetsMinRations = totalStagedRations >= currentPreset.minRationsRequired;

  // Farmhand selection
  const busyFarmhandIds = new Set(activeExpeditions.map(e => e.farmhandId).filter(Boolean));
  const availableFarmhands = farmhands.filter(fh => !busyFarmhandIds.has(fh.id));

  // Build eligible provision items from silo & barn
  const availableProvisions: { id: string; name: string; emoji: string; qty: number; category: string }[] = [];
  
  // Silo crops
  for (const [cropId, qty] of Object.entries(silo)) {
    if (qty > 0) {
      const meta = ITEM_CATALOG_META[cropId];
      availableProvisions.push({
        id: cropId,
        name: meta?.name || cropId,
        emoji: meta?.icon || '🌾',
        qty,
        category: 'Crop',
      });
    }
  }

  // Barn foods, forage, artisan goods
  for (const [itemId, qty] of Object.entries(barn)) {
    if (qty > 0 && !FRONTIER_MATERIALS[itemId]) {
      const meta = ITEM_CATALOG_META[itemId];
      availableProvisions.push({
        id: itemId,
        name: meta?.name || itemId,
        emoji: meta?.icon || '🍞',
        qty,
        category: meta?.category === 'forage' ? 'Forage' : meta?.category === 'artisan' ? 'Artisan' : 'Animal Product',
      });
    }
  }

  const handleTransfer = (itemId: string) => {
    const qty = transferQuantities[itemId] || 1;
    packWagonItem(itemId, qty);
    setTransferQuantities(prev => ({ ...prev, [itemId]: 1 }));
  };

  const handleMaxTransfer = (itemId: string, available: number) => {
    const spaceRemaining = Math.max(0, currentPreset.maxRationsCapacity - totalStagedRations);
    const amount = Math.min(available, spaceRemaining > 0 ? spaceRemaining : available);
    if (amount > 0) {
      packWagonItem(itemId, amount);
    }
  };

  const handleLaunch = () => {
    if (!meetsMinRations) return;
    const success = launchLongExpedition(selectedPresetId, stagedProvisions, selectedFarmhandId || undefined);
    if (success) {
      setSelectedFarmhandId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 3D Low-Poly Roguelite Wild Expedition */}
      <WildExpedition3D />

      {/* Wilderness Outpost Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 rounded-2xl p-4 md:p-5 text-white shadow-xl border border-emerald-700/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-800/80 border border-emerald-400/30 flex items-center justify-center text-3xl shadow-inner">
              🏕️
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-extrabold text-xl tracking-tight text-emerald-100">Frontier Basecamp & Expedition Hub</h2>
                {isOrinActive && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm animate-pulse">
                    <span>🚜</span> Orin Caravaner Active: +1 Pack Bonus
                  </span>
                )}
              </div>
              <p className="text-emerald-300/80 text-xs mt-0.5">
                Pack caravans with exact provisions, dispatch long-duration treks, and harvest wild spoils into local basecamp storage.
              </p>
            </div>
          </div>

          {/* Quick Outpost Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-emerald-950/70 border border-emerald-600/30 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-sm">🌿</span>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-emerald-400">Wild Essence</div>
                <div className="font-extrabold text-sm text-white">{wilderness.campRenown || 0}</div>
              </div>
            </div>
            <div className="bg-stone-900/80 border border-stone-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-sm">📦</span>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-stone-400">Frontier Cache</div>
                <div className="font-extrabold text-sm text-amber-300">{cacheTotalCount} items</div>
              </div>
            </div>
            <div className="bg-stone-900/80 border border-stone-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-sm">🐾</span>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-stone-400">Holding Pens</div>
                <div className="font-extrabold text-sm text-teal-300">{campHoldingPens.length} crated</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-emerald-800/60 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'console'
                ? 'bg-emerald-500 text-stone-950 shadow-md font-extrabold'
                : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <span>🧭</span>
            <span>Expedition Console</span>
            {activeExpedition && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            )}
            {completedExpedition && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-900 text-[10px] font-extrabold">READY</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cache')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cache'
                ? 'bg-emerald-500 text-stone-950 shadow-md font-extrabold'
                : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <span>📦</span>
            <span>Frontier Cache ({cacheTotalCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('holding')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'holding'
                ? 'bg-emerald-500 text-stone-950 shadow-md font-extrabold'
                : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <span>🐾</span>
            <span>Camp Holding Pens ({campHoldingPens.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stationed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stationed'
                ? 'bg-emerald-500 text-stone-950 shadow-md font-extrabold'
                : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <span>🛡️</span>
            <span>Stationed Companions ({stationedBeasts.length})</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: EXPEDITION CONSOLE --- */}
      {activeTab === 'console' && (
        <div className="space-y-4">
          {/* Phase 3: Expedition Arrival & Outpost Sorting (Completed / Recalled Trek) */}
          {completedExpedition && completedExpedition.spoils && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-stone-900 dark:to-amber-950/30 rounded-2xl border-2 border-amber-400 dark:border-amber-500/50 p-4 md:p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">
                    {completedExpedition.status === 'recalled' ? '📯' : '🎉'}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-lg text-amber-950 dark:text-amber-100">
                      {completedExpedition.status === 'recalled'
                        ? 'Caravan Recalled Early — Partial Spoils Salvaged'
                        : 'Expedition Triumphant! Caravan Returned to Basecamp'}
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      Spoils deposited directly into your local Frontier Cache and Camp Holding Pens. Review and manage your harvest below:
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => claimExpeditionSpoils(completedExpedition.id)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>✓</span>
                  <span>Dismiss Summary & Ready Next Trek</span>
                </button>
              </div>

              {/* Spoils Cards: Materials, Beasts, Unused Rations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Frontier Cache Section */}
                <div className="bg-white/80 dark:bg-stone-800/90 rounded-xl p-4 border border-amber-200 dark:border-stone-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span>📦</span> Raw Frontier Materials
                    </h4>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                      In Local Cache
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(completedExpedition.spoils.materials || {}).length === 0 ? (
                      <div className="text-xs text-stone-400 italic py-2">No raw materials gathered.</div>
                    ) : (
                      Object.entries(completedExpedition.spoils.materials || {}).map(([matId, qty]) => {
                        const mat = FRONTIER_MATERIALS[matId];
                        return (
                          <div key={matId} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{mat?.emoji || '🪵'}</span>
                              <span className="font-semibold text-stone-800 dark:text-gray-200">{mat?.name || matId}</span>
                            </div>
                            <span className="font-extrabold text-amber-600 dark:text-amber-400">+{qty}</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-stone-100 dark:border-stone-700">
                    <button
                      onClick={() => setActiveTab('cache')}
                      className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-gray-300 hover:bg-stone-200 transition-colors"
                    >
                      Keep in Cache
                    </button>
                    <button
                      onClick={() => shipAllFrontierMaterialsToBarn()}
                      className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <span>🚚</span> Ship to Barn
                    </button>
                  </div>
                </div>

                {/* 2. Holding Pens Section (Crated Beasts) */}
                <div className="bg-white/80 dark:bg-stone-800/90 rounded-xl p-4 border border-amber-200 dark:border-stone-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span>🐾</span> Captured Crated Beasts
                    </h4>
                    <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-full">
                      In Holding Pens
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(!completedExpedition.spoils.cratedBeasts || completedExpedition.spoils.cratedBeasts.length === 0) ? (
                      <div className="text-xs text-stone-400 italic py-2">No beasts tamed during this expedition.</div>
                    ) : (
                      completedExpedition.spoils.cratedBeasts.map(beast => (
                        <div
                          key={beast.id}
                          onClick={() => setInspectedBeast(beast)}
                          className="p-2.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20 hover:border-teal-500 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{beast.avatar || beast.emoji || '🐾'}</span>
                            <div>
                              <div className="font-bold text-xs text-stone-800 dark:text-gray-200">{beast.name}</div>
                              <div className="text-[10px]" style={{ color: TIER_COLORS[beast.tier] }}>
                                {TIER_LABELS[beast.tier]} · {beast.trait}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded font-bold">
                            Inspect
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab('holding')}
                    className="w-full py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <span>🐾</span> Manage in Holding Pens
                  </button>
                </div>

                {/* 3. Unused Rations & Residual Spoils */}
                <div className="bg-white/80 dark:bg-stone-800/90 rounded-xl p-4 border border-amber-200 dark:border-stone-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span>🍞</span> Leftover Rations & Coins
                    </h4>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                      Protected
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs">
                      <span className="font-medium text-stone-700 dark:text-gray-300">Expedition Bounty:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">+{completedExpedition.spoils.coins || 0} Coins</span>
                    </div>

                    {Object.entries(completedExpedition.spoils.leftoverRations || {}).length === 0 ? (
                      <div className="text-xs text-stone-400 italic py-1">All provisions consumed by the team.</div>
                    ) : (
                      Object.entries(completedExpedition.spoils.leftoverRations || {}).map(([itemId, qty]) => {
                        const meta = ITEM_CATALOG_META[itemId];
                        return (
                          <div key={itemId} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs">
                            <div className="flex items-center gap-2">
                              <span>{meta?.icon || '🍞'}</span>
                              <span className="font-semibold text-stone-800 dark:text-gray-200">{meta?.name || itemId}</span>
                            </div>
                            <span className="font-bold text-green-600 dark:text-green-400">+{qty} Unused</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {Object.keys(completedExpedition.spoils.leftoverRations || {}).length > 0 && (
                    <button
                      onClick={() => returnLeftoverRationsToBarn(completedExpedition.id)}
                      className="w-full py-1.5 text-xs font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <span>↩️</span> Return Leftovers to Barn
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: Active Trek & Live Wilderness Status Dashboard */}
          {activeExpedition && (
            <div className="bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-900 rounded-2xl border-2 border-emerald-500/60 p-4 md:p-6 text-white shadow-2xl space-y-5">
              {(() => {
                const preset = EXPEDITION_PRESETS[activeExpedition.presetId || '1h'];
                const elapsed = Math.max(0, now - activeExpedition.startedAt);
                const progress = Math.min(1, elapsed / activeExpedition.durationMs);
                const remainingSec = Math.max(0, Math.ceil((activeExpedition.durationMs - elapsed) / 1000));
                const farmhand = farmhands.find(fh => fh.id === activeExpedition.farmhandId);

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl animate-pulse">{preset.emoji}</div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-lg text-emerald-200">{preset.title}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                              {preset.label}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {farmhand ? `${farmhand.role} (Lv${farmhand.level}) navigating wilderness trail` : 'Caravan team exploring frontier trail'}
                          </p>
                        </div>
                      </div>

                      {/* Prominent Countdown Clock (HH:MM:SS) */}
                      <div className="text-right bg-stone-950/80 border border-emerald-500/40 rounded-xl px-4 py-2 shadow-inner">
                        <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Remaining Trek Time</div>
                        <div className="font-mono font-extrabold text-2xl text-amber-300 tracking-wider">
                          {formatTimeHHMMSS(remainingSec)}
                        </div>
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-stone-300">
                        <span>Progress: {Math.round(progress * 100)}% Complete</span>
                        <span>Danger: {preset.dangerRating}</span>
                      </div>
                      <div className="w-full h-3.5 bg-stone-800 rounded-full overflow-hidden p-0.5 border border-emerald-600/40">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full transition-all duration-1000"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Provisions Packed Summary */}
                    <div className="bg-stone-950/60 rounded-xl p-3 border border-emerald-800/40 space-y-2">
                      <div className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                        <span>📦 Packed Provisions Carried on Trek:</span>
                        <span className="text-[10px] text-stone-400">Locked in Caravan</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(activeExpedition.provisions || {}).map(([itemId, qty]) => {
                          const meta = ITEM_CATALOG_META[itemId];
                          return (
                            <span key={itemId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 text-xs font-medium text-stone-200">
                              <span>{meta?.icon || '🌾'}</span>
                              <span>{meta?.name || itemId}</span>
                              <span className="font-bold text-amber-300">x{qty}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Early Retreat / Sound Recall Horn Action */}
                    <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-emerald-800/40">
                      <div className="text-xs text-stone-400">
                        Need supplies back immediately? Sound the recall horn to turn around now.
                      </div>
                      <button
                        onClick={() => setConfirmRecallExpId(activeExpedition.id)}
                        className="px-4 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-extrabold border border-amber-400/40 transition-colors flex items-center gap-1.5 shadow-md"
                      >
                        <span>📯</span>
                        <span>Sound Recall Horn (Early Retreat)</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Phase 1: Pre-Expedition Wagon Packing Stage (When No Active Trek) */}
          {!activeExpedition && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 md:p-6 shadow-md space-y-6">
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🛒</span>
                    <div>
                      <h3 className="font-extrabold text-base text-stone-900 dark:text-gray-100">
                        Stage Caravan Provisions & Select Trek Duration
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-gray-400">
                        Zero auto-deductions. Transfer edible crops, forage, or baits from your Barn into the wagon cart.
                      </p>
                    </div>
                  </div>
                  {totalStagedRations > 0 && (
                    <button
                      onClick={() => clearWagonStaging()}
                      className="text-xs text-red-500 hover:text-red-600 font-bold px-2 py-1 rounded border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex items-center gap-1"
                    >
                      <span>✕</span> Unpack All to Barn
                    </button>
                  )}
                </div>
              </div>

              {/* 1. Duration Selector Bar (1h, 4h, 8h, 12h) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-gray-400 block mb-2">
                  1. Select Expedition Duration Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PRESET_KEYS.map(presetKey => {
                    const preset = EXPEDITION_PRESETS[presetKey];
                    const isSelected = selectedPresetId === presetKey;

                    return (
                      <div
                        key={presetKey}
                        onClick={() => setSelectedPresetId(presetKey)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all space-y-2 relative ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-400/20'
                            : 'border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{preset.emoji}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            preset.dangerLevel === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                            preset.dangerLevel === 2 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                            preset.dangerLevel === 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                          }`}>
                            {preset.dangerRating}
                          </span>
                        </div>

                        <div>
                          <div className="font-extrabold text-sm text-stone-900 dark:text-gray-100">{preset.title}</div>
                          <div className="text-[11px] text-stone-500 dark:text-gray-400 line-clamp-1">{preset.subtitle}</div>
                        </div>

                        <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
                          <span className="font-bold text-stone-700 dark:text-gray-300">⏱️ {preset.label}</span>
                          <span className="font-extrabold text-amber-600 dark:text-amber-400">Min {preset.minRationsRequired} Rations</span>
                        </div>

                        <div className="text-[10px] text-stone-500 dark:text-gray-400 font-medium">
                          {preset.rewardTierSummary}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Two-Sided Inventory Transfer Deck */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-gray-400 block mb-2">
                  2. Two-Sided Inventory Transfer Deck
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Home Barn Storage */}
                  <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-4 bg-stone-50/70 dark:bg-stone-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-gray-300 flex items-center gap-1.5">
                        <span>🏡</span> Home Barn & Silo Provisions ({availableProvisions.length} types)
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-gray-400">Click [+] or Max to Stage</span>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {availableProvisions.length === 0 ? (
                        <div className="text-xs text-stone-400 italic py-4 text-center">
                          No food, crops, or forage found in Barn/Silo. Harvest crops or produce feed first!
                        </div>
                      ) : (
                        availableProvisions.map(item => {
                          const currentQty = transferQuantities[item.id] || 1;

                          return (
                            <div key={item.id} className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2 shadow-sm">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xl flex-shrink-0">{item.emoji}</span>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-stone-900 dark:text-gray-100 truncate">{item.name}</div>
                                  <div className="text-[10px] text-stone-500 dark:text-gray-400">Available: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{item.qty}</span></div>
                                </div>
                              </div>

                              {/* Stepper & Transfer Button */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="flex items-center border border-stone-300 dark:border-stone-600 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-700">
                                  <button
                                    onClick={() => setTransferQuantities(prev => ({ ...prev, [item.id]: Math.max(1, currentQty - 1) }))}
                                    className="px-2 py-1 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600"
                                  >
                                    -
                                  </button>
                                  <span className="px-2 text-xs font-bold text-stone-800 dark:text-gray-200 min-w-[20px] text-center">
                                    {Math.min(currentQty, item.qty)}
                                  </span>
                                  <button
                                    onClick={() => setTransferQuantities(prev => ({ ...prev, [item.id]: Math.min(item.qty, currentQty + 1) }))}
                                    className="px-2 py-1 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleMaxTransfer(item.id, item.qty)}
                                  className="px-2 py-1 text-[10px] font-extrabold rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 transition-colors"
                                >
                                  Max
                                </button>

                                <button
                                  onClick={() => handleTransfer(item.id)}
                                  className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  Pack →
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: Supply Wagon Load */}
                  <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 p-4 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <span>🛒</span> Caravan Wagon Pack
                      </div>
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        meetsMinRations
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 animate-pulse'
                      }`}>
                        Carrying {totalStagedRations} / {currentPreset.minRationsRequired} Min Rations
                      </span>
                    </div>

                    {/* Capacity Indicator Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            meetsMinRations ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (totalStagedRations / currentPreset.minRationsRequired) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Staged Items List */}
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {Object.keys(stagedProvisions).length === 0 ? (
                        <div className="text-xs text-stone-400 italic py-8 text-center border-2 border-dashed border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                          Wagon is currently empty.<br />
                          Transfer at least <span className="font-bold text-amber-500">{currentPreset.minRationsRequired} food items</span> from the left column to launch.
                        </div>
                      ) : (
                        Object.entries(stagedProvisions).map(([itemId, qty]) => {
                          const meta = ITEM_CATALOG_META[itemId];
                          return (
                            <div key={itemId} className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{meta?.icon || '🌾'}</span>
                                <div>
                                  <div className="font-bold text-xs text-stone-900 dark:text-gray-100">{meta?.name || itemId}</div>
                                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Packed in Wagon</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-stone-800 dark:text-gray-200">x{qty}</span>
                                <button
                                  onClick={() => unpackWagonItem(itemId, 1)}
                                  className="px-2 py-1 text-xs font-bold rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950/50 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
                                  title="Unload 1 back to Barn"
                                >
                                  Unload 1
                                </button>
                                <button
                                  onClick={() => unpackWagonItem(itemId, qty)}
                                  className="px-2 py-1 text-xs font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                                  title="Unload all back to Barn"
                                >
                                  Return All
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Farmhand Selection */}
              {availableFarmhands.length > 0 && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-gray-400 block mb-1.5">
                    3. Optional: Assign Trail Guide Farmhand
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedFarmhandId(null)}
                      className={`px-3 py-1.5 text-xs rounded-xl font-bold border transition-all ${
                        selectedFarmhandId === null
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-gray-400'
                      }`}
                    >
                      Autopilot Team (No Guide)
                    </button>
                    {availableFarmhands.map(fh => (
                      <button
                        key={fh.id}
                        onClick={() => setSelectedFarmhandId(fh.id)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-bold border transition-all ${
                          selectedFarmhandId === fh.id
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                            : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-gray-400 hover:border-emerald-300'
                        }`}
                      >
                        {fh.role} (Lv{fh.level})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Check & Launch Caravan Button */}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-3">
                {!meetsMinRations ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>
                        <strong>Rations Insufficient:</strong> Need at least <strong>{currentPreset.minRationsRequired} food items</strong> in the wagon load to safely embark on a {currentPreset.durationHours}h trek.
                      </span>
                    </div>
                    <span className="font-extrabold text-amber-700 dark:text-amber-300">
                      Short {currentPreset.minRationsRequired - totalStagedRations}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <span>✅</span>
                    <span>
                      <strong>Caravan Fully Provisioned:</strong> Supplies verified. Ready to explore {currentPreset.title}!
                    </span>
                  </div>
                )}

                <button
                  onClick={handleLaunch}
                  disabled={!meetsMinRations}
                  className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                    meetsMinRations
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer hover:shadow-emerald-500/25'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed border border-stone-300 dark:border-stone-700'
                  }`}
                >
                  <span>🚀</span>
                  <span>
                    {meetsMinRations
                      ? `Launch Caravan — ${currentPreset.title} (${currentPreset.label})`
                      : `Pack ${currentPreset.minRationsRequired - totalStagedRations} More Rations to Launch`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: DEDICATED WILD FRONTIER CACHE --- */}
      {activeTab === 'cache' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 md:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-gray-100 flex items-center gap-2">
                <span>📦</span> Isolated Frontier Cache
              </h3>
              <p className="text-xs text-stone-500 dark:text-gray-400">
                Raw wilderness materials stored locally at basecamp. Transfer to your home Barn anytime.
              </p>
            </div>
            {cacheTotalCount > 0 && (
              <button
                onClick={() => shipAllFrontierMaterialsToBarn()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <span>🚚</span> Ship All ({cacheTotalCount}) to Home Barn
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(FRONTIER_MATERIALS).map(([matId, mat]) => {
              const qty = frontierCache[matId] || 0;
              return (
                <div key={matId} className={`p-4 rounded-xl border transition-all space-y-3 ${
                  qty > 0
                    ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-900/40 border-stone-100 dark:border-stone-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{mat.emoji}</span>
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      qty > 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                    }`}>
                      {qty} In Cache
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-sm text-stone-900 dark:text-gray-100">{mat.name}</div>
                    <div className="text-[11px] text-stone-500 dark:text-gray-400 mt-0.5">{mat.description}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-700 text-xs">
                    <span className="text-stone-500 dark:text-gray-400">Base Sell Value:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">🪙{mat.baseSellValue}</span>
                  </div>

                  {qty > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => shipFrontierMaterialToBarn(matId, 1)}
                        className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-800 dark:text-gray-200 transition-colors"
                      >
                        Ship 1
                      </button>
                      <button
                        onClick={() => shipFrontierMaterialToBarn(matId, qty)}
                        className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        Ship All ({qty})
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: CAMP HOLDING PENS --- */}
      {activeTab === 'holding' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 md:p-6 shadow-md space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-stone-900 dark:text-gray-100 flex items-center gap-2">
              <span>🐾</span> Camp Holding Pens ({campHoldingPens.length} Crated Beasts)
            </h3>
            <p className="text-xs text-stone-500 dark:text-gray-400">
              Animals tamed during expeditions arrive here and do not occupy farm pasture slots until you initiate a transfer.
            </p>
          </div>

          {capacityWarning && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
              <span>{capacityWarning}</span>
              <button onClick={() => setCapacityWarning(null)} className="font-bold text-red-500">✕</button>
            </div>
          )}

          {campHoldingPens.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl space-y-2">
              <span className="text-4xl">📦</span>
              <div className="font-bold text-sm text-stone-600 dark:text-gray-300">Holding Pens are Empty</div>
              <div className="text-xs text-stone-400">
                Launch a 1h, 4h, 8h, or 12h expedition to capture crated beasts.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {campHoldingPens.map(beast => {
                const currentPastureCount = animals.filter(a => a.species === beast.species).length;
                const maxPastureCapacity = animalCapacity[beast.species] || ANIMALS[beast.species].capacity;
                const isPastureFull = currentPastureCount >= maxPastureCapacity;

                return (
                  <div key={beast.id} className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{beast.avatar || beast.emoji || '🐾'}</span>
                        <div>
                          <div className="font-bold text-sm text-stone-900 dark:text-gray-100">{beast.name}</div>
                          <div className="text-xs font-semibold" style={{ color: TIER_COLORS[beast.tier] }}>
                            {TIER_LABELS[beast.tier]} {ANIMALS[beast.species].name}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-stone-100 dark:bg-stone-700 px-2 py-0.5 rounded font-bold text-stone-600 dark:text-gray-300">
                        {beast.originPreset}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-900 text-xs space-y-1">
                      <div className="font-bold text-stone-800 dark:text-gray-200">✨ {beast.trait}</div>
                      <div className="text-stone-500 dark:text-gray-400 text-[11px]">{beast.traitDescription}</div>
                    </div>

                    {/* Pasture Capacity Status */}
                    <div className="text-[11px] text-stone-500 dark:text-gray-400 flex justify-between">
                      <span>Farm {ANIMALS[beast.species].name} Pasture:</span>
                      <span className={`font-bold ${isPastureFull ? 'text-red-500' : 'text-emerald-500'}`}>
                        {currentPastureCount} / {maxPastureCapacity} slots
                      </span>
                    </div>

                    {/* 3 Action Buttons */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => {
                          const res = transferCratedBeastToPasture(beast.id);
                          if (!res.success) {
                            setCapacityWarning(res.message);
                          } else {
                            setCapacityWarning(null);
                          }
                        }}
                        className={`w-full py-1.5 text-xs font-extrabold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                          isPastureFull
                            ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        <span>🏡</span>
                        <span>{isPastureFull ? 'Pasture Full (Upgrade Sector)' : 'Transfer to Farm Pasture'}</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => stationCratedBeastAtOutpost(beast.id)}
                          className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                        >
                          🏕️ Station
                        </button>
                        <button
                          onClick={() => releaseCratedBeastToWild(beast.id)}
                          className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-700 dark:text-gray-300 transition-colors"
                        >
                          🌿 Release (+Essence)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: STATIONED COMPANIONS --- */}
      {activeTab === 'stationed' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 md:p-6 shadow-md space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-stone-900 dark:text-gray-100 flex items-center gap-2">
              <span>🛡️</span> Stationed Basecamp Companions ({stationedBeasts.length})
            </h3>
            <p className="text-xs text-stone-500 dark:text-gray-400">
              Creatures assigned to remain at outpost provide passive perks on all future wilderness expeditions.
            </p>
          </div>

          {stationedBeasts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl space-y-2">
              <span className="text-4xl">🏕️</span>
              <div className="font-bold text-sm text-stone-600 dark:text-gray-300">No Companions Stationed</div>
              <div className="text-xs text-stone-400">
                Go to the Holding Pens tab and click [Station] on any beast to activate its outpost perks.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stationedBeasts.map(beast => (
                <div key={beast.id} className="p-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{beast.avatar || beast.emoji || '🐾'}</span>
                      <div>
                        <div className="font-bold text-sm text-stone-900 dark:text-gray-100">{beast.name}</div>
                        <div className="text-xs font-semibold" style={{ color: TIER_COLORS[beast.tier] }}>
                          {TIER_LABELS[beast.tier]} Companion
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded font-extrabold">
                      ACTIVE PERK
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-teal-200 dark:border-teal-800/60 text-xs space-y-1">
                    <div className="font-extrabold text-teal-700 dark:text-teal-300">🛡️ {beast.trait}</div>
                    <div className="text-stone-600 dark:text-gray-400 text-[11px]">{beast.traitDescription}</div>
                  </div>

                  <button
                    onClick={() => unstationBeastFromOutpost(beast.id)}
                    className="w-full py-1.5 text-xs font-bold rounded-lg bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 text-stone-700 dark:text-gray-300 transition-colors"
                  >
                    Return to Holding Pens
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- CONFIRM RECALL EARLY MODAL --- */}
      {confirmRecallExpId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-amber-400 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📯</span>
              <div>
                <h4 className="font-extrabold text-base text-stone-900 dark:text-gray-100">Sound Recall Horn?</h4>
                <p className="text-xs text-stone-500 dark:text-gray-400">Early Retreat Confirmation</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <p>• The caravan team will abort their trek and turn around immediately.</p>
              <p>• Unconsumed rations will be safely returned to storage.</p>
              <p>• Partial spoils will be granted proportional to time elapsed.</p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmRecallExpId(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-gray-300 text-xs font-bold hover:bg-stone-200"
              >
                Keep Exploring
              </button>
              <button
                onClick={() => {
                  recallExpeditionEarly(confirmRecallExpId);
                  setConfirmRecallExpId(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md"
              >
                📯 Confirm Recall
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BEAST INSPECTION SHEET MODAL --- */}
      {inspectedBeast && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-teal-400 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{inspectedBeast.avatar || inspectedBeast.emoji || '🐾'}</span>
                <div>
                  <h4 className="font-extrabold text-base text-stone-900 dark:text-gray-100">{inspectedBeast.name}</h4>
                  <div className="text-xs font-bold" style={{ color: TIER_COLORS[inspectedBeast.tier] }}>
                    {TIER_LABELS[inspectedBeast.tier]} Tier · {ANIMALS[inspectedBeast.species].name}
                  </div>
                </div>
              </div>
              <button onClick={() => setInspectedBeast(null)} className="font-bold text-stone-400 hover:text-stone-600">✕</button>
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500 dark:text-gray-400">Special Trait:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{inspectedBeast.trait}</span>
              </div>
              <div className="text-[11px] text-stone-600 dark:text-gray-400">{inspectedBeast.traitDescription}</div>
              <div className="flex justify-between pt-1 border-t border-stone-200 dark:border-stone-700">
                <span className="text-stone-500 dark:text-gray-400">Captured On:</span>
                <span className="font-medium text-stone-700 dark:text-gray-300">{inspectedBeast.originPreset} Expedition</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const res = transferCratedBeastToPasture(inspectedBeast.id);
                  if (res.success) setInspectedBeast(null);
                  else setCapacityWarning(res.message);
                }}
                className="w-full py-2 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                🏡 Transfer to Farm Pasture
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    stationCratedBeastAtOutpost(inspectedBeast.id);
                    setInspectedBeast(null);
                  }}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                >
                  🏕️ Station at Basecamp
                </button>
                <button
                  onClick={() => {
                    releaseCratedBeastToWild(inspectedBeast.id);
                    setInspectedBeast(null);
                  }}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-gray-300 transition-colors"
                >
                  🌿 Release to Wild
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
