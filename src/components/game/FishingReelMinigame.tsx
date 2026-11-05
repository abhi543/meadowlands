'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WaterZoneId, FishSpeciesId } from '@/game/data';
import { WATER_ZONES, FISH_SPECIES } from '@/game/data';
import { playReelBiteSound, playReelClickSound, playVictoryChime, playDefeatSound, playLegendaryBossSplash } from '@/lib/soundEffects';

interface FishingReelMinigameProps {
  zoneId: WaterZoneId;
  targetSpeciesId: FishSpeciesId;
  isBossCatch?: boolean;
  onSuccess: () => void;
  onFail: () => void;
  onClose: () => void;
}

export function FishingReelMinigame({
  zoneId,
  targetSpeciesId,
  isBossCatch = false,
  onSuccess,
  onFail,
  onClose,
}: FishingReelMinigameProps) {
  const zone = WATER_ZONES[zoneId];
  const fish = FISH_SPECIES[targetSpeciesId];

  // Tension & Bar Mechanics:
  // Bar represents the player's green catch box [0 - 100]
  // Fish position bounces smoothly within [0 - 100]
  // Tension progress fills from 0 to 100%. If it hits 100% -> Catch! If 0% -> Escape!
  const [barPos, setBarPos] = useState(30); // 0 to 80 (bar height ~20)
  const [fishPos, setFishPos] = useState(50); // 0 to 100
  const [catchProgress, setCatchProgress] = useState(35); // 0 to 100%
  const [isHoldingReel, setIsHoldingReel] = useState(false);
  const [status, setStatus] = useState<'playing' | 'caught' | 'escaped'>('playing');

  const barHeight = isBossCatch ? 18 : 26; // Smaller sweet spot for boss
  const fishTargetRef = useRef(50);
  const fishVelRef = useRef(0);
  const barVelRef = useRef(0);

  // Play opening bite sound
  useEffect(() => {
    if (isBossCatch) {
      playLegendaryBossSplash();
    } else {
      playReelBiteSound();
    }
  }, [isBossCatch]);

  // Main Physics Loop (60 FPS)
  useEffect(() => {
    if (status !== 'playing') return;

    const interval = setInterval(() => {
      // 1. Fish AI movement: randomly pick new targets
      if (Math.random() < (isBossCatch ? 0.08 : 0.04)) {
        fishTargetRef.current = Math.random() * 85 + 5;
      }
      const fishDiff = fishTargetRef.current - fishPos;
      const fishSpeed = isBossCatch ? 0.14 : 0.08;
      setFishPos(prev => {
        const next = prev + fishDiff * fishSpeed + (Math.random() - 0.5) * (isBossCatch ? 4 : 2);
        return Math.max(0, Math.min(100, next));
      });

      // 2. Player Bar Physics: Holding reel moves UP, releasing falls DOWN (gravity)
      setBarPos(prev => {
        if (isHoldingReel) {
          barVelRef.current = Math.min(barVelRef.current + 0.8, 4.5);
          if (Math.random() < 0.25) playReelClickSound();
        } else {
          barVelRef.current = Math.max(barVelRef.current - 0.6, -4.5);
        }
        const next = prev + barVelRef.current;
        if (next <= 0) {
          barVelRef.current = 0;
          return 0;
        }
        if (next >= 100 - barHeight) {
          barVelRef.current = 0;
          return 100 - barHeight;
        }
        return next;
      });

      // 3. Catch progress: inside bar -> +0.8%, outside -> -0.6%
      const isInside = fishPos >= barPos && fishPos <= barPos + barHeight;
      setCatchProgress(prev => {
        const delta = isInside ? (isBossCatch ? 0.9 : 1.2) : (isBossCatch ? -0.8 : -0.6);
        const next = Math.max(0, Math.min(100, prev + delta));

        if (next >= 100) {
          setStatus('caught');
          playVictoryChime();
          setTimeout(() => {
            onSuccess();
          }, 1200);
        } else if (next <= 0) {
          setStatus('escaped');
          playDefeatSound();
          setTimeout(() => {
            onFail();
          }, 1200);
        }
        return next;
      });
    }, 33); // ~30 updates/sec

    return () => clearInterval(interval);
  }, [status, isHoldingReel, fishPos, barPos, barHeight, isBossCatch, onSuccess, onFail]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-sky-950 via-slate-900 to-stone-950 border-2 border-sky-400 p-5 shadow-2xl text-white select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-800/60">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🎣</span>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
                {isBossCatch ? '👑 MYTHIC REEL BATTLE!' : 'Tension Reel Mini-Game'}
              </h3>
              <p className="text-[11px] text-sky-400 font-medium">
                {zone.name} • {fish.name} ({fish.tier})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Fishing Line Tension Indicator */}
        <div className="my-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1 text-sky-300">
              <span>⚡</span> Hook Tension
            </span>
            <span className={`font-mono ${catchProgress > 70 ? 'text-emerald-400' : catchProgress < 30 ? 'text-rose-400 animate-pulse' : 'text-yellow-400'}`}>
              {Math.round(catchProgress)}%
            </span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-sky-700/60 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                catchProgress > 70
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.8)]'
                  : catchProgress < 30
                  ? 'bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                  : 'bg-gradient-to-r from-yellow-500 to-amber-400'
              }`}
              style={{ width: `${catchProgress}%` }}
            />
          </div>
        </div>

        {/* The Vertical Water Column Gauge */}
        <div className="relative h-64 w-full bg-gradient-to-b from-sky-900/60 via-blue-950/80 to-slate-950 rounded-2xl border-2 border-sky-500/50 overflow-hidden shadow-inner flex items-center justify-center">
          {/* Depth markings */}
          <div className="absolute inset-y-0 left-2 flex flex-col justify-between py-2 text-[8px] font-mono text-sky-400/40 pointer-events-none">
            <span>0m (Surface)</span>
            <span>-15m</span>
            <span>-30m</span>
            <span>-50m (Abyss)</span>
          </div>

          {/* Player Catch Green Box (Sweet Spot) */}
          <div
            className={`absolute left-12 right-6 rounded-xl border-2 transition-colors duration-150 flex items-center justify-between px-2.5 ${
              fishPos >= barPos && fishPos <= barPos + barHeight
                ? 'bg-emerald-500/35 border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                : 'bg-sky-500/20 border-sky-400/60'
            }`}
            style={{
              bottom: `${barPos}%`,
              height: `${barHeight}%`,
            }}
          >
            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
              {fishPos >= barPos && fishPos <= barPos + barHeight ? 'REELING IN! ⚡' : 'SWEET SPOT'}
            </span>
            <span className="text-xs">⚓</span>
          </div>

          {/* Fish Target Sprite */}
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-75 flex items-center gap-1 z-20 pointer-events-none"
            style={{
              bottom: `${fishPos}%`,
            }}
          >
            <span className={`text-2xl filter drop-shadow-md ${isBossCatch ? 'animate-bounce text-3xl' : ''}`}>
              {fish.emoji}
            </span>
            {isBossCatch && (
              <span className="text-[9px] font-black px-1 py-0.2 rounded bg-amber-500 text-stone-950 animate-pulse">
                BOSS
              </span>
            )}
          </div>

          {/* Status Overlay */}
          {status === 'caught' && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center gap-1 animate-in zoom-in-95 duration-150 z-30">
              <span className="text-5xl animate-bounce">🎉</span>
              <h4 className="text-lg font-black text-emerald-300 uppercase">FISH REELED IN!</h4>
              <p className="text-xs text-white font-bold">+{fish.name} added to Barn!</p>
            </div>
          )}

          {status === 'escaped' && (
            <div className="absolute inset-0 bg-rose-950/90 flex flex-col items-center justify-center gap-1 animate-in zoom-in-95 duration-150 z-30">
              <span className="text-5xl animate-pulse">💨</span>
              <h4 className="text-lg font-black text-rose-300 uppercase">LINE SNAPPED!</h4>
              <p className="text-xs text-stone-300">The fish slipped away back into the deep.</p>
            </div>
          )}
        </div>

        {/* Hold-to-Reel Tactile Button */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onMouseDown={() => setIsHoldingReel(true)}
            onMouseUp={() => setIsHoldingReel(false)}
            onTouchStart={() => setIsHoldingReel(true)}
            onTouchEnd={() => setIsHoldingReel(false)}
            disabled={status !== 'playing'}
            className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95 select-none flex items-center justify-center gap-2 cursor-pointer ${
              isHoldingReel
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 border-2 border-yellow-200 scale-98 shadow-amber-400/40'
                : 'bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white border-2 border-sky-300 shadow-sky-500/30'
            }`}
          >
            <span>🎣</span>
            <span>{isHoldingReel ? 'HOLDING TIGHT! (REELING)' : 'PRESS & HOLD TO REEL'}</span>
          </button>
          <span className="text-[10px] text-stone-400">
            Keep the green box centered over the fish until Hook Tension reaches 100%!
          </span>
        </div>

      </div>
    </div>
  );
}
