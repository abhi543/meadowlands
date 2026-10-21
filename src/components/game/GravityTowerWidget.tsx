'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  calculateHydraulicConsumers,
  ELEVATED_TOWER_CAPACITY,
  OVERFLOW_SURGE_RATE_LPS,
  TOWER_STORAGE_TIERS,
} from '@/game/hydraulicFailSafeEngine';

function formatCountdown(seconds: number | null, netFlowLps?: number): string {
  if (netFlowLps && netFlowLps > 0) return `Replenishing (+${netFlowLps.toFixed(1)} L/s)`;
  if (seconds === null) return 'Stable Supply';
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
  const setTowerStorageTier = useGameStore(state => state.setTowerStorageTier);
  const upgradeTowerStorageTier = useGameStore(state => state.upgradeTowerStorageTier);
  const barn = useGameStore(state => state.barn);
  const installEmergencySiphonValve = useGameStore(state => state.installEmergencySiphonValve);
  const toggleSiphonMode = useGameStore(state => state.toggleSiphonMode);
  const siphonInBag = barn?.emergency_siphon_valve || 0;

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
          pillBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
          dotBg: 'bg-emerald-500',
          barColor: 'from-blue-500 via-sky-400 to-teal-400',
          label: 'Nominal (>200L)',
          icon: '🟢',
        };
      case 1:
        return {
          pillBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
          dotBg: 'bg-amber-500',
          barColor: 'from-amber-500 to-yellow-400',
          label: 'Stage 1: Crop Conservation',
          icon: '🟡',
        };
      case 2:
        return {
          pillBg: 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/40',
          dotBg: 'bg-orange-500',
          barColor: 'from-orange-500 to-amber-500',
          label: 'Stage 2: Crew Rationing',
          icon: '🟠',
        };
      case 3:
      default:
        return {
          pillBg: 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/50 animate-pulse',
          dotBg: 'bg-rose-500 animate-ping',
          barColor: 'from-rose-600 to-red-500',
          label: 'Stage 3: Cryo-Standby (0L)',
          icon: '🔴',
        };
    }
  })();

  const siphonMode = hydrology?.siphonMode || 'continuous';
  const siphonBadge = (() => {
    if (!hasEmergencySiphon) {
      return { text: 'Auto-Siphon: Not Installed', color: 'text-stone-500', border: 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800' };
    }
    if (siphonMode === 'continuous' && isSiphonActive) {
      return { text: 'Continuous Artesian Feed: Active (+2.0 L/s)', color: 'text-cyan-800 dark:text-cyan-300 animate-pulse font-bold', border: 'border-cyan-400 bg-cyan-100 dark:bg-cyan-950/60' };
    }
    if (isSiphonActive) {
      return { text: 'Emergency Siphon: Active (+2.0 L/s)', color: 'text-cyan-800 dark:text-cyan-300 animate-pulse font-bold', border: 'border-cyan-400 bg-cyan-100 dark:bg-cyan-950/60' };
    }
    if (siphonMode === 'continuous') {
      return { text: 'Continuous Siphon: Standby (Tower Full)', color: 'text-teal-800 dark:text-teal-300 font-semibold', border: 'border-teal-300 dark:border-teal-600/40 bg-teal-50 dark:bg-teal-950/40' };
    }
    return { text: 'Emergency Siphon: Standby (≤80L)', color: 'text-teal-800 dark:text-teal-300 font-semibold', border: 'border-teal-300 dark:border-teal-600/40 bg-teal-50 dark:bg-teal-950/40' };
  })();

  const activeSourceName = overflowSurgeSource === 'cistern'
    ? 'Rain Catchment Cistern'
    : overflowSurgeSource === 'aquifer'
    ? 'Deep Groundwater Aquifer'
    : 'Full Reservoir';

  const towerTier = hydrology?.towerTier || 1;
  const currentTierConfig = TOWER_STORAGE_TIERS[towerTier] || TOWER_STORAGE_TIERS[1];

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setSluiceModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-sky-300/60 dark:border-cyan-500/30 hover:border-sky-400 text-left transition-all active:scale-95 cursor-pointer shadow-sm relative group"
        title={`Elevated Gravity Tower (${towerCapacity.toLocaleString()}L): Tap to open Sluice & Hydrology Deck`}
      >
        <span className="text-base">🗼</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-900 dark:text-white">
            <span>Tower:</span>
            <span className={towerLiters <= (towerCapacity * 0.10) ? 'text-rose-600 dark:text-rose-400' : towerLiters <= (towerCapacity * 0.25) ? 'text-amber-600 dark:text-amber-300' : 'text-sky-700 dark:text-emerald-300'}>
              {towerLiters.toLocaleString()} / {towerCapacity.toLocaleString()}L
            </span>
            {isOverflowSurgeActive && (
              <span className="text-[9px] font-extrabold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-400 px-1 py-0.2 rounded-full animate-pulse flex items-center gap-0.5">
                <span>⚡</span>
                <span>+{overflowSurgeLps}L/s</span>
              </span>
            )}
          </div>
          <div className="w-18 h-1.5 bg-sky-100 dark:bg-stone-800 rounded-full overflow-hidden mt-0.5">
            <div
              className={`h-full bg-gradient-to-r ${stageTheme.barColor} transition-all duration-300`}
              style={{ width: `${towerPct}%` }}
            />
          </div>
        </div>
        <span className={`w-2 h-2 rounded-full ${isOverflowSurgeActive ? 'bg-cyan-500 animate-ping' : stageTheme.dotBg} shrink-0`} />
      </button>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-sky-200/80 dark:border-cyan-500/30 rounded-3xl p-4 sm:p-5 shadow-md space-y-3 transition-all">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-xl text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            🗼
          </div>
          <div>
            <div className="font-black text-sm uppercase tracking-wide text-sky-800 dark:text-cyan-300 flex items-center gap-2">
              <span>Elevated Gravity Tower Monitoring</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-cyan-950 text-blue-800 dark:text-cyan-300 border border-blue-300 dark:border-cyan-700/60 font-mono font-bold">
                {currentTierConfig.badge}
              </span>
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              {currentTierConfig.name} • {towerCapacity.toLocaleString()}L pressurized head pressure (+{currentTierConfig.surgeLps} L/s surge capacity).
            </div>
          </div>
        </div>

        {/* Stage Status Badge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border flex items-center gap-1.5 shadow-xs ${stageTheme.pillBg}`}>
            <span>{stageTheme.icon}</span>
            <span>{stageTheme.label}</span>
          </div>
        </div>
      </div>

      {/* Overflow Surge Dynamic Status Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-sky-50/80 dark:bg-stone-950/70 p-2.5 rounded-2xl border border-sky-200/70 dark:border-stone-800">
        <div className="flex items-center gap-2">
          {isOverflowSurgeActive ? (
            <div className="px-3 py-1.5 rounded-xl text-xs font-mono font-black bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 flex items-center gap-1.5 animate-pulse">
              <span className="text-amber-200 text-sm">⚡</span>
              <span>[ OVERFLOW SURGE ACTIVE: Sourcing from Full Reservoir (+15 L/s) ]</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-xl text-xs font-mono font-medium bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>Overflow Surge: Standby (Awaiting Full Reservoir)</span>
            </div>
          )}
        </div>

        {/* Live Monitored Reservoirs Mini Indicators */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className={`px-2 py-0.5 rounded-lg border ${cisternPct >= 100 ? 'bg-cyan-100 dark:bg-cyan-950 border-cyan-400 text-cyan-800 dark:text-cyan-300 font-bold animate-pulse' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'}`}>
            🌧️ Cistern: {cisternPct}%
          </span>
          <span className={`px-2 py-0.5 rounded-lg border ${aquiferPct >= 100 ? 'bg-sky-100 dark:bg-sky-950 border-sky-400 text-sky-800 dark:text-sky-300 font-bold animate-pulse' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'}`}>
            💧 Aquifer: {aquiferPct}%
          </span>
        </div>
      </div>

      {/* Animated Upward-Flowing Hydraulic Arrows & Surge Conduit */}
      <div className={`relative rounded-2xl p-3.5 border transition-all duration-300 overflow-hidden ${
        isOverflowSurgeActive
          ? 'bg-gradient-to-t from-cyan-100 via-sky-50 to-white dark:from-cyan-950/80 dark:via-blue-950/50 dark:to-stone-950 border-cyan-400/80 shadow-md shadow-cyan-500/10'
          : 'bg-sky-50/50 dark:bg-stone-950/50 border-sky-100 dark:border-stone-800/80'
      }`}>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Source Box */}
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border shadow-xs ${
              isOverflowSurgeActive
                ? 'bg-cyan-100 dark:bg-cyan-900/80 border-cyan-400 text-cyan-800 dark:text-cyan-200 animate-bounce'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400'
            }`}>
              {overflowSurgeSource === 'cistern' ? '🌧️' : '💧'}
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-stone-500 dark:text-stone-400 font-bold flex items-center gap-1">
                <span>Surge Source</span>
                {isOverflowSurgeActive && <span className="text-cyan-600 dark:text-cyan-300 font-bold">• 100% Full</span>}
              </div>
              <div className="text-xs font-black text-stone-900 dark:text-white">
                {isOverflowSurgeActive ? activeSourceName : 'Rain Cistern (100%) or Aquifer (100%)'}
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                {overflowSurgeSource === 'cistern'
                  ? `${cisternLiters.toLocaleString()} / ${cisternMax.toLocaleString()} Liters`
                  : overflowSurgeSource === 'aquifer'
                  ? `${aquiferLiters.toLocaleString()} / ${aquiferCapacity.toLocaleString()} Liters`
                  : 'Triggers automatically when either hits 100%'}
              </div>
            </div>
          </div>

          {/* Upward Hydraulic Arrows Conduit */}
          <div className="flex-1 max-w-xs flex flex-col items-center justify-center px-3 py-1.5 bg-white/70 dark:bg-black/40 rounded-xl border border-sky-200/60 dark:border-stone-800/80">
            <div className="text-[9px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1 mb-0.5">
              <span>Upward Hydraulic Conduit</span>
              {isOverflowSurgeActive && <span className="text-cyan-600 dark:text-cyan-300 font-bold">(+{overflowSurgeLps} L/s)</span>}
            </div>

            {/* Visual animated upward arrows */}
            <div className="flex items-center gap-2 text-sm font-black">
              {isOverflowSurgeActive ? (
                <>
                  <span className="text-cyan-500 animate-bounce [animation-delay:0ms]">▲</span>
                  <span className="text-sky-500 animate-bounce [animation-delay:150ms]">▲</span>
                  <span className="text-blue-500 animate-bounce [animation-delay:300ms]">▲</span>
                  <span className="text-cyan-400 animate-bounce [animation-delay:450ms]">▲</span>
                  <span className="text-teal-400 animate-bounce [animation-delay:600ms]">▲</span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                  <span>▲</span>
                  <span>▲</span>
                  <span className="text-[10px] text-stone-500 font-mono font-medium">Dormant Standby</span>
                  <span>▲</span>
                  <span>▲</span>
                </div>
              )}
            </div>
            <div className="text-[9px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">
              {isOverflowSurgeActive
                ? '⚡ Pressurized Surge Inflow Active'
                : 'Pumps continuously to 800L ceiling upon trigger'}
            </div>
          </div>

          {/* Destination Box */}
          <div className="flex items-center gap-2.5 text-right sm:text-left">
            <div className="flex-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-stone-500 dark:text-stone-400 font-bold">
                Destination Target
              </div>
              <div className="text-xs font-black text-sky-800 dark:text-cyan-200">
                Elevated Gravity Tower (800L)
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                {towerLiters} / {towerCapacity}L ({towerPct}%)
              </div>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border shadow-xs ${
              towerLiters >= towerCapacity
                ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                : isOverflowSurgeActive
                ? 'bg-cyan-100 dark:bg-cyan-900 border-cyan-400 text-cyan-800 dark:text-cyan-200 animate-pulse'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400'
            }`}>
              🗼
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar & Volume Numbers */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-black text-sm text-stone-900 dark:text-white">
            {towerLiters.toLocaleString()} <span className="text-xs font-normal text-stone-500 dark:text-stone-400">/ {towerCapacity.toLocaleString()} Liters</span>
          </span>
          <span className="text-sky-800 dark:text-cyan-300 font-bold">
            {towerPct}% Full
          </span>
        </div>
        <div className="w-full h-3 bg-sky-100 dark:bg-stone-950 rounded-full overflow-hidden border border-sky-200 dark:border-stone-700/80 p-0.5">
          <div
            className={`h-full bg-gradient-to-r ${stageTheme.barColor} rounded-full transition-all duration-500 shadow-xs`}
            style={{ width: `${towerPct}%` }}
          />
        </div>
      </div>

      {/* Estimator & Live Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="bg-sky-50/70 dark:bg-stone-950/60 rounded-xl p-2.5 border border-sky-100 dark:border-stone-800">
          <span className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block font-bold">
            Time Until Empty
          </span>
          <span className="font-mono font-black text-sky-800 dark:text-cyan-300 text-xs">
            {formatCountdown(breakdown.estimatedSecondsUntilEmpty, breakdown.netFlowLps)}
          </span>
        </div>

        <div className="bg-sky-50/70 dark:bg-stone-950/60 rounded-xl p-2.5 border border-sky-100 dark:border-stone-800">
          <span className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block font-bold">
            Crop Furrows
          </span>
          <span className="font-mono text-stone-700 dark:text-stone-200 font-medium">
            {breakdown.furrowDrainLps > 0 ? `-${breakdown.furrowDrainLps} L/s` : '0 L/s (Secured)'}
          </span>
        </div>

        <div className="bg-sky-50/70 dark:bg-stone-950/60 rounded-xl p-2.5 border border-sky-100 dark:border-stone-800">
          <span className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block font-bold">
            Amber Bio-Lab
          </span>
          <span className="font-mono text-stone-700 dark:text-stone-200 font-medium">
            {breakdown.bioLabDrainLps > 0 ? `-${breakdown.bioLabDrainLps} L/s` : '0 L/s (Standby)'}
          </span>
        </div>

        <div className="bg-sky-50/70 dark:bg-stone-950/60 rounded-xl p-2.5 border border-sky-100 dark:border-stone-800">
          <span className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block font-bold">
            Crew Bunkhouse
          </span>
          <span className="font-mono text-stone-700 dark:text-stone-200 font-medium">
            {breakdown.crewDrainLps > 0 ? `-${breakdown.crewDrainLps} L/s` : '0 L/s'}
          </span>
        </div>
      </div>

      {/* Siphon Status & Calibration Toggle Row */}
      <div className="pt-2 flex items-center justify-between text-[11px] border-t border-sky-100 dark:border-stone-800 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${siphonBadge.color} ${siphonBadge.border}`}>
            {siphonBadge.text}
          </span>
          {hasEmergencySiphon && (
            <button
              type="button"
              onClick={toggleSiphonMode}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 shadow-xs ${
                siphonMode === 'continuous'
                  ? 'bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-950/80 border-cyan-400 text-cyan-900 dark:text-cyan-200'
                  : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
              title="Toggle between Continuous Artesian Feed vs Emergency Reserve Mode"
            >
              <span>{siphonMode === 'continuous' ? '⚡ Continuous Feed' : '🛡️ Emergency Mode'}</span>
            </button>
          )}
          {!hasEmergencySiphon && (
            <button
              type="button"
              onClick={() => installEmergencySiphonValve()}
              className="px-3 py-1 rounded-lg text-[10px] font-black bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer animate-pulse"
              title="Click to install Emergency Siphon Float Valve instantly"
            >
              <span>🚰</span>
              <span>{siphonInBag > 0 ? 'Install Siphon (1 in Bag)' : 'Quick Install Siphon (250 Coins)'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="text-[10px] text-sky-700 dark:text-stone-400 hover:text-sky-900 dark:hover:text-cyan-300 font-mono underline cursor-pointer"
          >
            {showTestPanel ? '▲ Hide Surge Calibration' : '▼ Surge Calibration Deck'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSluiceModalOpen(true)}
          className="text-sky-700 dark:text-cyan-400 hover:text-sky-900 dark:hover:text-cyan-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>Open Sluice Console &rarr;</span>
        </button>
      </div>

      {/* Verification & Testing Calibration Deck */}
      {showTestPanel && (
        <div className="mt-2 p-3 bg-sky-50 dark:bg-stone-950/90 rounded-2xl border border-sky-300/80 dark:border-cyan-500/30 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-black text-sky-800 dark:text-cyan-300 tracking-wider">
              🧪 Hydrology Overflow Surge Verification Controls
            </span>
            <span className="text-[9px] text-stone-500 dark:text-stone-400 font-mono">Simulates exact 5 checklist criteria</span>
          </div>

          {/* Quick Storage Tier Calibration */}
          <div className="p-2 rounded-xl bg-white dark:bg-stone-900/80 border border-sky-200 dark:border-stone-800">
            <div className="text-[9px] font-mono uppercase text-stone-500 dark:text-stone-400 font-bold mb-1">
              📐 Calibrate Water Storage Levels (Tiers 1–5):
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map(t => {
                const cfg = TOWER_STORAGE_TIERS[t];
                const isSelected = towerTier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTowerStorageTier(t)}
                    className={`px-1 py-1.5 rounded-lg text-[10px] font-bold text-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-400 shadow-sm'
                        : 'bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    <span>{cfg.icon} T{t}</span>
                    <span className="block text-[8px] font-mono opacity-80">{cfg.capacityLiters >= 1000 ? `${cfg.capacityLiters / 1000}kL` : `${cfg.capacityLiters}L`}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('cistern', Math.floor(cisternMax * 0.99));
                setHydrologyReservoirLevel('tower', Math.round(towerCapacity * 0.25));
              }}
              className="px-2 py-1.5 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300 text-left cursor-pointer"
              title="Verify Cistern at 99% does NOT trigger surge"
            >
              1. Cistern 99% <span className="text-[9px] text-amber-600 dark:text-amber-400 block">(Inaction Test)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('cistern', cisternMax);
                setHydrologyReservoirLevel('tower', Math.round(towerCapacity * 0.25));
              }}
              className="px-2 py-1.5 bg-sky-100 hover:bg-sky-200 dark:bg-cyan-950/80 dark:hover:bg-cyan-900 border border-sky-300 dark:border-cyan-500/60 rounded-lg text-sky-900 dark:text-cyan-200 text-left font-bold cursor-pointer"
              title="Push Cistern from 99% to 100% to immediately trigger surge"
            >
              2. Cistern 100% <span className="text-[9px] text-sky-700 dark:text-cyan-300 block">(Instant Trigger)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('aquifer', Math.floor(aquiferCapacity * 0.99));
                setHydrologyReservoirLevel('tower', Math.round(towerCapacity * 0.25));
              }}
              className="px-2 py-1.5 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300 text-left cursor-pointer"
              title="Verify Aquifer at 99% does NOT trigger surge"
            >
              3. Aquifer 99% <span className="text-[9px] text-amber-600 dark:text-amber-400 block">(Inaction Test)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('aquifer', aquiferCapacity);
                setHydrologyReservoirLevel('tower', Math.round(towerCapacity * 0.25));
              }}
              className="px-2 py-1.5 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950/80 dark:hover:bg-sky-900 border border-sky-300 dark:border-sky-500/60 rounded-lg text-sky-900 dark:text-sky-200 text-left font-bold cursor-pointer"
              title="Push Aquifer from 99% to 100% to immediately trigger surge"
            >
              4. Aquifer 100% <span className="text-[9px] text-sky-700 dark:text-sky-300 block">(Instant Trigger)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('tower', towerCapacity);
                setHydrologyReservoirLevel('cistern', cisternMax);
              }}
              className="px-2 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-500/60 rounded-lg text-emerald-900 dark:text-emerald-200 text-left font-bold cursor-pointer"
              title={`Verify pre-filled ${towerCapacity}L tower suppresses surge when reservoir hits 100%`}
            >
              5. Tower Full <span className="text-[9px] text-emerald-700 dark:text-emerald-300 block">({towerCapacity.toLocaleString()}L Cutoff)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHydrologyReservoirLevel('tower', Math.round(towerCapacity * 0.25));
              }}
              className="px-2 py-1.5 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-amber-700 dark:text-amber-300 text-left cursor-pointer"
              title={`Drain tower to 25% (${Math.round(towerCapacity * 0.25)}L) to observe full continuous surge up to ${towerCapacity}L`}
            >
              6. Drain Tower <span className="text-[9px] text-stone-500 dark:text-stone-400 block">({Math.round(towerCapacity * 0.25).toLocaleString()}L Headroom)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
