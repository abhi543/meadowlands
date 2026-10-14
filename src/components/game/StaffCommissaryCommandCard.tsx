'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { calculateStaffUpkeep, FOOD_CATEGORY_INFO, type FoodCategory } from '@/data/workerUpkeep';
import { PayrollFundingModal } from './PayrollFundingModal';
import { StaffPantryRestockDeck } from './StaffPantryRestockDeck';

export function StaffCommissaryCommandCard() {
  const {
    payrollVaultCoins,
    staffPantry,
    unifiedWorkers,
    specialistWorkers,
    lastSettlementTimestamp,
    processSettlementCycle,
  } = useGameStore();

  const [fundingModalOpen, setFundingModalOpen] = useState(false);
  const [pantryDeckOpen, setPantryDeckOpen] = useState(false);
  const [remainingSec, setRemainingSec] = useState(90);

  const SETTLEMENT_INTERVAL_SEC = 90;

  // Countdown timer calculation
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const last = lastSettlementTimestamp || now;
      const elapsedSec = Math.floor((now - last) / 1000);
      const rem = Math.max(0, SETTLEMENT_INTERVAL_SEC - (elapsedSec % SETTLEMENT_INTERVAL_SEC));
      setRemainingSec(rem);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastSettlementTimestamp]);

  const telemetry = calculateStaffUpkeep(
    unifiedWorkers,
    specialistWorkers,
    payrollVaultCoins,
    staffPantry
  );

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = ((SETTLEMENT_INTERVAL_SEC - remainingSec) / SETTLEMENT_INTERVAL_SEC) * 100;

  const runway = telemetry.operationalRunwayDays;
  const isHealthy = runway >= 3;
  const isWarning = runway >= 1 && runway < 3;
  const isCritical = runway < 1;

  return (
    <>
      <div className="bg-gradient-to-b from-stone-900/95 via-stone-900/90 to-stone-950/95 rounded-2xl border border-amber-500/35 p-4 sm:p-5 shadow-xl shadow-amber-950/20 backdrop-blur-md space-y-4">
        {/* Top Header & Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
              🏛️
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-amber-300 tracking-wide">
                  Staff Commissary & Payroll Vault
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                  Staged Survival Buffer
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Isolated operational buffer. Workers draw wages and rations strictly from these staged reserves.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs bg-stone-800/80 border border-stone-700/60 px-3 py-1 rounded-xl text-stone-300 font-bold">
              Active Staff: <b className="text-amber-400">{telemetry.activeStaffCount}</b>
            </span>
          </div>
        </div>

        {/* Center Telemetry Bar (The Limiting Factor Indicator & Settlement Cycle Progress) */}
        <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-stone-400">Survival Runway:</span>
              <div
                className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs border ${
                  isHealthy
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : isWarning
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-red-500/15 border-red-500/40 text-red-300 animate-pulse'
                }`}
              >
                <span>{isHealthy ? '🟢' : isWarning ? '🟡' : '🔴'}</span>
                <span>
                  Operational Buffer: {runway === 999 ? 'Fully Stocked' : `${runway.toFixed(1)} Days`}
                </span>
                {telemetry.limitingFactor !== 'none' && (
                  <span className="opacity-80 font-semibold text-[11px]">
                    ({telemetry.limitingFactor === 'coins' ? '⚠️ Restock Coins' : telemetry.limitingFactor === 'food' ? '⚠️ Restock Food' : 'Balanced'})
                  </span>
                )}
              </div>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-400">⏳ Settlement In:</span>
              <span className="font-mono font-black text-amber-300 bg-stone-900 border border-stone-700 px-2 py-0.5 rounded-md">
                {formatCountdown(remainingSec)}
              </span>
              <button
                type="button"
                onClick={() => processSettlementCycle()}
                className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-400 border border-stone-700 transition-all cursor-pointer"
                title="Trigger immediate cycle settlement now"
              >
                ⚡ Settle Now
              </button>
            </div>
          </div>

          {/* Settlement Countdown Progress Bar */}
          <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Executive Dashboard: Left Wing (Wage Vault) & Right Wing (Staff Pantry) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Wing (Wage Vault) */}
          <div className="p-4 rounded-xl border border-amber-500/25 bg-gradient-to-b from-stone-950/70 to-stone-900/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <h4 className="font-extrabold text-sm text-amber-200">Payroll Wage Vault</h4>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    telemetry.coinRunwayDays >= 2
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : telemetry.coinRunwayDays >= 1
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-red-500/15 border-red-500/30 text-red-300'
                  }`}
                >
                  {telemetry.coinRunwayDays === Infinity ? '0 Active Wages' : `${telemetry.coinRunwayDays.toFixed(1)} Days Funded`}
                </span>
              </div>

              {/* Staged Coin Display */}
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  🪙 {(payrollVaultCoins || 0).toLocaleString()}
                </span>
                <span className="text-xs text-stone-400 font-medium">Staged in Vault</span>
              </div>

              {/* Burn Rate & Guild Tax Breakdown */}
              <div className="mt-2.5 p-2 rounded-lg bg-stone-950/60 border border-stone-800 text-[11px] space-y-1">
                <div className="flex justify-between font-bold text-stone-300">
                  <span>Daily Wage Burn:</span>
                  <span className="text-amber-400">{telemetry.totalDailyWageBurn.toLocaleString()} Coins / Day</span>
                </div>
                <div className="flex justify-between text-stone-400 text-[10px]">
                  <span>Base Wages:</span>
                  <span>{telemetry.baseDailyPayroll.toLocaleString()} coins</span>
                </div>
                <div className="flex justify-between text-stone-400 text-[10px]">
                  <span>Guild Tax ({Math.round(telemetry.guildTaxRate * 100)}%):</span>
                  <span className="text-amber-400">+{telemetry.guildTaxAmount.toLocaleString()} coins</span>
                </div>
              </div>
            </div>

            {/* Left Wing Controls */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFundingModalOpen(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all active:scale-95 cursor-pointer text-center"
              >
                📥 Deposit Coins
              </button>
              <button
                type="button"
                onClick={() => setFundingModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs border border-stone-700 transition-all cursor-pointer"
              >
                📤 Withdraw
              </button>
            </div>
          </div>

          {/* Right Wing (Staff Pantry) */}
          <div className="p-4 rounded-xl border border-emerald-500/25 bg-gradient-to-b from-stone-950/70 to-stone-900/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍲</span>
                  <h4 className="font-extrabold text-sm text-emerald-300">Staff Commissary Pantry</h4>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    telemetry.foodRunwayDays >= 2
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : telemetry.foodRunwayDays >= 1
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-red-500/15 border-red-500/30 text-red-300'
                  }`}
                >
                  {telemetry.foodRunwayDays === Infinity ? '0 Demand' : `${telemetry.foodRunwayDays.toFixed(1)} Days Stored`}
                </span>
              </div>

              {/* Staged Food Breakdown by Category */}
              <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                {(['crop', 'dairy', 'protein', 'meal'] as FoodCategory[]).map((cat) => {
                  const info = FOOD_CATEGORY_INFO[cat];
                  const staged = telemetry.stagedFoodUnitsByCategory[cat] || 0;
                  const req = telemetry.dailyFoodDemands[cat] || 0;

                  return (
                    <div key={cat} className="p-2 rounded-xl bg-stone-950/70 border border-stone-800">
                      <div className="text-base">{info.icon}</div>
                      <div className="font-black text-sm text-amber-300 mt-0.5">{staged}</div>
                      <div className="text-[9px] text-stone-400 mt-0.5">
                        {req > 0 ? `Need: ${req}` : '0 Need'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Daily Consumption Demands */}
              <div className="mt-2.5 p-2 rounded-lg bg-stone-950/60 border border-stone-800 text-[11px] flex items-center justify-between text-stone-300">
                <span className="font-bold">Total Daily Rations:</span>
                <span className="font-semibold text-emerald-400">
                  {telemetry.totalDailyFoodUnits > 0
                    ? `${telemetry.totalDailyFoodUnits} units / cycle`
                    : '0 units needed'}
                </span>
              </div>
            </div>

            {/* Right Wing Action Control */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setPantryDeckOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <span>📦</span>
                <span>Open Pantry Restock Deck</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Funding Modal */}
      <PayrollFundingModal
        isOpen={fundingModalOpen}
        onClose={() => setFundingModalOpen(false)}
        dailyBurn={telemetry.totalDailyWageBurn}
      />

      {/* Pantry Restock Deck */}
      <StaffPantryRestockDeck
        isOpen={pantryDeckOpen}
        onClose={() => setPantryDeckOpen(false)}
      />
    </>
  );
}
