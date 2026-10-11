'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/game/store';

/**
 * EventEmergencyBanner:
 * Provides sensory visual flash (crimson red or neon gold) and screen micro-shake
 * when a Sudden Crisis or Gold Rush strikes!
 */
export function EventEmergencyBanner() {
  const { suddenEventFlash, clearSuddenEventFlash, activeSuddenEvent } = useGameStore();
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (suddenEventFlash) {
      setIsShaking(true);
      const shakeTimer = setTimeout(() => {
        setIsShaking(false);
      }, 500);

      const flashTimer = setTimeout(() => {
        clearSuddenEventFlash();
      }, 1500);

      return () => {
        clearTimeout(shakeTimer);
        clearTimeout(flashTimer);
      };
    }
  }, [suddenEventFlash, clearSuddenEventFlash]);

  if (!suddenEventFlash && !isShaking) return null;

  const isCrisis = suddenEventFlash === 'CRISIS' || activeSuddenEvent?.type === 'CRISIS';

  return (
    <>
      <style jsx global>{`
        @keyframes emergencyShake {
          0% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-3px, 2px) rotate(-0.5deg); }
          30% { transform: translate(3px, -2px) rotate(0.5deg); }
          45% { transform: translate(-3px, -1px) rotate(-0.5deg); }
          60% { transform: translate(3px, 1px) rotate(0.5deg); }
          75% { transform: translate(-1px, 2px) rotate(0deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .emergency-screen-shake {
          animation: emergencyShake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>

      {/* Screen Border Flash Edge Pulse */}
      {suddenEventFlash && (
        <div
          className={`pointer-events-none fixed inset-0 z-[100] transition-opacity duration-500 ${
            isCrisis
              ? 'border-[8px] sm:border-[12px] border-red-500 shadow-[inset_0_0_80px_rgba(239,68,68,0.6)] animate-pulse'
              : 'border-[8px] sm:border-[12px] border-amber-400 shadow-[inset_0_0_80px_rgba(245,158,11,0.6)] animate-pulse'
          }`}
        />
      )}
    </>
  );
}
