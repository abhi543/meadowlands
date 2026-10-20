'use client';

import React, { useState } from 'react';

export type AnimalTierType = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface FarmTierDrop {
  species: 'chicken' | 'cow' | 'sheep' | 'pig';
  speciesName: string;
  speciesEmoji: string;
  tier: AnimalTierType;
  tierLabel: string;
  tierColor: string;
  badgeClass: string;
  borderClass: string;
  breedName: string;
  visualTheme: string;
  feedRequired: string;
  feedEmoji: string;
  primaryItem: {
    name: string;
    emoji: string;
    yieldCount: number;
    sellPrice: number;
  };
  bonusItem?: {
    name: string;
    emoji: string;
    chance: string;
    coinBonus?: number;
  };
  gemMilestone?: string;
  maxCycles: number;
  cycleTimeSec: number;
}

export interface PrehistoricDrop {
  id: string;
  name: string;
  era: string;
  emoji: string;
  feedRequired: string;
  feedEmoji: string;
  harvestItem: {
    name: string;
    emoji: string;
    sellPrice: number;
    description: string;
  };
  passiveAura: string;
  cycleTimeSec: number;
}

export const FARM_TIER_DROPS: FarmTierDrop[] = [
  // ---- CHICKENS ----
  {
    species: 'chicken',
    speciesName: 'Chicken',
    speciesEmoji: '🐔',
    tier: 'common',
    tierLabel: 'Common',
    tierColor: '#10b981',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    borderClass: 'border-emerald-500/40',
    breedName: 'Rhode Island Red',
    visualTheme: 'Rustic Brown Plumage',
    feedRequired: '1x Wheat Feed',
    feedEmoji: '🌾',
    primaryItem: { name: 'Fresh Egg', emoji: '🥚', yieldCount: 2, sellPrice: 8 },
    maxCycles: 15,
    cycleTimeSec: 20,
  },
  {
    species: 'chicken',
    speciesName: 'Chicken',
    speciesEmoji: '🐔',
    tier: 'uncommon',
    tierLabel: 'Uncommon',
    tierColor: '#0ea5e9',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    borderClass: 'border-sky-500/40',
    breedName: 'Pasture Araucana',
    visualTheme: 'Powder Blue Feathers',
    feedRequired: '1x Wheat Feed',
    feedEmoji: '🌾',
    primaryItem: { name: 'Blue Egg', emoji: '🪺', yieldCount: 2, sellPrice: 18 },
    bonusItem: { name: 'Soft Down Feather', emoji: '🪶', chance: '10% chance' },
    maxCycles: 18,
    cycleTimeSec: 20,
  },
  {
    species: 'chicken',
    speciesName: 'Chicken',
    speciesEmoji: '🐔',
    tier: 'rare',
    tierLabel: 'Rare',
    tierColor: '#a855f7',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    borderClass: 'border-purple-500/40',
    breedName: 'Midnight Silkie',
    visualTheme: 'Fluffy Obsidian Down',
    feedRequired: '1x Wheat Feed',
    feedEmoji: '🌾',
    primaryItem: { name: 'Obsidian Egg', emoji: '🖤', yieldCount: 3, sellPrice: 45 },
    bonusItem: { name: 'Glossy Quill', emoji: '✒️', chance: '20% chance' },
    maxCycles: 22,
    cycleTimeSec: 20,
  },
  {
    species: 'chicken',
    speciesName: 'Chicken',
    speciesEmoji: '🐔',
    tier: 'legendary',
    tierLabel: 'Legendary',
    tierColor: '#f59e0b',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/70',
    borderClass: 'border-amber-500/50',
    breedName: 'Solar Phoenix Hen',
    visualTheme: 'Fiery Amber Plumage',
    feedRequired: '1x Wheat Feed',
    feedEmoji: '🌾',
    primaryItem: { name: 'Golden Egg', emoji: '✨', yieldCount: 4, sellPrice: 150 },
    gemMilestone: '💎 +1 Gem every 5 cycles',
    maxCycles: 26,
    cycleTimeSec: 20,
  },

  // ---- COWS ----
  {
    species: 'cow',
    speciesName: 'Dairy Cow',
    speciesEmoji: '🐄',
    tier: 'common',
    tierLabel: 'Common',
    tierColor: '#10b981',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    borderClass: 'border-emerald-500/40',
    breedName: 'Holstein-Friesian',
    visualTheme: 'Black & White Spotted',
    feedRequired: 'Wheat + Corn Feed',
    feedEmoji: '🌽',
    primaryItem: { name: 'Fresh Milk', emoji: '🥛', yieldCount: 2, sellPrice: 15 },
    maxCycles: 12,
    cycleTimeSec: 40,
  },
  {
    species: 'cow',
    speciesName: 'Dairy Cow',
    speciesEmoji: '🐄',
    tier: 'uncommon',
    tierLabel: 'Uncommon',
    tierColor: '#0ea5e9',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    borderClass: 'border-sky-500/40',
    breedName: 'Jersey Buttercup',
    visualTheme: 'Fawn Tan Coat',
    feedRequired: 'Wheat + Corn Feed',
    feedEmoji: '🌽',
    primaryItem: { name: 'Rich Cream', emoji: '🍶', yieldCount: 2, sellPrice: 35 },
    bonusItem: { name: 'Churned Butter', emoji: '🧈', chance: '15% chance' },
    maxCycles: 15,
    cycleTimeSec: 40,
  },
  {
    species: 'cow',
    speciesName: 'Dairy Cow',
    speciesEmoji: '🐄',
    tier: 'rare',
    tierLabel: 'Rare',
    tierColor: '#a855f7',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    borderClass: 'border-purple-500/40',
    breedName: 'Highland Shaggy Yak',
    visualTheme: 'Caramel Shag Coat',
    feedRequired: 'Wheat + Corn Feed',
    feedEmoji: '🌽',
    primaryItem: { name: 'Alpine Milk', emoji: '🏔️', yieldCount: 3, sellPrice: 60 },
    bonusItem: { name: 'Yak Wool', emoji: '🧶', chance: '25% chance' },
    maxCycles: 18,
    cycleTimeSec: 40,
  },
  {
    species: 'cow',
    speciesName: 'Dairy Cow',
    speciesEmoji: '🐄',
    tier: 'legendary',
    tierLabel: 'Legendary',
    tierColor: '#f59e0b',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/70',
    borderClass: 'border-amber-500/50',
    breedName: 'Celestial Star-Bovine',
    visualTheme: 'Midnight Constellation',
    feedRequired: 'Wheat + Corn Feed',
    feedEmoji: '🌽',
    primaryItem: { name: 'Starlight Milk', emoji: '🌟', yieldCount: 4, sellPrice: 250 },
    gemMilestone: '💎 +1 Gem every 4 cycles',
    maxCycles: 21,
    cycleTimeSec: 40,
  },

  // ---- SHEEP ----
  {
    species: 'sheep',
    speciesName: 'Sheep',
    speciesEmoji: '🐑',
    tier: 'common',
    tierLabel: 'Common',
    tierColor: '#10b981',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    borderClass: 'border-emerald-500/40',
    breedName: 'Dorset White Horn',
    visualTheme: 'Ivory Fluffy Fleece',
    feedRequired: 'Wheat + Carrot Feed',
    feedEmoji: '🥕',
    primaryItem: { name: 'Raw Wool', emoji: '🧶', yieldCount: 2, sellPrice: 25 },
    maxCycles: 10,
    cycleTimeSec: 60,
  },
  {
    species: 'sheep',
    speciesName: 'Sheep',
    speciesEmoji: '🐑',
    tier: 'uncommon',
    tierLabel: 'Uncommon',
    tierColor: '#0ea5e9',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    borderClass: 'border-sky-500/40',
    breedName: 'Jacob Four-Horn',
    visualTheme: 'Piebald Spotted Wool',
    feedRequired: 'Wheat + Carrot Feed',
    feedEmoji: '🥕',
    primaryItem: { name: 'Patterned Wool', emoji: '🧣', yieldCount: 2, sellPrice: 55 },
    bonusItem: { name: 'Horn Shavings', emoji: '📯', chance: '15% chance' },
    maxCycles: 13,
    cycleTimeSec: 60,
  },
  {
    species: 'sheep',
    speciesName: 'Sheep',
    speciesEmoji: '🐑',
    tier: 'rare',
    tierLabel: 'Rare',
    tierColor: '#a855f7',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    borderClass: 'border-purple-500/40',
    breedName: 'Merino Cloud Sheep',
    visualTheme: 'Dense Crimped Fleece',
    feedRequired: 'Wheat + Carrot Feed',
    feedEmoji: '🥕',
    primaryItem: { name: 'Merino Wool', emoji: '☁️', yieldCount: 3, sellPrice: 90 },
    bonusItem: { name: 'Lanolin Balm', emoji: '🧴', chance: '25% chance' },
    maxCycles: 15,
    cycleTimeSec: 60,
  },
  {
    species: 'sheep',
    speciesName: 'Sheep',
    speciesEmoji: '🐑',
    tier: 'legendary',
    tierLabel: 'Legendary',
    tierColor: '#f59e0b',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/70',
    borderClass: 'border-amber-500/50',
    breedName: 'Golden Fleece Ram',
    visualTheme: 'Spun Gold Metallic',
    feedRequired: 'Wheat + Carrot Feed',
    feedEmoji: '🥕',
    primaryItem: { name: 'Gilded Wool', emoji: '✨', yieldCount: 4, sellPrice: 200 },
    gemMilestone: '💎 +1 Gem every 3 cycles',
    maxCycles: 18,
    cycleTimeSec: 60,
  },

  // ---- PIGS ----
  {
    species: 'pig',
    speciesName: 'Pig',
    speciesEmoji: '🐖',
    tier: 'common',
    tierLabel: 'Common',
    tierColor: '#10b981',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    borderClass: 'border-emerald-500/40',
    breedName: 'Yorkshire Pink',
    visualTheme: 'Rose Pink Hide',
    feedRequired: 'Corn + Soybean Feed',
    feedEmoji: '🌱',
    primaryItem: { name: 'Black Truffle', emoji: '🍄', yieldCount: 2, sellPrice: 40 },
    maxCycles: 8,
    cycleTimeSec: 80,
  },
  {
    species: 'pig',
    speciesName: 'Pig',
    speciesEmoji: '🐖',
    tier: 'uncommon',
    tierLabel: 'Uncommon',
    tierColor: '#0ea5e9',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    borderClass: 'border-sky-500/40',
    breedName: 'Berkshire Black',
    visualTheme: 'Black with White Socks',
    feedRequired: 'Corn + Soybean Feed',
    feedEmoji: '🌱',
    primaryItem: { name: 'White Truffle', emoji: '🍄', yieldCount: 2, sellPrice: 120 },
    bonusItem: { name: 'Ancient Coin (+100🪙)', emoji: '🪙', chance: '15% chance', coinBonus: 100 },
    maxCycles: 10,
    cycleTimeSec: 80,
  },
  {
    species: 'pig',
    speciesName: 'Pig',
    speciesEmoji: '🐖',
    tier: 'rare',
    tierLabel: 'Rare',
    tierColor: '#a855f7',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    borderClass: 'border-purple-500/40',
    breedName: 'Iberian Bristle Boar',
    visualTheme: 'Slate Grey Bristle',
    feedRequired: 'Corn + Soybean Feed',
    feedEmoji: '🌱',
    primaryItem: { name: 'Alba Truffle', emoji: '🍄', yieldCount: 3, sellPrice: 220 },
    bonusItem: { name: 'Foraged Nut', emoji: '🌰', chance: '25% chance' },
    maxCycles: 12,
    cycleTimeSec: 80,
  },
  {
    species: 'pig',
    speciesName: 'Pig',
    speciesEmoji: '🐖',
    tier: 'legendary',
    tierLabel: 'Legendary',
    tierColor: '#f59e0b',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/70',
    borderClass: 'border-amber-500/50',
    breedName: 'Gilded Snout Chimera',
    visualTheme: 'Mottled Jade-Gold',
    feedRequired: 'Corn + Soybean Feed',
    feedEmoji: '🌱',
    primaryItem: { name: 'Diamond Truffle', emoji: '💎', yieldCount: 4, sellPrice: 500 },
    bonusItem: { name: 'Ancient Hoard (+500🪙)', emoji: '💰', chance: '100% Guaranteed', coinBonus: 500 },
    gemMilestone: '💎 +1 Gem every 1 cycle!',
    maxCycles: 14,
    cycleTimeSec: 80,
  },
];

export const PREHISTORIC_DROPS: PrehistoricDrop[] = [
  {
    id: 'asaphid_trilobite',
    name: 'Asaphid Trilobite',
    era: 'Cambrian',
    emoji: '🦞',
    feedRequired: 'Algae Paste',
    feedEmoji: '🧪',
    harvestItem: {
      name: 'Chitin Molt Plates',
      emoji: '🛡️',
      sellPrice: 120,
      description: 'Ancient mineral carapace used in Bio-Lab research and tool crafting.',
    },
    passiveAura: 'Soil Aeration (+15% capillary nutrient absorption)',
    cycleTimeSec: 120,
  },
  {
    id: 'meganeura',
    name: 'Meganeura (Giant Dragonfly)',
    era: 'Carboniferous',
    emoji: '🦗',
    feedRequired: 'Insect Mash',
    feedEmoji: '🥣',
    harvestItem: {
      name: 'Prismatic Wing Membranes',
      emoji: '🪽',
      sellPrice: 200,
      description: 'Iridescent carboniferous wing material for luxury textiles and high-tier orders.',
    },
    passiveAura: 'Apex Pollination (+25% crop maturation speed)',
    cycleTimeSec: 180,
  },
  {
    id: 'arthropleura',
    name: 'Arthropleura (Giant Millipede)',
    era: 'Carboniferous',
    emoji: '🐛',
    feedRequired: 'Crushed Grain Mash',
    feedEmoji: '🌾',
    harvestItem: {
      name: 'Supercharged Primeval Humus',
      emoji: '🍂',
      sellPrice: 160,
      description: 'Hyper-fertile compost fertilizer that doubles feed mill speed and plot nutrition.',
    },
    passiveAura: 'Composting Engine (+100% Feed Mill velocity)',
    cycleTimeSec: 150,
  },
  {
    id: 'dimetrodon',
    name: 'Dimetrodon',
    era: 'Permian',
    emoji: '🦎',
    feedRequired: 'Savory Fish Pie',
    feedEmoji: '🥧',
    harvestItem: {
      name: 'Shed Thermal Scutes',
      emoji: '🔥',
      sellPrice: 280,
      description: 'Geothermal neural sail scutes protecting surrounding fields from frost shock.',
    },
    passiveAura: 'Geothermal Radiance (Frost shock immunity)',
    cycleTimeSec: 240,
  },
  {
    id: 'titanoboa',
    name: 'Titanoboa (Colossal Serpent)',
    era: 'Mesozoic',
    emoji: '🐍',
    feedRequired: 'Fresh River Sturgeon',
    feedEmoji: '🐟',
    harvestItem: {
      name: 'Massive Serpent Slough',
      emoji: '📜',
      sellPrice: 450,
      description: 'Pristine shed snake skin repelling all pests and vermin farm-wide.',
    },
    passiveAura: 'Apex Scent Ward (Repels pests & nocturnal vermin)',
    cycleTimeSec: 300,
  },
  {
    id: 'woolly_mammoth',
    name: 'Woolly Mammoth',
    era: 'Pleistocene',
    emoji: '🦣',
    feedRequired: 'Mountain Hay Bales',
    feedEmoji: '🌾',
    harvestItem: {
      name: 'Insulated Down Wool',
      emoji: '🧶',
      sellPrice: 600,
      description: 'Dense sub-zero wool fiber used for royal winter coats and artisan blankets.',
    },
    passiveAura: 'Heavy Labor Pack (-30% worker hydration drain)',
    cycleTimeSec: 360,
  },
];

interface AnimalProductsQuickReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnimalProductsQuickReference({ isOpen, onClose }: AnimalProductsQuickReferenceProps) {
  const [activeTab, setActiveTab] = useState<'farm' | 'prehistoric'>('farm');
  const [tierFilter, setTierFilter] = useState<'all' | AnimalTierType>('all');
  const [speciesFilter, setSpeciesFilter] = useState<'all' | 'chicken' | 'cow' | 'sheep' | 'pig'>('all');

  if (!isOpen) return null;

  const filteredFarmDrops = FARM_TIER_DROPS.filter(d => {
    if (tierFilter !== 'all' && d.tier !== tierFilter) return false;
    if (speciesFilter !== 'all' && d.species !== speciesFilter) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-stone-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl flex flex-col text-stone-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-amber-200 tracking-tight">
                All Items Given by Animals (Common, Uncommon, Rare &amp; Legendary)
              </h2>
              <p className="text-xs text-stone-400">
                Complete matrix of yields, rare bonus drops, and feed requirements across all 4 tiers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Category Switcher Tabs */}
        <div className="px-3.5 py-2 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('farm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'farm'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <span>🌾</span>
              <span>Farm Animals by Tier (16 Breeds)</span>
            </button>
            <button
              onClick={() => setActiveTab('prehistoric')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'prehistoric'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <span>🦖</span>
              <span>Prehistoric Sanctuary (6 Creatures)</span>
            </button>
          </div>

          {/* Tier Quick Filter (Only for Farm tab) */}
          {activeTab === 'farm' && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-bold text-stone-400 mr-1">Tier:</span>
              {(['all', 'common', 'uncommon', 'rare', 'legendary'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black capitalize transition-all cursor-pointer ${
                    tierFilter === t
                      ? 'bg-stone-100 text-stone-950 shadow-xs'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  }`}
                >
                  {t === 'all' && 'All Tiers'}
                  {t === 'common' && '🟢 Common'}
                  {t === 'uncommon' && '🔵 Uncommon'}
                  {t === 'rare' && '🟣 Rare'}
                  {t === 'legendary' && '🟡 Legendary'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Species Sub-Filter (For Farm tab) */}
        {activeTab === 'farm' && (
          <div className="px-3.5 py-1.5 bg-stone-950/40 border-b border-stone-800/80 flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-stone-400 mr-1">Species:</span>
            {(['all', 'chicken', 'cow', 'sheep', 'pig'] as const).map(sp => (
              <button
                key={sp}
                onClick={() => setSpeciesFilter(sp)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  speciesFilter === sp
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {sp === 'all' && 'All Species'}
                {sp === 'chicken' && '🐔 Chickens'}
                {sp === 'cow' && '🐄 Cows'}
                {sp === 'sheep' && '🐑 Sheep'}
                {sp === 'pig' && '🐖 Pigs'}
              </button>
            ))}
          </div>
        )}

        {/* Content Table */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1">
          {activeTab === 'farm' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-700 bg-stone-800/90 text-stone-300 font-bold">
                    <th className="py-2.5 px-3">Tier &amp; Breed</th>
                    <th className="py-2.5 px-3">Feed Required</th>
                    <th className="py-2.5 px-3">Main Item Given</th>
                    <th className="py-2.5 px-3">Rare Bonus Item / Perks</th>
                    <th className="py-2.5 px-3">Lifetime Cycles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {filteredFarmDrops.map((b, idx) => (
                    <tr key={`${b.species}_${b.tier}_${idx}`} className="hover:bg-stone-800/40 transition-colors">
                      {/* Tier & Breed */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl shrink-0">{b.speciesEmoji}</span>
                          <div>
                            <div className="font-bold text-stone-100 flex items-center gap-1.5">
                              <span>{b.breedName}</span>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${b.badgeClass}`}>
                                {b.tierLabel}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-400 italic">
                              {b.visualTheme}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Feed Required */}
                      <td className="py-2.5 px-3 text-stone-300 font-medium">
                        <span className="mr-1">{b.feedEmoji}</span>
                        {b.feedRequired}
                      </td>

                      {/* Primary Item Given */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <span className="text-base">{b.primaryItem.emoji}</span>
                          <span>{b.primaryItem.name}</span>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-700/50">
                            {b.primaryItem.yieldCount}x yield ({b.primaryItem.sellPrice}🪙)
                          </span>
                        </div>
                      </td>

                      {/* Bonus Drops & Perks */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          {b.bonusItem ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-[11px]">
                              <span>{b.bonusItem.emoji}</span>
                              <span>{b.bonusItem.name}</span>
                              <span className="text-amber-400 font-mono text-[10px]">({b.bonusItem.chance})</span>
                            </div>
                          ) : (
                            <span className="text-stone-500 italic text-[11px]">Base Yield Only</span>
                          )}
                          {b.gemMilestone && (
                            <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                              <span>{b.gemMilestone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Lifetime & Speed */}
                      <td className="py-2.5 px-3 font-mono text-stone-400 whitespace-nowrap">
                        <div>⏱️ {b.cycleTimeSec}s / cycle</div>
                        <div className="text-[10px] text-stone-500 font-semibold">{b.maxCycles} max cycles</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-700 bg-stone-800/90 text-stone-300 font-bold">
                    <th className="py-2.5 px-3">Prehistoric Creature</th>
                    <th className="py-2.5 px-3">Diet / Feed</th>
                    <th className="py-2.5 px-3">Harvest Item Produced</th>
                    <th className="py-2.5 px-3">Macro Estate Passive Aura</th>
                    <th className="py-2.5 px-3">Harvest Cycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {PREHISTORIC_DROPS.map(c => (
                    <tr key={c.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl shrink-0">{c.emoji}</span>
                          <div>
                            <div className="font-bold text-stone-100">{c.name}</div>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                              {c.era} Era
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-300 font-medium">
                        <span className="mr-1">{c.feedEmoji}</span>
                        {c.feedRequired}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-start gap-1.5">
                          <span className="text-lg shrink-0">{c.harvestItem.emoji}</span>
                          <div>
                            <div className="font-bold text-amber-300 flex items-center gap-1.5">
                              {c.harvestItem.name}
                              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-700/50">
                                {c.harvestItem.sellPrice}🪙
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5 max-w-xs leading-tight">
                              {c.harvestItem.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-300 text-[11px] max-w-xs">
                        <span className="font-semibold text-emerald-300">✨ {c.passiveAura}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-400 whitespace-nowrap">
                        ⏱️ {c.cycleTimeSec}s ({Math.round(c.cycleTimeSec / 60)}m)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>💡 Higher tier animals (Uncommon, Rare, Legendary) yield extra drops, bonus materials, and periodic gems.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
