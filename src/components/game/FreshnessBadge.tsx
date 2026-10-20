'use client';

import React from 'react';
import { getFreshnessMeta, formatDecayCountdown } from '@/game/freshnessEngine';

interface FreshnessBadgeProps {
  harvestedAt: number;
  maxLifetimeSec: number;
  compact?: boolean;
}

export function FreshnessBadge({ harvestedAt, maxLifetimeSec, compact = false }: FreshnessBadgeProps) {
  const meta = getFreshnessMeta(harvestedAt, maxLifetimeSec);

  // SVG Circular progress calculation
  const radius = compact ? 9 : 14;
  const stroke = compact ? 2.5 : 3.5;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (meta.percent / 100) * circumference;

  if (compact) {
    return (
      <div
        className="flex items-center gap-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/40 border border-stone-800"
        title={`Freshness: ${meta.percent}% (${meta.label}) · Degrades in ${formatDecayCountdown(meta.secondsUntilDegradation)}`}
      >
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          <circle
            stroke="#292524"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={meta.ringColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span style={{ color: meta.ringColor }}>{meta.percent}%</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shadow-xs ${meta.badgeClass}`}
      title={`Freshness Rating: ${meta.percent}% (${meta.label}) · Degrades to next tier in ${formatDecayCountdown(meta.secondsUntilDegradation)}`}
    >
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          <circle
            stroke="#1c1917"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={meta.ringColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className="absolute text-[9px] font-black">{meta.badgeEmoji}</span>
      </div>
      <div>
        <div className="leading-tight flex items-center gap-1">
          <span>{meta.label}</span>
          <span className="font-mono text-[11px] opacity-90">({meta.percent}%)</span>
        </div>
        {meta.secondsUntilDegradation > 0 && (
          <div className="text-[10px] text-stone-400 font-normal">
            Decays in {formatDecayCountdown(meta.secondsUntilDegradation)}
          </div>
        )}
      </div>
    </div>
  );
}
