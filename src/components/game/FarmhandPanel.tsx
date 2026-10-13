'use client';

import { useGameStore } from '@/game/store';
import { FARMHANDS, OUTFITS, WATER_ZONES, ROD_TIERS, type FarmhandRole, type OutfitId } from '@/game/data';

const ROLE_LIST: FarmhandRole[] = ['farmer', 'herder', 'lumberjack', 'fisherman', 'artisan'];

export function FarmhandPanel() {
  const { farmhands, coins, fishery, buyFarmhand, equipOutfit } = useGameStore();

  const fishermanCount = farmhands.filter(f => f.role === 'fisherman').length;
  const rod = ROD_TIERS[fishery.rodTier];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          {'\u{1F477}'} Farmhands
        </h3>
        <span className="text-xs text-stone-500 dark:text-gray-400">{farmhands.length} hired</span>
      </div>

      {/* Fisherman Status Bar (only when fishermen are hired) */}
      {fishermanCount > 0 && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{'\u{1F3A3}'}</span>
              <div>
                <div className="text-sm font-semibold text-sky-800 dark:text-sky-300">
                  {fishermanCount} Fisherman{fishermanCount > 1 ? 's' : ''} active
                </div>
                <div className="text-xs text-sky-600 dark:text-sky-400">
                  Fishing in {fishery.unlockedZones.length} zone{fishery.unlockedZones.length > 1 ? 's' : ''} with {rod.name}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recruitable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ROLE_LIST.map(role => {
          const def = FARMHANDS[role];
          const hired = farmhands.filter(f => f.role === role);
          const compatibleOutfits = (Object.values(OUTFITS) as { id: OutfitId; compatibleRole: FarmhandRole; name: string; buff: string }[]).filter(o => o.compatibleRole === role);

          return (
            <div key={role} className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 p-3">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{def.emoji}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-stone-800 dark:text-gray-200">{def.name}</h4>
                  <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">{def.description}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    {'\u2728'} {def.perk}
                  </p>

                  {/* Hired instances with outfit info */}
                  {hired.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {hired.map(fh => (
                        <div key={fh.id} className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full text-xs text-emerald-700 dark:text-emerald-300">
                            Lv.{fh.level}
                            {fh.equippedOutfit && (
                              <span className="text-[9px]">{'\u{1F9E5}'}</span>
                            )}
                          </span>
                          {/* Outfit equip/unequip */}
                          {compatibleOutfits.length > 0 && (
                            <div className="flex gap-1">
                              {fh.equippedOutfit ? (
                                <button
                                  onClick={() => equipOutfit(fh.id, null)}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                                >
                                  Unequip
                                </button>
                              ) : (
                                compatibleOutfits.map(outfit => (
                                  <button
                                    key={outfit.id}
                                    onClick={() => equipOutfit(fh.id, outfit.id)}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                                  >
                                    {outfit.name}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => buyFarmhand(role)}
                    disabled={coins < 100}
                    className="mt-2 px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                  >
                    Recruit {'\u{1F4B0}'}100
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
