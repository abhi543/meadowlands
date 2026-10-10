'use client';

import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useGameStore } from '@/game/store';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;
  otpEmail: string;

  // Actions
  initAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (token: string) => Promise<{ success: boolean; error?: string }>;
  resetOtpState: () => void;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isGuest: true,
  isLoading: false,
  error: null,
  otpSent: false,
  otpEmail: '',

  initAuth: async () => {
    if (!isSupabaseConfigured()) {
      set({ isGuest: true, isLoading: false });
      return;
    }

    set({ isLoading: true });

    try {
      // 1. Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        const isAnon = session.user.is_anonymous ?? false;
        set({
          user: session.user,
          session,
          isGuest: isAnon,
          isLoading: false,
        });

        // Ensure game store reflects authenticated state across browser restarts
        if (!isAnon) {
          useGameStore.setState({ isGuest: false });
        }
      } else {
        // Zero-friction guest start: stay local guest without creating ghost anonymous users
        set({ user: null, session: null, isGuest: true, isLoading: false });
      }

      // 2. Listen to auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const isAnon = session.user.is_anonymous ?? false;
          set({
            user: session.user,
            session,
            isGuest: isAnon,
            isLoading: false,
            otpSent: false,
            otpEmail: '',
          });

          if (!isAnon) {
            const gameStore = useGameStore.getState();
            if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && gameStore.isGuest) {
              gameStore.claimAccountLinkReward();
            } else {
              useGameStore.setState({ isGuest: false });
            }
          }
        } else {
          set({ user: null, session: null, isGuest: true, isLoading: false });
          useGameStore.setState({ isGuest: true });
        }
      });
    } catch (err: any) {
      console.warn('Auth initialization fallback:', err?.message || err);
      set({ user: null, session: null, isGuest: true, isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured()) {
      const err = 'Supabase credentials are not configured in environment variables.';
      set({ error: err });
      return { success: false, error: err };
    }

    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      const message = err?.message || 'Google sign-in failed. Please try again.';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  sendEmailOtp: async (email: string) => {
    if (!isSupabaseConfigured()) {
      const err = 'Supabase credentials are not configured in environment variables.';
      set({ error: err });
      return { success: false, error: err };
    }

    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
        },
      });

      if (error) throw error;
      set({ otpSent: true, otpEmail: email, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const message = err?.message || 'Failed to dispatch email verification code.';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  verifyEmailOtp: async (token: string) => {
    const { otpEmail } = get();
    if (!otpEmail) {
      const message = 'No email specified for OTP verification.';
      set({ error: message });
      return { success: false, error: message };
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: token.trim(),
        type: 'email',
      });

      if (error) throw error;

      if (data.user) {
        set({
          user: data.user,
          session: data.session,
          isGuest: false,
          isLoading: false,
          otpSent: false,
          otpEmail: '',
          error: null,
        });

        // Trigger in-game reward & set isGuest: false in game store
        const gameStore = useGameStore.getState();
        gameStore.claimAccountLinkReward();

        return { success: true };
      }

      throw new Error('Verification completed but no user session received.');
    } catch (err: any) {
      const message = err?.message || 'Invalid or expired 6-digit code. Please retry.';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  resetOtpState: () => {
    set({ otpSent: false, otpEmail: '', error: null });
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } finally {
      set({ user: null, session: null, isGuest: true, isLoading: false, error: null });
      useGameStore.setState({ isGuest: true });
    }
  },

  clearError: () => set({ error: null }),
}));
