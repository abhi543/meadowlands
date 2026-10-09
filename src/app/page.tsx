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
import { BreedingPanel } from '@/components/game/BreedingPanel';
import { EventBanner } from '@/components/game/EventBanner';
import { GuidePanel } from '@/components/game/GuidePanel';
import { LivestockMarketPanel } from '@/components/game/LivestockMarketPanel';
import { FloatingNumbers } from '@/components/game/FloatingNumbers';

type TabId = 'farm' | 'animals' | 'production' | 'orders' | 'shop' | 'farmhands' | 'fishery' | 'breeding' | 'market' | 'guide';

interface TabDef {
  id: TabId;
  label: string;
  emoji: string;
}

const TABS: TabDef[] = [
  { id: 'farm',       label: 'Farm',       emoji: '\u{1F33E}' },
  { id: 'animals',    label: 'Animals',    emoji: '\u{1F414}' },
  { id: 'production', label: 'Produce',    emoji: '\u2699\uFE0F' },
  { id: 'orders',     label: 'Orders',     emoji: '\u{1F69A}' },
  { id: 'shop',       label: 'Shop',       emoji: '\u{1F3EA}' },
  { id: 'farmhands',  label: 'Workers',    emoji: '\u{1F477}' },
  { id: 'fishery',    label: 'Fishery',    emoji: '\u{1F3A3}' },
  { id: 'breeding',   label: 'Breed',      emoji: '\u{1F43E}' },
  { id: 'market',     label: 'Market',     emoji: '\u{1F4B0}' },
  { id: 'guide',      label: 'Guide',      emoji: '\u{1F4D6}' },
];

// Hydration-safe hook for zustand persist
function useHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      // Subscribe to no-op — we just need to know if we're on the client
      return () => {};
    },
    () => true,  // client: always hydrated
    () => false,  // server: not hydrated
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
          <div className="text-5xl mb-4 animate-bounce">{'\u{1F33E}'}</div>
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

      <main className="max-w-2xl mx-auto p-3 pt-2 pb-24">
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
            <div className="space-y-4">
              <FarmhandPanel />
              <div className="border-t border-stone-200 dark:border-gray-700 pt-3">
                <AutonomousWorkerPanel />
              </div>
            </div>
          )}
          {activeTab === 'fishery' && <FisheryPanel />}
          {activeTab === 'breeding' && <BreedingPanel />}
          {activeTab === 'market' && <LivestockMarketPanel />}
          {activeTab === 'guide' && <GuidePanel />}
        </div>
      </main>

      {/** Floating Notifications */}
      <FloatingNumbers />

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-stone-200 dark:border-gray-700 safe-bottom">
        <div className="max-w-2xl mx-auto flex overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-all min-w-[56px] ${
                activeTab === tab.id
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-stone-400 dark:text-gray-500 hover:text-stone-600 dark:hover:text-gray-300'
              }`}
            >
              <span className={`text-lg transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>
                {tab.emoji}
              </span>
              <span className={`text-[9px] font-medium ${activeTab === tab.id ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
