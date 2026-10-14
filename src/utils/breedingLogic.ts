export type AnimalTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Animal {
  id: string;
  name: string;
  species: 'chicken' | 'cow' | 'sheep';
  tier: AnimalTier;
  icon: string;
  level: number;
}

export function rollBreedingTier(parent1Tier: AnimalTier, parent2Tier: AnimalTier, bonusMutationPercent: number = 0): AnimalTier {
  const roll = Math.random() * 100; // 0 to 100
  const boost = Math.max(0, bonusMutationPercent);

  // Combine tiers to calculate odds
  const pair = [parent1Tier, parent2Tier].sort().join('+');

  switch (pair) {
    case 'common+common':
      return roll < (15 + boost) ? 'uncommon' : 'common'; // +boost% mutation to Uncommon

    case 'common+uncommon':
      if (roll < (5 + boost * 0.5)) return 'rare'; // boosted Rare mutation
      if (roll < (55 + boost)) return 'uncommon';
      return 'common';

    case 'uncommon+uncommon':
      if (roll < (15 + boost)) return 'rare'; // boosted Rare mutation
      if (roll < (80 + boost * 0.5)) return 'uncommon';
      return 'common';

    case 'rare+uncommon':
      if (roll < (5 + boost * 0.5)) return 'legendary'; // boosted Legendary jackpot
      if (roll < (50 + boost)) return 'rare';
      return 'uncommon';

    case 'rare+rare':
      if (roll < (12 + boost)) return 'legendary'; // boosted Legendary jackpot
      return 'rare';

    case 'legendary+rare':
    case 'legendary+legendary':
      if (roll < (35 + boost)) return 'legendary';
      return 'rare';

    case 'common+rare':
      if (roll < (5 + boost * 0.5)) return 'rare';
      if (roll < (45 + boost)) return 'uncommon';
      return 'common';

    case 'legendary+uncommon':
      if (roll < (10 + boost * 0.5)) return 'legendary';
      if (roll < (60 + boost)) return 'rare';
      return 'uncommon';

    case 'common+legendary':
      if (roll < (8 + boost * 0.5)) return 'legendary';
      if (roll < (40 + boost * 0.7)) return 'rare';
      if (roll < (75 + boost)) return 'uncommon';
      return 'common';

    default:
      return 'common';
  }
}

export const INCUBATION_TIMES: Record<AnimalTier, number> = {
  common: 120,     // 2 minutes (in seconds)
  uncommon: 300,   // 5 minutes
  rare: 600,       // 10 minutes
  legendary: 1200, // 20 minutes
};

export interface BreedingOddsBreakdown {
  common: number;
  uncommon: number;
  rare: number;
  legendary: number;
  upwardMutationChance: number;
  description: string;
}

export function getBreedingOddsBreakdown(parent1Tier: AnimalTier, parent2Tier: AnimalTier, bonusMutationPercent: number = 0): BreedingOddsBreakdown {
  const pair = [parent1Tier, parent2Tier].sort().join('+');
  const boost = Math.max(0, bonusMutationPercent);
  const boostText = boost > 0 ? ` (+${boost}% Well-Fed Bonus!)` : '';

  switch (pair) {
    case 'common+common':
      return {
        common: Math.max(0, 85 - boost),
        uncommon: 15 + boost,
        rare: 0,
        legendary: 0,
        upwardMutationChance: 15 + boost,
        description: `${15 + boost}% Chance to Mutate Up to Uncommon!${boostText}`,
      };

    case 'common+uncommon':
      return {
        common: Math.max(0, 45 - boost),
        uncommon: 50,
        rare: 5 + boost,
        legendary: 0,
        upwardMutationChance: 5 + boost,
        description: `${5 + boost}% Chance for Rare Jackpot Mutation!${boostText}`,
      };

    case 'uncommon+uncommon':
      return {
        common: Math.max(0, 20 - boost),
        uncommon: 65,
        rare: 15 + boost,
        legendary: 0,
        upwardMutationChance: 15 + boost,
        description: `${15 + boost}% Chance to Mutate Up to Rare!${boostText}`,
      };

    case 'rare+uncommon':
      return {
        common: 0,
        uncommon: Math.max(0, 50 - boost),
        rare: 45,
        legendary: 5 + boost,
        upwardMutationChance: 5 + boost,
        description: `${5 + boost}% Chance for Legendary Zenith Mutation!${boostText}`,
      };

    case 'rare+rare':
      return {
        common: 0,
        uncommon: 0,
        rare: Math.max(0, 88 - boost),
        legendary: 12 + boost,
        upwardMutationChance: 12 + boost,
        description: `${12 + boost}% Chance for Legendary Zenith Mutation!${boostText}`,
      };

    case 'legendary+rare':
    case 'legendary+legendary':
      return {
        common: 0,
        uncommon: 0,
        rare: Math.max(0, 65 - boost),
        legendary: 35 + boost,
        upwardMutationChance: 35 + boost,
        description: `${35 + boost}% Chance for Legendary Offspring!${boostText}`,
      };

    case 'common+rare':
      return {
        common: Math.max(0, 55 - boost),
        uncommon: 40,
        rare: 5 + boost,
        legendary: 0,
        upwardMutationChance: 5 + boost,
        description: `Cross-tier hybrid breeding odds${boostText}`,
      };

    case 'legendary+uncommon':
      return {
        common: 0,
        uncommon: Math.max(0, 40 - boost),
        rare: 50,
        legendary: 10 + boost,
        upwardMutationChance: 10 + boost,
        description: `High-tier bloodline influence${boostText}`,
      };

    case 'common+legendary':
      return {
        common: Math.max(0, 25 - boost),
        uncommon: 35,
        rare: 32,
        legendary: 8 + boost,
        upwardMutationChance: 8 + boost,
        description: `Wild royal lineage mutation${boostText}`,
      };

    default:
      return {
        common: 100,
        uncommon: 0,
        rare: 0,
        legendary: 0,
        upwardMutationChance: 0,
        description: 'Standard offspring probability',
      };
  }
}
