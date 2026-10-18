'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  BUNKHOUSE_TIERS,
  getWorkerScheduleTelemetry,
  getCircadianClock,
  type ShiftType,
} from '@/game/shiftEngine';
import {
  evaluateHydrationTelemetry,
  type WorkerHydrationState,
  CANTEEN_DEFAULT_CAPACITY_LITERS,
} from '@/game/hydrationEngine';
import { WORKER_REGISTRY } from '@/game/data';
import { LIVESTOCK_WORKER_ROSTER } from '@/data/workerCatalog';
import { WORKER_UPKEEP_ROSTER } from '@/data/workerUpkeep';
import { ITEM_CATALOG_META } from '@/utils/barnInventory';

export function BunkhouseFacilityPanel() {
  const {
    coins,
    barn,
    bunkhouse,
    hydrology,
    farmEpochStart,
    unifiedWorkers,
    specialistWorkers,
    upgradeBunkhouse,
    expandBunkhouseCapacity,
    callEmergencyOvertime,
    refillStaffCanteen,
    stockColdBeverage,
    toggleNightWatchWaterAutomation,
    toggleCanteenAutoRefill,
  } = useGameStore();

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentLevel = bunkhouse?.level || 1;
  const capacity = bunkhouse?.capacity || 8;
  const currentTierMeta = BUNKHOUSE_TIERS[currentLevel];
  const nextTierMeta = BUNKHOUSE_TIERS[currentLevel + 1];

  // Hydration & Thirst Mechanics Telemetry
  const ambientTemp = hydrology?.weatherState?.temperatureC ?? 22;
  const canteenLiters = bunkhouse?.canteenLiters ?? 60;
  const canteenCap = bunkhouse?.canteenCapacityLiters ?? CANTEEN_DEFAULT_CAPACITY_LITERS;
  const towerLiters = hydrology?.towerLiters ?? 0;
  const towerCap = hydrology?.towerCapacityLiters ?? 800;
  const coldInfusedDrinks = bunkhouse?.coldInfusedDrinks ?? 0;
  const teaInBarn = barn.citrus_tea ?? 0;
  const autoRefillTower = bunkhouse?.autoRefillFromTower ?? true;
  const nightWatchAuto = bunkhouse?.nightWatchAutomation ?? true;

  const hydrationTelemetry = evaluateHydrationTelemetry({
    temperatureC: ambientTemp,
    canteenLiters,
    towerLiters,
    hasColdBeverage: coldInfusedDrinks > 0,
  });

  // Scan all hired workers and identify those in sleep or recreation
  interface BunkWorkerEntry {
    id: string;
    name: string;
    emoji: string;
    shift: ShiftType;
    phase: 'sleeping' | 'recreation' | 'on_shift';
    stamina: number;
    wellRested: boolean;
    isExhausted: boolean;
    timeRemainingFormatted: string;
    canCallOvertime: boolean;
    overtimeCostCoins: number;
    dialogue: string;
    isSpecialist: boolean;
    hydrationState: WorkerHydrationState;
    hydrationBadgeEmoji?: string;
    hydrationBadgeText?: string;
  }

  const restingWorkers: BunkWorkerEntry[] = [];
  let occupiedCount = 0;

  // Unified Workers
  if (unifiedWorkers) {
    for (const [role, w] of Object.entries(unifiedWorkers)) {
      if (w?.isHired) {
        occupiedCount++;
        const cfg = WORKER_REGISTRY[role as keyof typeof WORKER_REGISTRY];
        const baseWage = WORKER_UPKEEP_ROSTER[role]?.baseDailyWage || 15;
        const telemetry = getWorkerScheduleTelemetry({
          worker: w,
          roleOrId: role,
          baseDailyWage: baseWage,
          timestamp: now,
          epochStart: farmEpochStart,
          bunkhouseLevel: currentLevel,
          hydrationState: hydrationTelemetry.state,
        });

        if (telemetry.phase === 'sleeping' || telemetry.phase === 'recreation') {
          restingWorkers.push({
            id: role,
            name: cfg?.name || role,
            emoji: cfg?.emoji || '👨‍🌾',
            shift: telemetry.shiftType,
            phase: telemetry.phase,
            stamina: telemetry.stamina,
            wellRested: telemetry.isWellRested,
            isExhausted: telemetry.isExhausted,
            timeRemainingFormatted: telemetry.timeRemainingFormatted,
            canCallOvertime: telemetry.canCallOvertime,
            overtimeCostCoins: telemetry.overtimeCostCoins,
            dialogue: telemetry.dialogueSnippet,
            isSpecialist: false,
            hydrationState: hydrationTelemetry.state,
            hydrationBadgeEmoji: telemetry.hydrationBadgeEmoji,
            hydrationBadgeText: telemetry.hydrationBadgeText,
          });
        }
      }
    }
  }

  // Specialist Workers
  if (specialistWorkers) {
    for (const [sId, sp] of Object.entries(specialistWorkers)) {
      if (sp?.isHired) {
        occupiedCount++;
        const meta = LIVESTOCK_WORKER_ROSTER.find(r => r.id === sId);
        const baseWage = WORKER_UPKEEP_ROSTER[sId]?.baseDailyWage || 20;
        const telemetry = getWorkerScheduleTelemetry({
          worker: sp,
          roleOrId: sId,
          baseDailyWage: baseWage,
          timestamp: now,
          epochStart: farmEpochStart,
          bunkhouseLevel: currentLevel,
          hydrationState: hydrationTelemetry.state,
        });

        if (telemetry.phase === 'sleeping' || telemetry.phase === 'recreation') {
          restingWorkers.push({
            id: sId,
            name: meta?.name || sId,
            emoji: meta?.avatar || '🐾',
            shift: telemetry.shiftType,
            phase: telemetry.phase,
            stamina: telemetry.stamina,
            wellRested: telemetry.isWellRested,
            isExhausted: telemetry.isExhausted,
            timeRemainingFormatted: telemetry.timeRemainingFormatted,
            canCallOvertime: telemetry.canCallOvertime,
            overtimeCostCoins: telemetry.overtimeCostCoins,
            dialogue: telemetry.dialogueSnippet,
            isSpecialist: true,
            hydrationState: hydrationTelemetry.state,
            hydrationBadgeEmoji: telemetry.hydrationBadgeEmoji,
            hydrationBadgeText: telemetry.hydrationBadgeText,
          });
        }
      }
    }
  }

  const expandCost = Math.round(capacity * 250);
  const canAffordExpand = coins >= expandCost;

  let canAffordUpgrade = false;
  let materialAvailable = 0;
  let hasMaterial = true;
  if (nextTierMeta) {
    canAffordUpgrade = coins >= nextTierMeta.coinCost;
    if (nextTierMeta.materialCostItem && nextTierMeta.materialCostQty) {
      materialAvailable = barn[nextTierMeta.materialCostItem] || 0;
      hasMaterial = materialAvailable >= nextTierMeta.materialCostQty;
    }
  }

  return (
    <div className="rounded-2xl border border-amber-600/30 bg-gradient-to-b from-stone-900/95 via-stone-900/90 to-amber-950/20 p-5 shadow-xl backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">🛏️</span>
            <h3 className="font-extrabold text-lg sm:text-xl text-amber-300 tracking-wide flex items-center gap-2">
              Farm Bunkhouse & Living Quarters
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
              Level {currentLevel}: {currentTierMeta.badge}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Workers retire here to rest, restore stamina, and prepare for upcoming 8-hour field shifts.
          </p>
        </div>

        {/* Occupancy Readout & Capacity Expansion */}
        <div className="flex items-center gap-2.5 bg-stone-900 border border-stone-800 px-3.5 py-2 rounded-xl shadow-inner self-start sm:self-auto">
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
              Bunkhouse Capacity
            </div>
            <div className="text-sm font-black text-amber-300 flex items-center gap-1.5">
              <span>🛏️</span>
              <span>
                {occupiedCount} / {capacity} Beds Occupied
              </span>
            </div>
          </div>
          <button
            onClick={() => expandBunkhouseCapacity()}
            disabled={!canAffordExpand}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title={`Expand bunkhouse by +2 beds (Cost: 🪙${expandCost.toLocaleString()})`}
          >
            +2 Beds (🪙{expandCost})
          </button>
        </div>
      </div>

      {/* Accommodation Upgrade Feature Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Accommodation Info */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-stone-900/70 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-stone-300 flex items-center gap-2">
              <span className="text-lg">🪶</span>
              <span>{currentTierMeta.name}</span>
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Active Perk
            </span>
          </div>
          <p className="text-xs text-stone-400">{currentTierMeta.description}</p>
          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs font-medium text-emerald-300 flex items-center gap-2">
            <span>✨</span>
            <span>{currentTierMeta.perkDescription}</span>
          </div>
        </div>

        {/* Upgrade Callout */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/30 to-stone-900 border border-amber-500/30 flex flex-col justify-between space-y-2">
          {nextTierMeta ? (
            <>
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Next Upgrade (Level {nextTierMeta.level})
                </div>
                <div className="text-sm font-black text-amber-200 mt-0.5">{nextTierMeta.name}</div>
                <p className="text-[11px] text-stone-400 mt-1">{nextTierMeta.perkDescription}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-800">
                <div className="flex items-center justify-between text-xs text-stone-300 font-semibold">
                  <span>Coins:</span>
                  <span className={canAffordUpgrade ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                    🪙 {nextTierMeta.coinCost.toLocaleString()}
                  </span>
                </div>
                {nextTierMeta.materialCostItem && nextTierMeta.materialCostQty && (
                  <div className="flex items-center justify-between text-xs text-stone-300 font-semibold">
                    <span>
                      {ITEM_CATALOG_META[nextTierMeta.materialCostItem]?.name || nextTierMeta.materialCostItem}:
                    </span>
                    <span className={hasMaterial ? 'text-emerald-400' : 'text-amber-400 font-bold'}>
                      {materialAvailable} / {nextTierMeta.materialCostQty}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => upgradeBunkhouse()}
                  disabled={!canAffordUpgrade || !hasMaterial}
                  className="w-full mt-1 py-1.5 px-3 rounded-lg text-xs font-black bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:from-stone-700 disabled:to-stone-800 text-white shadow-md shadow-amber-950/40 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  Upgrade Accommodations
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-2">
              <span className="text-2xl">👑</span>
              <span className="text-xs font-bold text-amber-300 mt-1">Maximum Lodgings Achieved</span>
              <span className="text-[10px] text-stone-400">Master accommodations active for all farm staff.</span>
            </div>
          )}
        </div>
      </div>

      {/* Worker Hydration Metabolism & Thirst Command Deck */}
      <div className="rounded-xl border border-sky-600/30 bg-gradient-to-b from-stone-900/90 via-sky-950/20 to-stone-900/90 p-4 space-y-4 shadow-lg">
        {/* Header + Status Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-bounce">🚰</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm sm:text-base text-sky-300 tracking-wide">
                  Staff Hydration & Climate-Coupled Thirst Station
                </h4>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-xs ${
                    hydrationTelemetry.state === 'cold_infused'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 animate-pulse'
                      : hydrationTelemetry.state === 'dehydrated'
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  }`}
                >
                  {hydrationTelemetry.badgeEmoji} {hydrationTelemetry.badgeText}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Staff drink clean water from the estate's closed-loop reservoirs. Soft performance penalties prevent death spirals.
              </p>
            </div>
          </div>

          {/* Climate & Perspiration Rate Badge */}
          <div className="flex items-center gap-3 bg-stone-950/80 border border-sky-500/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <div className="text-right">
              <div className="text-[9px] uppercase font-bold text-sky-400">
                Ambient Climate: {ambientTemp.toFixed(1)}°C
              </div>
              <div className="text-xs font-mono font-bold text-stone-200">
                {hydrationTelemetry.climateLabel} ({hydrationTelemetry.intakeMultiplier}x Perspiration)
              </div>
            </div>
            <span className="text-xl">
              {ambientTemp > 38 ? '🔥' : ambientTemp >= 27 ? '☀️' : '🌤️'}
            </span>
          </div>
        </div>

        {/* Dual Reservoir Gauges & Beverage Cold-Storage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Bunkhouse Canteen Cooler */}
          <div className="p-3 rounded-xl bg-stone-900/80 border border-sky-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-sky-300 flex items-center gap-1.5">
                <span>🥛</span>
                <span>Staff Canteen Cooler</span>
              </span>
              <span className="font-mono text-stone-300">
                {Math.round(canteenLiters)} / {canteenCap} L
              </span>
            </div>
            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  canteenLiters <= 0
                    ? 'bg-rose-500'
                    : canteenLiters < 25
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-sky-400 to-cyan-400'
                }`}
                style={{ width: `${Math.min(100, (canteenLiters / canteenCap) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-stone-400">Primary staff dispenser</span>
              <button
                onClick={() => refillStaffCanteen(50)}
                disabled={towerLiters <= 0 || canteenLiters >= canteenCap}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/40 disabled:opacity-40 transition-all cursor-pointer"
                title="Transfer +50L clean water from Elevated Gravity Tower"
              >
                +50L from Tower
              </button>
            </div>
          </div>

          {/* 2. Elevated Gravity Tower */}
          <div className="p-3 rounded-xl bg-stone-900/80 border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-blue-300 flex items-center gap-1.5">
                <span>🗼</span>
                <span>Elevated Gravity Tower</span>
              </span>
              <span className="font-mono text-stone-300">
                {Math.round(towerLiters)} / {towerCap} L
              </span>
            </div>
            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  towerLiters <= 0
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${Math.min(100, (towerLiters / towerCap) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-1 text-[10px] text-stone-400">
              <span>Automatic backup source</span>
              <span className={towerLiters > 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
                {towerLiters > 0 ? 'Online & Flowing' : 'Tower Empty (0L)'}
              </span>
            </div>
          </div>

          {/* 3. Chilled Cold Beverages */}
          <div className="p-3 rounded-xl bg-stone-900/80 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-cyan-300 flex items-center gap-1.5">
                <span>🧊</span>
                <span>Cold Citrus Tea Cooler</span>
              </span>
              <span className="font-mono text-cyan-200 font-black">
                {Math.round(coldInfusedDrinks)} Servings
              </span>
            </div>
            <div className="text-[10px] text-stone-400">
              Grants <b className="text-cyan-300">+15% Work Velocity</b> & <b>100% Heatwave Immunity</b>.
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-stone-400">Barn: {teaInBarn}x Tea</span>
              <button
                onClick={() => stockColdBeverage(5)}
                disabled={teaInBarn <= 0}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 disabled:opacity-40 transition-all cursor-pointer"
                title="Stock +5 Citrus Herb Tea portions from Barn"
              >
                +5 Chilled Drinks
              </button>
            </div>
          </div>
        </div>

        {/* Automation Toggles */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-stone-800 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Night Watch Auto */}
            <button
              onClick={() => toggleNightWatchWaterAutomation()}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-950/80 border border-stone-800 hover:border-sky-500/50 transition-all cursor-pointer"
            >
              <span className={nightWatchAuto ? 'text-emerald-400 font-bold' : 'text-stone-500'}>
                {nightWatchAuto ? '☑' : '☐'}
              </span>
              <span className="text-[11px] text-stone-300 font-medium">
                🌙 Night Watch Replenishment Automation
              </span>
            </button>

            {/* Tower Auto-Refill */}
            <button
              onClick={() => toggleCanteenAutoRefill()}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-950/80 border border-stone-800 hover:border-sky-500/50 transition-all cursor-pointer"
            >
              <span className={autoRefillTower ? 'text-emerald-400 font-bold' : 'text-stone-500'}>
                {autoRefillTower ? '☑' : '☐'}
              </span>
              <span className="text-[11px] text-stone-300 font-medium">
                🗼 Gravity Tower Auto-Top-Off (&lt;30%)
              </span>
            </button>
          </div>

          <div className="text-[10px] text-stone-400 font-mono">
            Intake: {hydrationTelemetry.intakeLitersPerShift.toFixed(1)} L / 8h shift
          </div>
        </div>
      </div>

      {/* Sleeping & Resting Staff Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-stone-300 flex items-center gap-2">
            <span>💤</span>
            <span>Resting Farm Staff ({restingWorkers.length} currently off-duty)</span>
          </h4>
          <span className="text-[11px] text-stone-400">
            Stamina automatically replenishes to 100% during sleep
          </span>
        </div>

        {restingWorkers.length === 0 ? (
          <div className="p-6 rounded-xl bg-stone-900/40 border border-stone-800 text-center text-stone-400 text-xs">
            <span>All hired workers are currently active on field duty shifts! 🌾</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {restingWorkers.map(w => {
              const isSleeping = w.phase === 'sleeping';
              const isDehydrated = w.hydrationState === 'dehydrated';
              return (
                <div
                  key={w.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
                    isSleeping
                      ? 'bg-gradient-to-b from-indigo-950/30 to-stone-900 border-indigo-500/30'
                      : 'bg-gradient-to-b from-amber-950/20 to-stone-900 border-amber-500/30'
                  }`}
                >
                  <div>
                    {/* Top Row: Avatar + Name + Phase Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{w.emoji}</span>
                        <div>
                          <div className="font-bold text-xs text-stone-200 truncate max-w-[130px]">
                            {w.name}
                          </div>
                          <div className="text-[10px] text-stone-400 capitalize">
                            {w.shift} Shift Roster
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border whitespace-nowrap ${
                          isSleeping
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {isSleeping ? '🌙 Sleeping' : '☕ Recreation'}
                      </span>
                    </div>

                    {/* Dialogue / State snippet */}
                    <p className="text-[10px] text-stone-400 italic mt-1.5">{w.dialogue}</p>

                    {/* Stamina Restoration Progress Bar */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-stone-300">
                        <span className="flex items-center gap-1">
                          <span>⚡ Stamina:</span>
                          <span className={w.stamina >= 100 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                            {w.stamina}%
                          </span>
                        </span>
                        <span className="text-stone-400 font-mono text-[9px]">
                          {isSleeping ? `Wakes in ${w.timeRemainingFormatted}` : `Rest in ${w.timeRemainingFormatted}`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            w.stamina >= 100
                              ? 'bg-gradient-to-r from-emerald-400 to-green-400'
                              : 'bg-gradient-to-r from-amber-400 to-yellow-300'
                          }`}
                          style={{ width: `${w.stamina}%` }}
                        />
                      </div>
                    </div>

                    {/* Hydration & Rest Buffs / Debuffs */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {w.hydrationBadgeText && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                            w.hydrationState === 'cold_infused'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 animate-pulse'
                              : w.hydrationState === 'dehydrated'
                              ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 animate-pulse'
                              : 'bg-sky-500/15 text-sky-300 border-sky-400/30'
                          }`}
                        >
                          {w.hydrationBadgeEmoji} {w.hydrationBadgeText}
                        </span>
                      )}
                      {w.wellRested && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ✨ Well-Rested (+15% Speed)
                        </span>
                      )}
                      {w.isExhausted && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                          ⚠️ Exhausted (60% Speed)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Overtime Button */}
                  <div className="pt-2 border-t border-stone-800/80">
                    <button
                      onClick={() => callEmergencyOvertime(w.id)}
                      disabled={!w.canCallOvertime || isDehydrated}
                      className="w-full py-1 px-2 rounded-lg text-[10px] font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 disabled:opacity-40 disabled:hover:bg-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      title={
                        isDehydrated
                          ? 'Worker is parched and dehydrated! Refill staff canteen or tower to restore sprint capacity.'
                          : w.isExhausted
                          ? 'Worker is exhausted from consecutive overtime shifts!'
                          : `Wake worker immediately for 4h shift (-🪙${w.overtimeCostCoins} coins + snack)`
                      }
                    >
                      <span>{isDehydrated ? '🥵' : '☕'}</span>
                      <span>
                        {isDehydrated ? 'Dehydrated (No Sprint)' : `Call Overtime (-🪙${w.overtimeCostCoins})`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
