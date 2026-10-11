'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/game/store';

export function EventTickingClock() {
  const { activeSuddenEvent, setSuddenEventModalOpen } = useGameStore();
  const [, setTick] = useState(0);

  // Force re-render every 200ms for ultra-smooth countdown ticking
  useEffect(() => {
    if (!activeSuddenEvent) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 200);
    return () => clearInterval(interval);
  }, [activeSuddenEvent]);

  if (!activeSuddenEvent || activeSuddenEvent.resolved) return null;

  const now = Date.now();
  const remainingMs = Math.max(0, activeSuddenEvent.expiresAt - now);
  const totalMs = activeSuddenEvent.durationSeconds * 1000;
  const progressPercent = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isCrisis = activeSuddenEvent.type === 'CRISIS';
  const isUrgent = totalSeconds <= 10;

  return (
    <div
      onClick={() => setSuddenEventModalOpen(true)}
      className={`cursor-pointer mb-3 rounded-2xl overflow-hidden border-2 shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] select-none ${
        isCrisis
          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 border-red-400 text-white shadow-red-500/30'
          : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 border-yellow-300 text-slate-950 shadow-amber-500/30'
      }`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between gap-3">
          {/* Badge & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl animate-bounce flex-shrink-0">
              {activeSuddenEvent.emoji || (isCrisis ? '🚨' : '⚡')}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCrisis
                      ? 'bg-black/40 text-red-200 ring-1 ring-red-400/50'
                      : 'bg-black/20 text-slate-900 ring-1 ring-yellow-400/50'
                  }`}
                >
                  {isCrisis ? '🚨 CRISIS ALERT' : '⚡ GOLD RUSH BOUNTY'}
                </span>
                <span className="text-[11px] opacity-80 font-medium truncate hidden sm:inline">
                  Tap to Respond!
                </span>
              </div>
              <h3 className="font-black text-sm sm:text-base truncate drop-shadow-sm mt-0.5">
                {activeSuddenEvent.title}
              </h3>
            </div>
          </div>

          {/* Countdown Clock Display */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`px-3 py-1.5 rounded-xl font-mono font-black text-base sm:text-lg flex items-center gap-1.5 shadow-inner ${
                isUrgent
                  ? 'bg-red-950 text-red-200 ring-2 ring-red-400 animate-pulse'
                  : isCrisis
                  ? 'bg-black/40 text-red-100'
                  : 'bg-black/30 text-amber-100'
              }`}
            >
              <span className="text-xs">⏱️</span>
              <span>{formattedTime}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSuddenEventModalOpen(true);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1 ${
                isCrisis
                  ? 'bg-white text-red-700 hover:bg-red-50'
                  : 'bg-slate-950 text-amber-300 hover:bg-slate-900'
              }`}
            >
              <span>ACTION</span>
              <span>⚡</span>
            </button>
          </div>
        </div>

        {/* Shrinking Animated Progress Bar */}
        <div className="mt-2.5 w-full bg-black/30 rounded-full h-2 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isUrgent
                ? 'bg-red-400 animate-pulse'
                : isCrisis
                ? 'bg-gradient-to-r from-red-400 to-amber-300'
                : 'bg-gradient-to-r from-yellow-300 to-amber-200'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
