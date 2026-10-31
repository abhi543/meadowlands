'use client';

import { useState, useEffect } from 'react';
import { cloudSyncEngine } from '@/lib/firebase/cloudSyncEngine';
import { linkCurrentGuestToGoogle, switchToGoogleAccount } from '@/lib/firebase/authService';
import type { CloudSyncTelemetry } from '@/lib/firebase/types';

interface CloudSyncIndicatorProps {
  onOpenAccountModal?: () => void;
  className?: string;
}

export function CloudSyncIndicator({ onOpenAccountModal, className = '' }: CloudSyncIndicatorProps) {
  const [telemetry, setTelemetry] = useState<CloudSyncTelemetry>(cloudSyncEngine.getTelemetry());
  const [isElevationModalOpen, setIsElevationModalOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showSwitchOption, setShowSwitchOption] = useState(false);

  useEffect(() => {
    return cloudSyncEngine.subscribe(setTelemetry);
  }, []);

  const handleManualSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await cloudSyncEngine.flushImmediateSave();
  };

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    setLinkError(null);
    setShowSwitchOption(false);

    const res = await linkCurrentGuestToGoogle();
    setIsLinking(false);

    if (res.success) {
      setIsElevationModalOpen(false);
      await cloudSyncEngine.flushImmediateSave();
    } else {
      setLinkError(res.errorMessage || 'Failed to link Google Account.');
      if (res.error === 'already_in_use') {
        setShowSwitchOption(true);
      }
    }
  };

  const handleSwitchAccount = async () => {
    setIsLinking(true);
    setLinkError(null);
    const res = await switchToGoogleAccount();
    setIsLinking(false);

    if (res.success) {
      setIsElevationModalOpen(false);
      window.location.reload(); // Reload cleanly to hydrate cloud state from elevated user
    } else {
      setLinkError(res.errorMessage || 'Failed to switch Google Account.');
    }
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Sync Status Badge */}
        <button
          type="button"
          onClick={() => setIsElevationModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-all shadow-xs border cursor-pointer bg-stone-900/60 hover:bg-stone-900/80 border-white/20 text-stone-200"
          title={
            telemetry.status === 'syncing'
              ? 'Syncing changes to Cloud...'
              : telemetry.status === 'synced'
              ? `All progress saved to Cloud as ${telemetry.displayName || 'Player'}`
              : telemetry.status === 'error'
              ? telemetry.errorMessage || 'Offline / Local save only'
              : 'Saved locally'
          }
        >
          {telemetry.status === 'syncing' && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-amber-300 font-semibold text-[11px]">Syncing...</span>
            </>
          )}

          {telemetry.status === 'synced' && (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span className="text-emerald-300 font-medium text-[11px] truncate max-w-[120px]">
                {telemetry.displayName ? `👤 ${telemetry.displayName}` : 'Cloud Synced'}
              </span>
            </>
          )}

          {telemetry.status === 'local' && (
            <>
              <span className="h-2 w-2 rounded-full bg-stone-400"></span>
              <span className="text-stone-300 text-[11px] truncate max-w-[120px]">
                {telemetry.displayName ? `👤 ${telemetry.displayName}` : 'Saved Locally'}
              </span>
            </>
          )}

          {telemetry.status === 'error' && (
            <>
              <span className="h-2 w-2 rounded-full bg-red-400"></span>
              <span className="text-red-300 text-[11px]">
                {telemetry.displayName ? `👤 ${telemetry.displayName}` : 'Offline'}
              </span>
            </>
          )}

          {telemetry.isGuest ? (
            <span className="ml-1 text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-500/30">
              Guest
            </span>
          ) : (
            <span className="ml-1 text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
              Cloud
            </span>
          )}
        </button>

        {/* Quick Manual Cloud Save Button */}
        {telemetry.status === 'error' && (
          <button
            type="button"
            onClick={handleManualSave}
            className="px-2 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/90 border border-white/15"
            title="Retry cloud save"
          >
            🔄 Retry
          </button>
        )}
      </div>

      {/* Account Elevation & Profile Modal */}
      {isElevationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700 text-stone-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">☁️</span>
                <div>
                  <h3 className="font-bold text-base">Studio Identity & Cloud Save</h3>
                  <p className="text-xs text-stone-400">Project Meadowlands · Multi-Game Profile</p>
                </div>
              </div>
              <button
                onClick={() => setIsElevationModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Current Status Box */}
            <div className="bg-stone-950/60 rounded-xl p-3 border border-stone-800 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Player Handle:</span>
                <span className="font-semibold text-amber-300">{telemetry.displayName || 'Guest Player'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Account Type:</span>
                <span className="font-medium">
                  {telemetry.isGuest ? '🟡 Anonymous Guest Session' : '🟢 Verified Google Account'}
                </span>
              </div>
              {telemetry.userEmail && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Email:</span>
                  <span className="text-emerald-400 font-mono">{telemetry.userEmail}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Cloud Sync Status:</span>
                <span className="capitalize">{telemetry.status}</span>
              </div>
              {telemetry.lastSyncedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Last Synced:</span>
                  <span className="text-stone-300">{new Date(telemetry.lastSyncedAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {/* Guest Warning / Elevation Call-to-action */}
            {telemetry.isGuest ? (
              <div className="space-y-3">
                <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 text-xs text-amber-200/90 leading-relaxed">
                  <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <span>⚠️</span> Playing as Guest
                  </div>
                  Your game progress is saved on this browser only. Link a Google Account to enable cross-device play without losing your current progress.
                </div>

                {linkError && (
                  <div className="bg-red-950/50 border border-red-600/50 rounded-xl p-3 text-xs text-red-200 space-y-2">
                    <p>{linkError}</p>
                    {showSwitchOption && (
                      <button
                        onClick={handleSwitchAccount}
                        disabled={isLinking}
                        className="w-full mt-1 px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg font-medium text-xs transition-colors"
                      >
                        Switch to Existing Google Profile
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  disabled={isLinking}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:bg-stone-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span>🔗</span>
                  {isLinking ? 'Connecting Google Account...' : 'Link Google Account to Enable Cross-Device Play'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-xl p-3 text-xs text-emerald-200/90 leading-relaxed">
                  <div className="font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
                    <span>✓</span> Cloud Sync Active
                  </div>
                  Your progress is securely backed up to the cloud. You can continue this save on any phone, tablet, or browser by signing into this Google account.
                </div>

                <button
                  type="button"
                  onClick={handleManualSave}
                  className="w-full py-2 px-4 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-stone-700"
                >
                  <span>💾</span> Force Cloud Sync Now
                </button>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsElevationModalOpen(false)}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

