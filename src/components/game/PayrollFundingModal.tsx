'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/game/store';

interface PayrollFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyBurn: number;
}

export function PayrollFundingModal({ isOpen, onClose, dailyBurn }: PayrollFundingModalProps) {
  const { coins, payrollVaultCoins, depositToPayrollVault, withdrawFromPayrollVault } = useGameStore();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amountStr, setAmountStr] = useState<string>('');

  if (!isOpen) return null;

  const currentStaged = payrollVaultCoins || 0;
  const currentWallet = coins || 0;
  const amount = parseInt(amountStr, 10) || 0;

  const handleQuickFill = (val: number) => {
    if (activeTab === 'deposit') {
      const clamped = Math.max(1, Math.min(val, currentWallet));
      setAmountStr(clamped.toString());
    } else {
      const clamped = Math.max(1, Math.min(val, currentStaged));
      setAmountStr(clamped.toString());
    }
  };

  const handleExecute = () => {
    if (amount <= 0) return;
    if (activeTab === 'deposit') {
      if (amount > currentWallet) return;
      depositToPayrollVault(amount);
    } else {
      if (amount > currentStaged) return;
      withdrawFromPayrollVault(amount);
    }
    setAmountStr('');
    onClose();
  };

  const isDeposit = activeTab === 'deposit';
  const maxAvailable = isDeposit ? currentWallet : currentStaged;
  const canSubmit = amount > 0 && amount <= maxAvailable;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-stone-900 border border-amber-500/40 p-5 shadow-2xl shadow-black text-stone-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-300">
                Payroll Vault Coin Staging
              </h3>
              <p className="text-xs text-stone-400">Strictly isolated from settlement auto-deductions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => { setActiveTab('deposit'); setAmountStr(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isDeposit
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            📥 Deposit to Vault
          </button>
          <button
            onClick={() => { setActiveTab('withdraw'); setAmountStr(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isDeposit
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            📤 Withdraw to Purse
          </button>
        </div>

        {/* Balance Status Card */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
            <div className="text-stone-400">Your Coin Purse:</div>
            <div className="text-base font-black text-amber-400 flex items-center gap-1">
              <span>🪙</span>
              <span>{currentWallet.toLocaleString()}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-stone-950/70 border border-amber-500/20 space-y-1">
            <div className="text-stone-400">Payroll Vault Staged:</div>
            <div className="text-base font-black text-emerald-400 flex items-center gap-1">
              <span>🔒</span>
              <span>{currentStaged.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Buffer Fill Presets (Deposit Mode) */}
        {isDeposit && dailyBurn > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-stone-400 flex justify-between">
              <span>Quick Runway Presets:</span>
              <span className="text-amber-400">Burn: {dailyBurn.toLocaleString()} / day</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill(dailyBurn)}
                className="px-2 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[11px] border border-stone-700 hover:border-amber-500/50 transition-all text-center"
              >
                +1 Day
                <div className="text-[9px] text-stone-400 font-normal">+{dailyBurn}</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(dailyBurn * 3)}
                className="px-2 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[11px] border border-stone-700 hover:border-amber-500/50 transition-all text-center"
              >
                +3 Days
                <div className="text-[9px] text-stone-400 font-normal">+{dailyBurn * 3}</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(dailyBurn * 7)}
                className="px-2 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[11px] border border-stone-700 hover:border-amber-500/50 transition-all text-center"
              >
                +7 Days
                <div className="text-[9px] text-stone-400 font-normal">+{dailyBurn * 7}</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(currentWallet)}
                className="px-2 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 font-bold text-[11px] border border-amber-600/40 hover:border-amber-400 transition-all text-center"
              >
                Max Purse
                <div className="text-[9px] text-stone-400 font-normal">All coins</div>
              </button>
            </div>
          </div>
        )}

        {/* Quick Buffer Fill Presets (Withdraw Mode) */}
        {!isDeposit && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-stone-400">Withdraw Shortcuts:</div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill(Math.floor(currentStaged * 0.25))}
                className="px-2 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[11px] border border-stone-700 transition-all"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(Math.floor(currentStaged * 0.5))}
                className="px-2 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-[11px] border border-stone-700 transition-all"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(currentStaged)}
                className="px-2 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 font-bold text-[11px] border border-amber-600/40 transition-all"
              >
                All (100%)
              </button>
            </div>
          </div>
        )}

        {/* Manual Amount Stepper */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-300">
            {isDeposit ? 'Coins to Deposit into Vault:' : 'Coins to Withdraw to Purse:'}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAmountStr(Math.max(0, amount - 50).toString())}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 font-bold text-sm text-stone-300 transition-colors"
            >
              -50
            </button>
            <input
              type="number"
              min="0"
              max={maxAvailable}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="Enter coin amount..."
              className="flex-1 py-2 px-3 rounded-xl bg-stone-950 border border-stone-700 focus:border-amber-500 focus:outline-hidden text-center font-bold text-amber-400 text-base"
            />
            <button
              type="button"
              onClick={() => setAmountStr(Math.min(maxAvailable, amount + 50).toString())}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 font-bold text-sm text-stone-300 transition-colors"
            >
              +50
            </button>
          </div>
        </div>

        {/* Projected Staging Result */}
        <div className="p-2.5 rounded-xl bg-stone-950/50 border border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
          <span>Projected Staged Longevity:</span>
          <span className="font-bold text-emerald-400">
            {dailyBurn > 0
              ? `${(
                  (isDeposit ? currentStaged + amount : currentStaged - amount) / dailyBurn
                ).toFixed(1)} Days Funded`
              : 'Zero active wages'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleExecute}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
              canSubmit
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white cursor-pointer shadow-amber-600/30'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            {isDeposit ? `Confirm Deposit (🪙 ${amount.toLocaleString()})` : `Confirm Withdrawal (🪙 ${amount.toLocaleString()})`}
          </button>
        </div>
      </div>
    </div>
  );
}
