'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/game/store';
import {
  getCircadianClock,
  SHIFT_DEFINITIONS,
  type ShiftType,
} from '@/game/shiftEngine';
import { WORKER_REGISTRY } from '@/game/data';
import { LIVESTOCK_WORKER_ROSTER } from '@/data/workerCatalog';

interface FarmClockBannerProps {
  selectedShiftFilter?: ShiftType | 'all';
  onSelectShiftFilter?: (shift: ShiftType | 'all') => void;
}

export function FarmClockBanner({
  selectedShiftFilter = 'all',
  onSelectShiftFilter,
}: FarmClockBannerProps) {
  const farmEpochStart = useGameStore(s => s.farmEpochStart);
  const unifiedWorkers = useGameStore(s => s.unifiedWorkers);
  const specialistWorkers = useGameStore(s => s.specialistWorkers);

  // Re-render tick every second for smooth dial and clock progression
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clock = getCircadianClock(now, farmEpochStart);

  // Group hired workers by shift
  const workersByShift: Record<ShiftType, { id: string; name: string; emoji: string }[]> = {
    morning: [],
    evening: [],
    night: [],
  };

  if (unifiedWorkers) {
    for (const [role, w] of Object.entries(unifiedWorkers)) {
      if (w?.isHired) {
        const shift: ShiftType = w.shiftType || 'morning';
        const meta = WORKER_REGISTRY[role as keyof typeof WORKER_REGISTRY];
        workersByShift[shift].push({
          id: role,
          name: meta?.name || role,
          emoji: meta?.emoji || '👷',
        });
      }
    }
  }

  if (specialistWorkers) {
    for (const [sId, sp] of Object.entries(specialistWorkers)) {
      if (sp?.isHired) {
        const shift: ShiftType = sp.shiftType || 'evening';
        const meta = LIVESTOCK_WORKER_ROSTER.find(r => r.id === sId);
        workersByShift[shift].push({
          id: sId,
          name: meta?.name || sId,
          emoji: meta?.emoji || '🐾',
        });
      }
    }
  }

  // Period styling
  const periodTheme = {
    day: {
      bg: 'from-amber-950/40 via-stone-900 to-stone-950 border-amber-500/40 shadow-amber-950/30',
      glow: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      timeText: 'text-amber-300',
      pinGlow: 'bg-amber-400 shadow-amber-400/50',
    },
    dusk: {
      bg: 'from-orange-950/40 via-stone-900 to-stone-950 border-orange-500/40 shadow-orange-950/30',
      glow: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      timeText: 'text-orange-300',
      pinGlow: 'bg-orange-400 shadow-orange-400/50',
    },
    night: {
      bg: 'from-indigo-950/40 via-stone-900 to-stone-950 border-indigo-500/40 shadow-indigo-950/30',
      glow: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      timeText: 'text-indigo-300',
      pinGlow: 'bg-indigo-400 shadow-indigo-400/50',
    },
  }[clock.currentPeriod];

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 bg-gradient-to-br ${periodTheme.bg} shadow-xl backdrop-blur-md transition-all duration-500`}
    >
      {/* Top Bar: Digital Clock & Next Shift Boundary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-800/80 pb-4">
        {/* Digital Time & Day Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-3xl sm:text-4xl filter drop-shadow-md animate-pulse">
              {clock.periodEmoji}
            </span>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${periodTheme.timeText}`}>
                  {clock.inGameTimeFormatted}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-stone-300">
                  Day {clock.currentDay}
                </span>
              </div>
              <div className="text-[11px] font-medium text-stone-400 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{clock.periodLabel}</span>
                <span className="text-stone-600">•</span>
                <span className="text-stone-400">30m Day Velocity (1.25m / Hour)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Active Shift & Countdown Boundary */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="px-3 py-2 rounded-xl bg-stone-900/90 border border-stone-800 text-right shadow-inner">
            <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
              Active Shift
            </div>
            <div className={`text-sm font-extrabold flex items-center gap-1.5 justify-end ${clock.activeShiftDef.color}`}>
              <span>{clock.activeShiftDef.icon}</span>
              <span>{clock.activeShiftDef.name.split(' (')[0]}</span>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-300/80">
              Next Shift Change
            </div>
            <div className="text-sm font-black text-amber-300 flex items-center gap-1 justify-end font-mono">
              <span>⏳</span>
              <span>{clock.nextShiftChangeFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Circadian Visual Dial & Timeline Band */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-400">
          <span className="flex items-center gap-1 text-amber-400">
            <span>🌅</span> 06:00 (Morning Shift)
          </span>
          <span className="flex items-center gap-1 text-orange-400">
            <span>☀️</span> 14:00 (Evening Shift)
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <span>🌙</span> 22:00 (Night Shift)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span>🌅</span> 06:00
          </span>
        </div>

        {/* Horizontal 24-Hour Timeline Bar with Markers */}
        <div className="relative w-full h-7 rounded-xl overflow-hidden border border-stone-700/60 bg-stone-950 p-1 flex shadow-inner">
          {/* Morning Shift Zone (06:00 to 14:00 -> 33.3% / 600s) */}
          <div
            className="h-full bg-gradient-to-r from-amber-500/50 via-yellow-400/40 to-amber-500/50 rounded-l-lg border-r border-amber-300/50 flex items-center justify-center text-[10px] font-black text-amber-200 tracking-wider shadow-inner"
            style={{ width: '33.333%' }}
            title="Morning Shift: 06:00 – 14:00 (Irrigation, Milking, Harvest)"
          >
            <span className="hidden sm:inline">🌅 MORNING (06:00-14:00)</span>
            <span className="sm:hidden">🌅 MORN</span>
          </div>

          {/* Evening Shift Zone (14:00 to 22:00 -> 33.3% / 600s) */}
          <div
            className="h-full bg-gradient-to-r from-orange-500/50 via-amber-400/40 to-orange-500/50 border-r border-orange-300/50 flex items-center justify-center text-[10px] font-black text-orange-200 tracking-wider shadow-inner"
            style={{ width: '33.333%' }}
            title="Evening Shift: 14:00 – 22:00 (Artisan Mills, Smoker, Carts)"
          >
            <span className="hidden sm:inline">☀️ EVENING (14:00-22:00)</span>
            <span className="sm:hidden">☀️ EVE</span>
          </div>

          {/* Night Shift Zone (22:00 to 06:00 -> 33.3% / 600s) */}
          <div
            className="h-full bg-gradient-to-r from-indigo-700/60 via-purple-600/50 to-indigo-900/60 rounded-r-lg flex items-center justify-center text-[10px] font-black text-indigo-200 tracking-wider shadow-inner"
            style={{ width: '33.334%' }}
            title="Night Shift: 22:00 – 06:00 (Nocturnal Beasts, Security, Baking)"
          >
            <span className="hidden sm:inline">🌙 NIGHT (22:00-06:00)</span>
            <span className="sm:hidden">🌙 NIGHT</span>
          </div>

          {/* Live Sun/Moon Clock Pin */}
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300 z-10"
            style={{
              left: `${Math.max(1, Math.min(99, clock.cycleProgressPct))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="w-1.5 h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse" />
            <div className="absolute -top-1 px-1.5 py-0.5 rounded-full bg-white text-stone-900 text-[9px] font-black shadow-md border border-stone-200 whitespace-nowrap">
              {clock.inGameTime24}
            </div>
          </div>
        </div>
      </div>

      {/* Shift Roster Distribution & Filtering Controls */}
      <div className="mt-4 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-stone-400 mr-1">Roster Shifts:</span>

          {/* All Filter */}
          <button
            onClick={() => onSelectShiftFilter?.('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedShiftFilter === 'all'
                ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-white shadow-xs'
                : 'bg-stone-800/70 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            All Shifts ({Object.values(workersByShift).reduce((a, b) => a + b.length, 0)})
          </button>

          {/* Morning Shift Tab */}
          {(['morning', 'evening', 'night'] as ShiftType[]).map(s => {
            const def = SHIFT_DEFINITIONS[s];
            const count = workersByShift[s].length;
            const isCurrentActive = clock.activeShift === s;
            const isSelected = selectedShiftFilter === s;

            return (
              <button
                key={s}
                onClick={() => onSelectShiftFilter?.(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                    : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-300'
                }`}
              >
                <span>{def.icon}</span>
                <span>{def.shortName}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-800 text-stone-300 font-extrabold">
                  {count}
                </span>
                {isCurrentActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" title="Active on duty now" />
                )}
              </button>
            );
          })}
        </div>

        {/* Shift Stagger Coverage Insight */}
        <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
          <span>🛡️ Continuous 24h Farm Coverage:</span>
          {Object.values(workersByShift).every(list => list.length > 0) ? (
            <span className="text-emerald-400 font-bold">100% Balanced</span>
          ) : (
            <span className="text-amber-400 font-bold">Coverage Gaps Exist</span>
          )}
        </div>
      </div>
    </div>
  );
}
