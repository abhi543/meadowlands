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
    barn,
  } = useGameStore();

  const [customShutoff, setCustomShutoff] = useState(hydrology?.autoShutoffMoisture ?? 75);

  const hydro = hydrology;
  const canalTier = (hydro?.canalTier || 1) as CanalTier;
  const tierConfig = CANAL_TIER_CONFIGS[canalTier];

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
  const siphonInBag = barn?.emergency_siphon_valve || 0;

  const handleShutoffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCustomShutoff(val);
    setAutoShutoffMoisture(val);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 text-stone-100">
      {/* Page Header Ribbon */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-950 via-cyan-950 to-stone-900 border border-cyan-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-600/30 border border-cyan-300/40 shrink-0">
            💧
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Hydrological Sluice &amp; Canal Network
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {tierConfig.badge}
              </span>
              {isRainbow && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-pink-500 via-amber-400 to-teal-400 text-stone-950 animate-pulse shadow-sm">
                  🌈 Rainbow Active: 0% Evaporation
                </span>
              )}
            </div>
            <p className="text-xs text-cyan-200/80 mt-1">
              Real-time Fluid Dynamics • Gravity-Fed Irrigation • Mass Conservation • Aquifer Siphon Protection
            </p>
          </div>
        </div>

        {/* Quick telemetry indicators */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-cyan-500/30 flex items-center gap-1.5 font-mono">
            <span>🌧️</span>
            <span className="text-stone-300">Cistern:</span>
            <span className="font-bold text-cyan-300">{cisternPct}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-cyan-500/30 flex items-center gap-1.5 font-mono">
            <span>🗼</span>
            <span className="text-stone-300">Tower:</span>
            <span className="font-bold text-cyan-300">{towerPct}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-cyan-500/30 flex items-center gap-1.5 font-mono">
            <span>🚰</span>
            <span className="text-stone-300">Aquifer:</span>
            <span className={`font-bold ${isStressed ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
              {aquiferDepthPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Gravity Tower Hydraulic Fail-Safe Status & Estimator Widget */}
      <div>
        <GravityTowerWidget />
      </div>

      {/* Dedicated Emergency Siphon Float Valve Quick Install Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-950/90 via-cyan-950/70 to-stone-900 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-2xl shrink-0">
            🚰
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-cyan-100 uppercase tracking-wide">
                Emergency Aquifer Siphon Float Valve
              </span>
              {hasEmergencySiphon ? (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 font-bold">
                  ✅ Armed &amp; Guarding Tower (≤80L)
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/60 font-bold animate-pulse">
                  ⚠️ Not Installed
                </span>
              )}
            </div>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              Automatically draws 2.0 L/s groundwater from Deep Aquifer to keep Gravity Tower pressurized whenever volume drops ≤ 80L (refilling up to 200L).
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {hasEmergencySiphon ? (
            <div className="text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-4 py-2 rounded-xl flex items-center gap-2">
              <span>🛡️</span>
              <span>Active Protection</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => installEmergencySiphonValve()}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-stone-950 shadow-md border border-cyan-200 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
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
        <div className="md:col-span-2 rounded-3xl bg-stone-900/90 border border-stone-800 p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block">
                CANAL DISCHARGE VALVE
              </span>
              <span className="text-base font-black text-white">
                Master Gravity Sluice Gate
              </span>
            </div>
            <div className="flex items-center gap-2">
              {gatesOpen ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  DISCHARGING WATER
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  GATES CLOSED
                </span>
              )}
            </div>
          </div>

          {/* Live Flow Meter Visual */}
          <div className="my-3 p-4 rounded-2xl bg-black/40 border border-stone-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">
                {gatesOpen ? '🌊' : '🛑'}
              </span>
              <div>
                <div className="text-xs text-stone-400 font-medium">Flow Throughput</div>
                <div className="text-base sm:text-lg font-mono font-extrabold text-cyan-300">
                  {isFlashFloodActive && !isSpillwayOpen ? (
                    <span className="text-rose-400 animate-pulse">RIVER BREACH OVERFLOW (+120 L/sec unchecked)</span>
                  ) : isSpillwayOpen ? (
                    <span className="text-teal-300 animate-pulse">Spillway Diverting 120 L/sec Off-Map (-10%/sec Purge)</span>
                  ) : gatesOpen ? (
                    `Discharging ${liveDischarge} Liters/sec to Plots 01–${unlockedPlots}`
                  ) : (
                    'Static Canal Head (0 L/sec)'
                  )}
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
            return (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => toggleSluiceGates()}
                  disabled={!gatesOpen && !gateCheck.canOpen}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 ${
                    gatesOpen
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/40'
                      : !gateCheck.canOpen
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-cyan-900/40'
                  }`}
                >
                  <span>{gatesOpen ? '🛑 Lock Sluice Gates (Stop Flow)' : '🌊 Open Sluice Gates (Feed Canals)'}</span>
                </button>
                {!gatesOpen && !gateCheck.canOpen && gateCheck.reason && (
                  <p className="text-[11px] text-amber-400 text-center font-medium">
                    ⚠️ {gateCheck.reason}
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Moisture Zones & Auto-Shutoff Gauge */}
        <div className="rounded-3xl bg-stone-900/90 border border-stone-800 p-5 flex flex-col justify-between shadow-md">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold mb-1">
              AUTOMATIC SHUTOFF
            </div>
            <div className="text-sm font-black text-white mb-2">Soil Saturation Limiter</div>
            <p className="text-xs text-stone-400 mb-3">
              Gates shut automatically once soil moisture hits the calibrated threshold to avoid root rot.
            </p>

            <div className="p-3 rounded-2xl bg-black/40 border border-stone-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-300 font-medium">Shutoff Threshold:</span>
                <span className="font-mono font-extrabold text-cyan-300 text-sm">{customShutoff}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={customShutoff}
                onChange={handleShutoffChange}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>50% (Lean)</span>
                <span>75% (Optimum)</span>
                <span>95% (Near Saturation)</span>
              </div>
            </div>
          </div>

          {/* Quick Canal Maintenance Actions */}
          <div className="space-y-1.5 mt-3 pt-3 border-t border-stone-800">
            <div className="text-[10px] font-mono text-stone-400 uppercase font-bold">Maintenance:</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={clearSedimentInLine}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 ${
                  hasSediment
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200 animate-pulse'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>🧹 Clear Sediment</span>
              </button>
              <button
                type="button"
                onClick={deSiltCanals}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 ${
                  isClogged
                    ? 'bg-rose-600/30 border-rose-500 text-rose-200 animate-pulse'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>🌿 De-Silt Grates</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tri-Reservoir Hydraulic Distribution Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reservoir 1: Surface Rain Cistern */}
        <div className="rounded-3xl bg-stone-900/90 border border-stone-800 p-4 space-y-3 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌧️</span>
              <div>
                <div className="font-black text-sm text-white">Rain Catchment Cistern</div>
                <div className="text-[10px] text-stone-400 font-mono">Surface Atmospheric Runoff</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
              {cisternTierConfig.badge}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-400">Stored Volume:</span>
              <span className="font-bold text-cyan-300">{cisternLiters.toLocaleString()} / {cisternMax.toLocaleString()} L</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${cisternPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>Inflow: +{atmos.precipitationInflowLPerMin} L/min</span>
              <span>{cisternPct}% Full</span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => transferCisternToTower()}
              disabled={cisternLiters < 100 || towerLiters >= towerCapacity}
              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-cyan-600/30 hover:bg-cyan-600/50 disabled:bg-stone-800/50 border border-cyan-500/50 disabled:border-stone-700 text-cyan-200 disabled:text-stone-500 transition-all active:scale-95"
            >
              Transfer 100L &rarr; Tower
            </button>
            <button
              type="button"
              onClick={upgradeCisternStorageTier}
              disabled={cisternTier >= 5 || coins < (cisternTierConfig.costCoins || 0)}
              className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-amber-600/30 hover:bg-amber-600/50 disabled:bg-stone-800/50 border border-amber-500/50 disabled:border-stone-700 text-amber-200 disabled:text-stone-500"
              title={`Upgrade Cistern (🪙${(cisternTierConfig.costCoins || 0).toLocaleString()})`}
            >
              ⬆️ T{cisternTier + 1}
            </button>
          </div>
        </div>

        {/* Reservoir 2: Elevated Gravity Tower */}
        <div className="rounded-3xl bg-stone-900/90 border border-stone-800 p-4 space-y-3 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🗼</span>
              <div>
                <div className="font-black text-sm text-white">Elevated Gravity Tower</div>
                <div className="text-[10px] text-stone-400 font-mono">Pressurized Hydraulic Head</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
              {towerTierConfig.badge}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-400">Active Storage:</span>
              <span className="font-bold text-cyan-300">{towerLiters.toLocaleString()} / {towerCapacity.toLocaleString()} L</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-cyan-500 transition-all duration-300"
                style={{ width: `${towerPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>Surge Inflow: +{towerTierConfig.surgeLps} L/s</span>
              <span>{towerPct}% Head</span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800 flex items-center gap-2">
            <button
              type="button"
              onClick={upgradeTowerStorageTier}
              disabled={towerTier >= 5 || coins < (towerTierConfig.costCoins || 0)}
              className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-amber-600/30 hover:bg-amber-600/50 disabled:bg-stone-800/50 border border-amber-500/50 disabled:border-stone-700 text-amber-200 disabled:text-stone-500 transition-all active:scale-95"
            >
              ⬆️ Upgrade Tower Capacity (🪙{(towerTierConfig.costCoins || 0).toLocaleString()})
            </button>
          </div>
        </div>

        {/* Reservoir 3: Deep Subterranean Aquifer */}
        <div className="rounded-3xl bg-stone-900/90 border border-stone-800 p-4 space-y-3 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🚰</span>
              <div>
                <div className="font-black text-sm text-white">Deep Groundwater Aquifer</div>
                <div className="text-[10px] text-stone-400 font-mono">Subsoil Natural Table</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
              {aquiferTierConfig.badge}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-400">Groundwater Depth:</span>
              <span className={`font-bold ${isStressed ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {aquiferLiters.toLocaleString()} / {aquiferCapacity.toLocaleString()} L
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isStressed ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${aquiferDepthPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>Recharge: +8.0 L/min</span>
              <span>{isStressed ? '⚠️ Stressed (<25%)' : 'Nominal Table'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => pumpAquiferToTower()}
              disabled={aquiferLiters < 50 || towerLiters >= towerCapacity}
              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-teal-600/30 hover:bg-teal-600/50 disabled:bg-stone-800/50 border border-teal-500/50 disabled:border-stone-700 text-teal-200 disabled:text-stone-500 transition-all active:scale-95"
            >
              Pump 50L &rarr; Tower
            </button>
            <button
              type="button"
              onClick={upgradeAquiferStorageTier}
              disabled={aquiferTier >= 5 || coins < (aquiferTierConfig.costCoins || 0)}
              className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-amber-600/30 hover:bg-amber-600/50 disabled:bg-stone-800/50 border border-amber-500/50 disabled:border-stone-700 text-amber-200 disabled:text-stone-500"
              title={`Upgrade Aquifer Depth (🪙${(aquiferTierConfig.costCoins || 0).toLocaleString()})`}
            >
              ⬆️ T{aquiferTier + 1}
            </button>
          </div>
        </div>
      </div>

      {/* Flash Flood Emergency Spillway Card */}
      <div className={`p-4 rounded-3xl border transition-all ${
        isFlashFloodActive
          ? 'bg-rose-950/80 border-rose-500 animate-pulse'
          : 'bg-stone-900/60 border-stone-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isFlashFloodActive ? '🚨' : '🛡️'}</span>
            <div>
              <div className="font-black text-sm text-white flex items-center gap-2">
                <span>Emergency Spillway Flood Gate</span>
                {isFlashFloodActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-bounce">
                    CRITICAL RIVER BREACH ({floodHazardRemainingSec}s)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Diverts 120 L/sec off-map away from crop beds to eliminate torrential crop rot and soil washing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleEmergencySpillway}
            className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap ${
              isSpillwayOpen
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/30'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
            }`}
          >
            {isSpillwayOpen ? 'Close Spillway Gates' : 'Open Emergency Spillway'}
          </button>
        </div>
      </div>

      {/* Atmospheric Telemetry & Interactive Weather Simulator Deck */}
      <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌦️</span>
            <div>
              <div className="font-black text-sm text-white">Atmospheric Telemetry &amp; Micro-Climate</div>
              <div className="text-[10px] text-stone-400 font-mono">Thermodynamic Evaporative Mass Balance</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-cyan-300">{atmos.temperatureC}°C • {atmos.relativeHumidityPct}% RH</span>
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
                className={`p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-600/40 border-cyan-400 text-white shadow-sm shadow-cyan-500/30 scale-102'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                <div className="text-xl mb-0.5">{prof.emoji}</div>
                <div className="text-[10px] font-bold truncate">{prof.name}</div>
                <div className="text-[9px] font-mono text-cyan-300/80">+{prof.precipitationInflowLPerMin}L/m</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Canal Tiers Network Architecture */}
      <div className="p-4 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏗️</span>
            <div>
              <div className="font-black text-sm text-white">Canal Network Engineering Tiers</div>
              <div className="text-[10px] text-stone-400 font-mono">Substrate Seepage Suppression &amp; Conduit Pressure</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {([1, 2, 3, 4, 5] as CanalTier[]).map((t) => {
            const cfg = CANAL_TIER_CONFIGS[t];
            const isCurrent = canalTier === t;
            const isNext = canalTier + 1 === t;
            return (
              <div
                key={t}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-400 text-white ring-1 ring-cyan-400/50'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{cfg.badge}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
                    )}
                  </div>
                  <div className="font-black text-xs text-white mb-0.5">{cfg.name}</div>
                  <div className="text-[10px] text-stone-400 leading-tight mb-2">
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
                      className="w-full py-1.5 px-2 rounded-xl text-[10px] font-black bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/60 text-amber-200 transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>⬆️ Upgrade</span>
                      <span className="font-mono text-amber-300">🪙{cfg.costCoins.toLocaleString()}</span>
                    </button>
                  )}
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => setCanalTier(t)}
                      className="w-full py-1 rounded-xl text-[10px] font-mono text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700 mt-1 cursor-pointer"
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
      <div className="p-4 rounded-3xl bg-stone-900/60 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👷</span>
          <div>
            <div className="font-bold text-stone-200">Worker Shift Hydrology Duties</div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              <span className="text-amber-300 font-semibold">Morning Field Hand:</span> Opens 06:00 sluice gates &amp; pumps aquifer if tower &lt; 200L.
              {' '}
              <span className="text-indigo-300 font-semibold">Night Watch:</span> De-silts canal grates &amp; harvests +20L dew if cistern &lt; 50L.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={deployDewScreens}
          className="py-2 px-4 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400 text-indigo-200 font-bold text-xs whitespace-nowrap transition-all cursor-pointer active:scale-95 shrink-0"
        >
          Deploy Dew Screens (+20L)
        </button>
      </div>
    </div>
  );
}
