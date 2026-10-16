import {
  WORKER_UPKEEP_ROSTER,
  COMMISSARY_FOOD_ITEMS,
  type FoodCategory,
  type WorkerUpkeepConfig,
} from '@/data/workerUpkeep';
import { LIVESTOCK_WORKER_ROSTER } from '@/data/workerCatalog';

export const DESERTION_DURATION_SEC = 7200; // 2 Real-World Hours (120 in-game hours / 4 day cycles)
export const GUILD_PENALTY_RATE = 0.25; // 25% flat fine
export const APPRECIATED_DURATION_MS = 1800 * 1000; // 30-min cycle (1 upcoming shift)
export const APPRECIATED_SPEED_BOOST = 0.10; // +10% work speed

export interface StrikeGrievanceDossier {
  workerId: string;
  workerName: string;
  workerRoleOrTitle: string;
  workerEmoji: string;
  isSpecialist: boolean;
  isStriking: boolean;
  isSabbatical: boolean;
  moraleTier: string;
  missedCycles: number;
  baseDailyWage: number;
  accruedBackWages: number;
  guildPenaltyFee: number;
  totalSettleCoins: number;
  dietaryCategory: FoodCategory;
  dietaryCategoryLabel: string;
  dietaryUnitsPerCycle: number;
  rationsDemandedTotal: number;
  availableFoodItems: { id: string; name: string; icon: string; count: number }[];
  totalAvailableFoodUnits: number;
  severanceFeeCoins: number;
  strikeStartedAt: number | null;
  desertionDeadline: number | null;
  desertionRemainingSeconds: number;
  desertionFormatted: string;
  isDesertionExpired: boolean;
  canAffordAccordCoins: boolean;
  canAffordAccordFood: boolean;
  canAffordSeverance: boolean;
  canSignAccord: boolean;
  sabbaticalGrantedAt: number | null;
}

/**
 * Calculates financial debt, commissary shortage, and desertion threat for any striking or furloughed worker.
 */
export function calculateGrievanceDossier(params: {
  workerId: string;
  workerObj: any;
  coins: number;
  payrollVaultCoins: number;
  staffPantry: Record<string, number>;
  silo: Record<string, number>;
  barn: Record<string, number>;
  timestamp?: number;
}): StrikeGrievanceDossier {
  const {
    workerId,
    workerObj,
    coins,
    payrollVaultCoins,
    staffPantry = {},
    silo = {},
    barn = {},
    timestamp = Date.now(),
  } = params;

  const config: WorkerUpkeepConfig = WORKER_UPKEEP_ROSTER[workerId] || {
    roleOrId: workerId,
    name: workerId,
    emoji: '👷',
    baseDailyWage: 20,
    dietaryCategory: 'crop',
    dietaryUnits: 1,
    favoriteRecipe: 'bread',
    favoriteRecipeName: 'Fresh Bread',
    favoriteRecipeEmoji: '🍞',
  };

  const isSpecialist = Boolean(config.isSpecialist);
  const specialistMeta = isSpecialist ? LIVESTOCK_WORKER_ROSTER.find(r => r.id === workerId) : null;
  const workerName = specialistMeta?.name || config.name;
  const workerRoleOrTitle = specialistMeta?.title || config.name;
  const workerEmoji = specialistMeta?.avatar || config.emoji;

  const moraleTier = workerObj?.moraleTier || (workerObj?.isStriking ? 'striking' : 'content');
  const isSabbatical = moraleTier === 'sabbatical';
  const isStriking = moraleTier === 'striking' || Boolean(workerObj?.isStriking);

  const baseDailyWage = config.baseDailyWage;
  const missedCycles = Math.max(1, workerObj?.missedCycles || 2);

  // Financial Debt Calculations
  let accruedBackWages = baseDailyWage * missedCycles;
  let guildPenaltyFee = Math.round(accruedBackWages * GUILD_PENALTY_RATE);
  let totalSettleCoins = accruedBackWages + guildPenaltyFee;
  let rationsDemandedTotal = config.dietaryUnits * missedCycles;

  if (isSabbatical && workerObj?.sabbaticalLockedDebtCoins) {
    totalSettleCoins = workerObj.sabbaticalLockedDebtCoins;
    accruedBackWages = Math.round(totalSettleCoins / (1 + GUILD_PENALTY_RATE));
    guildPenaltyFee = totalSettleCoins - accruedBackWages;
    rationsDemandedTotal = workerObj?.sabbaticalLockedFoodUnits || rationsDemandedTotal;
  }

  // Severance Fee: Flat 1-Day Base Wage
  const severanceFeeCoins = baseDailyWage;

  // Desertion Deadline & Countdown
  let strikeStartedAt = workerObj?.strikeStartedAt || null;
  let desertionDeadline = workerObj?.desertionDeadline || null;

  if (isStriking && !desertionDeadline) {
    strikeStartedAt = strikeStartedAt || timestamp;
    desertionDeadline = strikeStartedAt + DESERTION_DURATION_SEC * 1000;
  }

  let desertionRemainingSeconds = 0;
  let desertionFormatted = '00h 00m 00s';
  let isDesertionExpired = false;

  if (isSabbatical) {
    desertionRemainingSeconds = workerObj?.sabbaticalRemainingDesertionSec || DESERTION_DURATION_SEC;
    const h = Math.floor(desertionRemainingSeconds / 3600);
    const m = Math.floor((desertionRemainingSeconds % 3600) / 60);
    const s = desertionRemainingSeconds % 60;
    desertionFormatted = `FROZEN (${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m)`;
  } else if (desertionDeadline) {
    desertionRemainingSeconds = Math.max(0, Math.ceil((desertionDeadline - timestamp) / 1000));
    isDesertionExpired = desertionRemainingSeconds <= 0;
    const h = Math.floor(desertionRemainingSeconds / 3600);
    const m = Math.floor((desertionRemainingSeconds % 3600) / 60);
    const s = desertionRemainingSeconds % 60;
    desertionFormatted = `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }

  // Food Availability across Staff Pantry and Silo/Barn
  const matchingFoodMeta = Object.values(COMMISSARY_FOOD_ITEMS).filter(
    item => item.category === config.dietaryCategory
  );

  const availableFoodItems: { id: string; name: string; icon: string; count: number }[] = [];
  let totalAvailableFoodUnits = 0;

  for (const item of matchingFoodMeta) {
    const pantryCount = staffPantry[item.id] || 0;
    const storageCount = item.category === 'crop' ? (silo[item.id] || 0) : (barn[item.id] || 0);
    const totalCount = pantryCount + storageCount;
    if (totalCount > 0) {
      availableFoodItems.push({
        id: item.id,
        name: item.name,
        icon: item.icon,
        count: totalCount,
      });
      totalAvailableFoodUnits += totalCount;
    }
  }

  const categoryLabels: Record<FoodCategory, string> = {
    crop: 'Raw Crops (Silo/Pantry)',
    dairy: 'Dairy Products (Barn/Pantry)',
    protein: 'Protein & Eggs (Barn/Pantry)',
    meal: 'Cooked Meals (Barn/Pantry)',
  };

  const totalCurrencyAvailable = (payrollVaultCoins || 0) + (coins || 0);
  const canAffordAccordCoins = totalCurrencyAvailable >= totalSettleCoins;
  const canAffordAccordFood = totalAvailableFoodUnits >= rationsDemandedTotal;
  const canAffordSeverance = (coins || 0) >= severanceFeeCoins;
  const canSignAccord = canAffordAccordCoins && canAffordAccordFood;

  return {
    workerId,
    workerName,
    workerRoleOrTitle,
    workerEmoji,
    isSpecialist,
    isStriking,
    isSabbatical,
    moraleTier,
    missedCycles,
    baseDailyWage,
    accruedBackWages,
    guildPenaltyFee,
    totalSettleCoins,
    dietaryCategory: config.dietaryCategory,
    dietaryCategoryLabel: categoryLabels[config.dietaryCategory] || 'Food Rations',
    dietaryUnitsPerCycle: config.dietaryUnits,
    rationsDemandedTotal,
    availableFoodItems,
    totalAvailableFoodUnits,
    severanceFeeCoins,
    strikeStartedAt,
    desertionDeadline,
    desertionRemainingSeconds,
    desertionFormatted,
    isDesertionExpired,
    canAffordAccordCoins,
    canAffordAccordFood,
    canAffordSeverance,
    canSignAccord,
    sabbaticalGrantedAt: workerObj?.sabbaticalGrantedAt || null,
  };
}
