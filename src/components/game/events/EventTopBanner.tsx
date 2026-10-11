'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { SYSTEMIC_EVENTS, type SystemicEventId } from '@/game/eventsData';
import { formatEventTimeLeft } from '@/lib/eventNotifications';

interface EventTopBannerProps {
  onOpenDetail: () => void;
  onOpenRelics: () => void;
}

export function EventTopBanner({ onOpenDetail, onOpenRelics }: EventTopBannerProps) {
  const {
    systemicEvent,
    relics,
    surpriseEventAlert,
    clearSurpriseEventAlert,
    activeCrisis,
    setCrisisModalOpen,
  } = useGameStore();

  const [, setTick] = useState(0);

  // Re-render every second for smooth timer countdowns
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = Date.now();

  // If there's an active or forecast or settlement systemic event
  if (systemicEvent) {
    const def = SYSTEMIC_EVENTS[systemicEvent.id];
    if (!def) return null;

    const expiryTime = systemicEvent.phase === 'forecast'
      ? systemicEvent.forecastEndsAt
      : systemicEvent.activeEndsAt;
    const remainingMs = Math.max(0, expiryTime - now);
    const timeFormatted = formatEventTimeLeft(remainingMs);

    // 1. FORECAST MODE
    if (systemicEvent.phase === 'forecast') {
      return (
        <div
          onClick={() => {
            clearSurpriseEventAlert();
            onOpenDetail();
          }}
          className="mb-3 cursor-pointer group rounded-2xl overflow-hidden border-2 border-amber-400/80 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] animate-in fade-in slide-in-from-top-2"
        >
          <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl animate-pulse select-none flex-shrink-0">⚡</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-full text-amber-200 ring-1 ring-amber-300/40 animate-pulse">
                    Surprise Event Approaching!
                  </span>
                  <span className="text-xs font-semibold text-amber-100 truncate">
                    Arrival in {timeFormatted}
                  </span>
                </div>
                <h4 className="font-black text-sm text-white truncate drop-shadow-sm flex items-center gap-1.5 mt-0.5">
                  <span>{def.emoji}</span>
                  <span>{def.name}</span>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-black bg-white/25 hover:bg-white/35 px-2.5 py-1 rounded-xl backdrop-blur-sm transition-colors flex items-center gap-1">
                <span>Respond</span>
                <span>&rarr;</span>
              </span>
            </div>
          </div>

          {/* Progress gauge for forecast */}
          <div className="h-1 bg-black/20 w-full overflow-hidden">
            <div
              className="h-full bg-amber-200 transition-all duration-1000"
              style={{
                width: `${Math.max(0, Math.min(100, (1 - remainingMs / def.forecastDurationMs) * 100))}%`,
              }}
            />
          </div>
        </div>
      );
    }

    // 2. ACTIVE CRISIS MODE
    if (systemicEvent.phase === 'active') {
      const currentStageDef = def.stages[systemicEvent.currentStage - 1] || def.stages[0];
      const target = currentStageDef.targetCount;
      const progressCount = systemicEvent.progress;
      const progressPercent = Math.min(100, Math.round((progressCount / target) * 100));

      return (
        <div
          onClick={() => {
            clearSurpriseEventAlert();
            onOpenDetail();
          }}
          className="mb-3 cursor-pointer group rounded-2xl overflow-hidden border-2 border-rose-500/90 bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 text-white shadow-xl shadow-rose-900/40 ring-2 ring-rose-400/30 animate-pulse-border transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl select-none flex-shrink-0 animate-bounce">
                {def.emoji}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 text-rose-200 px-2 py-0.5 rounded-full ring-1 ring-rose-300/40">
                    Stage {systemicEvent.currentStage}/{def.stages.length} Active
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-200">
                    ⏱️ {timeFormatted}
                  </span>
                </div>
                <h4 className="font-black text-sm text-white truncate drop-shadow-sm flex items-center gap-1.5 mt-0.5">
                  <span>{def.name}</span>
                  <span className="text-rose-200 text-xs font-normal">
                    — {currentStageDef.title} ({progressCount}/{target})
                  </span>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-black bg-amber-400 text-amber-950 px-2.5 py-1 rounded-lg shadow-sm font-sans flex items-center gap-1 group-hover:bg-amber-300 transition-colors">
                <span>Deploy</span>
                <span>&rarr;</span>
              </span>
            </div>
          </div>

          {/* Active progress rail */}
          <div className="h-1.5 bg-black/30 w-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-green-400 transition-all duration-300 rounded-r-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      );
    }

    // 3. SETTLEMENT / CLAIM MODE
    if (systemicEvent.phase === 'settlement') {
      return (
        <div
          onClick={onOpenDetail}
          className="mb-3 cursor-pointer group rounded-2xl overflow-hidden border-2 border-yellow-300 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-900 shadow-xl shadow-yellow-500/40 ring-4 ring-yellow-400/40 animate-pulse transition-all duration-300 hover:scale-[1.01]"
        >
          <div className="px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-3xl select-none flex-shrink-0 animate-spin-slow">🏆</span>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-amber-950 px-2 py-0.5 rounded-full">
                  Grand Payoff Ready!
                </span>
                <h4 className="font-black text-sm text-slate-950 truncate drop-shadow-sm mt-0.5">
                  {def.name}: Claim {def.grandReward.coins.toLocaleString()} Coins &amp; {def.grandReward.gems} Gems!
                </h4>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail();
              }}
              className="px-3.5 py-1.5 rounded-xl font-black text-xs bg-slate-950 text-amber-300 shadow-md hover:bg-slate-900 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <span>CLAIM</span>
              <span>🎉</span>
            </button>
          </div>
        </div>
      );
    }
  }

  // 4. ACTIVE RADAR CRISIS MODE (Defense & Multitasking)
  if (activeCrisis && activeCrisis.resolvedStatus === 'pending') {
    const remainingSec = Math.max(0, Math.ceil((activeCrisis.expiresAt - now) / 1000));
    const isCritical = remainingSec <= 10;

    return (
      <div
        onClick={() => setCrisisModalOpen(true)}
        className={`mb-3 cursor-pointer group rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg ${
          isCritical
            ? 'border-red-500 bg-gradient-to-r from-red-600 via-rose-700 to-red-600 text-white shadow-red-500/30 animate-pulse'
            : 'border-amber-400 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-amber-500/25'
        }`}
      >
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl animate-bounce select-none flex-shrink-0">
              {activeCrisis.emoji}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isCritical ? 'bg-black/40 text-red-200 ring-1 ring-red-400' : 'bg-black/30 text-amber-200 ring-1 ring-amber-300'
                }`}>
                  {isCritical ? 'CRITICAL COUNTDOWN' : 'RADAR CRISIS ALERT'}
                </span>
                <span className="text-xs font-black truncate text-white">
                  {activeCrisis.title}
                </span>
              </div>
              <p className="text-[11px] text-amber-100 dark:text-amber-200 truncate mt-0.5">
                {activeCrisis.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <span className={`text-sm font-black font-mono block px-2 py-0.5 rounded-lg bg-black/40 ${
                isCritical ? 'text-red-300 animate-pulse' : 'text-amber-200'
              }`}>
                {remainingSec}s
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCrisisModalOpen(true);
              }}
              className="px-3 py-1 bg-white text-stone-900 hover:bg-amber-100 font-black rounded-xl text-xs transition-transform active:scale-95 shadow-md flex items-center gap-1"
            >
              <span>🛡️</span>
              <span>DEFEND</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. IDLE / RADAR SCANNING MODE (100% Unpredictable Random Surprises)
  const activeBuffsCount = [
    Boolean(relics.royalCrownCrestUntil && relics.royalCrownCrestUntil > now),
    Boolean(relics.mineralAshUntil && relics.mineralAshUntil > now),
    relics.superFeedCharges > 0,
    relics.countyFairTrophy,
    relics.ancientSunRelic,
    relics.circusCub,
    relics.smugglersCompass,
    relics.masterArtisanLedger,
    relics.feastOfKingsUnlocked,
    relics.glowingSpores > 0,
  ].filter(Boolean).length;

  return (
    <div className="mb-3 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-2xl p-2.5 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onOpenRelics}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100/80 dark:bg-amber-950/50 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold transition-all border border-amber-300/60 dark:border-amber-700/60"
        >
          <span>🏛️</span>
          <span className="hidden sm:inline">Relics Vault</span>
          <span className="sm:hidden">Relics</span>
          {activeBuffsCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {activeBuffsCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
          <span className="text-[11px] text-stone-600 dark:text-stone-300 font-medium truncate">
            Radar Scanning: Unpredictable crises strike as farm expands
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onOpenDetail}
          className="text-[11px] font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-1"
          title="View Radar & Phenomena Codex"
        >
          <span>📡</span>
          <span>Codex</span>
        </button>
      </div>
    </div>
  );
}
