'use client';

import { useGameStore } from '@/game/store';

export function FloatingNumbers() {
  const notifications = useGameStore(s => s.notifications);
  const filterMode = useGameStore(s => s.notificationFilterMode || 'critical_only');

  // If muted, completely hide floating banners on screen (stored in history ledger)
  if (filterMode === 'muted') return null;

  const now = Date.now();
  const recent = notifications
    .filter(n => {
      // Must have occurred within the last 3.5 seconds
      if (now - n.createdAt >= 3500) return false;

      // Filter by user preference
      if (filterMode === 'critical_only') {
        // Only show critical hazards, strikes, crises, outages, collapses
        const isCritical =
          n.priority === 'critical' ||
          n.type === 'danger' ||
          n.type === 'alert' ||
          n.message.includes('Strike') ||
          n.message.includes('Hazard') ||
          n.message.includes('Crisis') ||
          n.message.includes('Flood') ||
          n.message.includes('Ran Dry') ||
          n.message.includes('Collapsed') ||
          n.message.includes('Biohazard');
        return isCritical;
      }

      if (filterMode === 'important') {
        // Critical + discoveries/events
        if (n.priority === 'critical' || n.priority === 'warning') return true;
        if (n.type === 'danger' || n.type === 'alert' || n.type === 'event') return true;
        return false;
      }

      // 'all' mode: show everything
      return true;
    })
    .slice(0, 3);

  if (recent.length === 0) return null;

  const typeColors: Record<string, string> = {
    xp: 'bg-blue-600 text-white border border-blue-400/40',
    coin: 'bg-amber-600 text-white border border-amber-400/40',
    gem: 'bg-purple-600 text-white border border-purple-400/40',
    discovery: 'bg-emerald-600 text-white border border-emerald-400/40',
    event: 'bg-rose-600 text-white border border-rose-400/40',
    danger: 'bg-red-700 text-white border border-red-500 animate-pulse',
    alert: 'bg-rose-700 text-white border border-rose-500 animate-pulse',
    info: 'bg-stone-700 text-white border border-stone-500/40',
  };

  return (
    <div className="fixed top-20 right-3 z-[100] space-y-1.5 pointer-events-none select-none">
      {recent.map(n => {
        const age = now - n.createdAt;
        const opacity = Math.max(0, 1 - age / 3500);
        return (
          <div
            key={n.id}
            className={`${typeColors[n.type] || 'bg-stone-700 text-white'} px-3 py-1.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-1.5 transition-all backdrop-blur-xs`}
            style={{ opacity }}
          >
            <span className="text-sm">{n.emoji}</span>
            <span className="truncate max-w-[280px]">{n.message}</span>
          </div>
        );
      })}
    </div>
  );
}
