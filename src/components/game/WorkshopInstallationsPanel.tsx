'use client';

import React from 'react';
import { useGameStore } from '@/game/store';

export const WorkshopInstallationsPanel: React.FC = () => {
  const barn = useGameStore(state => state.barn);
  const hydrology = useGameStore(state => state.hydrology);
  const workshopLoadout = useGameStore(state => state.workshopLoadout) || {
    equippedTool: null,
    sluiceGateSealsInstalled: 0,
    aquiferCasingsInstalled: 0,
    prismaticLensMounted: false,
    thermalCoreActive: false,
  };

  const equipWorkshopTool = useGameStore(state => state.equipWorkshopTool);
  const unequipWorkshopTool = useGameStore(state => state.unequipWorkshopTool);
  const installSluiceGateSeal = useGameStore(state => state.installSluiceGateSeal);
  const reinforceAquiferCasing = useGameStore(state => state.reinforceAquiferCasing);
  const mountPrismaticLens = useGameStore(state => state.mountPrismaticLens);
  const unmountPrismaticLens = useGameStore(state => state.unmountPrismaticLens);
  const mountThermalCore = useGameStore(state => state.mountThermalCore);
  const unmountThermalCore = useGameStore(state => state.unmountThermalCore);

  // Bag inventory counts
  const trowelInBag = barn.hardened_chitin_trowel || 0;
  const sealsInBag = barn.reinforced_sluice_seal || 0;
  const casingsInBag = barn.subsoil_aquifer_casing || 0;
  const lensInBag = barn.prismatic_light_lens || 0;
  const thermalCoreInBag = barn.thermal_retaining_core || 0;

  // Hydrology values
  const sealsInstalled = Math.min(3, Math.max(0, workshopLoadout.sluiceGateSealsInstalled || 0));
  const casingsInstalled = Math.min(4, Math.max(0, workshopLoadout.aquiferCasingsInstalled || 0));
  const baseCapacity = 3000;
  const currentAquiferCapacity = baseCapacity + (casingsInstalled * 500);
  const isTrowelEquipped = workshopLoadout.equippedTool === 'hardened_chitin_trowel';
  const isLensMounted = Boolean(workshopLoadout.prismaticLensMounted);
  const isThermalActive = Boolean(workshopLoadout.thermalCoreActive);

  return (
    <div className="p-4 sm:p-5 space-y-6 bg-gradient-to-b from-stone-900/30 to-stone-950/40 dark:from-gray-950/50 dark:to-black/50">
      
      {/* SECTION 1: CREW TOOL LOADOUT */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <div>
              <h4 className="font-black text-sm tracking-wide text-stone-100 uppercase flex items-center gap-2">
                Crew Tool Loadout
                <span className="text-[10px] font-semibold text-amber-400/90 lowercase tracking-normal">
                  (1 equippable slot)
                </span>
              </h4>
              <p className="text-[11px] text-stone-400">
                Enhance field crew tilling, planting, and harvesting cycles across all farm plots.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              {isTrowelEquipped ? '1 / 1 Equipped' : '0 / 1 Empty'}
            </span>
          </div>
        </div>

        <div className="bg-stone-800/80 dark:bg-gray-900/90 border border-stone-700/80 dark:border-gray-800 rounded-xl p-3.5 shadow-sm transition-all hover:border-amber-500/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                isTrowelEquipped
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10 animate-pulse'
                  : 'bg-stone-900/60 border-stone-700 text-stone-500'
              }`}>
                🗡️
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-stone-100">
                    Hardened Chitin Trowel
                  </span>
                  {isTrowelEquipped ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      Equipped
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-700/60 text-stone-400 border border-stone-600">
                      Empty Slot
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-200/90 flex items-center gap-1 font-medium">
                  <span className="text-amber-400">⚡ Perk:</span> +30% Tilling, Planting &amp; Harvest Speed across all plots.
                </p>
                <p className="text-[11px] text-stone-400">
                  Target: Estate Field Hands &amp; Automated Plot Chores
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              {isTrowelEquipped ? (
                <button
                  onClick={() => unequipWorkshopTool()}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  📦 Unequip to Barn
                </button>
              ) : (
                <button
                  onClick={() => equipWorkshopTool('hardened_chitin_trowel')}
                  disabled={trowelInBag <= 0}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 text-stone-950 transition-all active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  {trowelInBag > 0 ? `🗡️ Equip (In Bag: ${trowelInBag})` : 'Craft in Recipes to Equip'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HYDROLOGY & IRRIGATION ENHANCEMENTS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">💧</span>
            <div>
              <h4 className="font-black text-sm tracking-wide text-stone-100 uppercase flex items-center gap-2">
                Hydrology &amp; Irrigation Enhancements
              </h4>
              <p className="text-[11px] text-stone-400">
                Reinforce canal gates and subterranean aquifers to safeguard estate water reserves.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Sluice Gate Seals */}
          <div className="bg-stone-800/80 dark:bg-gray-900/90 border border-stone-700/80 dark:border-gray-800 rounded-xl p-3.5 space-y-3 shadow-sm hover:border-sky-500/40 transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚰</span>
                <div>
                  <h5 className="font-bold text-sm text-stone-100">Canal Sluice Seals</h5>
                  <p className="text-[11px] text-stone-400">Canal Gates &amp; Gravity Tower</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                {sealsInstalled} / 3 Sockets
              </span>
            </div>

            {/* Socket Pills */}
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((slotIdx) => {
                const isInstalled = slotIdx < sealsInstalled;
                return (
                  <div
                    key={slotIdx}
                    className={`py-1.5 px-2 rounded-lg text-center border text-[11px] font-semibold transition-all ${
                      isInstalled
                        ? 'bg-sky-500/20 border-sky-400/80 text-sky-200 shadow-sm'
                        : 'bg-stone-900/40 border-stone-700/60 text-stone-500'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-stone-400 uppercase">Socket {slotIdx + 1}</div>
                    <div className="truncate font-bold">
                      {isInstalled ? '🛡️ Sealed' : '⭕ Empty'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-stone-300">
                <span>Drainage Loss Reduction:</span>
                <span className="font-mono font-bold text-sky-400">
                  -{sealsInstalled * 20}% Loss
                </span>
              </div>
              <p className="text-[11px] text-sky-200/80 font-medium">
                • Status: Each seal cuts Elevated Gravity Tower leakage by -20% (up to -60% total).
              </p>
            </div>

            <button
              onClick={() => installSluiceGateSeal()}
              disabled={sealsInstalled >= 3 || sealsInBag <= 0}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                sealsInstalled >= 3
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white cursor-pointer disabled:cursor-not-allowed active:scale-95'
              }`}
            >
              {sealsInstalled >= 3 ? (
                <>✅ All 3 Sockets Fully Reinforced</>
              ) : (
                <>
                  <span>🚰 Install Seal</span>
                  <span className="text-[10px] opacity-80">(Available in Bag: {sealsInBag})</span>
                </>
              )}
            </button>
          </div>

          {/* Subsoil Aquifer Casings */}
          <div className="bg-stone-800/80 dark:bg-gray-900/90 border border-stone-700/80 dark:border-gray-800 rounded-xl p-3.5 space-y-3 shadow-sm hover:border-teal-500/40 transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪨</span>
                <div>
                  <h5 className="font-bold text-sm text-stone-100">Subsoil Aquifer Casings</h5>
                  <p className="text-[11px] text-stone-400">Deep Groundwater Aquifer</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                Tier {casingsInstalled} / 4
              </span>
            </div>

            {/* Tier Indicators */}
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((tierNum) => {
                const isReinforced = tierNum <= casingsInstalled;
                return (
                  <div
                    key={tierNum}
                    className={`py-1 px-1 rounded-md text-center border text-[10px] font-semibold transition-all ${
                      isReinforced
                        ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                        : 'bg-stone-900/40 border-stone-700/60 text-stone-500'
                    }`}
                  >
                    <span>T{tierNum}</span>
                    <span className="block text-[8px] opacity-75">+500L</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-stone-300">
                <span>Current Capacity:</span>
                <span className="font-mono font-bold text-teal-300">
                  {currentAquiferCapacity.toLocaleString()} Liters
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Formula: Base {baseCapacity.toLocaleString()}L + ({casingsInstalled} &times; 500L)
              </p>
            </div>

            <button
              onClick={() => reinforceAquiferCasing()}
              disabled={casingsInstalled >= 4 || casingsInBag <= 0}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                casingsInstalled >= 4
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white cursor-pointer disabled:cursor-not-allowed active:scale-95'
              }`}
            >
              {casingsInstalled >= 4 ? (
                <>✅ Maximum Reservoir Depth Reached (4/4)</>
              ) : (
                <>
                  <span>🪨 Install Tier {casingsInstalled + 1}</span>
                  <span className="text-[10px] opacity-80">(Requires 1 Casing, Bag: {casingsInBag})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: MICRO-CLIMATE & SOLAR DEFENSES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <div>
              <h4 className="font-black text-sm tracking-wide text-stone-100 uppercase flex items-center gap-2">
                Micro-Climate &amp; Solar Defenses
              </h4>
              <p className="text-[11px] text-stone-400">
                Overhead optics and geothermal cores protecting crops against nighttime dormancy and freezes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Prismatic Light Canopy */}
          <div className="bg-stone-800/80 dark:bg-gray-900/90 border border-stone-700/80 dark:border-gray-800 rounded-xl p-3.5 space-y-3 shadow-sm hover:border-indigo-500/40 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${
                  isLensMounted
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-sm animate-pulse'
                    : 'bg-stone-900/60 border-stone-700 text-stone-500'
                }`}>
                  ☀️
                </div>
                <div>
                  <h5 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                    Prismatic Light Canopy
                  </h5>
                  <p className="text-[11px] text-stone-400">Plot Perimeter Optical Mount</p>
                </div>
              </div>
              {isLensMounted ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Mounted
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-700/60 text-stone-400 border border-stone-600">
                  Empty
                </span>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-indigo-200/90 font-medium">
                • <span className="font-bold text-amber-300">Active Perk:</span> Eliminates nighttime crop growth slowdown across all 12 plots (+25% ambient focus).
              </p>
              <p className="text-[11px] text-stone-400">
                Focuses moonlight and twilight radiation into Photosynthetic Active Radiation (PAR).
              </p>
            </div>

            <div>
              {isLensMounted ? (
                <button
                  onClick={() => unmountPrismaticLens()}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  📦 Unmount Lens to Barn
                </button>
              ) : (
                <button
                  onClick={() => mountPrismaticLens()}
                  disabled={lensInBag <= 0}
                  className="w-full py-2 px-3 rounded-lg text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-40 text-white transition-all active:scale-95 shadow-md shadow-indigo-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  {lensInBag > 0 ? `☀️ Mount Lens (In Bag: ${lensInBag})` : 'Mount Lens (In Bag: 0)'}
                </button>
              )}
            </div>
          </div>

          {/* Thermal Retaining Core */}
          <div className="bg-stone-800/80 dark:bg-gray-900/90 border border-stone-700/80 dark:border-gray-800 rounded-xl p-3.5 space-y-3 shadow-sm hover:border-rose-500/40 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${
                  isThermalActive
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm animate-pulse'
                    : 'bg-stone-900/60 border-stone-700 text-stone-500'
                }`}>
                  🔥
                </div>
                <div>
                  <h5 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                    Thermal Retaining Core
                  </h5>
                  <p className="text-[11px] text-stone-400">Geothermal Micro-Climate Socket</p>
                </div>
              </div>
              {isThermalActive ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-700/60 text-stone-400 border border-stone-600">
                  Dormant
                </span>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-rose-200/90 font-medium">
                • <span className="font-bold text-rose-400">Active Perk:</span> Absolute Frost Immunity across all plots during blizzards and cold snaps.
              </p>
              <p className="text-[11px] text-stone-400">
                Synergizes with Dimetrodon Geothermal Radiance to keep crops growing year-round.
              </p>
            </div>

            <div>
              {isThermalActive ? (
                <button
                  onClick={() => unmountThermalCore()}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  📦 Deactivate &amp; Return to Barn
                </button>
              ) : (
                <button
                  onClick={() => mountThermalCore()}
                  disabled={thermalCoreInBag <= 0}
                  className="w-full py-2 px-3 rounded-lg text-xs font-black bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-400 hover:to-orange-500 disabled:opacity-40 text-white transition-all active:scale-95 shadow-md shadow-rose-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  {thermalCoreInBag > 0 ? `🔥 Activate Core (In Bag: ${thermalCoreInBag})` : 'Activate Core (In Bag: 0)'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
