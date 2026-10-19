'use client';

import React from 'react';
import { useGameStore } from '@/game/store';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins > 0 ? `${remMins}m` : ''}`;
}

export const OfflineHydrologyReturnModal: React.FC = () => {
  const report = useGameStore(state => state.offlineHydrologyReport);
  const dismissReport = useGameStore(state => state.dismissOfflineHydrologyReport);
  const setSluiceModalOpen = useGameStore(state => state.setSluiceModalOpen);

  if (!report) return null;

  const stageBadgeInfo = (() => {
    switch (report.stageReached) {
      case 0:
        return { label: 'Stage 0: Nominal State', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400', icon: '🟢' };
      case 1:
        return { label: 'Stage 1: Crop Conservation', color: 'bg-amber-500/20 text-amber-300 border-amber-400', icon: '🟡' };
      case 2:
        return { label: 'Stage 2: Crew Rationing', color: 'bg-orange-500/20 text-orange-300 border-orange-400', icon: '🟠' };
      case 3:
      default:
        return { label: 'Stage 3: Cryo-Standby Locked', color: 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse', icon: '🔴' };
    }
  })();

  const handleAcknowledge = () => {
    dismissReport();
    setSluiceModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden text-stone-100">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-sky-950 via-cyan-950 to-stone-900 px-5 py-4 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-xl shadow-inner">
              🚰
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-black">
                ESTATE DISPATCH CENTER • HYDRAULIC TELEMETRY
              </span>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Elevated Tower Fail-Safe Report
              </h3>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${stageBadgeInfo.color}`}>
            <span>{stageBadgeInfo.icon}</span>
            <span>{stageBadgeInfo.label}</span>
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Top Duration & Stage Context */}
          <div className="bg-stone-950/80 rounded-xl p-3.5 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Total Absence Duration:</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">
                ⏱️ {formatDuration(report.elapsedOfflineSeconds)}
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              While away from the estate, the <strong className="text-cyan-300">Automated Load-Shedding Ladder</strong> engaged to safeguard your farm against catastrophic crop withering and specimen decay.
            </p>
          </div>

          {/* Dual-Basin Reserves Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Gravity Tower */}
            <div className="bg-stone-800/80 rounded-xl p-3 border border-stone-700/80 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Elevated Gravity Tower
              </span>
              <div className="font-mono text-base font-extrabold text-white flex items-baseline gap-1">
                <span className={report.finalTowerLiters <= 80 ? 'text-rose-400' : report.finalTowerLiters <= 200 ? 'text-amber-400' : 'text-emerald-400'}>
                  {report.finalTowerLiters}L
                </span>
                <span className="text-xs text-stone-400">/ 800L</span>
              </div>
              <div className="text-[11px] text-stone-400">
                Initial: {report.initialTowerLiters}L
              </div>
            </div>

            {/* Deep Aquifer */}
            <div className="bg-stone-800/80 rounded-xl p-3 border border-stone-700/80 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Deep Subsoil Aquifer
              </span>
              <div className="font-mono text-base font-extrabold text-teal-300 flex items-baseline gap-1">
                <span>{report.finalAquiferLiters.toLocaleString()}L</span>
              </div>
              <div className="text-[11px] text-stone-400">
                Reserve Buffer Active
              </div>
            </div>
          </div>

          {/* Load-Shedding Event Sequence */}
          <div className="bg-stone-950/60 rounded-xl p-3.5 border border-stone-800 space-y-2 text-xs">
            <h4 className="font-bold text-stone-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>📋</span> Offline Hydraulic Actions Recorded
            </h4>
            
            <ul className="space-y-1.5 text-stone-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">•</span>
                <div>
                  {report.cropConservationEngagedSec !== null ? (
                    <>
                      <strong>Crop Conservation Mode:</strong> Sluice gates auto-secured at{' '}
                      <span className="font-mono text-amber-300">{formatDuration(report.cropConservationEngagedSec)}</span> into absence. Plot growth paused cleanly without withering.
                    </>
                  ) : (
                    <>
                      <strong>Nominal Water Levels:</strong> Tower remained above 200L. Crop growth ran continuously throughout your absence.
                    </>
                  )}
                </div>
              </li>

              {report.totalSiphonedLiters > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold shrink-0">•</span>
                  <div>
                    <strong>Emergency Siphon Float Valve:</strong> Auto-activated at &le;80L, pulling{' '}
                    <span className="font-mono text-cyan-300 font-bold">+{report.totalSiphonedLiters}L</span> from the Deep Aquifer to replenish tower head.
                  </div>
                </li>
              )}

              {report.workerRationingApplied && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold shrink-0">•</span>
                  <div>
                    <strong>Crew Hydration Rationing:</strong> Staff shifted to emergency rations (-30% speed). Desertion and strike deadlines were permanently frozen.
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Bio-Lab Specimen Safety Seal */}
          <div className="rounded-xl p-3.5 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 flex items-start gap-3">
            <div className="text-2xl shrink-0">🛡️</div>
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                <span>Cryo-Standby Preservation Lock: Zero Specimen Loss</span>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-tight">
                {report.specimensPreservedCount > 0 ? (
                  <>
                    All <strong>{report.specimensPreservedCount} active incubation chamber(s)</strong> entered Cryo-Standby cooling. Timers were safely suspended within the 24-hour grace window—zero decay or rot occurred.
                  </>
                ) : (
                  <>
                    Amber Bio-Lab chillers remained 100% stabilized throughout the absence window.
                  </>
                )}
              </p>
            </div>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-end">
          <button
            type="button"
            onClick={handleAcknowledge}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-stone-950 uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Acknowledge &amp; Open Hydrology</span>
            <span>&rarr;</span>
          </button>
        </div>

      </div>
    </div>
  );
};
