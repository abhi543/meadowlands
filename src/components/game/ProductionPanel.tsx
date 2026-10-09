'use client';

import { useGameStore } from '@/game/store';
import { BUILDINGS, PRODUCTS, CROPS, type BuildingId, type RecipeDef } from '@/game/data';
import { useState } from 'react';

const BUILDING_LIST: BuildingId[] = ['feed_mill', 'bakery', 'dairy', 'loom', 'press', 'textiles', 'tailor_shop'];

const BUILDING_THEME: Record<BuildingId, {
  emoji: string; color: string; bgActive: string; borderActive: string;
  headerFrom: string; headerTo: string; headerText: string; headerSub: string;
  progressColor: string; craftBtn: string; craftBtnHover: string;
}> = {
  feed_mill: { emoji: '\u2699\uFE0F', color: 'text-slate-600 dark:text-slate-300', bgActive: 'bg-slate-500 dark:bg-slate-600', borderActive: 'border-slate-600', headerFrom: 'from-slate-100', headerTo: 'to-gray-100', headerText: 'text-slate-900 dark:text-slate-100', headerSub: 'text-slate-700 dark:text-slate-300', progressColor: 'bg-slate-400 dark:bg-slate-500', craftBtn: 'bg-slate-500 hover:bg-slate-600', craftBtnHover: 'bg-slate-600 hover:bg-slate-700' },
  bakery: { emoji: '\u{1F3ED}', color: 'text-orange-600 dark:text-orange-300', bgActive: 'bg-orange-500 dark:bg-orange-600', borderActive: 'border-orange-600', headerFrom: 'from-orange-100', headerTo: 'to-amber-100', headerText: 'text-orange-900 dark:text-orange-100', headerSub: 'text-orange-700 dark:text-orange-300', progressColor: 'bg-orange-400 dark:bg-orange-500', craftBtn: 'bg-orange-500 hover:bg-orange-600', craftBtnHover: 'bg-orange-600 hover:bg-orange-700' },
  dairy: { emoji: '\u{1F9C0}', color: 'text-yellow-600 dark:text-yellow-300', bgActive: 'bg-yellow-500 dark:bg-yellow-600', borderActive: 'border-yellow-600', headerFrom: 'from-yellow-100', headerTo: 'to-amber-50', headerText: 'text-yellow-900 dark:text-yellow-100', headerSub: 'text-yellow-700 dark:text-yellow-300', progressColor: 'bg-yellow-400 dark:bg-yellow-500', craftBtn: 'bg-yellow-500 hover:bg-yellow-600', craftBtnHover: 'bg-yellow-600 hover:bg-yellow-700' },
  loom: { emoji: '\u{1F9F5}', color: 'text-purple-600 dark:text-purple-300', bgActive: 'bg-purple-500 dark:bg-purple-600', borderActive: 'border-purple-600', headerFrom: 'from-purple-100', headerTo: 'to-violet-100', headerText: 'text-purple-900 dark:text-purple-100', headerSub: 'text-purple-700 dark:text-purple-300', progressColor: 'bg-purple-400 dark:bg-purple-500', craftBtn: 'bg-purple-500 hover:bg-purple-600', craftBtnHover: 'bg-purple-600 hover:bg-purple-700' },
  press: { emoji: '\u{1FAD2}', color: 'text-emerald-600 dark:text-emerald-300', bgActive: 'bg-emerald-500 dark:bg-emerald-600', borderActive: 'border-emerald-600', headerFrom: 'from-emerald-100', headerTo: 'to-green-50', headerText: 'text-emerald-900 dark:text-emerald-100', headerSub: 'text-emerald-700 dark:text-emerald-300', progressColor: 'bg-emerald-400 dark:bg-emerald-500', craftBtn: 'bg-emerald-500 hover:bg-emerald-600', craftBtnHover: 'bg-emerald-600 hover:bg-emerald-700' },
  textiles: { emoji: '\u{1F33F}', color: 'text-teal-600 dark:text-teal-300', bgActive: 'bg-teal-500 dark:bg-teal-600', borderActive: 'border-teal-600', headerFrom: 'from-teal-100', headerTo: 'to-cyan-50', headerText: 'text-teal-900 dark:text-teal-100', headerSub: 'text-teal-700 dark:text-teal-300', progressColor: 'bg-teal-400 dark:bg-teal-500', craftBtn: 'bg-teal-500 hover:bg-teal-600', craftBtnHover: 'bg-teal-600 hover:bg-teal-700' },
  tailor_shop: { emoji: '\u{1F9E5}', color: 'text-rose-600 dark:text-rose-300', bgActive: 'bg-rose-500 dark:bg-rose-600', borderActive: 'border-rose-600', headerFrom: 'from-rose-100', headerTo: 'to-pink-50', headerText: 'text-rose-900 dark:text-rose-100', headerSub: 'text-rose-700 dark:text-rose-300', progressColor: 'bg-rose-400 dark:bg-rose-500', craftBtn: 'bg-rose-500 hover:bg-rose-600', craftBtnHover: 'bg-rose-600 hover:bg-rose-700' },
};

function getIngredientSourceHint(itemId: string): string {
  if (itemId in CROPS) return `Grow ${CROPS[itemId as keyof typeof CROPS].name} on Farm`;
  if (itemId === 'egg') return 'Collect from Chickens';
  if (itemId === 'egg_blue') return 'Pasture Araucana (Uncommon Chicken)';
  if (itemId === 'egg_obsidian') return 'Midnight Silkie (Rare Chicken)';
  if (itemId === 'egg_golden') return 'Solar Phoenix Hen (Legendary)';
  if (itemId === 'milk') return 'Collect from Cows';
  if (itemId === 'milk_rich_cream') return 'Jersey Buttercup (Uncommon Cow)';
  if (itemId === 'milk_alpine') return 'Highland Shaggy Yak (Rare Cow)';
  if (itemId === 'milk_starlight') return 'Celestial Star-Bovine (Legendary)';
  if (itemId === 'wool') return 'Collect from Sheep';
  if (itemId === 'wool_patterned') return 'Jacob Four-Horn (Uncommon Sheep)';
  if (itemId === 'wool_merino') return 'Merino Cloud Sheep (Rare Sheep)';
  if (itemId === 'wool_gilded') return 'Golden Fleece Ram (Legendary)';
  if (itemId === 'truffle') return 'Collect from Pigs';
  if (itemId === 'truffle_white') return 'Berkshire Black (Uncommon Pig)';
  if (itemId === 'truffle_alba') return 'Iberian Bristle Boar (Rare Pig)';
  if (itemId === 'truffle_diamond') return 'Gilded Snout Chimera (Legendary)';
  // Breed bonus drops
  if (itemId === 'soft_down_feather') return 'Proc: Pasture Araucana (10% chance)';
  if (itemId === 'glossy_quill') return 'Proc: Midnight Silkie (20% chance)';
  if (itemId === 'churned_butter') return 'Proc: Jersey Buttercup (15% chance)';
  if (itemId === 'yak_wool') return 'Proc: Highland Shaggy Yak (25% chance)';
  if (itemId === 'horn_shavings') return 'Proc: Jacob Four-Horn (15% chance)';
  if (itemId === 'lanolin_balm') return 'Proc: Merino Cloud Sheep (25% chance)';
  if (itemId === 'ancient_coin') return 'Proc: Berkshire Black (15% chance)';
  if (itemId === 'foraged_nut') return 'Proc: Iberian Bristle Boar (25% chance)';
  if (itemId === 'ancient_hoard') return 'Proc: Gilded Snout Chimera (100%)';
  if (itemId === 'fish') return 'Catch at Fishery or use Auto-Fisher';
  if (itemId === 'feed') return 'Craft at Feed Mill';
  if (itemId === 'bread') return 'Bake at Bakery';
  if (itemId === 'cheese') return 'Craft at Dairy';
  if (itemId === 'fabric') return 'Weave at Loom';
  if (itemId === 'yarn') return 'Spin at Loom';
  if (itemId === 'truffle_oil') return 'Press at Press';
  if (itemId === 'honey') return 'Collect from Beekeeper';
  if (itemId === 'honey_comb') return 'Beekeeper (Hoard mode)';
  if (itemId === 'wild_berries') return 'Forager (Hoard mode) or grow';
  if (itemId === 'gold_nugget') return 'Prospector (Hoard mode)';
  if (itemId === 'cotton') return 'Grow Cotton on Farm';
  if (itemId === 'silk') return 'Weave at Textiles';
  if (itemId === 'sweater') return 'Craft at Tailor Shop';
  if (itemId === 'pie') return 'Bake at Bakery';
  // Territory-locked items
  if (itemId === 'iron_ore' || itemId === 'gold_ore') return 'Mine at Quarry Ridge (Parcel required)';
  if (itemId === 'apple' || itemId === 'cherry') return 'Grow in Sunken Grove Orchard (Parcel required)';
  if (itemId === 'smoked_trout') return 'Fish at Riverfront Estuary (Parcel required)';
  if (itemId === 'fine_sail') return 'Weave at Guild Loom in Highland Meadow (Parcel required)';
  return 'Produce or gather';
}

function getItemEmoji(itemId: string): string {
  if (itemId in CROPS) return CROPS[itemId as keyof typeof CROPS].emoji;
  if (itemId in PRODUCTS) return PRODUCTS[itemId as keyof typeof PRODUCTS].emoji;
  return '\u{1F4E6}';
}

function getItemName(itemId: string): string {
  if (itemId in CROPS) return CROPS[itemId as keyof typeof CROPS].name;
  if (itemId in PRODUCTS) return PRODUCTS[itemId as keyof typeof PRODUCTS].name;
  if (itemId === 'feed') return 'Feed';
  return itemId;
}

function canCraftRecipe(recipe: RecipeDef, silo: Record<string, number>, barn: Record<string, number>): boolean {
  for (const input of recipe.inputs) {
    const isCrop = input.productId in CROPS || input.productId === 'feed' || input.productId === 'cotton' || input.productId === 'honey_comb' || input.productId === 'wild_berries' || input.productId === 'gold_nugget';
    const storage = isCrop ? silo : barn;
    if ((storage[input.productId] || 0) < input.qty) return false;
  }
  return true;
}

function calcMaxCraftable(recipe: RecipeDef, silo: Record<string, number>, barn: Record<string, number>): number {
  let max = Infinity;
  for (const input of recipe.inputs) {
    const isCrop = input.productId in CROPS || input.productId === 'feed' || input.productId === 'cotton' || input.productId === 'honey_comb' || input.productId === 'wild_berries' || input.productId === 'gold_nugget';
    const storage = isCrop ? silo : barn;
    const available = storage[input.productId] || 0;
    max = Math.min(max, Math.floor(available / input.qty));
  }
  return max === Infinity ? 0 : max;
}

export function ProductionPanel() {
  const { productionQueues, silo, barn, level, startProduction, collectProduction, startProductionAll, collectProductionAll } = useGameStore();
  const [activeBuilding, setActiveBuilding] = useState<BuildingId>('feed_mill');

  const building = BUILDINGS[activeBuilding];
  const queue = productionQueues[activeBuilding] || [];
  const isLocked = building.unlockLevel ? level < building.unlockLevel : false;
  const doneCount = queue.filter(s => s.done).length;
  const activeCount = queue.filter(s => !s.done).length;
  const theme = BUILDING_THEME[activeBuilding];
  const freeSlots = building.queueSlots - activeCount;

  return (
    <div className="space-y-3">
      {/* Building Tabs */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        {BUILDING_LIST.map(bId => {
          const b = BUILDINGS[bId];
          const t = BUILDING_THEME[bId];
          const q = productionQueues[bId] || [];
          const slots = q.filter(s => !s.done).length;
          const done = q.filter(s => s.done).length;
          const locked = b.unlockLevel ? level < b.unlockLevel : false;
          const isActive = activeBuilding === bId;
          return (
            <button
              key={bId}
              onClick={() => setActiveBuilding(bId)}
              className={`py-2 px-1.5 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 border-2 ${
                isActive
                  ? `${t.bgActive} text-white ${t.borderActive} shadow-lg scale-105`
                  : `bg-white dark:bg-gray-800 ${t.color} border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600`
              } ${locked ? 'opacity-40' : ''}`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'text-2xl' : 'text-xl'}`}>{t.emoji}</span>
              <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{b.name}</span>
              {slots > 0 && <span className={`text-[9px] font-bold px-1.5 rounded-full ${isActive ? 'bg-white/30 text-white' : 'bg-orange-400 text-white'}`}>{slots}</span>}
              {done > 0 && !isActive && <span className="text-[9px] font-bold px-1.5 rounded-full bg-green-500 text-white animate-pulse">{done}{'\u2705'}</span>}
              {locked && <span className="text-[10px]">{'\u{1F512}'}</span>}
            </button>
          );
        })}
      </div>

      {/* Active Building Detail */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 overflow-hidden">
        <div className={`bg-gradient-to-r ${theme.headerFrom} dark:from-gray-800 ${theme.headerTo} dark:to-gray-800 px-4 py-3 border-b border-stone-200 dark:border-gray-700`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{theme.emoji}</span>
              <div>
                <h3 className={`font-bold text-lg ${theme.headerText}`}>{building.name}</h3>
                <p className={`text-xs ${theme.headerSub}`}>
                  {isLocked ? '\u{1F512} Unlock at Level ' + building.unlockLevel : `Queue: ${activeCount}/${building.queueSlots} slots`}
                </p>
              </div>
            </div>
            {!isLocked && doneCount > 0 && (
              <button onClick={() => collectProductionAll(activeBuilding)} className="px-4 py-2 text-sm font-bold rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all shadow-lg shadow-green-200/50 active:scale-95 flex items-center gap-1.5">
                <span>{'\u2705'}</span> Collect All <span className="bg-white/30 px-1.5 py-0.5 rounded-md text-xs font-bold">{doneCount}</span>
              </button>
            )}
          </div>
        </div>

        {isLocked ? (
          <div className="p-6 text-center space-y-2">
            <div className="text-3xl">{'\u{1F512}'}</div>
            <p className="text-sm text-stone-400 dark:text-gray-500 italic">Reach Level {building.unlockLevel} to unlock this building!</p>
            <p className="text-xs text-stone-400 dark:text-gray-500">Current level: {level} {'\u2014'} need {(building.unlockLevel || 0) - level} more</p>
          </div>
        ) : (
          <>
            {/* Queue Full Hint */}
            {freeSlots <= 0 && (
              <div className="mx-3 mt-3 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1.5">
                <span>{'\u{1F4E6}'}</span>
                <span className="font-medium">Queue full!</span>
                <span>Wait for items to finish or collect completed ones to free slots.</span>
              </div>
            )}

            {/* Recipes */}
            <div className="p-3 space-y-2">
              <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">Recipes</h4>
              {building.recipes.map(recipe => {
                const canCraft = canCraftRecipe(recipe, silo, barn);
                const maxCraftable = calcMaxCraftable(recipe, silo, barn);
                const canCraftAll = Math.min(maxCraftable, freeSlots);
                const queueFull = activeCount >= building.queueSlots;

                const missingIngredients: { name: string; emoji: string; have: number; need: number; source: string }[] = [];
                for (const inp of recipe.inputs) {
                  const isCrop = inp.productId in CROPS || inp.productId === 'feed' || inp.productId === 'cotton' || inp.productId === 'honey_comb' || inp.productId === 'wild_berries' || inp.productId === 'gold_nugget';
                  const storage = isCrop ? silo : barn;
                  const have = storage[inp.productId] || 0;
                  if (have < inp.qty) {
                    missingIngredients.push({ name: getItemName(inp.productId), emoji: getItemEmoji(inp.productId), have, need: inp.qty, source: getIngredientSourceHint(inp.productId) });
                  }
                }

                return (
                  <div key={recipe.id} className="bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2.5 border border-stone-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-stone-800 dark:text-gray-200">{recipe.emoji} {recipe.name}</div>
                        <div className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                          {recipe.inputs.map(inp => `${getItemEmoji(inp.productId)}${inp.qty}`).join(' + ')} {'\u2192'} {getItemEmoji(recipe.output.productId)}{recipe.output.qty}
                          <span className={`ml-2 ${theme.headerSub}`}>{'\u23F1'} {recipe.timeSec}s</span>
                        </div>
                        {maxCraftable > 0 && <div className="text-[10px] text-stone-400 dark:text-gray-500 mt-0.5">Can craft: {maxCraftable}x | Free slots: {freeSlots}</div>}
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        <button onClick={() => startProduction(activeBuilding, recipe)} disabled={!canCraft || queueFull} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${theme.craftBtn} disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors`}>Craft</button>
                        <button onClick={() => startProductionAll(activeBuilding, recipe)} disabled={canCraftAll <= 0} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${theme.craftBtnHover} disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors flex items-center gap-1`}>
                          <span>{'\u26A1'}</span> All {canCraftAll > 0 && <span className="bg-white/30 px-1 py-0.5 rounded text-[10px] font-bold">{canCraftAll}</span>}
                        </button>
                      </div>
                    </div>

                    {/* Missing ingredients hint */}
                    {missingIngredients.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {missingIngredients.map((m, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                            <span>{m.emoji}</span>
                            <span className="font-medium">{m.name}: {m.have}/{m.need}</span>
                            <span className="text-red-400 dark:text-red-500">{'\u2192'} {m.source}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Queue full but ingredients ready */}
                    {!canCraft && canCraftRecipe(recipe, silo, barn) && queueFull && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                        <span>{'\u{1F4E6}'}</span>
                        <span>Ingredients ready, but queue is full. Wait or collect finished items.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Production Queue */}
            {queue.length > 0 && (
              <div className="p-3 pt-0 space-y-2">
                <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider">In Progress ({activeCount} active, {doneCount} done)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {queue.map((slot, idx) => {
                    const progress = slot.done ? 1 : Math.min(1, (Date.now() - slot.startedAt) / (slot.durationSec * 1000));
                    const recipe = building.recipes.find(r => r.id === slot.recipeId);
                    const remainingSec = Math.round((1 - progress) * slot.durationSec);
                    return (
                      <div key={idx} className={`flex items-center gap-2 rounded-lg p-2 border ${slot.done ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-stone-50 dark:bg-stone-900/30 border-stone-100 dark:border-gray-800'}`}>
                        <span className="text-lg">{slot.recipeEmoji || recipe?.emoji || '\u2699\uFE0F'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-stone-700 dark:text-gray-300 truncate">{slot.recipeName || recipe?.name}</div>
                          <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${slot.done ? 'bg-green-500' : theme.progressColor}`} style={{ width: `${progress * 100}%` }} />
                          </div>
                          {!slot.done && remainingSec > 0 && <div className="text-[10px] text-stone-400 dark:text-gray-500 mt-0.5">{remainingSec}s remaining</div>}
                        </div>
                        {slot.done ? (
                          <button onClick={() => collectProduction(activeBuilding, idx)} className="px-2.5 py-1 text-xs font-bold rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors shrink-0">{'\u2705'}</button>
                        ) : (
                          <span className="text-[10px] text-stone-500 dark:text-gray-400 shrink-0">{remainingSec}s</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
