'use client';

import { useGameStore } from '@/game/store';
import { BUILDINGS, PRODUCTS, CROPS, type BuildingId, type RecipeDef } from '@/game/data';
import { useState } from 'react';

const BUILDING_LIST: BuildingId[] = ['feed_mill', 'bakery', 'dairy', 'loom', 'press', 'textiles', 'tailor_shop'];

export function ProductionPanel() {
  const { productionQueues, silo, barn, level, startProduction, collectProduction } = useGameStore();
  const [activeBuilding, setActiveBuilding] = useState<BuildingId>('feed_mill');

  const building = BUILDINGS[activeBuilding];
  const queue = productionQueues[activeBuilding] || [];
  const isLocked = building.unlockLevel ? level < building.unlockLevel : false;

  return (
    <div className="space-y-3">
      {/* Building Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {BUILDING_LIST.map(bId => {
          const b = BUILDINGS[bId];
          const q = productionQueues[bId] || [];
          const activeSlots = q.filter(s => !s.done).length;
          const locked = b.unlockLevel ? level < b.unlockLevel : false;
          return (
            <button
              key={bId}
              onClick={() => setActiveBuilding(bId)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                activeBuilding === bId
                  ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              } ${locked ? 'opacity-50' : ''}`}
            >
              {b.emoji} {b.name}
              {activeSlots > 0 && (
                <span className="ml-1 text-xs bg-orange-400 text-white px-1.5 rounded-full">{activeSlots}</span>
              )}
              {locked && <span className="ml-1 text-[10px]">{'\u{1F512}'}</span>}
            </button>
          );
        })}
      </div>

      {/* Active Building Detail */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 overflow-hidden">
        {/* Building Header */}
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 px-4 py-3 border-b border-stone-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{building.emoji}</span>
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-200">{building.name}</h3>
              <p className="text-xs text-orange-700 dark:text-orange-400">
                {isLocked
                  ? `Unlock at Level ${building.unlockLevel}`
                  : `Queue: ${queue.filter(s => !s.done).length}/${building.queueSlots} slots`
                }
              </p>
            </div>
          </div>
        </div>

        {isLocked ? (
          <div className="p-6 text-center text-sm text-stone-400 dark:text-gray-500 italic">
            Reach Level {building.unlockLevel} to unlock this building!
          </div>
        ) : (
          <>
            {/* Recipes */}
            <div className="p-3 space-y-2">
              <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">Recipes</h4>
              {building.recipes.map(recipe => {
                const canCraft = canCraftRecipe(recipe, silo, barn);
                return (
                  <div key={recipe.id} className="flex items-center justify-between bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2.5 border border-stone-100 dark:border-gray-800">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-stone-800 dark:text-gray-200">
                        {recipe.emoji} {recipe.name}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                        {recipe.inputs.map(inp => {
                          const emoji = getItemEmoji(inp.productId);
                          return `${emoji}${inp.qty}`;
                        }).join(' + ')} {'\u2192'} {getItemEmoji(recipe.output.productId)}{recipe.output.qty}
                        <span className="ml-2 text-orange-500 dark:text-orange-400">{'\u23F1'} {recipe.timeSec}s</span>
                      </div>
                    </div>
                    <button
                      onClick={() => startProduction(activeBuilding, recipe)}
                      disabled={!canCraft}
                      className="ml-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors shrink-0"
                    >
                      Craft
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Production Queue */}
            {queue.length > 0 && (
              <div className="p-3 pt-0 space-y-2">
                <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">In Progress</h4>
                {queue.map((slot, idx) => {
                  const progress = slot.done
                    ? 1
                    : Math.min(1, (Date.now() - slot.startedAt) / (slot.durationSec * 1000));
                  const recipe = building.recipes.find(r => r.id === slot.recipeId);

                  return (
                    <div key={idx} className="flex items-center gap-2 bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2 border border-stone-100 dark:border-gray-800">
                      <span className="text-lg">{slot.recipeEmoji || recipe?.emoji || '\u2699\uFE0F'}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-stone-700 dark:text-gray-300">{slot.recipeName || recipe?.name}</div>
                        <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              slot.done ? 'bg-green-500' : 'bg-orange-400 dark:bg-orange-500'
                            }`}
                            style={{ width: `${progress * 100}%` }}
                          />
                        </div>
                      </div>
                      {slot.done ? (
                        <button
                          onClick={() => collectProduction(activeBuilding, idx)}
                          className="px-2.5 py-1 text-xs font-bold rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors"
                        >
                          {'\u2705'} Collect
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-500 dark:text-gray-400 shrink-0">
                          {Math.round((1 - progress) * slot.durationSec)}s
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function canCraftRecipe(recipe: RecipeDef, silo: Record<string, number>, barn: Record<string, number>): boolean {
  for (const input of recipe.inputs) {
    const isCrop = input.productId in CROPS || input.productId === 'feed' || input.productId === 'cotton' || input.productId === 'honey_comb' || input.productId === 'wild_berries' || input.productId === 'gold_nugget';
    const storage = isCrop ? silo : barn;
    if ((storage[input.productId] || 0) < input.qty) return false;
  }
  return true;
}

function getItemEmoji(itemId: string): string {
  if (itemId in CROPS) return CROPS[itemId as keyof typeof CROPS].emoji;
  if (itemId in PRODUCTS) return PRODUCTS[itemId as keyof typeof PRODUCTS].emoji;
  return '\u{1F4E6}';
}
