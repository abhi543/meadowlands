'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  calculateGrievanceDossier,
  type StrikeGrievanceDossier,
} from '@/game/strikeResolution';
import { WORKER_UPKEEP_ROSTER } from '@/data/workerUpkeep';

interface GrievanceResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWorkerId?: string | null;
}

export function GrievanceResolutionModal({
  isOpen,
  onClose,
  initialWorkerId,
}: GrievanceResolutionModalProps) {
  const {
    coins,
    payrollVaultCoins,
    staffPantry = {},
    silo = {},
    barn = {},
    unifiedWorkers,
    specialistWorkers,
    resolveWorkerStrikeAccord,
    grantWorkerSabbatical,
    terminateWorkerWithSeverance,
  } = useGameStore();

  // Find all workers that are either on strike or on sabbatical
  const disputingWorkers: { id: string; name: string; emoji: string; status: 'striking' | 'sabbatical'; isSpecialist: boolean; rawObj: any }[] = [];

  if (unifiedWorkers) {
    for (const [role, w] of Object.entries(unifiedWorkers)) {
      if (w?.isHired && (w.moraleTier === 'striking' || w.moraleTier === 'sabbatical')) {
        const cfg = WORKER_UPKEEP_ROSTER[role];
        disputingWorkers.push({
          id: role,
          name: cfg?.name || role,
          emoji: cfg?.emoji || '👷',
          status: w.moraleTier,
          isSpecialist: false,
          rawObj: w,
        });
      }
    }
  }

  if (specialistWorkers) {
    for (const [sId, sp] of Object.entries(specialistWorkers)) {
      if (sp?.isHired && (sp.moraleTier === 'striking' || sp.isStriking || sp.moraleTier === 'sabbatical')) {
        const cfg = WORKER_UPKEEP_ROSTER[sId];
        disputingWorkers.push({
          id: sId,
          name: cfg?.name || sId,
          emoji: cfg?.emoji || '🐾',
          status: sp.moraleTier === 'sabbatical' ? 'sabbatical' : 'striking',
          isSpecialist: true,
          rawObj: sp,
        });
      }
    }
  }

  const defaultId = initialWorkerId && disputingWorkers.some(w => w.id === initialWorkerId)
    ? initialWorkerId
    : disputingWorkers[0]?.id || null;

  const [selectedId, setSelectedId] = useState<string | null>(defaultId);

  // Sync selectedId if props change or if currently selected worker is resolved
  const currentSelected = disputingWorkers.find(w => w.id === (selectedId || defaultId)) || disputingWorkers[0];

  if (!isOpen) return null;

  if (!currentSelected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-stone-900 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3 text-stone-100 shadow-2xl">
          <div className="text-4xl">🕊️</div>
          <h3 className="font-extrabold text-lg text-emerald-400">All Labor Disputes Resolved!</h3>
          <p className="text-xs text-stone-400">
            No active strikes or furloughed contracts found. All staff are on duty or resting peacefully in the bunkhouse.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs transition-all cursor-pointer shadow-md"
          >
            Close Arbitration Chamber
          </button>
        </div>
      </div>
    );
  }

  const dossier: StrikeGrievanceDossier = calculateGrievanceDossier({
    workerId: currentSelected.id,
    workerObj: currentSelected.rawObj,
    coins,
    payrollVaultCoins,
    staffPantry,
    silo,
    barn,
  });

  const handleSignAccord = () => {
    const success = resolveWorkerStrikeAccord(currentSelected.id);
    if (success && disputingWorkers.length <= 1) {
      onClose();
    }
  };

  const handleGrantSabbatical = () => {
    const success = grantWorkerSabbatical(currentSelected.id);
    if (success && disputingWorkers.length <= 1) {
      onClose();
    }
  };

  const handleTerminate = () => {
    if (window.confirm(`Are you sure you want to dismiss ${dossier.workerName}? You will pay 🪙${dossier.severanceFeeCoins} severance, and their contract will be permanently severed.`)) {
      const success = terminateWorkerWithSeverance(currentSelected.id);
      if (success && disputingWorkers.length <= 1) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-stone-900 border-2 border-rose-600/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="p-4 bg-gradient-to-r from-rose-950 via-stone-900 to-rose-950/90 border-b border-rose-600/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 animate-pulse">
              🪧
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-rose-300 uppercase tracking-wider">
                  Labor Guild Grievance Arbitration
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-200 border border-rose-500/50">
                  {dossier.isSabbatical ? 'Contract Furloughed' : 'Active Strike'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Official Labor Union Mediation Dossier · Case ID: #{dossier.workerId.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Worker Switcher Tabs (if multiple disputes active) */}
        {disputingWorkers.length > 1 && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-stone-800 bg-stone-950/60 overflow-x-auto text-xs">
            <span className="text-[10px] uppercase font-bold text-stone-500 shrink-0">Disputes ({disputingWorkers.length}):</span>
            {disputingWorkers.map(w => (
              <button
                key={w.id}
                onClick={() => setSelectedId(w.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                  w.id === currentSelected.id
                    ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <span>{w.emoji}</span>
                <span>{w.name}</span>
                <span className="text-[9px] opacity-75">({w.status === 'sabbatical' ? 'Sabbatical' : 'Strike'})</span>
              </button>
            ))}
          </div>
        )}

        {/* Dossier Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Employee & Cause Card */}
          <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-3.5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-2xl shrink-0">
                {dossier.workerEmoji}
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-stone-100 flex items-center gap-2">
                  <span>{dossier.workerName}</span>
                  <span className="text-[11px] font-normal text-stone-400">({dossier.workerRoleOrTitle})</span>
                </h3>
                <div className="text-[11px] text-rose-300 font-medium mt-0.5">
                  Cause of Dispute: Unpaid Daily Wages &amp; Empty Commissary for {dossier.missedCycles} Consecutive Shifts
                </div>
              </div>
            </div>
          </div>

          {/* Accrued Claims & Demands Box */}
          <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-stone-950 to-stone-950 p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Accrued Claims &amp; Union Demands:
              </span>
              <span className="text-[10px] text-stone-400">
                Guild Arbitration Standard §4.2
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span className="flex items-center gap-1.5">
                  <span>🪙</span> Base Back-Wages:
                </span>
                <span>{dossier.accruedBackWages} Coins ({dossier.baseDailyWage}c × {dossier.missedCycles} shifts)</span>
              </div>

              <div className="flex justify-between items-center text-stone-300">
                <span className="flex items-center gap-1.5">
                  <span>⚖️</span> Guild Grievance Penalty (25% Flat Surcharge):
                </span>
                <span>+{dossier.guildPenaltyFee} Coins</span>
              </div>

              <div className="pt-1.5 border-t border-stone-800 flex justify-between items-center font-bold text-amber-300 text-sm">
                <span>Total Currency Required:</span>
                <span className="flex items-center gap-1">
                  <span>🪙</span>
                  <span>{dossier.totalSettleCoins} Coins</span>
                </span>
              </div>

              <div className="flex justify-between items-center text-emerald-300 pt-1">
                <span className="flex items-center gap-1.5 font-sans font-medium">
                  <span>🍲</span> Commissary Deficit:
                </span>
                <span className="font-bold">
                  {dossier.rationsDemandedTotal}x Units of {dossier.dietaryCategoryLabel}
                </span>
              </div>
            </div>

            {/* Desertion Threat Banner */}
            <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
              dossier.isSabbatical
                ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{dossier.isSabbatical ? '🛑' : '⏳'}</span>
                <div>
                  <div className="font-sans font-bold text-[11px]">
                    {dossier.isSabbatical ? 'Desertion Timer Paused:' : 'Desertion Threat (Hard Deadline):'}
                  </div>
                  <div className="text-[10px] opacity-80 font-sans">
                    {dossier.isSabbatical
                      ? 'Worker resides in village inn. Desertion timer frozen indefinitely.'
                      : 'If unhandled, worker permanently packs belongings and departs homestead.'}
                  </div>
                </div>
              </div>
              <div className="font-mono font-black text-xs text-right whitespace-nowrap">
                {dossier.desertionFormatted}
              </div>
            </div>
          </div>

          {/* Resource Runway Audit */}
          <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-stone-950 border border-stone-800 font-mono">
            <div>
              <span className="text-stone-400">Available Coins:</span>
              <div className="font-bold text-amber-300">
                🪙 {(payrollVaultCoins + coins).toLocaleString()} ({payrollVaultCoins} Vault + {coins} Wallet)
              </div>
            </div>
            <div>
              <span className="text-stone-400">Matching Food in Storage:</span>
              <div className={`font-bold ${dossier.canAffordAccordFood ? 'text-emerald-400' : 'text-rose-400'}`}>
                🥣 {dossier.totalAvailableFoodUnits} / {dossier.rationsDemandedTotal} Units available
              </div>
            </div>
          </div>

          {/* Three Resolution Pathways */}
          <div className="space-y-2.5 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Select Grievance Resolution Pathway:
            </div>

            {/* Path 1: Sign Accord & Settle */}
            <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-stone-950 to-stone-900 p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold text-xs sm:text-sm text-emerald-300 flex items-center gap-1.5">
                    <span>🤝</span>
                    <span>Path 1: The Full Accord (Settle &amp; Return to Duty)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                    Liquidate full accrued debt ({dossier.totalSettleCoins} Coins + {dossier.rationsDemandedTotal} rations). Immediately clears strike status, resets desertion timer, and grants the worker the temporary <strong className="text-emerald-300">+10% Appreciated Staff speed boost</strong> for their upcoming shift.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSignAccord}
                disabled={!dossier.canSignAccord}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md ${
                  dossier.canSignAccord
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 shadow-emerald-500/20 active:scale-98 cursor-pointer'
                    : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                }`}
              >
                <span>🤝 Sign Accord &amp; Settle</span>
                <span className="font-mono bg-black/20 px-2 py-0.5 rounded text-[11px]">
                  🪙{dossier.totalSettleCoins} + {dossier.rationsDemandedTotal}x Food
                </span>
              </button>
              {!dossier.canSignAccord && (
                <div className="text-[10px] text-rose-400 text-center font-mono">
                  {!dossier.canAffordAccordCoins && `Insufficient funds (Need 🪙${dossier.totalSettleCoins}). `}
                  {!dossier.canAffordAccordFood && `Insufficient matching food in Pantry/Silo/Barn (Need ${dossier.rationsDemandedTotal} units).`}
                </div>
              )}
            </div>

            {/* Path 2: Unpaid Sabbatical (Expense Freeze) */}
            <div className="rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-950/30 via-stone-950 to-stone-900 p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold text-xs sm:text-sm text-blue-300 flex items-center gap-1.5">
                    <span>🛑</span>
                    <span>Path 2: Unpaid Sabbatical (Expense &amp; Timer Freeze)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                    Furloughs worker to the village inn. Freezes daily wages and food burn to exactly <strong>0 Coins &amp; 0 Rations/Day</strong>. Freezes the 2-hour desertion countdown clock indefinitely so you can recover your farm finances. Recall them at any time by paying the locked debt.
                  </p>
                </div>
              </div>

              {!dossier.isSabbatical ? (
                <button
                  onClick={handleGrantSabbatical}
                  className="w-full py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
                >
                  <span>🛑 Grant Unpaid Sabbatical (Freeze Expenses &amp; Timer)</span>
                </button>
              ) : (
                <div className="py-2 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 text-center text-xs font-bold">
                  ✓ Worker is currently on Sabbatical. Sign Accord above to recall to active duty!
                </div>
              )}
            </div>

            {/* Path 3: Contract Termination & Severance */}
            <div className="rounded-xl border border-stone-800 bg-stone-950 p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold text-xs sm:text-sm text-stone-300 flex items-center gap-1.5">
                    <span>📜</span>
                    <span>Path 3: Contract Termination &amp; Severance (Clean Slate)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                    Pay a flat 1-day severance fine of <strong>🪙{dossier.severanceFeeCoins} Coins</strong> directly to the Labor Guild. All accrued back-wages and commissary deficits are completely expunged, vacating their bunkhouse bed to hire new staff.
                  </p>
                </div>
              </div>

              <button
                onClick={handleTerminate}
                disabled={!dossier.canAffordSeverance}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                  dossier.canAffordSeverance
                    ? 'bg-stone-800 hover:bg-stone-700 text-rose-300 border-rose-500/40 hover:border-rose-400 cursor-pointer active:scale-98'
                    : 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed'
                }`}
              >
                <span>📜 Terminate Contract &amp; Pay Severance</span>
                <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-[11px]">
                  🪙{dossier.severanceFeeCoins} Severance
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
