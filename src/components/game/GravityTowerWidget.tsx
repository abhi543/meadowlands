'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  calculateHydraulicConsumers,
  ELEVATED_TOWER_CAPACITY,
  OVERFLOW_SURGE_RATE_LPS,
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
  const setHydrologyReservoirLevel = useGameStore(state => state.setHydrologyReservoirLevel);

  const [showTestPanel, setShowTestPanel] = useState(false);

  const towerLiters = Math.round(hydrology?.towerLiters ?? 650);
  const towerCapacity = hydrology?.towerCapacityLiters ?? ELEVATED_TOWER_CAPACITY;
  const towerPct = Math.min(100, Math.max(0, Math.round((towerLiters / towerCapacity) * 100)));

  const cisternLiters = Math.round(hydrology?.cisternLiters ?? 900);
  const cisternMax = hydrology?.cisternMaxLiters ?? 1500;
  const cisternPct = Math.min(100, Math.round((cisternLiters / (cisternMax || 1)) * 100));

  const aquiferLiters = Math.round(hydrology?.aquiferLiters ?? 2760);
  const aquiferCapacity = hydrology?.aquiferCapacityLiters ?? 3000;
  const aquiferPct = Math.min(100, Math.round((aquiferLiters / (aquiferCapacity || 1)) * 100));

  const isOverflowSurgeActive = Boolean(hydrology?.isOverflowSurgeActive);
  const overflowSurgeSource = hydrology?.overflowSurgeSource || null;
  const overflowSurgeLps = hydrology?.overflowSurgeLps || OVERFLOW_SURGE_RATE_LPS;

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

  const activeSourceName = overflowSurgeSource === 'cistern'
    ? 'Rain Catchment Cistern'
    : overflowSurgeSource === 'aquifer'
    ? 'Deep Groundwater Aquifer'
    : 'Full Reservoir';

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setSluiceModalOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-stone-900/90 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all active:scale-95 cursor-pointer shadow-sm relative group"
        title="Elevated Gravity Tower (800L): Tap to open Sluice & Hydrology Deck"
      >
        <span className="text-sm">🗼</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white">
            <span>Tower:</span>
            <span className={towerLiters <= 80 ? 'text-rose-400' : towerLiters <= 200 ? 'text-amber-300' : 'text-emerald-300'}>
              {towerLiters} / {towerCapacity}L
            </span>
            {isOverflowSurgeActive && (
              <span className="text-[9px] font-extrabold text-cyan-300 bg-cyan-950/80 border border-cyan-400/80 px-1 py-0.2 rounded-full animate-pulse flex items-center gap-0.5">
                <span>⚡</span>
                <span>SURGE +15L/s</span>
              </span>
            )}
          </div>
          <div className="w-16 h-1 bg-stone-800 rounded-full overflow-hidden mt-0.5">
            <div
              className={`h-full bg-gradient-to-r ${stageTheme.barColor} transition-all duration-300`}
              style={{ width: `${towerPct}%` }}
            />
          </div>
        </div>
        <span className={`w-2 h-2 rounded-full ${isOverflowSurgeActive ? 'bg-cyan-400 animate-ping' : stageTheme.dotBg} shrink-0`} />
      </button>
    );
  }

  return (
    <div className="bg-stone-900/90 border border-cyan-500/30 rounded-xl p-3 shadow-md space-y-2.5 text-stone-100">
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
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1.5 ${stageTheme.pillBg}`}>
            <span>{stageTheme.icon}</span>
            <span>{stageTheme.label}</span>
          </div>
        </div>
      </div>

      {/* Overflow Surge Dynamic Status Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-stone-950/70 p-2 rounded-lg border border-stone-800">
        <div className="flex items-center gap-2">
          {isOverflowSurgeActive ? (
            <div className="px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold bg-gradient-to-r from-cyan-950 via-sky-950 to-blue-950 text-cyan-200 border border-cyan-400/90 shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-1.5 animate-pulse">
              <span className="text-amber-400 text-xs">⚡</span>
              <span>[ ⚡ OVERFLOW SURGE ACTIVE: Sourcing from Full Reservoir (+15L/s) ]</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-stone-900 text-stone-400 border border-stone-700/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500/70" />
              <span>[ Overflow Surge: Standby (Awaiting Full Reservoir) ]</span>
            </div>
          )}
        </div>

        {/* Live Monitored Reservoirs Mini Indicators */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className={`px-1.5 py-0.5 rounded border ${cisternPct >= 100 ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold animate-pulse' : 'bg-stone-900/60 border-stone-800 text-stone-400'}`}>
            🌧️ Cistern: {cisternPct}%
          </span>
          <span className={`px-1.5 py-0.5 rounded border ${aquiferPct >= 100 ? 'bg-sky-950 border-sky-400 text-sky-300 font-bold animate-pulse' : 'bg-stone-900/60 border-stone-800 text-stone-400'}`}>
            💧 Aquifer: {aquiferPct}%
          </span>
        </div>
      </div>

      {/* Animated Upward-Flowing Hydraulic Arrows & Surge Conduit */}
      <div className={`relative rounded-xl p-3 border transition-all duration-300 overflow-hidden ${
        isOverflowSurgeActive
          ? 'bg-gradient-to-t from-cyan-950/80 via-blue-950/50 to-stone-950 border-cyan-400/60 shadow-[0_0_18px_rgba(6,182,212,0.25)]'
          : 'bg-stone-950/50 border-stone-800/80'
      }`}>
        {/* Animated fluid streaming backdrop lines */}
        {isOverflowSurgeActive && (
          <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,rgba(6,182,212,0.4)_10px,rgba(6,182,212,0.4)_20px)] animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        )}

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Source Box */}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border shadow-sm ${
              isOverflowSurgeActive
                ? 'bg-cyan-900/80 border-cyan-400 text-cyan-200 animate-bounce'
                : 'bg-stone-900 border-stone-700 text-stone-400'
            }`}>
              {overflowSurgeSource === 'cistern' ? '🌧️' : '💧'}
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold flex items-center gap-1">
                <span>Surge Pressure Source</span>
                {isOverflowSurgeActive && <span className="text-cyan-300 font-bold">• 100% Full</span>}
              </div>
              <div className="text-xs font-extrabold text-white">
                {isOverflowSurgeActive ? activeSourceName : 'Rain Cistern (100%) or Aquifer (100%)'}
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                {overflowSurgeSource === 'cistern'
                  ? `${cisternLiters.toLocaleString()} / ${cisternMax.toLocaleString()} Liters`
                  : overflowSurgeSource === 'aquifer'
                  ? `${aquiferLiters.toLocaleString()} / ${aquiferCapacity.toLocaleString()} Liters`
                  : 'Triggers automatically when either hits 100%'}
              </div>
            </div>
          </div>

          {/* Upward Hydraulic Arrows Conduit */}
          <div className="flex-1 max-w-xs flex flex-col items-center justify-center px-3 py-1 bg-black/40 rounded-lg border border-stone-800/80">
            <div className="text-[9px] font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1 mb-0.5">
              <span>Upward Hydraulic Conduit</span>
              {isOverflowSurgeActive && <span className="text-cyan-300 font-bold">(+15 L/s)</span>}
            </div>

            {/* Visual animated upward arrows */}
            <div className="flex items-center gap-2 text-sm font-black">
              {isOverflowSurgeActive ? (
                <>
                  <span className="text-cyan-400 animate-bounce [animation-delay:0ms]">▲</span>
                  <span className="text-sky-300 animate-bounce [animation-delay:150ms]">▲</span>
                  <span className="text-blue-300 animate-bounce [animation-delay:300ms]">▲</span>
                  <span className="text-cyan-200 animate-bounce [animation-delay:450ms]">▲</span>
                  <span className="text-white animate-bounce [animation-delay:600ms]">▲</span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-stone-600 text-xs">
                  <span>▲</span>
                  <span>▲</span>
                  <span className="text-[10px] text-stone-500 font-mono font-normal">Dormant Standby</span>
                  <span>▲</span>
                  <span>▲</span>
                </div>
              )}
            </div>
            <div className="text-[9px] text-stone-400 font-mono mt-0.5">
              {isOverflowSurgeActive
                ? '⚡ Pressurized Surge Inflow Active'
                : 'Pumps continuously to 800L ceiling upon trigger'}
            </div>
          </div>

          {/* Destination Box */}
          <div className="flex items-center gap-2.5 text-right sm:text-left">
            <div className="flex-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold">
                Destination Target
              </div>
              <div className="text-xs font-extrabold text-cyan-200">
                Elevated Gravity Tower (800L)
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                {towerLiters} / {towerCapacity}L ({towerPct}%)
              </div>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border shadow-sm ${
              towerLiters >= towerCapacity
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : isOverflowSurgeActive
                ? 'bg-cyan-900 border-cyan-400 text-cyan-200 animate-pulse'
                : 'bg-stone-900 border-stone-700 text-stone-400'
            }`}>
              🗼
            </div>
          </div>
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

      {/* Siphon Status & Calibration Toggle Row */}
      <div className="pt-1.5 flex items-center justify-between text-[11px] border-t border-stone-800/80 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md border text-[10px] ${siphonBadge.color} ${siphonBadge.border}`}>
            {siphonBadge.text}
          </span>
          <button
            type="button"
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="text-[10px] text-stone-400 hover:text-cyan-300 font-mono underline cursor-pointer"
          >
            {showTestPanel ? '▲ Hide Surge Calibration' : '▼ Surge Calibration Deck'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSluiceModalOpen(true)}
          className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>Open Sluice Console &rarr;</span>
        </button>
      </div>

      {/* Verification & Testing Calibration Deck */}
      {showTestPanel && (
        <div className="mt-2 p-2.5 bg-stone-950/90 rounded-lg border border-cyan-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-300 tracking-wider">
              🧪 Hydrology Overflow Surge Verification Controls
            </span>
            <span className="text-[9px] text-stone-400 font-mono">Simulates exact 5 checklist criteria</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('cistern', Math.floor(cisternMax * 0.99));
                setHydrologyReservoirLevel('tower', 200);
              }}
              className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded text-stone-300 text-left cursor-pointer"
              title="Verify Cistern at 99% does NOT trigger surge"
            >
              1. Cistern 99% <span className="text-[9px] text-amber-400 block">(Inaction Test)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('cistern', cisternMax);
                setHydrologyReservoirLevel('tower', 200);
              }}
              className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 rounded text-cyan-200 text-left font-bold cursor-pointer"
              title="Push Cistern from 99% to 100% to immediately trigger surge"
            >
              2. Cistern 100% <span className="text-[9px] text-cyan-300 block">(Instant Trigger)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('aquifer', Math.floor(aquiferCapacity * 0.99));
                setHydrologyReservoirLevel('tower', 200);
              }}
              className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded text-stone-300 text-left cursor-pointer"
              title="Verify Aquifer at 99% does NOT trigger surge"
            >
              3. Aquifer 99% <span className="text-[9px] text-amber-400 block">(Inaction Test)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('aquifer', aquiferCapacity);
                setHydrologyReservoirLevel('tower', 200);
              }}
              className="px-2 py-1 bg-sky-950/80 hover:bg-sky-900 border border-sky-500/60 rounded text-sky-200 text-left font-bold cursor-pointer"
              title="Push Aquifer from 99% to 100% to immediately trigger surge"
            >
              4. Aquifer 100% <span className="text-[9px] text-sky-300 block">(Instant Trigger)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('tower', 800);
                setHydrologyReservoirLevel('cistern', cisternMax);
              }}
              className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 rounded text-emerald-200 text-left font-bold cursor-pointer"
              title="Verify pre-filled 800L tower suppresses surge when reservoir hits 100%"
            >
              5. Tower 800L <span className="text-[9px] text-emerald-300 block">(Suppression/Cutoff)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('tower', 200);
              }}
              className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded text-amber-300 text-left cursor-pointer"
              title="Drain tower to 200L to observe full continuous surge up to 800L"
            >
              6. Tower 200L <span className="text-[9px] text-stone-400 block">(Reset Headroom)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
