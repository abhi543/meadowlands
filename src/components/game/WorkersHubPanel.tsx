'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  WORKER_REGISTRY, WORKER_DIVISIONS, WORKER_MAX_LEVEL,
  workerUpgradeCost, workerEffectiveInterval, workerDoubleProcChance,
  workerTripleProcUnlocked, workerGemProcUnlocked, workerAutoSellPayout,
  workerSpeedMultiplier, workerHopperBuffer, workerAutoSellBonus,
  calculateBulkUpgrade, getMilestoneRank, MILESTONE_RANKS,
  type WorkerRole, type WorkerDivision, type BulkMode,
} from '@/game/data';
import { OverclockActionMenu } from './OverclockActionMenu';
import { SpecialistWorkersSection } from './SpecialistWorkersSection';

/** Generate contextual help hint for why a worker can't be hired/upgraded */
function getBlockHint(args: {
  role: WorkerRole;
  isHired: boolean;
  isUnlocked: boolean;
  unlockLevel: number;
  coins: number;
  cost: number;
  workerLevel: number;
  bulkMode: BulkMode;
  upgradeResult: { levelsToBuy: number; totalCost: number } | null;
}): string | null {
  const { isHired, isUnlocked, unlockLevel, coins, cost, workerLevel, bulkMode, upgradeResult } = args;

  // Not unlocked yet
  if (!isHired && !isUnlocked) {
    return `Reach Level ${unlockLevel} to unlock this worker`;
  }

  // Unlocked but can't afford to hire
  if (!isHired && isUnlocked && coins < cost) {
    return `Need ${cost.toLocaleString()} coins to hire (short ${(cost - coins).toLocaleString()})`;
  }

  // Hired but can't afford upgrade
  if (isHired && workerLevel < WORKER_MAX_LEVEL && upgradeResult) {
    if (upgradeResult.levelsToBuy === 0 || coins < upgradeResult.totalCost) {
      const singleCost = workerUpgradeCost(args.role, workerLevel);
      // Provide contextual hint based on how far away they are
      const deficit = singleCost - coins;
      if (deficit > singleCost * 10) {
        return `Too expensive — earn more coins or use Hoard mode on other workers`;
      }
      return `Need ${singleCost.toLocaleString()} coins for next level (short ${deficit.toLocaleString()})`;
    }
    // x10/MAX partial affordability hint
    if (bulkMode !== 'x1' && upgradeResult.levelsToBuy > 0) {
      const maxPossible = WORKER_MAX_LEVEL - workerLevel;
      if (bulkMode === 'x10' && upgradeResult.levelsToBuy < Math.min(10, maxPossible)) {
        return `Can only afford ${upgradeResult.levelsToBuy} of 10 levels`;
      }
    }
  }

  return null;
}

/** Get the next milestone perk hint */
function getNextMilestoneHint(currentLevel: number): string | null {
  const nextRank = MILESTONE_RANKS.find(r => r.minLevel > currentLevel);
  if (!nextRank) return null;
  const levelsAway = nextRank.minLevel - currentLevel;
  if (levelsAway > 40) return null; // too far away, don't show
  const perkMap: Record<string, string> = {
    'Apprentice': '+10% Auto-Sell value',
    'Journeyman': 'Hopper buffer (store overflow cycles)',
    'Craftsman': '5% chance to drop Gems per cycle',
    'Expert': '+10% speed to adjacent buildings',
    'Grandmaster': '15% chance for Triple Yield (3x)',
    'Mythic': 'Overdrive: extra -20% interval',
  };
  const perk = perkMap[nextRank.title] || '';
  return `${nextRank.title} at Lv${nextRank.minLevel} (${levelsAway} away) — ${perk}`;
}

/** Get next individual perk unlock hint */
function getNextPerkHint(currentLevel: number): string | null {
  if (currentLevel < 20) return `Lv20: +10% Auto-Sell bonus`;
  if (currentLevel < 40) return `Lv40: Hopper buffer unlocks (buffer overflow cycles)`;
  if (currentLevel < 60) return `Lv60: Gem drops unlock (5% per cycle)`;
  if (currentLevel < 80) return `Lv80: District Aura (+10% adjacent speed)`;
  if (currentLevel < 100) return `Lv100: Triple Yield (15% on double procs)`;
  if (currentLevel < 120) return `Lv120: Overdrive Engine (extra -20% speed)`;
  return null;
}

export function WorkersHubPanel({ onSelectTab }: { onSelectTab?: (tab: string) => void } = {}) {
  const { unifiedWorkers, coins, level, hireUnifiedWorker, bulkUpgradeUnifiedWorker, toggleUnifiedWorkerMode } = useGameStore();
  const [activeDivision, setActiveDivision] = useState<WorkerDivision>('farmhand');
  const [bulkMode, setBulkMode] = useState<BulkMode>('x1');
  const now = Date.now();

  const division = WORKER_DIVISIONS[activeDivision];
  const hiredCount = Object.values(unifiedWorkers).filter(w => w.isHired).length;
  const totalWorkers = Object.keys(WORKER_REGISTRY).length;

  // Count workers per division
  const divisionCounts: Record<WorkerDivision, number> = { farmhand: 0, autonomous: 0, utility: 0 };
  for (const w of Object.values(unifiedWorkers)) {
    if (w.isHired) divisionCounts[WORKER_REGISTRY[w.role].division]++;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          {'\u{1F477}'} Workers & Guilds
        </h3>
        <span className="text-xs text-stone-500 dark:text-gray-400">{hiredCount}/{totalWorkers} hired</span>
      </div>

      {/* Prominent Dedicated Specialist Workers Section */}
      <SpecialistWorkersSection onSelectTab={onSelectTab} />

      {/* Division Tabs */}
      <div className="flex gap-1 bg-stone-100 dark:bg-gray-800 rounded-lg p-1">
        {(Object.entries(WORKER_DIVISIONS) as [WorkerDivision, typeof division][]).map(([divId, div]) => {
          const isActive = activeDivision === divId;
          const count = divisionCounts[divId];
          return (
            <button
              key={divId}
              onClick={() => setActiveDivision(divId)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-stone-800 dark:text-gray-100 shadow-sm'
                  : 'text-stone-500 dark:text-gray-400 hover:text-stone-700 dark:hover:text-gray-300'
              }`}
            >
              {div.emoji} {div.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Bulk Upgrade Multiplier */}
      <div className="flex items-center gap-2 bg-stone-50 dark:bg-gray-800/50 rounded-lg p-2">
        <span className="text-xs text-stone-500 dark:text-gray-400 font-medium">Upgrade:</span>
        <div className="flex gap-1">
          {(['x1', 'x10', 'MAX'] as BulkMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setBulkMode(mode)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                bulkMode === mode
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-stone-200 dark:bg-gray-700 text-stone-600 dark:text-gray-300 hover:bg-stone-300 dark:hover:bg-gray-600'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Worker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {division.roles.map(role => {
          const cfg = WORKER_REGISTRY[role];
          const worker = unifiedWorkers[role];
          if (!worker) return null;

          const isUnlocked = level >= cfg.unlockLevel;
          const rank = getMilestoneRank(worker.level);
          const effectiveInterval = workerEffectiveInterval(role, worker.level);
          const elapsed = worker.isHired ? now - worker.lastActionTimestamp : 0;
          const progress = worker.isHired ? Math.min(1, elapsed / effectiveInterval) : 0;
          const doubleChance = workerDoubleProcChance(worker.level);
          const canUpgrade = worker.isHired && worker.level < WORKER_MAX_LEVEL;
          const upgradeResult = canUpgrade ? calculateBulkUpgrade(role, worker.level, bulkMode, coins) : null;
          const canAfford = upgradeResult && upgradeResult.levelsToBuy > 0 && coins >= upgradeResult.totalCost;
          const speedPct = Math.round((1 - workerSpeedMultiplier(worker.level)) * 100);
          const payout = workerAutoSellPayout(role, worker.level);
          const hopper = workerHopperBuffer(worker.level);
          const autoSellBonusPct = workerAutoSellBonus(worker.level) > 1 ? Math.round((workerAutoSellBonus(worker.level) - 1) * 100) : 0;

          // Block hint
          const blockHint = getBlockHint({
            role,
            isHired: worker.isHired,
            isUnlocked,
            unlockLevel: cfg.unlockLevel,
            coins,
            cost: cfg.baseCost,
            workerLevel: worker.level,
            bulkMode,
            upgradeResult,
          });

          // Next milestone & perk hints (only for hired workers)
          const nextMilestone = worker.isHired ? getNextMilestoneHint(worker.level) : null;
          const nextPerk = worker.isHired ? getNextPerkHint(worker.level) : null;

          return (
            <div
              key={role}
              className={`rounded-xl border p-3 transition-all ${
                worker.isHired
                  ? `${rank.bgColor} ${rank.borderColor}`
                  : 'bg-white dark:bg-gray-900 border-stone-200 dark:border-gray-700'
              } ${!isUnlocked ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Emoji */}
                <div className="text-3xl flex-shrink-0">{cfg.emoji}</div>

                <div className="flex-1 min-w-0">
                  {/* Name + Level */}
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm text-stone-800 dark:text-gray-200 truncate">
                      {cfg.name}
                    </h4>
                    {worker.isHired && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rank.color} ${rank.bgColor} border ${rank.borderColor} whitespace-nowrap`}>
                        {rank.emoji} {rank.title}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">{cfg.description}</p>

                  {/* Unlock requirement hint (for unhired, locked workers) */}
                  {!worker.isHired && !isUnlocked && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                      <span>{'\u{1F512}'}</span>
                      <span className="font-medium">Requires Level {cfg.unlockLevel}</span>
                      <span className="text-red-400 dark:text-red-500">({level}/{cfg.unlockLevel})</span>
                    </div>
                  )}

                  {/* Hire cost too expensive hint */}
                  {!worker.isHired && isUnlocked && coins < cfg.baseCost && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                      <span>{'\u{1F4B0}'}</span>
                      <span>Need {cfg.baseCost.toLocaleString()} coins — short {(cfg.baseCost - coins).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Level Bar */}
                  {worker.isHired && (
                    <>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-medium text-stone-700 dark:text-gray-300">
                          Level {worker.level} / {WORKER_MAX_LEVEL}
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-gray-400">
                          Interval -{speedPct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mt-0.5">
                        <div
                          className="h-full bg-violet-500 dark:bg-violet-400 rounded-full transition-all"
                          style={{ width: `${(worker.level / WORKER_MAX_LEVEL) * 100}%` }}
                        />
                      </div>
                    </>
                  )}

                  {/* Progress Bar (production timer) */}
                  {worker.isHired && (
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-stone-500 dark:text-gray-400">
                          Next: {Math.max(0, Math.ceil((effectiveInterval - elapsed) / 1000))}s
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats Row */}
                  {worker.isHired && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-stone-500 dark:text-gray-400">
                      <span>2x Drop: {Math.round(doubleChance * 100)}%</span>
                      {workerTripleProcUnlocked(worker.level) && <span className="text-rose-500">3x: 15%</span>}
                      {workerGemProcUnlocked(worker.level) && <span className="text-blue-500">{'\u{1F48E}'} 5%</span>}
                      {hopper > 0 && <span>Buffer: {hopper}</span>}
                      {autoSellBonusPct > 0 && <span className="text-emerald-500">Sell +{autoSellBonusPct}%</span>}
                    </div>
                  )}

                  {/* Mode Toggle */}
                  {worker.isHired && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-stone-500 dark:text-gray-400">Mode:</span>
                      <button
                        onClick={() => toggleUnifiedWorkerMode(role)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                          worker.autoSell
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {'\u{1F4B0}'} Auto-Sell {worker.autoSell ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => toggleUnifiedWorkerMode(role)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                          !worker.autoSell
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {'\u{1F3D6}'} Hoard {!worker.autoSell ? 'ON' : 'OFF'}
                      </button>
                      {worker.autoSell && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          +{payout} {'\u{1FA99}'}
                        </span>
                      )}
                      {!worker.autoSell && cfg.hoardItem && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          +1 {cfg.hoardItemEmoji} {cfg.hoardItem}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Hoard mode hint for special workers */}
                  {worker.isHired && !worker.autoSell && role === 'merchant' && (
                    <div className="mt-1 text-[10px] text-amber-500 dark:text-amber-400 italic">
                      {'\u{1F4E6}'} Hoarding items for VIP Delivery Orders
                    </div>
                  )}
                  {worker.isHired && !worker.autoSell && role === 'barn_overseer' && (
                    <div className="mt-1 text-[10px] text-amber-500 dark:text-amber-400 italic">
                      {'\u{1F4E6}'} Auto-fills empty feeding troughs
                    </div>
                  )}
                  {worker.isHired && worker.autoSell && role === 'merchant' && (
                    <div className="mt-1 text-[10px] text-emerald-500 dark:text-emerald-400 italic">
                      {'\u{1F4B0}'} Sells surplus silo crops at +20% premium
                    </div>
                  )}

                  {/* Lifetime Stats */}
                  {worker.isHired && (
                    <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-stone-400 dark:text-gray-500">
                      <span>{'\u{1F4B0}'} {worker.stats.totalCoinsEarned.toLocaleString()}</span>
                      <span>{'\u{1F4E6}'} {worker.stats.totalItemsProduced.toLocaleString()}</span>
                      {worker.stats.totalGemsEarned > 0 && <span>{'\u{1F48E}'} {worker.stats.totalGemsEarned}</span>}
                    </div>
                  )}

                  {/* Next Milestone / Perk Hint */}
                  {worker.isHired && nextMilestone && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 rounded px-2 py-1">
                      <span>{'\u2B50'}</span>
                      <span>{nextMilestone}</span>
                    </div>
                  )}

                  {/* Next Perk Unlock Hint (only show if no milestone hint, to avoid clutter) */}
                  {worker.isHired && !nextMilestone && nextPerk && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-gray-400 bg-stone-50 dark:bg-gray-800/50 rounded px-2 py-1">
                      <span>{'\u{1F514}'}</span>
                      <span>{nextPerk}</span>
                    </div>
                  )}

                  {/* Upgrade cost block hint */}
                  {blockHint && worker.isHired && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                      <span>{'\u{1F4B0}'}</span>
                      <span>{blockHint}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {!worker.isHired && isUnlocked && (
                      <button
                        onClick={() => hireUnifiedWorker(role)}
                        disabled={coins < cfg.baseCost}
                        className="px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                      >
                        Hire {'\u{1F4B0}'}{cfg.baseCost.toLocaleString()}
                      </button>
                    )}
                    {worker.isHired && canUpgrade && upgradeResult && (
                      <>
                        <button
                          onClick={() => bulkUpgradeUnifiedWorker(role, bulkMode)}
                          disabled={!canAfford}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                        >
                          {bulkMode === 'x1' ? `+1 Lv` : bulkMode === 'x10' ? `+${upgradeResult.levelsToBuy} Lv` : `MAX +${upgradeResult.levelsToBuy}`}
                          {' '}({'\u{1F4B0}'}{upgradeResult.totalCost.toLocaleString()})
                        </button>
                      </>
                    )}
                    {worker.isHired && (
                      <OverclockActionMenu
                        entityId={`worker_${role}`}
                        entityType="worker"
                        name={cfg.name}
                        compact={true}
                      />
                    )}
                    {worker.isHired && worker.level >= WORKER_MAX_LEVEL && (
                      <span className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400">{'\u{1F52E}'} MAX LEVEL</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
