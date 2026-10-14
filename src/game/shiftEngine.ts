import {
  WORKER_UPKEEP_ROSTER,
  COMMISSARY_FOOD_ITEMS,
  getGuildTaxRate,
  type MoraleTier,
} from '@/data/workerUpkeep';

/**
 * Shift Engine & Circadian Labor Cycle Architecture
 * 
 * Calibrated Time Scale:
 * - 24 In-Game Hours = 30 Real-World Minutes (1,800 Real Seconds = 1,800,000 ms).
 * - 1 In-Game Hour = 1.25 Real-World Minutes (75 Real Seconds = 75,000 ms).
 * - Active Work Shift (8 In-Game Hours) = Exactly 10 Real-World Minutes (600 Real Seconds = 600,000 ms).
 * - Off-Duty / Rest Window (16 In-Game Hours) = Exactly 20 Real-World Minutes (1,200 Real Seconds = 1,200,000 ms).
 *   - Phase 3: Recreation & Digestion (4 In-Game Hours = 5 Real Minutes = 300 Real Seconds).
 *   - Phase 4: Bunkhouse Sleep (12 In-Game Hours = 15 Real Minutes = 900 Real Seconds).
 */

export type ShiftType = 'morning' | 'evening' | 'night';

export type OperationalPhase = 'on_shift' | 'recreation' | 'sleeping';

export interface ShiftDefinition {
  type: ShiftType;
  name: string;
  shortName: string;
  timeRange: string;
  startInGameHour: number;
  endInGameHour: number;
  cycleWorkStartSec: number;
  cycleWorkEndSec: number;
  recreationEndSec: number;
  responsibilities: string;
  icon: string;
  color: string;
  bgGradient: string;
}

export const DAY_CYCLE_MS = 1800000; // 30 real minutes
export const DAY_CYCLE_SEC = 1800; // 1800 real seconds
export const IN_GAME_HOURS_PER_DAY = 24;
export const IN_GAME_MINUTES_PER_DAY = 1440;
export const SEC_PER_IN_GAME_HOUR = 75; // 75 real seconds = 1 in-game hour
export const MS_PER_IN_GAME_HOUR = 75000;
export const SHIFT_WORK_SEC = 600; // 10 real minutes (8 in-game hours)
export const SHIFT_RECREATION_SEC = 300; // 5 real minutes (4 in-game hours)
export const SHIFT_SLEEP_SEC = 900; // 15 real minutes (12 in-game hours)
export const OVERTIME_DURATION_MS = 300000; // 5 real minutes = 4 in-game hours
export const SHIFT_ADJUST_DURATION_MS = 1800000; // 1 full day (30 real minutes)

export const SHIFT_DEFINITIONS: Record<ShiftType, ShiftDefinition> = {
  morning: {
    type: 'morning',
    name: 'Morning Shift (The Early Riser)',
    shortName: 'Morning',
    timeRange: '06:00 – 14:00',
    startInGameHour: 6,
    endInGameHour: 14,
    cycleWorkStartSec: 0,
    cycleWorkEndSec: 600,
    recreationEndSec: 900,
    responsibilities: 'Field irrigation, seed planting, morning livestock milking, and egg harvesting.',
    icon: '🌅',
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/20 to-yellow-500/10',
  },
  evening: {
    type: 'evening',
    name: 'Evening Shift (The Midday Relay)',
    shortName: 'Evening',
    timeRange: '14:00 – 22:00',
    startInGameHour: 14,
    endInGameHour: 22,
    cycleWorkStartSec: 600,
    cycleWorkEndSec: 1200,
    recreationEndSec: 1500,
    responsibilities: 'Artisan machine operation (cheese presses, smokers, grain mills) and wild cart hauling.',
    icon: '☀️',
    color: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-amber-500/10',
  },
  night: {
    type: 'night',
    name: 'Night Shift (The Night Watch)',
    shortName: 'Night',
    timeRange: '22:00 – 06:00',
    startInGameHour: 22,
    endInGameHour: 6,
    cycleWorkStartSec: 1200,
    cycleWorkEndSec: 1800,
    recreationEndSec: 300,
    responsibilities: 'Tending nocturnal wild beasts, security against wildlife crop theft, and late-night baking.',
    icon: '🌙',
    color: 'text-indigo-400',
    bgGradient: 'from-indigo-500/20 to-purple-500/10',
  },
};

export interface CircadianClockInfo {
  currentDay: number;
  inGameTimeFormatted: string; // e.g. "14:20 PM"
  inGameTime24: string; // e.g. "14:20"
  inGameHour: number;
  inGameMinute: number;
  currentPeriod: 'day' | 'dusk' | 'night';
  periodLabel: string;
  periodEmoji: string;
  periodThemeColor: string;
  cycleElapsedSeconds: number; // 0..1799
  cycleProgressPct: number; // 0..100
  secondsToNextShiftChange: number;
  nextShiftChangeFormatted: string; // "MM:SS"
  activeShift: ShiftType;
  activeShiftDef: ShiftDefinition;
}

/**
 * Calculates in-game clock and circadian time based on absolute epoch timestamp.
 */
export function getCircadianClock(timestamp: number, epochStart: number = 0): CircadianClockInfo {
  const safeEpoch = epochStart > 0 ? epochStart : 0;
  const elapsedMs = Math.max(0, timestamp - safeEpoch);
  const currentDay = Math.floor(elapsedMs / DAY_CYCLE_MS) + 1;
  const cycleElapsedMs = elapsedMs % DAY_CYCLE_MS;
  const cycleElapsedSeconds = Math.floor(cycleElapsedMs / 1000);
  const cycleProgressPct = (cycleElapsedSeconds / DAY_CYCLE_SEC) * 100;

  // In-game 24-hour clock: Day starts at 06:00 (360 minutes from 00:00)
  // 1800 real seconds = 1440 in-game minutes (0.8 minutes per second)
  const inGameTotalMinutes = (360 + Math.floor(cycleElapsedSeconds * 0.8)) % 1440;
  const inGameHour = Math.floor(inGameTotalMinutes / 60);
  const inGameMinute = inGameTotalMinutes % 60;

  // Format 12h and 24h
  const paddedMinute = inGameMinute.toString().padStart(2, '0');
  const paddedHour24 = inGameHour.toString().padStart(2, '0');
  const inGameTime24 = `${paddedHour24}:${paddedMinute}`;

  const isPM = inGameHour >= 12;
  const hour12 = inGameHour % 12 === 0 ? 12 : inGameHour % 12;
  const inGameTimeFormatted = `${hour12}:${paddedMinute} ${isPM ? 'PM' : 'AM'}`;

  // Period: Day (06:00 - 18:00), Dusk (18:00 - 22:00), Night (22:00 - 06:00)
  let currentPeriod: 'day' | 'dusk' | 'night' = 'day';
  let periodLabel = 'Day (Sunlit Fields)';
  let periodEmoji = '☀️';
  let periodThemeColor = '#f59e0b'; // Gold

  if (inGameHour >= 18 && inGameHour < 22) {
    currentPeriod = 'dusk';
    periodLabel = 'Dusk (Twilight Glow)';
    periodEmoji = '🌇';
    periodThemeColor = '#ea580c'; // Amber
  } else if (inGameHour >= 22 || inGameHour < 6) {
    currentPeriod = 'night';
    periodLabel = 'Night (Starry Quiet)';
    periodEmoji = '🌙';
    periodThemeColor = '#6366f1'; // Deep Indigo
  }

  // Next shift change boundary: 0s (Morning), 600s (Evening), 1200s (Night)
  const secIntoShiftWindow = cycleElapsedSeconds % 600;
  const secondsToNextShiftChange = 600 - secIntoShiftWindow;
  const nextMin = Math.floor(secondsToNextShiftChange / 60);
  const nextSec = secondsToNextShiftChange % 60;
  const nextShiftChangeFormatted = `${nextMin.toString().padStart(2, '0')}:${nextSec.toString().padStart(2, '0')}`;

  // Currently active shift
  let activeShift: ShiftType = 'morning';
  if (cycleElapsedSeconds >= 600 && cycleElapsedSeconds < 1200) {
    activeShift = 'evening';
  } else if (cycleElapsedSeconds >= 1200) {
    activeShift = 'night';
  }

  return {
    currentDay,
    inGameTimeFormatted,
    inGameTime24,
    inGameHour,
    inGameMinute,
    currentPeriod,
    periodLabel,
    periodEmoji,
    periodThemeColor,
    cycleElapsedSeconds,
    cycleProgressPct,
    secondsToNextShiftChange,
    nextShiftChangeFormatted,
    activeShift,
    activeShiftDef: SHIFT_DEFINITIONS[activeShift],
  };
}

export interface WorkerScheduleTelemetry {
  shiftType: ShiftType;
  shiftDef: ShiftDefinition;
  phase: OperationalPhase;
  phaseLabel: string;
  phaseBadgeText: string;
  phaseBadgeEmoji: string;
  phaseColorClass: string;
  timeRemainingSeconds: number;
  timeRemainingFormatted: string;
  stamina: number; // 0..100
  isOnDuty: boolean;
  isOvertime: boolean;
  isAdjusting: boolean;
  isExhausted: boolean;
  isWellRested: boolean;
  canCallOvertime: boolean;
  overtimeCostCoins: number;
  overtimeSnackId: string;
  overtimeSnackName: string;
  speedMultiplier: number;
  dialogueSnippet: string;
}

/**
 * Calculates real-time labor telemetry, operational phase, and stamina for any worker.
 */
export function getWorkerScheduleTelemetry(params: {
  worker: any;
  roleOrId: string;
  baseDailyWage: number;
  timestamp: number;
  epochStart?: number;
  bunkhouseLevel?: number;
}): WorkerScheduleTelemetry {
  const {
    worker,
    roleOrId,
    baseDailyWage,
    timestamp,
    epochStart = 0,
    bunkhouseLevel = 1,
  } = params;

  const clock = getCircadianClock(timestamp, epochStart);
  const cycleSec = clock.cycleElapsedSeconds;

  const shiftType: ShiftType = (worker?.shiftType as ShiftType) || getDefaultWorkerShift(roleOrId);
  const shiftDef = SHIFT_DEFINITIONS[shiftType];

  const isOvertime = Boolean(worker?.overtimeUntil && timestamp < worker.overtimeUntil);
  const isAdjusting = Boolean(worker?.shiftAdjustingUntil && timestamp < worker.shiftAdjustingUntil);
  const isExhausted = Boolean(worker?.isExhausted || (worker?.exhaustedUntil && timestamp < worker.exhaustedUntil));
  const isWellRested = Boolean(worker?.wellRested);

  // Overtime calculations (1.5x hourly wage for 4 hours = 0.75 * baseDailyWage)
  const overtimeCostCoins = Math.max(1, Math.round(baseDailyWage * 0.75));
  const overtimeSnackId = 'wheat';
  const overtimeSnackName = 'Pantry Snack';

  // Base phase determination
  let phase: OperationalPhase = 'on_shift';
  let timeRemainingSeconds = 0;
  let stamina = 100;

  if (isOvertime) {
    phase = 'on_shift';
    timeRemainingSeconds = Math.max(0, Math.ceil(((worker.overtimeUntil || timestamp) - timestamp) / 1000));
    stamina = Math.max(10, Math.min(100, Math.round((timeRemainingSeconds / 300) * 80)));
  } else if (isAdjusting) {
    phase = 'recreation';
    timeRemainingSeconds = Math.max(0, Math.ceil(((worker.shiftAdjustingUntil || timestamp) - timestamp) / 1000));
    stamina = 50;
  } else {
    // Normal shift timeline based on cycleSec (0..1800)
    if (shiftType === 'morning') {
      if (cycleSec < 600) {
        // [0..600): Work Phase
        phase = 'on_shift';
        timeRemainingSeconds = 600 - cycleSec;
        const workProgress = cycleSec / 600;
        stamina = Math.max(5, Math.round((1 - workProgress) * 100));
      } else if (cycleSec < 900) {
        // [600..900): Recreation Phase
        phase = 'recreation';
        timeRemainingSeconds = 900 - cycleSec;
        stamina = 15;
      } else {
        // [900..1800): Sleep Phase
        phase = 'sleeping';
        timeRemainingSeconds = 1800 - cycleSec;
        const sleepProgress = (cycleSec - 900) / 900;
        stamina = Math.min(100, Math.round(sleepProgress * 100));
      }
    } else if (shiftType === 'evening') {
      if (cycleSec >= 600 && cycleSec < 1200) {
        // [600..1200): Work Phase
        phase = 'on_shift';
        timeRemainingSeconds = 1200 - cycleSec;
        const workProgress = (cycleSec - 600) / 600;
        stamina = Math.max(5, Math.round((1 - workProgress) * 100));
      } else if (cycleSec >= 1200 && cycleSec < 1500) {
        // [1200..1500): Recreation Phase
        phase = 'recreation';
        timeRemainingSeconds = 1500 - cycleSec;
        stamina = 15;
      } else {
        // [1500..1800) and [0..600): Sleep Phase (900 seconds total)
        phase = 'sleeping';
        if (cycleSec >= 1500) {
          timeRemainingSeconds = (1800 - cycleSec) + 600;
          const sleepProgress = (cycleSec - 1500) / 900;
          stamina = Math.min(100, Math.round(sleepProgress * 100));
        } else {
          timeRemainingSeconds = 600 - cycleSec;
          const sleepProgress = (300 + cycleSec) / 900;
          stamina = Math.min(100, Math.round(sleepProgress * 100));
        }
      }
    } else if (shiftType === 'night') {
      if (cycleSec >= 1200) {
        // [1200..1800): Work Phase
        phase = 'on_shift';
        timeRemainingSeconds = 1800 - cycleSec;
        const workProgress = (cycleSec - 1200) / 600;
        stamina = Math.max(5, Math.round((1 - workProgress) * 100));
      } else if (cycleSec < 300) {
        // [0..300): Recreation Phase
        phase = 'recreation';
        timeRemainingSeconds = 300 - cycleSec;
        stamina = 15;
      } else {
        // [300..1200): Sleep Phase (900 seconds total)
        phase = 'sleeping';
        timeRemainingSeconds = 1200 - cycleSec;
        const sleepProgress = (cycleSec - 300) / 900;
        stamina = Math.min(100, Math.round(sleepProgress * 100));
      }
    }
  }

  // Format time remaining
  const remMin = Math.floor(timeRemainingSeconds / 60);
  const remSec = timeRemainingSeconds % 60;
  const timeRemainingFormatted = `${remMin}m ${remSec.toString().padStart(2, '0')}s`;

  // Status badges & presentation
  let phaseLabel = 'Active on Duty';
  let phaseBadgeText = `🟢 Active on Duty — Shift ends in ${timeRemainingFormatted}`;
  let phaseBadgeEmoji = '🟢';
  let phaseColorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let dialogueSnippet = 'At work in the fields! Automation running smoothly.';

  if (isOvertime) {
    phaseLabel = 'Emergency Overtime';
    phaseBadgeText = `☕ Emergency Overtime — Ends in ${timeRemainingFormatted}`;
    phaseBadgeEmoji = '☕';
    phaseColorClass = 'text-amber-400 bg-amber-500/15 border-amber-500/40 animate-pulse';
    dialogueSnippet = 'Called in for urgent rush chores! Getting the job done.';
  } else if (isAdjusting) {
    phaseLabel = 'Shift Adjustment';
    phaseBadgeText = `🔄 Adapting to New Shift — Ready in ${timeRemainingFormatted}`;
    phaseBadgeEmoji = '🔄';
    phaseColorClass = 'text-blue-400 bg-blue-500/15 border-blue-500/30';
    dialogueSnippet = 'Resting and resetting internal rhythm for the new roster.';
  } else if (phase === 'on_shift') {
    phaseLabel = 'On Shift';
    phaseBadgeText = `🟢 Active on Duty — Shift ends in ${timeRemainingFormatted}`;
    phaseBadgeEmoji = '🟢';
    phaseColorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    dialogueSnippet = isWellRested
      ? 'Feeling well-rested and energized (+15% speed)!'
      : 'Working hard on assigned duties.';
  } else if (phase === 'recreation') {
    phaseLabel = 'Off-Duty (Recreation)';
    phaseBadgeText = `☕ Off-Duty (Communal Area) — Rest begins in ${timeRemainingFormatted}`;
    phaseBadgeEmoji = '☕';
    phaseColorClass = 'text-amber-300 bg-amber-500/10 border-amber-500/30';
    dialogueSnippet = worker?.moraleTier === 'inspired'
      ? 'Loved the meal! Relaxing by the fire with fellow hands.'
      : 'Off duty, enjoying warm tea and campfire conversation.';
  } else if (phase === 'sleeping') {
    phaseLabel = 'Asleep in Bunkhouse';
    phaseBadgeText = `🌙 Asleep in Bunkhouse — Wakes in ${timeRemainingFormatted}`;
    phaseBadgeEmoji = '🌙';
    phaseColorClass = 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30';
    dialogueSnippet = bunkhouseLevel >= 2
      ? 'Sleeping soundly on feather mattresses, restoring vigor!'
      : 'Asleep in the bunkhouse, recovering stamina for next shift.';
  }

  // Speed multiplier
  let speedMultiplier = 1.0;
  if (isExhausted) {
    speedMultiplier *= 0.6; // 60% speed when exhausted
  }
  if (isWellRested && phase === 'on_shift') {
    speedMultiplier *= 1.15; // +15% well-rested perk
  }

  const isOnDuty = Boolean(
    (phase === 'on_shift' || isOvertime) &&
    !isAdjusting &&
    !worker?.isPaused &&
    worker?.moraleTier !== 'striking' &&
    worker?.moraleTier !== 'deserted'
  );

  const canCallOvertime = Boolean(
    (phase === 'recreation' || phase === 'sleeping') &&
    !isOvertime &&
    !isExhausted &&
    !isAdjusting &&
    worker?.isHired &&
    worker?.moraleTier !== 'striking' &&
    worker?.moraleTier !== 'deserted'
  );

  return {
    shiftType,
    shiftDef,
    phase,
    phaseLabel,
    phaseBadgeText,
    phaseBadgeEmoji,
    phaseColorClass,
    timeRemainingSeconds,
    timeRemainingFormatted,
    stamina,
    isOnDuty,
    isOvertime,
    isAdjusting,
    isExhausted,
    isWellRested,
    canCallOvertime,
    overtimeCostCoins,
    overtimeSnackId,
    overtimeSnackName,
    speedMultiplier,
    dialogueSnippet,
  };
}

/**
 * Returns default shift assignment for each worker role to ensure balanced 24h coverage.
 */
export function getDefaultWorkerShift(roleOrId: string): ShiftType {
  const morningRoles = new Set([
    'farmer',
    'herder',
    'feed_miller_wheat',
    'feed_miller_corn',
    'auto_fisherman',
    'beekeeper',
    'worker_wrangler_tessa',
  ]);

  const eveningRoles = new Set([
    'lumberjack',
    'artisan',
    'feed_miller_carrot',
    'forager',
    'merchant',
    'worker_caravaner_orin',
  ]);

  if (morningRoles.has(roleOrId)) return 'morning';
  if (eveningRoles.has(roleOrId)) return 'evening';
  return 'night';
}

/**
 * Bunkhouse Accommodation Definitions
 */
export interface BunkhouseTierMeta {
  level: number;
  name: string;
  badge: string;
  description: string;
  perkDescription: string;
  coinCost: number;
  materialCostItem?: string;
  materialCostQty?: number;
}

export const BUNKHOUSE_TIERS: Record<number, BunkhouseTierMeta> = {
  1: {
    level: 1,
    name: 'Straw Pallets',
    badge: 'Basic Quarters',
    description: 'Rustic dried hay bedding providing standard shelter and stamina replenishment.',
    perkDescription: 'Standard stamina recovery; protects workers from harsh weather.',
    coinCost: 0,
  },
  2: {
    level: 2,
    name: 'Feather Mattresses',
    badge: 'Cozy Quarters',
    description: 'Plush goose-down bedding that fully relaxes workers during their sleep window.',
    perkDescription: 'Grants "Well-Rested" buff (+15% work speed during shift) upon 100% sleep restoration.',
    coinCost: 3500,
    materialCostItem: 'rich_butter',
    materialCostQty: 10,
  },
  3: {
    level: 3,
    name: 'Master Lodgings',
    badge: 'Luxury Quarters',
    description: 'Curtained cedar wood bunks with wool blankets, heated hearth, and herbal nightcaps.',
    perkDescription: 'Accelerates sleep recovery by 25% and grants Well-Rested buff with +20% task speed.',
    coinCost: 12000,
    materialCostItem: 'cheese',
    materialCostQty: 15,
  },
};

/**
 * Returns true if the worker's shift has reached its clock-out boundary within the current cycle.
 */
export function hasWorkerReachedClockOut(shiftType: ShiftType, cycleSeconds: number): boolean {
  if (shiftType === 'morning') {
    // Shift ends at 600s (14:00)
    return cycleSeconds >= 600;
  }
  if (shiftType === 'evening') {
    // Shift ends at 1200s (22:00)
    return cycleSeconds >= 1200;
  }
  if (shiftType === 'night') {
    // Shift ends at 1800s / 0s (06:00)
    return cycleSeconds < 1200;
  }
  return false;
}

export interface ClockOutSettlementResult {
  paidWage: boolean;
  fedRation: boolean;
  isInspired: boolean;
  wageCost: number;
  consumedFoodId: string | null;
  newPayrollCoins: number;
  newStaffPantry: Record<string, number>;
  newMissedCycles: number;
  newMoraleTier: MoraleTier;
  isStriking: boolean;
  isDeserted: boolean;
  notificationMessage: string | null;
}

/**
 * Settles a single worker's daily wage and food ration upon clocking out.
 * Strictly isolates deductions to the Payroll Vault and Staff Pantry.
 */
export function processSingleWorkerClockOut(params: {
  workerName: string;
  roleOrId: string;
  currentMissedCycles: number;
  payrollVaultCoins: number;
  staffPantry: Record<string, number>;
  activeWorkersCount: number;
}): ClockOutSettlementResult {
  const {
    workerName,
    roleOrId,
    currentMissedCycles,
    payrollVaultCoins,
    staffPantry,
    activeWorkersCount,
  } = params;

  const config = WORKER_UPKEEP_ROSTER[roleOrId];
  const baseWage = config?.baseDailyWage || 15;
  const taxRate = getGuildTaxRate(activeWorkersCount);
  const wageCost = Math.round(baseWage * (1 + taxRate));

  let remainingPayrollCoins = payrollVaultCoins;
  const updatedPantry = { ...staffPantry };

  const canAffordWage = remainingPayrollCoins >= wageCost;

  // Food ration check
  let canAffordFood = false;
  let isInspired = false;
  let chosenFoodId: string | null = null;

  if (config) {
    if ((updatedPantry[config.favoriteRecipe] || 0) > 0) {
      canAffordFood = true;
      isInspired = true;
      chosenFoodId = config.favoriteRecipe;
    } else {
      for (const [fId, qty] of Object.entries(updatedPantry)) {
        if (qty > 0 && COMMISSARY_FOOD_ITEMS[fId]?.category === config.dietaryCategory) {
          canAffordFood = true;
          chosenFoodId = fId;
          break;
        }
      }
    }
  }

  let newMissedCycles = currentMissedCycles;
  let newMoraleTier: MoraleTier = 'content';
  let isStriking = false;
  let isDeserted = false;
  let notificationMessage: string | null = null;

  if (canAffordWage && canAffordFood) {
    // Full settlement success
    remainingPayrollCoins -= wageCost;
    if (chosenFoodId) {
      updatedPantry[chosenFoodId] = Math.max(0, (updatedPantry[chosenFoodId] || 1) - 1);
      if (updatedPantry[chosenFoodId] === 0) {
        delete updatedPantry[chosenFoodId];
      }
    }
    newMissedCycles = 0;
    newMoraleTier = isInspired ? 'inspired' : 'content';
    notificationMessage = `✅ Clock-Out: ${workerName} completed 8-hour shift and received daily wage & meal from Vault!`;
  } else {
    // Shortage strike
    if (canAffordWage) {
      remainingPayrollCoins -= wageCost;
    }
    newMissedCycles += 1;
    if (newMissedCycles === 1) {
      newMoraleTier = 'grumbling';
      notificationMessage = `🟡 Missed Upkeep: ${workerName} clocked out without complete rations (Grumbling -50% speed).`;
    } else if (newMissedCycles >= 2 && newMissedCycles < 4) {
      newMoraleTier = 'striking';
      isStriking = true;
      notificationMessage = `🛑 Strike Alert: ${workerName} clocked out into strike due to consecutive missed upkeep!`;
    } else if (newMissedCycles >= 4) {
      newMoraleTier = 'deserted';
      isStriking = true;
      isDeserted = true;
      notificationMessage = `🚨 Desertion: ${workerName} abandoned contract after 4 unpaid shifts!`;
    }
  }

  return {
    paidWage: canAffordWage,
    fedRation: canAffordFood,
    isInspired,
    wageCost,
    consumedFoodId: chosenFoodId,
    newPayrollCoins: remainingPayrollCoins,
    newStaffPantry: updatedPantry,
    newMissedCycles,
    newMoraleTier,
    isStriking,
    isDeserted,
    notificationMessage,
  };
}

/**
 * Sequential offline shift processor for elapsed 30-minute cycles.
 */
export function processOfflineShiftCycles(params: {
  unifiedWorkers: Record<string, any>;
  specialistWorkers: Record<string, any>;
  payrollVaultCoins: number;
  staffPantry: Record<string, number>;
  elapsedCycles: number;
}): {
  payrollVaultCoins: number;
  staffPantry: Record<string, number>;
  updatedUnifiedWorkers: Record<string, any>;
  updatedSpecialistWorkers: Record<string, any>;
  settledShiftsCount: number;
  desertedWorkers: string[];
} {
  const {
    unifiedWorkers,
    specialistWorkers,
    payrollVaultCoins,
    staffPantry,
    elapsedCycles,
  } = params;

  let currentVaultCoins = payrollVaultCoins;
  let currentPantry = { ...staffPantry };
  const updatedUnified = { ...unifiedWorkers };
  const updatedSpecialists = { ...specialistWorkers };
  const desertedWorkers: string[] = [];
  let settledShiftsCount = 0;

  const cyclesToProcess = Math.min(Math.max(1, elapsedCycles), 24); // Cap at 24 cycles (12 hours)

  for (let cycle = 0; cycle < cyclesToProcess; cycle++) {
    // Process each hired unified worker
    for (const [role, worker] of Object.entries(updatedUnified)) {
      if (!worker?.isHired) continue;
      const res = processSingleWorkerClockOut({
        workerName: WORKER_UPKEEP_ROSTER[role]?.name || role,
        roleOrId: role,
        currentMissedCycles: worker.missedCycles || 0,
        payrollVaultCoins: currentVaultCoins,
        staffPantry: currentPantry,
        activeWorkersCount: 1,
      });

      currentVaultCoins = res.newPayrollCoins;
      currentPantry = res.newStaffPantry;
      updatedUnified[role] = {
        ...worker,
        missedCycles: res.newMissedCycles,
        moraleTier: res.newMoraleTier,
        isHired: !res.isDeserted,
        stamina: 100,
        wellRested: !res.isStriking && !res.isDeserted,
      };
      settledShiftsCount++;
      if (res.isDeserted) desertedWorkers.push(WORKER_UPKEEP_ROSTER[role]?.name || role);
    }

    // Process each hired specialist worker
    for (const [id, worker] of Object.entries(updatedSpecialists)) {
      if (!worker?.isHired) continue;
      const res = processSingleWorkerClockOut({
        workerName: WORKER_UPKEEP_ROSTER[id]?.name || id,
        roleOrId: id,
        currentMissedCycles: worker.missedCycles || 0,
        payrollVaultCoins: currentVaultCoins,
        staffPantry: currentPantry,
        activeWorkersCount: 1,
      });

      currentVaultCoins = res.newPayrollCoins;
      currentPantry = res.newStaffPantry;
      updatedSpecialists[id] = {
        ...worker,
        missedCycles: res.newMissedCycles,
        moraleTier: res.newMoraleTier,
        isStriking: res.isStriking,
        isHired: !res.isDeserted,
        stamina: 100,
        wellRested: !res.isStriking && !res.isDeserted,
      };
      settledShiftsCount++;
      if (res.isDeserted) desertedWorkers.push(WORKER_UPKEEP_ROSTER[id]?.name || id);
    }
  }

  return {
    payrollVaultCoins: currentVaultCoins,
    staffPantry: currentPantry,
    updatedUnifiedWorkers: updatedUnified,
    updatedSpecialistWorkers: updatedSpecialists,
    settledShiftsCount,
    desertedWorkers,
  };
}
