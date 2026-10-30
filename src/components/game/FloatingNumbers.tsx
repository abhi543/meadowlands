'use client';

import { useGameStore } from '@/game/store';

export function FloatingNumbers() {
  const { notifications } = useGameStore();

  // Show only the most recent 3 notifications, auto-expire after 3 seconds to avoid visual clutter
  const now = Date.now();
  const recent = notifications
    .filter(n => now - n.createdAt < 3000)
    .slice(0, 3);

  if (recent.length === 0) return null;

  const typeColors: Record<string, string> = {
    xp: 'bg-blue-500 text-white',
    coin: 'bg-amber-500 text-white',
    gem: 'bg-purple-500 text-white',
    discovery: 'bg-emerald-500 text-white',
    event: 'bg-rose-500 text-white',
    info: 'bg-stone-600 text-white',
  };

  return (
    <div className="fixed top-20 right-3 z-[100] space-y-1.5 pointer-events-none select-none">
      {recent.map(n => {
        const age = now - n.createdAt;
        const opacity = Math.max(0, 1 - age / 3000);
        return (
          <div
            key={n.id}
            className={`${typeColors[n.type] || 'bg-gray-500 text-white'} px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-1.5 transition-all`}
            style={{ opacity }}
          >
            <span>{n.emoji}</span>
            <span className="truncate max-w-[280px]">{n.message}</span>
          </div>
        );
      })}
    </div>
  );
}
