'use client';

import { useGameStore } from '@/game/store';
import { ANIMALS, FISH_SPECIES, TIER_COLORS, TIER_LABELS, type AnimalSpecies, type Tier } from '@/game/data';

const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
const TIERS: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];

export function CodexPanel() {
  const { codex, animals, fishery } = useGameStore();

  // Count total discoveries
  const animalDiscoveries = Object.keys(codex).filter(k => !k.startsWith('fish_')).length;
  const fishDiscoveries = Object.keys(fishery.fishCodex).length;
  const totalAnimalSlots = SPECIES_LIST.length * TIERS.length;
  const totalFishSlots = Object.keys(FISH_SPECIES).length;

  return (
    <div className="space-y-4">
      {/* Animal Codex */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
            {'\u{1F4D6}'} Breeding Codex
          </h3>
          <span className="text-xs text-stone-500 dark:text-gray-400">
            {animalDiscoveries}/{totalAnimalSlots} animals {'\u2022'} {fishDiscoveries}/{totalFishSlots} fish
          </span>
        </div>

        <div className="space-y-4">
          {SPECIES_LIST.map(species => {
            const def = ANIMALS[species];
            const owned = animals.filter(a => a.species === species);

            return (
              <div key={species} className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 px-4 py-2.5 border-b border-stone-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{def.emoji}</span>
                    <h4 className="font-semibold text-sm text-violet-900 dark:text-violet-200">{def.name} Family</h4>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 p-3">
                  {TIERS.map(tier => {
                    const key = `${species}_${tier}`;
                    const discovered = codex[key];
                    const ownedTier = owned.filter(a => a.tier === tier).length;

                    return (
                      <div
                        key={tier}
                        className="rounded-lg border-2 p-2 text-center transition-all"
                        style={{
                          borderColor: discovered ? TIER_COLORS[tier] : '#e5e7eb',
                          backgroundColor: discovered ? `${TIER_COLORS[tier]}15` : 'transparent',
                        }}
                      >
                        {discovered ? (
                          <>
                            <div className="text-2xl mb-1">{def.emoji}</div>
                            <div className="text-[10px] font-bold" style={{ color: TIER_COLORS[tier] }}>
                              {TIER_LABELS[tier]}
                            </div>
                            {ownedTier > 0 && (
                              <div className="text-[10px] text-stone-500 dark:text-gray-400 mt-0.5">
                                Owned: {ownedTier}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="text-2xl mb-1 opacity-20 grayscale">{'\u2753'}</div>
                            <div className="text-[10px] text-stone-400 dark:text-gray-500">
                              {TIER_LABELS[tier]}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fish Codex */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
          {'\u{1F41F}'} Aquatic Codex
        </h3>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-3">
            {Object.values(FISH_SPECIES).map(sp => {
              const codexKey = `fish_${sp.id}`;
              const discovered = fishery.fishCodex[codexKey] || codex[codexKey];

              return (
                <div
                  key={sp.id}
                  className="rounded-lg border-2 p-1.5 text-center transition-all"
                  style={{
                    borderColor: discovered ? TIER_COLORS[sp.tier] : '#e5e7eb',
                    backgroundColor: discovered ? `${TIER_COLORS[sp.tier]}15` : 'transparent',
                  }}
                >
                  {discovered ? (
                    <>
                      <div className="text-lg mb-0.5">{sp.emoji}</div>
                      <div className="text-[9px] font-bold" style={{ color: TIER_COLORS[sp.tier] }}>
                        {sp.name}
                      </div>
                      <div className="text-[8px] text-stone-500 dark:text-gray-400">
                        {TIER_LABELS[sp.tier]}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg mb-0.5 opacity-20 grayscale">{'\u2753'}</div>
                      <div className="text-[9px] text-stone-400 dark:text-gray-500">
                        {TIER_LABELS[sp.tier]}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
