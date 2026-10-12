'use client';

import { useGameStore } from '@/game/store';
import { xpForLevel } from '@/game/data';

interface HUDProps {
  onOpenBackupModal?: () => void;
}

export function HUD({ onOpenBackupModal }: HUDProps) {
  const { coins, gems, xp, level, silo, barn, currentEstateAura, bonusStorageCapacity, resetGame } = useGameStore();

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

        {/* Storage Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
          <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2 py-0.5 text-xs flex items-center gap-1.5">
            <span>🌾</span>
            <span className={siloUsed >= siloMax ? 'text-red-300' : ''}>{siloUsed}/{siloMax}</span>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2 py-0.5 text-xs flex items-center gap-1.5">
            <span>🏠</span>
            <span className={barnUsed >= barnMax ? 'text-red-300' : ''}>{barnUsed}/{barnMax}</span>
          </div>
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
