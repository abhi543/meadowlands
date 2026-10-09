'use client';

import { useGameStore } from '@/game/store';
import { ANIMALS, FISH_SPECIES, TIER_COLORS, TIER_LABELS, BREED_REGISTRY, BREED_DISCOVERY_HINTS, type AnimalSpecies, type Tier } from '@/game/data';

const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
const TIERS: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];
const SPECIES_TAB_NAMES: Record<AnimalSpecies, string> = {
  chicken: 'Poultry',
  cow: 'Bovine',
  sheep: 'Ovine',
  pig: 'Porcine',
};

export function CodexPanel() {
  const { codex, animals, fishery, gems } = useGameStore();

  // Count total discoveries (breed-specific keys)
  const animalDiscoveries = Object.keys(codex).filter(k => !k.startsWith('fish_') && BREED_REGISTRY[k]).length;
  const fishDiscoveries = Object.keys(fishery.fishCodex).length;
  const totalAnimalSlots = Object.keys(BREED_REGISTRY).length; // 16 breeds
  const totalFishSlots = Object.keys(FISH_SPECIES).length;

  // Calculate total gem bounties earned from discovered breeds
  const totalGemBounties = Object.keys(codex)
    .filter(k => BREED_REGISTRY[k])
    .reduce((sum, k) => sum + (BREED_REGISTRY[k]?.codexGemReward || 0), 0);

  return (
    <div className="space-y-4">
      {/* Animal Codex */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
            {'📖'} Breeding Codex
          </h3>
          <span className="text-xs text-stone-500 dark:text-gray-400">
            {animalDiscoveries}/{totalAnimalSlots} breeds • {fishDiscoveries}/{totalFishSlots} fish
          </span>
        </div>

        {totalGemBounties > 0 && (
          <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            {'💎'} {totalGemBounties} gems earned from breed discoveries
          </div>
        )}

        <div className="space-y-4">
          {SPECIES_LIST.map(species => {
            const def = ANIMALS[species];
            const owned = animals.filter(a => a.species === species);

            return (
              <div key={species} className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 px-4 py-2.5 border-b border-stone-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{def.emoji}</span>
                      <div>
                        <h4 className="font-semibold text-sm text-violet-900 dark:text-violet-200">{SPECIES_TAB_NAMES[species]} Family</h4>
                        <p className="text-xs text-violet-700 dark:text-violet-400">{owned.length} owned</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-violet-500 dark:text-violet-400">
                      {TIERS.filter(t => codex[`${species}_${t}`]).length}/4 discovered
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 p-3">
                  {TIERS.map(tier => {
                    const breedId = `${species}_${tier}`;
                    const breedDef = BREED_REGISTRY[breedId];
                    const discovered = codex[breedId];
                    const ownedTier = owned.filter(a => a.tier === tier).length;
                    const discoveryHint = BREED_DISCOVERY_HINTS[breedId];

                    return (
                      <div
                        key={tier}
                        className={`rounded-lg border-2 p-2 text-center transition-all ${
                          discovered
                            ? tier === 'legendary'
                              ? 'shadow-amber-500/20'
                              : tier === 'rare'
                              ? 'shadow-sky-500/10'
                              : ''
                            : ''
                        }`}
                        style={{
                          borderColor: discovered ? TIER_COLORS[tier] : '#374151',
                          backgroundColor: discovered ? `${TIER_COLORS[tier]}15` : 'rgba(0,0,0,0.3)',
                        }}
                      >
                        {discovered && breedDef ? (
                          <>
                            <div className="text-2xl mb-1">
                              {tier === 'legendary' ? '✨' : ''}{def.emoji}
                            </div>
                            <div className="text-[10px] font-bold leading-tight" style={{ color: TIER_COLORS[tier] }}>
                              {TIER_LABELS[tier]}
                            </div>
                            <div className="text-[9px] font-medium text-stone-700 dark:text-stone-300 mt-0.5 leading-tight">
                              {breedDef.name}
                            </div>
                            <div className="text-[8px] text-stone-500 dark:text-stone-400 mt-0.5 italic">
                              {breedDef.visualTheme}
                            </div>
                            {ownedTier > 0 && (
                              <div className="text-[9px] text-stone-500 dark:text-gray-400 mt-0.5">
                                Owned: {ownedTier}
                              </div>
                            )}
                            {breedDef.codexGemReward > 0 && (
                              <div className="text-[8px] text-amber-500 dark:text-amber-400 mt-0.5">
                                💎 {breedDef.codexGemReward}
                              </div>
                            )}
                            <div className="text-[8px] text-green-500 dark:text-green-400 mt-0.5">✓ Discovered</div>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl mb-1 opacity-20 grayscale">🔒</div>
                            <div className="text-[10px] font-bold" style={{ color: TIER_COLORS[tier], opacity: 0.5 }}>
                              {TIER_LABELS[tier]}
                            </div>
                            <div className="text-[8px] text-stone-500 dark:text-stone-400 mt-1 italic leading-tight">
                              {discoveryHint || 'Unknown breed'}
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
          {'🐟'} Aquatic Codex
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
                      <div className="text-lg mb-0.5 opacity-20 grayscale">❓</div>
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
