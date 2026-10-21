'use client';

import { useGameStore } from '@/game/store';
import { xpForLevel } from '@/game/data';
import { TOTAL_PASTURE_CAPACITY } from '@/types/animals';
import { getCircadianClock, type ShiftType } from '@/game/shiftEngine';
import { useState, useEffect } from 'react';

interface HUDProps {
  onOpenBackupModal?: () => void;
  onSelectTab?: (tab: 'animals' | 'market' | 'barn' | 'farmhands') => void;
}

export function HUD({ onOpenBackupModal, onSelectTab }: HUDProps) {
  const {
    coins,
    gems,
    xp,
    level,
    silo,
    barn,
    currentEstateAura,
    bonusStorageCapacity,
    resetGame,
    animals = [],
    livestockReserve = [],
    farmEpochStart,
    unifiedWorkers,
    specialistWorkers,
    isAllWorkersPaused,
    notifications = [],
    hydrology,
    prehistoricSanctuary,
  } = useGameStore();

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clock = getCircadianClock(now, farmEpochStart);

  // Count active/hired workforce
  let totalHired = 0;
  let onDutyCount = 0;

  if (unifiedWorkers) {
    for (const w of Object.values(unifiedWorkers)) {
      if (w?.isHired) {
        totalHired++;
        const shift: ShiftType = w.shiftType || 'morning';
        const isShiftActive = clock.activeShift === shift;
        const isStriking = w.moraleTier === 'striking';
        if (isShiftActive && !w.isPaused && !isAllWorkersPaused && !isStriking) {
          onDutyCount++;
        }
      }
    }
  }

  if (specialistWorkers) {
    for (const sp of Object.values(specialistWorkers)) {
      if (sp?.isHired) {
        totalHired++;
        const shift: ShiftType = sp.shiftType || 'morning';
        const isShiftActive = clock.activeShift === shift;
        if (isShiftActive && sp.isActive && !isAllWorkersPaused && !sp.isStriking) {
          onDutyCount++;
        }
      }
    }
  }

  const xpNeeded = xpForLevel(level);
  const xpPercent = Math.min(100, (xp / xpNeeded) * 100);

  // Total silo items
  const storageBonus = bonusStorageCapacity || 0;
  const siloUsed = Object.values(silo).reduce((a, b) => a + b, 0);
  const siloMax = 50 + level * 5 + storageBonus;
  const barnUsed = Object.values(barn).reduce((a, b) => a + b, 0);
  const barnMax = 30 + level * 3 + storageBonus;

  const auraTitle = currentEstateAura?.title || 'Homestead';
  const auraEmoji = currentEstateAura?.emoji || '🏡';

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 dark:from-amber-800 dark:via-orange-800 dark:to-red-800 rounded-2xl p-3 shadow-lg text-white">
      <div className="flex flex-wrap items-center gap-3">
        {/* Level + XP */}
        <div className="flex items-center gap-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center">
            <div className="text-xs font-medium opacity-80">Level</div>
            <div className="text-xl font-bold leading-none">{level}</div>
          </div>
          <div className="min-w-[80px]">
            <div className="text-[10px] font-medium opacity-80 mb-0.5">XP {xp}/{xpNeeded}</div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-300 rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Estate Aura Pill */}
        {auraTitle !== 'Homestead' && (
          <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2 py-0.5 text-[10px] flex items-center gap-1">
            <span>{auraEmoji}</span>
            <span className="font-medium">{auraTitle}</span>
          </div>
        )}

        {/* Local Storage & Backup Button */}
        {onOpenBackupModal && (
          <button
            onClick={onOpenBackupModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition-all shadow-sm border border-white/20 backdrop-blur-sm"
            title="Local-first IndexedDB save & Backup Manager"
          >
            <span>💾</span>
            <span>Backup</span>
          </button>
        )}


        {/* Workers Timing Display Widget (On Top Header) */}
        <button
          type="button"
          onClick={() => onSelectTab?.('farmhands')}
          className="bg-white/20 hover:bg-white/30 active:scale-95 transition-all backdrop-blur-sm rounded-xl px-2.5 py-1 text-xs flex items-center gap-2 cursor-pointer shadow-xs border border-white/25 group select-none"
          title={`Farm Circadian Shift Clock: Day ${clock.currentDay}, ${clock.inGameTimeFormatted} (${clock.activeShiftDef.name}) · Next Shift Change in ${clock.nextShiftChangeFormatted} · ${onDutyCount} workers active · Click to open Workers`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-base leading-none animate-pulse">{clock.activeShiftDef.icon}</span>
            <span className="font-mono text-amber-200 tracking-tight font-extrabold">{clock.inGameTime24}</span>
            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-black/30 text-amber-300">
              {clock.activeShiftDef.shortName}
            </span>
          </div>
          <div className="h-3.5 w-px bg-white/25" />
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-amber-100 font-mono font-medium flex items-center gap-0.5" title="Time to next shift change">
              <span>⏳</span>
              <span>{clock.nextShiftChangeFormatted}</span>
            </span>
            {isAllWorkersPaused ? (
              <span className="text-[9px] bg-red-500/90 text-white font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                ⏸️ Paused
              </span>
            ) : clock.isTwilightGap && onDutyCount === 0 ? (
              <span className="text-[10px] font-bold text-slate-200 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-600/60">
                ☕ Passive Gap
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                <span>{onDutyCount > 0 ? `${onDutyCount} Active` : `${totalHired} Hired`}</span>
              </span>
            )}
          </div>
        </button>

        {/* Currency */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-sm">💰</span>
            <span className="text-sm font-bold">{coins.toLocaleString()}</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-sm">💎</span>
            <span className="text-sm font-bold">{gems}</span>
          </div>
        </div>

        {/* Storage & Animals Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0 flex-wrap">
          <button
            type="button"
            onClick={() => onSelectTab?.('farmhands')}
            className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-sm rounded-lg px-2 py-0.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs border border-white/15"
            title="Automated Workforce & Shift Telemetry (Tap to open Workers)"
          >
            <span>👷</span>
            <span className="font-bold">{onDutyCount}/{totalHired}</span>
            <span className="text-[10px] opacity-80">({clock.nextShiftChangeFormatted})</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab?.('barn')}
            className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-sm rounded-lg px-2 py-0.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs border border-white/15"
            title="Silo Storage & Crop Feed Locks (Tap to open Barn Inventory)"
          >
            <span>🌾</span>
            <span className={siloUsed >= siloMax ? 'text-red-300' : ''}>{siloUsed}/{siloMax}</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab?.('barn')}
            className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-sm rounded-lg px-2 py-0.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs border border-white/15"
            title="Barn Storage & Worker Feed Locks (Tap to open Barn Inventory)"
          >
            <span>🏠</span>
            <span className={barnUsed >= barnMax ? 'text-red-300' : ''}>{barnUsed}/{barnMax}</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab?.('animals')}
            className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-sm rounded-lg px-2 py-0.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs border border-white/15"
            title="Farm Animals (Tap to open Pastures)"
          >
            <span>🐾</span>
            <span className="font-bold">{animals.length}/{TOTAL_PASTURE_CAPACITY}</span>
            {livestockReserve.length > 0 && (
              <span className="text-[10px] bg-amber-300 text-stone-950 font-black px-1 rounded-sm shadow-2xs">
                +{livestockReserve.length}
              </span>
            )}
          </button>
          <button
            onClick={resetGame}
            className="ml-auto text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-md transition-colors"
            title="Reset Game"
          >
            🔄 Reset
          </button>
        </div>
      </div>
    </div>
  );
}
