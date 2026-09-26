'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, QrCode, Key, Copy, Check, Lock, ChevronRight, Sparkles } from 'lucide-react';

export default function TwoFactorAuthSetupCard({
  email,
  role,
  isEnabledInitially = false,
  onStatusChange,
}: {
  email: string;
  role: string;
  isEnabledInitially?: boolean;
  onStatusChange?: (enabled: boolean) => void;
}) {
  const [isEnabled, setIsEnabled] = useState(isEnabledInitially);
  const [step, setStep] = useState<'IDLE' | 'SETUP' | 'VERIFY' | 'SUCCESS'>('IDLE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [totpInput, setTotpInput] = useState('');
  const [copied, setCopied] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate 2FA setup');
      
      setSetupData(data);
      setStep('SETUP');
    } catch (err: any) {
      setError(err.message || 'Error generating 2FA QR code');
    } finally {
      setLoading(false);
    }
  };

  const confirmEnable = async () => {
    if (!totpInput || totpInput.length !== 6) {
      setError('Please enter the 6-digit code from Google Authenticator.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          secret: setupData?.secret,
          token: totpInput,
          backupCodes: setupData?.backupCodes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Invalid TOTP code');

      setIsEnabled(true);
      setStep('SUCCESS');
      if (onStatusChange) onStatusChange(true);
    } catch (err: any) {
      setError(err.message || 'Failed to verify TOTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to disable 2FA');

      setIsEnabled(false);
      setStep('IDLE');
      setSetupData(null);
      if (onStatusChange) onStatusChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (!setupData?.backupCodes) return;
    navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-7 shadow-xl shadow-blue-900/5 space-y-4 transition-all">
      
      {/* Card Header (Responsive Flex) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100/80 pb-3.5">
        <div className="flex items-start sm:items-center space-x-3">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
            isEnabled ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-blue-100 text-blue-600'
          }`}>
            {isEnabled ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Two-Factor Authentication (2FA)</h3>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border sm:hidden ${
                isEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {isEnabled ? '2FA Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
              Secure your account using Google Authenticator, Authy, or Microsoft Authenticator app.
            </p>
          </div>
        </div>

        <span className={`hidden sm:inline-flex text-xs font-extrabold px-3 py-1 rounded-full border shrink-0 ${
          isEnabled
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}>
          {isEnabled ? '2FA Active ✅' : '2FA Disabled'}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      {/* IDLE state */}
      {step === 'IDLE' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="text-[11.5px] sm:text-xs text-slate-600 font-medium leading-relaxed">
            {isEnabled
              ? 'Your account is protected with TOTP 2FA. Every login attempt will require a 6-digit Authenticator code.'
              : 'Require a 6-digit verification code from an Authenticator app whenever you log in.'}
          </div>

          {!isEnabled ? (
            <button
              onClick={startSetup}
              disabled={loading || !email}
              title={!email ? 'Please wait for your profile to load first' : ''}
              className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl sm:rounded-full shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <span>Enable 2FA Now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleDisable}
              disabled={loading}
              className="w-full sm:w-auto justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2.5 rounded-xl sm:rounded-full border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Turn Off 2FA
            </button>
          )}
        </div>
      )}

      {/* SETUP step */}
      {step === 'SETUP' && setupData && (
        <div className="space-y-4 bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-xs shrink-0">
              <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-32 h-32 sm:w-36 sm:h-36" />
            </div>

            <div className="space-y-2 text-xs text-slate-600 w-full">
              <div className="font-bold text-slate-900 text-xs sm:text-sm">Step 1: Scan QR Code in Authenticator App</div>
              <p className="leading-relaxed">1. Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>Microsoft Authenticator</strong> on your smartphone.</p>
              <p className="leading-relaxed">2. Tap <strong>+</strong> and select <strong>Scan QR Code</strong>.</p>
              <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 break-all">
                Secret Key: <strong className="text-blue-700">{setupData.secret}</strong>
              </div>
            </div>
          </div>

          {/* Backup Codes Section */}
          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                <Key className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Emergency Backup Codes (Save these safely!)</span>
              </span>
              <button
                onClick={copyBackupCodes}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy All'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 font-mono text-center text-xs">
              {setupData.backupCodes.map((code, idx) => (
                <div key={idx} className="bg-white p-1.5 rounded-lg border border-slate-200 font-semibold text-slate-800 text-[11px] sm:text-xs">
                  {code}
                </div>
              ))}
            </div>
          </div>

          {/* Verification Code Input */}
          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <label className="block text-xs font-bold text-slate-800">Step 2: Enter 6-Digit Authenticator Code to Confirm</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                maxLength={6}
                value={totpInput}
                onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="h-10 sm:h-11 bg-white border border-slate-300 rounded-xl px-4 text-sm font-mono tracking-widest text-center w-full sm:w-40 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
              <button
                onClick={confirmEnable}
                disabled={loading || totpInput.length !== 6}
                className="h-10 sm:h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Activate 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS step */}
      {step === 'SUCCESS' && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
          <div className="font-bold flex items-center gap-2 text-xs sm:text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>2FA Protection Activated Successfully!</span>
          </div>
          <p className="leading-relaxed text-[11.5px]">Your account is now protected with 2FA. Next time you log in, you will be prompted for your 6-digit Authenticator code.</p>
        </div>
      )}
    </div>
  );
}

