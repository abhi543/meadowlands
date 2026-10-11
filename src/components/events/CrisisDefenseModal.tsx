'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';

export function CrisisDefenseModal() {
  const {
    activeCrisis,
    isCrisisModalOpen,
    setCrisisModalOpen,
    resolveCrisisDefense,
    clearCrisis,
    coins,
    animals,
  } = useGameStore();

  const [, setTick] = useState(0);

  useEffect(() => {
    if (!activeCrisis) return;
    const interval = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(interval);
  }, [activeCrisis]);

  if (!isCrisisModalOpen || !activeCrisis) return null;

  const now = Date.now();
  const remainingSec = Math.max(0, Math.ceil((activeCrisis.expiresAt - now) / 1000));
  const isCritical = remainingSec <= 10;
  const isResolved = activeCrisis.resolvedStatus === 'resolved';
  const isFailed = activeCrisis.resolvedStatus === 'failed';

  // Target animals for predator raid
  const targetAnimals = activeCrisis.type === 'predator_raid'
    ? animals.filter(a => activeCrisis.targetIds.includes(a.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-md bg-stone-900 border-2 rounded-2xl shadow-2xl overflow-hidden text-stone-100 ${
          isCritical
            ? 'border-red-500 shadow-red-500/30'
            : isResolved
            ? 'border-emerald-500 shadow-emerald-500/20'
            : 'border-amber-500 shadow-amber-500/20'
        }`}
      >
        {/* Header with Urgency Banner */}
        <div
          className={`p-4 flex items-center justify-between ${
            isCritical
              ? 'bg-gradient-to-r from-red-700 to-rose-900 text-white animate-pulse'
              : isResolved
              ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white'
              : 'bg-gradient-to-r from-amber-700 to-orange-800 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none">{activeCrisis.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40">
                  {isResolved ? 'Crisis Defended' : isFailed ? 'Crisis Failed' : 'Active Radar Crisis'}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight">{activeCrisis.title}</h3>
            </div>
          </div>

          {!isResolved && !isFailed && (
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-amber-200 block">Time Left</span>
              <span className={`text-2xl font-black font-mono ${isCritical ? 'text-red-300 animate-ping' : 'text-amber-100'}`}>
                {remainingSec}s
              </span>
            </div>
          )}
        </div>

        {/* Timer progress bar */}
        {!isResolved && !isFailed && (
          <div className="w-full bg-stone-800 h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isCritical ? 'bg-red-500' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, Math.max(0, (remainingSec / 45) * 100))}%` }}
            />
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 space-y-4">
          <p className="text-xs text-stone-300 leading-relaxed">
            {activeCrisis.description}
          </p>

          {/* 1. PREDATOR RAID DEFENSE */}
          {activeCrisis.type === 'predator_raid' && !isResolved && !isFailed && (
            <div className="space-y-3">
              <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700 text-xs">
                <div className="font-bold text-amber-300 mb-1 flex items-center justify-between">
                  <span>🐾 Livestock Targeted ({targetAnimals.length}):</span>
                  <span className="text-[10px] text-stone-400">Failure steals 20% barn yields</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {targetAnimals.map(a => (
                    <span key={a.id} className="bg-stone-900 px-2 py-1 rounded-md text-[11px] border border-stone-700 text-stone-200">
                      {a.species} ({a.tier})
                    </span>
                  ))}
                  {targetAnimals.length === 0 && (
                    <span className="text-stone-400 italic">Farmstead Livestock Coops</span>
                  )}
                </div>
              </div>

              {/* Action 1: Tap Alarm */}
              <div className="bg-stone-800/50 p-3 rounded-xl border border-stone-700/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-200">🚨 Sound Emergency Alarm</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {activeCrisis.alarmTaps || 0} / 5 Taps
                  </span>
                </div>
                <div className="w-full bg-stone-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-150"
                    style={{ width: `${Math.min(100, ((activeCrisis.alarmTaps || 0) / 5) * 100)}%` }}
                  />
                </div>
                <button
                  onClick={() => resolveCrisisDefense('alarm')}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black rounded-xl text-sm transition-all transform active:scale-95 shadow-lg shadow-amber-500/20"
                >
                  🔔 TAP RAPIDLY TO SOUND ALARM!
                </button>
              </div>

              {/* Action 2: Deploy Guard Dog */}
              <div className="flex items-center justify-between p-3 bg-stone-800/40 rounded-xl border border-stone-700/50">
                <div>
                  <div className="text-xs font-bold text-stone-200">🐕 Deploy Guard Dog</div>
                  <div className="text-[10px] text-stone-400">Instant repel + 60 XP bonus</div>
                </div>
                <button
                  disabled={coins < 20}
                  onClick={() => resolveCrisisDefense('dog')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    coins >= 20
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/20 active:scale-95'
                      : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Deploy (20 🪙)
                </button>
              </div>
            </div>
          )}

          {/* 2. CROP BLIGHT DEFENSE */}
          {activeCrisis.type === 'crop_blight' && !isResolved && !isFailed && (
            <div className="space-y-3">
              <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700 text-xs">
                <div className="font-bold text-emerald-300 mb-1 flex items-center justify-between">
                  <span>☣️ Infected Plots ({activeCrisis.targetIds.length}):</span>
                  <span className="text-[10px] text-stone-400">Spread to neighbors if timed out</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {activeCrisis.targetIds.map(pid => (
                    <div
                      key={pid}
                      className="flex items-center justify-between gap-3 bg-stone-900 px-3 py-2 rounded-lg border border-red-700/60 w-full"
                    >
                      <span className="text-xs font-bold text-red-300">Plot #{Number(pid) + 1} Infected</span>
                      <button
                        disabled={coins < 20}
                        onClick={() => resolveCrisisDefense('quarantine', pid)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          coins >= 20
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 active:scale-95'
                            : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        Quarantine (20 🪙)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. FLASH WEATHER DEFENSE */}
          {activeCrisis.type === 'flash_weather' && !isResolved && !isFailed && (
            <div className="space-y-3">
              <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700 text-xs">
                <div className="font-bold text-cyan-300 mb-1">
                  ⛈️ Hazard Penalty: 50% slower crop growth & animal production
                </div>
                <p className="text-[11px] text-stone-400">
                  Activate the Emergency Weather Shield to shield your farmstead until the storm passes.
                </p>
              </div>

              {activeCrisis.shieldActive ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-xl text-center text-xs text-emerald-300 font-bold">
                  🛡️ Emergency Shield Booster is ACTIVE! Farm is protected from 50% slowdown.
                </div>
              ) : (
                <button
                  disabled={coins < 25}
                  onClick={() => resolveCrisisDefense('shield')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    coins >= 25
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-stone-950 shadow-lg shadow-cyan-500/20 active:scale-95'
                      : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Activate Emergency Shield Booster (25 🪙)
                </button>
              )}
            </div>
          )}

          {/* SUCCESS / FAILURE STATE */}
          {isResolved && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500 rounded-xl text-center space-y-2">
              <div className="text-3xl">🎉</div>
              <h4 className="font-black text-emerald-300 text-sm">Crisis Successfully Repelled!</h4>
              <p className="text-xs text-emerald-200/80">
                Your swift tactical response protected the estate and secured bonus XP!
              </p>
              <button
                onClick={clearCrisis}
                className="mt-2 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition-colors"
              >
                Dismiss & Resume Scanning
              </button>
            </div>
          )}

          {isFailed && (
            <div className="p-4 bg-rose-950/60 border border-rose-500 rounded-xl text-center space-y-2">
              <div className="text-3xl">⚠️</div>
              <h4 className="font-black text-rose-300 text-sm">Crisis Defense Failed!</h4>
              <p className="text-xs text-rose-200/80">
                Timer expired before defense was fully deployed. Penalties were applied.
              </p>
              <button
                onClick={clearCrisis}
                className="mt-2 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Acknowledge & Clear
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={() => setCrisisModalOpen(false)}
            className="text-xs text-stone-400 hover:text-stone-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Minimize to Radar
          </button>
        </div>
      </div>
    </div>
  );
}
