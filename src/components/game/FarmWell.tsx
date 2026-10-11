'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';

interface FloatingDrop {
  id: number;
  x: number;
  y: number;
}

export function FarmWell() {
  const {
    waterLevel,
    maxWaterLevel,
    wellLevel,
    coins,
    pumpWell,
    upgradeWell,
    waterAllPlots,
    plots,
    unlockedPlots,
  } = useGameStore();

  const [isPumping, setIsPumping] = useState(false);
  const [floatingDrops, setFloatingDrops] = useState<FloatingDrop[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const upgradeCost = wellLevel * 150;
  const canAffordUpgrade = coins >= upgradeCost;
  const isFull = waterLevel >= maxWaterLevel;

  // Count unwatered plots that can benefit from water
  const visiblePlots = plots.slice(0, unlockedPlots);
  const unwateredCount = visiblePlots.filter((p) => !p.isWatered).length;
  const canWaterAll = waterLevel > 0 && unwateredCount > 0;

  const handlePump = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isFull) return;

    // Get click position for floating drop
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newDrop: FloatingDrop = {
      id: Date.now() + Math.random(),
      x: Math.max(10, Math.min(rect.width - 30, x)),
      y: Math.max(10, Math.min(rect.height - 20, y)),
    };

    setFloatingDrops((prev) => [...prev.slice(-6), newDrop]);
    setTimeout(() => {
      setFloatingDrops((prev) => prev.filter((d) => d.id !== newDrop.id));
    }, 900);

    setIsPumping(true);
    setTimeout(() => setIsPumping(false), 200);

    pumpWell();
  };

  const handleUpgrade = () => {
    const success = upgradeWell();
    if (success) {
      setShowUpgradeModal(false);
    }
  };

  const waterPercent = Math.min(100, Math.round((waterLevel / maxWaterLevel) * 100));

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-900/90 via-sky-950/80 to-blue-900/90 p-3.5 sm:p-4 text-white shadow-xl border border-cyan-500/30 backdrop-blur-md">
      {/* Background Water Caustics / Glow */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Well Icon & Main Water Level */}
        <div className="flex items-center gap-3">
          {/* Interactive Tap-to-Pump Button */}
          <button
            onClick={handlePump}
            disabled={isFull}
            title={isFull ? 'Well is full!' : 'Click to pump fresh water (+1 💧)'}
            className={`relative group flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-150 select-none ${
              isFull
                ? 'bg-cyan-800/40 border-cyan-500/40 opacity-90 cursor-default'
                : 'bg-gradient-to-b from-cyan-500/30 to-blue-600/40 border-cyan-400 hover:border-cyan-300 hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/20 cursor-pointer'
            } ${isPumping ? 'scale-90 rotate-[-6deg]' : ''}`}
          >
            <span className="text-3xl sm:text-4xl filter drop-shadow-md transition-transform group-hover:scale-110">
              ⛲
            </span>

            {/* Ripple Wave ring on pump */}
            {isPumping && (
              <span className="absolute inset-0 rounded-2xl border-2 border-cyan-300 animate-ping pointer-events-none" />
            )}

            {/* Floating +1 Drops */}
            {floatingDrops.map((drop) => (
              <span
                key={drop.id}
                style={{ left: `${drop.x}px`, top: `${drop.y}px` }}
                className="absolute pointer-events-none text-xs sm:text-sm font-black text-cyan-200 drop-shadow animate-float-fade"
              >
                +1 💧
              </span>
            ))}
          </button>

          {/* Water Meter Stats */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black tracking-wide text-cyan-200 flex items-center gap-1">
                Farm Well
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold">
                  Lv.{wellLevel}
                </span>
              </span>
              {wellLevel >= 5 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold animate-pulse">
                  ⚡ Auto +1/5s
                </span>
              ) : (
                <span className="text-[10px] text-cyan-400/80 hidden xs:inline">
                  (Auto at Lv.5)
                </span>
              )}
            </div>

            {/* Water Gauge Meter */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-1">
                💧 {waterLevel}{' '}
                <span className="text-xs sm:text-sm font-semibold text-cyan-300/80">
                  / {maxWaterLevel}
                </span>
              </span>
              {isFull && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Full
                </span>
              )}
            </div>

            {/* Visual Hydration Meter Bar */}
            <div className="relative mt-1.5 h-2.5 w-full sm:w-48 overflow-hidden rounded-full bg-slate-900/60 border border-cyan-500/30">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          {/* Quick Water All Plots */}
          <button
            onClick={() => waterAllPlots()}
            disabled={!canWaterAll}
            className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border transition-all ${
              canWaterAll
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-cyan-300 shadow-md shadow-cyan-900/40 active:scale-95'
                : 'bg-slate-800/40 text-slate-500 border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <span>⚡</span>
            <span>Water All</span>
            {unwateredCount > 0 && waterLevel > 0 && (
              <span className="bg-white/20 px-1.5 py-0.2 rounded text-[11px]">
                {Math.min(waterLevel, unwateredCount)}
              </span>
            )}
          </button>

          {/* Upgrade Well Button */}
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <span>⬆️</span>
            <span>Upgrade</span>
          </button>
        </div>
      </div>

      {/* Water System Perks Banner */}
      <div className="mt-2.5 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[11px] text-cyan-200/90">
        <span className="flex items-center gap-1">
          <span className="text-amber-300">⚡</span> Watered crops grow at <b className="text-cyan-300">2× speed</b> (growth time cut in half).
        </span>
        <span className="hidden sm:inline text-cyan-400/80">
          Unwatered crops still grow normally!
        </span>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 border-2 border-cyan-500/40 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <h3 className="text-lg font-black text-cyan-300 flex items-center gap-2">
                <span>⛲</span> Upgrade Farm Well
              </h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="bg-cyan-950/40 rounded-xl p-3 border border-cyan-500/20 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Current Level:</span>
                  <span className="font-bold text-cyan-300">Lv.{wellLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Max Water Capacity:</span>
                  <span className="font-bold text-white">
                    {maxWaterLevel} 💧 →{' '}
                    <span className="text-emerald-400">+{5} 💧</span> ({maxWaterLevel + 5})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Auto-Refill:</span>
                  <span className="font-bold">
                    {wellLevel + 1 >= 5 ? (
                      <span className="text-emerald-400">✨ Active (+1 water / 5s)</span>
                    ) : (
                      <span className="text-slate-400">
                        Unlocks at Lv.5 (currently Lv.{wellLevel})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                Upgrading increases your maximum water storage and instantly refills your well to the top!
              </p>

              <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-300">Cost:</span>
                <span className="text-sm font-extrabold text-amber-300 flex items-center gap-1">
                  💰 {upgradeCost.toLocaleString()} Coins
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                disabled={!canAffordUpgrade}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  canAffordUpgrade
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <span>Upgrade to Lv.{wellLevel + 1}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
