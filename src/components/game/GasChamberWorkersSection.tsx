'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore, getStorageAvailableStock } from '@/game/store';
import {
  CANISTER_RECIPES,
  type CanisterTierId,
  type CanisterId,
  type CompressorBatch,
} from '@/game/gasBottlingEngine';
import {
  workerUpgradeCost,
  workerSpeedMultiplier,
  workerOverdrive,
  WORKER_MAX_LEVEL,
} from '@/game/data';
import { GAS_CANISTER_TO_TECH } from '@/game/store';
import { toRomanNumeral } from '@/game/workerGenetics';
import { playCashRegisterSound, playSumpValveSound } from '@/lib/soundEffects';
import {
  isWorkerAbsentAndUncovered,
  formatAbsenceRemaining,
  MEDICAL_DRAUGHT_COST_COINS,
  TEMP_WORKER_DAILY_COST_COINS,
} from '@/game/absenteeismEngine';

export interface GasChamberWorkerDef {
  canisterId: CanisterId;
  name: string;
  title: string;
  emoji: string;
  chamberName: string;
  chamberNumber: number;
  description: string;
  feedstockSummary: string;
  demandSector: string;
}

export const GAS_CHAMBER_WORKERS: GasChamberWorkerDef[] = [
  {
    canisterId: 'co2_cylinder',
    name: 'Gareth Vance',
    title: 'CO₂ Compression Technician',
    emoji: '🫧',
    chamberName: 'Chamber 1 • Anaerobic Digester',
    chamberNumber: 1,
    description: 'Compresses carbon dioxide gas fermented from anaerobic slurry and dry chaff husks.',
    feedstockSummary: '40L Slurry + 10 Chaff',
    demandSector: 'Breweries, Soft Drinks & Carbonated Cellars',
  },
  {
    canisterId: 'oxygen_canister',
    name: 'Dr. Clara Lin',
    title: 'Oxygen Fractionator',
    emoji: '🫁',
    chamberName: 'Chamber 2 • Aeration Column',
    chamberNumber: 2,
    description: 'Refines high-purity medical oxygen from freshwater aeration and green biomass.',
    feedstockSummary: '30L Tower Water + 5 Green Biomass',
    demandSector: 'Sanitariums, High-Altitude Clinics & Diving Guilds',
  },
  {
    canisterId: 'nitrogen_dewar',
    name: 'Torval Frost',
    title: 'Cryo-Distiller Operator',
    emoji: '❄️',
    chamberName: 'Chamber 3 • Vacuum Dewar Still',
    chamberNumber: 3,
    description: 'Cryogenically isolates liquid nitrogen for metallurgical quenching and cold chains.',
    feedstockSummary: '50L Slurry + 1 Thermal Fuel (or 🪙15)',
    demandSector: 'Industrial Cryo-Foundries & Perishable Cold Chains',
  },
  {
    canisterId: 'ethylene_cylinder',
    name: 'Silas Croft',
    title: 'Catalytic Cracker Specialist',
    emoji: '🍇',
    chamberName: 'Chamber 4 • Pyrolysis Tower',
    chamberNumber: 4,
    description: 'Cracks overripe cull fruit and slurry into potent plant ripening hormones.',
    feedstockSummary: '30L Slurry + 15 Cull Biomass',
    demandSector: 'Greenhouse Ripening Chambers & Commercial Orchards',
  },
  {
    canisterId: 'ozone_canister',
    name: 'Tesla Sparks',
    title: 'Corona Discharge Technician',
    emoji: '⚡',
    chamberName: 'Chamber 5 • High-Voltage Arc Chamber',
    chamberNumber: 5,
    description: 'Ionizes pure O₂ canisters using laboratory dynamo power into sterilizing ozone.',
    feedstockSummary: '1 O₂ Canister + 40 kWh Dynamo Power',
    demandSector: 'Post-Harvest Sterilization & Cleanroom Hygiene',
  },
  {
    canisterId: 'sulfur_dioxide_flask',
    name: 'Ignatius Brim',
    title: 'Brimstone Gas Scrubber',
    emoji: '🌋',
    chamberName: 'Chamber 6 • Fume Scrubber Retort',
    chamberNumber: 6,
    description: 'Roasts raw sulfur dust and water into anti-fungal preservative gas for transit.',
    feedstockSummary: '15 Raw Sulfur + 20L Water',
    demandSector: 'Vineyard Preservation & Long-Haul Export Transit',
  },
  {
    canisterId: 'phosphine_bomb',
    name: 'Viktor Mortis',
    title: 'Phosphorus Fumigation Chemist',
    emoji: '☣️',
    chamberName: 'Chamber 7 • Heavy Fumigant Reactor',
    chamberNumber: 7,
    description: 'Synthesizes deep-penetrating fumigant from mineral bone meal and concentrated slurry.',
    feedstockSummary: '10 Bone Meal + 25L Slurry',
    demandSector: 'Commercial Grain Silos & Bulk Cargo Hold Sterilization',
  },
];

interface GasChamberWorkersSectionProps {
  onNavigateToRefinery?: () => void;
}

export function GasChamberWorkersSection({ onNavigateToRefinery }: GasChamberWorkersSectionProps) {
  const {
    gasRefinery,
    silo = {},
    barn = {},
    hydrology,
    coins = 0,
    animals = [],
    prehistoricSanctuary,
    unifiedWorkers,
    bulkUpgradeUnifiedWorker,
    toggleUnifiedWorkerMode,
    toggleGasAutomation,
    automateAllTierGas,
    startGasCompressorBatch,
    collectGasCompressorOutput,
    loadCanisterToShippingCrate,
    safetyInfrastructure,
    cureWorkerFumeSickness,
    hireTempReplacementWorker,
    grantWorkerPaidLeave,
  } = useGameStore();

  const [now, setNow] = useState(Date.now());
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
    activeBatches: {},
    outputRack: {},
    automatedGases: {
      co2_cylinder: true,
      oxygen_canister: true,
      nitrogen_dewar: true,
      ethylene_cylinder: true,
      ozone_canister: true,
      sulfur_dioxide_flask: true,
      phosphine_bomb: true,
    },
    isWorkerSlurryActive: true,
  };

  const storedSlurry = refinery.storedSlurryFeedstock || 0;
  const isWorkerSlurryActive = Boolean(refinery.isWorkerSlurryActive);
  const automatedGases = refinery.automatedGases || {};
  const activeBatches = refinery.activeBatches || {};
  const outputRack = refinery.outputRack || {};

  const activeWorkerCount = Object.values(automatedGases).filter(Boolean).length;
  const currentlyCompressingCount = Object.values(activeBatches).filter(Boolean).length;

  // Slurry inflow calculation (Domestic Herd + Sanctuary Primeval Sluice)
  const allAnimals = animals || [];
  const activeAnimals = allAnimals.filter(
    (a) => !((a.cyclesRemaining !== undefined && a.cyclesRemaining <= 0) || a.age === 'elder')
  );
  const domesticInflow = activeAnimals.reduce((sum, a) => {
    const rate = a.species === 'cow' ? 2.5 : a.species === 'pig' ? 1.5 : a.species === 'sheep' ? 1.0 : 0.5;
    return sum + rate;
  }, 0);

  const enclosures = Object.values(prehistoricSanctuary?.enclosures || {});
  const totalSanctuaryCreatures = enclosures.reduce((sum, e) => sum + (!e.isStarving ? (e.specimenCount || 0) : 0), 0);
  const sanctuaryInflow = totalSanctuaryCreatures * 5.0;
  const daytimeInflowPerMin = domesticInflow + sanctuaryInflow;

  const handleToggleWorker = (canisterId: CanisterId) => {
    toggleGasAutomation(canisterId);
  };

  const handleManualStroke = (canisterId: CanisterId) => {
    startGasCompressorBatch(canisterId);
  };

  const handleCollectRack = (canisterId: CanisterId) => {
    const count = outputRack[canisterId] || 0;
    if (count > 0) {
      loadCanisterToShippingCrate(canisterId, count);
      playSumpValveSound();
    }
  };

  return (
    <div className="space-y-4">
      {/* Heavy Refinery Dispatch Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-stone-900 to-amber-950/80 border border-amber-500/40 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
                🛢️
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-lg sm:text-xl text-white tracking-wide">
                    Gas Compressor Chamber Technicians
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/50">
                    {activeWorkerCount}/7 Chambers Automated
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-0.5 max-w-2xl">
                  Automated technicians operate heavy hydraulic compressors across all 7 gas synthesis chambers.
                  Managed under the automatic Slurry Governor with safety hysteresis thresholds.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <button
              onClick={() => automateAllTierGas && automateAllTierGas('all', true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Assign All 7 Workers
            </button>
            <button
              onClick={() => automateAllTierGas && automateAllTierGas('all', false)}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs border border-stone-700 transition-all cursor-pointer active:scale-95"
            >
              Set All Manual
            </button>
          </div>
        </div>

        {/* Slurry Governor Hysteresis Status Bar */}
        <div className="p-3 rounded-xl bg-stone-950/90 border border-amber-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
            <div className="text-[10px] text-stone-400 font-medium">Intake Slurry Buffer</div>
            <div className="text-sm font-black text-amber-400 font-mono mt-0.5">
              {Math.round(storedSlurry).toLocaleString()}L / {refinery.maxSlurryCapacity || 2500}L
            </div>
            <div className="w-full bg-stone-800 h-1 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (storedSlurry / (refinery.maxSlurryCapacity || 2500)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
            <div className="text-[10px] text-stone-400 font-medium">Slurry Governor State</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isWorkerSlurryActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
              <span className={`text-xs font-black ${isWorkerSlurryActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isWorkerSlurryActive ? 'Engaged (≥2,000L)' : 'Paused (<500L Cutoff)'}
              </span>
            </div>
            <div className="text-[9px] text-stone-500 mt-0.5">Auto-trips at 500L cutoff</div>
          </div>

          <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
            <div className="text-[10px] text-stone-400 font-medium">Slurry Inflow Rate</div>
            <div className="text-sm font-black text-cyan-400 font-mono mt-0.5">
              +{daytimeInflowPerMin.toFixed(1)} L/min
            </div>
            <div className="text-[9px] text-stone-500 mt-0.5">
              {activeAnimals.length} herd{totalSanctuaryCreatures > 0 ? ` + ${totalSanctuaryCreatures} ancient` : ''}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
            <div className="text-[10px] text-stone-400 font-medium">Active Compression</div>
            <div className="text-sm font-black text-purple-300 font-mono mt-0.5">
              {currentlyCompressingCount} Chambers Cycling
            </div>
            <div className="text-[9px] text-stone-500 mt-0.5">Parallel hydraulic cycle</div>
          </div>
        </div>
      </div>

      {/* Grid of the 7 Dedicated Gas Chamber Worker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {GAS_CHAMBER_WORKERS.map((worker) => {
          const recipe = CANISTER_RECIPES[worker.canisterId];
          const isAutomated = Boolean(automatedGases[worker.canisterId]);
          const currentBatch = activeBatches[worker.canisterId];
          const rackStock = outputRack[worker.canisterId] || 0;

          // Check if batch is active and compute progress
          const elapsedSec = currentBatch ? Math.max(0, (now - currentBatch.startedAt) / 1000) : 0;
          const duration = currentBatch?.durationSec || recipe.processingDurationSec;
          const progressPct = currentBatch ? Math.min(100, (elapsedSec / duration) * 100) : 0;
          const remainingSec = currentBatch ? Math.max(0, Math.ceil(duration - elapsedSec)) : 0;

          // Check slurry dependency
          const needsSlurry = worker.canisterId === 'co2_cylinder' || worker.canisterId === 'nitrogen_dewar' || worker.canisterId === 'ethylene_cylinder' || worker.canisterId === 'phosphine_bomb';
          const isSlurryBlocked = needsSlurry && !isWorkerSlurryActive;

          const techRole = GAS_CANISTER_TO_TECH[worker.canisterId];
          const isAbsent = isWorkerAbsentAndUncovered(techRole, safetyInfrastructure, now);
          const absenceRecord = safetyInfrastructure?.activeAbsences?.[techRole];
          const isCoveredByTemp = safetyInfrastructure?.tempReplacementWorkers?.[techRole] && (safetyInfrastructure.tempReplacementWorkers[techRole] || 0) > now;

          return (
            <div
              key={worker.canisterId}
              className={`rounded-2xl border p-4 transition-all space-y-3 shadow-md ${
                isAbsent
                  ? 'bg-rose-950/40 border-rose-500/70 shadow-rose-950/20'
                  : isAutomated
                  ? 'bg-stone-900/90 dark:bg-stone-900/90 border-amber-500/40 hover:border-amber-500/70'
                  : 'bg-stone-950/70 dark:bg-stone-950/80 border-stone-800 opacity-80'
              }`}
            >
              {/* Absenteeism Caution Banner & Quick Actions */}
              {isAbsent && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600/70 flex flex-col gap-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-rose-300">
                      <span className="text-base">⚠️</span>
                      <span>WORKER ABSENT: {absenceRecord?.cause?.replace('_', ' ').toUpperCase() || 'SICK'}</span>
                    </div>
                    <span className="text-[11px] font-mono text-rose-200 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/50">
                      {absenceRecord ? formatAbsenceRemaining(absenceRecord.expiresAt) : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {absenceRecord?.cause === 'fume_sickness' && (
                      <button
                        onClick={() => cureWorkerFumeSickness(techRole)}
                        disabled={coins < MEDICAL_DRAUGHT_COST_COINS}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer ${
                          coins >= MEDICAL_DRAUGHT_COST_COINS
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        <span>🧪 Medical Draught ({MEDICAL_DRAUGHT_COST_COINS}c)</span>
                      </button>
                    )}
                    {absenceRecord?.cause === 'exhaustion_burnout' && (
                      <button
                        onClick={() => grantWorkerPaidLeave(techRole)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>🛌 Grant Paid Leave</span>
                      </button>
                    )}
                    <button
                      onClick={() => hireTempReplacementWorker(techRole)}
                      disabled={coins < TEMP_WORKER_DAILY_COST_COINS}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer ${
                        coins >= TEMP_WORKER_DAILY_COST_COINS
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <span>👷 Call Temp Worker ({TEMP_WORKER_DAILY_COST_COINS}c / Day)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Covered by Temp Worker Notice */}
              {!isAbsent && isCoveredByTemp && (
                <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-600/50 flex items-center justify-between text-xs text-amber-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span>👷</span>
                    <span>Temp Day-Laborer on Shift (Covering Absenteeism)</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-300">
                    {formatAbsenceRemaining(safetyInfrastructure.tempReplacementWorkers[techRole] || 0)}
                  </span>
                </div>
              )}

              {/* Header: Avatar, Name, Formula & Status Pill */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl p-2.5 rounded-xl border shrink-0 ${
                    isAbsent
                      ? 'bg-rose-950/60 border-rose-600 text-rose-400'
                      : 'bg-amber-500/15 border-amber-500/30'
                  }`}>
                    {isAbsent ? '⚠️' : worker.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-stone-100">
                        {worker.name}
                      </h4>
                      <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {recipe.chemicalFormula}
                      </span>
                    </div>
                    <div className="text-xs text-amber-400/90 font-medium mt-0.5">
                      {worker.title}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {worker.chamberName}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <button
                    onClick={() => handleToggleWorker(worker.canisterId)}
                    className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                      isAutomated
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white border border-stone-700'
                    }`}
                  >
                    {isAutomated ? '🟢 Automated' : '✋ Manual'}
                  </button>
                </div>
              </div>

              {/* Worker Progression: Level, Speed Multiplier & Upgrade */}
              {(() => {
                const techRole = GAS_CANISTER_TO_TECH[worker.canisterId];
                const tech = unifiedWorkers?.[techRole];
                const techLevel = tech?.level || 1;
                const techGen = tech?.generation || 1;
                const speedFactor = (workerSpeedMultiplier(techLevel) * workerOverdrive(techLevel)) / Math.pow(2, Math.max(0, techGen - 1));
                const speedMult = Math.round((1 / speedFactor) * 10) / 10;
                const nextCost = workerUpgradeCost(techRole, techLevel);
                const canAfford = coins >= nextCost && techLevel < WORKER_MAX_LEVEL;

                return (
                  <div className="space-y-1.5 p-2 rounded-xl bg-stone-950/90 border border-stone-800">
                    <div className="flex items-center justify-between text-xs gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-amber-300 text-xs px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                          Lv.{techLevel} {techGen > 1 && `(Gen ${toRomanNumeral(techGen)})`}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-bold" title="Compression cycle acceleration from worker level and generational lineage">
                          ⚡ {speedMult}x Spd
                        </span>
                      </div>

                      {techLevel < WORKER_MAX_LEVEL ? (
                        <button
                          onClick={() => bulkUpgradeUnifiedWorker(techRole, 'x1')}
                          disabled={!canAfford}
                          className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer shadow-xs active:scale-95 ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
                              : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                          }`}
                          title={canAfford ? `Upgrade to Lv.${techLevel + 1} for ${nextCost.toLocaleString()} coins` : `Need ${nextCost.toLocaleString()} coins`}
                        >
                          +1 Lv ({nextCost.toLocaleString()} 🪙)
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-purple-400 uppercase">Max Lv.120</span>
                      )}
                    </div>

                    {/* Level Progress Bar (1..120) */}
                    <div className="w-full bg-stone-900 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${(techLevel / WORKER_MAX_LEVEL) * 100}%` }}
                      />
                    </div>

                    {/* Mode Toggle: Auto-Sell vs Hoard Output Rack */}
                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <span>Mode:</span>
                        <button
                          onClick={() => toggleUnifiedWorkerMode(techRole)}
                          className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-all ${
                            tech?.autoSell
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                          title={tech?.autoSell ? 'Auto-sells canisters immediately upon batch completion for coins' : 'Deposits finished canisters into laboratory rack for shipping crate export'}
                        >
                          {tech?.autoSell ? '💰 Auto-Sell' : '📦 Hoard (Rack)'}
                        </button>
                      </span>
                      <span className="text-stone-500">
                        Wage: {tech?.level ? tech.level * 4 + 16 : 20}c/day
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Status & Timing Indicator */}
              <div className="p-2.5 rounded-xl bg-stone-950/90 border border-stone-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-[11px] text-stone-300 flex items-center gap-1.5">
                    {isAbsent ? (
                      <span className="text-rose-400 font-bold">⚠️ Line Halted: Worker Absent</span>
                    ) : currentBatch ? (
                      <>
                        <span className="animate-spin text-amber-400">⚙️</span>
                        <span className="text-amber-300 font-bold">Compressing: {remainingSec}s left</span>
                      </>
                    ) : isAutomated ? (
                      isSlurryBlocked ? (
                        <span className="text-amber-500">🛡️ Standby (Slurry &lt; 500L)</span>
                      ) : (
                        <span className="text-emerald-400">🟢 Ready for Next Cycle</span>
                      )
                    ) : (
                      <span className="text-stone-500">Manual Mode (Worker Idle)</span>
                    )}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {recipe.processingDurationSec}s / cycle
                  </span>
                </div>

                {/* Live Compression Progress Bar */}
                {currentBatch && (
                  <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Feedstock Formula & Output Inventory */}
              <div className="space-y-1 text-[11px] text-stone-400">
                <div className="flex justify-between">
                  <span className="text-stone-500">Required Feedstock:</span>
                  <span className="font-semibold text-stone-200">{worker.feedstockSummary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Export Value:</span>
                  <span className="font-bold text-amber-400">🪙 {recipe.baseExportCoins} coins / cylinder</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-stone-800/80">
                  <span className="text-stone-400">Ready in Output Rack:</span>
                  <span className="font-black text-sm text-cyan-300 font-mono">
                    {rackStock} canisters
                  </span>
                </div>
              </div>

              {/* Action Buttons: Stroke & Collect */}
              <div className="flex items-center gap-2 pt-1 border-t border-stone-800/60">
                <button
                  onClick={() => handleManualStroke(worker.canisterId)}
                  disabled={Boolean(currentBatch)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 disabled:bg-stone-800/50 text-amber-300 disabled:text-stone-600 border border-amber-500/40 disabled:border-stone-800 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1 active:scale-95"
                >
                  <span>⚡</span>
                  <span>{currentBatch ? 'Compressing...' : 'Manual Stroke'}</span>
                </button>

                {rackStock > 0 && (
                  <button
                    onClick={() => handleCollectRack(worker.canisterId)}
                    className="py-1.5 px-3 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    title={`Load ${rackStock} canisters into Estate Shipping Crate for export liquidation`}
                  >
                    <span>📦</span>
                    <span>Load ({rackStock})</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
