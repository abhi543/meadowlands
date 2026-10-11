'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/game/store';

/**
 * EventEmergencyBanner:
 * Provides sensory visual flash (crimson red or neon gold) and screen micro-shake
 * when a Sudden Crisis or Gold Rush strikes!
 */
export function EventEmergencyBanner() {
  const { suddenEventFlash, clearSuddenEventFlash, activeSuddenEvent, activeCrisis } = useGameStore();
  const [isShaking, setIsShaking] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!activeCrisis || activeCrisis.resolvedStatus !== 'pending') return;
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [activeCrisis]);

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

  // Screen Edge Pulse calculation for Step 5
  let crisisEdgePulse: 'red' | 'amber' | null = null;
  if (activeCrisis && activeCrisis.resolvedStatus === 'pending') {
    const remainingSec = Math.max(0, Math.ceil((activeCrisis.expiresAt - Date.now()) / 1000));
    if (remainingSec <= 10) {
      crisisEdgePulse = 'red';
    } else if (remainingSec < 30) {
      crisisEdgePulse = 'amber';
    }
  }

  const isSuddenFlash = Boolean(suddenEventFlash);
  if (!isSuddenFlash && !isShaking && !crisisEdgePulse) return null;

  const isCrisis = suddenEventFlash === 'CRISIS' || activeSuddenEvent?.type === 'CRISIS' || crisisEdgePulse === 'red';

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
      {(isSuddenFlash || crisisEdgePulse) && (
        <div
          className={`pointer-events-none fixed inset-0 z-[100] transition-opacity duration-300 ${
            crisisEdgePulse === 'red' || isCrisis
              ? 'border-[8px] sm:border-[12px] border-red-600 shadow-[inset_0_0_90px_rgba(220,38,38,0.7)] animate-pulse'
              : 'border-[6px] sm:border-[10px] border-amber-500 shadow-[inset_0_0_60px_rgba(245,158,11,0.5)] animate-pulse'
          }`}
        />
      )}
    </>
  );
}
