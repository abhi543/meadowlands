'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { getCircadianClock } from '@/game/shiftEngine';
import {
  getDiurnalEvaporationRatePctPerMin,
  CANAL_TIER_CONFIGS,
  WEATHER_INFLOW_RATES,
} from '@/game/hydrologyEngine';

export function EstateHydrologyGauge() {
  const {
    hydrology,
    farmEpochStart,
    level,
    activeEvent,
    setSluiceModalOpen,
  } = useGameStore();

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clock = getCircadianClock(now, farmEpochStart);
  const canalTier = hydrology?.canalTier || 1;
  const tierDef = CANAL_TIER_CONFIGS[canalTier];
  const evapInfo = getDiurnalEvaporationRatePctPerMin(clock.cycleElapsedSeconds, canalTier);

  const cisternLiters = Math.round(hydrology?.cisternLiters ?? 900);
  const cisternMax = hydrology?.cisternMaxLiters ?? 1500;
  const cisternPct = Math.min(100, Math.round((cisternLiters / (cisternMax || 1)) * 100));

  const aquiferLiters = Math.round(hydrology?.aquiferLiters ?? 2760);
  const aquiferMax = hydrology?.aquiferCapacityLiters ?? 3000;
  const aquiferDepthPct = Math.min(100, Math.round((aquiferLiters / (aquiferMax || 1)) * 100));
  const isStressed = hydrology?.isAquiferStressed || aquiferDepthPct < 25;

  const towerLiters = Math.round(hydrology?.towerLiters ?? 650);
  const towerMax = hydrology?.towerCapacityLiters ?? 800;

  const isRain = activeEvent?.type === 'rainstorm' || hydrology?.weatherCondition === 'downpour';
  const isLightRain = hydrology?.weatherCondition === 'light_rain';
  const inflowRate = isRain ? WEATHER_INFLOW_RATES.downpour : isLightRain ? WEATHER_INFLOW_RATES.light_rain : 0;

  const gatesOpen = Boolean(hydrology?.sluiceGatesOpen);
  const liveDischarge = hydrology?.liveDischargeLitersPerSec || 0;

  return (
    <button
      type="button"
      onClick={() => setSluiceModalOpen(true)}
      className="relative group bg-stone-900/85 hover:bg-stone-900 active:scale-[0.98] transition-all backdrop-blur-md rounded-xl px-3 py-1.5 text-xs flex flex-wrap items-center gap-2.5 sm:gap-3 cursor-pointer shadow-md border border-cyan-500/35 hover:border-cyan-400 select-none text-left"
      title="Estate Hydrological Network: Tap to open Gravity Sluice Console & Canal Telemetry"
    >
      {/* Background caustics highlight */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-blue-500/10 pointer-events-none" />

      {/* Surface Cistern Widget */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
          <span className="text-xs">💧</span>
          {inflowRate > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-200">
            <span>Cistern:</span>
            <span className="font-mono">{cisternLiters.toLocaleString()} / {cisternMax.toLocaleString()} L</span>
            <span className={`text-[9px] font-mono ${inflowRate > 0 ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
              (+{inflowRate} L/m)
            </span>
          </div>
          {/* Cistern mini fill bar */}
          <div className="w-24 h-1.5 bg-stone-800 rounded-full overflow-hidden mt-0.5 border border-cyan-900/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${cisternPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="h-4 w-px bg-stone-700/60 hidden sm:block" />

      {/* Deep Subterranean Aquifer Meter */}
      <div className="flex items-center gap-1.5">
        <div className={`flex items-center justify-center w-6 h-6 rounded-lg border text-xs ${
          isStressed
            ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
            : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
        }`}>
          <span>🚰</span>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-stone-300 flex items-center gap-1">
            <span>Aquifer:</span>
            <span className={`font-bold font-mono ${isStressed ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isStressed ? `Stressed (${aquiferDepthPct}%)` : `Healthy (${aquiferDepthPct}%)`}
            </span>
          </div>
          <div className="text-[9px] text-stone-400 font-mono">
            +8 L/m recharge
          </div>
        </div>
      </div>

      <div className="h-4 w-px bg-stone-700/60 hidden md:block" />

      {/* Atmospheric Weather & Diurnal Evaporation */}
      <div className="hidden md:flex items-center gap-1.5 text-[10px]">
        <span className="text-amber-300 text-xs">
          {isRain ? '🌧️' : clock.currentPeriod === 'day' ? '☀️' : clock.currentPeriod === 'dusk' ? '⛅' : '🌙'}
        </span>
        <div>
          <span className="font-semibold text-stone-200">
            {isRain ? 'Downpour Inflow' : clock.currentPeriod === 'day' ? 'High Sun' : clock.currentPeriod === 'dusk' ? 'Twilight Warmth' : 'Night Condensation'}
          </span>
          <span className="text-[9px] text-cyan-300 block font-mono">
            Evap: -{evapInfo.ratePctPerMin}%/min
          </span>
        </div>
      </div>

      {/* Sluice Gate Status Pill */}
      <div className="ml-auto flex items-center gap-1.5">
        {gatesOpen ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Sluice Open ({liveDischarge} L/s)</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-stone-400 border border-stone-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Gates Closed</span>
          </span>
        )}

        {/* Elevated Tower Pill */}
        <span className="hidden lg:flex items-center gap-1 text-[9px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
          <span>🗼 {towerLiters}/{towerMax}L</span>
        </span>
      </div>
    </button>
  );
}
