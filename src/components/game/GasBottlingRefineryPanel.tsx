'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore, getStorageAvailableStock } from '@/game/store';
import { CANISTER_RECIPES, type CanisterTierId, type CompressorBatch, getCrateTotalCanisterCount, calculateCrateLiquidationValue } from '@/game/gasBottlingEngine';
import { CLIENT_DEFINITIONS } from '@/game/deliveryData';
import { playCashRegisterSound, playSumpValveSound } from '@/lib/soundEffects';
import { getCircadianClock } from '@/game/shiftEngine';

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
    prehistoricSanctuary,
    farmEpochStart = 0,
    startGasCompressorBatch,
    startAllGasCompressors,
    toggleGasAutomation,
    setGasAutomation,
    automateAllTierGas,
    collectGasCompressorOutput,
    loadCanisterToShippingCrate,
    liquidateShippingCrate,
    buyRefineryFeedstock,
  } = useGameStore();

  const [now, setNow] = useState(Date.now());
  const [isCompressingAnim, setIsCompressingAnim] = useState(false);
  const [activeTier, setActiveTier] = useState<'primary' | 'advanced'>('primary');

  const clock = getCircadianClock(now, farmEpochStart || now);
  const isNight = clock.currentPeriod === 'night';

  // Calculate live automatic herd & sanctuary slurry generation (L/min)
  // Excludes retired elder livestock (cyclesRemaining <= 0) and pauses at night when herd is asleep
  const allAnimals = animals || [];
  const activeAnimals = allAnimals.filter(
    (a) => !((a.cyclesRemaining !== undefined && a.cyclesRemaining <= 0) || a.age === 'elder')
  );
  const elderAnimalCount = allAnimals.length - activeAnimals.length;
  const activeAnimalCount = activeAnimals.length;

  const domesticInflowPerMin = activeAnimals.reduce((sum, a) => {
    const rate = a.species === 'cow' ? 2.5 : a.species === 'pig' ? 1.5 : a.species === 'sheep' ? 1.0 : 0.5;
    return sum + rate;
  }, 0);

  // Prehistoric Sanctuary Mega-Fauna: +5.0 L/min per nourished specimen piped via Primeval Sluice
  const enclosures = Object.values(prehistoricSanctuary?.enclosures || {});
  const activeEnclosures = enclosures.filter((e) => (e.specimenCount || 0) > 0 && !e.isStarving);
  const totalSanctuaryCreatures = activeEnclosures.reduce((sum, e) => sum + (e.specimenCount || 0), 0);
  const starvingEnclosureCount = enclosures.filter((e) => (e.specimenCount || 0) > 0 && e.isStarving).length;
  const sanctuaryInflowPerMin = totalSanctuaryCreatures * 5.0;

  const daytimeInflowPerMin = domesticInflowPerMin + sanctuaryInflowPerMin;
  const autoInflowPerMin = isNight ? 0 : daytimeInflowPerMin;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refinery = gasRefinery || {
    storedSlurryFeedstock: 120,
    maxSlurryCapacity: 2500,
    cullBiomassStock: 30,
    dynamoPowerKWh: 120,
    maxDynamoPowerKWh: 500,
    rawSulfurDust: 30,
    boneMealBags: 20,
    activeBatch: null,
    activeBatches: {
      co2_cylinder: null,
      oxygen_canister: null,
      nitrogen_dewar: null,
      ethylene_cylinder: null,
      ozone_canister: null,
      sulfur_dioxide_flask: null,
      phosphine_bomb: null,
    },
    outputRack: {
      co2_cylinder: 0,
      oxygen_canister: 0,
      nitrogen_dewar: 0,
      ethylene_cylinder: 0,
      ozone_canister: 0,
      sulfur_dioxide_flask: 0,
      phosphine_bomb: 0,
    },
    dailyShippingCrate: {
      co2_cylinder: 0,
      oxygen_canister: 0,
      nitrogen_dewar: 0,
      ethylene_cylinder: 0,
      ozone_canister: 0,
      sulfur_dioxide_flask: 0,
      phosphine_bomb: 0,
    },
    lastDailyLiquidationTimestamp: Date.now(),
    dailyCycleSeconds: 300,
    totalLifetimeExportCoins: 0,
    totalCanistersShipped: 0,
  };

  // 7-chamber parallel active batches
  const activeBatches: Record<CanisterTierId, CompressorBatch | null> = {
    co2_cylinder: refinery.activeBatches?.co2_cylinder || (refinery.activeBatch?.canisterId === 'co2_cylinder' ? refinery.activeBatch : null),
    oxygen_canister: refinery.activeBatches?.oxygen_canister || (refinery.activeBatch?.canisterId === 'oxygen_canister' ? refinery.activeBatch : null),
    nitrogen_dewar: refinery.activeBatches?.nitrogen_dewar || (refinery.activeBatch?.canisterId === 'nitrogen_dewar' ? refinery.activeBatch : null),
    ethylene_cylinder: refinery.activeBatches?.ethylene_cylinder || (refinery.activeBatch?.canisterId === 'ethylene_cylinder' ? refinery.activeBatch : null),
    ozone_canister: refinery.activeBatches?.ozone_canister || (refinery.activeBatch?.canisterId === 'ozone_canister' ? refinery.activeBatch : null),
    sulfur_dioxide_flask: refinery.activeBatches?.sulfur_dioxide_flask || (refinery.activeBatch?.canisterId === 'sulfur_dioxide_flask' ? refinery.activeBatch : null),
    phosphine_bomb: refinery.activeBatches?.phosphine_bomb || (refinery.activeBatch?.canisterId === 'phosphine_bomb' ? refinery.activeBatch : null),
  };

  const activeBatchesList = (Object.keys(activeBatches) as CanisterTierId[])
    .map((cid) => activeBatches[cid])
    .filter(Boolean) as CompressorBatch[];
  const activeCount = activeBatchesList.length;

  // 7-chamber automated refinery workers
  const automatedGases: Record<CanisterTierId, boolean> = {
    co2_cylinder: true,
    nitrogen_dewar: true,
    oxygen_canister: false,
    ethylene_cylinder: false,
    ozone_canister: false,
    sulfur_dioxide_flask: false,
    phosphine_bomb: false,
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

  // Inventories for intake (Standard & Advanced Feedstocks)
  const slurryStock = Math.round(refinery.storedSlurryFeedstock || 0);
  const maxSlurry = refinery.maxSlurryCapacity || 2500;
  const chaffStock = (silo.chaff || 0) + (barn.chaff || 0);
  const waterStock = Math.round(hydrology?.towerLiters || 0);
  const biomassStock = (silo.peas || 0) + (silo.wheat || 0) + (silo.soybean || 0) + (silo.corn || 0);
  const fuelStock = (barn.thermal_scutes || 0) + (barn.thermal_solvent || 0) + (barn.fired_hardwood || 0);

  // 4 Advanced Feedstocks
  const cullBiomassStock = (refinery.cullBiomassStock || 0) + (barn.cull_biomass || 0);
  const dynamoPowerKWh = Math.round(refinery.dynamoPowerKWh || 0);
  const maxDynamoPowerKWh = refinery.maxDynamoPowerKWh || 500;
  const rawSulfurDust = (refinery.rawSulfurDust || 0) + (barn.raw_sulfur || 0);
  const boneMealBags = (refinery.boneMealBags || 0) + (barn.bone_meal || 0);

  // Crate status
  const crate = {
    co2_cylinder: 0,
    oxygen_canister: 0,
    nitrogen_dewar: 0,
    ethylene_cylinder: 0,
    ozone_canister: 0,
    sulfur_dioxide_flask: 0,
    phosphine_bomb: 0,
    ...(refinery.dailyShippingCrate || {}),
  };
  const crateCount = getCrateTotalCanisterCount(crate);
  const crateValue = calculateCrateLiquidationValue(crate);

  // Output rack status
  const rack = {
    co2_cylinder: 0,
    oxygen_canister: 0,
    nitrogen_dewar: 0,
    ethylene_cylinder: 0,
    ozone_canister: 0,
    sulfur_dioxide_flask: 0,
    phosphine_bomb: 0,
    ...(refinery.outputRack || {}),
  };
  const totalRackCount =
    rack.co2_cylinder +
    rack.oxygen_canister +
    rack.nitrogen_dewar +
    rack.ethylene_cylinder +
    rack.ozone_canister +
    rack.sulfur_dioxide_flask +
    rack.phosphine_bomb;

  // Active industrial contracts on notice board
  const industrialOrders = orders.filter(
    (o) =>
      o.clientId === 'brewmaster_klaus' ||
      o.clientId === 'dr_vanderberg' ||
      o.clientId === 'foundryman_torval' ||
      o.requiredItems?.some((it) => Object.keys(CANISTER_RECIPES).includes(it.itemId))
  );

  const handleStartCraft = (canisterId: CanisterTierId) => {
    setIsCompressingAnim(true);
    setTimeout(() => setIsCompressingAnim(false), 600);
    startGasCompressorBatch(canisterId);
  };

  const handleStartAll = (tier?: 'primary' | 'advanced' | 'all') => {
    setIsCompressingAnim(true);
    setTimeout(() => setIsCompressingAnim(false), 600);
    if (startAllGasCompressors) {
      startAllGasCompressors(tier || activeTier);
    }
  };

  const handleLoadAllToCrate = () => {
    let loaded = 0;
    const allCids = Object.keys(CANISTER_RECIPES) as CanisterTierId[];
    for (const cid of allCids) {
      const count = rack[cid] || 0;
      if (count > 0) {
        loadCanisterToShippingCrate(cid, count);
        loaded += count;
      }
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
                  <span>💩</span> Raw Livestock &amp; Primeval Slurry
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
                  <span
                    className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full"
                    title={`Inflow Breakdown: +${domesticInflowPerMin.toFixed(1)} L/min from ${activeAnimalCount} domestic livestock${totalSanctuaryCreatures > 0 ? ` + ${sanctuaryInflowPerMin.toFixed(1)} L/min from ${totalSanctuaryCreatures} Sanctuary fauna` : ''}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ☀️ +{autoInflowPerMin.toFixed(1)} L/min ({activeAnimalCount} herd{totalSanctuaryCreatures > 0 ? `, ${totalSanctuaryCreatures} sanctuary` : ''}{elderAnimalCount > 0 ? `, ${elderAnimalCount} elder` : ''})
                  </span>
                ) : isNight ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-500/30 px-2 py-0.5 rounded-full" title="Livestock and sanctuary fauna are asleep during the night shift. Slurry production pauses until morning.">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    🌙 Night Rest: 0 L/min (Herd &amp; Sanctuary Asleep)
                  </span>
                ) : elderAnimalCount > 0 && activeAnimalCount === 0 && totalSanctuaryCreatures === 0 ? (
                  <span className="text-[10px] text-amber-400/90 italic" title="Elder animals have retired from biological production and do not produce slurry.">
                    👵 0 L/min ({elderAnimalCount} elder livestock retired)
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400/90 italic">
                    0 L/min (No active livestock or sanctuary fauna)
                  </span>
                )}
              </div>

              {/* Dedicated Sanctuary Primeval Sluice Intake Strip */}
              {totalSanctuaryCreatures > 0 && (
                <div className="flex items-center justify-between text-[10px] bg-amber-950/40 border border-amber-600/30 rounded-lg px-2.5 py-1 text-amber-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span>🦕</span> Primeval Sanctuary Sluice Intake
                  </span>
                  <span className="font-mono text-amber-200">
                    {isNight ? (
                      <span className="text-stone-400 text-[9px]">🌙 Resting (0 L/min)</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">🟢 Active: +{sanctuaryInflowPerMin.toFixed(1)} L/min ({totalSanctuaryCreatures} ancient specimen{totalSanctuaryCreatures !== 1 ? 's' : ''})</span>
                    )}
                  </span>
                </div>
              )}
              {starvingEnclosureCount > 0 && (
                <div className="flex items-center justify-between text-[9px] bg-rose-950/40 border border-rose-600/30 rounded-lg px-2 py-0.5 text-rose-300">
                  <span>⚠️ {starvingEnclosureCount} sanctuary enclosure(s) empty: primeval slurry paused</span>
                </div>
              )}
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

            {/* 1. Overripe Fruit / Cull Biomass */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <span>🍇</span> Overripe Fruit / Cull Biomass
                </span>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {cullBiomassStock} units
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Harvested orchard yields, over-mature farm plots, or Gas Lab compost cull. Cracks into Ethylene plant hormone.
              </p>
              {buyRefineryFeedstock && (
                <button
                  type="button"
                  onClick={() => buyRefineryFeedstock('cull_biomass')}
                  className="w-full py-1 px-2 rounded-lg text-[10px] font-bold bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🍇</span> Procure 15 Cull Biomass (8c)
                </button>
              )}
            </div>

            {/* 2. Lab Dynamo Power (HV Grid) */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>⚡</span> Lab Dynamo Power (HV Grid)
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {dynamoPowerKWh} / {maxDynamoPowerKWh} kWh
                </span>
              </div>
              <div className="w-full bg-stone-900 rounded-full h-2 overflow-hidden border border-stone-800 relative">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((dynamoPowerKWh / maxDynamoPowerKWh) * 100))}%` }}
                />
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Windmill, Water Turbine, or Thermal Generator charging. Powers cold-plasma Ozone ionization.
              </p>
              {buyRefineryFeedstock && (
                <button
                  type="button"
                  onClick={() => buyRefineryFeedstock('dynamo_power')}
                  disabled={dynamoPowerKWh >= maxDynamoPowerKWh}
                  className="w-full py-1 px-2 rounded-lg text-[10px] font-bold bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border border-amber-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>⚡</span> Charge Grid +100 kWh (10c)
                </button>
              )}
            </div>

            {/* 3. Raw Sulfur / Brimstone Dust */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  <span>🌋</span> Raw Sulfur / Brimstone Dust
                </span>
                <span className="text-xs font-mono font-bold text-orange-400">
                  {rawSulfurDust} dust
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Quarry excavation, deep well dredge, or Merchant bulk buy-in (12c). Scrubbed into Sulfur Dioxide anti-fungal.
              </p>
              {buyRefineryFeedstock && (
                <button
                  type="button"
                  onClick={() => buyRefineryFeedstock('raw_sulfur')}
                  className="w-full py-1 px-2 rounded-lg text-[10px] font-bold bg-orange-950/60 hover:bg-orange-900/80 text-orange-200 border border-orange-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🌋</span> Merchant Buy-In 15 Dust (12c)
                </button>
              )}
            </div>

            {/* 4. Bone Meal / Mineral Phosphorus */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-lime-300 flex items-center gap-1.5">
                  <span>🦴</span> Bone Meal / Mineral Phosphorus
                </span>
                <span className="text-xs font-mono font-bold text-lime-400">
                  {boneMealBags} bags
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Animal byproduct mill, fishery tailings, or Barn compost filter. Catalyzed into heavy Phosphine fumigant.
              </p>
              {buyRefineryFeedstock && (
                <button
                  type="button"
                  onClick={() => buyRefineryFeedstock('bone_meal')}
                  className="w-full py-1 px-2 rounded-lg text-[10px] font-bold bg-lime-950/60 hover:bg-lime-900/80 text-lime-200 border border-lime-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🦴</span> Mill 10 Bags Bone Meal (10c)
                </button>
              )}
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
                    Heavy Gas Compression &amp; Bottling Deck
                    {activeCount > 0 ? (
                      <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full animate-pulse">
                        {activeCount} / 7 ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                        7 Parallel Chambers Ready
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Dual-Tier Compression • Primary Atmospheric (CO₂, O₂, N₂) &amp; Advanced Agri-Gases (C₂H₄, O₃, SO₂, PH₃)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-stone-400 font-mono block">Deck State</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${activeCount > 0 ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'}`}>
                  {activeCount > 0 ? `⚡ ${activeCount}/7 Chambers Compressing` : '🟢 Chambers Standby'}
                </span>
              </div>
            </div>

            {/* Refinery Workforce & Chamber Automation Header */}
            <div className="bg-stone-950/90 rounded-xl p-3 border border-stone-800/80 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👷</span>
                  <div>
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                      REFINERY WORKFORCE &amp; CHAMBER AUTOMATION ({autoWorkerCount}/7 AUTOMATED)
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
                      Slurry-consuming chambers engage when slurry reaches <strong>2,000L</strong> and stop automatically below <strong>500L</strong> to protect estate slurry reserves.
                    </p>
                  </div>
                </div>

                {/* Automation Control Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (automateAllTierGas) {
                        automateAllTierGas(activeTier, true);
                      }
                    }}
                    className="px-2.5 py-1 rounded-md text-[10px] font-black bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                    title={`Automate all ${activeTier === 'primary' ? '3 Primary Atmospheric' : '4 Advanced Agri-Gas'} chambers`}
                  >
                    ⚙️ Automate Active Tier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (automateAllTierGas) {
                        automateAllTierGas('all', true);
                      }
                    }}
                    className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-stone-800 hover:bg-stone-700 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer"
                    title="Assign automated workers to all 7 chambers"
                  >
                    ⚡ Automate All 7
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (automateAllTierGas) {
                        automateAllTierGas('all', false);
                      }
                    }}
                    className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all cursor-pointer"
                    title="Switch all 7 chambers to manual player operation"
                  >
                    ✋ Manual All 7
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartAll(activeTier)}
                    className="px-3 py-1 rounded-md text-[10px] font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 border border-amber-400 shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center gap-1"
                    title={`Bottle all available gases in ${activeTier === 'primary' ? 'Primary' : 'Advanced'} tier`}
                  >
                    <span>⚡ Bottle All Active</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tier Toggle Switch directly above the chamber deck */}
            <div className="flex items-center gap-2 p-1.5 bg-stone-950/90 rounded-xl border border-stone-800 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTier('primary')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTier === 'primary'
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 shadow-md border border-amber-300'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <span className="text-sm">🌐</span>
                <span>Primary Atmospheric (CO₂, O₂, N₂)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTier('advanced')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTier === 'advanced'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white shadow-md border border-purple-400'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <span className="text-sm">🔬</span>
                <span>Advanced Agri-Gases (C₂H₄, O₃, SO₂, PH₃)</span>
              </button>
            </div>

            {/* Chamber Cards Deck */}
            <div
              className={`grid gap-3 pt-1 ${
                activeTier === 'primary'
                  ? 'grid-cols-1 md:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {(
                activeTier === 'primary'
                  ? (['co2_cylinder', 'oxygen_canister', 'nitrogen_dewar'] as CanisterTierId[])
                  : (['ethylene_cylinder', 'ozone_canister', 'sulfur_dioxide_flask', 'phosphine_bomb'] as CanisterTierId[])
              ).map((canisterId) => {
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
                } else if (canisterId === 'ethylene_cylinder') {
                  if (slurryStock < 30) {
                    canCraft = false;
                    missingReason = 'Need 30L Slurry';
                  } else if (cullBiomassStock < 15) {
                    canCraft = false;
                    missingReason = 'Need 15 Cull Biomass';
                  }
                } else if (canisterId === 'ozone_canister') {
                  const o2Avail = (rack.oxygen_canister || 0) + (barn.oxygen_canister || 0);
                  if (o2Avail < 1) {
                    canCraft = false;
                    missingReason = 'Need 1 O₂ Canister';
                  } else if (dynamoPowerKWh < 40) {
                    canCraft = false;
                    missingReason = 'Need 40 kWh Power';
                  }
                } else if (canisterId === 'sulfur_dioxide_flask') {
                  if (rawSulfurDust < 15) {
                    canCraft = false;
                    missingReason = 'Need 15 Sulfur Dust';
                  } else if (waterStock < 20) {
                    canCraft = false;
                    missingReason = 'Need 20L Water';
                  }
                } else if (canisterId === 'phosphine_bomb') {
                  if (boneMealBags < 10) {
                    canCraft = false;
                    missingReason = 'Need 10 Bone Meal';
                  } else if (slurryStock < 25) {
                    canCraft = false;
                    missingReason = 'Need 25L Slurry';
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
                        : canisterId === 'nitrogen_dewar'
                        ? 'bg-gradient-to-b from-stone-900 to-indigo-950/20 border-indigo-500/30'
                        : canisterId === 'ethylene_cylinder'
                        ? 'bg-gradient-to-b from-stone-900 to-purple-950/20 border-purple-500/30'
                        : canisterId === 'ozone_canister'
                        ? 'bg-gradient-to-b from-stone-900 to-yellow-950/20 border-yellow-500/30'
                        : canisterId === 'sulfur_dioxide_flask'
                        ? 'bg-gradient-to-b from-stone-900 to-orange-950/20 border-orange-500/30'
                        : 'bg-gradient-to-b from-stone-900 to-lime-950/20 border-lime-500/30'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{recipe.emoji}</span>
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          🪙 {recipe.baseExportCoins}c
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center justify-between">
                          <span>{recipe.name}</span>
                          <span className="text-[10px] font-mono text-stone-400">({recipe.chemicalFormula})</span>
                        </h4>
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
                                  Automated
                                </span>
                              ) : (
                                <span className="text-amber-400/90">Manual Mode</span>
                              )}
                            </span>
                            <span className="text-[9px] text-stone-400 block truncate">
                              {isAutomated
                                ? (thisBatch
                                    ? '⚡ Compressing batch'
                                    : (canisterId === 'co2_cylinder' || canisterId === 'nitrogen_dewar' || canisterId === 'ethylene_cylinder' || canisterId === 'phosphine_bomb') && !isWorkerSlurryActive
                                    ? `🛡️ Standby (<2,000L Slurry)`
                                    : canCraft
                                    ? '🟢 Ready for auto-stroke'
                                    : `⏳ Standby (${missingReason})`)
                                : 'Manual operation'}
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
                              📍 <strong>Source:</strong> Animals Tab / Sanctuary Sluice + Wheat/Corn harvests
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
                        {canisterId === 'ethylene_cylinder' && (
                          <>
                            <div className="flex justify-between">
                              <span>Raw Slurry:</span>
                              <span className={slurryStock >= 30 ? 'text-purple-400 font-bold' : 'text-red-400 font-bold'}>
                                {slurryStock}/30L
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Overripe Biomass:</span>
                              <span className={cullBiomassStock >= 15 ? 'text-purple-300 font-bold' : 'text-red-400 font-bold'}>
                                {cullBiomassStock}/15 units
                              </span>
                            </div>
                            <div className="text-[9px] text-purple-300/80 bg-purple-950/40 p-1 rounded border border-purple-500/20">
                              📍 <strong>Source:</strong> Animal Slurry Sump + Orchard / Farm Cull
                            </div>
                          </>
                        )}
                        {canisterId === 'ozone_canister' && (
                          <>
                            <div className="flex justify-between">
                              <span>O₂ Canister (Rack):</span>
                              <span className={((rack.oxygen_canister || 0) + (barn.oxygen_canister || 0)) >= 1 ? 'text-cyan-400 font-bold' : 'text-red-400 font-bold'}>
                                {(rack.oxygen_canister || 0) + (barn.oxygen_canister || 0)}/1 can
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dynamo Power:</span>
                              <span className={dynamoPowerKWh >= 40 ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>
                                {dynamoPowerKWh}/40 kWh
                              </span>
                            </div>
                            <div className="text-[9px] text-amber-300/80 bg-amber-950/40 p-1 rounded border border-amber-500/20">
                              📍 <strong>Source:</strong> Gas Lab O₂ Output + Windmill / Dynamo Grid
                            </div>
                          </>
                        )}
                        {canisterId === 'sulfur_dioxide_flask' && (
                          <>
                            <div className="flex justify-between">
                              <span>Raw Sulfur Dust:</span>
                              <span className={rawSulfurDust >= 15 ? 'text-orange-400 font-bold' : 'text-red-400 font-bold'}>
                                {rawSulfurDust}/15 dust
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tower Water / O₂:</span>
                              <span className={waterStock >= 20 ? 'text-cyan-400 font-bold' : 'text-red-400 font-bold'}>
                                {waterStock}/20L
                              </span>
                            </div>
                            <div className="text-[9px] text-orange-300/80 bg-orange-950/40 p-1 rounded border border-orange-500/20">
                              📍 <strong>Source:</strong> Estate Quarry / Merchant + Hydrology Tower
                            </div>
                          </>
                        )}
                        {canisterId === 'phosphine_bomb' && (
                          <>
                            <div className="flex justify-between">
                              <span>Bone Meal / Phosphorus:</span>
                              <span className={boneMealBags >= 10 ? 'text-lime-400 font-bold' : 'text-red-400 font-bold'}>
                                {boneMealBags}/10 bags
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Conc. Slurry Acid:</span>
                              <span className={slurryStock >= 25 ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>
                                {slurryStock}/25L
                              </span>
                            </div>
                            <div className="text-[9px] text-lime-300/80 bg-lime-950/40 p-1 rounded border border-lime-500/20">
                              📍 <strong>Source:</strong> Livestock Byproduct Mill + Concentrated Slurry Sump
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
                            ? (canisterId === 'co2_cylinder' || canisterId === 'nitrogen_dewar' || canisterId === 'ethylene_cylinder' || canisterId === 'phosphine_bomb') && !isWorkerSlurryActive
                              ? 'bg-stone-800/80 text-amber-300/90 border border-amber-500/30 cursor-default'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 cursor-default'
                            : !canCraft
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                            : canisterId === 'co2_cylinder'
                            ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 active:scale-95'
                            : canisterId === 'oxygen_canister'
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95'
                            : canisterId === 'nitrogen_dewar'
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
                            : canisterId === 'ethylene_cylinder'
                            ? 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
                            : canisterId === 'ozone_canister'
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-stone-950 active:scale-95'
                            : canisterId === 'sulfur_dioxide_flask'
                            ? 'bg-orange-600 hover:bg-orange-500 text-white active:scale-95'
                            : 'bg-lime-600 hover:bg-lime-500 text-stone-950 active:scale-95'
                        }`}
                      >
                        {thisBatch ? (
                          <span className="animate-pulse">⚡ Compressing ({thisRemainingSec}s)...</span>
                        ) : isAutomated ? (
                          (canisterId === 'co2_cylinder' || canisterId === 'nitrogen_dewar' || canisterId === 'ethylene_cylinder' || canisterId === 'phosphine_bomb') && !isWorkerSlurryActive ? (
                            <span>🛡️ Standby (Slurry &lt; 2,000L)</span>
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

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
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

                  {/* Ethylene Racks */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/70 border border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🍇</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200 block">Ethylene Cylinders</span>
                        <span className="text-[10px] text-stone-400">Value: 80c each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-purple-400">{rack.ethylene_cylinder}</span>
                      <button
                        type="button"
                        onClick={() => loadCanisterToShippingCrate('ethylene_cylinder', 1)}
                        disabled={rack.ethylene_cylinder <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Load 1 into Estate Export Crate"
                      >
                        Load 📦
                      </button>
                      <button
                        type="button"
                        onClick={() => collectGasCompressorOutput()}
                        disabled={rack.ethylene_cylinder <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Collect to Barn inventory"
                      >
                        Barn 🎒
                      </button>
                    </div>
                  </div>

                  {/* Ozone Racks */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/70 border border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200 block">Ozone Canisters</span>
                        <span className="text-[10px] text-stone-400">Value: 125c each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-yellow-400">{rack.ozone_canister}</span>
                      <button
                        type="button"
                        onClick={() => loadCanisterToShippingCrate('ozone_canister', 1)}
                        disabled={rack.ozone_canister <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Load 1 into Estate Export Crate"
                      >
                        Load 📦
                      </button>
                      <button
                        type="button"
                        onClick={() => collectGasCompressorOutput()}
                        disabled={rack.ozone_canister <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Collect to Barn inventory"
                      >
                        Barn 🎒
                      </button>
                    </div>
                  </div>

                  {/* Sulfur Dioxide Racks */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/70 border border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌋</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200 block">Sulfur Dioxide Flasks</span>
                        <span className="text-[10px] text-stone-400">Value: 160c each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-orange-400">{rack.sulfur_dioxide_flask}</span>
                      <button
                        type="button"
                        onClick={() => loadCanisterToShippingCrate('sulfur_dioxide_flask', 1)}
                        disabled={rack.sulfur_dioxide_flask <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Load 1 into Estate Export Crate"
                      >
                        Load 📦
                      </button>
                      <button
                        type="button"
                        onClick={() => collectGasCompressorOutput()}
                        disabled={rack.sulfur_dioxide_flask <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Collect to Barn inventory"
                      >
                        Barn 🎒
                      </button>
                    </div>
                  </div>

                  {/* Phosphine Racks */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-stone-950/70 border border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">☣️</span>
                      <div>
                        <span className="text-xs font-bold text-stone-200 block">Phosphine Bombs</span>
                        <span className="text-[10px] text-stone-400">Value: 220c each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-lime-400">{rack.phosphine_bomb}</span>
                      <button
                        type="button"
                        onClick={() => loadCanisterToShippingCrate('phosphine_bomb', 1)}
                        disabled={rack.phosphine_bomb <= 0}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 border border-lime-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Load 1 into Estate Export Crate"
                      >
                        Load 📦
                      </button>
                      <button
                        type="button"
                        onClick={() => collectGasCompressorOutput()}
                        disabled={rack.phosphine_bomb <= 0}
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

                  {/* 2-Row Compact Matrix */}
                  <div className="space-y-1.5">
                    {/* Row 1: CO2, O2, N2 */}
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
                    {/* Row 2: C2H4, O3, SO2, PH3 */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[9px] font-mono">
                      <div className="p-1 rounded bg-stone-900 border border-stone-800">
                        <span className="text-purple-300 block">🍇 C₂H₄</span>
                        <span className="text-purple-300 font-bold">{crate.ethylene_cylinder}</span>
                      </div>
                      <div className="p-1 rounded bg-stone-900 border border-stone-800">
                        <span className="text-yellow-300 block">⚡ O₃</span>
                        <span className="text-yellow-300 font-bold">{crate.ozone_canister}</span>
                      </div>
                      <div className="p-1 rounded bg-stone-900 border border-stone-800">
                        <span className="text-orange-300 block">🌋 SO₂</span>
                        <span className="text-orange-300 font-bold">{crate.sulfur_dioxide_flask}</span>
                      </div>
                      <div className="p-1 rounded bg-stone-900 border border-stone-800">
                        <span className="text-lime-300 block">☣️ PH₃</span>
                        <span className="text-lime-300 font-bold">{crate.phosphine_bomb}</span>
                      </div>
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
