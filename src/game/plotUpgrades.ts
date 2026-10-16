export interface PlotSoilTierInfo {
  level: number;
  name: string;
  emoji: string;
  badgeColor: string;
  borderColor: string;
  bgGradient: string;
  upgradeCostCoins: number;
  speedBonusPct: number;
  bonusYield: number;
  doubleProcChance: number;
  bonusXp: number;
  autoHydrate: boolean;
  perkSummary: string;
  description: string;
}

export const MAX_PLOT_SOIL_LEVEL = 5;
export const MAX_FARM_PLOTS = 24;
export const BASE_UNLOCKED_PLOTS = 12;

export const PLOT_SOIL_TIERS: Record<number, PlotSoilTierInfo> = {
  1: {
    level: 1,
    name: 'Basic Farmland',
    emoji: '🌱',
    badgeColor: 'text-stone-400 bg-stone-800/80 border-stone-600/50',
    borderColor: 'border-stone-700/60',
    bgGradient: 'from-stone-900 to-stone-950',
    upgradeCostCoins: 0,
    speedBonusPct: 0,
    bonusYield: 0,
    doubleProcChance: 0,
    bonusXp: 0,
    autoHydrate: false,
    perkSummary: 'Baseline Earth',
    description: 'Standard tillable soil. Baseline growth rate and single yield.',
  },
  2: {
    level: 2,
    name: 'Enriched Loam',
    emoji: '🌿',
    badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-500/50',
    borderColor: 'border-emerald-600/50',
    bgGradient: 'from-emerald-950/40 via-stone-900 to-stone-950',
    upgradeCostCoins: 100,
    speedBonusPct: 15,
    bonusYield: 0,
    doubleProcChance: 0,
    bonusXp: 1,
    autoHydrate: false,
    perkSummary: '+15% Speed · +1 XP',
    description: 'Aerated soil with river peat. Crops mature 15% faster and award +1 bonus XP.',
  },
  3: {
    level: 3,
    name: 'Fertilized Humus',
    emoji: '🌾',
    badgeColor: 'text-amber-300 bg-amber-950/80 border-amber-500/50',
    borderColor: 'border-amber-500/60',
    bgGradient: 'from-amber-950/40 via-stone-900 to-stone-950',
    upgradeCostCoins: 250,
    speedBonusPct: 30,
    bonusYield: 1,
    doubleProcChance: 0,
    bonusXp: 2,
    autoHydrate: false,
    perkSummary: '+30% Speed · +1 Yield',
    description: 'Composted high-nitrogen humus. Crops mature 30% faster and yield +1 bonus crop.',
  },
  4: {
    level: 4,
    name: 'Volcanic Bed',
    emoji: '🌋',
    badgeColor: 'text-rose-300 bg-rose-950/80 border-rose-500/50',
    borderColor: 'border-rose-500/70',
    bgGradient: 'from-rose-950/50 via-stone-900 to-stone-950',
    upgradeCostCoins: 600,
    speedBonusPct: 50,
    bonusYield: 2,
    doubleProcChance: 0.20,
    bonusXp: 3,
    autoHydrate: false,
    perkSummary: '+50% Speed · +2 Yield · 20% 2x Proc',
    description: 'Mineral-dense volcanic silt. Crops mature 50% faster, yield +2 bonus crops, with a 20% double-yield proc chance.',
  },
  5: {
    level: 5,
    name: 'Celestial Soil',
    emoji: '✨',
    badgeColor: 'text-purple-300 bg-purple-950/90 border-purple-400 shadow-xs shadow-purple-500/30',
    borderColor: 'border-purple-400',
    bgGradient: 'from-purple-950/60 via-indigo-950/40 to-stone-950',
    upgradeCostCoins: 1500,
    speedBonusPct: 75,
    bonusYield: 3,
    doubleProcChance: 0.35,
    bonusXp: 5,
    autoHydrate: true,
    perkSummary: '+75% Speed · +3 Yield · Self-Watering',
    description: 'Infused with starlight and alchemical spores. 75% faster growth, +3 bonus crops, 35% double-yield, and permanently auto-watered!',
  },
};

export function getSoilTier(level?: number): PlotSoilTierInfo {
  const safeLevel = Math.max(1, Math.min(MAX_PLOT_SOIL_LEVEL, level || 1));
  return PLOT_SOIL_TIERS[safeLevel] || PLOT_SOIL_TIERS[1];
}

export function getPlotUnlockCost(currentUnlocked: number): number {
  if (currentUnlocked >= MAX_FARM_PLOTS) return 0;
  const extra = Math.max(0, currentUnlocked - BASE_UNLOCKED_PLOTS);
  // Tiered progressive costs
  const costs = [
    150,  // Plot 13
    220,  // Plot 14
    320,  // Plot 15
    450,  // Plot 16
    620,  // Plot 17
    850,  // Plot 18
    1150, // Plot 19
    1550, // Plot 20
    2050, // Plot 21
    2700, // Plot 22
    3500, // Plot 23
    4500, // Plot 24
  ];
  return costs[extra] || Math.round(150 * Math.pow(1.35, extra));
}
