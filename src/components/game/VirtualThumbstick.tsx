'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualThumbstickProps {
  onMove?: (vector: { x: number; y: number }) => void;
  className?: string;
}

export function VirtualThumbstick({ onMove, className = '' }: VirtualThumbstickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const radius = 45; // Max displacement

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    touchIdRef.current = e.pointerId;
    setActive(true);
    updatePosition(e.clientX, e.clientY);
  };

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      setPosition({ x: 0, y: 0 });
      onMove?.({ x: 0, y: 0 });
      return;
    }

    const clampedDist = Math.min(distance, radius);
    const nx = (dx / distance) * clampedDist;
    const ny = (dy / distance) * clampedDist;

    setPosition({ x: nx, y: ny });
    onMove?.({ x: nx / radius, y: ny / radius });
  }, [onMove, radius]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!active || touchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (touchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    setActive(false);
    setPosition({ x: 0, y: 0 });
    touchIdRef.current = null;
    onMove?.({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-28 h-28 rounded-full bg-stone-950/70 border-2 border-stone-600/50 backdrop-blur-md flex items-center justify-center select-none touch-none shadow-xl ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Outer directional indicator pips */}
      <div className="absolute inset-2 rounded-full border border-dashed border-stone-500/30 pointer-events-none" />
      <span className="absolute top-1 text-[10px] text-stone-400 font-bold pointer-events-none">▲</span>
      <span className="absolute bottom-1 text-[10px] text-stone-400 font-bold pointer-events-none">▼</span>
      <span className="absolute left-1.5 text-[10px] text-stone-400 font-bold pointer-events-none">◀</span>
      <span className="absolute right-1.5 text-[10px] text-stone-400 font-bold pointer-events-none">▶</span>

      {/* Thumb knob */}
      <div
        className="w-12 h-12 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 shadow-lg border border-amber-200/50 flex items-center justify-center pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-amber-200/70 shadow-inner" />
      </div>
    </div>
  );
}
