'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { LIVESTOCK_WORKER_ROSTER, type SpecialistWorkerId, type HireableWorkerTemplate } from '@/data/workerCatalog';
import {
  WORKER_UPKEEP_ROSTER,
  calculateStaffUpkeep,
  FOOD_CATEGORY_INFO,
} from '@/data/workerUpkeep';

import {
  getCircadianClock,
  getWorkerScheduleTelemetry,
  type ShiftType,
  SHIFT_DEFINITIONS,
} from '@/game/shiftEngine';

interface SpecialistWorkersSectionProps {
  onSelectTab?: (tab: string) => void;
}

export function SpecialistWorkersSection({ onSelectTab }: SpecialistWorkersSectionProps) {
  const {
    coins,
    specialistWorkers,
    unifiedWorkers,
    payrollVaultCoins,
    staffPantry,
    farmEpochStart,
    bunkhouse,
    hireSpecialistWorker,
    toggleSpecialistDuty,
    dismissSpecialistWorker,
    paySpecialistBackPay,
    assignWorkerShift,
    callEmergencyOvertime,
    wranglerPolicy,
    updateWranglerPolicy,
  } = useGameStore();

  const [tessaDrawerOpen, setTessaDrawerOpen] = useState(false);
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

  const clock = getCircadianClock(now, farmEpochStart);

  return (
    <div className="bg-gradient-to-b from-stone-900/90 to-stone-950/95 dark:from-gray-900 dark:to-black rounded-2xl border border-amber-500/30 p-5 shadow-xl shadow-amber-950/20 backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🐾</span>
            <h3 className="font-extrabold text-lg sm:text-xl text-amber-300 tracking-wide flex items-center gap-2">
              Livestock & Expedition Specialists
            </h3>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
              Contract Staff
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Contract specialized handlers to automate wild beast transport, feed routines, and incubator genetics.
          </p>
        </div>

        {/* Global summary badge & Workers Shift Timing on Top */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs bg-stone-950/90 border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="text-amber-400 font-extrabold flex items-center gap-1">
              <span>{clock.activeShiftDef.icon}</span>
              <span>{clock.activeShiftDef.shortName} Shift</span>
            </span>
            <span className="text-stone-600">•</span>
            <span className="font-mono text-stone-300 font-bold">{clock.inGameTime24}</span>
            <span className="text-stone-600">•</span>
            <span className="font-mono text-amber-300 font-black">⏳ {clock.nextShiftChangeFormatted}</span>
          </div>

          <div className="flex items-center gap-2 text-xs bg-stone-800/80 border border-stone-700/60 px-3 py-1.5 rounded-xl">
            <span className="text-stone-400 font-medium">Hired Specialists:</span>
            <span className="font-bold text-amber-400">
              {Object.values(specialistWorkers || {}).filter(w => w.isHired).length} / {LIVESTOCK_WORKER_ROSTER.length}
            </span>
          </div>
        </div>
      </div>

      {/* Responsive Specialist Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {LIVESTOCK_WORKER_ROSTER.map(worker => {
          const state = specialistWorkers?.[worker.id] || {
            id: worker.id,
            isHired: false,
            isActive: false,
            isStriking: false,
            hiredAt: null,
            unpaidWages: 0,
            totalWagesPaid: 0,
          };

          const canAffordHire = coins >= worker.hireCostCoins;
          const isHired = state.isHired;
          const isActive = state.isActive;
          const isStriking = state.isStriking;
          const unpaidWages = state.unpaidWages || 0;
          const canAffordBackpay = coins >= unpaidWages;

          const schedule = getWorkerScheduleTelemetry({
            worker: state,
            roleOrId: worker.id,
            baseDailyWage: worker.dailyWageCoins,
            timestamp: now,
            epochStart: farmEpochStart,
            bunkhouseLevel: bunkhouse?.level || 1,
          });

          return (
            <div
              key={worker.id}
              className={`relative rounded-xl border flex flex-col justify-between p-4 transition-all duration-200 overflow-hidden ${
                isHired
                  ? isStriking
                    ? 'border-red-500/60 bg-gradient-to-b from-red-950/30 to-stone-900 shadow-md shadow-red-900/20'
                    : isActive
                    ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-950/25 via-stone-900 to-stone-950 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/20'
                    : 'border-stone-700 bg-stone-900/60 opacity-80'
                  : 'border-stone-800 bg-stone-900/40 hover:border-stone-700 hover:bg-stone-900/70'
              }`}
            >
              {/* Background Glow Effect */}
              {isHired && isActive && !isStriking && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
              )}

              <div>
                {/* Top Row: Avatar & Identity & Status Badge */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border-2 shrink-0 ${worker.themeColor.border} bg-stone-900/90`}
                  >
                    {worker.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-sm text-stone-100 truncate">{worker.name}</h4>
                      {/* Status Tag */}
                      {isHired ? (
                        isStriking ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-500/40 animate-pulse">
                            ⚠️ Strike
                          </span>
                        ) : schedule.isOvertime ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-500/40 animate-pulse">
                            ☕ Overtime
                          </span>
                        ) : schedule.phase === 'on_shift' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            On Duty
                          </span>
                        ) : schedule.phase === 'sleeping' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-500/40">
                            🌙 Asleep
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-500/40">
                            ☕ Off-Duty
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700/60">
                          Available
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-amber-400 mt-0.5 flex items-center gap-1">
                      <span>{worker.title}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        🪙 <span className="font-bold text-amber-200">{worker.dailyWageCoins}</span> / cycle
                      </span>
                      <span className="text-stone-600">·</span>
                      <span className="text-[10px] text-stone-400 truncate flex items-center gap-1">
                        {worker.stationEmoji} {worker.station.split('&')[0].trim()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shift Selector & Telemetry Banner for Hired Workers */}
                {isHired && (
                  <div className="mt-2.5 p-2 rounded-lg bg-stone-950/80 border border-stone-800 space-y-1.5">
                    <div className="flex items-center justify-between gap-1 flex-wrap text-[10px]">
                      <span className="text-stone-400 font-semibold flex items-center gap-1">
                        <span>🕒</span> Shift Roster:
                      </span>
                      <select
                        value={schedule.shiftType}
                        onChange={(e) => assignWorkerShift(worker.id, e.target.value as ShiftType)}
                        className="bg-stone-900 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 text-[10px] cursor-pointer"
                        title="Reassign shift (initiates 1-day adjustment period)"
                      >
                        <option value="morning">☀️ Morning Shift (06:00-18:00 · 15m)</option>
                        <option value="night">🌙 Night Watch (18:00-06:00 · 15m)</option>
                        {schedule.shiftType === 'evening' && (
                          <option value="evening">☕ Legacy Evening (Migrate to Morning/Night)</option>
                        )}
                      </select>
                    </div>

                    {/* Operational Phase & Time Remaining */}
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-stone-800/80 gap-1 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded font-black border text-[9px] ${schedule.phaseColorClass}`}>
                        {schedule.phaseBadgeText}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                        <span>⏳</span>
                        <span>{schedule.timeRemainingFormatted}</span>
                      </span>
                      {schedule.isWellRested && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ✨ Well-Rested (+15%)
                        </span>
                      )}
                      {schedule.isExhausted && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                          ⚠️ Exhausted (60%)
                        </span>
                      )}
                    </div>

                    {/* Stamina Meter */}
                    <div className="space-y-0.5 pt-1">
                      <div className="flex items-center justify-between text-[9px] text-stone-400">
                        <span>⚡ Stamina: <b className={schedule.stamina >= 100 ? 'text-emerald-400' : 'text-amber-400'}>{schedule.stamina}%</b></span>
                        <span className="italic">{schedule.phase === 'sleeping' ? 'Resting in Bunkhouse' : schedule.isOnDuty ? 'Active Duty' : 'Off-Duty'}</span>
                      </div>
                      <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            schedule.stamina >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${schedule.stamina}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Upkeep Metric Badge & Status Pills */}
                {(() => {
                  const upkeep = WORKER_UPKEEP_ROSTER[worker.id];
                  const upkeepStatus = telemetry.workerUpkeeps[worker.id];
                  const morale = state.moraleTier || (state.isStriking ? 'striking' : 'content');

                  return (
                    <>
                      {upkeep && (
                        <div className="mt-2.5 p-2 rounded-lg bg-stone-950/70 border border-stone-800 text-[10px] space-y-1">
                          <div className="flex items-center justify-between text-stone-300 font-semibold flex-wrap gap-1">
                            <span className="flex items-center gap-1 font-bold text-amber-400">
                              <span>💰</span>
                              <span>{upkeep.baseDailyWage} Coins</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span>{FOOD_CATEGORY_INFO[upkeep.dietaryCategory].icon}</span>
                              <span>{upkeep.dietaryUnits} {FOOD_CATEGORY_INFO[upkeep.dietaryCategory].label}</span>
                            </span>
                            <span className="flex items-center gap-1 text-yellow-400">
                              <span>⭐</span>
                              <span>Fav: {upkeep.favoriteRecipeEmoji} {upkeep.favoriteRecipeName}</span>
                            </span>
                          </div>

                          {isHired && (
                            <div className="flex items-center justify-between pt-1 border-t border-stone-800 gap-1 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                                  upkeepStatus?.isWageSecured
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {upkeepStatus?.isWageSecured ? '🟢 Wage: In Vault' : '⚠️ Wage: Unfunded'}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                                  upkeepStatus?.isRationAvailable
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {upkeepStatus?.isRationAvailable ? '🟢 Ration: In Pantry' : '⚠️ Ration: Missing'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {isHired && morale === 'inspired' && (
                        <div className="mt-2 p-1.5 rounded-lg bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-[10px] font-bold flex items-center gap-1.5">
                          <span>✨</span>
                          <span>Inspired (+20% Efficiency) — Fed favorite recipe {upkeep?.favoriteRecipeEmoji}!</span>
                        </div>
                      )}
                      {isHired && morale === 'grumbling' && (
                        <div className="mt-2 p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1.5">
                          <span>⚠️</span>
                          <span>Grumbling — Operating at 50% Speed</span>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Description */}
                <p className="text-xs text-stone-300/90 mt-3 leading-relaxed border-t border-stone-800/80 pt-2.5">
                  {worker.description}
                </p>

                {/* Itemized Perks List */}
                <div className="mt-3 space-y-1.5 bg-stone-950/60 rounded-lg p-2.5 border border-stone-800/60">
                  <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1">
                    ✨ Passive Automation Perks
                  </span>
                  <ul className="space-y-1 text-xs text-stone-300">
                    {worker.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 leading-tight">
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                        <span className="text-stone-300 text-[11px]">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Embedded Policy Settings Drawer on Tessa's Card */}
                {worker.id === 'worker_wrangler_tessa' && (
                  <div className="mt-3 border-t border-stone-800/80 pt-2.5">
                    <button
                      onClick={() => setTessaDrawerOpen(!tessaDrawerOpen)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-stone-950/80 hover:bg-stone-850 border border-stone-700/60 text-xs font-bold text-amber-300 transition-all shadow-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>⚙️</span>
                        <span>Feed Selection Policy & Floors</span>
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {tessaDrawerOpen ? '▲ Hide' : '▼ Edit'}
                      </span>
                    </button>

                    {tessaDrawerOpen && (
                      <div className="mt-2 p-3 bg-stone-950/90 rounded-xl border border-amber-500/30 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                        {/* Toggle Automation */}
                        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                          <div>
                            <div className="text-xs font-bold text-stone-200">Auto-Feeding Routine</div>
                            <div className="text-[10px] text-stone-400">Paddock Wrangler feed execution</div>
                          </div>
                          <button
                            onClick={() => updateWranglerPolicy({ isEnabled: !wranglerPolicy?.isEnabled })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              wranglerPolicy?.isEnabled
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-stone-800 text-stone-400 border border-stone-700'
                            }`}
                          >
                            {wranglerPolicy?.isEnabled ? '🟢 Enabled' : '⏸️ Paused'}
                          </button>
                        </div>

                        {/* Strategy Selector */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                            Feeding Strategy
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => updateWranglerPolicy({ strategy: 'budget_saver' })}
                              className={`p-2 rounded-lg text-left transition-all border ${
                                wranglerPolicy?.strategy === 'budget_saver'
                                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                              }`}
                            >
                              <div className="text-xs font-bold flex items-center gap-1">
                                <span>🌾</span> Budget Saver
                              </div>
                              <div className="text-[10px] text-stone-400 mt-0.5 leading-tight">
                                Cheapest crops & feed first
                              </div>
                            </button>

                            <button
                              onClick={() => updateWranglerPolicy({ strategy: 'gourmet_breeder' })}
                              className={`p-2 rounded-lg text-left transition-all border ${
                                wranglerPolicy?.strategy === 'gourmet_breeder'
                                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/30'
                                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                              }`}
                            >
                              <div className="text-xs font-bold flex items-center gap-1">
                                <span>⭐</span> Gourmet
                              </div>
                              <div className="text-[10px] text-stone-400 mt-0.5 leading-tight">
                                Species favorites first
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Global Safety Reserve Floor */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                              Global Barn Reserve Floor
                            </span>
                            <span className="font-mono font-bold text-amber-300">
                              {wranglerPolicy?.globalReserveFloor ?? 10} crops
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400 leading-snug">
                            Caretakers will NEVER consume Barn crops when supply is at or below this floor, protecting your delivery contracts.
                          </p>
                          <div className="flex items-center gap-1 pt-1">
                            {[5, 10, 25, 50].map(floor => (
                              <button
                                key={floor}
                                onClick={() => updateWranglerPolicy({ globalReserveFloor: floor })}
                                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                                  (wranglerPolicy?.globalReserveFloor ?? 10) === floor
                                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                                    : 'bg-stone-900 text-stone-400 hover:bg-stone-800 border border-stone-800'
                                }`}
                              >
                                {floor}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Shortcut to Barn Locks */}
                        {onSelectTab && (
                          <button
                            onClick={() => onSelectTab('barn')}
                            className="w-full py-1.5 px-2 rounded-lg bg-stone-900 hover:bg-stone-850 text-amber-300 hover:text-amber-200 text-[11px] font-bold transition-all border border-amber-500/20 flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>🔒</span>
                            <span>Manage Individual Crop Locks in Barn Tab</span>
                            <span>➔</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-4 pt-3 border-t border-stone-800 flex flex-col gap-2">
                {!isHired ? (
                  <button
                    onClick={() => hireSpecialistWorker(worker.id)}
                    disabled={!canAffordHire}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                      canAffordHire
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/20 active:scale-95'
                        : 'bg-stone-800/80 text-stone-500 border border-stone-700/50 cursor-not-allowed'
                    }`}
                  >
                    <span>🤝</span>
                    {canAffordHire ? (
                      <span>Hire for 🪙 {worker.hireCostCoins} Coins</span>
                    ) : (
                      <span>Need 🪙 {worker.hireCostCoins} Coins (Short {worker.hireCostCoins - coins})</span>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    {/* Strike Warning & Settle Back Pay */}
                    {isStriking && (
                      <div className="bg-red-950/50 border border-red-500/40 rounded-lg p-2 space-y-1.5">
                        <div className="text-[11px] text-red-300 font-medium">
                          Unpaid Wages: <span className="font-bold text-amber-400">🪙 {unpaidWages}</span>
                        </div>
                        <button
                          onClick={() => paySpecialistBackPay(worker.id)}
                          disabled={!canAffordBackpay}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                            canAffordBackpay
                              ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
                              : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          {canAffordBackpay ? `Settle Back Pay (🪙 ${unpaidWages})` : `Need 🪙 ${unpaidWages} to Settle`}
                        </button>
                      </div>
                    )}

                    {/* Emergency Overtime Callout */}
                    {schedule.canCallOvertime && (
                      <button
                        onClick={() => callEmergencyOvertime(worker.id)}
                        className="w-full py-1.5 px-3 rounded-xl text-xs font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title={`Wake worker for a 4-hour rush shift (-🪙${schedule.overtimeCostCoins} + snack)`}
                      >
                        <span>☕</span>
                        <span>Call Emergency Overtime (-🪙{schedule.overtimeCostCoins})</span>
                      </button>
                    )}

                    {/* Duty Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSpecialistDuty(worker.id)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isActive
                            ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <span>⏸️</span>
                            <span>Pause (Rest)</span>
                          </>
                        ) : (
                          <>
                            <span>🟢</span>
                            <span>Resume (Duty)</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => dismissSpecialistWorker(worker.id)}
                        className="py-2 px-3 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-red-950/60 text-stone-400 hover:text-red-400 border border-stone-800 hover:border-red-800/60 transition-all"
                        title="Dismiss Specialist"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
