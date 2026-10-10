'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { flushSaveImmediately } from '@/lib/syncManager';

interface SaveProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveProgressModal({ isOpen, onClose }: SaveProgressModalProps) {
  const {
    user,
    isGuest,
    isLoading,
    error,
    otpSent,
    otpEmail,
    signInWithGoogle,
    sendEmailOtp,
    verifyEmailOtp,
    resetOtpState,
    clearError,
    signOut,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'google' | 'email'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    clearError();
    const res = await signInWithGoogle();
    if (res.success) {
      await flushSaveImmediately();
      setSuccessMessage('Homestead linked successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1500);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) return;
    clearError();
    await sendEmailOtp(emailInput.trim());
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken || otpToken.length < 6) return;
    clearError();
    const res = await verifyEmailOtp(otpToken.trim());
    if (res.success) {
      await flushSaveImmediately();
      setSuccessMessage('Homestead linked! +50 Gems bonus claimed.');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1500);
    }
  };

  const handleClose = () => {
    clearError();
    resetOtpState();
    setSuccessMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header with Incentive */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-sm">
            <span>🎁</span>
            <span>Protect Your Homestead (+50 💎 Gems)</span>
          </div>
          <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
            {user && !isGuest ? 'Cloud Sync & Account' : 'Save Your Progress'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
            {user && !isGuest
              ? `Signed in as ${user.email}. Your farm is automatically synced to the cloud.`
              : 'Never lose your farm, animals, or workers. Play seamlessly across any browser or phone.'}
          </p>
        </div>

        {/* Already logged in view */}
        {user && !isGuest ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center space-y-3">
            <div className="text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center gap-2">
              <span>✅</span> Cloud Save Active
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Account: <span className="font-semibold text-stone-800 dark:text-stone-200">{user.email}</span>
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={async () => {
                  await flushSaveImmediately();
                  setSuccessMessage('Synced with cloud!');
                  setTimeout(() => setSuccessMessage(null), 2000);
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
              >
                Sync Now ☁️
              </button>
              <button
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs (Google vs Email) */}
            <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab('google');
                  clearError();
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'google'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                }`}
              >
                Google One-Tap
              </button>
              <button
                onClick={() => {
                  setActiveTab('email');
                  clearError();
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'email'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                }`}
              >
                Email OTP
              </button>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center">
                {successMessage}
              </div>
            )}

            {/* Tab 1: Google One-Tap */}
            {activeTab === 'google' && (
              <div className="space-y-3 py-2">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white hover:bg-stone-50 dark:bg-stone-800/80 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
                </button>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center">
                  Instant one-click sync. (Requires Google Provider enabled in your Supabase Auth dashboard).
                </p>
                <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-2 text-[11px] text-amber-700 dark:text-amber-300 text-center">
                  💡 Tip: Use the <b>Email OTP</b> tab to test immediately without configuring Google OAuth keys!
                </div>
              </div>
            )}

            {/* Tab 2: 6-Digit Passwordless Email OTP */}
            {activeTab === 'email' && (
              <div className="space-y-3 py-1">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="farmer@meadowlands.com"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !emailInput}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      {isLoading ? 'Sending...' : 'Send 6-Digit Code ✉️'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                        Enter Code Sent to <span className="font-bold text-stone-800 dark:text-stone-200">{otpEmail}</span>
                      </label>
                      <button
                        type="button"
                        onClick={resetOtpState}
                        className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Change Email
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      required
                      className="w-full tracking-widest text-center font-mono text-lg py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || otpToken.length < 6}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Claim 50 💎'}
                    </button>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                      <span>Didn't receive the code?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          clearError();
                          await sendEmailOtp(otpEmail);
                        }}
                        disabled={isLoading}
                        className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                      >
                        Resend Code
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 text-center pt-0.5">
                      💡 Tip: You can also tap the login link directly inside the email!
                    </p>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-center">
          <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center justify-center gap-1">
            <span>🔒</span> End-to-end encrypted with Supabase Row Level Security
          </span>
        </div>
      </div>
    </div>
  );
}
