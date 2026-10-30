import {
  WORKER_UPKEEP_ROSTER,
  COMMISSARY_FOOD_ITEMS,
  getGuildTaxRate,
  type MoraleTier,
} from '@/data/workerUpkeep';
import { calculateWorkerDailyWage } from '@/game/data';
import { type WorkerHydrationState } from './hydrationEngine';

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

export type ShiftType = 'morning' | 'night' | 'evening'; // 'evening' retained as legacy alias mapped to night/gap

export type OperationalPhase = 'on_shift' | 'recreation' | 'sleeping';

export interface ShiftDefinition {
  type: ShiftType | 'twilight_gap';
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
export const SHIFT_WORK_SEC = 600; // 10 real minutes (06:00 - 14:00) Day Shift
export const SHIFT_RECREATION_SEC = 0;
export const SHIFT_SLEEP_SEC = 0; // Continuous Operations: Night Watch Active Duty with Lanterns
export const TWILIGHT_GAP_SEC = 0;
export const OVERTIME_DURATION_MS = 300000; // 5 real minutes = 4 in-game hours
export const SHIFT_ADJUST_DURATION_MS = 1800000; // 1 full day (30 real minutes)

export const TWILIGHT_GAP_DEFINITION: ShiftDefinition = {
  type: 'twilight_gap',
  name: 'Shift Handover Window',
  shortName: 'Handover',
  timeRange: '14:00',
  startInGameHour: 14,
  endInGameHour: 14,
  cycleWorkStartSec: 600,
  cycleWorkEndSec: 600,
  recreationEndSec: 600,
  responsibilities: 'Shift transition from Morning active labor into Night Watch lantern duty.',
  icon: '🔄',
  color: 'text-stone-300',
  bgGradient: 'from-stone-800/40 via-stone-900 to-stone-950',
};

export const SHIFT_DEFINITIONS: Record<ShiftType, ShiftDefinition> = {
  morning: {
    type: 'morning',
    name: 'Morning Shift: Active Duty (10 min)',
    shortName: 'Morning Work',
    timeRange: '06:00 – 14:00',
    startInGameHour: 6,
    endInGameHour: 14,
    cycleWorkStartSec: 0,
    cycleWorkEndSec: 600,
    recreationEndSec: 600,
    responsibilities: 'All workers active in the field: plot irrigation, planting, harvesting, livestock care, and artisan processing.',
    icon: '☀️',
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/20 to-yellow-500/10',
  },
  night: {
    type: 'night',
    name: 'Night Watch: Active Patrol (20 min)',
    shortName: 'Night Watch',
    timeRange: '14:00 – 06:00',
    startInGameHour: 14,
    endInGameHour: 6,
    cycleWorkStartSec: 600,
    cycleWorkEndSec: 1800,
    recreationEndSec: 1800,
    responsibilities: 'Workers on night watch with lanterns: guarding plots, feeding livestock, operating gas refinery, and maintaining continuous production.',
    icon: '🌙',
    color: 'text-indigo-400',
    bgGradient: 'from-indigo-500/20 to-purple-500/10',
  },
  evening: {
    // Legacy fallback redirecting to Night Watch
    type: 'night',
    name: 'Night Watch: Active Patrol (20 min)',
    shortName: 'Night Watch',
    timeRange: '14:00 – 06:00',
    startInGameHour: 14,
    endInGameHour: 6,
    cycleWorkStartSec: 600,
    cycleWorkEndSec: 1800,
    recreationEndSec: 1800,
    responsibilities: 'Workers active on Night Watch duty with lanterns.',
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
  activeShift: ShiftType | null; // null during Twilight Gap
  activeShiftDef: ShiftDefinition;
  isTwilightGap: boolean;
  twilightSecondsRemaining: number;
  twilightFormattedRemaining: string;
}

/**
 * Calculates in-game clock and circadian time based on absolute epoch timestamp.
 * Enforces Dual-Roster Cadence:
 * - [0..600s): Morning Shift (06:00 - 14:00)
 * - [600..1200s): Twilight Gap (14:00 - 22:00) — Unstaffed passive maturation
 * - [1200..1800s): Night Watch (22:00 - 06:00)
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

  // Period: Day (06:00 - 14:00, 10 min work), Night (14:00 - 06:00, 20 min Night Watch with Lanterns)
  let currentPeriod: 'day' | 'dusk' | 'night' = 'day';
  let periodLabel = 'Morning Shift: Active Duty (10 min)';
  let periodEmoji = '☀️';
  let periodThemeColor = '#f59e0b'; // Gold

  if (cycleElapsedSeconds >= 600) {
    currentPeriod = 'night';
    periodLabel = 'Night Watch: Active Patrol (20 min)';
    periodEmoji = '🌙';
    periodThemeColor = '#6366f1'; // Deep Indigo
  }

  // 10-Min Morning Work + 20-Min Night Watch Cadence (30-Minute Continuous Operations Day)
  // [0..600s) -> Morning Shift (06:00 - 14:00, Daytime Field Operations)
  // [600..1800s) -> Night Watch (14:00 - 06:00, Lantern Patrol & Machine Operation)
  let activeShift: ShiftType | null = 'morning';
  let activeShiftDef: ShiftDefinition = SHIFT_DEFINITIONS.morning;
  const isTwilightGap = false;
  let secondsToNextShiftChange = 0;
  const twilightSecondsRemaining = 0;

  if (cycleElapsedSeconds < 600) {
    activeShift = 'morning';
    activeShiftDef = SHIFT_DEFINITIONS.morning;
    secondsToNextShiftChange = 600 - cycleElapsedSeconds;
  } else {
    activeShift = 'night';
    activeShiftDef = SHIFT_DEFINITIONS.night;
    secondsToNextShiftChange = 1800 - cycleElapsedSeconds;
  }

  const nextMin = Math.floor(secondsToNextShiftChange / 60);
  const nextSec = secondsToNextShiftChange % 60;
  const nextShiftChangeFormatted = `${nextMin.toString().padStart(2, '0')}:${nextSec.toString().padStart(2, '0')}`;
  const twilightFormattedRemaining = '00:00';

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
    activeShiftDef,
    isTwilightGap,
    twilightSecondsRemaining,
    twilightFormattedRemaining,
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
  hydrationState?: WorkerHydrationState;
  hydrationBadgeEmoji?: string;
  hydrationBadgeText?: string;
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
  hydrationState?: WorkerHydrationState;
}): WorkerScheduleTelemetry {
  const {
    worker,
    roleOrId,
    baseDailyWage,
    timestamp,
    epochStart = 0,
    bunkhouseLevel = 1,
    hydrationState = 'hydrated',
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
    // Continuous Operations: Workers remain active on duty across both Day Shift and Night Watch!
    phase = 'on_shift';
    if (cycleSec < 600) {
      // [0..600): Active Day Shift (10 real minutes / 06:00 - 14:00)
      timeRemainingSeconds = 600 - cycleSec;
      const workProgress = cycleSec / 600;
      stamina = Math.max(50, Math.round((1 - workProgress) * 100));
    } else {
      // [600..1800): Active Night Watch with Lanterns (20 real minutes / 14:00 - 06:00)
      timeRemainingSeconds = 1800 - cycleSec;
      const nightProgress = (cycleSec - 600) / 1200;
      stamina = Math.min(100, Math.max(45, Math.round(50 + nightProgress * 50)));
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
    dialogueSnippet = 'Resting and resetting internal rhythm for the dual-roster schedule.';
  } else if (phase === 'on_shift') {
    phaseLabel = shiftType === 'morning' ? 'Morning Shift' : 'Night Watch';
    phaseBadgeText = shiftType === 'morning'
      ? `☀️ Morning Duty — Shift ends in ${timeRemainingFormatted}`
      : `🌙 Night Watch — Shift ends in ${timeRemainingFormatted}`;
    phaseBadgeEmoji = shiftType === 'morning' ? '☀️' : '🌙';
    phaseColorClass = shiftType === 'morning'
      ? 'text-amber-300 bg-amber-500/15 border-amber-500/40'
      : 'text-indigo-300 bg-indigo-500/15 border-indigo-500/40';
    dialogueSnippet = isWellRested
      ? 'Feeling well-rested and energized (+15% speed)!'
      : shiftType === 'morning'
      ? 'Tending morning crops and day livestock milking.'
      : 'Guarding night plots, tending nocturnal beasts, and clearing machines.';
  } else if (phase === 'recreation') {
    phaseLabel = 'Off-Duty (Recreation)';
    phaseBadgeText = `☕ Off-Duty Rest — Bunkhouse sleep in ${timeRemainingFormatted}`;
    phaseBadgeEmoji = '☕';
    phaseColorClass = 'text-amber-300 bg-amber-500/10 border-amber-500/30';
    dialogueSnippet = worker?.moraleTier === 'inspired'
      ? 'Loved the meal! Relaxing by the fire with fellow hands.'
      : 'Off duty, enjoying warm tea and campfire conversation.';
  } else if (worker?.moraleTier === 'sabbatical') {
    phase = 'recreation';
    phaseLabel = 'On Sabbatical (Furloughed)';
    phaseBadgeText = '🛑 On Sabbatical — Contract Frozen (0 Wages/Food)';
    phaseBadgeEmoji = '🛑';
    phaseColorClass = 'text-blue-300 bg-blue-500/15 border-blue-500/40';
    dialogueSnippet = 'On unpaid sabbatical resting in the village inn. Contract expenses frozen.';
  } else if (worker?.moraleTier === 'striking' || worker?.isStriking) {
    phase = 'recreation';
    phaseLabel = 'On Strike (Picket)';
    const desertionRemainingSec = worker?.desertionDeadline
      ? Math.max(0, Math.ceil((worker.desertionDeadline - timestamp) / 1000))
      : 7200;
    const dH = Math.floor(desertionRemainingSec / 3600);
    const dM = Math.floor((desertionRemainingSec % 3600) / 60);
    const dS = desertionRemainingSec % 60;
    phaseBadgeText = `🪧 On Strike — Desertion in ${dH.toString().padStart(2, '0')}:${dM.toString().padStart(2, '0')}:${dS.toString().padStart(2, '0')}`;
    phaseBadgeEmoji = '🪧';
    phaseColorClass = 'text-rose-400 bg-rose-500/20 border-rose-500/40';
    dialogueSnippet = 'Refusing to work until back-wages and pantry rations are settled by the Labor Guild!';
  } else if (phase === 'sleeping') {
    phaseLabel = 'Asleep in Bunkhouse';
    phaseBadgeText = `🌙 Asleep in Bunkhouse — Wakes at 06:00 (${timeRemainingFormatted})`;
    phaseBadgeEmoji = '🌙';
    phaseColorClass = 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30';
    dialogueSnippet = bunkhouseLevel >= 2
      ? 'Sleeping soundly on feather mattresses, restoring vigor!'
      : 'Asleep in the bunkhouse, recovering stamina for the next watch.';
  }

  // Speed multiplier
  let speedMultiplier = 1.0;
  if (isExhausted) {
    speedMultiplier *= 0.6; // 60% speed when exhausted
  }
  if (isWellRested && phase === 'on_shift') {
    speedMultiplier *= 1.15; // +15% well-rested perk
  }
  const isAppreciated = Boolean(worker?.appreciatedUntil && timestamp < worker.appreciatedUntil);
  if (isAppreciated && phase === 'on_shift') {
    speedMultiplier *= 1.10; // +10% Appreciated Staff modifier
  }

  // Hydration Metabolism Modifier
  if (hydrationState === 'dehydrated') {
    speedMultiplier *= 0.5; // -50% Dehydration Fatigue penalty
  } else if (hydrationState === 'cold_infused') {
    speedMultiplier *= 1.15; // +15% Cold-Infused Velocity Bonus
  }

  const isOnDuty = Boolean(
    (phase === 'on_shift' || isOvertime) &&
    !isAdjusting &&
    !worker?.isPaused &&
    worker?.moraleTier !== 'striking' &&
    worker?.moraleTier !== 'deserted' &&
    worker?.moraleTier !== 'sabbatical'
  );

  const canCallOvertime = Boolean(
    (phase === 'recreation' || phase === 'sleeping') &&
    !isOvertime &&
    !isExhausted &&
    !isAdjusting &&
    worker?.isHired &&
    worker?.moraleTier !== 'striking' &&
    worker?.moraleTier !== 'deserted' &&
    worker?.moraleTier !== 'sabbatical' &&
    hydrationState !== 'dehydrated' // Cannot sprint to emergencies while dehydrated
  );

  let hydrationBadgeEmoji = '🥛';
  let hydrationBadgeText = 'Hydrated';
  if (hydrationState === 'cold_infused') {
    hydrationBadgeEmoji = '🧊';
    hydrationBadgeText = 'Cold-Infused (+15%)';
  } else if (hydrationState === 'dehydrated') {
    hydrationBadgeEmoji = '🥵';
    hydrationBadgeText = 'Thirsty (50% Spd)';
  }

  if (hydrationState === 'dehydrated' && phase === 'on_shift') {
    dialogueSnippet = 'Parched and sluggish! Need clean water from the canteen or gravity tower.';
  } else if (hydrationState === 'cold_infused' && phase === 'on_shift') {
    dialogueSnippet = 'Invigorated by chilled citrus tea! Working at peak velocity with full heatwave immunity.';
  }

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
    hydrationState,
    hydrationBadgeEmoji,
    hydrationBadgeText,
  };
}

/**
 * Returns default shift assignment for each worker role in the Dual-Roster Model.
 * Morning (06:00-14:00) vs Night Watch (22:00-06:00).
 */
export function getDefaultWorkerShift(roleOrId: string): ShiftType {
  return 'morning';
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
 * Settlement occurs once per 30-minute day cycle at day's end (1740s / 23:30 in-game).
 */
export function hasWorkerReachedClockOut(shiftType: ShiftType, cycleSeconds: number): boolean {
  return cycleSeconds >= 1740;
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
  currentMoraleTier?: MoraleTier;
  payrollVaultCoins: number;
  staffPantry: Record<string, number>;
  activeWorkersCount: number;
  wageMultiplier?: number;
  isHardcoreMode?: boolean;
  workerLevel?: number;
}): ClockOutSettlementResult {
  const {
    workerName,
    roleOrId,
    currentMissedCycles,
    currentMoraleTier,
    payrollVaultCoins,
    staffPantry,
    activeWorkersCount,
    wageMultiplier = 1.0,
    isHardcoreMode = false,
    workerLevel = 1,
  } = params;

  // Sabbatical workers do not burn wages or pantry rations
  if (currentMoraleTier === 'sabbatical') {
    return {
      paidWage: true,
      fedRation: true,
      isInspired: false,
      wageCost: 0,
      consumedFoodId: null,
      newPayrollCoins: payrollVaultCoins,
      newStaffPantry: staffPantry,
      newMissedCycles: currentMissedCycles,
      newMoraleTier: 'sabbatical',
      isStriking: false,
      isDeserted: false,
      notificationMessage: null,
    };
  }

  const config = WORKER_UPKEEP_ROSTER[roleOrId];
  const rawBaseWage = config?.baseDailyWage || 15;
  const baseWage = calculateWorkerDailyWage(rawBaseWage, workerLevel);
  const taxRate = getGuildTaxRate(activeWorkersCount);
  const wageCost = Math.round(baseWage * (1 + taxRate) * wageMultiplier);

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
      // 1. Try matching dietary category first
      for (const [fId, qty] of Object.entries(updatedPantry)) {
        if (qty > 0 && COMMISSARY_FOOD_ITEMS[fId]?.category === config.dietaryCategory) {
          canAffordFood = true;
          chosenFoodId = fId;
          break;
        }
      }
      // 2. Luxury fallback: any prepared kitchen meal can nourish workers
      if (!canAffordFood) {
        for (const [fId, qty] of Object.entries(updatedPantry)) {
          if (qty > 0 && COMMISSARY_FOOD_ITEMS[fId]?.category === 'meal') {
            canAffordFood = true;
            chosenFoodId = fId;
            break;
          }
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
    const cycleIncrement = isHardcoreMode ? 2 : 1;
    newMissedCycles += cycleIncrement;
    if (newMissedCycles === 1) {
      newMoraleTier = 'grumbling';
      notificationMessage = `🟡 Missed Upkeep: ${workerName} clocked out without complete rations (Grumbling -15% speed).`;
    } else {
      newMoraleTier = 'content'; // Workers remain on duty like before without halting tasks
      isStriking = false;
      notificationMessage = null;
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
        workerLevel: worker.level || 1,
      });

      currentVaultCoins = res.newPayrollCoins;
      currentPantry = res.newStaffPantry;
      updatedUnified[role] = {
        ...worker,
        missedCycles: res.newMissedCycles,
        moraleTier: res.newMoraleTier,
        isHired: worker.isHired,
        stamina: 100,
        wellRested: !res.isStriking,
      };
      settledShiftsCount++;
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
        isHired: worker.isHired,
        stamina: 100,
        wellRested: !res.isStriking,
      };
      settledShiftsCount++;
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
