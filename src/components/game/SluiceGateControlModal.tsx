'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  CANAL_TIER_CONFIGS,
  MOISTURE_ZONES,
  ELEVATED_TOWER_CAPACITY,
  AQUIFER_CAPACITY,
  getCisternCapacity,
  WEATHER_INFLOW_RATES,
  type CanalTier,
  WEATHER_PROFILES,
  resolveWeatherProfileId,
  type WeatherProfileId,
  type WeatherCategoryId,
  canOpenGates,
} from '@/game/hydrologyEngine';

export function SluiceGateControlModal() {
  const {
    hydrology,
    isSluiceModalOpen,
    setSluiceModalOpen,
    toggleSluiceGates,
    setAutoShutoffMoisture,
    pumpAquiferToTower,
    transferCisternToTower,
    clearSedimentInLine,
    deSiltCanals,
    deployDewScreens,
    setHydrologyWeather,
    plots,
    unlockedPlots,
    level,
  } = useGameStore();

  const [customShutoff, setCustomShutoff] = useState(hydrology?.autoShutoffMoisture ?? 75);

  if (!isSluiceModalOpen) return null;

  const hydro = hydrology;
  const canalTier = (hydro?.canalTier || 1) as CanalTier;
  const tierConfig = CANAL_TIER_CONFIGS[canalTier];

  const towerLiters = Math.round(hydro?.towerLiters ?? 0);
  const towerCapacity = hydro?.towerCapacityLiters ?? ELEVATED_TOWER_CAPACITY;
  const towerPct = Math.min(100, Math.round((towerLiters / towerCapacity) * 100));

  const cisternLiters = Math.round(hydro?.cisternLiters ?? 0);
  const cisternMax = hydro?.cisternMaxLiters ?? getCisternCapacity(level);
  const cisternPct = Math.min(100, Math.round((cisternLiters / cisternMax) * 100));

  const aquiferLiters = Math.round(hydro?.aquiferLiters ?? 0);
  const aquiferCapacity = hydro?.aquiferCapacityLiters ?? AQUIFER_CAPACITY;
  const aquiferDepthPct = Math.min(100, Math.round((aquiferLiters / aquiferCapacity) * 100));

  const gatesOpen = Boolean(hydro?.sluiceGatesOpen);
  const liveDischarge = hydro?.liveDischargeLitersPerSec || 0;
  const isClogged = Boolean(hydro?.isCloggedWithDebris);
  const hasSediment = Boolean(hydro?.hasSedimentInLine);
  const isStressed = Boolean(hydro?.isAquiferStressed);
  const isSluiceFrozen = Boolean(hydro?.isSluiceFrozen);
  const isRainbow = Boolean(hydro?.isRainbowActive);

  const activeWeatherId: WeatherProfileId = resolveWeatherProfileId(hydro?.weatherCondition);
  const activeProfile = WEATHER_PROFILES[activeWeatherId] || WEATHER_PROFILES.sunny;
  const atmos = hydro?.weatherState || {
    profileId: activeWeatherId,
    temperatureC: activeProfile.defaultTempC,
    relativeHumidityPct: activeProfile.defaultHumidityPct,
    precipitationInflowLPerMin: activeProfile.precipitationInflowLPerMin,
    windSpeedKmH: activeProfile.windSpeedKmH,
    cloudCoverPct: activeProfile.cloudCoverPct,
    barometricPressureHPa: activeProfile.barometricPressureHPa,
  };
  const inflowRate = activeProfile.precipitationInflowLPerMin;

  // Plot hydration statistics across estate (12 plots)
  const estatePlots = plots.slice(0, Math.min(12, unlockedPlots));
  const avgMoisture = estatePlots.length > 0
    ? Math.round(estatePlots.reduce((sum, p) => sum + (p.moistureLevel ?? 60), 0) / estatePlots.length)
    : 0;

  const optimalCount = estatePlots.filter(p => (p.moistureLevel ?? 60) >= 40.1 && (p.moistureLevel ?? 60) <= 80).length;
  const parchedCount = estatePlots.filter(p => (p.moistureLevel ?? 60) > 15 && (p.moistureLevel ?? 60) <= 40).length;
  const desiccatedCount = estatePlots.filter(p => (p.moistureLevel ?? 60) <= 15).length;
  const floodedCount = estatePlots.filter(p => (p.moistureLevel ?? 60) > 95).length;

  const handleShutoffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCustomShutoff(val);
    setAutoShutoffMoisture(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-stone-900 via-stone-925 to-stone-950 border-2 border-cyan-500/40 shadow-2xl text-stone-100 p-4 sm:p-6 custom-scrollbar">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-2xl shadow-lg shadow-cyan-600/30 border border-cyan-400/40">
              🌊
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Hydrological Sluice & Canal Console
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {tierConfig.badge}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Physical Fluid Routing • Gravity-Fed Irrigation • Mass Conservation Dynamics
              </p>
            </div>
          </div>
          <button
            onClick={() => setSluiceModalOpen(false)}
            className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center font-bold text-lg transition-colors border border-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Central Master Valve & Live Flow Display */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Master Flow Lever Control */}
          <div className="md:col-span-2 rounded-2xl bg-stone-900/90 border border-stone-800 p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block">
                  CANAL DISCHARGE VALVE
                </span>
                <span className="text-sm font-black text-white">
                  Master Gravity Sluice Gate
                </span>
              </div>
              <div className="flex items-center gap-2">
                {gatesOpen ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    DISCHARGING WATER
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    GATES CLOSED
                  </span>
                )}
              </div>
            </div>

            {/* Live Flow Meter Visual */}
            <div className="my-3 p-3.5 rounded-xl bg-black/40 border border-stone-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">
                  {gatesOpen ? '🌊' : '🛑'}
                </span>
                <div>
                  <div className="text-xs text-stone-400 font-medium">Flow Throughput</div>
                  <div className="text-base sm:text-lg font-mono font-extrabold text-cyan-300">
                    {gatesOpen ? `Discharging ${liveDischarge} Liters/sec to Plots 01–12` : 'Static Canal Head (0 L/sec)'}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {tierConfig.seepageLossFraction > 0
                      ? `⚠️ ${Math.round(tierConfig.seepageLossFraction * 100)}% transit seepage loss (Tier 1 unlined dirt)`
                      : '✅ 0% transit seepage loss (impermeable bed)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Master Toggle Lever */}
            {(() => {
              const gateCheck = canOpenGates(hydro, plots, unlockedPlots);
              const isLocked = !gatesOpen && !gateCheck.canOpen;

              return (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => toggleSluiceGates()}
                      className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                        gatesOpen
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40 border-2 border-rose-400'
                          : isLocked
                          ? 'bg-stone-800 text-stone-400 border-2 border-stone-700'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 border-2 border-emerald-400 animate-pulse'
                      }`}
                    >
                      <span>{gatesOpen ? '🔴 Close Sluice Gates' : isLocked ? '🔒 Gates Secured' : '🟢 Open Sluice Gates'}</span>
                      <span className="text-xs opacity-80">
                        {gatesOpen ? '(Stop Flow)' : `(Draw from Tower: ${towerLiters}L)`}
                      </span>
                    </button>

                    {isClogged && (
                      <button
                        type="button"
                        onClick={deSiltCanals}
                        className="px-3 py-3 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500 text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <span>🧹</span>
                        <span>Clear Silt Debris</span>
                      </button>
                    )}
                  </div>

                  {isLocked && gateCheck.reason && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <span>ℹ️</span>
                      <span>{gateCheck.reason}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Safety Cut-Off Dial (Tier 2+) */}
          <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                  AUTO-REGULATOR
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  tierConfig.autoCutoffSupported
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-stone-800 text-stone-500 border border-stone-700'
                }`}>
                  {tierConfig.autoCutoffSupported ? 'Tier 2+ Active' : 'Locked (Requires Lv 3)'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">Safety Cut-Off Dial</h3>
              <p className="text-[11px] text-stone-400 mt-1">
                {tierConfig.autoCutoffSupported
                  ? 'Automatically shuts sluice gates when all plots reach target saturation.'
                  : 'Upgrade canals to Tier 2 (Farm Level 3) to unlock automated mechanical shut-off levers.'}
              </p>
            </div>

            <div className="my-3">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-stone-300">Shut-off Target:</span>
                <span className="font-bold text-cyan-300">{customShutoff}% Moisture</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={customShutoff}
                disabled={!tierConfig.autoCutoffSupported}
                onChange={handleShutoffChange}
                className="w-full accent-cyan-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              />
              <div className="flex justify-between text-[9px] text-stone-500 font-mono mt-1">
                <span>50% (Lower)</span>
                <span className="text-emerald-400 font-bold">75% (Recommended)</span>
                <span>90% (Near Max)</span>
              </div>
            </div>

            <div className="text-[10px] text-stone-400 bg-black/30 p-2 rounded-lg border border-stone-800/80">
              💡 <span className="text-stone-300 font-semibold">Optimal Capillary Band:</span> 40.1% to 80.0% grants +15% Maturation Speed and Gold/Prismatic quality rolls!
            </div>
          </div>
        </div>

        {/* 3 Interconnected Reservoirs Overview */}
        <div className="mt-5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
            <span>💧</span>
            <span>Closed-Loop Hydrological Reservoirs</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Elevated Gravity Cistern Tower */}
            <div className="rounded-2xl bg-gradient-to-br from-cyan-950/40 to-stone-900 border border-cyan-500/30 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <span>🗼</span>
                    <span>Elevated Gravity Tower</span>
                  </span>
                  <span className="font-mono text-cyan-200 font-bold">{towerLiters} / {towerCapacity} L</span>
                </div>
                <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden mt-1.5 border border-cyan-900/50">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${towerPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-2">
                  Header tank built above plot grade. Drives gravity flow across the canal furrows with 0 continuous labor.
                </p>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                <button
                  type="button"
                  disabled={cisternLiters <= 0 || towerLiters >= towerCapacity}
                  onClick={() => transferCisternToTower(200)}
                  className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-cyan-700/40 hover:bg-cyan-600/60 border border-cyan-500/50 text-cyan-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-center"
                >
                  Transfer +200L from Rain Cistern
                </button>
                <button
                  type="button"
                  disabled={aquiferLiters <= 50 || towerLiters >= towerCapacity}
                  onClick={() => pumpAquiferToTower(200)}
                  className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-blue-800/40 hover:bg-blue-700/60 border border-blue-500/50 text-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-center"
                >
                  Pump +200L from Deep Aquifer
                </button>
              </div>
            </div>

            {/* 2. Homestead Rain Cistern & Retention Basin */}
            <div className="rounded-2xl bg-gradient-to-br from-sky-950/40 to-stone-900 border border-sky-500/30 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-sky-300 flex items-center gap-1">
                    <span>🌧️</span>
                    <span>Rain Catchment Cistern</span>
                  </span>
                  <span className="font-mono text-sky-200 font-bold">{cisternLiters} / {cisternMax} L</span>
                </div>
                <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden mt-1.5 border border-sky-900/50">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${cisternPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-2">
                  Captures overland precipitation and roof runoff. Capacity scales with Farm Level ({cisternMax}L at Lv {level}).
                </p>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] bg-black/30 p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-300">Active Atmospheric Inflow:</span>
                  <span className="font-bold text-sky-300 font-mono flex items-center gap-1">
                    <span>{activeProfile.emoji}</span>
                    <span>+{inflowRate} L/min</span>
                  </span>
                </div>

                {cisternLiters >= cisternMax ? (
                  <div className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 p-1.5 rounded border border-cyan-500/40 text-center flex items-center justify-center gap-1">
                    <span>🌊</span>
                    <span>Overflowing: +20 L/min recharging Deep Aquifer!</span>
                  </div>
                ) : activeWeatherId === 'heatwave' ? (
                  <div className="text-[10px] font-bold text-rose-300 bg-rose-950/60 p-1.5 rounded border border-rose-500/40 text-center flex items-center justify-center gap-1">
                    <span>🔥</span>
                    <span>Thermal Boil: -10 L/min evaporating into dry air!</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-stone-400 text-center">
                    Surface catchment ready • Closed-loop mass conservation
                  </div>
                )}
              </div>
            </div>

            {/* 3. Deep Subterranean Aquifer */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 to-stone-900 border border-emerald-500/30 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <span>🚰</span>
                    <span>Deep Groundwater Aquifer</span>
                  </span>
                  <span className="font-mono text-emerald-200 font-bold">{aquiferLiters} / {aquiferCapacity} L</span>
                </div>
                <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden mt-1.5 border border-emerald-900/50">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isStressed ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                    }`}
                    style={{ width: `${aquiferDepthPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-2">
                  Natural water table. Recharges at +8 L/min plus 30% of applied plot irrigation via subsoil percolation.
                </p>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] bg-black/30 p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-300">Table Status:</span>
                  <span className={`font-bold font-mono ${isStressed ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isStressed ? '⚠️ Stressed (<25%)' : 'Healthy (Normal)'}
                  </span>
                </div>
                {hasSediment ? (
                  <button
                    type="button"
                    onClick={clearSedimentInLine}
                    className="py-1 px-2 rounded-md bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border border-amber-500 text-[10px] font-bold"
                  >
                    🧹 Clear Sediment Line (Restore 100% Speed)
                  </button>
                ) : (
                  <div className="text-[9px] text-stone-500 text-center">
                    Intake line clear • Full extraction speed active
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unified Atmospheric Weather & Crop Phenology Console */}
        <div className="mt-5 rounded-2xl bg-stone-900/90 border border-stone-800 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <span>🌤️</span>
              <span>Unified Atmospheric Weather & Climate Simulation</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              16 Deterministic Meteorologic States
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Active Weather Dossier Card */}
            <div className="lg:col-span-1 rounded-xl bg-black/40 border border-stone-800 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{activeProfile.emoji}</span>
                    <div>
                      <div className="text-sm font-black text-white">{activeProfile.name}</div>
                      <div className="text-[10px] font-semibold text-amber-400">{activeProfile.categoryLabel}</div>
                    </div>
                  </div>
                  {isRainbow && (
                    <span className="text-xs px-2 py-0.5 rounded bg-pink-950 border border-pink-500 text-pink-300 font-bold animate-pulse">
                      🌈 Rainbow
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-stone-300 mt-2 leading-relaxed">
                  {activeProfile.description}
                </p>

                {/* 6 Core Meteorologic Variables */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                  <div>
                    <span className="text-stone-400 block text-[9px]">TEMPERATURE (T)</span>
                    <span className="text-amber-300 font-bold text-xs">{atmos.temperatureC}°C</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[9px]">HUMIDITY (H)</span>
                    <span className="text-cyan-300 font-bold text-xs">{atmos.relativeHumidityPct}%</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[9px]">PRECIPITATION (P)</span>
                    <span className="text-blue-300 font-bold text-xs">{activeProfile.precipitationInflowLPerMin} L/m</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[9px]">WIND SPEED (W)</span>
                    <span className="text-stone-200 font-bold text-xs">{atmos.windSpeedKmH} km/h</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[9px]">CLOUD COVER (C)</span>
                    <span className="text-stone-300 font-bold text-xs">{atmos.cloudCoverPct}%</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[9px]">BAROMETER</span>
                    <span className="text-emerald-300 font-bold text-xs">{atmos.barometricPressureHPa} hPa</span>
                  </div>
                </div>

                {/* Agronomic Crop Reaction Callout */}
                <div className="mt-3 p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[10px] text-amber-200">
                  <span className="font-bold block text-[9px] uppercase tracking-wider text-amber-400 mb-0.5">🌾 Crop Reaction & Phenology:</span>
                  {activeProfile.phenologyNotes}
                </div>

                {isSluiceFrozen && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-950/60 border border-rose-500/60 text-[10px] text-rose-200 font-bold flex items-center gap-1.5">
                    <span>🧊</span>
                    <span>Furrows Frozen Solid: Earthen sluice locked! Upgrade to Tier 2 clay canals.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Weather State Selector across 5 Categories */}
            <div className="lg:col-span-2 space-y-2.5">
              {[
                {
                  id: 'clear_thermal' as WeatherCategoryId,
                  title: 'Clear & Thermal Category',
                  profiles: ['sunny', 'heatwave', 'drought'] as WeatherProfileId[],
                },
                {
                  id: 'overcast_humid' as WeatherCategoryId,
                  title: 'Overcast & High Humidity Category',
                  profiles: ['cloudy', 'humid', 'foggy'] as WeatherProfileId[],
                },
                {
                  id: 'precipitation' as WeatherCategoryId,
                  title: 'Active Precipitation Category',
                  profiles: ['drizzle', 'rain', 'monsoon', 'sunshower'] as WeatherProfileId[],
                },
                {
                  id: 'severe_convective' as WeatherCategoryId,
                  title: 'Severe Convective & Mechanical Hazards',
                  profiles: ['gale', 'thunderstorm', 'hailstorm', 'cyclone'] as WeatherProfileId[],
                },
                {
                  id: 'freezing_arid' as WeatherCategoryId,
                  title: 'Freezing & Arid Category',
                  profiles: ['frost', 'snow'] as WeatherProfileId[],
                },
              ].map((cat) => (
                <div key={cat.id} className="rounded-xl bg-black/30 border border-stone-800 p-2">
                  <div className="text-[10px] font-mono uppercase text-stone-400 font-bold mb-1.5 px-1">
                    {cat.title}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                    {cat.profiles.map((pId) => {
                      const pDef = WEATHER_PROFILES[pId];
                      const isSel = activeWeatherId === pId;
                      return (
                        <button
                          key={pId}
                          type="button"
                          onClick={() => setHydrologyWeather(pId)}
                          className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                            isSel
                              ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-xs font-bold scale-[1.02]'
                              : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-800 hover:border-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{pDef.emoji}</span>
                            <div className="min-w-0">
                              <div className="text-[11px] truncate font-bold">{pDef.name.split('/')[0].trim()}</div>
                              <div className="text-[9px] font-mono text-stone-400">
                                {pDef.defaultTempC}°C • {pDef.precipitationInflowLPerMin > 0 ? `+${pDef.precipitationInflowLPerMin}L` : `${pDef.defaultHumidityPct}%RH`}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Tier Canal Architecture Progression */}
        <div className="mt-5 rounded-2xl bg-stone-900/90 border border-stone-800 p-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🏗️</span>
              <span>Irrigation Infrastructure Progression</span>
            </span>
            <span className="text-cyan-300 font-bold">Active: {tierConfig.name}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {([1, 2, 3, 4] as CanalTier[]).map((t) => {
              const cfg = CANAL_TIER_CONFIGS[t];
              const isCurrent = canalTier === t;
              const isUnlocked = level >= cfg.minLevel;

              return (
                <div
                  key={t}
                  className={`rounded-xl p-3 border text-left transition-all relative ${
                    isCurrent
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-950/50'
                      : isUnlocked
                      ? 'bg-stone-900/60 border-stone-700/70 opacity-90'
                      : 'bg-stone-950/40 border-stone-800/50 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-lg">{cfg.icon}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      isCurrent
                        ? 'bg-cyan-500 text-stone-950 font-black'
                        : isUnlocked
                        ? 'bg-stone-800 text-stone-300'
                        : 'bg-stone-800 text-stone-500'
                    }`}>
                      {isCurrent ? 'ACTIVE' : `Lv ${cfg.minLevel}+`}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-white leading-tight mt-1">{cfg.name}</div>
                  <div className="text-[10px] text-stone-400 mt-1 leading-snug">{cfg.description}</div>

                  <div className="mt-2 pt-2 border-t border-stone-800 text-[9px] space-y-0.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Transit Seepage:</span>
                      <span className={cfg.seepageLossFraction > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        {cfg.seepageLossFraction > 0 ? `-${Math.round(cfg.seepageLossFraction * 100)}%` : '0%'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Morning Evap:</span>
                      <span className="text-cyan-300">-{cfg.morningEvaporationRatePctPerMin}%/min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Max Saturation:</span>
                      <span className={cfg.maxSaturationCapPct <= 80 ? 'text-emerald-400' : 'text-stone-300'}>
                        {cfg.maxSaturationCapPct}% {cfg.maxSaturationCapPct <= 80 ? '(No Rot)' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Worker Shift Duties Integration Bar */}
        <div className="mt-4 rounded-2xl bg-stone-900/60 border border-stone-800 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👷</span>
            <div>
              <div className="font-bold text-stone-200">Worker Shift Hydrology Duties</div>
              <div className="text-[11px] text-stone-400">
                <span className="text-amber-300 font-semibold">Morning Field Hand:</span> Opens 06:00 sluice gates & pumps aquifer if tower &lt; 200L.
                {' '}
                <span className="text-indigo-300 font-semibold">Night Watch:</span> De-silts canal grates & harvests +20L dew if cistern &lt; 50L.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={deployDewScreens}
            className="py-1.5 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400 text-indigo-200 font-bold text-xs whitespace-nowrap transition-all"
          >
            Deploy Dew Screens (+20L)
          </button>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => setSluiceModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-md shadow-cyan-900/30"
          >
            Close Hydrology Console
          </button>
        </div>
      </div>
    </div>
  );
}
