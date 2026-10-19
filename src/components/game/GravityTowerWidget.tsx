'use client';

import React from 'react';
import { useGameStore } from '@/game/store';
import {
  calculateHydraulicConsumers,
  ELEVATED_TOWER_CAPACITY,
  type TowerLoadSheddingStage,
} from '@/game/hydraulicFailSafeEngine';

function formatCountdown(seconds: number | null): string {
  if (seconds === null) return 'Stable (0 L/s)';
  if (seconds <= 0) return 'Depleted (0s)';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) {
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins.toString().padStart(2, '0')}m`;
}

export const GravityTowerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const hydrology = useGameStore(state => state.hydrology);
  const amberBioLab = useGameStore(state => state.amberBioLab);
  const unifiedWorkers = useGameStore(state => state.unifiedWorkers);
  const workshopLoadout = useGameStore(state => state.workshopLoadout);
  const setSluiceModalOpen = useGameStore(state => state.setSluiceModalOpen);

  const towerLiters = Math.round(hydrology?.towerLiters ?? 650);
  const towerCapacity = hydrology?.towerCapacityLiters ?? ELEVATED_TOWER_CAPACITY;
  const towerPct = Math.min(100, Math.max(0, Math.round((towerLiters / towerCapacity) * 100)));

  const activeBioLabChambersCount = (amberBioLab?.chambers || []).filter(
    ch => ch.status === 'INCUBATING' || ch.status === 'CRYO_STANDBY'
  ).length;

  const activeWorkerCount = Object.values(unifiedWorkers || {}).filter(
    w => w.isHired && !w.isPaused
  ).length;

  const hasEmergencySiphon = Boolean(workshopLoadout?.emergencySiphonInstalled);
  const isSiphonActive = Boolean(hydrology?.isSiphonActive);

  const breakdown = calculateHydraulicConsumers({
    towerLiters,
    sluiceGatesOpen: Boolean(hydrology?.sluiceGatesOpen),
    sluiceDischargeRateLps: hydrology?.liveDischargeLitersPerSec || 12.0,
    activeBioLabChambersCount,
    activeWorkerCount,
    isSiphonActive,
  });

  // Color-coded stage styles
  const stageTheme = (() => {
    switch (breakdown.stage) {
      case 0:
        return {
          pillBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotBg: 'bg-emerald-400',
          barColor: 'from-emerald-500 to-teal-400',
          label: 'Nominal (>200L)',
          icon: '🟢',
        };
      case 1:
        return {
          pillBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotBg: 'bg-amber-400',
          barColor: 'from-amber-500 to-yellow-400',
          label: 'Stage 1: Crop Conservation',
          icon: '🟡',
        };
      case 2:
        return {
          pillBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          dotBg: 'bg-orange-400',
          barColor: 'from-orange-500 to-amber-500',
          label: 'Stage 2: Crew Rationing',
          icon: '🟠',
        };
      case 3:
      default:
        return {
          pillBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse',
          dotBg: 'bg-rose-500 animate-ping',
          barColor: 'from-rose-600 to-red-500',
          label: 'Stage 3: Cryo-Standby (0L)',
          icon: '🔴',
        };
    }
  })();

  const siphonBadge = (() => {
    if (!hasEmergencySiphon) {
      return { text: 'Auto-Siphon: Not Installed', color: 'text-stone-500', border: 'border-stone-700/60' };
    }
    if (isSiphonActive) {
      return { text: 'Auto-Siphon: Active (+2.0 L/s)', color: 'text-cyan-300 animate-pulse font-bold', border: 'border-cyan-400 bg-cyan-950/60' };
    }
    return { text: 'Auto-Siphon: Standby Idle', color: 'text-teal-400', border: 'border-teal-600/40' };
  })();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setSluiceModalOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900/90 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all active:scale-95 cursor-pointer shadow-sm"
        title="Elevated Gravity Tower (800L): Tap to open Sluice & Hydrology Deck"
      >
        <span className="text-sm">🗼</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[10px] font-bold text-white">
            <span>Tower:</span>
            <span className={towerLiters <= 80 ? 'text-rose-400' : towerLiters <= 200 ? 'text-amber-300' : 'text-emerald-300'}>
              {towerLiters} / {towerCapacity}L
            </span>
          </div>
          <div className="w-16 h-1 bg-stone-800 rounded-full overflow-hidden mt-0.5">
            <div
              className={`h-full bg-gradient-to-r ${stageTheme.barColor} transition-all duration-300`}
              style={{ width: `${towerPct}%` }}
            />
          </div>
        </div>
        <span className={`w-2 h-2 rounded-full ${stageTheme.dotBg} shrink-0`} />
      </button>
    );
  }

  return (
    <div className="bg-stone-900/90 border border-cyan-500/30 rounded-xl p-3 shadow-md space-y-2 text-stone-100">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗼</span>
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <span>Elevated Gravity Tower</span>
              <span className="text-[10px] text-stone-400 font-mono">({towerCapacity}L Cap)</span>
            </div>
            <div className="text-[11px] text-stone-400">
              Pressurized delivery head for crops, Bio-Lab chillers &amp; crew.
            </div>
          </div>
        </div>

        {/* Stage Status Badge */}
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1.5 ${stageTheme.pillBg}`}>
          <span>{stageTheme.icon}</span>
          <span>{stageTheme.label}</span>
        </div>
      </div>

      {/* Progress Bar & Volume Numbers */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-extrabold text-sm text-white">
            {towerLiters} <span className="text-xs font-normal text-stone-400">/ {towerCapacity} Liters</span>
          </span>
          <span className="text-stone-300 font-semibold">
            {towerPct}% Full
          </span>
        </div>
        <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-700/80 p-0.5">
          <div
            className={`h-full bg-gradient-to-r ${stageTheme.barColor} rounded-full transition-all duration-500`}
            style={{ width: `${towerPct}%` }}
          />
        </div>
      </div>

      {/* Estimator & Live Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="bg-stone-950/60 rounded-lg p-2 border border-stone-800">
          <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-semibold">
            Time Until Empty
          </span>
          <span className="font-mono font-bold text-cyan-300 text-xs">
            {formatCountdown(breakdown.estimatedSecondsUntilEmpty)}
          </span>
        </div>

        <div className="bg-stone-950/60 rounded-lg p-2 border border-stone-800">
          <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-semibold">
            Crop Furrows
          </span>
          <span className="font-mono text-stone-200">
            {breakdown.furrowDrainLps > 0 ? `-${breakdown.furrowDrainLps} L/s` : '0 L/s (Secured)'}
          </span>
        </div>

        <div className="bg-stone-950/60 rounded-lg p-2 border border-stone-800">
          <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-semibold">
            Amber Bio-Lab
          </span>
          <span className="font-mono text-stone-200">
            {breakdown.bioLabDrainLps > 0 ? `-${breakdown.bioLabDrainLps} L/s` : '0 L/s (Standby)'}
          </span>
        </div>

        <div className="bg-stone-950/60 rounded-lg p-2 border border-stone-800">
          <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-semibold">
            Crew Bunkhouse
          </span>
          <span className="font-mono text-stone-200">
            {breakdown.crewDrainLps > 0 ? `-${breakdown.crewDrainLps} L/s` : '0 L/s'}
          </span>
        </div>
      </div>

      {/* Siphon Status Badge */}
      <div className="pt-1 flex items-center justify-between text-[11px] border-t border-stone-800/80">
        <span className={`px-2 py-0.5 rounded-md border text-[10px] ${siphonBadge.color} ${siphonBadge.border}`}>
          {siphonBadge.text}
        </span>
        <button
          type="button"
          onClick={() => setSluiceModalOpen(true)}
          className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>Open Sluice Console &rarr;</span>
        </button>
      </div>
    </div>
  );
};
