'use client';

import { useGameStore } from '@/game/store';
import {
  PARCEL_CONFIGS, PARCEL_ORDER, FACILITY_FOOTPRINTS,
  ESTATE_AURAS, getEstateAura,
  CROPS, PRODUCTS,
  type ParcelId, type ParcelState, type DebrisEntity,
} from '@/game/data';
import { useState } from 'react';

const DEBRIS_EMOJI: Record<DebrisEntity['type'], string> = {
  boulder: '\u{1FAA8}',
  stump: '\u{1F332}',
  brambles: '\u{1F33F}',
};

const DEBRIS_LABEL: Record<DebrisEntity['type'], string> = {
  boulder: 'Boulder',
  stump: 'Tree Stump',
  brambles: 'Brambles',
};

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return `${min}m ${sec}s`;
  const hr = Math.floor(min / 60);
  const rm = min % 60;
  return `${hr}h ${rm}m`;
}

function formatCoin(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function TerritoryMapView() {
  const {
    parcels, coins, gems, level,
    activeFreightContract, freightContractRefreshAt, currentEstateAura,
    silo, barn,
    unlockParcel, startClearingDebris,
    acceptFreightContract, fulfillFreightContract, failFreightContract, refreshFreightContract,
  } = useGameStore();

  const [selectedParcel, setSelectedParcel] = useState<ParcelId | null>(null);
  const [showFreightPanel, setShowFreightPanel] = useState(false);

  const parcelsClaimed = Object.values(parcels).filter(p => p.isUnlocked).length;
  const estateAura = currentEstateAura || getEstateAura(parcelsClaimed);

  // Freight contract helpers
  const portUnlocked = parcels.parcel_port_basin?.isUnlocked;
  const contract = activeFreightContract;
  const canFulfillContract = contract && contract.acceptedAt && !contract.completed && (() => {
    for (const req of contract.requirements) {
      const isCrop = req.itemId in CROPS || req.itemId === 'feed' || req.itemId === 'cotton' || req.itemId === 'honey_comb' || req.itemId === 'wild_berries' || req.itemId === 'gold_nugget';
      const storage = isCrop ? silo : barn;
      if ((storage[req.itemId] || 0) < req.qty) return false;
    }
    return true;
  })();

  const contractExpiresIn = contract?.acceptedAt
    ? Math.max(0, contract.expiresAt - Date.now())
    : 0;

  const now = Date.now();

  return (
    <div className="space-y-3">
      {/* Estate Aura Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 dark:from-amber-800 dark:via-orange-800 dark:to-red-800 rounded-xl p-3 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{estateAura.emoji}</span>
          <div className="flex-1">
            <div className="font-bold text-sm">{estateAura.title}</div>
            <div className="text-xs opacity-90">{estateAura.effect}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-bold">
            {parcelsClaimed}/{PARCEL_ORDER.length} Parcels
          </div>
        </div>
      </div>

      {/* Territory Map Grid */}
      <div className="bg-stone-100 dark:bg-gray-900 rounded-xl p-2 border border-stone-200 dark:border-gray-700">
        <h3 className="font-bold text-sm text-stone-700 dark:text-gray-200 mb-2 flex items-center gap-2">
          {'\u{1F5FA}'} Territory Map
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {PARCEL_ORDER.map(parcelId => {
            const config = PARCEL_CONFIGS[parcelId];
            const parcel = parcels[parcelId];
            const isUnlocked = parcel?.isUnlocked;
            const canUnlock = !isUnlocked && level >= config.levelReq && coins >= config.coinCost;
            const isSelected = selectedParcel === parcelId;
            const debrisCleared = parcel?.debris.filter(d => d.cleared).length || 0;
            const debrisTotal = parcel?.debris.length || 0;
            const allDebrisCleared = debrisTotal === 0 || debrisCleared === debrisTotal;

            return (
              <button
                key={parcelId}
                onClick={() => setSelectedParcel(isSelected ? null : parcelId)}
                className={`relative rounded-xl p-2.5 border-2 transition-all duration-200 text-left min-h-[100px] ${
                  isUnlocked
                    ? `bg-gradient-to-br ${config.bgGradient} ${config.color} border-stone-300 dark:border-gray-600 hover:border-stone-400 dark:hover:border-gray-500`
                    : canUnlock
                      ? 'bg-stone-200/60 dark:bg-gray-800/60 border-amber-400 dark:border-amber-600 hover:border-amber-500 cursor-pointer'
                      : 'bg-stone-300/40 dark:bg-gray-800/30 border-stone-300 dark:border-gray-700 opacity-70'
                } ${isSelected ? 'ring-2 ring-amber-400 scale-[1.02]' : ''}`}
              >
                {/* Cloud overlay for locked parcels */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-stone-400/20 dark:bg-gray-600/30 rounded-xl flex items-center justify-center">
                    <span className="text-3xl opacity-50">{'\u{2601}'}</span>
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">{isUnlocked ? config.emoji : '\u{1F512}'}</span>
                    <span className={`text-[11px] font-bold leading-tight ${isUnlocked ? config.color : 'text-stone-500 dark:text-gray-400'}`}>
                      {config.name}
                    </span>
                  </div>

                  {isUnlocked ? (
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-stone-600 dark:text-gray-400 italic">{config.uniqueFeature}</div>
                      {debrisTotal > 0 && (
                        <div className={`text-[10px] font-medium ${allDebrisCleared ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {'\u{1F9F9}'} Debris: {debrisCleared}/{debrisTotal}
                          {allDebrisCleared && ' \u2705'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        Lv {config.levelReq} {'\u2022'} {formatCoin(config.coinCost)} {'\u{1F4B0}'}
                      </div>
                      {level < config.levelReq ? (
                        <div className="text-[9px] text-red-500 dark:text-red-400">Need Level {config.levelReq}</div>
                      ) : coins < config.coinCost ? (
                        <div className="text-[9px] text-red-500 dark:text-red-400">Need {formatCoin(config.coinCost)} coins</div>
                      ) : (
                        <div className="text-[9px] text-green-600 dark:text-green-400 font-medium">Ready to unlock!</div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Parcel Detail */}
      {selectedParcel && (() => {
        const parcelId = selectedParcel;
        const config = PARCEL_CONFIGS[parcelId];
        const parcel = parcels[parcelId];
        const isUnlocked = parcel?.isUnlocked;
        const canUnlock = !isUnlocked && level >= config.levelReq && coins >= config.coinCost;

        return (
          <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-stone-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${config.bgGradient} dark:from-gray-800 dark:to-gray-800 px-4 py-3 border-b border-stone-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{config.emoji}</span>
                  <div>
                    <h3 className={`font-bold text-lg ${config.color}`}>{config.name}</h3>
                    <p className={`text-xs text-stone-600 dark:text-gray-400`}>
                      {isUnlocked ? 'Unlocked' : `Level ${config.levelReq} Required`}
                    </p>
                  </div>
                </div>
                {!isUnlocked && canUnlock && (
                  <button
                    onClick={() => { unlockParcel(parcelId); }}
                    className="px-4 py-2 text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-lg active:scale-95"
                  >
                    {'\u{1F513}'} Unlock ({formatCoin(config.coinCost)} {'\u{1F4B0}'})
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Unique Feature */}
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">{'\u{2728}'} Unique Land Feature</div>
                <div className="text-xs text-amber-600 dark:text-amber-400">{config.uniqueFeature}</div>
              </div>

              {/* Locked Capability */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">{'\u{1F511}'} Unlocks</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">{config.lockedCapability}</div>
              </div>

              {/* Debris Clearing (if unlocked) */}
              {isUnlocked && parcel.debris.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider mb-2">{'\u{1F9F9}'} Debris Clearing</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {parcel.debris.map(debris => {
                      const isClearing = debris.clearingStartedAt !== null && !debris.cleared;
                      const progress = isClearing
                        ? Math.min(1, (now - (debris.clearingStartedAt || 0)) / debris.clearDurationMs)
                        : 0;
                      const remaining = isClearing
                        ? Math.max(0, debris.clearDurationMs - (now - (debris.clearingStartedAt || 0)))
                        : 0;

                      return (
                        <div
                          key={debris.id}
                          className={`flex items-center gap-2 rounded-lg p-2 border ${
                            debris.cleared
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : isClearing
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                : 'bg-stone-50 dark:bg-stone-900/30 border-stone-100 dark:border-gray-800'
                          }`}
                        >
                          <span className="text-lg">{DEBRIS_EMOJI[debris.type]}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-stone-700 dark:text-gray-300">
                              {DEBRIS_LABEL[debris.type]}
                              {debris.cleared && ' \u2705'}
                            </div>
                            {isClearing && (
                              <div className="mt-1">
                                <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                                </div>
                                <div className="text-[10px] text-stone-400 dark:text-gray-500 mt-0.5">
                                  Clearing: {formatDuration(remaining)} remaining
                                </div>
                              </div>
                            )}
                            {!debris.cleared && !isClearing && (
                              <div className="text-[10px] text-stone-400 dark:text-gray-500">
                                Cost: {formatCoin(debris.clearCost)} {'\u{1F4B0}'} {'\u2022'} {formatDuration(debris.clearDurationMs)}
                              </div>
                            )}
                          </div>
                          {!debris.cleared && !isClearing && (
                            <button
                              onClick={() => startClearingDebris(parcelId, debris.id)}
                              disabled={coins < debris.clearCost}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-colors shrink-0"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Facility Footprints applicable to this parcel */}
              <div>
                <h4 className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wider mb-2">{'\u{1F3D7}'} Facilities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {FACILITY_FOOTPRINTS.map(facility => {
                    const isApplicable = facility.requiredZone === parcelId || (facility.requiredZone === 'any_cleared' && isUnlocked);
                    if (!isApplicable) return null;
                    const canPlace = isUnlocked && (parcel.debris.every(d => d.cleared) || parcel.debris.length === 0);

                    return (
                      <div key={facility.id} className={`flex items-center gap-2 rounded-lg p-2 border ${canPlace ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-stone-50 dark:bg-stone-900/30 border-stone-100 dark:border-gray-800'}`}>
                        <span className="text-lg">{facility.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-stone-700 dark:text-gray-300">{facility.name}</div>
                          <div className="text-[10px] text-stone-500 dark:text-gray-400">
                            {facility.tiles.rows}x{facility.tiles.cols} tiles {'\u2022'} {facility.description}
                          </div>
                        </div>
                        {canPlace ? (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">{'\u2705'} Ready</span>
                        ) : (
                          <span className="text-[10px] text-stone-400 dark:text-gray-500">{'\u{1F512}'}</span>
                        )}
                      </div>
                    );
                  })}
                  {FACILITY_FOOTPRINTS.filter(f => f.requiredZone === parcelId || (f.requiredZone === 'any_cleared' && isUnlocked)).length === 0 && (
                    <div className="text-xs text-stone-400 dark:text-gray-500 italic">No facilities require this zone specifically.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Estate Aura Progression */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 p-3">
        <h3 className="font-bold text-sm text-stone-800 dark:text-gray-100 mb-2 flex items-center gap-2">
          {'\u{1F3F0}'} Estate Prestige Milestones
        </h3>
        <div className="space-y-1.5">
          {ESTATE_AURAS.map(aura => {
            const isReached = parcelsClaimed >= aura.parcelsClaimed;
            const isNext = !isReached && parcelsClaimed < aura.parcelsClaimed && (ESTATE_AURAS.findIndex(a => a.parcelsClaimed === aura.parcelsClaimed) === 0 || parcelsClaimed >= ESTATE_AURAS[ESTATE_AURAS.findIndex(a => a.parcelsClaimed === aura.parcelsClaimed) - 1]?.parcelsClaimed);

            return (
              <div key={aura.parcelsClaimed} className={`flex items-center gap-2 rounded-lg p-2 border ${
                isReached
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : isNext
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-stone-50 dark:bg-stone-900/30 border-stone-100 dark:border-gray-800'
              }`}>
                <span className="text-lg">{isReached ? aura.emoji : '\u{1F512}'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-stone-700 dark:text-gray-300">
                    {aura.parcelsClaimed} Parcel{aura.parcelsClaimed > 1 ? 's' : ''}: {aura.title}
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-gray-400">{aura.effect}</div>
                </div>
                {isReached ? (
                  <span className="text-green-600 dark:text-green-400 text-xs font-bold">{'\u2705'}</span>
                ) : isNext ? (
                  <span className="text-amber-600 dark:text-amber-400 text-[10px] font-medium">Next</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Freight Contract Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-700 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 px-4 py-3 border-b border-blue-200 dark:border-blue-700 cursor-pointer"
          onClick={() => setShowFreightPanel(!showFreightPanel)}
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{'\u{1F6A2}'}</span>
              <div>
                <h3 className="font-bold text-lg">Cargo Freight Port</h3>
                <p className="text-xs opacity-90">
                  {portUnlocked
                    ? contract ? 'Active Contract' : 'Awaiting Contract...'
                    : 'Unlock Shipping Basin (Lv 54) to access'}
                </p>
              </div>
            </div>
            <span className={`transition-transform duration-200 ${showFreightPanel ? 'rotate-180' : ''}`}>{'\u25BC'}</span>
          </div>
        </div>

        {showFreightPanel && (
          <div className="p-3 space-y-3">
            {!portUnlocked ? (
              <div className="text-center py-6 space-y-2">
                <div className="text-3xl">{'\u{1F512}'}</div>
                <p className="text-sm text-stone-400 dark:text-gray-500 italic">Unlock the Shipping Basin parcel to access freight contracts.</p>
                <p className="text-xs text-stone-400 dark:text-gray-500">Requires Level 54 {'\u2022'} 3,200,000 {'\u{1F4B0}'}</p>
              </div>
            ) : !contract ? (
              <div className="text-center py-4 space-y-2">
                <div className="text-2xl">{'\u{1F4E6}'}</div>
                <p className="text-sm text-stone-500 dark:text-gray-400">No active freight contract.</p>
                <p className="text-xs text-stone-400 dark:text-gray-500">
                  Next contract in: {formatDuration(Math.max(0, freightContractRefreshAt - now))}
                </p>
                <button
                  onClick={refreshFreightContract}
                  disabled={gems < 10}
                  className="mt-2 px-4 py-2 text-sm font-bold rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-all"
                >
                  {'\u{1F48E}'} Instant Refresh (10 Gems)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Contract Header */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{contract.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-stone-800 dark:text-gray-100">{contract.title}</div>
                    <div className="text-xs text-stone-500 dark:text-gray-400">
                      {contract.acceptedAt
                        ? <>Delivery Window: {formatDuration(contractExpiresIn)} remaining</>
                        : <>Available {'\u2022'} Entry Deposit: {formatCoin(contract.entryDeposit)} {'\u{1F4B0}'}</>
                      }
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-1.5">
                  {contract.requirements.map((req, i) => {
                    const isCrop = req.itemId in CROPS || req.itemId === 'feed' || req.itemId === 'cotton' || req.itemId === 'honey_comb' || req.itemId === 'wild_berries' || req.itemId === 'gold_nugget';
                    const storage = isCrop ? silo : barn;
                    const have = storage[req.itemId] || 0;
                    const enough = have >= req.qty;

                    return (
                      <div key={i} className="flex items-center justify-between text-sm rounded-lg p-1.5 bg-stone-50 dark:bg-stone-900/30">
                        <span className="flex items-center gap-1.5">
                          <span className="text-base">{req.emoji}</span>
                          <span className="text-stone-700 dark:text-gray-300">{req.name}</span>
                        </span>
                        <span className={`font-mono text-xs font-semibold ${enough ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                          {have}/{req.qty}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Rewards */}
                <div className="flex items-center gap-3 text-xs bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2 border border-amber-200 dark:border-amber-800">
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                    {'\u{1F4B0}'} {formatCoin(contract.coinReward)}
                  </span>
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                    {'\u{1F48E}'} {contract.gemReward} Gems
                  </span>
                  {contract.blueprintReward && (
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                      {'\u{1F4D0}'} {contract.blueprintReward}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!contract.acceptedAt ? (
                    <button
                      onClick={acceptFreightContract}
                      disabled={coins < contract.entryDeposit}
                      className="flex-1 py-2 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-all"
                    >
                      {'\u2705'} Accept Contract ({formatCoin(contract.entryDeposit)} deposit)
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={fulfillFreightContract}
                        disabled={!canFulfillContract}
                        className="flex-1 py-2 text-sm font-bold rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-all"
                      >
                        {'\u{1F6A2}'} Ship Cargo
                      </button>
                      <button
                        onClick={failFreightContract}
                        className="px-4 py-2 text-sm font-medium rounded-xl bg-stone-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-600 dark:text-gray-400 transition-colors"
                      >
                        {'\u{1F5D1}'} Abandon
                      </button>
                    </>
                  )}
                </div>

                {/* Expiry Warning */}
                {contract.acceptedAt && contractExpiresIn < 2 * 60 * 60 * 1000 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1.5">
                    <span>{'\u26A0'}</span>
                    <span className="font-medium">Time running out!</span> Only {formatDuration(contractExpiresIn)} left to deliver.
                  </div>
                )}

                {/* Missing items hints */}
                {contract.acceptedAt && !canFulfillContract && (
                  <div className="space-y-1">
                    {contract.requirements.map((req, i) => {
                      const isCrop = req.itemId in CROPS || req.itemId === 'feed' || req.itemId === 'cotton' || req.itemId === 'honey_comb' || req.itemId === 'wild_berries' || req.itemId === 'gold_nugget';
                      const storage = isCrop ? silo : barn;
                      const have = storage[req.itemId] || 0;
                      if (have >= req.qty) return null;
                      return (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                          <span>{req.emoji}</span>
                          <span>Need {req.qty - have} more {req.name}</span>
                          <span className="text-red-400 dark:text-red-500">{'\u2192'} Produce at buildings or expand territory</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
