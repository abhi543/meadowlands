'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useGameStore } from '@/game/store';
import { HUD } from '@/components/game/HUD';
import { FarmGrid } from '@/components/game/FarmGrid';
import { AnimalsTab } from '@/components/game/AnimalsTab';
import { ProductionPanel } from '@/components/game/ProductionPanel';
import { OrderBoard } from '@/components/game/OrderBoard';
import { ShopPanel } from '@/components/game/ShopPanel';
import { FarmhandPanel } from '@/components/game/FarmhandPanel';
import { CodexPanel } from '@/components/game/CodexPanel';
import { FisheryPanel } from '@/components/game/FisheryPanel';
import { AutonomousWorkerPanel } from '@/components/game/AutonomousWorkerPanel';
import { WorkersHubPanel } from '@/components/game/WorkersHubPanel';
import { EventBanner } from '@/components/game/EventBanner';
import { EventTopBanner } from '@/components/game/events/EventTopBanner';
import { EventDetailModal } from '@/components/game/events/EventDetailModal';
import { RelicMonumentsPanel } from '@/components/game/events/RelicMonumentsPanel';
import { GuidePanel } from '@/components/game/GuidePanel';
import { LivestockMarketPanel } from '@/components/game/LivestockMarketPanel';
import { PrehistoricSanctuaryPanel } from '@/components/game/prehistoric/PrehistoricSanctuaryPanel';
import { TerritoryMapView } from '@/components/game/TerritoryMapView';
import { FloatingNumbers } from '@/components/game/FloatingNumbers';
import { BackupModal } from '@/components/game/BackupModal';
import { BarnTab } from '@/components/game/BarnTab';
import { PicketAlertBanner } from '@/components/game/PicketAlertBanner';
import { EstateHydrologyGauge } from '@/components/game/EstateHydrologyGauge';
import { SluiceGateControlModal } from '@/components/game/SluiceGateControlModal';
import { requestPersistentStorage } from '@/lib/idbStorage';

type TabId = 'farm' | 'animals' | 'production' | 'orders' | 'shop' | 'barn' | 'farmhands' | 'fishery' | 'wilderness' | 'territory' | 'market' | 'guide';

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
  { id: 'barn',       label: 'Barn',     emoji: '🏠', color: 'text-amber-700 dark:text-amber-300',       bgActive: 'bg-amber-100 dark:bg-amber-900/40',     bgInactive: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
  { id: 'farmhands',  label: 'Workers',  emoji: '👷', color: 'text-violet-600 dark:text-violet-400',     bgActive: 'bg-violet-100 dark:bg-violet-900/40',   bgInactive: 'hover:bg-violet-50 dark:hover:bg-violet-900/20' },
  { id: 'fishery',    label: 'Fishery',  emoji: '🎣', color: 'text-cyan-600 dark:text-cyan-400',         bgActive: 'bg-cyan-100 dark:bg-cyan-900/40',       bgInactive: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20' },
  { id: 'wilderness', label: 'Sanctuary', emoji: '🦖', color: 'text-amber-600 dark:text-amber-400',     bgActive: 'bg-amber-100 dark:bg-amber-900/40',     bgInactive: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
  { id: 'territory',  label: 'Map',       emoji: '🗺️', color: 'text-teal-600 dark:text-teal-400',           bgActive: 'bg-teal-100 dark:bg-teal-900/40',       bgInactive: 'hover:bg-teal-50 dark:hover:bg-teal-900/20' },
  { id: 'market',     label: 'Livestock', emoji: '🐄', color: 'text-yellow-600 dark:text-yellow-400',     bgActive: 'bg-yellow-100 dark:bg-yellow-900/40',   bgInactive: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20' },
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
  const animals = useGameStore(s => s.animals || []);
  const [activeTab, setActiveTab] = useState<TabId>('farm');
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [relicsModalOpen, setRelicsModalOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'left' | 'right'>('left');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const hydrated = useHydrated();

  useEffect(() => {
    const saved = localStorage.getItem('meadowlands_menu_pos');
    if (saved === 'left' || saved === 'right') {
      setMenuPosition(saved);
    }
    const savedCollapsed = localStorage.getItem('meadowlands_menu_collapsed');
    if (savedCollapsed !== null) {
      setIsSidebarCollapsed(savedCollapsed === 'true');
    }
  }, []);

  const handleToggleMenuPosition = () => {
    const next = menuPosition === 'left' ? 'right' : 'left';
    setMenuPosition(next);
    localStorage.setItem('meadowlands_menu_pos', next);
  };

  const handleToggleCollapse = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    localStorage.setItem('meadowlands_menu_collapsed', String(next));
  };

  // Request browser storage persistence so IndexedDB is never evicted
  useEffect(() => {
    requestPersistentStorage();
  }, []);


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
    <div className={`min-h-screen bg-gradient-to-b from-sky-100 via-green-50 to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col md:flex-row ${menuPosition === 'right' ? 'md:flex-row-reverse' : ''}`}>

      {/* Side Navigation (Docked on Left or Right Side) */}
      <aside
        className={`w-full md:w-auto ${isSidebarCollapsed ? 'md:w-16' : 'md:w-56 lg:w-60'} flex-shrink-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-b md:border-b-0 ${
          menuPosition === 'left' ? 'md:border-r border-stone-200 dark:border-stone-800' : 'md:border-l border-stone-200 dark:border-stone-800'
        } z-40 md:sticky md:top-0 md:h-screen flex flex-col transition-all duration-300 shadow-md md:shadow-none`}
      >
        {/* Sidebar Brand & Side-Switcher Header */}
        <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-2xl flex-shrink-0 animate-bounce">🌾</span>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <span className="font-extrabold text-sm text-stone-900 dark:text-gray-100 tracking-tight">Meadowlands</span>
                <div className="text-[10px] text-stone-400 font-medium">Farmstead Hub</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Collapse toggle (Desktop only) */}
            <button
              onClick={handleToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition-all"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (menuPosition === 'left' ? '▶' : '◀') : (menuPosition === 'left' ? '◀' : '▶')}
            </button>
            {/* Dock switch: Left / Right */}
            <button
              onClick={handleToggleMenuPosition}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition-all"
              title={`Move navigation to ${menuPosition === 'left' ? 'Right' : 'Left'} side`}
            >
              {menuPosition === 'left' ? '➡️' : '⬅️'}
            </button>
          </div>
        </div>

        {/* Tab Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 flex md:flex-col flex-row overflow-x-auto md:overflow-x-hidden no-scrollbar">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-all duration-200 relative group flex-shrink-0 md:flex-shrink ${
                  isActive
                    ? `${tab.bgActive} ${tab.color} shadow-sm font-extrabold border-l-4 md:border-l-4 border-emerald-500`
                    : `text-stone-600 dark:text-gray-400 ${tab.bgInactive} hover:text-stone-900 dark:hover:text-gray-100 font-medium`
                }`}
                title={tab.label}
              >
                <span className={`text-xl flex-shrink-0 transition-transform group-hover:scale-110 leading-none ${isActive ? 'scale-110' : ''}`}>
                  {tab.emoji}
                </span>

                {!isSidebarCollapsed && (
                  <span className="text-xs tracking-tight truncate flex-1 text-left">
                    {tab.label}
                  </span>
                )}

                {tab.id === 'animals' && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-stone-950 shadow-sm leading-none border border-white dark:border-stone-800 ${isSidebarCollapsed ? 'absolute -top-1 -right-1' : ''}`}>
                    {animals.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer with Quick Switch Action */}
        <div className="p-2.5 border-t border-stone-200 dark:border-stone-800 hidden md:flex flex-col gap-1.5 text-xs text-stone-500 dark:text-gray-400">
          <button
            onClick={handleToggleMenuPosition}
            className="w-full py-1.5 px-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5"
            title="Toggle Menu Side"
          >
            <span>↔️</span>
            {!isSidebarCollapsed && <span>Dock: {menuPosition === 'left' ? 'Switch to Right' : 'Switch to Left'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header HUD */}
        <header className="sticky top-0 z-30 p-3 pb-0">
          <div className="w-full max-w-[1600px] mx-auto">
            <HUD onOpenBackupModal={() => setBackupModalOpen(true)} onSelectTab={setActiveTab} />
          </div>
        </header>

        <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-16 min-h-[calc(100vh-80px)] flex flex-col transition-all">
          {/* Closed-Loop Hydrological Estate Gauge & Live Sluice Telemetry Ribbon */}
          <div className="mb-2">
            <EstateHydrologyGauge />
          </div>

          {/* Dynamic Long-Form Systemic Event Engine Banner */}
          <EventTopBanner
            onOpenDetail={() => setEventModalOpen(true)}
            onOpenRelics={() => setRelicsModalOpen(true)}
          />

          {/* Labor Strike & Grievance Dispute Alert Ribbon */}
          <div className="mb-2">
            <PicketAlertBanner />
          </div>

          {/* Legacy Hourly Event Banner */}
          {activeTab !== 'animals' && <EventBanner />}

          {/* Tab Content */}
          <div className={activeTab === 'animals' ? 'flex-1 min-h-0' : 'min-h-[400px]'}>
            {activeTab === 'farm' && <FarmGrid onSelectTab={setActiveTab} />}
            {activeTab === 'animals' && <AnimalsTab />}
            {activeTab === 'production' && <ProductionPanel />}
            {activeTab === 'orders' && <OrderBoard />}
            {activeTab === 'shop' && <ShopPanel />}
            {activeTab === 'barn' && <BarnTab onSelectTab={(tab) => setActiveTab(tab as TabId)} />}
            {activeTab === 'farmhands' && (
              <WorkersHubPanel onSelectTab={(tab) => setActiveTab(tab as TabId)} />
            )}
            {activeTab === 'fishery' && <FisheryPanel />}
            {activeTab === 'wilderness' && <PrehistoricSanctuaryPanel />}
            {activeTab === 'territory' && <TerritoryMapView />}
            {activeTab === 'market' && <LivestockMarketPanel />}
            {activeTab === 'guide' && <GuidePanel />}
          </div>
        </main>
      </div>

      {/** Modals & Overlays **/}
      <BackupModal isOpen={backupModalOpen} onClose={() => setBackupModalOpen(false)} />
      <EventDetailModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onOpenRelics={() => {
          setEventModalOpen(false);
          setRelicsModalOpen(true);
        }}
      />
      <RelicMonumentsPanel
        isOpen={relicsModalOpen}
        onClose={() => setRelicsModalOpen(false)}
      />
      {/* Closed-Loop Hydrological Sluice & Canal Console Modal */}
      <SluiceGateControlModal />

      {/** Floating Notifications */}
      <FloatingNumbers />
    </div>
  );
}
