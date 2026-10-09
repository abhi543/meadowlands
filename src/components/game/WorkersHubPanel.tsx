'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  WORKER_REGISTRY, WORKER_DIVISIONS, WORKER_MAX_LEVEL,
  workerUpgradeCost, workerEffectiveInterval, workerDoubleProcChance,
  workerTripleProcUnlocked, workerGemProcUnlocked, workerAutoSellPayout,
  workerSpeedMultiplier, workerHopperBuffer,
  calculateBulkUpgrade, getMilestoneRank,
  type WorkerRole, type WorkerDivision, type BulkMode,
} from '@/game/data';

export function WorkersHubPanel() {
  const { unifiedWorkers, coins, level, hireUnifiedWorker, bulkUpgradeUnifiedWorker, toggleUnifiedWorkerMode } = useGameStore();
  const [activeDivision, setActiveDivision] = useState<WorkerDivision>('farmhand');
  const [bulkMode, setBulkMode] = useState<BulkMode>('x1');
  const now = Date.now();

  const division = WORKER_DIVISIONS[activeDivision];
  const hiredCount = Object.values(unifiedWorkers).filter(w => w.isHired).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          {'\u{1F477}'} Workers & Guilds
        </h3>
        <span className="text-xs text-stone-500 dark:text-gray-400">{hiredCount}/13 hired</span>
      </div>

      {/* Division Tabs */}
      <div className="flex gap-1 bg-stone-100 dark:bg-gray-800 rounded-lg p-1">
        {(Object.entries(WORKER_DIVISIONS) as [WorkerDivision, typeof division][]).map(([divId, div]) => {
          const isActive = activeDivision === divId;
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
              {div.emoji} {div.label}
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
      <div className="space-y-2.5">
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
          const canAfford = upgradeResult && upgradeResult.levelsToBuy > 0;
          const speedPct = Math.round((1 - workerSpeedMultiplier(worker.level)) * 100);
          const payout = workerAutoSellPayout(role, worker.level);
          const hopper = workerHopperBuffer(worker.level);

          return (
            <div
              key={role}
              className={`rounded-xl border p-3 transition-all ${
                worker.isHired
                  ? `${rank.bgColor} ${rank.borderColor}`
                  : 'bg-white dark:bg-gray-900 border-stone-200 dark:border-gray-700'
              } ${!isUnlocked ? 'opacity-50' : ''}`}
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

                  {/* Lifetime Stats */}
                  {worker.isHired && (
                    <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-stone-400 dark:text-gray-500">
                      <span>{'\u{1F4B0}'} {worker.stats.totalCoinsEarned.toLocaleString()}</span>
                      <span>{'\u{1F4E6}'} {worker.stats.totalItemsProduced.toLocaleString()}</span>
                      {worker.stats.totalGemsEarned > 0 && <span>{'\u{1F48E}'} {worker.stats.totalGemsEarned}</span>}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-2 flex items-center gap-2">
                    {!worker.isHired && isUnlocked && (
                      <button
                        onClick={() => hireUnifiedWorker(role)}
                        disabled={coins < cfg.baseCost}
                        className="px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                      >
                        Hire {'\u{1F4B0}'}{cfg.baseCost.toLocaleString()}
                      </button>
                    )}
                    {!worker.isHired && !isUnlocked && (
                      <span className="text-[10px] text-stone-400 dark:text-gray-500 italic">
                        Unlocks at Level {cfg.unlockLevel}
                      </span>
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
                    {worker.isHired && worker.level >= WORKER_MAX_LEVEL && (
                      <span className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400">MAX LEVEL</span>
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
