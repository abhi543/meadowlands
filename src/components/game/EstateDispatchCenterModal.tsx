'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore, type NotificationCategory, type NotificationPriority, type NotificationItem } from '@/game/store';
import { getCircadianClock, type ShiftType } from '@/game/shiftEngine';
import { evaluateHydrationTelemetry, CANTEEN_DEFAULT_CAPACITY_LITERS } from '@/game/hydrationEngine';
import { calculateThermodynamicEvaporationRatePctPerMin, resolveWeatherProfileId, WEATHER_PROFILES, CANAL_TIER_CONFIGS } from '@/game/hydrologyEngine';
import { WATER_ZONES, type WaterZoneId } from '@/game/data';
import { WORKER_UPKEEP_ROSTER } from '@/data/workerUpkeep';
import { LIVESTOCK_WORKER_ROSTER } from '@/data/workerCatalog';
import { GrievanceResolutionModal } from './GrievanceResolutionModal';

interface EstateDispatchCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: 'farm' | 'animals' | 'production' | 'orders' | 'shop' | 'barn' | 'farmhands' | 'fishery' | 'wilderness' | 'territory' | 'market' | 'guide') => void;
}

type TabFilter = 'all' | NotificationCategory;
type PriorityFilter = 'all' | NotificationPriority;

export function EstateDispatchCenterModal({
  isOpen,
  onClose,
  onSelectTab,
}: EstateDispatchCenterModalProps) {
  const {
    notifications,
    hydrology,
    plots,
    unlockedPlots,
    unifiedWorkers,
    specialistWorkers,
    fishery,
    bunkhouse,
    farmEpochStart,
    activeCrisis,
    setCrisisModalOpen,
    setSluiceModalOpen,
    openEmergencySpillway,
    closeEmergencySpillway,
    toggleSluiceGates,
    pumpAquiferToTower,
    transferCisternToTower,
    deSiltCanals,
    deployDewScreens,
    clearSedimentInLine,
    clearWitheredCrop,
    waterAllPlots,
    refillStaffCanteen,
    stockColdBeverage,
    refillPondFromTower,
    dismissNotification,
    clearNotifications,
    addNotification,
    setAutoShutoffMoisture,
    setHydrologyWeather,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [grievanceWorkerId, setGrievanceWorkerId] = useState<string | null>(null);
  const [grievanceModalOpen, setGrievanceModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Re-render tick every second for real-time countdowns & timers
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // --- Real-Time Telemetry & Active System State Analysis ---
  const clock = getCircadianClock(now, farmEpochStart || now);
  const canalTier = hydrology?.canalTier || 1;
  const weatherProfileId = resolveWeatherProfileId(hydrology?.weatherCondition);
  const activeProfile = WEATHER_PROFILES[weatherProfileId] || WEATHER_PROFILES.sunny;
  const atmos = hydrology?.weatherState || {
    profileId: weatherProfileId,
    temperatureC: activeProfile.defaultTempC,
    relativeHumidityPct: activeProfile.defaultHumidityPct,
    precipitationInflowLPerMin: activeProfile.precipitationInflowLPerMin,
    windSpeedKmH: activeProfile.windSpeedKmH,
    cloudCoverPct: activeProfile.cloudCoverPct,
    barometricPressureHPa: activeProfile.barometricPressureHPa,
  };

  const evapInfo = calculateThermodynamicEvaporationRatePctPerMin({
    temperatureC: atmos.temperatureC,
    relativeHumidityPct: atmos.relativeHumidityPct,
    cycleElapsedSeconds: clock.cycleElapsedSeconds,
    canalTier,
  });

  // Hydrology Metrics
  const cisternLiters = Math.round(hydrology?.cisternLiters ?? 900);
  const cisternMax = hydrology?.cisternMaxLiters ?? 1500;
  const towerLiters = Math.round(hydrology?.towerLiters ?? 650);
  const towerMax = hydrology?.towerCapacityLiters ?? 800;
  const aquiferLiters = Math.round(hydrology?.aquiferLiters ?? 2760);
  const aquiferMax = hydrology?.aquiferCapacityLiters ?? 3000;
  const isAquiferStressed = Boolean(hydrology?.isAquiferStressed || aquiferLiters < aquiferMax * 0.25);
  const gatesOpen = Boolean(hydrology?.sluiceGatesOpen);
  const isSpillwayOpen = Boolean(hydrology?.isSpillwayOpen);
  const isFlashFlood = Boolean(hydrology?.isFlashFloodActive);
  const isClogged = Boolean(hydrology?.isCloggedWithDebris);
  const hasSediment = Boolean(hydrology?.hasSedimentInLine);

  // Plot Hazards
  const numAvailablePlots = Math.max(1, unlockedPlots || plots.length);
  const activePlots = plots.slice(0, numAvailablePlots);
  const rootRotPlots = activePlots.filter(p => p.hasRootRot || (p.moistureLevel !== undefined && p.moistureLevel > 95));
  const wiltedPlots = activePlots.filter(p => p.isWithered || p.isHeatWilted);

  // Workforce Metrics
  const canteenLiters = bunkhouse?.canteenLiters ?? 60;
  const canteenCap = bunkhouse?.canteenCapacityLiters ?? CANTEEN_DEFAULT_CAPACITY_LITERS;
  const coldInfusedDrinks = bunkhouse?.coldInfusedDrinks ?? 0;
  const hydrationTelemetry = evaluateHydrationTelemetry({
    temperatureC: atmos.temperatureC,
    canteenLiters,
    towerLiters,
    hasColdBeverage: coldInfusedDrinks > 0,
  });

  // Striking & Sabbatical Workers
  const strikingWorkers: { id: string; name: string; emoji: string; deadline: number | null }[] = [];
  const sabbaticalWorkers: { id: string; name: string; emoji: string }[] = [];
  let onDutyWorkersCount = 0;
  let totalHiredCount = 0;

  if (unifiedWorkers) {
    for (const [role, w] of Object.entries(unifiedWorkers)) {
      if (w?.isHired) {
        totalHiredCount++;
        const cfg = WORKER_UPKEEP_ROSTER[role];
        const isStrike = w.moraleTier === 'striking';
        const isSabbatical = w.moraleTier === 'sabbatical';
        const shift: ShiftType = w.shiftType || 'morning';
        if (clock.activeShift === shift && !w.isPaused && !isStrike && !isSabbatical) {
          onDutyWorkersCount++;
        }
        if (isStrike) {
          strikingWorkers.push({
            id: role,
            name: cfg?.name || role,
            emoji: cfg?.emoji || '👷',
            deadline: w.desertionDeadline || null,
          });
        } else if (isSabbatical) {
          sabbaticalWorkers.push({
            id: role,
            name: cfg?.name || role,
            emoji: cfg?.emoji || '👷',
          });
        }
      }
    }
  }

  if (specialistWorkers) {
    for (const [sId, sp] of Object.entries(specialistWorkers)) {
      if (sp?.isHired) {
        totalHiredCount++;
        const meta = LIVESTOCK_WORKER_ROSTER.find(r => r.id === sId);
        const cfg = WORKER_UPKEEP_ROSTER[sId];
        const isStrike = sp.moraleTier === 'striking' || sp.isStriking;
        const isSabbatical = sp.moraleTier === 'sabbatical';
        const shift: ShiftType = sp.shiftType || 'morning';
        if (clock.activeShift === shift && sp.isActive && !isStrike && !isSabbatical) {
          onDutyWorkersCount++;
        }
        if (isStrike) {
          strikingWorkers.push({
            id: sId,
            name: meta?.name || cfg?.name || sId,
            emoji: meta?.avatar || cfg?.emoji || '🐾',
            deadline: sp.desertionDeadline || null,
          });
        } else if (isSabbatical) {
          sabbaticalWorkers.push({
            id: sId,
            name: meta?.name || cfg?.name || sId,
            emoji: meta?.avatar || cfg?.emoji || '🐾',
          });
        }
      }
    }
  }

  // Fishery Ecosystem Metrics
  const unlockedZones = fishery?.unlockedZones || ['zone_pond'];
  const ecoMap = fishery?.zoneEcosystem || {};
  const depletedZones: { id: WaterZoneId; name: string; current: number; max: number; pct: number }[] = [];
  for (const zId of unlockedZones) {
    const eco = ecoMap[zId];
    const def = WATER_ZONES[zId];
    if (eco && def) {
      const stock = eco.currentStock ?? 0;
      const max = eco.maxStock || 1;
      const pct = Math.round((stock / max) * 100);
      if (eco.isDepleted || stock <= 0 || pct <= 20) {
        depletedZones.push({
          id: zId,
          name: def.name,
          current: stock,
          max,
          pct,
        });
      }
    }
  }

  // Count active live alerts
  const activeCriticalAlerts = [
    isFlashFlood && 'Flash Flood Crisis',
    strikingWorkers.length > 0 && `${strikingWorkers.length} Worker Strike(s)`,
    hydrationTelemetry.state === 'dehydrated' && 'Staff Dehydration Fatigue',
    rootRotPlots.length > 0 && `${rootRotPlots.length} Waterlogged Plot(s)`,
    gatesOpen && towerLiters <= 0 && 'Sluice Open with Tower Empty',
    activeCrisis && activeCrisis.resolvedStatus === 'pending' && `Crisis: ${activeCrisis.type}`,
  ].filter(Boolean);

  const activeWarningAlerts = [
    wiltedPlots.length > 0 && `${wiltedPlots.length} Wilted Plot(s)`,
    towerLiters < 100 && 'Low Tower Water',
    cisternLiters < 150 && 'Low Rain Cistern',
    isAquiferStressed && 'Aquifer Table Depleted (<25%)',
    isClogged && 'Canal Grates Silted',
    hasSediment && 'Sediment in Well Intake',
    depletedZones.length > 0 && `${depletedZones.length} Fishery Zone(s) Restocking`,
    evapInfo.evapRatePctPerMin >= 2.5 && 'Severe Evaporative Loss',
  ].filter(Boolean);

  // --- Filtered Notifications Feed ---
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      // Tab filter
      if (activeTab !== 'all' && item.category !== activeTab) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMsg = item.message.toLowerCase().includes(query);
        const matchesCategory = item.category?.toLowerCase().includes(query);
        return matchesMsg || matchesCategory;
      }
      return true;
    });
  }, [notifications, activeTab, priorityFilter, searchQuery]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts = {
      all: notifications.length,
      hazards: 0,
      hydrology: 0,
      waters_crew: 0,
      history: 0,
    };
    for (const n of notifications) {
      if (n.category && counts[n.category] !== undefined) {
        counts[n.category]++;
      }
    }
    return counts;
  }, [notifications]);

  // Shortcut Action Dispatcher
  const handleShortcutAction = (actionType: string, payload?: any) => {
    switch (actionType) {
      case 'open_spillway':
        openEmergencySpillway();
        showFeedback('⚡ Emergency Spillway opened! Diverting flood waters.');
        break;
      case 'close_spillway':
        closeEmergencySpillway();
        showFeedback('🛑 Emergency Spillway closed.');
        break;
      case 'toggle_sluice':
        toggleSluiceGates();
        showFeedback(gatesOpen ? '🛑 Sluice gates closed.' : '🌊 Sluice gates opened.');
        break;
      case 'open_sluice_console':
        setSluiceModalOpen(true);
        onClose();
        break;
      case 'pump_aquifer':
        pumpAquiferToTower(400);
        showFeedback('⛲ Pumped 400L from Aquifer into Elevated Tower.');
        break;
      case 'transfer_cistern':
        transferCisternToTower(200);
        showFeedback('💧 Transferred 200L from Cistern to Elevated Tower.');
        break;
      case 'desilt_canals':
        deSiltCanals();
        showFeedback('🧹 Canal grates cleared of silt and debris.');
        break;
      case 'deploy_dew_screens':
        deployDewScreens();
        showFeedback('🌙 Condensation screens deployed. Harvested +20L night dew!');
        break;
      case 'clear_sediment':
        clearSedimentInLine();
        showFeedback('🚰 Intake line purged of pump sediment.');
        break;
      case 'water_all':
        waterAllPlots();
        showFeedback('💧 Irrigated all available estate plots.');
        break;
      case 'clear_withered':
        if (typeof payload === 'number') {
          clearWitheredCrop(payload);
          showFeedback(`🌾 Plot #${payload + 1} cleared.`);
        } else {
          wiltedPlots.forEach(p => clearWitheredCrop(p.id));
          showFeedback(`🌾 Cleared ${wiltedPlots.length} withered plot(s).`);
        }
        break;
      case 'refill_canteen':
        refillStaffCanteen();
        showFeedback('🚰 Refilled Bunkhouse Canteen Cooler to maximum capacity.');
        break;
      case 'brew_cold_drink':
        stockColdBeverage();
        showFeedback('🧊 Brewed Citrus Infused Iced Tea for workforce velocity buff.');
        break;
      case 'refill_pond':
        refillPondFromTower();
        showFeedback('🌊 Gravity Tower discharged 500L into Farmstead Pond.');
        break;
      case 'arbitrate_strike':
        setGrievanceWorkerId(typeof payload === 'string' ? payload : strikingWorkers[0]?.id || null);
        setGrievanceModalOpen(true);
        break;
      case 'view_workers':
        onSelectTab?.('farmhands');
        onClose();
        break;
      case 'view_fishery':
        onSelectTab?.('fishery');
        onClose();
        break;
      case 'view_farm':
        onSelectTab?.('farm');
        onClose();
        break;
      case 'view_barn':
        onSelectTab?.('barn');
        onClose();
        break;
      case 'open_defense_modal':
        setCrisisModalOpen(true);
        onClose();
        break;
      case 'set_auto_cutoff':
        setAutoShutoffMoisture(75);
        showFeedback('⚙️ Set Sluice Gate Auto-Cutoff to 75% optimal saturation.');
        break;
      case 'set_weather_rain':
        setHydrologyWeather('rain');
        showFeedback('🌧️ Atmospheric conditions shifted to Rain.');
        break;
      default:
        break;
    }
  };

  const handleSimulateAlert = () => {
    addNotification(
      '⚡ Convective Electrical Storm: Atmospheric charge rising! Lightning Rod armed.',
      '⚡',
      'event',
      'hazards',
      'warning',
      { id: 'sim_hz', label: 'View Farm', actionType: 'view_farm' }
    );
    showFeedback('🔔 Sample alert logged into Dispatch Center.');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-5xl max-h-[92vh] bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100"
        >
          {/* Action Feedback Toast */}
          {actionFeedback && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-stone-950 font-bold px-4 py-2 rounded-xl shadow-lg border border-emerald-400 text-xs sm:text-sm animate-bounce flex items-center gap-2">
              <span>✅</span>
              <span>{actionFeedback}</span>
            </div>
          )}

          {/* Modal Header */}
          <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-4 border-b border-stone-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 shadow-md shrink-0">
                <span className="text-xl">📡</span>
                {activeCriticalAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-stone-900 animate-ping" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                    Estate Notification & Dispatch Center
                  </h2>
                  {activeCriticalAlerts.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600/30 border border-rose-500 text-rose-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
                      {activeCriticalAlerts.length} CRITICAL
                    </span>
                  ) : activeWarningAlerts.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      {activeWarningAlerts.length} WARNINGS
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      ALL SYSTEMS NOMINAL
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 truncate">
                  Day {clock.currentDay} · {clock.inGameTimeFormatted} ({clock.activeShiftDef.name}) · Next Shift in {clock.nextShiftChangeFormatted}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSimulateAlert}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs border border-stone-700 transition-colors"
                title="Send test alert to verify dispatch pipeline"
              >
                <span>🧪</span>
                <span>Test Alert</span>
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer border border-stone-700/80"
                aria-label="Close Dispatch Center"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Real-time Situational Awareness Telemetry Deck */}
          <div className="bg-stone-950/70 border-b border-stone-800 p-3 grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs shrink-0">
            {/* Hazards Telemetry */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
              isFlashFlood || rootRotPlots.length > 0
                ? 'bg-rose-950/40 border-rose-600/60 text-rose-200'
                : wiltedPlots.length > 0
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-stone-900/60 border-stone-800 text-stone-300'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                <span>Hazards Radar</span>
                <span>⚡</span>
              </div>
              <div className="mt-1 font-bold text-xs sm:text-sm">
                {isFlashFlood ? (
                  <span className="text-rose-400 animate-pulse flex items-center gap-1">
                    <span>🌊 Flood Crisis!</span>
                  </span>
                ) : rootRotPlots.length > 0 ? (
                  <span className="text-rose-400">
                    🪱 {rootRotPlots.length} Rot Risk
                  </span>
                ) : wiltedPlots.length > 0 ? (
                  <span className="text-amber-400">
                    🥀 {wiltedPlots.length} Wilted
                  </span>
                ) : (
                  <span className="text-emerald-400">✅ Calm Fields</span>
                )}
              </div>
              <div className="text-[10px] text-stone-400 truncate mt-0.5">
                {activeProfile.name} · {atmos.temperatureC}°C
              </div>
            </div>

            {/* Hydrology Telemetry */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
              towerLiters <= 0 && gatesOpen
                ? 'bg-rose-950/40 border-rose-600/60 text-rose-200'
                : towerLiters < 100 || isClogged
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-stone-900/60 border-stone-800 text-stone-300'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                <span>Hydrology</span>
                <span>💧</span>
              </div>
              <div className="mt-1 font-mono font-bold text-xs sm:text-sm flex items-center justify-between">
                <span>Tower: {towerLiters}L</span>
                <span className="text-[10px] text-stone-400 font-sans">
                  {gatesOpen ? '🟢 Gates Open' : '🔴 Closed'}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 truncate mt-0.5 flex items-center justify-between">
                <span>Cistern: {cisternLiters}/{cisternMax}L</span>
                <span className={evapInfo.evapRatePctPerMin >= 2.5 ? 'text-amber-400' : 'text-stone-400'}>
                  -{evapInfo.evapRatePctPerMin}%/m
                </span>
              </div>
            </div>

            {/* Workforce & Hydration Telemetry */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
              strikingWorkers.length > 0 || hydrationTelemetry.state === 'dehydrated'
                ? 'bg-rose-950/40 border-rose-600/60 text-rose-200'
                : 'bg-stone-900/60 border-stone-800 text-stone-300'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                <span>Waters & Crew</span>
                <span>👥</span>
              </div>
              <div className="mt-1 font-bold text-xs sm:text-sm flex items-center justify-between">
                <span>{onDutyWorkersCount}/{totalHiredCount} on Duty</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  hydrationTelemetry.state === 'dehydrated'
                    ? 'bg-rose-600 text-white'
                    : hydrationTelemetry.state === 'cold_infused'
                    ? 'bg-cyan-500 text-stone-950'
                    : 'bg-emerald-500/30 text-emerald-300'
                }`}>
                  {hydrationTelemetry.state === 'dehydrated' ? 'Dehydrated' : hydrationTelemetry.state === 'cold_infused' ? 'Cold-Infused' : 'Hydrated'}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 truncate mt-0.5 flex items-center justify-between">
                <span>Canteen: {canteenLiters}/{canteenCap}L</span>
                {strikingWorkers.length > 0 ? (
                  <span className="text-rose-400 font-bold">🪧 {strikingWorkers.length} Strike!</span>
                ) : (
                  <span className="text-emerald-400 font-medium">No Disputes</span>
                )}
              </div>
            </div>

            {/* Fishery Ecosystem Telemetry */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
              depletedZones.length > 0
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-stone-900/60 border-stone-800 text-stone-300'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                <span>Fishery Ecosystem</span>
                <span>🎣</span>
              </div>
              <div className="mt-1 font-bold text-xs sm:text-sm flex items-center justify-between">
                <span>{unlockedZones.length} Zones Unlocked</span>
                {depletedZones.length > 0 ? (
                  <span className="text-amber-400 text-[10px]">
                    ⏳ {depletedZones.length} Restocking
                  </span>
                ) : (
                  <span className="text-emerald-400 text-[10px]">
                    🐟 100% Stocked
                  </span>
                )}
              </div>
              <div className="text-[10px] text-stone-400 truncate mt-0.5 flex items-center justify-between">
                <span>Pond: {fishery?.pondWaterVolume || 3000}L</span>
                <span className="text-stone-400">Rotation Active</span>
              </div>
            </div>
          </div>

          {/* Category Tabs & Filter Toolbar */}
          <div className="bg-stone-900 p-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            {/* Category Partitioning Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
              {[
                { id: 'all', label: 'All Alerts', icon: '📋', count: categoryCounts.all },
                { id: 'hazards', label: 'Hazards', icon: '⚡', count: categoryCounts.hazards },
                { id: 'hydrology', label: 'Hydrology', icon: '💧', count: categoryCounts.hydrology },
                { id: 'waters_crew', label: 'Waters & Crew', icon: '👥', count: categoryCounts.waters_crew },
                { id: 'history', label: 'History', icon: '📜', count: categoryCounts.history },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-stone-950 text-amber-300' : 'bg-stone-900 text-stone-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Severity and Clear Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Severity filter buttons */}
              <div className="flex items-center bg-stone-950 rounded-lg p-0.5 border border-stone-800 text-[11px]">
                <button
                  onClick={() => setPriorityFilter('all')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                    priorityFilter === 'all' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setPriorityFilter('critical')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                    priorityFilter === 'critical' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  Critical
                </button>
                <button
                  onClick={() => setPriorityFilter('warning')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                    priorityFilter === 'warning' ? 'bg-amber-500 text-stone-950' : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  Warnings
                </button>
                <button
                  onClick={() => setPriorityFilter('info')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                    priorityFilter === 'info' ? 'bg-blue-600 text-white' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Info
                </button>
              </div>

              {/* Clear Non-Critical Logs */}
              <button
                onClick={() => {
                  clearNotifications(activeTab === 'all' ? undefined : activeTab);
                  showFeedback('Cleared non-critical history logs.');
                }}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] border border-stone-700 transition-colors"
                title="Clear non-critical logs (preserves unresolved critical alerts)"
              >
                Clear Log
              </button>
            </div>
          </div>

          {/* Search Box Bar */}
          <div className="bg-stone-950 px-4 py-2 border-b border-stone-800 flex items-center gap-2">
            <span className="text-stone-500 text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter alerts by keyword, plot #, worker name, or symptom..."
              className="w-full bg-transparent text-xs text-stone-200 placeholder-stone-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-stone-500 hover:text-stone-300 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Active Live Alerts & Chronological Dispatch Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* --- LIVE SITUATIONAL ACTION DECK (Top Priority Cards) --- */}
            {(activeTab === 'all' || activeTab === 'hazards') && (
              <>
                {/* 1. Flash Flood Crisis Card */}
                {isFlashFlood && (
                  <div className="bg-gradient-to-r from-rose-950 via-red-950 to-rose-950 border-2 border-rose-500 rounded-2xl p-4 shadow-xl shadow-rose-950/60 flex flex-wrap items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-3xl p-2 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-300 shrink-0">
                        🌊
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider">
                            CRITICAL HAZARD
                          </span>
                          <h3 className="font-black text-sm text-white">
                            Flash Flood Inundation in Progress!
                          </h3>
                        </div>
                        <p className="text-xs text-rose-200/90 mt-1">
                          Torrential storm breached reservoir network. Waterlogging root rot clock active. Divert runoff to off-map creek immediately!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleShortcutAction(isSpillwayOpen ? 'close_spillway' : 'open_spillway')}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
                          isSpillwayOpen
                            ? 'bg-rose-700 hover:bg-rose-600 text-white border border-rose-400'
                            : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950'
                        }`}
                      >
                        {isSpillwayOpen ? '🛑 Close Spillway (120L/s)' : '⚡ Open Emergency Spillway'}
                      </button>
                      <button
                        onClick={() => handleShortcutAction('open_sluice_console')}
                        className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-600"
                      >
                        🚰 Sluice Console
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Root Rot Waterlogging Threats */}
                {rootRotPlots.length > 0 && (
                  <div className="bg-rose-950/60 border border-rose-500/70 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300">
                        🪱
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[10px]">
                            CRITICAL
                          </span>
                          <span className="font-bold text-white text-sm">
                            Root Rot Threat on {rootRotPlots.length} Plot(s)
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-200/80 mt-0.5">
                          Soil moisture exceeding 95.0% saturation! Cuts harvest yield by 50% and disables crop quality.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {gatesOpen && (
                        <button
                          onClick={() => handleShortcutAction('toggle_sluice')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                        >
                          🛑 Secure Sluice Gates
                        </button>
                      )}
                      <button
                        onClick={() => handleShortcutAction('view_farm')}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-600"
                      >
                        🌾 Inspect Plots
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Crop Wilting & Heat Stasis */}
                {wiltedPlots.length > 0 && (
                  <div className="bg-amber-950/60 border border-amber-500/70 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        🥀
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-extrabold text-[10px]">
                            WARNING
                          </span>
                          <span className="font-bold text-white text-sm">
                            {wiltedPlots.length} Crop Bed(s) Heat-Wilted
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-200/80 mt-0.5">
                          High ambient heat or drought has halted crop growth (0x). Irrigate bed or clear dead foliage.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleShortcutAction('water_all')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                      >
                        💧 Irrigate All
                      </button>
                      <button
                        onClick={() => handleShortcutAction('clear_withered')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-sm cursor-pointer"
                      >
                        🧹 Clear Plots
                      </button>
                      <button
                        onClick={() => handleShortcutAction('set_weather_rain')}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-600"
                      >
                        🌧️ Rain Shift
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* --- HYDROLOGICAL DISPATCH CARDS --- */}
            {(activeTab === 'all' || activeTab === 'hydrology') && (
              <>
                {/* 4. Sluice Gate Auto-Closure / Low Tower */}
                {towerLiters <= 0 && gatesOpen && (
                  <div className="bg-rose-950/60 border border-rose-500 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300">
                        🛑
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[10px]">
                            CRITICAL
                          </span>
                          <span className="font-bold text-white text-sm">
                            Elevated Gravity Tower Ran Dry (0L)!
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-200/80 mt-0.5">
                          Sluice gates auto-secured. Canal discharge halted until gravity cistern is refilled.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleShortcutAction('pump_aquifer')}
                        disabled={isAquiferStressed}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                      >
                        ⛲ Pump Aquifer (+400L)
                      </button>
                      <button
                        onClick={() => handleShortcutAction('open_sluice_console')}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-600"
                      >
                        🚰 Sluice Console
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Canal Sediment & Debris Clog */}
                {isClogged && (
                  <div className="bg-amber-950/50 border border-amber-500/60 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        🧹
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-extrabold text-[10px]">
                            WARNING
                          </span>
                          <span className="font-bold text-white text-sm">
                            Canal Grates Clogged with Debris
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-200/80 mt-0.5">
                          Leaf litter and silt blocking intake screens. Gravity flow to thirsty plots reduced to 0.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleShortcutAction('desilt_canals')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-sm cursor-pointer shrink-0"
                    >
                      🧹 De-Silt Canal Grates
                    </button>
                  </div>
                )}

                {/* 6. Evaporative Alert */}
                {evapInfo.evapRatePctPerMin >= 2.5 && (
                  <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        🌡️
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-extrabold text-[10px]">
                            WARNING
                          </span>
                          <span className="font-bold text-white text-sm">
                            High Evaporative Loss (-{evapInfo.evapRatePctPerMin}%/min)
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-200/80 mt-0.5">
                          High ambient temperature ({atmos.temperatureC}°C) accelerating surface desiccation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleShortcutAction('set_auto_cutoff')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                      >
                        ⚙️ Set Auto-Cutoff (75%)
                      </button>
                      <button
                        onClick={() => handleShortcutAction('deploy_dew_screens')}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-600"
                      >
                        🌙 Deploy Dew Screens
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* --- WATERS & CREW DISPATCH CARDS --- */}
            {(activeTab === 'all' || activeTab === 'waters_crew') && (
              <>
                {/* 7. Worker Strike Dispute */}
                {strikingWorkers.length > 0 && (
                  <div className="bg-gradient-to-r from-rose-950 via-red-950 to-rose-950 border-2 border-rose-500 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-3xl p-2 rounded-xl bg-rose-600/30 border border-rose-500 text-rose-300 shrink-0">
                        🪧
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider">
                            CRITICAL LABOR DISPUTE
                          </span>
                          <h3 className="font-black text-sm text-white">
                            {strikingWorkers.length === 1
                              ? `${strikingWorkers[0].name} is on strike!`
                              : `${strikingWorkers.length} Staff on Strike!`}
                          </h3>
                        </div>
                        <p className="text-xs text-rose-200/90 mt-1">
                          Unpaid wage or food arrears triggered an active strike. Desertion deadline running!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleShortcutAction('arbitrate_strike', strikingWorkers[0].id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        ⚖️ Arbitrate Dispute
                      </button>
                      <button
                        onClick={() => handleShortcutAction('view_workers')}
                        className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-600"
                      >
                        👷 Workers Hub
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. Worker Dehydration Fatigue */}
                {hydrationTelemetry.state === 'dehydrated' && (
                  <div className="bg-rose-950/60 border border-rose-500 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300">
                        🏜️
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[10px]">
                            CRITICAL
                          </span>
                          <span className="font-bold text-white text-sm">
                            Workforce Dehydration: -50% Speed Penalty!
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-200/80 mt-0.5">
                          Bunkhouse Canteen cooler is dry under high ambient heat. Refill canteen immediately.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleShortcutAction('refill_canteen')}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                      >
                        🚰 Refill Canteen (60L)
                      </button>
                      <button
                        onClick={() => handleShortcutAction('brew_cold_drink')}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-sm cursor-pointer"
                      >
                        🧊 Brew Iced Tea
                      </button>
                    </div>
                  </div>
                )}

                {/* 9. Fishery Depleted / Restocking Zones */}
                {depletedZones.length > 0 && (
                  <div className="bg-amber-950/50 border border-amber-500/60 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="text-2xl p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0 mt-0.5">
                        🐟
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-extrabold text-[10px]">
                            REPLENISHING
                          </span>
                          <span className="font-bold text-white text-sm">
                            Biological Fish Stock Recovery ({depletedZones.length} Zones)
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-200/80 mt-1 leading-relaxed">
                          Fish populations naturally regenerate on a spawn timer. Dock Master rotation holds anglers until stocks recover:
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {depletedZones.map(z => (
                            <span key={z.id} className="px-2 py-0.5 rounded-lg bg-stone-900/80 border border-amber-500/30 text-amber-200 font-mono text-[10px] flex items-center gap-1">
                              <span>🐟</span>
                              <span className="font-sans font-medium text-stone-300">{z.name}:</span>
                              <span className="font-bold text-amber-300">{z.current}/{z.max} ({z.pct}%)</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(fishery?.pondWaterVolume ?? 3000) < 3000 && (
                        <button
                          onClick={() => handleShortcutAction('refill_pond')}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                          title="Discharge 500L from Gravity Tower into Farmstead Pond"
                        >
                          🌊 Refill Pond (+500L)
                        </button>
                      )}
                      <button
                        onClick={() => handleShortcutAction('view_fishery')}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1"
                      >
                        <span>🎣</span>
                        <span>Inspect Fishery Docks</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* --- NOTIFICATIONS FEED (Chronological Audit Trail) --- */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-2 font-bold px-1">
                <span>
                  {activeTab === 'history'
                    ? 'Chronological Estate Audit Trail'
                    : `Notification Log Entries (${filteredNotifications.length})`}
                </span>
                <span>Sorted by most recent</span>
              </div>

              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center bg-stone-950/50 border border-stone-800 rounded-2xl">
                  <div className="text-4xl mb-2">📜</div>
                  <h4 className="font-bold text-sm text-stone-300">No Notifications Recorded</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No events match your filter query. Try clearing the search box.'
                      : 'All estate subsystems are running quietly. Automated tasks will log here in real time.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map(item => {
                    const ageMs = now - item.createdAt;
                    const ageSec = Math.max(0, Math.floor(ageMs / 1000));
                    const timeAgoStr =
                      ageSec < 60
                        ? `${ageSec}s ago`
                        : ageSec < 3600
                        ? `${Math.floor(ageSec / 60)}m ago`
                        : `${Math.floor(ageSec / 3600)}h ago`;

                    const isCrit = item.priority === 'critical';
                    const isWarn = item.priority === 'warning';

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-2.5 ${
                          isCrit
                            ? 'bg-rose-950/40 border-rose-500/80 text-rose-100 shadow-sm shadow-rose-950/30'
                            : isWarn
                            ? 'bg-amber-950/30 border-amber-500/50 text-amber-100'
                            : 'bg-stone-900/80 border-stone-800 text-stone-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="text-xl select-none shrink-0 mt-0.5">{item.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                                  isCrit
                                    ? 'bg-rose-600 text-white'
                                    : isWarn
                                    ? 'bg-amber-500 text-stone-950 font-extrabold'
                                    : 'bg-stone-800 text-stone-400'
                                }`}
                              >
                                {item.priority || 'INFO'}
                              </span>

                              {item.category && (
                                <span className="px-1.5 py-0.2 rounded bg-stone-950/60 text-stone-400 text-[9px] font-bold uppercase tracking-wider border border-stone-800">
                                  {item.category.replace('_', ' & ')}
                                </span>
                              )}

                              <span className="text-[10px] text-stone-500 font-mono">
                                {timeAgoStr}
                              </span>
                            </div>

                            <p className="text-xs mt-1 text-stone-200 leading-relaxed font-medium break-words">
                              {item.message}
                            </p>
                          </div>
                        </div>

                        {/* Direct Shortcut or Dismiss Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {item.shortcut && (
                            <button
                              onClick={() => handleShortcutAction(item.shortcut!.actionType, item.shortcut!.payload || item.targetId)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              {item.shortcut.icon && <span>{item.shortcut.icon}</span>}
                              <span>{item.shortcut.label}</span>
                            </button>
                          )}

                          <button
                            onClick={() => dismissNotification(item.id)}
                            className="p-1 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-800 text-xs transition-colors"
                            title="Dismiss log entry"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-stone-950 p-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 shrink-0">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Estate Dispatch Engine Active</span>
              <span className="text-stone-600">·</span>
              <span>150-event chronological audit log retention</span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs border border-stone-700 transition-colors cursor-pointer"
            >
              Close Dispatch Center
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Grievance Arbitration Modal */}
      <GrievanceResolutionModal
        isOpen={grievanceModalOpen}
        onClose={() => setGrievanceModalOpen(false)}
        initialWorkerId={grievanceWorkerId}
      />
    </>
  );
}
