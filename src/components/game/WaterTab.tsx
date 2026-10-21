'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  CANAL_TIER_CONFIGS,
  MOISTURE_ZONES,
  ELEVATED_TOWER_CAPACITY,
  AQUIFER_CAPACITY,
  getCisternCapacity,
  CISTERN_STORAGE_TIERS,
  AQUIFER_STORAGE_TIERS,
  WEATHER_INFLOW_RATES,
  type CanalTier,
  WEATHER_PROFILES,
  resolveWeatherProfileId,
  type WeatherProfileId,
  type WeatherCategoryId,
  canOpenGates,
} from '@/game/hydrologyEngine';
import { TOWER_STORAGE_TIERS } from '@/game/hydraulicFailSafeEngine';
import { GravityTowerWidget } from './GravityTowerWidget';

export function WaterTab() {
  const {
    hydrology,
    toggleSluiceGates,
    setAutoShutoffMoisture,
    pumpAquiferToTower,
    transferCisternToTower,
    clearSedimentInLine,
    deSiltCanals,
    deployDewScreens,
    setHydrologyWeather,
    toggleEmergencySpillway,
    openEmergencySpillway,
    closeEmergencySpillway,
    upgradeTowerStorageTier,
    upgradeCisternStorageTier,
    upgradeAquiferStorageTier,
    setTowerStorageTier,
    setCisternStorageTier,
    setAquiferStorageTier,
    upgradeCanalTier,
    setCanalTier,
    coins,
    plots,
    unlockedPlots,
    level,
    workshopLoadout,
    installEmergencySiphonValve,
    toggleSiphonMode,
    cycleSiphonSourcePreference,
    barn,
  } = useGameStore();

  const [customShutoff, setCustomShutoff] = useState(hydrology?.autoShutoffMoisture ?? 75);

  const hydro = hydrology;
  const canalTier = (Math.min(4, Math.max(1, hydro?.canalTier || 1))) as CanalTier;
  const tierConfig = CANAL_TIER_CONFIGS[canalTier] || CANAL_TIER_CONFIGS[1];

  const towerTier = hydro?.towerTier || 1;
  const towerTierConfig = TOWER_STORAGE_TIERS[towerTier] || TOWER_STORAGE_TIERS[1];
  const towerLiters = Math.round(hydro?.towerLiters ?? 0);
  const towerCapacity = hydro?.towerCapacityLiters ?? towerTierConfig.capacityLiters;
  const towerPct = Math.min(100, Math.round((towerLiters / towerCapacity) * 100));

  const cisternTier = hydro?.cisternTier || 1;
  const cisternTierConfig = CISTERN_STORAGE_TIERS[cisternTier] || CISTERN_STORAGE_TIERS[1];
  const cisternLiters = Math.round(hydro?.cisternLiters ?? 0);
  const cisternMax = hydro?.cisternMaxLiters ?? cisternTierConfig.capacityLiters;
  const cisternPct = Math.min(100, Math.round((cisternLiters / cisternMax) * 100));

  const aquiferTier = hydro?.aquiferTier || 1;
  const aquiferTierConfig = AQUIFER_STORAGE_TIERS[aquiferTier] || AQUIFER_STORAGE_TIERS[1];
  const aquiferLiters = Math.round(hydro?.aquiferLiters ?? 0);
  const aquiferCapacity = hydro?.aquiferCapacityLiters ?? aquiferTierConfig.capacityLiters;
  const aquiferDepthPct = Math.min(100, Math.round((aquiferLiters / aquiferCapacity) * 100));

  const gatesOpen = Boolean(hydro?.sluiceGatesOpen);
  const liveDischarge = hydro?.liveDischargeLitersPerSec || 0;
  const isClogged = Boolean(hydro?.isCloggedWithDebris);
  const hasSediment = Boolean(hydro?.hasSedimentInLine);
  const isStressed = Boolean(hydro?.isAquiferStressed);
  const isSluiceFrozen = Boolean(hydro?.isSluiceFrozen);
  const isRainbow = Boolean(hydro?.isRainbowActive);

  // Flash Flood & Spillway State
  const isFlashFloodActive = Boolean(hydro?.isFlashFloodActive);
  const isSpillwayOpen = Boolean(hydro?.isSpillwayOpen);
  const floodHazardRemainingSec = hydro?.floodHazardRemainingSec ?? 180;

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

  const hasEmergencySiphon = Boolean(workshopLoadout?.emergencySiphonInstalled);
  const siphonMode = hydro?.siphonMode || 'continuous';
  const siphonSourcePreference = hydro?.siphonSourcePreference || 'smart_highest';
  const siphonActiveSource = hydro?.siphonActiveSource;
  const isSiphonActive = Boolean(hydro?.isSiphonActive);
  const siphonInBag = barn?.emergency_siphon_valve || 0;

  const handleShutoffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCustomShutoff(val);
    setAutoShutoffMoisture(val);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Page Header Ribbon: Vibrant River & Azure Gradient with Glassmorphic Telemetry */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-blue-700 via-sky-600 to-teal-600 dark:from-slate-900 dark:via-cyan-950 dark:to-blue-950 text-white shadow-xl shadow-cyan-900/10 border border-sky-300/40 dark:border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Ambient background water ripples */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/10 dark:bg-cyan-400/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-40 h-40 rounded-full bg-teal-300/10 dark:bg-teal-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/20 dark:bg-cyan-500/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner border border-white/30 dark:border-cyan-400/40 shrink-0">
            💧
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
                Hydrological Sluice &amp; Canal Network
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-white/25 dark:bg-cyan-950/80 text-white dark:text-cyan-200 border border-white/40 dark:border-cyan-400/60 backdrop-blur-sm">
                {tierConfig.badge}
              </span>
              {isRainbow && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-pink-400 via-amber-300 to-emerald-300 text-stone-900 shadow-sm animate-pulse">
                  🌈 Rainbow Active: 0% Evap
                </span>
              )}
            </div>
            <p className="text-xs text-sky-100 dark:text-cyan-200/90 mt-1 font-medium">
              Real-time Fluid Dynamics • Gravity-Fed Irrigation • Mass Conservation • Smart Dual-Intake Siphon
            </p>
          </div>
        </div>

        {/* Quick telemetry indicators with frosted glass effect */}
        <div className="relative z-10 flex items-center gap-2 flex-wrap text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white/20 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-cyan-400/30 flex items-center gap-1.5 font-mono shadow-sm">
            <span>🌧️</span>
            <span className="text-sky-100 dark:text-stone-300">Cistern:</span>
            <span className="font-bold text-white dark:text-cyan-300">{cisternPct}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/20 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-cyan-400/30 flex items-center gap-1.5 font-mono shadow-sm">
            <span>🗼</span>
            <span className="text-sky-100 dark:text-stone-300">Tower:</span>
            <span className="font-bold text-white dark:text-cyan-300">{towerPct}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/20 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-cyan-400/30 flex items-center gap-1.5 font-mono shadow-sm">
            <span>🚰</span>
            <span className="text-sky-100 dark:text-stone-300">Aquifer:</span>
            <span className={`font-bold ${isStressed ? 'text-amber-200 dark:text-rose-400 animate-pulse' : 'text-emerald-200 dark:text-emerald-300'}`}>
              {aquiferDepthPct}%
            </span>
          </div>
          <a
            href="/Meadowlands_Water_System_Complete_Manual.pdf"
            download="Meadowlands_Water_System_Complete_Manual.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-white/25 hover:bg-white/35 dark:bg-cyan-900/60 dark:hover:bg-cyan-800/80 backdrop-blur-md border border-white/40 dark:border-cyan-400/50 flex items-center gap-1.5 font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer text-xs"
            title="Download the Complete Hydrology & Water Engineering PDF Manual"
          >
            <span>📄</span>
            <span>PDF Guide</span>
          </a>
        </div>
      </div>

      {/* Dedicated Gravity Tower Hydraulic Fail-Safe Status & Estimator Widget */}
      <div>
        <GravityTowerWidget />
      </div>

      {/* Dedicated Smart Siphon Dual-Intake Manifold Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-sky-200/80 dark:border-cyan-800/60 shadow-md hover:shadow-lg transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white flex items-center justify-center text-2xl shadow-md shadow-sky-500/20 shrink-0">
            🚰
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
                Smart Siphon Dual-Intake Manifold
              </span>
              {hasEmergencySiphon ? (
                <>
                  {siphonMode === 'continuous' ? (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-400 font-bold flex items-center gap-1 animate-pulse">
                      <span>⚡</span> Continuous Artesian Feed (+2.0 L/s)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600 font-bold flex items-center gap-1">
                      <span>🛡️</span> Emergency Reserve Only (≤80L)
                    </span>
                  )}
                  {isSiphonActive && (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-400 font-extrabold flex items-center gap-1 shadow-xs">
                      <span>💧</span> Active Intake: {siphonActiveSource === 'cistern' ? '🌧️ Rain Cistern (Higher %)' : '🚰 Deep Groundwater'}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600 font-bold animate-pulse flex items-center gap-1">
                  <span>⚠️</span> Standby: Not Installed
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
              {hasEmergencySiphon
                ? (siphonSourcePreference === 'smart_highest'
                    ? `🔄 Smart Auto-Intake: Draws automatically from whichever reservoir is higher (${cisternPct}% Cistern vs ${aquiferDepthPct}% Aquifer) to prioritize collected rainwater and prevent groundwater depletion.`
                    : siphonSourcePreference === 'cistern'
                    ? `🌧️ Cistern Priority: Prioritizes surface rainwater (${cisternPct}% full) into the tower before tapping the groundwater aquifer.`
                    : `🚰 Aquifer Priority: Prioritizes subterranean groundwater (${aquiferDepthPct}% full) via deep artesian vacuum.`)
                : 'Automatically siphons 2.0 L/s from whichever reservoir has the higher water level to keep the Gravity Tower pressurized and crops hydrated.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 flex-wrap">
          {hasEmergencySiphon ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => cycleSiphonSourcePreference()}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs bg-sky-50 hover:bg-sky-100 dark:bg-stone-800 dark:hover:bg-stone-700 border-sky-300 dark:border-stone-700 text-sky-900 dark:text-cyan-200"
                title="Click to change siphon intake source: Smart Auto (Highest Level %) | Cistern Priority | Deep Aquifer Priority"
              >
                <span>
                  {siphonSourcePreference === 'smart_highest'
                    ? '🔄 Intake: Smart Auto (Highest %)'
                    : siphonSourcePreference === 'cistern'
                    ? '🌧️ Intake: Cistern Priority'
                    : '🚰 Intake: Deep Aquifer'}
                </span>
                <span className="text-[10px] opacity-75 font-normal">(Change)</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSiphonMode()}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  siphonMode === 'continuous'
                    ? 'bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-950/70 dark:hover:bg-cyan-900 border-cyan-400 text-cyan-900 dark:text-cyan-200'
                    : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
                title="Toggle between Continuous Feed vs Emergency Reserve (≤80L only)"
              >
                <span>{siphonMode === 'continuous' ? '⚡ Continuous' : '🛡️ Emergency'}</span>
                <span className="text-[10px] opacity-75 font-normal">(Switch)</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => installEmergencySiphonValve()}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white shadow-md shadow-cyan-600/25 border border-white/20 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>⚡</span>
              <span>{siphonInBag > 0 ? 'Install Valve (1 in Bag)' : 'Quick Install Siphon (250 Coins)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Central Master Valve & Live Flow Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Master Flow Lever Control */}
        <div className="md:col-span-2 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-sky-200/80 dark:border-stone-800 p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold block">
                  CANAL DISCHARGE VALVE
                </span>
                <span className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                  Master Gravity Sluice Gate
                </span>
              </div>
              <div className="flex items-center gap-2">
                {gatesOpen ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/50 flex items-center gap-1.5 shadow-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    DISCHARGING WATER
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    GATES CLOSED
                  </span>
                )}
              </div>
            </div>

            {/* Live Flow Meter Visual */}
            <div className="my-3 p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-cyan-50/70 to-blue-50 dark:from-stone-950 dark:via-cyan-950/30 dark:to-stone-950 border border-sky-200/80 dark:border-cyan-900/50 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">
                  {gatesOpen ? '🌊' : '🛑'}
                </span>
                <div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 font-semibold">Flow Throughput</div>
                  <div className="text-base sm:text-lg font-mono font-black text-sky-800 dark:text-cyan-300">
                    {isFlashFloodActive && !isSpillwayOpen ? (
                      <span className="text-rose-600 dark:text-rose-400 animate-pulse">RIVER BREACH OVERFLOW (+120 L/sec unchecked)</span>
                    ) : isSpillwayOpen ? (
                      <span className="text-teal-700 dark:text-teal-300 animate-pulse">Spillway Diverting 120 L/sec Off-Map (-10%/sec Purge)</span>
                    ) : gatesOpen ? (
                      `Discharging ${liveDischarge} Liters/sec to Plots 01–${unlockedPlots}`
                    ) : (
                      'Static Canal Head (0 L/sec)'
                    )}
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {tierConfig.seepageLossFraction > 0
                      ? `⚠️ ${Math.round(tierConfig.seepageLossFraction * 100)}% transit seepage loss (Tier 1 unlined dirt)`
                      : '✅ 0% transit seepage loss (impermeable bed)'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Master Toggle Lever */}
          {(() => {
            const gateCheck = canOpenGates(hydro, plots, unlockedPlots);
            return (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => toggleSluiceGates()}
                  disabled={!gatesOpen && !gateCheck.canOpen}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 ${
                    gatesOpen
                      ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-600/20'
                      : !gateCheck.canOpen
                      ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed border border-stone-300 dark:border-stone-700'
                      : 'bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-400 hover:via-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/25'
                  }`}
                >
                  <span>{gatesOpen ? '🛑 Lock Sluice Gates (Stop Flow)' : '🌊 Open Sluice Gates (Feed Canals)'}</span>
                </button>
                {!gatesOpen && !gateCheck.canOpen && gateCheck.reason && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 text-center font-medium">
                    ⚠️ {gateCheck.reason}
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Moisture Zones & Auto-Shutoff Gauge */}
        <div className="rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-sky-200/80 dark:border-stone-800 p-5 flex flex-col justify-between shadow-md">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold mb-1">
              AUTOMATIC SHUTOFF
            </div>
            <div className="text-sm font-black text-stone-900 dark:text-white mb-2">Soil Saturation Limiter</div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 leading-relaxed">
              Gates shut automatically once soil moisture hits the calibrated threshold to avoid root rot.
            </p>

            <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-stone-950 border border-sky-200/60 dark:border-stone-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-700 dark:text-stone-300 font-semibold">Shutoff Threshold:</span>
                <span className="font-mono font-extrabold text-sky-700 dark:text-cyan-300 text-sm">{customShutoff}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={customShutoff}
                onChange={handleShutoffChange}
                className="w-full accent-cyan-600 dark:accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                <span>50% (Lean)</span>
                <span>75% (Optimum)</span>
                <span>95% (Near Saturation)</span>
              </div>
            </div>
          </div>

          {/* Quick Canal Maintenance Actions */}
          <div className="space-y-1.5 mt-3 pt-3 border-t border-stone-200 dark:border-stone-800">
            <div className="text-[10px] font-mono text-stone-500 dark:text-stone-400 uppercase font-bold">Maintenance:</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={clearSedimentInLine}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  hasSediment
                    ? 'bg-amber-100 dark:bg-amber-600/30 border-amber-400 text-amber-800 dark:text-amber-200 animate-pulse'
                    : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                <span>🧹 Clear Sediment</span>
              </button>
              <button
                type="button"
                onClick={deSiltCanals}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  isClogged
                    ? 'bg-rose-100 dark:bg-rose-600/30 border-rose-400 text-rose-800 dark:text-rose-200 animate-pulse'
                    : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                <span>🌿 De-Silt Grates</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tri-Reservoir Hydraulic Distribution Deck: Distinct Themed Aquaria Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reservoir 1: Surface Rain Cistern */}
        <div className="rounded-3xl bg-gradient-to-b from-sky-50/70 via-white to-white dark:from-sky-950/30 dark:via-stone-900 dark:to-stone-900 border border-sky-200 dark:border-sky-800/60 p-4.5 space-y-3 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-xl text-sky-600 dark:text-sky-300 shadow-xs border border-sky-200 dark:border-sky-700">
                🌧️
              </div>
              <div>
                <div className="font-black text-sm text-stone-900 dark:text-white">Rain Catchment Cistern</div>
                <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-semibold">Surface Runoff Basin</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
              {cisternTierConfig.badge}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Stored Volume:</span>
              <span className="font-bold text-sky-700 dark:text-cyan-300">{cisternLiters.toLocaleString()} / {cisternMax.toLocaleString()} L</span>
            </div>
            <div className="w-full h-3 rounded-full bg-sky-100 dark:bg-stone-800 overflow-hidden p-0.5 border border-sky-200/60 dark:border-stone-700">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${cisternPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-semibold">
              <span>Inflow: +{atmos.precipitationInflowLPerMin} L/min</span>
              <span>{cisternPct}% Full</span>
            </div>
          </div>

          <div className="pt-2 border-t border-sky-100 dark:border-stone-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => transferCisternToTower()}
              disabled={cisternLiters < 100 || towerLiters >= towerCapacity}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 disabled:bg-stone-100 dark:bg-sky-600/20 dark:hover:bg-sky-600/40 dark:disabled:bg-stone-800/50 border border-sky-400/50 disabled:border-stone-300 dark:disabled:border-stone-700 text-sky-700 dark:text-sky-200 disabled:text-stone-400 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              Transfer 100L &rarr; Tower
            </button>
            <button
              type="button"
              onClick={upgradeCisternStorageTier}
              disabled={cisternTier >= 5 || coins < (CISTERN_STORAGE_TIERS[cisternTier + 1]?.costCoins || 999999)}
              className="py-2 px-3 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-stone-100 dark:bg-amber-600/20 dark:hover:bg-amber-600/40 disabled:border-stone-300 border border-amber-400/60 text-amber-800 dark:text-amber-200 disabled:text-stone-400 cursor-pointer disabled:cursor-not-allowed"
              title={cisternTier >= 5 ? 'Max Tier Reached' : `Upgrade Cistern (🪙${(CISTERN_STORAGE_TIERS[cisternTier + 1]?.costCoins || 0).toLocaleString()})`}
            >
              {cisternTier >= 5 ? 'MAX' : `⬆️ T${cisternTier + 1}`}
            </button>
          </div>
        </div>

        {/* Reservoir 2: Elevated Gravity Tower */}
        <div className="rounded-3xl bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-indigo-950/30 dark:via-stone-900 dark:to-stone-900 border border-blue-200 dark:border-blue-800/60 p-4.5 space-y-3 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-indigo-950 flex items-center justify-center text-xl text-blue-600 dark:text-blue-300 shadow-xs border border-blue-200 dark:border-indigo-700">
                🗼
              </div>
              <div>
                <div className="font-black text-sm text-stone-900 dark:text-white">Elevated Gravity Tower</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold">Pressurized Hydro Head</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              {towerTierConfig.badge}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Active Storage:</span>
              <span className="font-bold text-blue-700 dark:text-cyan-300">{towerLiters.toLocaleString()} / {towerCapacity.toLocaleString()} L</span>
            </div>
            <div className="w-full h-3 rounded-full bg-blue-100 dark:bg-stone-800 overflow-hidden p-0.5 border border-blue-200/60 dark:border-stone-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${towerPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-semibold">
              <span>Surge Inflow: +{towerTierConfig.surgeLps} L/s</span>
              <span>{towerPct}% Head</span>
            </div>
          </div>

          <div className="pt-2 border-t border-blue-100 dark:border-stone-800 flex items-center gap-2">
            <button
              type="button"
              onClick={upgradeTowerStorageTier}
              disabled={towerTier >= 5 || coins < (TOWER_STORAGE_TIERS[towerTier + 1]?.costCoins || 999999)}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-stone-100 dark:bg-amber-600/20 dark:hover:bg-amber-600/40 border border-amber-400/60 disabled:border-stone-300 dark:disabled:border-stone-700 text-amber-800 dark:text-amber-200 disabled:text-stone-400 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {towerTier >= 5 ? 'Tower at Maximum Capacity (Tier 5)' : `⬆️ Upgrade Tower (🪙${(TOWER_STORAGE_TIERS[towerTier + 1]?.costCoins || 0).toLocaleString()})`}
            </button>
          </div>
        </div>

        {/* Reservoir 3: Deep Subterranean Aquifer */}
        <div className="rounded-3xl bg-gradient-to-b from-teal-50/70 via-white to-white dark:from-teal-950/30 dark:via-stone-900 dark:to-stone-900 border border-teal-200 dark:border-teal-800/60 p-4.5 space-y-3 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-xl text-teal-600 dark:text-teal-300 shadow-xs border border-teal-200 dark:border-teal-700">
                🚰
              </div>
              <div>
                <div className="font-black text-sm text-stone-900 dark:text-white">Deep Groundwater Aquifer</div>
                <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-semibold">Subsoil Natural Table</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
              {aquiferTierConfig.badge}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Groundwater Table:</span>
              <span className={`font-bold ${isStressed ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-teal-700 dark:text-emerald-400'}`}>
                {aquiferLiters.toLocaleString()} / {aquiferCapacity.toLocaleString()} L
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-teal-100 dark:bg-stone-800 overflow-hidden p-0.5 border border-teal-200/60 dark:border-stone-700">
              <div
                className={`h-full transition-all duration-300 rounded-full shadow-xs ${
                  isStressed ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400'
                }`}
                style={{ width: `${aquiferDepthPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-semibold">
              <span>Recharge: +8.0 L/min</span>
              <span>{isStressed ? '⚠️ Stressed (<25%)' : 'Nominal Table'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-teal-100 dark:border-stone-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => pumpAquiferToTower()}
              disabled={aquiferLiters < 50 || towerLiters >= towerCapacity}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-teal-500/10 hover:bg-teal-500/20 disabled:bg-stone-100 dark:bg-teal-600/20 dark:hover:bg-teal-600/40 dark:disabled:bg-stone-800/50 border border-teal-400/50 disabled:border-stone-300 dark:disabled:border-stone-700 text-teal-800 dark:text-teal-200 disabled:text-stone-400 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              Pump 50L &rarr; Tower
            </button>
            <button
              type="button"
              onClick={upgradeAquiferStorageTier}
              disabled={aquiferTier >= 5 || coins < (AQUIFER_STORAGE_TIERS[aquiferTier + 1]?.costCoins || 999999)}
              className="py-2 px-3 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-stone-100 dark:bg-amber-600/20 dark:hover:bg-amber-600/40 border border-amber-400/60 disabled:border-stone-300 text-amber-800 dark:text-amber-200 disabled:text-stone-400 cursor-pointer disabled:cursor-not-allowed"
              title={aquiferTier >= 5 ? 'Max Tier Reached' : `Upgrade Aquifer Depth (🪙${(AQUIFER_STORAGE_TIERS[aquiferTier + 1]?.costCoins || 0).toLocaleString()})`}
            >
              {aquiferTier >= 5 ? 'MAX' : `⬆️ T${aquiferTier + 1}`}
            </button>
          </div>
        </div>
      </div>

      {/* Flash Flood Emergency Spillway Card */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
        isFlashFloodActive
          ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 dark:border-rose-500 animate-pulse shadow-lg'
          : 'bg-white/90 dark:bg-stone-900/90 border-stone-200 dark:border-stone-800 shadow-md'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isFlashFloodActive ? '🚨' : '🛡️'}</span>
            <div>
              <div className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <span>Emergency Spillway Flood Gate</span>
                {isFlashFloodActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-bounce shadow-xs">
                    CRITICAL RIVER BREACH ({floodHazardRemainingSec}s)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Diverts 120 L/sec off-map away from crop beds to eliminate torrential crop rot and soil washing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleEmergencySpillway}
            className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
              isSpillwayOpen
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/30'
                : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700'
            }`}
          >
            {isSpillwayOpen ? 'Close Spillway Gates' : 'Open Emergency Spillway'}
          </button>
        </div>
      </div>

      {/* Atmospheric Telemetry & Interactive Weather Simulator Deck */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-sky-200/80 dark:border-stone-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌦️</span>
            <div>
              <div className="font-black text-sm text-stone-900 dark:text-white">Atmospheric Telemetry &amp; Micro-Climate</div>
              <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-semibold">Thermodynamic Evaporative Mass Balance</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-sky-800 dark:text-cyan-300 bg-sky-50 dark:bg-stone-950 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-stone-800">
              {atmos.temperatureC}°C • {atmos.relativeHumidityPct}% RH
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-1">
          {Object.entries(WEATHER_PROFILES).map(([key, prof]) => {
            const isSelected = activeWeatherId === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setHydrologyWeather(key as WeatherProfileId)}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-100 dark:bg-cyan-950/70 border-sky-500 dark:border-cyan-400 text-sky-950 dark:text-white shadow-sm ring-2 ring-sky-400/30 dark:ring-cyan-400/40 scale-102 font-bold'
                    : 'bg-stone-50 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-sky-300 dark:hover:border-stone-700 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <div className="text-xl mb-0.5">{prof.emoji}</div>
                <div className="text-[10px] font-bold truncate">{prof.name}</div>
                <div className="text-[9px] font-mono text-sky-700 dark:text-cyan-300">+{prof.precipitationInflowLPerMin}L/m</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Canal Tiers Network Architecture */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-sky-200/80 dark:border-stone-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏗️</span>
            <div>
              <div className="font-black text-sm text-stone-900 dark:text-white">Canal Network Engineering Tiers</div>
              <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-semibold">Substrate Seepage Suppression &amp; Conduit Pressure</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {([1, 2, 3, 4] as CanalTier[]).map((t) => {
            const cfg = CANAL_TIER_CONFIGS[t];
            if (!cfg) return null;
            const isCurrent = canalTier === t;
            const isNext = canalTier + 1 === t;
            return (
              <div
                key={t}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-sky-50 dark:bg-cyan-950/40 border-sky-400 dark:border-cyan-400 ring-2 ring-sky-300/40 dark:ring-cyan-400/40 shadow-sm'
                    : 'bg-stone-50/70 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{cfg.badge}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-600">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-black text-xs text-stone-900 dark:text-white mb-0.5">{cfg.name}</div>
                  <div className="text-[10px] text-stone-600 dark:text-stone-400 leading-tight mb-2">
                    {cfg.seepageLossFraction > 0
                      ? `${Math.round(cfg.seepageLossFraction * 100)}% seepage loss`
                      : '0% transit loss (impermeable)'}
                  </div>
                </div>

                <div>
                  {isNext && (
                    <button
                      type="button"
                      onClick={upgradeCanalTier}
                      className="w-full py-1.5 px-2 rounded-xl text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-sm transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>⬆️ Upgrade</span>
                      <span className="font-mono text-amber-100">🪙{cfg.costCoins.toLocaleString()}</span>
                    </button>
                  )}
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => setCanalTier(t)}
                      className="w-full py-1 rounded-xl text-[10px] font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 border border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 mt-1 cursor-pointer transition-colors"
                      title="Calibrate active tier"
                    >
                      Calibrate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Worker Shift Duties Integration Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-sky-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👷</span>
          <div>
            <div className="font-bold text-stone-900 dark:text-stone-200">Worker Shift Hydrology Duties</div>
            <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
              <span className="text-amber-700 dark:text-amber-300 font-semibold">Morning Field Hand:</span> Opens 06:00 sluice gates &amp; pumps aquifer if tower &lt; 200L.
              {' '}
              <span className="text-indigo-700 dark:text-indigo-300 font-semibold">Night Watch:</span> De-silts canal grates &amp; harvests +20L dew if cistern &lt; 50L.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={deployDewScreens}
          className="py-2 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/30 dark:hover:bg-indigo-600/50 border border-indigo-300 dark:border-indigo-400 text-indigo-800 dark:text-indigo-200 font-bold text-xs whitespace-nowrap transition-all cursor-pointer active:scale-95 shrink-0 shadow-xs"
        >
          Deploy Dew Screens (+20L)
        </button>
      </div>
    </div>
  );
}
