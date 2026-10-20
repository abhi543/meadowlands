'use client';

import React, { useState } from 'react';

export interface AnimalDropItem {
  id: string;
  name: string;
  emoji: string;
  category: 'farm' | 'prehistoric';
  feedRequired: string;
  feedEmoji: string;
  primaryDrop: {
    name: string;
    emoji: string;
    sellPrice: number;
    description: string;
  };
  rareDrops?: {
    name: string;
    emoji: string;
    sellPrice: number;
  }[];
  cycleTime: string;
}

export const ALL_ANIMAL_DROPS: AnimalDropItem[] = [
  // Farm Livestock
  {
    id: 'chicken',
    name: 'Chicken',
    emoji: '🐔',
    category: 'farm',
    feedRequired: '1x Wheat Feed',
    feedEmoji: '🌾',
    primaryDrop: {
      name: 'Fresh Egg',
      emoji: '🥚',
      sellPrice: 8,
      description: 'Used in Bakery for bread, pies, pastries, and worker commissary meals.',
    },
    rareDrops: [
      { name: 'Golden Egg', emoji: '✨', sellPrice: 150 },
      { name: 'Blue Egg', emoji: '🪺', sellPrice: 18 },
    ],
    cycleTime: '20 seconds',
  },
  {
    id: 'cow',
    name: 'Dairy Cow',
    emoji: '🐄',
    category: 'farm',
    feedRequired: 'Wheat + Corn Feed',
    feedEmoji: '🌽',
    primaryDrop: {
      name: 'Fresh Milk',
      emoji: '🥛',
      sellPrice: 15,
      description: 'Processed in Cheese Press into Cheese and Rich Butter; used in desserts.',
    },
    rareDrops: [
      { name: 'Rich Cream', emoji: '🍶', sellPrice: 35 },
      { name: 'Starlight Milk', emoji: '🌟', sellPrice: 250 },
      { name: 'Alpine Milk', emoji: '🏔️', sellPrice: 60 },
    ],
    cycleTime: '40 seconds',
  },
  {
    id: 'sheep',
    name: 'Sheep',
    emoji: '🐑',
    category: 'farm',
    feedRequired: 'Wheat + Carrot Feed',
    feedEmoji: '🥕',
    primaryDrop: {
      name: 'Raw Wool',
      emoji: '🧶',
      sellPrice: 25,
      description: 'Spun at the Loom into Yarn, Warm Sweaters, and Quilted Blankets.',
    },
    rareDrops: [
      { name: 'Gilded Wool', emoji: '✨', sellPrice: 200 },
      { name: 'Pure Silk', emoji: '🧣', sellPrice: 80 },
    ],
    cycleTime: '60 seconds',
  },
  {
    id: 'pig',
    name: 'Pig',
    emoji: '🐖',
    category: 'farm',
    feedRequired: 'Corn + Soybean Feed',
    feedEmoji: '🌱',
    primaryDrop: {
      name: 'Crispy Bacon / Forest Truffle',
      emoji: '🥓',
      sellPrice: 40,
      description: 'Foraged delicacy and protein yield; crafted into high-tier Truffle Oil.',
    },
    rareDrops: [
      { name: 'White Truffle', emoji: '🍄', sellPrice: 120 },
      { name: 'Diamond Truffle', emoji: '💎', sellPrice: 500 },
    ],
    cycleTime: '80 seconds',
  },

  // Prehistoric Reserve Creatures
  {
    id: 'asaphid_trilobite',
    name: 'Asaphid Trilobite',
    emoji: '🦞',
    category: 'prehistoric',
    feedRequired: 'Algae Paste',
    feedEmoji: '🧪',
    primaryDrop: {
      name: 'Chitin Molt Plates',
      emoji: '🛡️',
      sellPrice: 120,
      description: 'Ancient mineral carapace used in Bio-Lab research and tool crafting.',
    },
    cycleTime: '120 seconds (2m)',
  },
  {
    id: 'meganeura',
    name: 'Meganeura (Giant Dragonfly)',
    emoji: '🦗',
    category: 'prehistoric',
    feedRequired: 'Insect Mash',
    feedEmoji: '🥣',
    primaryDrop: {
      name: 'Prismatic Wing Membranes',
      emoji: '🪽',
      sellPrice: 200,
      description: 'Iridescent carboniferous wing material for luxury textiles and high-tier orders.',
    },
    cycleTime: '180 seconds (3m)',
  },
  {
    id: 'arthropleura',
    name: 'Arthropleura (Giant Millipede)',
    emoji: '🐛',
    category: 'prehistoric',
    feedRequired: 'Crushed Grain Mash',
    feedEmoji: '🌾',
    primaryDrop: {
      name: 'Supercharged Primeval Humus',
      emoji: '🍂',
      sellPrice: 160,
      description: 'Hyper-fertile compost fertilizer that doubles feed mill speed and plot nutrition.',
    },
    cycleTime: '150 seconds (2.5m)',
  },
  {
    id: 'dimetrodon',
    name: 'Dimetrodon',
    emoji: '🦎',
    category: 'prehistoric',
    feedRequired: 'Savory Fish Pie',
    feedEmoji: '🥧',
    primaryDrop: {
      name: 'Shed Thermal Scutes',
      emoji: '🔥',
      sellPrice: 280,
      description: 'Geothermal neural sail scutes protecting surrounding fields from frost shock.',
    },
    cycleTime: '240 seconds (4m)',
  },
  {
    id: 'titanoboa',
    name: 'Titanoboa (Colossal Serpent)',
    emoji: '🐍',
    category: 'prehistoric',
    feedRequired: 'Fresh River Sturgeon',
    feedEmoji: '🐟',
    primaryDrop: {
      name: 'Massive Serpent Slough',
      emoji: '📜',
      sellPrice: 450,
      description: 'Pristine shed snake skin repelling all pests and vermin farm-wide.',
    },
    cycleTime: '300 seconds (5m)',
  },
  {
    id: 'woolly_mammoth',
    name: 'Woolly Mammoth',
    emoji: '🦣',
    category: 'prehistoric',
    feedRequired: 'Mountain Hay Bales',
    feedEmoji: '🌾',
    primaryDrop: {
      name: 'Insulated Down Wool',
      emoji: '🧶',
      sellPrice: 600,
      description: 'Dense sub-zero wool fiber used for royal winter coats and artisan blankets.',
    },
    cycleTime: '360 seconds (6m)',
  },
];

interface AnimalProductsQuickReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnimalProductsQuickReference({ isOpen, onClose }: AnimalProductsQuickReferenceProps) {
  const [filter, setFilter] = useState<'all' | 'farm' | 'prehistoric'>('all');

  if (!isOpen) return null;

  const filteredAnimals = ALL_ANIMAL_DROPS.filter(a => {
    if (filter === 'all') return true;
    return a.category === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-stone-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl flex flex-col text-stone-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-amber-200 tracking-tight">
                Items Given by Animals
              </h2>
              <p className="text-xs text-stone-400">
                All animal products, yields, feed requirements, and sell values in one place
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

        {/* Filter Toolbar */}
        <div className="px-4 py-2.5 bg-stone-950/60 border-b border-stone-800 flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
            }`}
          >
            All Animals ({ALL_ANIMAL_DROPS.length})
          </button>
          <button
            onClick={() => setFilter('farm')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'farm'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
            }`}
          >
            🐔 Farm Animals (4)
          </button>
          <button
            onClick={() => setFilter('prehistoric')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'prehistoric'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
            }`}
          >
            🦖 Sanctuary Creatures (6)
          </button>
        </div>

        {/* Content Table */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-700 bg-stone-800/80 text-stone-300 font-bold">
                  <th className="py-2.5 px-3">Animal</th>
                  <th className="py-2.5 px-3">Feed / Diet</th>
                  <th className="py-2.5 px-3">Main Product Given</th>
                  <th className="py-2.5 px-3">Rare / Mutation Items</th>
                  <th className="py-2.5 px-3">Cycle Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {filteredAnimals.map(animal => (
                  <tr key={animal.id} className="hover:bg-stone-800/50 transition-colors">
                    {/* Animal Name */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">{animal.emoji}</span>
                        <div>
                          <div className="font-bold text-stone-200">{animal.name}</div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                            animal.category === 'farm'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                              : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
                          }`}>
                            {animal.category === 'farm' ? 'Farm Livestock' : 'Prehistoric'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Feed Required */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                        <span>{animal.feedEmoji}</span>
                        <span>{animal.feedRequired}</span>
                      </div>
                    </td>

                    {/* Primary Drop */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-1.5">
                        <span className="text-lg shrink-0">{animal.primaryDrop.emoji}</span>
                        <div>
                          <div className="font-bold text-amber-300 flex items-center gap-1.5">
                            {animal.primaryDrop.name}
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-700/50">
                              {animal.primaryDrop.sellPrice}🪙
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 leading-tight mt-0.5 max-w-xs">
                            {animal.primaryDrop.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Rare Drops */}
                    <td className="py-3 px-3">
                      {animal.rareDrops && animal.rareDrops.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {animal.rareDrops.map((rd, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-[11px]"
                            >
                              <span>{rd.emoji}</span>
                              <span>{rd.name}</span>
                              <span className="text-amber-400 font-mono text-[10px]">({rd.sellPrice}🪙)</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-500 italic text-[11px]">Standard Drop Only</span>
                      )}
                    </td>

                    {/* Cycle Time */}
                    <td className="py-3 px-3 font-mono text-stone-400 whitespace-nowrap">
                      ⏱️ {animal.cycleTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>💡 Animal yields can be harvested directly in the <b>Animals</b> and <b>Sanctuary</b> tabs.</span>
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
