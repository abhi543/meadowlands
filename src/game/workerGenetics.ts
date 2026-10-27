/**
 * Worker Genetics System - Phase 1 & 2: Genetic Profiles, Generational Inheritance & Retirement
 *
 * Defines the genetic profile data model, generational speed doubling,
 * inheritance mechanics, and ancestor hall-of-fame records.
 *
 * Core Rules:
 * - Each worker possesses 5 fundamental traits ranging from 0 to 100:
 *   Strength, Stamina, Farming Aptitude, Learning Ability, Work Efficiency.
 * - Max Level 120 workers are eligible for Honorable Retirement.
 * - When a worker retires, automation resets to Level 1, but the next generation is:
 *   - 2x faster (2^(generation - 1))
 *   - Inherits predecessor traits with generational mentorship evolution
 *   - Awards a golden pension payout (coins & gems) to the farm
 *   - Inducted into the Dynastic Hall of Fame
 */

export interface WorkerGenetics {
  /** Strength rating (0 - 100) */
  strength: number;
  /** Stamina rating (0 - 100) */
  stamina: number;
  /** Farming Aptitude rating (0 - 100) */
  farmingAptitude: number;
  /** Learning Ability rating (0 - 100) */
  learningAbility: number;
  /** Work Efficiency rating (0 - 100) */
  workEfficiency: number;
}

export interface WorkerAncestorRecord {
  id: string;
  role: string;
  workerName: string;
  generation: number;
  retiredAt: number;
  finalLevel: number;
  pensionCoins: number;
  pensionGems: number;
  careerCoins: number;
  careerItems: number;
  careerGems: number;
  genetics: WorkerGenetics;
}

export const RETIREMENT_REQUIRED_LEVEL = 120;

/**
 * Validates that an object contains a complete, well-formed genetic profile
 * with all five numerical traits strictly clamped between 0 and 100.
 */
export function isValidWorkerGenetics(g: unknown): g is WorkerGenetics {
  if (!g || typeof g !== 'object') return false;
  const candidate = g as Partial<WorkerGenetics>;
  return (
    typeof candidate.strength === 'number' &&
    Number.isFinite(candidate.strength) &&
    candidate.strength >= 0 &&
    candidate.strength <= 100 &&
    typeof candidate.stamina === 'number' &&
    Number.isFinite(candidate.stamina) &&
    candidate.stamina >= 0 &&
    candidate.stamina <= 100 &&
    typeof candidate.farmingAptitude === 'number' &&
    Number.isFinite(candidate.farmingAptitude) &&
    candidate.farmingAptitude >= 0 &&
    candidate.farmingAptitude <= 100 &&
    typeof candidate.learningAbility === 'number' &&
    Number.isFinite(candidate.learningAbility) &&
    candidate.learningAbility >= 0 &&
    candidate.learningAbility <= 100 &&
    typeof candidate.workEfficiency === 'number' &&
    Number.isFinite(candidate.workEfficiency) &&
    candidate.workEfficiency >= 0 &&
    candidate.workEfficiency <= 100
  );
}

/**
 * Generates an initial random genetic profile for a human worker.
 * Each trait is an integer between 0 and 100 inclusive.
 */
export function generateRandomWorkerGenetics(): WorkerGenetics {
  return {
    strength: Math.floor(Math.random() * 101),
    stamina: Math.floor(Math.random() * 101),
    farmingAptitude: Math.floor(Math.random() * 101),
    learningAbility: Math.floor(Math.random() * 101),
    workEfficiency: Math.floor(Math.random() * 101),
  };
}

/**
 * Ensures a worker has a valid genetic profile.
 * - If the worker already has an existing valid genetic profile, it is returned intact.
 * - If the worker lacks genetics, a new random profile is generated.
 * - Existing profiles are NEVER overwritten.
 */
export function ensureWorkerGenetics(existing?: WorkerGenetics | null): WorkerGenetics {
  if (existing && isValidWorkerGenetics(existing)) {
    return existing;
  }
  return generateRandomWorkerGenetics();
}

/**
 * Calculates the generational speed multiplier.
 * Each generation is 2x faster than the baseline:
 * - Gen 1 = 1x
 * - Gen 2 = 2x
 * - Gen 3 = 4x
 * - Gen 4 = 8x
 * - Formula: 2^(generation - 1)
 */
export function getGenerationalSpeedMultiplier(generation: number = 1): number {
  const gen = Math.max(1, Math.floor(generation));
  return Math.pow(2, gen - 1);
}

/**
 * Generates inherited genetics for the next generation.
 * Successors inherit the parental genetic profile with positive generational mentorship
 * and adaptation drift (+1 to +5 trait improvement, strictly capped at 100).
 */
export function inheritWorkerGenetics(parentGenetics: WorkerGenetics): WorkerGenetics {
  const clamp = (val: number) => Math.min(100, Math.max(0, Math.round(val)));
  const evolve = (val: number) => {
    // Generational evolution drift (+1 to +5 boost)
    const drift = Math.floor(Math.random() * 5) + 1;
    return clamp(val + drift);
  };

  return {
    strength: evolve(parentGenetics.strength),
    stamina: evolve(parentGenetics.stamina),
    farmingAptitude: evolve(parentGenetics.farmingAptitude),
    learningAbility: evolve(parentGenetics.learningAbility),
    workEfficiency: evolve(parentGenetics.workEfficiency),
  };
}

/**
 * Determines whether a worker is eligible for retirement.
 * Requires hitting Max Level 120 (Endgame Prestige).
 */
export function canWorkerRetire(level: number): boolean {
  return level >= RETIREMENT_REQUIRED_LEVEL;
}

/**
 * Calculates the golden retirement pension and severance package.
 */
export function calculateRetirementSeverance(generation: number = 1): {
  coins: number;
  gems: number;
  pensionCoins: number;
  pensionGems: number;
} {
  const gen = Math.max(1, Math.floor(generation));
  const coins = 50000 * gen;
  const gems = 25 * gen;
  return {
    coins,
    gems,
    pensionCoins: coins,
    pensionGems: gems,
  };
}

/**
 * Formats a generation number into Roman numerals (e.g., 1 -> I, 2 -> II, 3 -> III).
 */
export function toRomanNumeral(num: number): string {
  const lookup: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let n = Math.max(1, Math.floor(num));
  let result = '';
  for (const [value, roman] of lookup) {
    while (n >= value) {
      result += roman;
      n -= value;
    }
  }
  return result;
}
