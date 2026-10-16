'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';
import type { DeliveryOrder } from '@/game/deliveryData';
import {
  validateCaravanCargo,
  calculateCaravanSettlement,
  getBulkVolumeTierInfo,
} from '@/game/caravanLogistics';
import { calculateStaffUpkeep } from '@/data/workerUpkeep';

interface CaravanManifestBarProps {
  selectedOrders: DeliveryOrder[];
  onClearSelection: () => void;
  onDispatchSuccess?: () => void;
}

export function CaravanManifestBar({
  selectedOrders,
  onClearSelection,
  onDispatchSuccess,
}: CaravanManifestBarProps) {
  const {
    silo,
    barn,
    tradeStreak,
    lastTradeStreakTimestamp,
    clientReputation,
    relics,
    unifiedWorkers,
    specialistWorkers,
    payrollVaultCoins,
    staffPantry,
    dispatchBulkCaravan,
  } = useGameStore();

  const [route, setRoute] = useState<'safe' | 'wild'>('safe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManifestDetail, setShowManifestDetail] = useState(false);

  const now = Date.now();
  const streakValid = Boolean(lastTradeStreakTimestamp && (now - lastTradeStreakTimestamp <= 45 * 60 * 1000));
  const currentStreak = streakValid ? (tradeStreak || 0) : 0;

  const staffTelemetry = calculateStaffUpkeep(unifiedWorkers, specialistWorkers, payrollVaultCoins, staffPantry);
  const dailyPayrollBurnRate = staffTelemetry.baseDailyPayroll;

  const validation = validateCaravanCargo(selectedOrders, silo, barn);
  const settlement = calculateCaravanSettlement({
    orders: selectedOrders,
    currentStreak,
    now,
    clientReputation,
    relics,
    dailyPayrollRate: dailyPayrollBurnRate,
  });

  const volumeInfo = getBulkVolumeTierInfo(selectedOrders.length);

  const handleDispatch = () => {
    if (!validation.isValidCargo || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const orderIds = selectedOrders.map(o => o.id);
      const res = dispatchBulkCaravan(orderIds, route);
      setIsSubmitting(false);
      if (res.success) {
        onClearSelection();
        onDispatchSuccess?.();
      }
    }, 450);
  };

  if (selectedOrders.length === 0) return null;

  return (
    <div className="sticky bottom-3 z-40 w-full animate-in slide-in-from-bottom-3 duration-200">
      <div className="bg-stone-950/95 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl p-3.5 sm:p-4 text-stone-100 shadow-2xl shadow-black/80 ring-1 ring-amber-500/30">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-800">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-2xl p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 select-none">
              🚚
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
                  Bulk Freight Caravan:
                  <span className="text-amber-400 font-extrabold normal-case">
                    {selectedOrders.length} {selectedOrders.length === 1 ? 'Order' : 'Orders'} Staged
                  </span>
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {volumeInfo.tierTitle}
                </span>
                {settlement.streakLeapAchieved && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    ⚡ {settlement.streakLeapNotice}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                Cross-order inventory reservation active. Verified supplies will be hauled together.
              </p>
            </div>
          </div>

          {/* Route Mode & Toggle */}
          <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setRoute('safe')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                route === 'safe'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Safe Highroad: 100% Guaranteed cargo delivery without risk of tolls"
            >
              🛡️ Safe Road
            </button>
            <button
              onClick={() => setRoute('wild')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                route === 'wild'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Wild Pass: +25% Hazard Bounty Coins, but 15% chance of mountain toll"
            >
              🌲 Wild (+25% Bounty)
            </button>
          </div>
        </div>

        {/* Middle Section: Staged Cargo Manifest Pills */}
        <div className="py-2.5 border-b border-stone-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <span>📦</span>
              <span>Staged Cargo Manifest ({validation.totalUniqueItems} distinct items · {validation.totalItemUnits} units total)</span>
            </span>
            <button
              onClick={() => setShowManifestDetail(!showManifestDetail)}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
            >
              {showManifestDetail ? 'Hide Detail ▲' : 'Inspect All Items ▼'}
            </button>
          </div>

          {/* Horizontal Scroller of Staged Requisitions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
            {validation.demands.map(demand => (
              <div
                key={demand.itemId}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] shrink-0 border transition-all ${
                  demand.isSatisfied
                    ? 'bg-stone-900/90 border-stone-700/70 text-stone-200'
                    : 'bg-red-950/60 border-red-500/70 text-red-300 ring-1 ring-red-500/40 animate-pulse'
                }`}
                title={`${demand.name}: Need ${demand.totalRequired}, Available in ${demand.storageType.toUpperCase()} is ${demand.availableStock}`}
              >
                <span>{demand.icon}</span>
                <span className="font-bold">{demand.name}:</span>
                <span className={demand.isSatisfied ? 'text-emerald-400 font-mono font-bold' : 'text-red-400 font-mono font-bold'}>
                  {demand.totalRequired}
                </span>
                <span className="text-[9px] text-stone-400 font-mono">
                  ({demand.availableStock} in {demand.storageType})
                </span>
                {!demand.isSatisfied && (
                  <span className="text-[10px] font-bold text-red-400 ml-0.5">
                    ⚠️ Short {demand.deficit}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Validation Status Indicator */}
          {validation.isValidCargo ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-0.5">
              <span>✅</span>
              <span>All manifest supplies verified in Home Barn & Silo. Ready for full departure!</span>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-red-950/70 border border-red-500/60 text-xs text-red-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>INSUFFICIENT STOCK FOR COMBINED CARAVAN MANIFEST</span>
              </div>
              <p className="text-[11px] text-red-200/90">
                Separate orders demand the same supplies. Harvest missing goods or deselect conflicting contracts:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {validation.conflictingItems.map(c => (
                  <span
                    key={c.itemId}
                    className="px-2 py-0.5 rounded bg-red-900/60 border border-red-500/50 text-white font-mono text-[10px] font-bold"
                  >
                    {c.icon} {c.name}: Have {c.availableStock} / Need {c.totalRequired} (Short {c.deficit})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Items Drawer (Optional Expand) */}
        {showManifestDetail && (
          <div className="py-2 border-b border-stone-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-150">
            {validation.demands.map(d => (
              <div key={d.itemId} className="p-2 rounded-lg bg-stone-900/80 border border-stone-800 space-y-0.5">
                <div className="flex items-center justify-between font-bold text-stone-200">
                  <span className="flex items-center gap-1">
                    <span>{d.icon}</span>
                    <span>{d.name}</span>
                  </span>
                  <span className={d.isSatisfied ? 'text-emerald-400' : 'text-red-400'}>
                    {d.isSatisfied ? 'Ready' : `-${d.deficit}`}
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 flex justify-between">
                  <span>Req: {d.totalRequired}</span>
                  <span>Stock: {d.availableStock}</span>
                </div>
                <div className="text-[9px] text-stone-500 truncate">
                  Orders: {d.contributingOrderIds.length} contracts
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Financial Breakdown & Action Controls */}
        <div className="pt-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Itemized Financial Telemetry */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-300">
            <div>
              <span className="text-stone-400">Subtotal Base: </span>
              <span className="font-bold text-white font-mono">{settlement.subtotalBaseValue.toLocaleString()}c</span>
            </div>

            {settlement.bulkVolumeBonusPercent > 0 && (
              <div className="flex items-center gap-1 text-amber-400">
                <span>📦 Bulk Volume ({settlement.ordersCount}):</span>
                <span className="font-bold font-mono">+{settlement.bulkVolumeBonusPercent}% (+{settlement.bulkBonusCoins.toLocaleString()}c)</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-sky-400">
              <span>⚡ Velocity Streak:</span>
              <span className="font-bold font-mono">
                +{settlement.streakBonusPercent}% (+{settlement.streakBonusCoins.toLocaleString()}c)
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                [Streak: {settlement.advancedStreak}]
              </span>
            </div>

            {settlement.hasRushBounties && (
              <div className="flex items-center gap-1 text-red-400 font-bold">
                <span>🔥 Rush Bounty:</span>
                <span className="font-mono">+{settlement.rushBonusCoins.toLocaleString()}c (3x speed bonus)</span>
              </div>
            )}

            {settlement.rareFrontierDrops.length > 0 && (
              <div className="flex items-center gap-1 text-fuchsia-300 font-bold">
                <span>🎁 Frontier Drop:</span>
                <span>
                  {settlement.rareFrontierDrops.map(d => `${d.qty}x ${d.name} ${d.emoji}`).join(' & ')}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            <button
              onClick={onClearSelection}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all cursor-pointer active:scale-95"
            >
              ❌ Clear Selection
            </button>

            <button
              onClick={handleDispatch}
              disabled={!validation.isValidCargo || isSubmitting}
              className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                validation.isValidCargo && !isSubmitting
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-stone-950 shadow-amber-500/25 ring-2 ring-amber-400/50 cursor-pointer animate-pulse'
                  : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
              }`}
            >
              <span>{isSubmitting ? '⏳' : '🚀'}</span>
              <span>
                {isSubmitting
                  ? 'Caravan En Route...'
                  : `DISPATCH ENTIRE CARAVAN (${settlement.totalNetProceeds.toLocaleString()}c)`}
              </span>
              {settlement.totalBonusGoldEarned > 0 && (
                <span className="text-[10px] bg-stone-950/80 text-amber-300 font-bold px-1.5 py-0.5 rounded-full ml-1">
                  +{settlement.totalBonusGoldEarned.toLocaleString()}c Bonus!
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
