'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { playVictoryChime } from '@/lib/soundEffects';

interface Critter {
  id: string;
  emoji: string;
  species: 'chicken' | 'cow' | 'sheep' | 'pig';
  name: string;
  x: number; // percentage 5% to 92%
  facing: 'left' | 'right';
  isJumping: boolean;
  heartTime: number | null;
  bobOffset: number;
}

export function LivingPastureMeadow({ onNavigateToPastures }: { onNavigateToPastures?: () => void }) {
  const { animals = [], addNotification } = useGameStore();

  const chickensCount = animals.filter(a => a.species === 'chicken').length;
  const cowsCount = animals.filter(a => a.species === 'cow').length;
  const sheepCount = animals.filter(a => a.species === 'sheep').length;
  const pigsCount = animals.filter(a => a.species === 'pig').length;

  const [critters, setCritters] = useState<Critter[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<{ id: string; x: number; text: string }[]>([]);

  // Spawn representative roaming critters based on player's livestock
  useEffect(() => {
    const list: Critter[] = [];
    const addCritter = (species: 'chicken' | 'cow' | 'sheep' | 'pig', emoji: string, name: string) => {
      list.push({
        id: `critter_${species}_${Math.random()}`,
        emoji,
        species,
        name,
        x: 5 + Math.random() * 85,
        facing: Math.random() < 0.5 ? 'left' : 'right',
        isJumping: false,
        heartTime: null,
        bobOffset: Math.random() * 3,
      });
    };

    if (chickensCount > 0) addCritter('chicken', '🐔', 'Chicken');
    if (chickensCount > 4) addCritter('chicken', '🐣', 'Chirpy Chick');
    if (cowsCount > 0) addCritter('cow', '🐄', 'Daisy the Cow');
    if (cowsCount > 4) addCritter('cow', '🐂', 'Pasture Steer');
    if (sheepCount > 0) addCritter('sheep', '🐑', 'Woolly Sheep');
    if (sheepCount > 4) addCritter('sheep', '🐏', 'Ram');
    if (pigsCount > 0) addCritter('pig', '🐷', 'Muddy Pig');
    if (pigsCount > 4) addCritter('pig', '🐖', 'Truffle Sniffer');

    // Default friendly wanderers if farm has 0 animals yet
    if (list.length === 0) {
      list.push({
        id: 'wild_bunny',
        emoji: '🐇',
        species: 'chicken',
        name: 'Wild Meadow Bunny',
        x: 35,
        facing: 'right',
        isJumping: false,
        heartTime: null,
        bobOffset: 0,
      });
    }

    setCritters(list);
  }, [chickensCount, cowsCount, sheepCount, pigsCount]);

  // Wandering movement ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setCritters(prev =>
        prev.map(c => {
          if (c.isJumping) return c;
          const moveDelta = (Math.random() - 0.5) * 6;
          let newX = c.x + moveDelta;
          if (newX < 4) newX = 4;
          if (newX > 92) newX = 92;
          return {
            ...c,
            x: newX,
            facing: moveDelta > 0 ? 'right' : 'left',
            bobOffset: Math.random() * 2,
          };
        })
      );
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const handlePetCritter = (critter: Critter, e: React.MouseEvent) => {
    e.stopPropagation();
    playVictoryChime();

    // Trigger jump & heart
    setCritters(prev =>
      prev.map(c => (c.id === critter.id ? { ...c, isJumping: true, heartTime: Date.now() } : c))
    );

    const heartId = `heart_${Date.now()}_${Math.random()}`;
    const praiseMessages = ['❤️ Loved!', '✨ Happy!', '💖 Content!', '🌾 Fed affection!'];
    const text = praiseMessages[Math.floor(Math.random() * praiseMessages.length)];
    setFloatingHearts(prev => [...prev, { id: heartId, x: critter.x, text }]);

    addNotification(`🐾 You petted ${critter.name}! The animal feels happy and cherished.`, '💖', 'discovery');

    setTimeout(() => {
      setCritters(prev =>
        prev.map(c => (c.id === critter.id ? { ...c, isJumping: false } : c))
      );
    }, 600);

    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1200);
  };

  return (
    <div
      onClick={onNavigateToPastures}
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-emerald-950/80 border border-emerald-500/30 p-2.5 shadow-md group cursor-pointer transition-all hover:border-emerald-400/50"
      title="Click on roaming livestock to pet them! Click container to open Pastures"
    >
      {/* Decorative Meadow Ground Line */}
      <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-emerald-800/40 to-transparent pointer-events-none" />

      {/* Floating Flowers and Tuft Grass */}
      <div className="absolute inset-0 pointer-events-none flex justify-between px-6 items-end pb-1 opacity-60 text-xs">
        <span>🌱</span>
        <span>🌼</span>
        <span>🌿</span>
        <span>🌷</span>
        <span>🍀</span>
        <span>🌾</span>
        <span>🌻</span>
      </div>

      {/* Roaming Critters */}
      <div className="relative h-11 flex items-center select-none">
        {critters.map(critter => (
          <button
            key={critter.id}
            type="button"
            onClick={(e) => handlePetCritter(critter, e)}
            style={{
              left: `${critter.x}%`,
              transform: `translateY(${critter.isJumping ? -14 : critter.bobOffset}px) scaleX(${critter.facing === 'left' ? -1 : 1})`,
            }}
            className="absolute text-2xl sm:text-3xl transition-transform duration-300 hover:scale-125 active:scale-90 cursor-pointer focus:outline-none drop-shadow-md"
            title={`Click to pet ${critter.name}!`}
          >
            {critter.emoji}
          </button>
        ))}

        {/* Floating Heart Reactions */}
        {floatingHearts.map(heart => (
          <div
            key={heart.id}
            style={{ left: `${heart.x}%` }}
            className="absolute -top-3.5 z-30 font-black text-[11px] text-rose-300 flex items-center gap-1 bg-stone-900/90 px-2 py-0.5 rounded-full border border-rose-400/60 shadow-lg animate-bounce pointer-events-none whitespace-nowrap"
          >
            <span>{heart.text}</span>
          </div>
        ))}
      </div>

      {/* Pasture HUD Sub-footer */}
      <div className="flex items-center justify-between text-[11px] text-emerald-200/90 pt-1 border-t border-emerald-500/20 font-bold px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Living Pasture Meadow</span>
          <span className="text-stone-400 font-normal">({critters.length} wandering)</span>
        </span>
        <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          <span>Click animals to pet</span>
          <span>•</span>
          <span className="underline decoration-amber-400/50">Manage Pastures ➔</span>
        </span>
      </div>
    </div>
  );
}

