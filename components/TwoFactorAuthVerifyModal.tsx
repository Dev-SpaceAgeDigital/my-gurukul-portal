'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Loader2, X, AlertTriangle, ArrowRight, Lock } from 'lucide-react';

interface TwoFactorAuthVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  is2FAEnabled: boolean;
  title?: string;
  description?: string;
  onConfirm: (totpCode: string) => Promise<boolean | void>;
  onNavigateTo2FA?: () => void;
}

export default function TwoFactorAuthVerifyModal({
  isOpen,
  onClose,
  is2FAEnabled,
  title = 'Security Authorization Required',
  description = 'Please enter your 6-digit Authenticator code to authorize this sensitive credential modification.',
  onConfirm,
  onNavigateTo2FA,
}: TwoFactorAuthVerifyModalProps) {
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTotpCode('');
      setError('');
      setLoading(false);
      if (is2FAEnabled) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }
  }, [isOpen, is2FAEnabled]);

  if (!isOpen) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = totpCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setError('Please enter a valid 6-digit code from Google Authenticator / Authy.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await onConfirm(cleanCode);
      if (result !== false) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid 6-digit code. Please check your Authenticator app and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-all">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* ─── SCENARIO A: 2FA is NOT Enabled ─── */}
        {!is2FAEnabled ? (
          <div className="text-center space-y-4 pt-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 shadow-xs">
              <ShieldAlert size={28} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight sm:text-lg">
                2FA Required for Credential Changes
              </h3>
              <p className="text-xs font-medium leading-relaxed text-slate-600">
                To protect institutional integrity and prevent unauthorized account takeover, you must <strong>enable Two-Factor Authentication (2FA)</strong> before modifying your primary email, phone number, or password.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-left text-xs font-semibold text-slate-700 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                <AlertTriangle size={14} />
                <span>Security Protocol</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Once 2FA is activated via Google Authenticator or Authy, you will be able to update your credentials with instant verification.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateTo2FA) onNavigateTo2FA();
                }}
                className="w-full justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
              >
                <span>Activate 2FA Security</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ─── SCENARIO B: 2FA is Enabled -> Prompt 6-digit TOTP ─── */
          <form onSubmit={handleVerify} className="space-y-4 pt-1">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
                <KeyRound size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  {title}
                </h3>
                <p className="text-[11px] sm:text-xs font-medium leading-relaxed text-slate-500 mt-0.5">
                  {description}
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700 animate-in fade-in duration-200">
                {error}
              </div>
            )}

            <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <label className="block text-center text-xs font-extrabold text-slate-700">
                Enter 6-Digit Authenticator Code
              </label>

              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setTotpCode(val);
                  if (error) setError('');
                }}
                placeholder="••••••"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-center font-mono text-2xl font-black tracking-[0.4em] text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15"
                autoComplete="one-time-code"
              />

              <p className="text-center text-[10.5px] font-medium text-slate-400">
                Open Google Authenticator, Authy, or Microsoft Authenticator
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-1/3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="w-2/3 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>Authorize Change</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
