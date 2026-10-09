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

function AnimalGuide() {
  const SPECIES_LIST: AnimalSpecies[] = ['chicken', 'cow', 'sheep', 'pig'];
  const TIERS: Tier[] = ['common', 'uncommon', 'rare', 'legendary'];

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-stone-800 dark:text-gray-200">Animal Breeds</h4>
      <p className="text-xs text-stone-500 dark:text-gray-400">
        Feed animals, wait for production, then collect. Each breed has unique products, bonus drops, and lifespans. Higher tiers yield more valuable goods.
      </p>
      <div className="space-y-3">
        {SPECIES_LIST.map(species => {
          const def = ANIMALS[species];
          return (
            <div key={species} className="bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{def.emoji}</span>
                <div>
                  <div className="font-medium text-stone-800 dark:text-gray-200 text-sm">{def.name}</div>
                  <div className="text-xs text-stone-500 dark:text-gray-400">
                    {def.productEmoji} {def.product} • {def.productionTimeSec}s/cycle • {def.feedPerCycle} feed/cycle • cap {def.capacity}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {TIERS.map(tier => {
                  const breedId = `${species}_${tier}`;
                  const breed = BREED_REGISTRY[breedId];
                  if (!breed) return null;
                  return (
                    <div key={tier} className="rounded border p-1.5 text-xs" style={{ borderColor: TIER_COLORS[tier] + '60', backgroundColor: TIER_COLORS[tier] + '10' }}>
                      <div className="font-bold" style={{ color: TIER_COLORS[tier] }}>
                        {TIER_LABELS[tier]}: {breed.name}
                      </div>
                      <div className="text-stone-500 dark:text-stone-400">
                        {breed.baseYieldAmount}x {breed.primaryProductKey.replace(/_/g, ' ')} • {breed.maxCycles} cycles
                        {breed.bonusDrop && ` • ${Math.round(breed.bonusDrop.chance * 100)}%: ${breed.bonusDrop.itemKey.replace(/_/g, ' ')}`}
                        {breed.gemMilestoneEveryN && ` • +gem every ${breed.gemMilestoneEveryN}th`}
                      </div>
                      <div className="text-stone-400 dark:text-stone-500">
                        Elder: {breed.elderMarketValue} coins • Codex: {breed.codexGemReward} gems
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
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
    </div>
  );
}

function getItemEmoji(itemId: string): string {
  if (itemId in CROPS) return CROPS[itemId as keyof typeof CROPS].emoji;
  if (itemId in PRODUCTS) return PRODUCTS[itemId as keyof typeof PRODUCTS].emoji;
  return '\u{1F4E6}';
}
