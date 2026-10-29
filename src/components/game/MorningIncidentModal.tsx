'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import {
  formatAbsenceRemaining,
  MEDICAL_DRAUGHT_COST_COINS,
  TEMP_WORKER_DAILY_COST_COINS,
} from '@/game/absenteeismEngine';

export const MorningIncidentModal: React.FC = () => {
  const activeModal = useGameStore(state => state.activeMorningIncidentModal);
  const coins = useGameStore(state => state.coins);
  const dismissModal = useGameStore(state => state.dismissMorningIncidentModal);
  const cureFume = useGameStore(state => state.cureWorkerFumeSickness);
  const grantLeave = useGameStore(state => state.grantWorkerPaidLeave);
  const hireTemp = useGameStore(state => state.hireTempReplacementWorker);
  const forceOvertime = useGameStore(state => state.forceWorkerOvertimeDespiteAbsence);
  const settleStrike = useGameStore(state => state.settleWildcatStrike);

  if (!activeModal) return null;

  const getCauseDetails = () => {
    switch (activeModal.cause) {
      case 'fume_sickness':
        return {
          title: 'Toxic Fume Poisoning',
          badgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60',
          description: `${activeModal.workerName} inhaled acute concentrations of volatile gas compounds (${activeModal.stationName}) after consecutive shifts without atmospheric scrubbing. High-fever delirium and coughing spells have rendered them unfit for duty.`,
          impact: 'Assigned gas compressor chamber automation is completely halted. Toxic buffer and feedstock pressure are rising.',
          recommendation: 'Administer an Apothecary Medical Draught to neutralize systemic toxins instantly, or allow 2 full game days of unassisted convalescence.',
        };
      case 'exhaustion_burnout':
        return {
          title: 'Severe Exhaustion Burnout',
          badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-700/60',
          description: `${activeModal.workerName} has collapsed from three straight shifts of mandatory overtime without diurnal bunkhouse sleep. Muscle tremors and fatigue prevent safe machinery operation.`,
          impact: 'Station automation output drops to zero. Work orders and production queues will stall.',
          recommendation: 'Grant 1 full day of paid rest to reset fatigue to zero, or deploy an emergency day-laborer.',
        };
      case 'wildcat_strike':
        return {
          title: 'Wildcat Labor Strike & Picket Line',
          badgeColor: 'bg-rose-950/80 text-rose-400 border-rose-700/60',
          description: 'Midnight payroll arrears have triggered an immediate walkout! Workers have assembled a picket line blocking access to key estate infrastructure.',
          impact: 'All automated bottling, harvesting, and pen sanitization are suspended. Gate Dock export carts refuse to dispatch!',
          recommendation: 'Pay accumulated back wages plus the 25% union settlement bonus to resume operations immediately.',
        };
      case 'biohazard_mutiny':
        return {
          title: 'Barn Biohazard Refusal',
          badgeColor: 'bg-purple-950/80 text-purple-400 border-purple-700/60',
          description: `Slurry storage pits or pasture mud filth have sat at biohazardous critical capacity for over 12 continuous hours. ${activeModal.workerName} refuses to set foot in the livestock paddocks.`,
          impact: 'Automatic trough feeding, egg gathering, and sheep shearing are locked until health hazards are remediated.',
          recommendation: 'Muck out paddocks, flush slurry feedstock into the refinery digester, or open sluice drains.',
        };
    }
  };

  const details = getCauseDetails();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-gradient-to-b from-stone-900 via-stone-900 to-neutral-950 border-2 border-amber-600/50 shadow-2xl p-6 text-stone-200 overflow-hidden">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-amber-950/60 border border-amber-600/40">
              {activeModal.stationEmoji || '⚠️'}
            </span>
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-500 font-bold">
                Morning Shift Operational Incident
              </div>
              <h2 className="text-xl font-black text-amber-100 flex items-center gap-2">
                {details.title}
              </h2>
            </div>
          </div>
          <button
            onClick={dismissModal}
            className="text-stone-400 hover:text-stone-100 text-lg font-bold w-8 h-8 rounded-full bg-stone-800/60 hover:bg-stone-700 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Worker & Station Card */}
        <div className="my-4 p-3 rounded-xl bg-stone-950/70 border border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center font-bold text-amber-300">
              {activeModal.workerName.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-stone-100">{activeModal.workerName}</div>
              <div className="text-xs text-stone-400">Station: {activeModal.stationName}</div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${details.badgeColor}`}>
              Absenteeism State
            </span>
            <div className="text-[11px] text-stone-400 mt-1 font-mono">
              Remaining: {formatAbsenceRemaining(activeModal.expiresAt)}
            </div>
          </div>
        </div>

        {/* Incident Narrative */}
        <div className="space-y-3 text-xs leading-relaxed text-stone-300">
          <p className="bg-stone-950/40 p-3 rounded-lg border border-stone-800/40">
            {details.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40">
              <span className="font-bold text-red-400 block mb-0.5">⚠️ Production Impact:</span>
              <span className="text-stone-300">{details.impact}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/40">
              <span className="font-bold text-amber-400 block mb-0.5">💡 Foreperson Advice:</span>
              <span className="text-stone-300">{details.recommendation}</span>
            </div>
          </div>
        </div>

        {/* Action Decision Matrix */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex flex-col sm:flex-row gap-2.5">
          {activeModal.cause === 'fume_sickness' && (
            <>
              <button
                onClick={() => cureFume(activeModal.workerId)}
                disabled={coins < MEDICAL_DRAUGHT_COST_COINS}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg ${
                  coins >= MEDICAL_DRAUGHT_COST_COINS
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>🧪</span>
                <span>Medical Draught ({MEDICAL_DRAUGHT_COST_COINS}c)</span>
              </button>
              <button
                onClick={() => hireTemp(activeModal.workerId)}
                disabled={coins < TEMP_WORKER_DAILY_COST_COINS}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg ${
                  coins >= TEMP_WORKER_DAILY_COST_COINS
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>👷</span>
                <span>Hire Temp ({TEMP_WORKER_DAILY_COST_COINS}c)</span>
              </button>
            </>
          )}

          {activeModal.cause === 'exhaustion_burnout' && (
            <>
              <button
                onClick={() => grantLeave(activeModal.workerId)}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-1.5"
              >
                <span>🛌</span>
                <span>Grant Paid Rest (1 Day)</span>
              </button>
              <button
                onClick={() => hireTemp(activeModal.workerId)}
                disabled={coins < TEMP_WORKER_DAILY_COST_COINS}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg ${
                  coins >= TEMP_WORKER_DAILY_COST_COINS
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>👷</span>
                <span>Hire Day-Laborer ({TEMP_WORKER_DAILY_COST_COINS}c)</span>
              </button>
              <button
                onClick={() => forceOvertime(activeModal.workerId)}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700/50 transition flex items-center justify-center gap-1"
                title="Force overtime (Heavy Morale penalty)"
              >
                <span>⚡</span>
                <span>Force Overtime</span>
              </button>
            </>
          )}

          {activeModal.cause === 'wildcat_strike' && (
            <button
              onClick={() => settleStrike()}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-900/30 flex items-center justify-center gap-1.5"
            >
              <span>🤝</span>
              <span>Settle Union Demands (+25% Bonus)</span>
            </button>
          )}

          {activeModal.cause === 'biohazard_mutiny' && (
            <button
              onClick={dismissModal}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-purple-700 hover:bg-purple-600 text-white transition shadow-lg shadow-purple-900/30 flex items-center justify-center gap-1.5"
            >
              <span>🧼</span>
              <span>Acknowledge & Clear Hazards</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
