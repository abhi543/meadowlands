'use client';

import React from 'react';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';

export function OrientationGuard() {
  const { isMobileDevice, isPortrait } = useDeviceProfile();

  if (!isMobileDevice || !isPortrait) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-stone-950/95 backdrop-blur-md text-stone-100 text-center animate-in fade-in select-none">
      <div className="relative mb-6">
        <div className="w-16 h-28 border-4 border-amber-400 rounded-2xl flex items-center justify-center animate-pulse">
          <span className="text-3xl animate-bounce">📱</span>
        </div>
        <div className="absolute -top-1 -right-3 text-2xl animate-spin text-amber-300">
          🔄
        </div>
      </div>
      <h2 className="text-xl font-black text-amber-300 mb-2 tracking-tight">
        Landscape Orientation Recommended
      </h2>
      <p className="text-xs text-stone-300 max-w-xs mb-4 leading-relaxed">
        Meadowlands is designed for wide panoramic farmstead management. Please rotate your mobile device sideways for the optimal touch controls and grid visibility.
      </p>
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 border border-stone-700 text-[11px] text-stone-400 font-medium">
        <span>💡 Tip:</span> Ensure system Auto-Rotate is unlocked
      </div>
    </div>
  );
}
