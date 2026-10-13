export type AnimalTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface SectorConfig {
  tier: AnimalTier;
  title: string;
  badgeColor: string;
  borderColor: string;
  bgGradient: string;
  roleDescription: string;
  passivePerk: string;
  maxCapacity: number; // e.g., 4 per sector
}

export const TIER_SECTORS: Record<AnimalTier, SectorConfig> = {
  common: {
    tier: 'common',
    title: 'Common Pasture',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderColor: 'border-emerald-500/30',
    bgGradient: 'from-emerald-950/20 to-slate-900',
    roleDescription: 'Bulk Raw Producers',
    passivePerk: '⚡ Safe Overclock (0% burnout)',
    maxCapacity: 4,
  },
  uncommon: {
    tier: 'uncommon',
    title: 'Uncommon Grove',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    borderColor: 'border-sky-500/30',
    bgGradient: 'from-sky-950/20 to-slate-900',
    roleDescription: 'Artisan Refiners',
    passivePerk: '💨 +15% Speed Coop Aura',
    maxCapacity: 4,
  },
  rare: {
    tier: 'rare',
    title: 'Rare Enclave',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    borderColor: 'border-purple-500/30',
    bgGradient: 'from-purple-950/20 to-slate-900',
    roleDescription: 'Wilderness Mounts',
    passivePerk: '🛡️ Wild Hazard Immunity',
    maxCapacity: 4,
  },
  legendary: {
    tier: 'legendary',
    title: 'Legendary Sanctuary',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderColor: 'border-amber-500/30',
    bgGradient: 'from-amber-950/20 to-slate-900',
    roleDescription: 'Celestial Guardians',
    passivePerk: '👑 Crisis Deterrent & Gem Yield',
    maxCapacity: 4,
  },
};
