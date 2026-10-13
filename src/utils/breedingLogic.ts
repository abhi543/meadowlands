export type AnimalTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Animal {
  id: string;
  name: string;
  species: 'chicken' | 'cow' | 'sheep';
  tier: AnimalTier;
  icon: string;
  level: number;
}

export function rollBreedingTier(parent1Tier: AnimalTier, parent2Tier: AnimalTier): AnimalTier {
  const roll = Math.random() * 100; // 0 to 100

  // Combine tiers to calculate odds
  const pair = [parent1Tier, parent2Tier].sort().join('+');

  switch (pair) {
    case 'common+common':
      return roll < 15 ? 'uncommon' : 'common'; // 15% mutation to Uncommon

    case 'common+uncommon':
      if (roll < 5) return 'rare'; // 5% Rare mutation
      if (roll < 55) return 'uncommon';
      return 'common';

    case 'uncommon+uncommon':
      if (roll < 15) return 'rare'; // 15% Rare mutation
      if (roll < 80) return 'uncommon';
      return 'common';

    case 'rare+uncommon':
      if (roll < 5) return 'legendary'; // 5% Legendary jackpot
      if (roll < 50) return 'rare';
      return 'uncommon';

    case 'rare+rare':
      if (roll < 12) return 'legendary'; // 12% Legendary jackpot
      return 'rare';

    case 'legendary+rare':
    case 'legendary+legendary':
      if (roll < 35) return 'legendary';
      return 'rare';

    case 'common+rare':
      if (roll < 5) return 'rare'; // 5% Rare mutation
      if (roll < 45) return 'uncommon';
      return 'common';

    case 'legendary+uncommon':
      if (roll < 10) return 'legendary';
      if (roll < 60) return 'rare';
      return 'uncommon';

    case 'common+legendary':
      if (roll < 8) return 'legendary';
      if (roll < 40) return 'rare';
      if (roll < 75) return 'uncommon';
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

export function getBreedingOddsBreakdown(parent1Tier: AnimalTier, parent2Tier: AnimalTier): BreedingOddsBreakdown {
  const pair = [parent1Tier, parent2Tier].sort().join('+');

  switch (pair) {
    case 'common+common':
      return {
        common: 85,
        uncommon: 15,
        rare: 0,
        legendary: 0,
        upwardMutationChance: 15,
        description: '15% Chance to Mutate Up to Uncommon!',
      };

    case 'common+uncommon':
      return {
        common: 45,
        uncommon: 50,
        rare: 5,
        legendary: 0,
        upwardMutationChance: 5,
        description: '5% Chance for Rare Jackpot Mutation!',
      };

    case 'uncommon+uncommon':
      return {
        common: 20,
        uncommon: 65,
        rare: 15,
        legendary: 0,
        upwardMutationChance: 15,
        description: '15% Chance to Mutate Up to Rare!',
      };

    case 'rare+uncommon':
      return {
        common: 0,
        uncommon: 50,
        rare: 45,
        legendary: 5,
        upwardMutationChance: 5,
        description: '5% Chance for Legendary Zenith Mutation!',
      };

    case 'rare+rare':
      return {
        common: 0,
        uncommon: 0,
        rare: 88,
        legendary: 12,
        upwardMutationChance: 12,
        description: '12% Chance for Legendary Zenith Mutation!',
      };

    case 'legendary+rare':
    case 'legendary+legendary':
      return {
        common: 0,
        uncommon: 0,
        rare: 65,
        legendary: 35,
        upwardMutationChance: 35,
        description: '35% Chance for Legendary Offspring!',
      };

    case 'common+rare':
      return {
        common: 55,
        uncommon: 40,
        rare: 5,
        legendary: 0,
        upwardMutationChance: 5,
        description: 'Cross-tier hybrid breeding odds',
      };

    case 'legendary+uncommon':
      return {
        common: 0,
        uncommon: 40,
        rare: 50,
        legendary: 10,
        upwardMutationChance: 10,
        description: 'High-tier bloodline influence',
      };

    case 'common+legendary':
      return {
        common: 25,
        uncommon: 35,
        rare: 32,
        legendary: 8,
        upwardMutationChance: 8,
        description: 'Wild royal lineage mutation',
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
