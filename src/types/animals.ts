export type AnimalTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface SectorConfig {
  tier: AnimalTier;
  title: string;
  badgeColor: string;
  borderColor: string;
  textColor: string;
  bgGradient: string;
  roleDescription: string;
  passivePerk: string;
  maxCapacity: number; // exactly 4 per sector (16 total slots)
}

export const TIER_SECTORS: Record<AnimalTier, SectorConfig> = {
  common: {
    tier: 'common',
    title: 'Common Pasture',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
    borderColor: 'border-emerald-300 dark:border-emerald-500/40',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    bgGradient: 'from-emerald-50 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-stone-900/90',
    roleDescription: 'Bulk Raw Producers',
    passivePerk: 'Safe Overclock (0% Burnout)',
    maxCapacity: 4,
  },
  uncommon: {
    tier: 'uncommon',
    title: 'Uncommon Grove',
    badgeColor: 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-500/40',
    borderColor: 'border-sky-300 dark:border-sky-500/40',
    textColor: 'text-sky-800 dark:text-sky-300',
    bgGradient: 'from-sky-50 via-cyan-50/40 to-white dark:from-sky-950/40 dark:via-sky-900/20 dark:to-stone-900/90',
    roleDescription: 'Artisan Refiners',
    passivePerk: '+15% Speed Aura',
    maxCapacity: 4,
  },
  rare: {
    tier: 'rare',
    title: 'Rare Sanctuary',
    badgeColor: 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/40',
    borderColor: 'border-purple-300 dark:border-purple-500/40',
    textColor: 'text-purple-800 dark:text-purple-300',
    bgGradient: 'from-purple-50 via-violet-50/40 to-white dark:from-purple-950/40 dark:via-purple-900/20 dark:to-stone-900/90',
    roleDescription: 'Wilderness Mounts',
    passivePerk: 'Wild Mount & Hazard Ward',
    maxCapacity: 4,
  },
  legendary: {
    tier: 'legendary',
    title: 'Legendary Shrine',
    badgeColor: 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-500/40',
    borderColor: 'border-amber-300 dark:border-amber-500/50',
    textColor: 'text-amber-800 dark:text-amber-300',
    bgGradient: 'from-amber-50 via-yellow-50/50 to-white dark:from-amber-950/40 dark:via-amber-900/25 dark:to-stone-900/90',
    roleDescription: 'Celestial Guardians',
    passivePerk: 'Crisis Deterrent & Gem Yield',
    maxCapacity: 4,
  },
};
