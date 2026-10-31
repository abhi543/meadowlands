'use client';

import { useState, useEffect } from 'react';

export interface DeviceProfile {
  isTouch: boolean;
  isCoarsePointer: boolean;
  isPortrait: boolean;
  isMobileDevice: boolean;
  windowWidth: number;
  windowHeight: number;
}

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>({
    isTouch: false,
    isCoarsePointer: false,
    isPortrait: false,
    isMobileDevice: false,
    windowWidth: 1280,
    windowHeight: 720,
  });

  useEffect(() => {
    const evaluate = () => {
      const isTouch =
        typeof window !== 'undefined' &&
        (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);

      const isCoarse =
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const isPortrait = h > w && w < 900;
      const isMobileDevice = isTouch && (w < 1024 || isCoarse);

      setProfile({
        isTouch,
        isCoarsePointer: isCoarse,
        isPortrait,
        isMobileDevice,
        windowWidth: w,
        windowHeight: h,
      });
    };

    evaluate();

    window.addEventListener('resize', evaluate, { passive: true });
    window.addEventListener('orientationchange', evaluate, { passive: true });

    return () => {
      window.removeEventListener('resize', evaluate);
      window.removeEventListener('orientationchange', evaluate);
    };
  }, []);

  return profile;
}
