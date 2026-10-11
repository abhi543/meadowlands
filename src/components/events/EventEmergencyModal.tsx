'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';

export function EventEmergencyModal() {
  const {
    activeSuddenEvent,
    isSuddenEventModalOpen,
    setSuddenEventModalOpen,
    progressSuddenEventTap,
    paySuddenEventResource,
    resolveSuddenEventFailure,
    coins,
  } = useGameStore();

  const [tapEffect, setTapEffect] = useState(false);
  const [, setClockTick] = useState(0);

  // Smooth countdown re-render
  useEffect(() => {
    if (!isSuddenEventModalOpen || !activeSuddenEvent) return;
    const interval = setInterval(() => setClockTick(c => c + 1), 250);
    return () => clearInterval(interval);
  }, [isSuddenEventModalOpen, activeSuddenEvent]);

  if (!isSuddenEventModalOpen || !activeSuddenEvent || activeSuddenEvent.resolved) {
    return null;
  }

  const now = Date.now();
  const remainingMs = Math.max(0, activeSuddenEvent.expiresAt - now);
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isCrisis = activeSuddenEvent.type === 'CRISIS';
  const isUrgent = totalSeconds <= 10;
  const action = activeSuddenEvent.requiredAction;
  const isTapAction = action.type === 'RAPID_TAP';
  const currentTaps = action.currentProgress || 0;
  const targetTaps = action.targetCount || 10;
  const tapProgressPercent = Math.min(100, Math.round((currentTaps / targetTaps) * 100));

  const handleTap = () => {
    setTapEffect(true);
    setTimeout(() => setTapEffect(false), 120);
    progressSuddenEventTap();
  };

  const handlePay = () => {
    paySuddenEventResource();
  };

  const handleEndureRisk = () => {
    resolveSuddenEventFailure();
  };

  const canAffordPayment =
    action.resourceCost?.type === 'coins'
      ? coins >= (action.resourceCost?.amount || 0)
      : true;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 transition-all ${
          isCrisis
            ? 'bg-slate-950 border-red-500 shadow-red-950/60 text-white'
            : 'bg-slate-950 border-amber-400 shadow-amber-950/60 text-white'
        }`}
      >
        {/* Urgent Header Bar */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isCrisis
              ? 'bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 border-red-500/50'
              : 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 border-amber-400/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-3xl animate-bounce flex-shrink-0">
              {activeSuddenEvent.emoji || (isCrisis ? '🚨' : '⚡')}
            </span>
            <div className="min-w-0">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                  isCrisis
                    ? 'bg-black/50 text-red-200 ring-1 ring-red-400/40'
                    : 'bg-black/40 text-amber-200 ring-1 ring-yellow-300/40'
                }`}
              >
                {isCrisis ? '🚨 SUDDEN CRISIS' : '⚡ GOLD RUSH OPPORTUNITY'}
              </span>
              <h2 className="font-black text-lg sm:text-xl truncate text-white mt-0.5">
                {activeSuddenEvent.title}
              </h2>
            </div>
          </div>

          {/* Ticking Timer Pill */}
          <div
            className={`px-3 py-1.5 rounded-2xl font-mono font-black text-lg flex items-center gap-1.5 shadow-inner flex-shrink-0 ${
              isUrgent
                ? 'bg-red-950 text-red-200 ring-2 ring-red-400 animate-pulse'
                : 'bg-black/50 text-white'
            }`}
          >
            <span>⏱️</span>
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-stone-300 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/10">
            {activeSuddenEvent.description}
          </p>

          {/* Stakes Overview (Rewards vs Penalty) */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Rewards */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
              <span className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                <span>🎁</span> Success Bounty
              </span>
              <p className="font-extrabold text-white">
                +{activeSuddenEvent.rewardOnSuccess.coins.toLocaleString()} Coins
              </p>
              <p className="text-emerald-300 font-medium">
                +{activeSuddenEvent.rewardOnSuccess.gems} Gems &amp; +{activeSuddenEvent.rewardOnSuccess.xp} XP
              </p>
              {activeSuddenEvent.rewardOnSuccess.relicName && (
                <p className="text-[11px] text-amber-300 font-semibold mt-1">
                  ⭐ {activeSuddenEvent.rewardOnSuccess.relicName}
                </p>
              )}
            </div>

            {/* Penalty */}
            <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30">
              <span className="font-bold text-red-400 flex items-center gap-1 mb-1">
                <span>⚠️</span> Risk on Timeout
              </span>
              <p className="font-semibold text-red-200 leading-snug">
                {activeSuddenEvent.penaltyOnFail.description}
              </p>
            </div>
          </div>

          {/* Path Decisions */}
          <div className="space-y-3 pt-1">
            {/* OPTION A: Urgent Mitigation / Seize */}
            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                isCrisis
                  ? 'bg-red-950/30 border-red-500/60'
                  : 'bg-amber-950/30 border-amber-400/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Option A: {isCrisis ? 'Defend Farmland' : 'Seize The Bounty'}
                </span>
                {isTapAction && (
                  <span className="text-xs font-mono font-bold text-stone-300">
                    Progress: {currentTaps} / {targetTaps} ({tapProgressPercent}%)
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-300 mb-3 font-medium">
                {action.actionPrompt}
              </p>

              {/* Rapid Tap Progress Bar */}
              {isTapAction && (
                <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden p-0.5 mb-3 border border-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      isCrisis
                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                        : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                    }`}
                    style={{ width: `${tapProgressPercent}%` }}
                  />
                </div>
              )}

              {/* Interactive Action Button */}
              {isTapAction ? (
                <button
                  onClick={handleTap}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
                    tapEffect ? 'scale-95 brightness-125' : 'hover:scale-[1.01]'
                  } ${
                    isCrisis
                      ? 'bg-gradient-to-r from-red-500 via-rose-600 to-red-600 hover:from-red-400 hover:to-rose-500 text-white shadow-red-600/40'
                      : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-105 shadow-amber-500/40'
                  }`}
                >
                  <span className="text-xl">⚡</span>
                  <span>{action.actionButtonText}</span>
                  <span className="font-mono bg-black/30 px-2 py-0.5 rounded-lg text-xs font-bold text-white">
                    [{currentTaps}/{targetTaps}]
                  </span>
                </button>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={!canAffordPayment}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
                    canAffordPayment
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-105 shadow-amber-500/40'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  }`}
                >
                  <span>💰</span>
                  <span>{action.actionButtonText}</span>
                  {!canAffordPayment && (
                    <span className="text-xs text-red-400 font-semibold">(Insufficient Coins)</span>
                  )}
                </button>
              )}
            </div>

            {/* OPTION B: Endure the Risk */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                onClick={handleEndureRisk}
                className="text-xs text-stone-400 hover:text-red-400 transition-colors font-medium underline flex items-center gap-1"
              >
                <span>Option B: Surrender &amp; Accept Penalty Now</span>
              </button>

              <button
                onClick={() => setSuddenEventModalOpen(false)}
                className="text-xs bg-white/10 hover:bg-white/20 text-stone-300 px-3 py-1.5 rounded-xl font-bold transition-colors"
              >
                Minimize (Keep Timer Running)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
