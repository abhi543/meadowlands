'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useGameStore } from '@/game/store';
import { HUD } from '@/components/game/HUD';
import { FarmGrid } from '@/components/game/FarmGrid';
import { AnimalPanel } from '@/components/game/AnimalPanel';
import { ProductionPanel } from '@/components/game/ProductionPanel';
import { OrderBoard } from '@/components/game/OrderBoard';
import { ShopPanel } from '@/components/game/ShopPanel';
import { FarmhandPanel } from '@/components/game/FarmhandPanel';
import { CodexPanel } from '@/components/game/CodexPanel';
import { FisheryPanel } from '@/components/game/FisheryPanel';
import { AutonomousWorkerPanel } from '@/components/game/AutonomousWorkerPanel';
import { WorkersHubPanel } from '@/components/game/WorkersHubPanel';
import { EventBanner } from '@/components/game/EventBanner';
import { GuidePanel } from '@/components/game/GuidePanel';
import { LivestockMarketPanel } from '@/components/game/LivestockMarketPanel';
import { WildernessPanel } from '@/components/game/WildernessPanel';
import { FloatingNumbers } from '@/components/game/FloatingNumbers';

type TabId = 'farm' | 'animals' | 'production' | 'orders' | 'shop' | 'farmhands' | 'fishery' | 'wilderness' | 'market' | 'guide';

interface TabDef {
  id: TabId;
  label: string;
  emoji: string;
  color: string;        // Active text/icon color
  bgActive: string;     // Active background color
  bgInactive: string;   // Inactive hover background
}

const TABS: TabDef[] = [
  { id: 'farm',       label: 'Farm',     emoji: '🌾', color: 'text-green-600 dark:text-green-400',       bgActive: 'bg-green-100 dark:bg-green-900/40',     bgInactive: 'hover:bg-green-50 dark:hover:bg-green-900/20' },
  { id: 'animals',    label: 'Animals',  emoji: '🐔', color: 'text-amber-600 dark:text-amber-400',       bgActive: 'bg-amber-100 dark:bg-amber-900/40',     bgInactive: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
  { id: 'production', label: 'Produce',  emoji: '⚙️', color: 'text-orange-600 dark:text-orange-400',     bgActive: 'bg-orange-100 dark:bg-orange-900/40',   bgInactive: 'hover:bg-orange-50 dark:hover:bg-orange-900/20' },
  { id: 'orders',     label: 'Orders',   emoji: '🚚', color: 'text-blue-600 dark:text-blue-400',         bgActive: 'bg-blue-100 dark:bg-blue-900/40',       bgInactive: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
  { id: 'shop',       label: 'Shop',     emoji: '🏪', color: 'text-emerald-600 dark:text-emerald-400',   bgActive: 'bg-emerald-100 dark:bg-emerald-900/40', bgInactive: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
  { id: 'farmhands',  label: 'Workers',  emoji: '👷', color: 'text-violet-600 dark:text-violet-400',     bgActive: 'bg-violet-100 dark:bg-violet-900/40',   bgInactive: 'hover:bg-violet-50 dark:hover:bg-violet-900/20' },
  { id: 'fishery',    label: 'Fishery',  emoji: '🎣', color: 'text-cyan-600 dark:text-cyan-400',         bgActive: 'bg-cyan-100 dark:bg-cyan-900/40',       bgInactive: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20' },
  { id: 'wilderness', label: 'Wild',     emoji: '🏕️', color: 'text-emerald-600 dark:text-emerald-400',   bgActive: 'bg-emerald-100 dark:bg-emerald-900/40', bgInactive: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
  { id: 'market',     label: 'Market',   emoji: '💰', color: 'text-yellow-600 dark:text-yellow-400',     bgActive: 'bg-yellow-100 dark:bg-yellow-900/40',   bgInactive: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20' },
  { id: 'guide',      label: 'Guide',    emoji: '📖', color: 'text-indigo-600 dark:text-indigo-400',     bgActive: 'bg-indigo-100 dark:bg-indigo-900/40',   bgInactive: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20' },
];

// Hydration-safe hook for zustand persist
function useHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      return () => {};
    },
    () => true,
    () => false,
  );
}

export default function Home() {
  const tick = useGameStore(s => s.tick);
  const [activeTab, setActiveTab] = useState<TabId>('farm');
  const hydrated = useHydrated();

  // Game tick loop
  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(() => {
      tick();
    }, 500);
    return () => clearInterval(interval);
  }, [tick, hydrated]);

  // Force re-render every second for progress bars
  const [, setRenderTick] = useState(0);
  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(() => setRenderTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-200 via-green-100 to-amber-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🌾</div>
          <p className="text-lg font-semibold text-green-800 dark:text-green-300">Loading Meadowlands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-green-50 to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 p-3 pb-0">
        <HUD />
      </header>

      <main className="max-w-2xl mx-auto p-3 pt-2 pb-36">
        {/* Event Banner */}
        <EventBanner />

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'farm' && <FarmGrid />}
          {activeTab === 'animals' && <AnimalPanel />}
          {activeTab === 'production' && <ProductionPanel />}
          {activeTab === 'orders' && <OrderBoard />}
          {activeTab === 'shop' && <ShopPanel />}
          {activeTab === 'farmhands' && (
            <WorkersHubPanel />
          )}
          {activeTab === 'fishery' && <FisheryPanel />}
          {activeTab === 'wilderness' && <WildernessPanel />}
          {activeTab === 'market' && <LivestockMarketPanel />}
          {activeTab === 'guide' && <GuidePanel />}
        </div>
      </main>

      {/** Floating Notifications */}
      <FloatingNumbers />

      {/* Bottom Tab Bar - 2-row grid for all tabs visible */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-stone-200 dark:border-gray-700 safe-bottom">
        <div className="max-w-2xl mx-auto grid grid-cols-5 gap-1 p-1.5">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 ${
                  isActive
                    ? `${tab.bgActive} ${tab.color} shadow-sm scale-105`
                    : `text-stone-400 dark:text-gray-500 ${tab.bgInactive}`
                }`}
              >
                <span className={`transition-transform duration-200 ${isActive ? 'text-2xl' : 'text-xl'}`}>
                  {tab.emoji}
                </span>
                <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
