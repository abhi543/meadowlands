'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import {
  HighStakesContract,
  FACTION_REGISTRY,
  calculateEscrowTotalProgress,
  calculateScrapLiquidationValue,
  ContractFactionId,
} from '@/game/highStakesContractEngine';
import {
  isItemPerishable,
  getFreshnessMeta,
  formatDecayCountdown,
  PERISHABLE_DEFINITIONS,
  calculateFreshnessPercent,
  getFreshnessTier,
} from '@/game/freshnessEngine';
import { getTowerLoadSheddingStage } from '@/game/hydraulicFailSafeEngine';
import { FreshnessBadge } from './FreshnessBadge';

export function HighStakesContractDeck() {
  const {
    highStakesContracts = [],
    factionReputation = { royal_crown: 25, paleo_guild: 30, mercantile_caravan: 40 },
    silo,
    barn,
    hydrology,
    crownSeedLockUntil,
    guildHazardCyclesRemaining,
    mercantileCooldownUntil,
    perishableBatches = {},
    loadContractEscrow,
    siphonTowerWaterToEscrow,
    finalizeContractShipment,
    forfeitContract,
  } = useGameStore();

  const [activeFactionTab, setActiveFactionTab] = useState<ContractFactionId>('royal_crown');
  const [forfeitModalContract, setForfeitModalContract] = useState<HighStakesContract | null>(null);
  const [now, setNow] = useState(Date.now());
  const [actionFeedback, setActionFeedback] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  // Real-time ticking interval
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentContract = highStakesContracts.find(c => c.factionId === activeFactionTab) || highStakesContracts[0];
  const factionDef = currentContract ? FACTION_REGISTRY[currentContract.factionId] : FACTION_REGISTRY.royal_crown;

  const currentRep = factionReputation[activeFactionTab] ?? 25;
  const towerLiters = hydrology?.towerLiters ?? 650;
  const towerCapacity = hydrology?.towerCapacityLiters ?? 800;

  // Active sanction checks
  const isCrownEmbargoActive = activeFactionTab === 'royal_crown' && crownSeedLockUntil > now;
  const crownEmbargoSec = Math.max(0, Math.round((crownSeedLockUntil - now) / 1000));

  const isGuildPenaltyActive = activeFactionTab === 'paleo_guild' && guildHazardCyclesRemaining > 0;

  const isMercantileCooldownActive = activeFactionTab === 'mercantile_caravan' && mercantileCooldownUntil > now;
  const mercantileCooldownSec = Math.max(0, Math.round((mercantileCooldownUntil - now) / 1000));

  const handleEscrowLoad = (contractId: string, slotId: string) => {
    const res = loadContractEscrow(contractId, slotId);
    setActionFeedback({ id: slotId, success: res.success, msg: res.message });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleWaterSiphon = (contractId: string, liters: number) => {
    const res = siphonTowerWaterToEscrow(contractId, liters);
    setActionFeedback({ id: 'slot_water', success: res.success, msg: res.message });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleFinalizeShipment = (contractId: string) => {
    const res = finalizeContractShipment(contractId);
    setActionFeedback({ id: 'finalize', success: res.success, msg: res.message });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleConfirmForfeit = (contract: HighStakesContract) => {
    forfeitContract(contract.id);
    setForfeitModalContract(null);
  };

  if (!currentContract) {
    return (
      <div className="p-8 text-center bg-stone-900 rounded-2xl border border-stone-800 text-stone-400">
        No high-stakes contracts currently available.
      </div>
    );
  }

  const { percent, loadedUnits, totalUnits, isComplete } = calculateEscrowTotalProgress(currentContract);
  const remainingSec = Math.max(0, Math.round((currentContract.expiresAt - now) / 1000));
  const isUrgent = remainingSec < 180; // under 3 minutes

  // Format countdown
  const hours = Math.floor(remainingSec / 3600);
  const minutes = Math.floor((remainingSec % 3600) / 60);
  const seconds = remainingSec % 60;
  const timeFormatted = hours > 0
    ? `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
    : `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

  // Water requirement check
  const waterSlot = currentContract.manifest.find(s => s.isWaterSlot || s.itemId === 'gravity_tower_water');
  const neededWater = waterSlot ? waterSlot.requiredQuantity - waterSlot.escrowQuantity : 0;
  const projectedTowerLitersAfterSiphon = waterSlot ? Math.max(0, towerLiters - neededWater) : towerLiters;
  const projectedStage = getTowerLoadSheddingStage(projectedTowerLitersAfterSiphon, towerCapacity);

  return (
    <div className="space-y-4">
      {/* Faction Navigation Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['royal_crown', 'paleo_guild', 'mercantile_caravan'] as ContractFactionId[]).map(fId => {
          const f = FACTION_REGISTRY[fId];
          const isActive = activeFactionTab === fId;
          const rep = factionReputation[fId] ?? 25;
          const contract = highStakesContracts.find(c => c.factionId === fId);
          const cProg = contract ? calculateEscrowTotalProgress(contract) : { percent: 0 };

          return (
            <button
              key={fId}
              onClick={() => setActiveFactionTab(fId)}
              className={`px-4 py-3 rounded-2xl border transition-all text-left flex items-center gap-3 shrink-0 cursor-pointer ${
                isActive
                  ? `${f.accentBorder} bg-gradient-to-r ${f.headerGradient} shadow-lg ring-2`
                  : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800 text-stone-400'
              }`}
            >
              <span className="text-2xl">{f.emblem}</span>
              <div>
                <div className="flex items-center gap-2">
                  <div className={`font-black text-xs ${isActive ? 'text-white' : 'text-stone-300'}`}>
                    {f.name}
                  </div>
                  {cProg.percent === 100 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-stone-950 animate-pulse">
                      READY TO SHIP
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                  <span>Standing: <strong className={rep >= 50 ? 'text-amber-300' : rep >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{rep}</strong></span>
                  <span>•</span>
                  <span>Escrow: {cProg.percent}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Faction Sanctions Warning Banner */}
      {isCrownEmbargoActive && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2.5 animate-pulse">
          <span className="text-lg">👑</span>
          <div className="flex-1">
            <strong>Imperial Embargo Active:</strong> His Majesty’s Court has sanctioned your estate due to contract forfeiture. Premium Imperial Seeds are embargoed for <strong>{formatDecayCountdown(crownEmbargoSec)}</strong>.
          </div>
        </div>
      )}

      {isGuildPenaltyActive && (
        <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs flex items-center gap-2.5">
          <span className="text-lg">🦖</span>
          <div className="flex-1">
            <strong>Guild Trust Deficit:</strong> Frontier Paleontological Guild trust breach active. All Frontier Trail expeditions suffer <strong>+25% hazard peril</strong> ({guildHazardCyclesRemaining} cycles remaining).
          </div>
        </div>
      )}

      {isMercantileCooldownActive && (
        <div className="p-3 rounded-xl bg-stone-900 border border-amber-600/50 text-amber-300 text-xs flex items-center gap-2.5">
          <span className="text-lg">🚚</span>
          <div className="flex-1">
            <strong>Mercantile Rescission Cooldown:</strong> Caravan slot delayed due to shipment breach. Slot refreshes in <strong>{formatDecayCountdown(mercantileCooldownSec)}</strong>.
          </div>
        </div>
      )}

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
          actionFeedback.success
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/70 shadow-lg shadow-emerald-950/50'
            : 'bg-rose-950/90 text-rose-200 border-rose-500/70 shadow-lg shadow-rose-950/50'
        }`}>
          <span>{actionFeedback.success ? '✅' : '⚠️'}</span>
          <span>{actionFeedback.msg}</span>
        </div>
      )}

      {/* Main Contract Card */}
      <div className={`rounded-3xl border transition-all p-5 sm:p-6 shadow-2xl relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900/95 to-black ${factionDef.accentBorder}`}>
        {/* Subtle Ambient Background Gradient */}
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 bg-gradient-to-br ${factionDef.themeColor}`} />

        {/* 1. Header: Faction Emblem, Title, Difficulty Rating & Urgent Timer */}
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-black/60 border border-stone-700 flex items-center justify-center text-3xl shadow-inner shrink-0">
              {factionDef.emblem}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-stone-300 border border-white/15">
                  {factionDef.name}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  currentContract.difficulty === 'hazard'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : currentContract.difficulty === 'demanding'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {currentContract.difficultyLabel}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
                {currentContract.title}
              </h2>
              <p className="text-xs text-stone-400 max-w-xl mt-0.5">
                {factionDef.description}
              </p>
            </div>
          </div>

          {/* Urgent Ticking Countdown Timer */}
          <div className="shrink-0 flex items-center gap-3 w-full md:w-auto justify-between md:justify-end bg-black/50 border border-stone-800 rounded-2xl px-4 py-2.5 shadow-inner">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                Departure Deadline
              </div>
              <div className={`text-base sm:text-lg font-black font-mono tracking-tight flex items-center gap-1.5 ${
                isUrgent ? 'text-rose-400 animate-pulse' : 'text-amber-300'
              }`}>
                <span>⏱️</span>
                <span>{timeFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Client Faction Reputation Meter */}
        <div className="py-3.5 border-b border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-400 font-bold">Client Standing:</span>
            <span className={`font-black ${currentRep >= 50 ? 'text-amber-300' : currentRep >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentRep > 0 ? `+${currentRep}` : currentRep} Standing ({currentRep >= 75 ? 'Exalted Courtier' : currentRep >= 35 ? 'Trusted Contractor' : currentRep >= 0 ? 'Standard Partner' : 'Probationary Deficit'})
            </span>
          </div>

          <div className="w-full sm:w-64 bg-stone-950 rounded-full h-2.5 overflow-hidden border border-stone-800">
            <div
              className={`h-full transition-all rounded-full ${
                currentRep >= 50
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : currentRep >= 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                  : 'bg-gradient-to-r from-rose-700 to-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, ((currentRep + 100) / 200) * 100))}%` }}
            />
          </div>
        </div>

        {/* 3. Escrow Shipping Crate Manifest Grid */}
        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-stone-200">
                📦 Escrow Shipping Crate Manifest
              </h3>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700">
                All-or-Nothing Loading
              </span>
            </div>
            <div className="text-xs font-mono text-stone-300">
              <strong className={percent === 100 ? 'text-emerald-400' : 'text-amber-400'}>{loadedUnits}</strong> / {totalUnits} Units Loaded ({percent}%)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentContract.manifest.map(slot => {
              const isCrop = slot.itemId in silo;
              const isWater = slot.isWaterSlot || slot.itemId === 'gravity_tower_water';
              const stock = isWater ? towerLiters : (isCrop ? (silo[slot.itemId] || 0) : (barn[slot.itemId] || 0));
              const isSlotComplete = slot.escrowQuantity >= slot.requiredQuantity;
              const needed = Math.max(0, slot.requiredQuantity - slot.escrowQuantity);

              // Freshness inspection for perishable items
              let availablePristine = 0;
              let bestFreshnessPct = 0;
              const batches = perishableBatches[slot.itemId] || [];
              const def = PERISHABLE_DEFINITIONS[slot.itemId];
              const maxLife = def?.baseDecayDurationSec || 900;

              for (const b of batches) {
                const pct = calculateFreshnessPercent(b.harvestedAt, b.maxLifetimeSec || maxLife, now);
                if (pct > bestFreshnessPct) bestFreshnessPct = pct;
                if (pct >= 85) availablePristine += b.quantity;
              }

              // Unbatched fallback defaults to Standard (70%)
              if (batches.length === 0 && isItemPerishable(slot.itemId) && stock > 0) {
                bestFreshnessPct = 70;
              }

              const bestTier = getFreshnessTier(bestFreshnessPct);

              return (
                <div
                  key={slot.slotId}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSlotComplete
                      ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-2xl shrink-0">
                          {slot.icon}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-white">
                            {slot.name}
                          </div>
                          <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                            {isWater ? `${slot.escrowQuantity} / ${slot.requiredQuantity} Liters` : `${slot.escrowQuantity} / ${slot.requiredQuantity} Units`}
                          </div>
                        </div>
                      </div>

                      {isSlotComplete ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-stone-950">
                          SECURED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-800 text-stone-300">
                          {needed} Needed
                        </span>
                      )}
                    </div>

                    {/* Freshness Requirement Badge */}
                    {slot.minFreshness && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          slot.minFreshness === 'pristine'
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                            : 'bg-blue-400/20 text-blue-300 border-blue-400/40'
                        }`}>
                          Requires: {slot.minFreshness === 'pristine' ? '★ Pristine (≥85%)' : 'Standard (≥40%)'}
                        </span>

                        {isItemPerishable(slot.itemId) && stock > 0 && (
                          <span className={`text-[10px] font-mono font-bold ${
                            bestFreshnessPct >= 85 ? 'text-emerald-400' : bestFreshnessPct >= 40 ? 'text-blue-400' : 'text-amber-400'
                          }`}>
                            Your Stock: {bestFreshnessPct}% ({bestTier.toUpperCase()})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-900 rounded-full h-1.5 mt-3 overflow-hidden border border-stone-800">
                      <div
                        className={`h-full transition-all ${
                          isSlotComplete ? 'bg-emerald-400' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, (slot.escrowQuantity / slot.requiredQuantity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stock Availability & Escrow Commit Button */}
                  <div className="mt-3 pt-2.5 border-t border-stone-850 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-stone-400">
                      Estate Stock: <strong className="text-white font-mono">{stock}{isWater ? 'L' : ''}</strong>
                    </div>

                    {!isSlotComplete && (
                      <button
                        type="button"
                        onClick={() => isWater ? handleWaterSiphon(currentContract.id, needed) : handleEscrowLoad(currentContract.id, slot.slotId)}
                        disabled={stock <= 0}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                          stock > 0
                            ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        <span>{isWater ? '💧 Siphon' : '📦 Escrow'}</span>
                        <span>{needed > 1 && stock >= needed ? 'All' : 'Item'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Direct Hydraulic Depletion Warning Ribbon (If water demanded) */}
        {waterSlot && (
          <div className="mt-2 p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/40 space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">💧</span>
                <div>
                  <div className="text-xs font-bold text-sky-200">
                    Elevated Gravity Tower Siphon Portal: {waterSlot.escrowQuantity} / {waterSlot.requiredQuantity}L Loaded
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono">
                    Current Tower Reserves: <strong className="text-sky-300">{Math.round(towerLiters)}L</strong> / {towerCapacity}L
                  </div>
                </div>
              </div>

              {waterSlot.escrowQuantity < waterSlot.requiredQuantity && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleWaterSiphon(currentContract.id, 50)}
                    disabled={towerLiters <= 0}
                    className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Siphon 50L
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWaterSiphon(currentContract.id, neededWater)}
                    disabled={towerLiters <= 0}
                    className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-stone-950 text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Siphon Full ({neededWater}L)
                  </button>
                </div>
              )}
            </div>

            {/* Load-Shedding Hazard Warning Tag */}
            {neededWater > 0 && projectedStage > 0 && (
              <div className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                projectedStage === 2
                  ? 'bg-rose-950 text-rose-300 border border-rose-500 animate-pulse'
                  : 'bg-amber-950 text-amber-300 border border-amber-500'
              }`}>
                <span>{projectedStage === 2 ? '🚨' : '⚠️'}</span>
                <span>
                  Hydraulic Impact Warning: Siphoning remaining {neededWater}L will reduce Tower to {projectedTowerLitersAfterSiphon}L, triggering {projectedStage === 2 ? 'Stage 2 (Crew Rationing)' : 'Stage 1 (Crop Conservation)'}!
                </span>
              </div>
            )}
          </div>
        )}

        {/* 5. Rewards & Stakes Breakdown */}
        <div className="mt-4 pt-3.5 border-t border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-stone-400">Completion Manifest Payout</div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono font-black text-amber-300 text-sm">
                +{currentContract.rewards.coins.toLocaleString()} Coins
                {currentContract.rewards.pristineBonusCoins && (
                  <span className="text-emerald-400 ml-1 text-xs font-bold">
                    (+{currentContract.rewards.pristineBonusCoins} Pristine Bonus)
                  </span>
                )}
              </span>
              <span className="font-mono text-purple-300 font-bold">+{currentContract.rewards.xp} XP</span>
              <span className="text-emerald-400 font-bold">+{currentContract.rewards.reputation} Faction Standing</span>

              {currentContract.rewards.bonusItems?.map((bi, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700 flex items-center gap-1">
                  <span>{bi.icon}</span>
                  <span>{bi.quantity}x {bi.name}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-rose-400">Failure / Abandonment Penalty</div>
            <div className="text-xs text-rose-300 font-medium">
              {currentContract.penalties.description}
            </div>
          </div>
        </div>

        {/* 6. Footer Controls: Finalize & Ship vs Forfeit */}
        <div className="mt-5 pt-4 border-t border-stone-850 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setForfeitModalContract(currentContract)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-800/50 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>⚠️</span>
            <span>Forfeit Contract</span>
          </button>

          <button
            type="button"
            onClick={() => handleFinalizeShipment(currentContract.id)}
            disabled={!isComplete}
            className={`px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xl flex items-center gap-2 cursor-pointer ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-stone-950 hover:scale-105 active:scale-95 ring-2 ring-emerald-300 shadow-emerald-500/30'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            <span>🚢</span>
            <span>{isComplete ? 'Finalize & Ship Shipment' : `Cargo Incomplete (${loadedUnits}/${totalUnits} Loaded)`}</span>
          </button>
        </div>
      </div>

      {/* Forfeit Confirmation Modal */}
      {forfeitModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-rose-500/60 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-base font-extrabold text-rose-300">
                  Confirm Contract Forfeiture & Liquidation
                </h3>
                <p className="text-xs text-stone-400">
                  {forfeitModalContract.title}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/50 border border-stone-800 text-xs text-stone-300 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <span>💥</span>
                <span>Immediate Liquidations & Penalties:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-stone-400 text-[11px]">
                <li>All committed escrow items and siphoned water are <strong className="text-rose-400">permanently lost</strong>.</li>
                <li>Committed cargo returns nominal 10% scrap compensation: <strong className="text-amber-300">+{calculateScrapLiquidationValue(forfeitModalContract)} Coins</strong>.</li>
                <li>Faction Standing Penalty: <strong className="text-rose-400">-{forfeitModalContract.penalties.reputationLoss} Standing</strong>.</li>
                <li>{forfeitModalContract.penalties.description}</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setForfeitModalContract(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-300 hover:bg-stone-800 transition-all cursor-pointer"
              >
                Abort & Keep Working
              </button>
              <button
                type="button"
                onClick={() => handleConfirmForfeit(forfeitModalContract)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 transition-all active:scale-95 cursor-pointer"
              >
                Confirm Forfeit & Liquidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
