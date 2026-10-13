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
    title: 'Common Paddock',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderColor: 'border-emerald-600/30',
    textColor: 'text-emerald-400',
    bgGradient: 'from-emerald-950/25 to-slate-900',
    roleDescription: 'Bulk Raw Producers',
    passivePerk: 'Safe Overclock (0% Burnout)',
    maxCapacity: 4,
  },
  uncommon: {
    tier: 'uncommon',
    title: 'Uncommon Grove',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    borderColor: 'border-sky-600/30',
    textColor: 'text-sky-400',
    bgGradient: 'from-sky-950/25 to-slate-900',
    roleDescription: 'Artisan Refiners',
    passivePerk: '+15% Speed Aura',
    maxCapacity: 4,
  },
  rare: {
    tier: 'rare',
    title: 'Rare Enclave',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    borderColor: 'border-purple-600/30',
    textColor: 'text-purple-400',
    bgGradient: 'from-purple-950/25 to-slate-900',
    roleDescription: 'Wilderness Mounts',
    passivePerk: 'Wild Mount & Hazard Ward',
    maxCapacity: 4,
  },
  legendary: {
    tier: 'legendary',
    title: 'Legendary Shrine',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderColor: 'border-amber-600/30',
    textColor: 'text-amber-400',
    bgGradient: 'from-amber-950/25 to-slate-900',
    roleDescription: 'Celestial Guardians',
    passivePerk: 'Crisis Deterrent & Gem Yield',
    maxCapacity: 4,
  },
};
