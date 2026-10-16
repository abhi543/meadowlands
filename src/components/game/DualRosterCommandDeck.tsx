'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  getCircadianClock,
  getWorkerScheduleTelemetry,
  type ShiftType,
} from '@/game/shiftEngine';
import { WORKER_REGISTRY, type WorkerRole } from '@/game/data';
import { LIVESTOCK_WORKER_ROSTER } from '@/data/workerCatalog';
import { WORKER_UPKEEP_ROSTER } from '@/data/workerUpkeep';

export function DualRosterCommandDeck() {
  const {
    unifiedWorkers,
    specialistWorkers,
    farmEpochStart,
    bunkhouse,
    payrollVaultCoins,
    staffPantry,
    assignWorkerShift,
    callEmergencyOvertime,
  } = useGameStore();

  const [overtimeWorkerId, setOvertimeWorkerId] = useState<string>('');
  const [reassignModalSlot, setReassignModalSlot] = useState<'morning' | 'night' | null>(null);

  const now = Date.now();
  const clock = getCircadianClock(now, farmEpochStart);

  // Collect all hired workers
  const hiredWorkers: Array<{
    id: string;
    name: string;
    roleOrTitle: string;
    emoji: string;
    shift: ShiftType;
    isSpecialist: boolean;
    baseWage: number;
    workerObj: any;
  }> = [];

  if (unifiedWorkers) {
    for (const [role, w] of Object.entries(unifiedWorkers)) {
      if (w?.isHired) {
        const meta = WORKER_REGISTRY[role as WorkerRole];
        const upkeep = WORKER_UPKEEP_ROSTER[role];
        const rawShift = w.shiftType || 'morning';
        const shift: ShiftType = rawShift === 'morning' ? 'morning' : 'night';
        hiredWorkers.push({
          id: role,
          name: meta?.name || role,
          roleOrTitle: meta?.description || 'Field Specialist',
          emoji: meta?.emoji || '👷',
          shift,
          isSpecialist: false,
          baseWage: upkeep?.baseDailyWage || 15,
          workerObj: w,
        });
      }
    }
  }

  if (specialistWorkers) {
    for (const [sId, sp] of Object.entries(specialistWorkers)) {
      if (sp?.isHired) {
        const meta = LIVESTOCK_WORKER_ROSTER.find(r => r.id === sId);
        const upkeep = WORKER_UPKEEP_ROSTER[sId];
        const rawShift = sp.shiftType || 'night';
        const shift: ShiftType = rawShift === 'morning' ? 'morning' : 'night';
        hiredWorkers.push({
          id: sId,
          name: meta?.name || sId,
          roleOrTitle: meta?.title || 'Expedition Specialist',
          emoji: meta?.avatar || '🐾',
          shift,
          isSpecialist: true,
          baseWage: meta?.dailyWageCoins || upkeep?.baseDailyWage || 20,
          workerObj: sp,
        });
      }
    }
  }

  // Active Morning and Night Leads
  const morningWorkers = hiredWorkers.filter(w => w.shift === 'morning');
  const nightWorkers = hiredWorkers.filter(w => w.shift === 'night');

  const slotA = morningWorkers[0] || null;
  const slotB = nightWorkers[0] || null;

  // Telemetry for Slot A & Slot B
  const slotATelemetry = slotA
    ? getWorkerScheduleTelemetry({
        worker: slotA.workerObj,
        roleOrId: slotA.id,
        baseDailyWage: slotA.baseWage,
        timestamp: now,
        epochStart: farmEpochStart,
        bunkhouseLevel: bunkhouse?.level || 1,
      })
    : null;

  const slotBTelemetry = slotB
    ? getWorkerScheduleTelemetry({
        worker: slotB.workerObj,
        roleOrId: slotB.id,
        baseDailyWage: slotB.baseWage,
        timestamp: now,
        epochStart: farmEpochStart,
        bunkhouseLevel: bunkhouse?.level || 1,
      })
    : null;

  // Candidates for overtime during Twilight Gap
  const overtimeCandidates = hiredWorkers.filter(w => {
    const tele = getWorkerScheduleTelemetry({
      worker: w.workerObj,
      roleOrId: w.id,
      baseDailyWage: w.baseWage,
      timestamp: now,
      epochStart: farmEpochStart,
      bunkhouseLevel: bunkhouse?.level || 1,
    });
    return tele.canCallOvertime;
  });

  const selectedOvertimeWorker = overtimeCandidates.find(w => w.id === overtimeWorkerId) || overtimeCandidates[0] || null;

  const handleTriggerOvertime = () => {
    if (!selectedOvertimeWorker) return;
    callEmergencyOvertime(selectedOvertimeWorker.id);
  };

  return (
    <div className="bg-gradient-to-b from-stone-900/95 via-stone-900/90 to-stone-950/95 rounded-2xl border border-amber-500/30 p-4 sm:p-5 shadow-xl shadow-amber-950/20 backdrop-blur-md space-y-4">
      {/* Header & 0% Tax Protection Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl animate-pulse">⚖️</span>
            <h3 className="font-extrabold text-base sm:text-lg text-amber-300 tracking-wide flex items-center gap-2">
              Dual-Roster Labor Command Deck
            </h3>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
              0% Guild Tax Bracket (Capped at 2 Slots)
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
            Staggered 2-shift cadence locks payroll into the 0% surcharge bracket, preserving Staff Pantry food runway while passive systems advance during the Twilight Gap.
          </p>
        </div>

        {/* Economic Protection Pills */}
        <div className="flex items-center gap-2 text-xs flex-wrap self-start lg:self-auto">
          <div className="bg-stone-950/80 border border-stone-800 px-3 py-1.5 rounded-xl shadow-inner flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">💰 Payroll Rate:</span>
            <span className="font-mono text-stone-200">
              {slotA && slotB ? `${slotA.baseWage + slotB.baseWage} Coins/Day` : 'Optimal (0% Surcharge)'}
            </span>
          </div>
          <div className="bg-stone-950/80 border border-stone-800 px-3 py-1.5 rounded-xl shadow-inner flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">🥣 Food Burn:</span>
            <span className="font-mono text-stone-200">2 Portions / Cycle</span>
          </div>
        </div>
      </div>

      {/* Roster Slot Management Deck (Slot A: Morning + Slot B: Night) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slot A: Morning Specialist */}
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-stone-900 to-stone-950 p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
                {slotA ? slotA.emoji : '☀️'}
              </div>
              <div>
                <div className="text-[10px] uppercase font-black tracking-wider text-amber-400 flex items-center gap-1">
                  <span>☀️ Slot A:</span>
                  <span>Morning Crew (06:00 – 14:00)</span>
                </div>
                <h4 className="font-bold text-sm text-stone-100 mt-0.5">
                  {slotA ? slotA.name : 'No Morning Worker Assigned'}
                </h4>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  {slotA ? slotA.roleOrTitle : 'Assign personnel to automate morning harvest'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setReassignModalSlot('morning')}
              className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 text-[10px] font-bold border border-stone-700 transition-all cursor-pointer shrink-0"
              title="Reassign Morning Crew Lead"
            >
              🔄 Swap
            </button>
          </div>

          {/* Assigned Duties Focus */}
          <div className="bg-stone-950/70 rounded-lg p-2.5 border border-stone-800/80 text-[11px] space-y-1">
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              Morning Responsibilities:
            </div>
            <p className="text-stone-300 leading-tight">
              Plot irrigation, harvest overnight crops, morning dairy/egg collections, and primary artisan loading.
            </p>
          </div>

          {/* Live Status Pill */}
          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-stone-400 font-medium text-[11px]">Roster Status:</span>
            {slotA && slotATelemetry ? (
              clock.activeShift === 'morning' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>🟢 In Field (Ends in {slotATelemetry.timeRemainingFormatted})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold text-[11px]">
                  <span>🌙</span>
                  <span>Sleeping in Bunkhouse (Wakes at 06:00)</span>
                </span>
              )
            ) : (
              <span className="text-stone-500 text-[11px] italic">Unassigned slot</span>
            )}
          </div>
        </div>

        {/* Slot B: Night Specialist */}
        <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/20 via-stone-900 to-stone-950 p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl shrink-0">
                {slotB ? slotB.emoji : '🌙'}
              </div>
              <div>
                <div className="text-[10px] uppercase font-black tracking-wider text-indigo-400 flex items-center gap-1">
                  <span>🌙 Slot B:</span>
                  <span>Night Watch (22:00 – 06:00)</span>
                </div>
                <h4 className="font-bold text-sm text-stone-100 mt-0.5">
                  {slotB ? slotB.name : 'No Night Worker Assigned'}
                </h4>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  {slotB ? slotB.roleOrTitle : 'Assign personnel to tend nocturnal beasts'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setReassignModalSlot('night')}
              className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-indigo-300 text-[10px] font-bold border border-stone-700 transition-all cursor-pointer shrink-0"
              title="Reassign Night Watch Lead"
            >
              🔄 Swap
            </button>
          </div>

          {/* Assigned Duties Focus */}
          <div className="bg-stone-950/70 rounded-lg p-2.5 border border-stone-800/80 text-[11px] space-y-1">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
              Nocturnal Responsibilities:
            </div>
            <p className="text-stone-300 leading-tight">
              Tending nocturnal wild beasts, emptying completed artisan machines into Home Barn, pest defense, and sunrise plot prep.
            </p>
          </div>

          {/* Live Status Pill */}
          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-stone-400 font-medium text-[11px]">Roster Status:</span>
            {slotB && slotBTelemetry ? (
              clock.activeShift === 'night' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>🟢 In Field (Ends in {slotBTelemetry.timeRemainingFormatted})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold text-[11px]">
                  <span>🌙</span>
                  <span>Sleeping in Bunkhouse (Wakes at 22:00)</span>
                </span>
              )
            ) : (
              <span className="text-stone-500 text-[11px] italic">Unassigned slot</span>
            )}
          </div>
        </div>
      </div>

      {/* Section 4.C: Twilight Gap Telemetry & Emergency Override */}
      {clock.isTwilightGap && (
        <div className="rounded-xl border border-slate-600/60 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-stone-900/95 p-4 space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-3xl animate-pulse flex-shrink-0">☕</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-slate-700/80 text-amber-300 border border-slate-500">
                    Twilight Gap Active (14:00 – 22:00)
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Ends in {clock.nextShiftChangeFormatted}
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Farm in passive cycle. Artisan machines running. Field chores resume at 22:00. Zero wage burn rate during this window.
                </p>
              </div>
            </div>

            {/* Emergency Call-Out Button */}
            {selectedOvertimeWorker && (
              <div className="flex flex-col gap-1 sm:items-end shrink-0">
                <button
                  onClick={handleTriggerOvertime}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Wake standby worker for a 4-hour temporary rush shift"
                >
                  <span>☕</span>
                  <span>Summon Standby Worker ({selectedOvertimeWorker.name})</span>
                </button>
                <span className="text-[10px] text-amber-300/90 font-mono">
                  Deducts 1.5x Hourly Wage (-🪙{Math.max(1, Math.round(selectedOvertimeWorker.baseWage * 0.75))}) + 1 Snack from Pantry
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Personnel Reassignment Modal / Selector Drawer */}
      {reassignModalSlot && (
        <div className="p-3 bg-stone-950/95 rounded-xl border border-amber-500/40 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">
              Select Personnel for {reassignModalSlot === 'morning' ? '☀️ Morning Crew (06:00-14:00)' : '🌙 Night Watch (22:00-06:00)'}:
            </span>
            <button
              onClick={() => setReassignModalSlot(null)}
              className="text-stone-400 hover:text-white text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 max-h-48 overflow-y-auto">
            {hiredWorkers.map(w => (
              <button
                key={w.id}
                onClick={() => {
                  assignWorkerShift(w.id, reassignModalSlot);
                  setReassignModalSlot(null);
                }}
                className={`p-2 rounded-lg border text-left transition-all text-xs flex items-center gap-2 ${
                  w.shift === reassignModalSlot
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                    : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                }`}
              >
                <span className="text-lg">{w.emoji}</span>
                <div className="min-w-0 truncate">
                  <div className="font-bold truncate">{w.name}</div>
                  <div className="text-[10px] text-stone-400">{w.shift === 'morning' ? '☀️ Morn' : '🌙 Night'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
