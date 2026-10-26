'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore, getStorageAvailableStock } from '@/game/store';
import { CANISTER_RECIPES, type CanisterTierId, type CompressorBatch, getCrateTotalCanisterCount, calculateCrateLiquidationValue } from '@/game/gasBottlingEngine';
import { CLIENT_DEFINITIONS } from '@/game/deliveryData';
import { playCashRegisterSound, playSumpValveSound } from '@/lib/soundEffects';

interface GasBottlingRefineryPanelProps {
  onNavigateToOrders?: () => void;
  onNavigateToGuide?: () => void;
}

export function GasBottlingRefineryPanel({ onNavigateToOrders, onNavigateToGuide }: GasBottlingRefineryPanelProps) {
  const {
    gasRefinery,
    silo,
    barn,
    hydrology,
    coins,
    orders = [],
    animals = [],
    startGasCompressorBatch,
    startAllGasCompressors,
    toggleGasAutomation,
    setGasAutomation,
    collectGasCompressorOutput,
    loadCanisterToShippingCrate,
    liquidateShippingCrate,
  } = useGameStore();

  const [now, setNow] = useState(Date.now());
  const [isCompressingAnim, setIsCompressingAnim] = useState(false);

  // Calculate live automatic herd slurry generation (L/min)
  const animalCount = (animals || []).length;
  const autoInflowPerMin = (animals || []).reduce((sum, a) => {
    const rate = a.species === 'cow' ? 2.5 : a.species === 'pig' ? 1.5 : a.species === 'sheep' ? 1.0 : 0.5;
    return sum + rate;
  }, 0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refinery = gasRefinery || {
    storedSlurryFeedstock: 120,
    maxSlurryCapacity: 2500,
    activeBatch: null,
    activeBatches: { co2_cylinder: null, oxygen_canister: null, nitrogen_dewar: null },
    outputRack: { co2_cylinder: 0, oxygen_canister: 0, nitrogen_dewar: 0 },
    dailyShippingCrate: { co2_cylinder: 0, oxygen_canister: 0, nitrogen_dewar: 0 },
    lastDailyLiquidationTimestamp: Date.now(),
    dailyCycleSeconds: 300,
    totalLifetimeExportCoins: 0,
    totalCanistersShipped: 0,
  };

  // Tri-chamber parallel active batches
  const activeBatches: Record<CanisterTierId, CompressorBatch | null> = {
    co2_cylinder: refinery.activeBatches?.co2_cylinder || (refinery.activeBatch?.canisterId === 'co2_cylinder' ? refinery.activeBatch : null),
    oxygen_canister: refinery.activeBatches?.oxygen_canister || (refinery.activeBatch?.canisterId === 'oxygen_canister' ? refinery.activeBatch : null),
    nitrogen_dewar: refinery.activeBatches?.nitrogen_dewar || (refinery.activeBatch?.canisterId === 'nitrogen_dewar' ? refinery.activeBatch : null),
  };

  const activeBatchesList = (Object.keys(activeBatches) as CanisterTierId[])
    .map((cid) => activeBatches[cid])
    .filter(Boolean) as CompressorBatch[];
  const activeCount = activeBatchesList.length;

  // Tri-chamber automated refinery workers
  const automatedGases: Record<CanisterTierId, boolean> = {
    co2_cylinder: true,
    nitrogen_dewar: true,
    oxygen_canister: false,
    ...(refinery.automatedGases || {}),
  };
  const autoWorkerCount = (Object.values(automatedGases) as boolean[]).filter(Boolean).length;
  const isWorkerSlurryActive = Boolean(refinery.isWorkerSlurryActive);

  // Next daily liquidation countdown
  const cycleMs = (refinery.dailyCycleSeconds || 300) * 1000;
  const lastHaul = refinery.lastDailyLiquidationTimestamp || now;
  const timeSinceLastHaul = now - lastHaul;
  const timeUntilNextHaul = Math.max(0, cycleMs - (timeSinceLastHaul % cycleMs));
  const nextHaulMins = Math.floor(timeUntilNextHaul / 60000);
  const nextHaulSecs = Math.floor((timeUntilNextHaul % 60000) / 1000);

  // Inventories for intake
  const slurryStock = Math.round(refinery.storedSlurryFeedstock || 0);
  const maxSlurry = refinery.maxSlurryCapacity || 2500;
  const chaffStock = (silo.chaff || 0) + (barn.chaff || 0);
  const waterStock = Math.round(hydrology?.towerLiters || 0);
  const biomassStock = (silo.peas || 0) + (silo.wheat || 0) + (silo.soybean || 0) + (silo.corn || 0);
  const fuelStock = (barn.thermal_scutes || 0) + (barn.thermal_solvent || 0) + (barn.fired_hardwood || 0);

  // Crate status
  const crate = refinery.dailyShippingCrate || { co2_cylinder: 0, oxygen_canister: 0, nitrogen_dewar: 0 };
  const crateCount = getCrateTotalCanisterCount(crate);
  const crateValue = calculateCrateLiquidationValue(crate);

  // Output rack status
  const rack = refinery.outputRack || { co2_cylinder: 0, oxygen_canister: 0, nitrogen_dewar: 0 };
  const totalRackCount = rack.co2_cylinder + rack.oxygen_canister + rack.nitrogen_dewar;

  // Active industrial contracts on notice board
  const industrialOrders = orders.filter(
    (o) =>
      o.clientId === 'brewmaster_klaus' ||
      o.clientId === 'dr_vanderberg' ||
      o.clientId === 'foundryman_torval' ||
      o.requiredItems?.some((it) => it.itemId === 'co2_cylinder' || it.itemId === 'oxygen_canister' || it.itemId === 'nitrogen_dewar')
  );

  const handleStartCraft = (canisterId: CanisterTierId) => {
    setIsCompressingAnim(true);
    setTimeout(() => setIsCompressingAnim(false), 600);
    startGasCompressorBatch(canisterId);
  };

  const handleStartAll = () => {
    setIsCompressingAnim(true);
    setTimeout(() => setIsCompressingAnim(false), 600);
    if (startAllGasCompressors) {
      startAllGasCompressors();
    }
  };

  const handleLoadAllToCrate = () => {
    let loaded = 0;
    if (rack.co2_cylinder > 0) {
      loadCanisterToShippingCrate('co2_cylinder', rack.co2_cylinder);
      loaded += rack.co2_cylinder;
    }
    if (rack.oxygen_canister > 0) {
      loadCanisterToShippingCrate('oxygen_canister', rack.oxygen_canister);
      loaded += rack.oxygen_canister;
    }
    if (rack.nitrogen_dewar > 0) {
      loadCanisterToShippingCrate('nitrogen_dewar', rack.nitrogen_dewar);
      loaded += rack.nitrogen_dewar;
    }
    if (loaded > 0) {
      playSumpValveSound();
    }
  };

  const handleImmediateDispatch = () => {
    if (crateCount <= 0) return;
    playCashRegisterSound();
    liquidateShippingCrate(true);
  };

  return (
    <div className="space-y-4">
      {/* Heavy Refinery Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-stone-900 to-amber-950/80 border border-amber-500/30 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl filter drop-shadow">🏭</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                  Gas Bottling &amp; Export Refinery
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest">
                    Industrial V2.0
                  </span>
                </h2>
                <p className="text-xs text-stone-300">
                  Heavy hydraulic gas compressor converts raw livestock slurry and crop chaff into high-value trade canisters.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-stone-900/80 border border-stone-700/60 rounded-xl px-4 py-2.5 backdrop-blur-sm self-stretch md:self-auto justify-between md:justify-start">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Lifetime Exports</span>
              <span className="text-base font-black text-amber-400 flex items-center gap-1">
                💰 {refinery.totalLifetimeExportCoins || 0} <span className="text-xs text-stone-400">Coins</span>
              </span>
            </div>
            <div className="w-px h-8 bg-stone-700" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">Bottles Shipped</span>
              <span className="text-base font-black text-cyan-400 flex items-center gap-1">
                📦 {refinery.totalCanistersShipped || 0} <span className="text-xs text-stone-400">units</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gas Refinery Guide Reference Bar */}
      <div className="bg-stone-900/60 rounded-xl border border-stone-800/80 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs shadow-sm">
        <div className="flex items-center gap-2 text-stone-300">
          <span className="text-base">📖</span>
          <span>Feedstock formulas, harvesting pipelines, and export logistics are available in the <strong>Guide</strong> page.</span>
        </div>
        {onNavigateToGuide && (
          <button
            onClick={onNavigateToGuide}
            className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1"
          >
            <span>Open Gas Guide</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Main Grid: Feedstocks & Compressor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Feedstock Intake Tanks */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛢️</span>
                <h3 className="text-sm font-black text-stone-200 uppercase tracking-wider">Intake Feedstocks</h3>
              </div>
              <span className="text-[10px] text-stone-400">Automated Pipeline</span>
            </div>

            {/* Raw Slurry Inflow Tank */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <span>💩</span> Raw Livestock Slurry
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {slurryStock}L / {maxSlurry}L
                </span>
              </div>
              <div className="w-full bg-stone-900 rounded-full h-2.5 overflow-hidden border border-stone-800 relative">
                <div
                  className="bg-gradient-to-r from-amber-700 to-yellow-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((slurryStock / maxSlurry) * 100))}%` }}
                />
              </div>

              {/* Governor Threshold Markers */}
              <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 border-b border-stone-800/60 pb-1">
                <span className={slurryStock < 500 ? 'text-red-400 font-bold' : ''}>🛑 Cutoff &lt;500L</span>
                <span className="text-stone-400">Buffer: 500L–2000L</span>
                <span className={slurryStock >= 2000 ? 'text-emerald-400 font-bold' : ''}>🟢 Start ≥2000L</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-0.5 flex-wrap gap-1">
                <span>
                  Governor:{' '}
                  {isWorkerSlurryActive ? (
                    <strong className="text-emerald-400">🟢 Workers Active (Down to 500L)</strong>
                  ) : (
                    <strong className="text-amber-400">⏳ Standby (Wait for 2,000L)</strong>
                  )}
                </span>
                {autoInflowPerMin > 0 ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    +{autoInflowPerMin.toFixed(1)} L/min ({animalCount} livestock)
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400/90 italic">
                    0 L/min (No livestock in pasture)
                  </span>
                )}
              </div>
            </div>

            {/* Dry Chaff Bundles */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <span>🌾</span> Dry Chaff &amp; Husks
                </span>
                <span className="text-xs font-mono font-bold text-stone-200">
                  {chaffStock} bundles
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Byproduct threshed during grain harvests (wheat, corn, soybean). Essential carbonaceous substrate for CO₂ bottling.
              </p>
            </div>

            {/* Pressurized Clean Water */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <span>💧</span> Gravity Tower Clean Water
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {waterStock}L
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Clean pressurized water piped from estate hydrology. Used to electrolyze Refined Oxygen Canisters.
              </p>
            </div>

            {/* Green Biomass / Algae */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <span>🌱</span> Green Biomass / Algae
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {biomassStock} units
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Fresh legume, pea, or cereal plant leaves harvested from farm plots.
              </p>
            </div>

            {/* Thermal Fuel */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <span>🔥</span> Thermal Fuel Charge
                </span>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {fuelStock > 0 ? `${fuelStock} charges` : '15 Coins buy-in'}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Thermal scutes, fired hardwood, or preheated emergency igniter charge for cryogenic Liquid Nitrogen distillation.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Heavy Hydraulic Compressor & Output Racks */}
        <div className="lg:col-span-8 space-y-4">
          {/* Hydraulic Compressor Machine Station */}
          <div className="bg-gradient-to-b from-stone-900 to-stone-950 rounded-2xl border-2 border-amber-600/40 p-5 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg ${isCompressingAnim ? 'scale-110 animate-bounce' : ''}`}>
                  ⚙️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                    Tri-Chamber Heavy Gas Compressor
                    {activeCount > 0 ? (
                      <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full animate-pulse">
                        {activeCount} CHAMBER{activeCount > 1 ? 'S' : ''} ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                        3 Parallel Chambers Ready
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Parallel hydraulic chambers • All 3 gases can be bottled simultaneously
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-stone-400 font-mono block">Compressor State</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${activeCount > 0 ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'}`}>
                  {activeCount === 3 ? '⚡ 3/3 Chambers Full Speed' : activeCount > 0 ? `⚡ ${activeCount}/3 Chambers Compressing` : '🟢 3 Chambers Ready'}
                </span>
              </div>
            </div>

            {/* Tri-Chamber Simultaneous Action & Labor Controls Banner */}
            <div className="bg-stone-950/90 rounded-xl p-3 border border-stone-800/80 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👷</span>
                  <div>
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                      Refinery Workforce &amp; Chamber Automation
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                        {autoWorkerCount}/3 Automated
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isWorkerSlurryActive
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}>
                        {isWorkerSlurryActive
                          ? `🟢 Governor Active (≥2,000L Triggered • Runs to <500L)`
                          : `🛡️ Governor Standby (${slurryStock}L / 2,000L to Start)`}
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Automated workers engage when slurry reaches <strong>2,000L</strong> and stop automatically below <strong>500L</strong> to protect estate slurry reserves.
                    </p>
                  </div>
                </div>

                {/* Quick Workforce Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setGasAutomation('co2_cylinder', true);
                      setGasAutomation('nitrogen_dewar', true);
                      setGasAutomation('oxygen_canister', false);
                    }}
                    className="px-2.5 py-1 rounded-md text-[10px] font-black bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                    title="Automate CO2 & N2, keep Oxygen manual"
                  >
                    ⚙️ CO₂ &amp; N₂ Auto (O₂ Manual)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGasAutomation('co2_cylinder', true);
                      setGasAutomation('nitrogen_dewar', true);
                      setGasAutomation('oxygen_canister', true);
                    }}
                    className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all cursor-pointer"
                  >
                    ⚡ Automate All 3
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGasAutomation('co2_cylinder', false);
                      setGasAutomation('nitrogen_dewar', false);
                      setGasAutomation('oxygen_canister', false);
                    }}
                    className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all cursor-pointer"
                  >
                    ✋ Manual All 3
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAll}
                    disabled={activeCount === 3}
                    className={`px-3 py-1 rounded-md text-[10px] font-black transition-all flex items-center gap-1 shadow-md ${
                      activeCount === 3
                        ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                        : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 border border-amber-400 shadow-amber-500/20 active:scale-95 cursor-pointer'
                    }`}
                  >
                    <span>⚡ Bottle All In Parallel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Canister Recipes Grid (Independent Parallel Chambers) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {(Object.keys(CANISTER_RECIPES) as CanisterTierId[]).map((canisterId) => {
                const recipe = CANISTER_RECIPES[canisterId];
                const thisBatch = activeBatches[canisterId];
                const isAutomated = Boolean(automatedGases[canisterId]);
                let thisProgressPct = 0;
                let thisRemainingSec = 0;
                if (thisBatch) {
                  const elapsed = Math.max(0, (now - thisBatch.startedAt) / 1000);
                  thisProgressPct = Math.min(100, Math.round((elapsed / thisBatch.durationSec) * 100));
                  thisRemainingSec = Math.max(0, Math.ceil(thisBatch.durationSec - elapsed));
                }

                // Requirement checks
                let canCraft = true;
                let missingReason = '';

                if (canisterId === 'co2_cylinder') {
                  if (slurryStock < 40) {
                    canCraft = false;
                    missingReason = 'Need 40L Slurry';
                  } else if (chaffStock < 10) {
                    canCraft = false;
                    missingReason = 'Need 10 Chaff';
                  }
                } else if (canisterId === 'oxygen_canister') {
                  if (waterStock < 30) {
                    canCraft = false;
                    missingReason = 'Need 30L Water';
                  } else if (biomassStock < 5) {
                    canCraft = false;
                    missingReason = 'Need 5 Biomass';
                  }
                } else if (canisterId === 'nitrogen_dewar') {
                  if (slurryStock < 50) {
                    canCraft = false;
                    missingReason = 'Need 50L Slurry';
                  } else if (fuelStock <= 0 && coins < 15) {
                    canCraft = false;
                    missingReason = 'Need Fuel or 15c';
                  }
                }

                return (
                  <div
                    key={canisterId}
                    className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between space-y-3 ${
                      canisterId === 'co2_cylinder'
                        ? 'bg-gradient-to-b from-stone-900 to-amber-950/20 border-amber-500/30'
                        : canisterId === 'oxygen_canister'
                        ? 'bg-gradient-to-b from-stone-900 to-cyan-950/20 border-cyan-500/30'
                        : 'bg-gradient-to-b from-stone-900 to-indigo-950/20 border-indigo-500/30'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{recipe.emoji}</span>
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          💰 {recipe.baseExportCoins}c
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{recipe.name}</h4>
                        <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
                          {recipe.description}
                        </p>
                      </div>

                      {/* Worker Assignment Card Header */}
                      <div className="bg-stone-950/80 rounded-lg p-2 border border-stone-800 flex items-center justify-between gap-1.5 shadow-sm">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-base">{isAutomated ? '👷' : '✋'}</span>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black block leading-tight text-stone-200">
                              {isAutomated ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Automated Worker
                                </span>
                              ) : (
                                <span className="text-amber-400/90">Manual Mode</span>
                              )}
                            </span>
                            <span className="text-[9px] text-stone-400 block truncate">
                              {isAutomated
                                ? (thisBatch
                                    ? '⚡ Compressing auto-batch'
                                    : !isWorkerSlurryActive
                                    ? `🛡️ Standby: Waiting for 2,000L Slurry (${slurryStock}L/2,000L)`
                                    : canCraft
                                    ? '🟢 Ready for auto-stroke'
                                    : `⏳ Standby (${missingReason})`)
                                : 'Awaiting your manual click'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleGasAutomation(canisterId)}
                          className={`text-[9px] font-black px-2 py-1 rounded transition-all cursor-pointer whitespace-nowrap ${
                            isAutomated
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              : 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700'
                          }`}
                        >
                          {isAutomated ? 'Set Manual' : 'Assign Worker'}
                        </button>
                      </div>
                    </div>

                    {/* Active Chamber Progress Bar */}
                    {thisBatch && (
                      <div className="bg-stone-950/80 rounded-lg p-2 border border-amber-500/30 space-y-1.5 shadow-inner">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-amber-300 font-bold flex items-center gap-1">
                            <span className="animate-spin text-xs">⚙️</span>
                            {isAutomated ? 'Worker Compressing' : 'Chamber Compressing'}
                          </span>
                          <span className="text-white font-bold">{thisRemainingSec}s</span>
                        </div>
                        <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${thisProgressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 border-t border-stone-800/80 pt-2">
                      <div className="space-y-1 text-[10px] text-stone-300">
                        {canisterId === 'co2_cylinder' && (
                          <>
                            <div className="flex justify-between">
                              <span>Raw Slurry:</span>
                              <span className={slurryStock >= 40 ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>
                                {slurryStock}/40L
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dry Chaff:</span>
                              <span className={chaffStock >= 10 ? 'text-stone-200 font-bold' : 'text-red-400 font-bold'}>
                                {chaffStock}/10
                              </span>
                            </div>
                            <div className="text-[9px] text-amber-300/80 bg-amber-950/40 p-1 rounded border border-amber-500/20">
                              📍 <strong>Source:</strong> Animals Tab + Wheat/Corn harvests
                            </div>
                          </>
                        )}
                        {canisterId === 'oxygen_canister' && (
                          <>
                            <div className="flex justify-between">
                              <span>Tower Water:</span>
                              <span className={waterStock >= 30 ? 'text-cyan-400 font-bold' : 'text-red-400 font-bold'}>
                                {waterStock}/30L
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Green Biomass:</span>
                              <span className={biomassStock >= 5 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                {biomassStock}/5
                              </span>
                            </div>
                            <div className="text-[9px] text-cyan-300/80 bg-cyan-950/40 p-1 rounded border border-cyan-500/20">
                              📍 <strong>Source:</strong> Hydrology Tower + Peas/Soy harvests
                            </div>
                          </>
                        )}
                        {canisterId === 'nitrogen_dewar' && (
                          <>
                            <div className="flex justify-between">
                              <span>Conc. Slurry:</span>
                              <span className={slurryStock >= 50 ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>
                                {slurryStock}/50L
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Thermal Fuel:</span>
                              <span className={fuelStock > 0 || coins >= 15 ? 'text-rose-400 font-bold' : 'text-red-400 font-bold'}>
                                {fuelStock > 0 ? `${fuelStock} Fuel` : '15 Coins'}
                              </span>
                            </div>
                            <div className="text-[9px] text-indigo-300/80 bg-indigo-950/40 p-1 rounded border border-indigo-500/20">
                              📍 <strong>Source:</strong> Cattle/Swine waste + Barn fuel (or 15c charge)
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartCraft(canisterId)}
                        disabled={Boolean(thisBatch) || !canCraft || isAutomated}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${
                          Boolean(thisBatch)
                            ? 'bg-stone-800 text-amber-300 border border-amber-500/30 opacity-90 cursor-not-allowed'
                            : isAutomated
                            ? !isWorkerSlurryActive
                              ? 'bg-stone-800/80 text-amber-300/90 border border-amber-500/30 cursor-default'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 cursor-default'
                            : !canCraft
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                            : canisterId === 'co2_cylinder'
                            ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 active:scale-95'
                            : canisterId === 'oxygen_canister'
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
                        }`}
                      >
                        {thisBatch ? (
                          <span className="animate-pulse">⚡ Compressing ({thisRemainingSec}s)...</span>
                        ) : isAutomated ? (
                          !isWorkerSlurryActive ? (
                            <span>🛡️ Worker Standby (Slurry &lt; 2,000L)</span>
                          ) : (
                            <span>👷 Worker Operating (Auto-Queue)</span>
                          )
                        ) : !canCraft ? (
                          <span>{missingReason}</span>
                        ) : (
                          <span>Compress &amp; Bottle (Manual)</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Laboratory Output Racks & Estate Shipping Crate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Output Storage Rack */}
            <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 space-y-3 shadow-lg flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🧪</span>
                    <h3 className="text-xs font-black text-stone-200 uppercase tracking-wider">
                      Laboratory Output Racks
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {totalRackCount} Ready
                  </span>
                </div>

                <div className="space-y-2">
                  {/* CO2 Racks */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/70 border border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💨</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200 block">CO₂ Cylinders</span>
                        <span className="text-[10px] text-stone-400">Value: 45c each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-amber-400">{rack.co2_cylinder}</span>
                      <button
                        type="button"
                        onClick={() => loadCanisterToShippingCrate('co2_cylinder', 1)}
                        disabled={rack.co2_cylinder <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Load 1 into Estate Export Crate"
                      >
                        Load 📦
                      </button>
                      <button
                        type="button"
                        onClick={() => collectGasCompressorOutput()}
                        disabled={rack.co2_cylinder <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Collect to Barn inventory"
                      >
                        Barn 🎒
                      </button>
                    </div>
                  </div>

                  {/* O2 Racks */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/70 border border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🫧</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200 block">Oxygen Canisters</span>
                        <span className="text-[10px] text-stone-400">Value: 65c each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-cyan-400">{rack.oxygen_canister}</span>
                      <button
                        type="button"
                        onClick={() => loadCanisterToShippingCrate('oxygen_canister', 1)}
                        disabled={rack.oxygen_canister <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Load 1 into Estate Export Crate"
                      >
                        Load 📦
                      </button>
                      <button
                        type="button"
                        onClick={() => collectGasCompressorOutput()}
                        disabled={rack.oxygen_canister <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Collect to Barn inventory"
                      >
                        Barn 🎒
                      </button>
                    </div>
                  </div>

                  {/* N2 Racks */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/70 border border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">❄️</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200 block">Nitrogen Dewars</span>
                        <span className="text-[10px] text-stone-400">Value: 110c each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-indigo-400">{rack.nitrogen_dewar}</span>
                      <button
                        type="button"
                        onClick={() => loadCanisterToShippingCrate('nitrogen_dewar', 1)}
                        disabled={rack.nitrogen_dewar <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Load 1 into Estate Export Crate"
                      >
                        Load 📦
                      </button>
                      <button
                        type="button"
                        onClick={() => collectGasCompressorOutput()}
                        disabled={rack.nitrogen_dewar <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Collect to Barn inventory"
                      >
                        Barn 🎒
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLoadAllToCrate}
                disabled={totalRackCount <= 0}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <span>📦</span> Stage All Rack Canisters to Crate ({totalRackCount})
              </button>
            </div>

            {/* Estate Shipping Crate & Loading Dock */}
            <div className="bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 rounded-2xl border-2 border-amber-500/40 p-4 space-y-3 shadow-xl flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚚</span>
                    <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Estate Export Crate &amp; Gate Dock
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    Cycle: {nextHaulMins}m {nextHaulSecs}s
                  </span>
                </div>

                <div className="bg-stone-950/80 rounded-xl p-3 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-300">Staged for Export:</span>
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {crateCount} Canisters
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-stone-900 border border-stone-800">
                      <span className="text-stone-400 block">💨 CO₂</span>
                      <span className="text-amber-300 font-bold">{crate.co2_cylinder}</span>
                    </div>
                    <div className="p-1.5 rounded bg-stone-900 border border-stone-800">
                      <span className="text-stone-400 block">🫧 O₂</span>
                      <span className="text-cyan-300 font-bold">{crate.oxygen_canister}</span>
                    </div>
                    <div className="p-1.5 rounded bg-stone-900 border border-stone-800">
                      <span className="text-stone-400 block">❄️ N₂</span>
                      <span className="text-indigo-300 font-bold">{crate.nitrogen_dewar}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-800">
                    <span className="text-xs font-bold text-stone-400">Projected Value:</span>
                    <span className="text-base font-black text-emerald-400 flex items-center gap-1 font-mono">
                      💰 +{crateValue} <span className="text-xs text-stone-400">Coins</span>
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-stone-400 leading-relaxed">
                  Cargo liquidates automatically into Coins at the end of each daily cycle, or dispatch immediately via the gate transport cart.
                </p>
              </div>

              <button
                type="button"
                onClick={handleImmediateDispatch}
                disabled={crateCount <= 0}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <span>🚚</span> Dispatch Immediate Freight (+{crateValue} Coins)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* High-Yield Industrial Trade Contracts Highlight */}
      <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📜</span>
            <h3 className="text-xs font-black text-stone-200 uppercase tracking-wider">
              High-Yield Industrial Contracts ({industrialOrders.length} Available)
            </h3>
          </div>
          {onNavigateToOrders && (
            <button
              type="button"
              onClick={onNavigateToOrders}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              Open Town Notice Board →
            </button>
          )}
        </div>

        {industrialOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {industrialOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-stone-950/70 border border-stone-800 rounded-xl p-3 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300">
                      {CLIENT_DEFINITIONS[ord.clientId]?.name || 'Industrial Guild'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                      +{ord.rewards.coins} Coins
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5 italic">
                    &ldquo;{CLIENT_DEFINITIONS[ord.clientId]?.quote || 'Industrial canister requisition order.'}&rdquo;
                  </p>
                </div>

                <div className="border-t border-stone-800 pt-2 space-y-1">
                  <div className="text-[10px] text-stone-300 font-bold">Requirements:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {ord.requiredItems?.map((it) => (
                      <span
                        key={it.itemId}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300"
                      >
                        {it.quantity}x {it.name || it.itemId.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-stone-950/50 rounded-xl p-3 text-center text-xs text-stone-400">
            No active industrial canister orders right now. Check back at the Town Notice Board during the next cycle!
          </div>
        )}
      </div>
    </div>
  );
}
