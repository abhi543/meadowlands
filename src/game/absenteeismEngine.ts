// ============================================================================
// WORKER ABSENTEEISM, MORALE CRISES & SAFETY INFRASTRUCTURE ENGINE
// ============================================================================

import { type WorkerRole } from './data';
import { type CanisterId } from './gasBottlingEngine';

export type AbsenceCause =
  | 'fume_sickness'       // Toxic exposure (SO2, PH3) without air scrubber
  | 'exhaustion_burnout'  // 3+ shifts without night rest or forced overtime
  | 'wildcat_strike'      // Unpaid midnight payroll across the estate
  | 'biohazard_mutiny';   // Barn cleanliness 0% or slurry >= 2500L for > 12h

export interface WorkerAbsenceRecord {
  workerId: string;
  role: WorkerRole;
  workerName: string;
  stationName: string;
  stationEmoji: string;
  canisterId?: CanisterId;
  cause: AbsenceCause;
  startedAt: number;
  durationMs: number;
  expiresAt: number;
  isTempAssigned?: boolean;
  tempExpiresAt?: number | null;
  resolvedAt?: number | null;
}

export interface EstateSafetyInfrastructure {
  hasOzoneAirScrubber: boolean;         // Eliminates fume sickness on SO2 and PH3
  hasEmergencyPressureCutoff: boolean;  // Prevents pressure spikes when compressor worker is absent
  hasEstateBreakroom: boolean;          // Cuts daily fatigue buildup by 40%
  consecutiveToxicExposureDays: Record<string, number>; // Worker -> count of consecutive days on SO2/PH3
  consecutiveOverworkDays: Record<string, number>;      // Worker -> count of shifts without night rest
  barnBiohazardStartTimestamp: number | null;           // When slurry hit 2500L / 0% cleanliness
  isWildcatStrikeActive: boolean;                       // Gate Dock picket active, blocking exports
  wildcatStrikeStartedAt: number | null;
  pendingMorningIncidents: WorkerAbsenceRecord[];       // Queue for morning pop-up alerts
  activeAbsences: Record<string, WorkerAbsenceRecord>;  // WorkerId -> active absence
  tempReplacementWorkers: Record<string, number>;       // WorkerId -> temp coverage expiration timestamp
}

export function createDefaultSafetyInfrastructure(): EstateSafetyInfrastructure {
  return {
    hasOzoneAirScrubber: false,
    hasEmergencyPressureCutoff: false,
    hasEstateBreakroom: false,
    consecutiveToxicExposureDays: {
      gas_so2_tech: 0,
      gas_phosphine_tech: 0,
    },
    consecutiveOverworkDays: {},
    barnBiohazardStartTimestamp: null,
    isWildcatStrikeActive: false,
    wildcatStrikeStartedAt: null,
    pendingMorningIncidents: [],
    activeAbsences: {},
    tempReplacementWorkers: {},
  };
}

// Cost Constants
export const MEDICAL_DRAUGHT_COST_COINS = 85;
export const TEMP_WORKER_DAILY_COST_COINS = 45;
export const OZONE_AIR_SCRUBBER_COST_COINS = 650;
export const EMERGENCY_PRESSURE_CUTOFF_COST_COINS = 450;
export const ESTATE_BREAKROOM_COST_COINS = 550;
export const WILDCAT_UNION_SETTLEMENT_BONUS_PCT = 0.25; // 25% penalty bonus on back wages

/**
 * Checks whether an active absence is currently incapacitating a worker.
 * If a temporary day-laborer is currently covering the shift, returns false (station runs).
 */
export function isWorkerAbsentAndUncovered(
  workerId: string,
  safety: EstateSafetyInfrastructure,
  now: number
): boolean {
  // If wildcat strike is active across the estate, all workers walk off
  if (safety.isWildcatStrikeActive) return true;

  const absence = safety.activeAbsences[workerId];
  if (!absence) return false;

  // If absence has expired by time, it is no longer blocking
  if (now >= absence.expiresAt) return false;

  // If a temp worker was hired and temp assignment is still active, station is covered
  if (absence.isTempAssigned && absence.tempExpiresAt && now < absence.tempExpiresAt) {
    return false;
  }

  // Also check direct temp replacement map
  if (safety.tempReplacementWorkers && safety.tempReplacementWorkers[workerId] && now < safety.tempReplacementWorkers[workerId]) {
    return false;
  }

  return true;
}

/**
 * Format remaining time for absence status badges
 */
export function formatAbsenceRemaining(expiresAt: number, now: number = Date.now()): string {
  const remMs = Math.max(0, expiresAt - now);
  const totalHours = Math.ceil(remMs / (60 * 1000)); // in-game approximation or minutes
  const days = Math.ceil(remMs / (1800 * 1000)); // 1 day = 1800 real seconds
  if (days > 1) {
    return `${days} Days Remaining`;
  } else if (totalHours > 60) {
    return `1 Day Remaining`;
  }
  const mins = Math.max(1, Math.ceil(remMs / 60000));
  return `${mins}m Remaining`;
}
