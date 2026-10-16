'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import {
  WORKER_REGISTRY, WORKER_DIVISIONS, WORKER_MAX_LEVEL,
  workerUpgradeCost, workerEffectiveInterval, workerDoubleProcChance,
  workerTripleProcUnlocked, workerGemProcUnlocked, workerAutoSellPayout,
  workerSpeedMultiplier, workerHopperBuffer, workerAutoSellBonus,
  calculateBulkUpgrade, getMilestoneRank, MILESTONE_RANKS,
  type WorkerRole, type WorkerDivision, type BulkMode,
} from '@/game/data';
import { OverclockActionMenu } from './OverclockActionMenu';
import { SpecialistWorkersSection } from './SpecialistWorkersSection';
import { StaffCommissaryCommandCard } from './StaffCommissaryCommandCard';
import { FarmClockBanner } from './FarmClockBanner';
import { BunkhouseFacilityPanel } from './BunkhouseFacilityPanel';
import { DualRosterCommandDeck } from './DualRosterCommandDeck';
import {
  getWorkerScheduleTelemetry,
  type ShiftType,
  SHIFT_DEFINITIONS,
} from '@/game/shiftEngine';
import {
  WORKER_UPKEEP_ROSTER,
  calculateStaffUpkeep,
  FOOD_CATEGORY_INFO,
} from '@/data/workerUpkeep';


/** Generate contextual help hint for why a worker can't be hired/upgraded */
function getBlockHint(args: {
  role: WorkerRole;
  isHired: boolean;
  isUnlocked: boolean;
  unlockLevel: number;
  coins: number;
  cost: number;
  workerLevel: number;
  bulkMode: BulkMode;
  upgradeResult: { levelsToBuy: number; totalCost: number } | null;
}): string | null {
  const { isHired, isUnlocked, unlockLevel, coins, cost, workerLevel, bulkMode, upgradeResult } = args;

  // Not unlocked yet
  if (!isHired && !isUnlocked) {
    return `Reach Level ${unlockLevel} to unlock this worker`;
  }

  // Unlocked but can't afford to hire
  if (!isHired && isUnlocked && coins < cost) {
    return `Need ${cost.toLocaleString()} coins to hire (short ${(cost - coins).toLocaleString()})`;
  }

  // Hired but can't afford upgrade
  if (isHired && workerLevel < WORKER_MAX_LEVEL && upgradeResult) {
    if (upgradeResult.levelsToBuy === 0 || coins < upgradeResult.totalCost) {
      const singleCost = workerUpgradeCost(args.role, workerLevel);
      // Provide contextual hint based on how far away they are
      const deficit = singleCost - coins;
      if (deficit > singleCost * 10) {
        return `Too expensive — earn more coins or use Hoard mode on other workers`;
      }
      return `Need ${singleCost.toLocaleString()} coins for next level (short ${deficit.toLocaleString()})`;
    }
    // x10/MAX partial affordability hint
    if (bulkMode !== 'x1' && upgradeResult.levelsToBuy > 0) {
      const maxPossible = WORKER_MAX_LEVEL - workerLevel;
      if (bulkMode === 'x10' && upgradeResult.levelsToBuy < Math.min(10, maxPossible)) {
        return `Can only afford ${upgradeResult.levelsToBuy} of 10 levels`;
      }
    }
  }

  return null;
}

/** Get the next milestone perk hint */
function getNextMilestoneHint(currentLevel: number): string | null {
  const nextRank = MILESTONE_RANKS.find(r => r.minLevel > currentLevel);
  if (!nextRank) return null;
  const levelsAway = nextRank.minLevel - currentLevel;
  if (levelsAway > 40) return null; // too far away, don't show
  const perkMap: Record<string, string> = {
    'Apprentice': '+10% Auto-Sell value',
    'Journeyman': 'Hopper buffer (store overflow cycles)',
    'Craftsman': '5% chance to drop Gems per cycle',
    'Expert': '+10% speed to adjacent buildings',
    'Grandmaster': '15% chance for Triple Yield (3x)',
    'Mythic': 'Overdrive: extra -20% interval',
  };
  const perk = perkMap[nextRank.title] || '';
  return `${nextRank.title} at Lv${nextRank.minLevel} (${levelsAway} away) — ${perk}`;
}

/** Get next individual perk unlock hint */
function getNextPerkHint(currentLevel: number): string | null {
  if (currentLevel < 20) return `Lv20: +10% Auto-Sell bonus`;
  if (currentLevel < 40) return `Lv40: Hopper buffer unlocks (buffer overflow cycles)`;
  if (currentLevel < 60) return `Lv60: Gem drops unlock (5% per cycle)`;
  if (currentLevel < 80) return `Lv80: District Aura (+10% adjacent speed)`;
  if (currentLevel < 100) return `Lv100: Triple Yield (15% on double procs)`;
  if (currentLevel < 120) return `Lv120: Overdrive Engine (extra -20% speed)`;
  return null;
}

export function WorkersHubPanel({ onSelectTab }: { onSelectTab?: (tab: string) => void } = {}) {
  const {
    unifiedWorkers,
    specialistWorkers,
    payrollVaultCoins,
    staffPantry,
    coins,
    level,
    farmEpochStart,
    bunkhouse,
    hireUnifiedWorker,
    bulkUpgradeUnifiedWorker,
    toggleUnifiedWorkerMode,
    togglePauseUnifiedWorker,
    togglePauseAllWorkers,
    assignWorkerShift,
    callEmergencyOvertime,
    isAllWorkersPaused,
  } = useGameStore();
  const [activeDivision, setActiveDivision] = useState<WorkerDivision>('farmhand');
  const [bulkMode, setBulkMode] = useState<BulkMode>('x1');
  const [shiftFilter, setShiftFilter] = useState<ShiftType | 'all'>('all');

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const telemetry = calculateStaffUpkeep(
    unifiedWorkers,
    specialistWorkers,
    payrollVaultCoins,
    staffPantry
  );

  const division = WORKER_DIVISIONS[activeDivision];
  const hiredCount = Object.values(unifiedWorkers).filter(w => w.isHired).length;
  const totalWorkers = Object.keys(WORKER_REGISTRY).length;

  // Count workers per division
  const divisionCounts: Record<WorkerDivision, number> = { farmhand: 0, millers: 0, autonomous: 0, utility: 0 };
  for (const w of Object.values(unifiedWorkers)) {
    if (w.isHired) divisionCounts[WORKER_REGISTRY[w.role].division]++;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="font-bold text-lg text-stone-800 dark:text-gray-100 flex items-center gap-2">
            {'\u{1F477}'} Workers & Guilds
          </h3>
          <span className="text-xs text-stone-500 dark:text-gray-400">{hiredCount}/{totalWorkers} hired</span>
        </div>

        {hiredCount > 0 && (
          <button
            onClick={() => togglePauseAllWorkers(!isAllWorkersPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              isAllWorkersPaused
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                : 'bg-stone-100 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:border-amber-400'
            }`}
            title={isAllWorkersPaused ? "Resume all automated operations and production" : "Pause all automated operations and worker cycles"}
          >
            <span>{isAllWorkersPaused ? '▶️' : '⏸️'}</span>
            <span>{isAllWorkersPaused ? 'Resume All Workers' : 'Pause All Workers'}</span>
          </button>
        )}
      </div>

      {/* Global Workforce Paused Banner */}
      {isAllWorkersPaused && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">⏸️</span>
            <div>
              <div className="font-black text-sm">All Automated Workers Paused</div>
              <div className="text-[11px] opacity-85">Autonomous routines, resource consumption, and specialist tasks are on hold.</div>
            </div>
          </div>
          <button
            onClick={() => togglePauseAllWorkers(false)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs transition-all active:scale-95 cursor-pointer ml-2"
          >
            ▶️ Resume All
          </button>
        </div>
      )}

      {/* Master Farm Clock & Shift Timeline (Top Banner) */}
      <FarmClockBanner
        selectedShiftFilter={shiftFilter}
        onSelectShiftFilter={setShiftFilter}
      />

      {/* Dual-Roster Command Deck (Slot A Morning Specialist, Slot B Night Specialist & Twilight Telemetry) */}
      <DualRosterCommandDeck />

      {/* Unified Executive Management Header: Staff Commissary & Payroll Vault Command Card */}
      <StaffCommissaryCommandCard />

      {/* Dedicated Living Accommodations: Bunkhouse Facility Panel */}
      <BunkhouseFacilityPanel />

      {/* Prominent Dedicated Specialist Workers Section */}
      <SpecialistWorkersSection onSelectTab={onSelectTab} />

      {/* Division Tabs */}
      <div className="flex gap-1 bg-stone-100 dark:bg-gray-800 rounded-lg p-1">
        {(Object.entries(WORKER_DIVISIONS) as [WorkerDivision, typeof division][]).map(([divId, div]) => {
          const isActive = activeDivision === divId;
          const count = divisionCounts[divId];
          return (
            <button
              key={divId}
              onClick={() => setActiveDivision(divId)}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-stone-800 dark:text-gray-100 shadow-sm'
                  : 'text-stone-500 dark:text-gray-400 hover:text-stone-700 dark:hover:text-gray-300'
              }`}
            >
              {div.emoji} {div.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Bulk Upgrade Multiplier */}
      <div className="flex items-center gap-2 bg-stone-50 dark:bg-gray-800/50 rounded-lg p-2">
        <span className="text-xs text-stone-500 dark:text-gray-400 font-medium">Upgrade:</span>
        <div className="flex gap-1">
          {(['x1', 'x10', 'MAX'] as BulkMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setBulkMode(mode)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                bulkMode === mode
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-stone-200 dark:bg-gray-700 text-stone-600 dark:text-gray-300 hover:bg-stone-300 dark:hover:bg-gray-600'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Worker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {division.roles.map(role => {
          const cfg = WORKER_REGISTRY[role];
          const worker = unifiedWorkers[role];
          if (!worker) return null;

          const isUnlocked = level >= cfg.unlockLevel;
          const rank = getMilestoneRank(worker.level);
          const effectiveInterval = workerEffectiveInterval(role, worker.level);
          const elapsed = worker.isHired ? now - worker.lastActionTimestamp : 0;
          const progress = worker.isHired ? Math.min(1, elapsed / effectiveInterval) : 0;
          const doubleChance = workerDoubleProcChance(worker.level);
          const canUpgrade = worker.isHired && worker.level < WORKER_MAX_LEVEL;
          const upgradeResult = canUpgrade ? calculateBulkUpgrade(role, worker.level, bulkMode, coins) : null;
          const canAfford = upgradeResult && upgradeResult.levelsToBuy > 0 && coins >= upgradeResult.totalCost;
          const speedPct = Math.round((1 - workerSpeedMultiplier(worker.level)) * 100);
          const payout = workerAutoSellPayout(role, worker.level);
          const hopper = workerHopperBuffer(worker.level);
          const autoSellBonusPct = workerAutoSellBonus(worker.level) > 1 ? Math.round((workerAutoSellBonus(worker.level) - 1) * 100) : 0;

          // Block hint
          const blockHint = getBlockHint({
            role,
            isHired: worker.isHired,
            isUnlocked,
            unlockLevel: cfg.unlockLevel,
            coins,
            cost: cfg.baseCost,
            workerLevel: worker.level,
            bulkMode,
            upgradeResult,
          });

          // Next milestone & perk hints (only for hired workers)
          const nextMilestone = worker.isHired ? getNextMilestoneHint(worker.level) : null;
          const nextPerk = worker.isHired ? getNextPerkHint(worker.level) : null;

          const upkeep = WORKER_UPKEEP_ROSTER[role];
          const upkeepStatus = telemetry.workerUpkeeps[role];
          const morale = worker.moraleTier || 'content';
          const isStriking = morale === 'striking';
          const isGrumbling = morale === 'grumbling';
          const isInspired = morale === 'inspired';

          const schedule = getWorkerScheduleTelemetry({
            worker,
            roleOrId: role,
            baseDailyWage: upkeep?.baseDailyWage || 15,
            timestamp: now,
            epochStart: farmEpochStart,
            bunkhouseLevel: bunkhouse?.level || 1,
          });

          // Filter by shift if shiftFilter is active
          if (shiftFilter !== 'all' && worker.isHired && schedule.shiftType !== shiftFilter) {
            return null;
          }

          return (
            <div
              key={role}
              className={`rounded-xl border p-3 transition-all ${
                worker.isHired
                  ? isStriking
                    ? 'border-red-500/70 bg-red-950/20 dark:bg-red-950/30 ring-1 ring-red-500/40 shadow-sm'
                    : isGrumbling
                    ? 'border-amber-500/60 bg-amber-950/15 dark:bg-amber-950/25 ring-1 ring-amber-500/30'
                    : isInspired
                    ? 'border-yellow-400/70 bg-yellow-950/15 dark:bg-yellow-950/25 ring-1 ring-yellow-400/40'
                    : `${rank.bgColor} ${rank.borderColor}`
                  : 'bg-white dark:bg-gray-900 border-stone-200 dark:border-gray-700'
              } ${!isUnlocked ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Emoji */}
                <div className="text-3xl flex-shrink-0">{cfg.emoji}</div>

                <div className="flex-1 min-w-0">
                  {/* Name + Level */}
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm text-stone-800 dark:text-gray-200 truncate">
                      {cfg.name}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0 flex-wrap">
                      {worker.isHired && isStriking && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500/25 text-red-600 dark:text-red-300 border border-red-500/50 whitespace-nowrap animate-pulse">
                          🛑 On Strike
                        </span>
                      )}
                      {worker.isHired && isGrumbling && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/50 whitespace-nowrap">
                          🟡 Grumbling
                        </span>
                      )}
                      {worker.isHired && isInspired && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-yellow-400/25 text-yellow-600 dark:text-yellow-300 border border-yellow-400/50 whitespace-nowrap shadow-xs">
                          ✨ Inspired
                        </span>
                      )}
                      {worker.isHired && worker.isPaused && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 whitespace-nowrap">
                          ⏸️ Paused
                        </span>
                      )}
                      {worker.isHired && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rank.color} ${rank.bgColor} border ${rank.borderColor} whitespace-nowrap`}>
                          {rank.emoji} {rank.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* WORKER TIMING DISPLAY (ON TOP) */}
                  {worker.isHired && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 dark:bg-stone-950/90 border border-emerald-500/30 dark:border-stone-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold gap-1 flex-wrap">
                        <span className="flex items-center gap-1.5 text-stone-700 dark:text-stone-200">
                          <span className="text-xs">⏱️</span>
                          {worker.isPaused ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">⏸️ Operation Paused</span>
                          ) : isStriking ? (
                            <span className="text-red-500 dark:text-red-400 font-bold">🛑 Production Halted (Strike)</span>
                          ) : isGrumbling ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">🐢 Next: {Math.max(0, Math.ceil((effectiveInterval - elapsed) / 1000))}s (Half-Speed)</span>
                          ) : isInspired ? (
                            <span className="text-yellow-600 dark:text-yellow-400 font-bold">✨ Next: {Math.max(0, Math.ceil((effectiveInterval - elapsed) / 1000))}s (+20% Speed)</span>
                          ) : (
                            <span>Next: <b className="text-emerald-600 dark:text-emerald-400 font-mono">{Math.max(0, Math.ceil((effectiveInterval - elapsed) / 1000))}s</b></span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 flex items-center gap-1">
                          <span>🕒 Shift:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">{schedule.timeRemainingFormatted}</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            worker.isPaused
                              ? 'bg-amber-400 dark:bg-amber-500 opacity-60'
                              : isStriking
                              ? 'bg-red-500 opacity-40'
                              : isGrumbling
                              ? 'bg-amber-500'
                              : isInspired
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${(worker.isPaused || isStriking ? 0.35 : progress) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">{cfg.description}</p>

                  {/* Shift Assignment Dropdown Pill & Real-time Labor Telemetry */}
                  {worker.isHired && (
                    <div className="mt-2 p-2 rounded-lg bg-stone-100 dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 space-y-1.5">
                      <div className="flex items-center justify-between gap-1 flex-wrap text-[10px]">
                        <span className="text-stone-500 dark:text-stone-400 font-semibold flex items-center gap-1">
                          <span>🕒</span> Shift Roster:
                        </span>
                        <select
                          value={schedule.shiftType}
                          onChange={(e) => assignWorkerShift(role, e.target.value as ShiftType)}
                          className="bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded border border-stone-300 dark:border-amber-500/30 text-[10px] cursor-pointer"
                          title="Click to reassign shift (initiates 1-day adjustment period)"
                        >
                          <option value="morning">☀️ Morning Duty (06:00-14:00)</option>
                          <option value="night">🌙 Night Watch (22:00-06:00)</option>
                          {schedule.shiftType === 'evening' && (
                            <option value="evening">☕ Legacy Evening (Migrate to Morning/Night)</option>
                          )}
                        </select>
                      </div>

                      {/* Operational Phase Badge & Time Remaining */}
                      <div className="flex items-center justify-between gap-1 flex-wrap text-[10px] pt-1 border-t border-stone-200 dark:border-stone-800">
                        <span className={`px-1.5 py-0.5 rounded font-black border text-[9px] ${schedule.phaseColorClass}`}>
                          {schedule.phaseBadgeText}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span>⏳</span>
                          <span>{schedule.timeRemainingFormatted}</span>
                        </span>
                        {schedule.isWellRested && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                            ✨ Well-Rested (+15% Spd)
                          </span>
                        )}
                        {schedule.isExhausted && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40 animate-pulse">
                            ⚠️ Exhausted (60% Spd)
                          </span>
                        )}
                      </div>

                      {/* Stamina Meter */}
                      <div className="space-y-0.5 pt-0.5">
                        <div className="flex items-center justify-between text-[9px] text-stone-500 dark:text-stone-400">
                          <span>⚡ Stamina: <b className={schedule.stamina >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{schedule.stamina}%</b></span>
                          <span className="italic">{schedule.phase === 'sleeping' ? 'Restoring in Bunkhouse' : schedule.isOnDuty ? 'Active Field Duty' : 'Off-Duty'}</span>
                        </div>
                        <div className="w-full h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              schedule.stamina >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${schedule.stamina}%` }}
                          />
                        </div>
                      </div>

                      {schedule.dialogueSnippet && !schedule.isOnDuty && (
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 italic pt-1 border-t border-stone-200 dark:border-stone-800/80">
                          {schedule.dialogueSnippet}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upkeep Metric Badge & Status Pills */}
                  {upkeep && (
                    <div className="mt-2 p-2 rounded-lg bg-stone-100 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 text-[10px] space-y-1">
                      <div className="flex items-center justify-between text-stone-600 dark:text-stone-300 font-semibold flex-wrap gap-1">
                        <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                          <span>💰</span>
                          <span>{upkeep.baseDailyWage} Coins</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>{FOOD_CATEGORY_INFO[upkeep.dietaryCategory].icon}</span>
                          <span>{upkeep.dietaryUnits} {FOOD_CATEGORY_INFO[upkeep.dietaryCategory].label}</span>
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <span>⭐</span>
                          <span>Fav: {upkeep.favoriteRecipeEmoji} {upkeep.favoriteRecipeName}</span>
                        </span>
                      </div>

                      {worker.isHired && (
                        <div className="flex items-center justify-between pt-1 border-t border-stone-200 dark:border-stone-800 gap-1 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                              upkeepStatus?.isWageSecured
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                            }`}
                          >
                            {upkeepStatus?.isWageSecured ? '🟢 Wage: Secured in Vault' : '⚠️ Wage: Unfunded'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                              upkeepStatus?.isRationAvailable
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {upkeepStatus?.isRationAvailable ? '🟢 Ration: In Pantry' : '⚠️ Ration: Missing'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Strike and Grumbling alerts */}
                  {worker.isHired && (
                    <div className="mt-1.5">
                      {isStriking && (
                        <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1.5">
                          <span className="text-base animate-bounce">🛑</span>
                          <div>
                            <div>ON STRIKE — Work Halted!</div>
                            <div className="text-[10px] font-normal opacity-90">
                              Missed {worker.missedCycles || 2} cycles upkeep. Restock vault & pantry to resume.
                            </div>
                          </div>
                        </div>
                      )}
                      {isGrumbling && (
                        <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5">
                          <span>⚠️</span>
                          <div>
                            <div>Grumbling — Half-Speed (50%)</div>
                            <div className="text-[10px] font-normal opacity-90">
                              Missed 1 settlement cycle. Restock supplies to prevent strike!
                            </div>
                          </div>
                        </div>
                      )}
                      {isInspired && (
                        <div className="p-1.5 rounded-lg bg-yellow-400/15 border border-yellow-400/40 text-yellow-700 dark:text-yellow-300 text-[11px] font-bold flex items-center gap-1.5">
                          <span className="text-base">✨</span>
                          <span>Inspired (+20% Efficiency) — Fed favorite recipe {upkeep.favoriteRecipeEmoji}!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unlock requirement hint (for unhired, locked workers) */}
                  {!worker.isHired && !isUnlocked && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                      <span>{'\u{1F512}'}</span>
                      <span className="font-medium">Requires Level {cfg.unlockLevel}</span>
                      <span className="text-red-400 dark:text-red-500">({level}/{cfg.unlockLevel})</span>
                    </div>
                  )}

                  {/* Hire cost too expensive hint */}
                  {!worker.isHired && isUnlocked && coins < cfg.baseCost && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                      <span>{'\u{1F4B0}'}</span>
                      <span>Need {cfg.baseCost.toLocaleString()} coins — short {(cfg.baseCost - coins).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Level Bar */}
                  {worker.isHired && (
                    <>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-medium text-stone-700 dark:text-gray-300">
                          Level {worker.level} / {WORKER_MAX_LEVEL}
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-gray-400">
                          Interval -{speedPct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mt-0.5">
                        <div
                          className="h-full bg-violet-500 dark:bg-violet-400 rounded-full transition-all"
                          style={{ width: `${(worker.level / WORKER_MAX_LEVEL) * 100}%` }}
                        />
                      </div>
                    </>
                  )}



                  {/* Stats Row */}
                  {worker.isHired && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-stone-500 dark:text-gray-400">
                      <span>2x Drop: {Math.round(doubleChance * 100)}%</span>
                      {workerTripleProcUnlocked(worker.level) && <span className="text-rose-500">3x: 15%</span>}
                      {workerGemProcUnlocked(worker.level) && <span className="text-blue-500">{'\u{1F48E}'} 5%</span>}
                      {hopper > 0 && <span>Buffer: {hopper}</span>}
                      {autoSellBonusPct > 0 && <span className="text-emerald-500">Sell +{autoSellBonusPct}%</span>}
                    </div>
                  )}

                  {/* Mode Toggle */}
                  {worker.isHired && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-stone-500 dark:text-gray-400">Mode:</span>
                      <button
                        onClick={() => toggleUnifiedWorkerMode(role)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                          worker.autoSell
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {'\u{1F4B0}'} Auto-Sell {worker.autoSell ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => toggleUnifiedWorkerMode(role)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                          !worker.autoSell
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {'\u{1F3D6}'} Hoard {!worker.autoSell ? 'ON' : 'OFF'}
                      </button>
                      {worker.autoSell && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          +{payout} {'\u{1FA99}'}
                        </span>
                      )}
                      {!worker.autoSell && cfg.hoardItem && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          +1 {cfg.hoardItemEmoji} {cfg.hoardItem}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Hoard mode hint for special workers */}
                  {worker.isHired && !worker.autoSell && role === 'merchant' && (
                    <div className="mt-1 text-[10px] text-amber-500 dark:text-amber-400 italic">
                      {'\u{1F4E6}'} Hoarding items for VIP Delivery Orders
                    </div>
                  )}
                  {worker.isHired && !worker.autoSell && role === 'barn_overseer' && (
                    <div className="mt-1 text-[10px] text-amber-500 dark:text-amber-400 italic">
                      {'\u{1F4E6}'} Auto-fills empty feeding troughs
                    </div>
                  )}
                  {worker.isHired && worker.autoSell && role === 'merchant' && (
                    <div className="mt-1 text-[10px] text-emerald-500 dark:text-emerald-400 italic">
                      {'\u{1F4B0}'} Sells surplus silo crops at +20% premium
                    </div>
                  )}

                  {/* Lifetime Stats */}
                  {worker.isHired && (
                    <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-stone-400 dark:text-gray-500">
                      <span>{'\u{1F4B0}'} {worker.stats.totalCoinsEarned.toLocaleString()}</span>
                      <span>{'\u{1F4E6}'} {worker.stats.totalItemsProduced.toLocaleString()}</span>
                      {worker.stats.totalGemsEarned > 0 && <span>{'\u{1F48E}'} {worker.stats.totalGemsEarned}</span>}
                    </div>
                  )}

                  {/* Next Milestone / Perk Hint */}
                  {worker.isHired && nextMilestone && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 rounded px-2 py-1">
                      <span>{'\u2B50'}</span>
                      <span>{nextMilestone}</span>
                    </div>
                  )}

                  {/* Next Perk Unlock Hint (only show if no milestone hint, to avoid clutter) */}
                  {worker.isHired && !nextMilestone && nextPerk && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-gray-400 bg-stone-50 dark:bg-gray-800/50 rounded px-2 py-1">
                      <span>{'\u{1F514}'}</span>
                      <span>{nextPerk}</span>
                    </div>
                  )}

                  {/* Upgrade cost block hint */}
                  {blockHint && worker.isHired && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                      <span>{'\u{1F4B0}'}</span>
                      <span>{blockHint}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {!worker.isHired && isUnlocked && (
                      <button
                        onClick={() => hireUnifiedWorker(role)}
                        disabled={coins < cfg.baseCost}
                        className="px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                      >
                        Hire {'\u{1F4B0}'}{cfg.baseCost.toLocaleString()}
                      </button>
                    )}
                    {worker.isHired && canUpgrade && upgradeResult && (
                      <>
                        <button
                          onClick={() => bulkUpgradeUnifiedWorker(role, bulkMode)}
                          disabled={!canAfford}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors"
                        >
                          {bulkMode === 'x1' ? `+1 Lv` : bulkMode === 'x10' ? `+${upgradeResult.levelsToBuy} Lv` : `MAX +${upgradeResult.levelsToBuy}`}
                          {' '}({'\u{1F4B0}'}{upgradeResult.totalCost.toLocaleString()})
                        </button>
                      </>
                    )}
                    {worker.isHired && (
                      <button
                        onClick={() => togglePauseUnifiedWorker(role)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95 ${
                          worker.isPaused
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/50'
                            : 'bg-stone-100 hover:bg-amber-50 dark:bg-stone-800 dark:hover:bg-amber-950/30 text-stone-600 hover:text-amber-700 dark:text-stone-300 dark:hover:text-amber-300 border-stone-300 dark:border-stone-700'
                        }`}
                        title={worker.isPaused ? "Resume this worker's automated tasks" : "Temporarily pause this worker without firing"}
                      >
                        <span>{worker.isPaused ? '▶️' : '⏸️'}</span>
                        <span>{worker.isPaused ? 'Resume' : 'Pause'}</span>
                      </button>
                    )}
                    {worker.isHired && schedule.canCallOvertime && (
                      <button
                        onClick={() => callEmergencyOvertime(role)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                        title={`Wake worker for a 4-hour rush shift (-🪙${schedule.overtimeCostCoins} + 1 snack)`}
                      >
                        <span>☕</span>
                        <span>Call Overtime (-🪙{schedule.overtimeCostCoins})</span>
                      </button>
                    )}
                    {worker.isHired && (
                      <OverclockActionMenu
                        entityId={`worker_${role}`}
                        entityType="worker"
                        name={cfg.name}
                        compact={true}
                      />
                    )}
                    {worker.isHired && worker.level >= WORKER_MAX_LEVEL && (
                      <span className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400">{'\u{1F52E}'} MAX LEVEL</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
