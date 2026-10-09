'use client';

import { BUILDINGS, ANIMALS, CROPS, WORKERS, WATER_ZONES, ROD_TIERS, ROD_TIER_ORDER, PRODUCTS, BREED_REGISTRY, TIER_COLORS, TIER_LABELS, type AnimalSpecies, type Tier } from '@/game/data';
import { useState } from 'react';

type GuideTab = 'production' | 'animals' | 'workers' | 'fishery' | 'tips';

export function GuidePanel() {
  const [tab, setTab] = useState<GuideTab>('production');

  const tabs: { id: GuideTab; label: string; emoji: string }[] = [
    { id: 'production', label: 'Production', emoji: '\u2699\uFE0F' },
    { id: 'animals', label: 'Animals', emoji: '\u{1F414}' },
    { id: 'workers', label: 'Workers', emoji: '\u{1F477}' },
    { id: 'fishery', label: 'Fishery', emoji: '\u{1F3A3}' },
    { id: 'tips', label: 'Tips', emoji: '\u{1F4A1}' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
        {'\u{1F4D6}'} Guide
      </h3>

      {/* Tab selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
              tab === t.id
                ? 'bg-stone-700 text-white border-stone-800'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 p-3 text-sm text-stone-700 dark:text-gray-300 space-y-3">
        {tab === 'production' && <ProductionGuide />}
        {tab === 'animals' && <AnimalGuide />}
        {tab === 'workers' && <WorkerGuide />}
        {tab === 'fishery' && <FisheryGuide />}
        {tab === 'tips' && <TipsGuide />}
      </div>
    </div>
  );
}

function ProductionGuide() {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-stone-800 dark:text-gray-200">Production Chains</h4>
      {Object.values(BUILDINGS).map(building => (
        <div key={building.id} className="border-b border-stone-100 dark:border-gray-800 pb-2 last:border-0">
          <div className="flex items-center gap-2 mb-1">
            <span>{building.emoji}</span>
            <span className="font-medium text-stone-800 dark:text-gray-200">{building.name}</span>
            {building.unlockLevel && (
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                Lv.{building.unlockLevel}
              </span>
            )}
          </div>
          {building.recipes.map(recipe => (
            <div key={recipe.id} className="text-xs text-stone-500 dark:text-gray-400 ml-6 mb-0.5">
              {recipe.inputs.map(inp => {
                const emoji = getItemEmoji(inp.productId);
                return `${emoji}${inp.qty}`;
              }).join(' + ')} {'\u2192'} {getItemEmoji(recipe.output.productId)}{recipe.output.qty}
              <span className="ml-2 text-orange-500 dark:text-orange-400">{'\u23F1'} {recipe.timeSec}s</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Breed-specific product info for the guide */
const BREED_PRODUCT_INFO: Record<string, { name: string; emoji: string; desc: string; supplyChain: string }> = {
  // Chicken eggs
  egg:            { name: 'Egg',            emoji: '\u{1F95A}', desc: 'Basic egg from Common chickens. Used in Bakery recipes (Bread, Pie, Fish Pie).', supplyChain: 'Bakery: Egg + Wheat \u2192 Bread, Egg + Fish + Wheat \u2192 Savory Fish Pie' },
  egg_blue:       { name: 'Blue Egg',       emoji: '\u{1F95A}', desc: 'Uncommon egg from Blue Ameraucana. Sells for 8 coins. Can be used in some orders.', supplyChain: 'Sell directly or use in orders.' },
  egg_obsidian:   { name: 'Obsidian Egg',   emoji: '\u{1F95A}', desc: 'Rare egg from Obsidian Cochin. Sells for 15 coins. Higher value than regular eggs.', supplyChain: 'Sell directly for good coin income.' },
  egg_golden:     { name: 'Golden Egg',     emoji: '\u{1F95A}', desc: 'Legendary egg from Golden Leghorn. Sells for 30 coins. Can craft Golden Cake at Bakery!', supplyChain: 'Bakery: Golden Egg + Bread \u2192 Golden Cake (sell 120 coins!)' },
  // Cow milk
  milk:           { name: 'Milk',           emoji: '\u{1F95B}', desc: 'Basic milk from Common cows. Used in Dairy and Bakery recipes.', supplyChain: 'Dairy: 2 Milk \u2192 Cheese. Bakery: Fish + Milk \u2192 Crab Bisque' },
  milk_rich_cream:{ name: 'Rich Cream',     emoji: '\u{1F95B}', desc: 'Uncommon milk from Jersey Cream Cow. Sells for 14 coins. Churn into Rich Butter at Dairy!', supplyChain: 'Dairy: 2 Rich Cream \u2192 Rich Butter (sell 35 coins!)' },
  milk_alpine:    { name: 'Alpine Milk',    emoji: '\u{1F95B}', desc: 'Rare milk from Alpine Star Cow. Sells for 22 coins. Age into Alpine Cheese at Dairy!', supplyChain: 'Dairy: 2 Alpine Milk \u2192 Alpine Cheese (sell 60 coins!)' },
  milk_starlight: { name: 'Starlight Milk', emoji: '\u{1F95B}', desc: 'Legendary milk from Starlight Heifer. Sells for 45 coins. Highest value milk.', supplyChain: 'Sell directly for premium coin income.' },
  // Sheep wool
  wool:           { name: 'Wool',           emoji: '\u{1F9F6}', desc: 'Basic wool from Common Dorset sheep. Used in Loom and Tailor Shop recipes. This is the ONLY wool type that feeds standard recipes!', supplyChain: 'Loom: 3 Wool \u2192 Sweater, 1 Wool \u2192 2 Yarn. Tailor: Yarn + Wool \u2192 Quilted Blanket' },
  wool_patterned: { name: 'Patterned Wool', emoji: '\u{1F9F6}', desc: 'Uncommon wool from Jacob Four-Horn sheep. Sells for 18 coins. Spin into extra Yarn at Loom!', supplyChain: 'Loom: 1 Patterned Wool \u2192 3 Yarn (more efficient than regular wool for yarn!)' },
  wool_merino:    { name: 'Merino Wool',    emoji: '\u{1F9F6}', desc: 'Rare wool from Merino Cloud Sheep. Sells for 30 coins. Weave into Merino Sweater at Loom!', supplyChain: 'Loom: 2 Merino Wool \u2192 Merino Sweater (sell 90 coins!)' },
  wool_gilded:    { name: 'Gilded Wool',    emoji: '\u{1F9F6}', desc: 'Legendary wool from Golden Fleece Ram. Sells for 55 coins each! Weave into Golden Shawl at Loom for massive profit. Also drops gems every 3rd cycle!', supplyChain: 'Loom: 3 Gilded Wool \u2192 Golden Shawl (sell 180 coins!). Each 3rd cycle drops 1 gem.' },
  // Pig truffle
  truffle:        { name: 'Truffle',        emoji: '\u{1F344}', desc: 'Basic truffle from Common pigs. Used in Press recipes.', supplyChain: 'Press: 2 Truffle \u2192 Truffle Oil (sell 50 coins!)' },
  truffle_white:  { name: 'White Truffle',  emoji: '\u{1F344}', desc: 'Uncommon truffle from Berkshire Black pig. Sells for 25 coins. Bonus: 15% chance of Ancient Coin (+100 coins).', supplyChain: 'Sell directly or press into Truffle Oil like regular truffles.' },
  truffle_alba:   { name: 'Alba Truffle',   emoji: '\u{1F344}', desc: 'Rare truffle from Alba Ghost pig. Sells for 42 coins. Bonus: 25% chance of Truffle Oil.', supplyChain: 'Sell directly for strong income.' },
  truffle_diamond:{ name: 'Diamond Truffle',emoji: '\u{1F344}', desc: 'Legendary truffle from Diamond Forager pig. Sells for 80 coins! Drops gems every 2nd cycle.', supplyChain: 'Sell for 80 coins each, plus gem drops every 2nd cycle.' },
  // Bonus drops
  horn_shavings:  { name: 'Horn Shavings',  emoji: '\u{1F9F4}', desc: '15% bonus drop from Uncommon sheep. Sells for 12 coins.', supplyChain: 'Sell directly.' },
  lanolin_balm:   { name: 'Lanolin Balm',   emoji: '\u{1F9F4}', desc: '25% bonus drop from Rare sheep. Sells for 20 coins.', supplyChain: 'Sell directly.' },
  ancient_coin:   { name: 'Ancient Coin',   emoji: '\u{1FA99}', desc: '15% bonus drop from Uncommon pigs. Gives 100 direct coins!', supplyChain: 'Auto-converts to 100 coins on drop.' },
};

function AnimalGuide() {
  const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
  const TIERS: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];

  const SPECIES_EMOJI: Record<string, string> = {
    chicken: '\u{1F414}', cow: '\u{1F402}', sheep: '\u{1F411}', pig: '\u{1F416}',
  };

  const SPECIES_LABEL: Record<string, string> = {
    chicken: 'Poultry', cow: 'Bovine', sheep: 'Ovine', pig: 'Porcine',
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-stone-800 dark:text-gray-200">Animal Breeds &amp; Products</h4>
      <p className="text-xs text-stone-500 dark:text-gray-400">
        Each breed produces a <strong>unique product</strong>. Higher-tier breeds yield more valuable goods with bonus drops and gem milestones. Breed-specific products feed into special production recipes!
      </p>

      {/* Key info callout */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-2.5 text-xs text-amber-800 dark:text-amber-200">
        <div className="font-bold mb-1">{'\u{1F4A1}'} Key: Breed Products vs. Regular Products</div>
        <p className="mb-1">Common breeds produce the <strong>base product</strong> (Wool, Egg, Milk, Truffle) that feeds standard recipes. Higher-tier breeds produce <strong>breed-specific variants</strong> (Gilded Wool, Golden Egg, etc.) that either sell for more or craft into premium goods.</p>
        <p>If you only have legendary animals, you won&apos;t get regular products for standard recipes. Keep a few Common animals for base products, or rely on breed-specific recipes!</p>
      </div>

      {SPECIES_LIST.map(species => {
        const def = ANIMALS[species];
        return (
          <div key={species} className="bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{SPECIES_EMOJI[species]}</span>
              <div>
                <div className="font-medium text-stone-800 dark:text-gray-200 text-sm">{SPECIES_LABEL[species]} — {def.name}</div>
                <div className="text-xs text-stone-500 dark:text-gray-400">
                  {def.productEmoji} Base: {def.product} • {def.productionTimeSec}s/cycle • {def.feedPerCycle} feed/cycle • cap {def.capacity}
                </div>
              </div>
            </div>

            {/* Breed grid */}
            <div className="grid grid-cols-1 gap-1.5">
              {TIERS.map(tier => {
                const breedId = `${species}_${tier}`;
                const breed = BREED_REGISTRY[breedId];
                if (!breed) return null;
                const productInfo = BREED_PRODUCT_INFO[breed.primaryProductKey];
                return (
                  <div key={tier} className="rounded-lg border p-2 text-xs" style={{ borderColor: TIER_COLORS[tier] + '60', backgroundColor: TIER_COLORS[tier] + '10' }}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-0.5" style={{ color: TIER_COLORS[tier] }}>{SPECIES_EMOJI[species]}</span>
                      <div className="flex-1 space-y-1">
                        <div className="font-bold" style={{ color: TIER_COLORS[tier] }}>
                          {TIER_LABELS[tier]}: {breed.name}
                        </div>
                        <div className="text-stone-600 dark:text-stone-300">
                          <span className="font-medium">{breed.baseYieldAmount}x {breed.primaryProductKey.replace(/_/g, ' ')}</span> per cycle • {breed.maxCycles} total cycles • {breed.baseIntervalMs / 1000}s interval
                          {breed.bonusDrop && <span className="ml-1 text-emerald-600 dark:text-emerald-400"> • +{Math.round(breed.bonusDrop.chance * 100)}% {breed.bonusDrop.itemKey.replace(/_/g, ' ')}</span>}
                          {breed.gemMilestoneEveryN && <span className="ml-1 text-violet-600 dark:text-violet-400"> • +1 gem every {breed.gemMilestoneEveryN}th cycle</span>}
                        </div>
                        {/* Product explanation */}
                        {productInfo && (
                          <div className="bg-white/60 dark:bg-black/20 rounded p-1.5 space-y-0.5">
                            <div className="font-semibold text-stone-700 dark:text-stone-200">
                              {productInfo.emoji} {productInfo.name} — {breed.baseYieldAmount}x per harvest
                              {breed.primaryProductKey in PRODUCTS ? ` (sells ${PRODUCTS[breed.primaryProductKey as keyof typeof PRODUCTS].sellPrice} coins)` : ''}
                            </div>
                            <div className="text-stone-500 dark:text-stone-400">{productInfo.desc}</div>
                            <div className="text-stone-500 dark:text-stone-400">
                              <span className="font-medium text-stone-600 dark:text-stone-300">Supply chain:</span> {productInfo.supplyChain}
                            </div>
                          </div>
                        )}
                        <div className="text-stone-400 dark:text-stone-500">
                          Elder sell: {breed.elderMarketValue} coins • Codex discovery: {breed.codexGemReward} gems
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WorkerGuide() {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-stone-800 dark:text-gray-200">Autonomous Workers</h4>
      <p className="text-xs text-stone-500 dark:text-gray-400">
        Hire workers to produce items automatically. Upgrade their gear to increase speed.
      </p>
      <div className="space-y-2">
        {Object.values(WORKERS).map(worker => (
          <div key={worker.type} className="bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{worker.emoji}</span>
              <div>
                <div className="font-medium text-stone-800 dark:text-gray-200 text-sm">{worker.name}</div>
                <div className="text-xs text-stone-500 dark:text-gray-400">{worker.description}</div>
              </div>
            </div>
            <div className="text-xs text-stone-500 dark:text-gray-400 ml-7">
              Interval: {Math.round(worker.baseIntervalMs / 1000)}s
              {worker.produces && ` {'\u2192'} ${worker.producesEmoji} ${worker.produces}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FisheryGuide() {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-stone-800 dark:text-gray-200">Fishery Guide</h4>
      <p className="text-xs text-stone-500 dark:text-gray-400">
        Unlock water zones to catch fish in parallel. Upgrade your rod for faster catches and better rare/legendary odds.
        New species discoveries award gems!
      </p>

      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-gray-400">Water Zones</h5>
        {Object.values(WATER_ZONES).map(zone => (
          <div key={zone.id} className="bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2 flex items-center gap-2">
            <span className="text-xl">{zone.emoji}</span>
            <div className="flex-1">
              <div className="font-medium text-stone-800 dark:text-gray-200 text-xs">{zone.name}</div>
              <div className="text-[10px] text-stone-500 dark:text-gray-400">
                {zone.waterType} {'\u2022'} Lv.{zone.unlockLevel} {'\u2022'} {Math.round(zone.baseIntervalMs / 1000)}s interval
                {zone.unlockCostCoins ? ` {'\u2022'} {'\u{1F4B0}'}${zone.unlockCostCoins}` : ''}
                {zone.unlockCostGems ? ` {'\u{1F48E}'}${zone.unlockCostGems}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-gray-400">Fishing Rods</h5>
        {ROD_TIER_ORDER.map(tier => {
          const rod = ROD_TIERS[tier];
          return (
            <div key={tier} className="bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2 flex items-center gap-2">
              <span className="text-lg">{'\u{1F3A3}'}</span>
              <div className="flex-1">
                <div className="font-medium text-stone-800 dark:text-gray-200 text-xs">{rod.name}</div>
                <div className="text-[10px] text-stone-500 dark:text-gray-400">
                  {Math.round(rod.speedMultiplier * 100)}% speed
                  {rod.rareBoost > 0 ? ` +${Math.round(rod.rareBoost * 100)}% rare` : ''}
                  {rod.legendaryBoost > 0 ? ` +${Math.round(rod.legendaryBoost * 100)}% legendary` : ''}
                  {'\u2022'} Lv.{rod.unlockLevel} {'\u2022'} {'\u{1F4B0}'}{rod.costCoins}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TipsGuide() {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-stone-800 dark:text-gray-200">Farming Tips</h4>
      <ul className="text-xs text-stone-500 dark:text-gray-400 space-y-2 list-disc ml-4">
        <li>Plant crops and harvest them to fill your silo with raw materials.</li>
        <li>Feed animals to start production cycles. Collect products when ready.</li>
        <li>Use production buildings to craft higher-value goods from raw materials.</li>
        <li>Fulfill delivery orders for coins and XP to level up.</li>
        <li>Unlock water zones early for passive fish income and codex gem rewards.</li>
        <li>Upgrade your fishing rod to catch rarer fish faster.</li>
        <li>Hire autonomous workers for passive income: beekeepers, foragers, prospectors.</li>
        <li>Equip outfits on farmhands for role-specific bonuses.</li>
        <li>Breed animals to discover new tiers and increase production potential.</li>
        <li>Upgrade habitats to hold more animals per species.</li>
        <li>Watch for hourly events: VIP Chef orders, Rainstorm boosts, Smuggler crates!</li>
        <li>Cotton crops and the Tailor Shop unlock advanced textile recipes at higher levels.</li>
      </ul>

      {/* Breed-specific product tips */}
      <h5 className="font-semibold text-stone-800 dark:text-gray-200 text-sm mt-3">{'\u{1F411}'} Wool &amp; Breed Product Tips</h5>
      <ul className="text-xs text-stone-500 dark:text-gray-400 space-y-2 list-disc ml-4">
        <li><strong>Common sheep (Dorset)</strong> produces regular <strong>Wool</strong> {'\u{1F9F6}'} — this is the ONLY wool type that feeds standard Loom recipes (Sweater, Yarn) and Tailor Shop (Quilted Blanket).</li>
        <li><strong>Legendary sheep (Golden Fleece Ram)</strong> produces <strong>Gilded Wool</strong> — it does NOT give regular Wool! Gilded Wool sells for 55 coins each and can craft Golden Shawls at the Loom (3 Gilded Wool {'\u2192'} 1 Golden Shawl, sell 180 coins).</li>
        <li>If you only have legendary sheep and need regular Wool for standard recipes, keep at least one Common sheep in your pasture, or use Patterned Wool (from Uncommon sheep) to spin extra Yarn.</li>
        <li><strong>Patterned Wool</strong> (Uncommon sheep) spins into 3x Yarn at the Loom — more efficient than regular Wool for Yarn production!</li>
        <li><strong>Merino Wool</strong> (Rare sheep) weaves into Merino Sweater at the Loom — sells for 90 coins, much better than a regular Sweater (40 coins).</li>
        <li>All high-tier breeds have <strong>bonus drops</strong>: Uncommon sheep drop Horn Shavings (15%), Rare sheep drop Lanolin Balm (25%), and Legendary sheep drop gems every 3rd cycle.</li>
        <li>Same pattern applies to other species: Golden Egg {'\u2192'} Golden Cake (Bakery), Rich Cream {'\u2192'} Rich Butter (Dairy), Alpine Milk {'\u2192'} Alpine Cheese (Dairy).</li>
        <li>After all cycles complete, animals become <strong>Elders</strong> — sell them at the Livestock Market for a coin payout! Higher tiers have much higher elder value.</li>
      </ul>
    </div>
  );
}

function getItemEmoji(itemId: string): string {
  if (itemId in CROPS) return CROPS[itemId as keyof typeof CROPS].emoji;
  if (itemId in PRODUCTS) return PRODUCTS[itemId as keyof typeof PRODUCTS].emoji;
  return '\u{1F4E6}';
}
