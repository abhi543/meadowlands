'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { WORKER_UPKEEP_ROSTER } from '@/data/workerUpkeep';
import { LIVESTOCK_WORKER_ROSTER } from '@/data/workerCatalog';
import { GrievanceResolutionModal } from './GrievanceResolutionModal';

export function PicketAlertBanner() {
  const { unifiedWorkers, specialistWorkers } = useGameStore();
  const [, setTick] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  // Re-render tick every second to keep desertion countdown live
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const strikingWorkers: { id: string; name: string; emoji: string; deadline: number | null }[] = [];
  const sabbaticalWorkers: { id: string; name: string; emoji: string }[] = [];

  const now = Date.now();

  if (unifiedWorkers) {
    for (const [role, w] of Object.entries(unifiedWorkers)) {
      if (w?.isHired) {
        const cfg = WORKER_UPKEEP_ROSTER[role];
        if (w.moraleTier === 'striking') {
          strikingWorkers.push({
            id: role,
            name: cfg?.name || role,
            emoji: cfg?.emoji || '👷',
            deadline: w.desertionDeadline || null,
          });
        } else if (w.moraleTier === 'sabbatical') {
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
        const meta = LIVESTOCK_WORKER_ROSTER.find(r => r.id === sId);
        const cfg = WORKER_UPKEEP_ROSTER[sId];
        const isStrike = sp.moraleTier === 'striking' || sp.isStriking;
        if (isStrike) {
          strikingWorkers.push({
            id: sId,
            name: meta?.name || cfg?.name || sId,
            emoji: meta?.avatar || cfg?.emoji || '🐾',
            deadline: sp.desertionDeadline || null,
          });
        } else if (sp.moraleTier === 'sabbatical') {
          sabbaticalWorkers.push({
            id: sId,
            name: meta?.name || cfg?.name || sId,
            emoji: meta?.avatar || cfg?.emoji || '🐾',
          });
        }
      }
    }
  }

  if (strikingWorkers.length === 0 && sabbaticalWorkers.length === 0) {
    return null;
  }

  // Active Strike Alert Banner
  if (strikingWorkers.length > 0) {
    // Find shortest remaining desertion time
    let minRemainingSec = 7200;
    for (const w of strikingWorkers) {
      if (w.deadline) {
        const rem = Math.max(0, Math.ceil((w.deadline - now) / 1000));
        if (rem < minRemainingSec) minRemainingSec = rem;
      }
    }
    const h = Math.floor(minRemainingSec / 3600);
    const m = Math.floor((minRemainingSec % 3600) / 60);
    const s = minRemainingSec % 60;
    const countdownStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    const bannerTitle = strikingWorkers.length === 1
      ? `${strikingWorkers[0].name} is on strike!`
      : `${strikingWorkers.length} workers are on strike!`;

    return (
      <>
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-2 border-rose-600 rounded-xl p-3 shadow-lg shadow-rose-950/50 flex flex-wrap items-center justify-between gap-2.5 animate-pulse">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl p-1.5 rounded-lg bg-rose-600/30 border border-rose-500 shrink-0">
              🪧
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-rose-200 font-black text-xs sm:text-sm tracking-wide flex items-center gap-1.5">
                  <span>LABOR DISPUTE:</span>
                  <span className="text-white font-extrabold">{bannerTitle}</span>
                </span>
                <span className="bg-rose-950 text-rose-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border border-rose-500/50">
                  Desertion in {countdownStr}
                </span>
              </div>
              <p className="text-[11px] text-rose-200/80 truncate">
                Automation paused for striking staff. Unresolved grievances cause permanent desertion.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedWorkerId(strikingWorkers[0].id);
              setModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            ⚖️ Arbitrate Dispute
          </button>
        </div>

        <GrievanceResolutionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialWorkerId={selectedWorkerId}
        />
      </>
    );
  }

  // Furloughed / Sabbatical Banner (when no active strikes, but workers on sabbatical)
  return (
    <>
      <div className="bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-blue-950/80 border border-blue-500/40 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛑</span>
          <div>
            <span className="font-bold text-blue-200">
              {sabbaticalWorkers.length} staff on Unpaid Sabbatical (Furloughed).
            </span>
            <span className="text-stone-400 text-[11px] ml-1.5">
              Daily wages and food burn frozen to 0.
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedWorkerId(sabbaticalWorkers[0].id);
            setModalOpen(true);
          }}
          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs shrink-0"
        >
          Review Contracts
        </button>
      </div>

      <GrievanceResolutionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialWorkerId={selectedWorkerId}
      />
    </>
  );
}
