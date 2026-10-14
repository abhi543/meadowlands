'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import { LIVESTOCK_WORKER_ROSTER, type SpecialistWorkerId, type HireableWorkerTemplate } from '@/data/workerCatalog';

export function SpecialistWorkersSection() {
  const {
    coins,
    specialistWorkers,
    hireSpecialistWorker,
    toggleSpecialistDuty,
    dismissSpecialistWorker,
    paySpecialistBackPay,
  } = useGameStore();

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

        {/* Global summary badge */}
        <div className="flex items-center gap-2 text-xs bg-stone-800/80 border border-stone-700/60 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <span className="text-stone-400 font-medium">Hired Specialists:</span>
          <span className="font-bold text-amber-400">
            {Object.values(specialistWorkers || {}).filter(w => w.isHired).length} / {LIVESTOCK_WORKER_ROSTER.length}
          </span>
        </div>
      </div>

      {/* 3-Column Desktop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            On Duty
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700">
                            ⏸️ Resting
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
                            <span>Set to Resting</span>
                          </>
                        ) : (
                          <>
                            <span>🟢</span>
                            <span>Assign to Duty</span>
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
