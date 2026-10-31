'use client';

import React, { useRef, useState, useEffect } from 'react';

interface ResponsiveGameCanvasProps {
  children: React.ReactNode;
  baselineWidth?: number;
  baselineHeight?: number;
  className?: string;
}

export function ResponsiveGameCanvas({
  children,
  baselineWidth = 1440,
  baselineHeight = 900,
  className = '',
}: ResponsiveGameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-screen flex flex-col items-center justify-start overflow-x-hidden ${className}`}
      style={{
        touchAction: 'manipulation',
      }}
    >
      <div className="w-full flex-1 flex flex-col max-w-[1720px] mx-auto relative px-safe">
        {children}
      </div>
    </div>
  );
}
