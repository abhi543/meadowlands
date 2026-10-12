'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import {
  type OverclockTier,
  type OverclockEntityType,
  BASE_OVERCLOCK_COSTS,
  CURE_EXHAUSTION_FEES,
  getDecayedStreak,
  getTierConfig,
  STREAK_DECAY_MS,
} from '@/types/overclock';

export interface OverclockActionMenuProps {
  entityId: string;
  entityType: OverclockEntityType;
  name: string;
  baseCost?: number;
  currentProgress?: number; // 0 to 100
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  onOverclockActivated?: (tier: OverclockTier) => void;
}

export function OverclockActionMenu({
  entityId,
  entityType,
  name,
  baseCost,
  currentProgress,
  disabled = false,
  compact = false,
  className = '',
  onOverclockActivated,
}: OverclockActionMenuProps) {
  const {
    coins,
    entityOverclocks,
    overclockEntity,
    cureEntityExhaustion,
  } = useGameStore();

  const [isOpen, setIsOpen] = useState(false);
  const [, setTick] = useState(0);

  // Re-render tick every second for real-time timer countdowns
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = Date.now();
  const rawState = entityOverclocks?.[entityId];
  const effectiveBaseCost = baseCost ?? BASE_OVERCLOCK_COSTS[entityType] ?? 30;
  const cureFee = CURE_EXHAUSTION_FEES[entityType] ?? { cost: 25, title: 'Service', emoji: '🔧' };

  // Status checks
  const isExhausted = Boolean(rawState?.isExhausted && rawState.exhaustedUntil && now < rawState.exhaustedUntil);
  const exhaustionRemainingSec = isExhausted && rawState?.exhaustedUntil
    ? Math.max(0, Math.ceil((rawState.exhaustedUntil - now) / 1000))
    : 0;

  const isOverclocked = Boolean(
    rawState?.isOverclocked &&
    (!rawState.expiresAt || now < rawState.expiresAt) &&
    !isExhausted
  );
  const overclockRemainingSec = isOverclocked && rawState?.expiresAt
    ? Math.max(0, Math.ceil((rawState.expiresAt - now) / 1000))
    : null;

  const streak = getDecayedStreak(rawState?.lastOverclockAt ?? null, rawState?.streakCount ?? 0, now);
  const streakDecaySeconds = rawState?.lastOverclockAt && streak > 0
    ? Math.max(0, Math.ceil((rawState.lastOverclockAt + STREAK_DECAY_MS - now) / 1000))
    : 0;

  // Configurations for all 3 tiers
  const tier1 = getTierConfig(1, effectiveBaseCost, streak);
  const tier2 = getTierConfig(2, effectiveBaseCost, streak);
  const tier3 = getTierConfig(3, effectiveBaseCost, streak);
  const tiers = [tier1, tier2, tier3];

  const handleSelectTier = (tier: OverclockTier) => {
    const success = overclockEntity(entityId, entityType, tier, effectiveBaseCost);
    if (success) {
      setIsOpen(false);
      onOverclockActivated?.(tier);
    }
  };

  const handleCure = () => {
    cureEntityExhaustion(entityId, entityType);
  };

  // 1. Exhausted state (overheated / burned out)
  if (isExhausted) {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/70 border border-rose-500/60 text-rose-300 text-[10px] font-black animate-pulse shadow-sm">
          <span>🛑</span>
          <span>Exhausted ({exhaustionRemainingSec}s)</span>
        </div>
        <button
          type="button"
          onClick={handleCure}
          disabled={coins < cureFee.cost}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 shadow-sm ${
            coins >= cureFee.cost
              ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-500/20 active:scale-95'
              : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
          }`}
          title={`Pay ${cureFee.cost} coins for ${cureFee.title}`}
        >
          <span>{cureFee.emoji}</span>
          <span>{cureFee.title} ({cureFee.cost}🪙)</span>
        </button>
      </div>
    );
  }

  // 2. Active Overclock state
  if (isOverclocked && rawState?.activeTier) {
    const activeTierNum = rawState.activeTier;
    const tierBadgeStyles = {
      1: 'bg-amber-500/20 border-amber-500/60 text-amber-400 shadow-amber-500/20',
      2: 'bg-orange-500/25 border-orange-500/70 text-orange-400 shadow-orange-500/25',
      3: 'bg-rose-500/30 border-rose-500/80 text-rose-300 shadow-rose-500/30 ring-1 ring-rose-400/50',
    };
    const tierIcon = activeTierNum === 3 ? '💥' : activeTierNum === 2 ? '🔥' : '⚡';

    return (
      <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border shadow-sm ${tierBadgeStyles[activeTierNum]}`}
          title={`${rawState.speedMultiplier}x speed active`}
        >
          <span className="animate-bounce">{tierIcon}</span>
          <span>
            T{activeTierNum} ({rawState.speedMultiplier}x)
            {rawState.bonusYield > 0 && ' +1★'}
          </span>
          {overclockRemainingSec !== null && (
            <span className="font-mono ml-0.5 opacity-90">({overclockRemainingSec}s)</span>
          )}
        </div>
      </div>
    );
  }

  // 3. Idle state with trigger button & 3-tier action menu
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`rounded-lg font-black transition-all flex items-center justify-center gap-1 ${
          compact
            ? 'px-1.5 py-0.5 text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'px-2 py-1 text-xs bg-stone-900/80 hover:bg-stone-800 text-amber-300 border border-amber-500/40 shadow-sm active:scale-95'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        title={`Overclock ${name} (1.5x - 4.0x speed)`}
      >
        <span className="text-amber-400">⚡</span>
        <span>Boost</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          {/* Action Menu Popover */}
          <div
            className="absolute z-50 bottom-full mb-1.5 left-0 sm:left-auto sm:right-0 w-64 bg-stone-950 border border-stone-700/90 rounded-2xl p-2.5 shadow-2xl text-stone-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-800">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">⚡</span>
                <span className="text-xs font-black text-white truncate max-w-[150px]">
                  Overclock {name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            {/* Streak Escalation Notice */}
            {streak > 0 && (
              <div className="mb-2 p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-300 flex items-center justify-between">
                <span>🔥 Streak x{streak} (+{Math.round(streak * 25)}% cost)</span>
                <span className="font-mono text-stone-400">{Math.floor(streakDecaySeconds / 60)}m left</span>
              </div>
            )}

            {/* 3 Operational Tiers */}
            <div className="space-y-1.5">
              {tiers.map((t) => {
                const canAfford = coins >= t.costCoins;
                const tierTheme = {
                  1: {
                    border: 'border-amber-500/40 hover:border-amber-400',
                    bg: 'bg-amber-950/20 hover:bg-amber-950/40',
                    accent: 'text-amber-400',
                    badge: '1.5x Speed',
                    icon: '⚡',
                  },
                  2: {
                    border: 'border-orange-500/40 hover:border-orange-400',
                    bg: 'bg-orange-950/20 hover:bg-orange-950/40',
                    accent: 'text-orange-400',
                    badge: '2.5x Speed',
                    icon: '🔥',
                  },
                  3: {
                    border: 'border-rose-500/50 hover:border-rose-400',
                    bg: 'bg-rose-950/25 hover:bg-rose-950/50',
                    accent: 'text-rose-400',
                    badge: '4.0x Speed + 1★',
                    icon: '💥',
                  },
                }[t.tier];

                return (
                  <button
                    key={t.tier}
                    type="button"
                    disabled={!canAfford}
                    onClick={() => handleSelectTier(t.tier)}
                    className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      canAfford
                        ? `${tierTheme.bg} ${tierTheme.border} active:scale-98`
                        : 'bg-stone-900/50 border-stone-800 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{tierTheme.icon}</span>
                        <span className="font-black text-[11px] text-white">
                          {t.label}
                        </span>
                        <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${tierTheme.accent} bg-black/40`}>
                          {tierTheme.badge}
                        </span>
                      </div>
                      <div className="text-[9px] text-stone-400 mt-0.5">
                        {t.burnoutChance > 0 ? (
                          <span className="text-rose-400 font-semibold">
                            ⚠️ {Math.round(t.burnoutChance * 100)}% Burnout Risk
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">
                            ✅ 0% Burnout Risk
                          </span>
                        )}
                        {t.bonusYield > 0 && (
                          <span className="text-amber-300 font-bold ml-1">
                            • +{t.bonusYield} Yield
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cost Badge */}
                    <div className="flex-shrink-0 text-right">
                      <span className={`text-xs font-black font-mono ${canAfford ? 'text-amber-400' : 'text-stone-500'}`}>
                        {t.costCoins}🪙
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-2 pt-1.5 border-t border-stone-800/80 text-[9px] text-stone-400 text-center">
              10-minute anti-spam decay • 180s recovery on burnout
            </div>
          </div>
        </>
      )}
    </div>
  );
}
