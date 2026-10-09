'use client';

import { useGameStore } from '@/game/store';
import { WORKERS, OUTFITS, FARMHANDS, type WorkerType, type OutfitId, type FarmhandRole } from '@/game/data';

const WORKER_TYPES: WorkerType[] = ['fisherman', 'beekeeper', 'forager', 'merchant', 'prospector'];

export function AutonomousWorkerPanel() {
  const { autonomousWorkers, coins, gems, farmhands, hireAutonomousWorker, toggleWorkerAutoSell, upgradeWorkerGear, equipOutfit } = useGameStore();
  const now = Date.now();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          {'\u{1F477}'} Workers
        </h3>
        <span className="text-xs text-stone-500 dark:text-gray-400">{autonomousWorkers.length} hired</span>
      </div>

      {/* Fisherman Slicker Outfit Bonus */}
      {farmhands.some(fh => fh.role === 'fisherman') && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-xs">
          <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">{'\u{1F9E5}'} Outfit Bonuses</div>
          {farmhands.filter(fh => fh.role === 'fisherman').map(fh => (
            <div key={fh.id} className="flex items-center justify-between py-0.5">
              <span className="text-emerald-600 dark:text-emerald-400">
                {'\u{1F3A3}'} Fisherman {fh.equippedOutfit ? '(equipped)' : ''}
              </span>
              {fh.equippedOutfit ? (
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  {OUTFITS[fh.equippedOutfit].buff}
                </span>
              ) : (
                <button
                  onClick={() => equipOutfit(fh.id, 'fisherman_slicker')}
                  className="px-2 py-0.5 text-[10px] rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Equip Slicker
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Worker Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {WORKER_TYPES.map(type => {
          const def = WORKERS[type];
          const myWorkers = autonomousWorkers.filter(w => w.type === type);

          return (
            <div key={type} className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 p-3">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{def.emoji}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-stone-800 dark:text-gray-200">{def.name}</h4>
                  <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">{def.description}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Produces every {Math.round(def.baseIntervalMs / 1000)}s
                    {def.produces && `: ${def.producesEmoji} ${def.produces}`}
                  </p>

                  {/* Hired workers */}
                  {myWorkers.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {myWorkers.map(worker => {
                        const gear = def.gearTiers[worker.gearTier - 1] || def.gearTiers[0];
                        const nextGear = worker.gearTier < def.gearTiers.length ? def.gearTiers[worker.gearTier] : null;
                        const interval = def.baseIntervalMs * gear.speedMultiplier;
                        const elapsed = now - worker.lastProduceTime;
                        const progress = Math.min(1, elapsed / interval);

                        return (
                          <div key={worker.id} className="bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2 border border-stone-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs font-medium text-stone-700 dark:text-gray-300">
                                {gear.name} (Tier {worker.gearTier})
                              </div>
                              <div className="flex gap-1">
                                {type === 'merchant' && (
                                  <button
                                    onClick={() => toggleWorkerAutoSell(worker.id)}
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                      worker.autoSell
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                                    }`}
                                  >
                                    Auto-sell {worker.autoSell ? 'ON' : 'OFF'}
                                  </button>
                                )}
                                {nextGear && (
                                  <button
                                    onClick={() => upgradeWorkerGear(worker.id)}
                                    disabled={coins < nextGear.costCoins || gems < nextGear.costGems}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium"
                                  >
                                    {'\u2B06'} {nextGear.name}
                                  </button>
                                )}
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${progress * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => hireAutonomousWorker(type)}
                    disabled={coins < 200}
                    className="mt-2 px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                  >
                    Hire {'\u{1F4B0}'}200
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
