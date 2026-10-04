'use client';

import { useGameStore } from '@/game/store';
import { FARMHANDS, type FarmhandRole } from '@/game/data';

const ROLE_LIST: FarmhandRole[] = ['lumberjack', 'fisherman', 'farmer', 'artisan'];

export function FarmhandPanel() {
  const { farmhands, coins, buyFarmhand } = useGameStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          👷 Farmhands
        </h3>
        <span className="text-xs text-stone-500 dark:text-gray-400">{farmhands.length} hired</span>
      </div>

      {/* Recruitable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ROLE_LIST.map(role => {
          const def = FARMHANDS[role];
          const hired = farmhands.filter(f => f.role === role);
          return (
            <div key={role} className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 p-3">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{def.emoji}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-stone-800 dark:text-gray-200">{def.name}</h4>
                  <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">{def.description}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    ✨ {def.perk}
                  </p>

                  {/* Hired instances */}
                  {hired.length > 0 && (
                    <div className="mt-2 flex gap-1.5">
                      {hired.map(fh => (
                        <span key={fh.id} className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full text-xs text-emerald-700 dark:text-emerald-300">
                          Lv.{fh.level}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => buyFarmhand(role)}
                    disabled={coins < 100}
                    className="mt-2 px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                  >
                    Recruit 💰100
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
