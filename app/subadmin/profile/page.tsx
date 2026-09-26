'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Copy,
  Check,
  Key,
  User,
  Mail,
  Building2,
  School,
  Lock,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

export default function SubAdminProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 2FA Setup State
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [generating2fa, setGenerating2fa] = useState(false);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; qrCodeUrl: string; backupCodes: string[] } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [enabling2fa, setEnabling2fa] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [disabling2fa, setDisabling2fa] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const { dialog, showAlert } = usePortalDialog();

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
      }
    } catch (e) {
      console.error('Failed to fetch user data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleStart2FA = async () => {
    if (!userData?.email) return;
    setGenerating2fa(true);
    setIs2faModalOpen(true);
    setVerificationCode('');

    try {
      const res = await fetch('/api/auth/2fa/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email, role: 'SUB_ADMIN' }),
      });
      const data = await res.json();
      if (data.success) {
        setTotpSetup({
          secret: data.secret,
          qrCodeUrl: data.qrCodeUrl,
          backupCodes: data.backupCodes || [],
        });
      } else {
        showAlert({ title: 'Error', message: data.error || 'Failed to generate 2FA setup.', variant: 'danger' });
        setIs2faModalOpen(false);
      }
    } catch {
      showAlert({ title: 'Error', message: 'Failed to connect to 2FA server.', variant: 'danger' });
      setIs2faModalOpen(false);
    } finally {
      setGenerating2fa(false);
    }
  };

  const handleVerifyAndEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpSetup || !verificationCode || verificationCode.length !== 6) {
      showAlert({ title: 'Invalid Code', message: 'Please enter the 6-digit code from your authenticator app.', variant: 'info' });
      return;
    }

    setEnabling2fa(true);
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          role: 'SUB_ADMIN',
          secret: totpSetup.secret,
          token: verificationCode,
          backupCodes: totpSetup.backupCodes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showAlert({ title: '2FA Enabled!', message: 'Google Authenticator 2FA has been successfully activated for your account.', variant: 'success' });
        setIs2faModalOpen(false);
        fetchUserData();
      } else {
        showAlert({ title: 'Verification Failed', message: data.error || 'Invalid 6-digit code.', variant: 'danger' });
      }
    } catch {
      showAlert({ title: 'Error', message: 'Failed to verify 2FA code.', variant: 'danger' });
    } finally {
      setEnabling2fa(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication for your account?')) return;
    setDisabling2fa(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email, role: 'SUB_ADMIN' }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert({ title: '2FA Disabled', message: 'Two-Factor Authentication is now disabled.', variant: 'info' });
        fetchUserData();
      } else {
        showAlert({ title: 'Error', message: data.error || 'Failed to disable 2FA.', variant: 'danger' });
      }
    } catch {
      showAlert({ title: 'Error', message: 'Failed to disable 2FA.', variant: 'danger' });
    } finally {
      setDisabling2fa(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  return (
    <DashboardLayout title="Profile & Security Settings" role="SUB_ADMIN" activeItem="Profile">
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account & Security Settings</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your administrative credentials and Google Authenticator 2FA security.</p>
        </div>

        {/* 1. Account Details Overview Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1b4a50] to-[#0d2a4a] text-white text-2xl font-black flex items-center justify-center border border-white/20 shadow-md shrink-0">
                {userData?.name ? userData.name[0].toUpperCase() : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{userData?.name || 'School Administrator'}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-extrabold uppercase tracking-wider">
                    School Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" />
                  <span>{userData?.email || 'Loading...'}</span>
                </p>
                {userData?.schoolName && (
                  <p className="text-xs text-slate-600 font-semibold mt-1 flex items-center gap-1.5">
                    <School size={14} className="text-teal-600" />
                    <span>{userData.schoolName}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs ${
                userData?.twoFactorEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {userData?.twoFactorEnabled ? (
                  <>
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>2FA Protected</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} className="text-amber-600" />
                    <span>2FA Disabled</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Google Authenticator 2FA Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Google Authenticator (2FA)</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Secure your admin portal with 6-digit TOTP verification code from Google Authenticator or Authy.</p>
              </div>
            </div>

            <div>
              {userData?.twoFactorEnabled ? (
                <button
                  onClick={handleDisable2FA}
                  disabled={disabling2fa}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200/60 transition-all cursor-pointer disabled:opacity-50"
                >
                  {disabling2fa ? 'Disabling...' : 'Disable 2FA'}
                </button>
              ) : (
                <button
                  onClick={handleStart2FA}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1b4a50] to-[#143d43] hover:from-[#143d43] hover:to-[#0d2a4a] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck size={16} />
                  <span>Setup Google Authenticator</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
              <Key size={18} className="text-teal-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-800">Time-based One-Time Passwords (TOTP)</h4>
                <p className="text-slate-500 mt-1 leading-relaxed">Generates fresh 6-digit verification codes every 30 seconds on your mobile phone.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-800">Emergency Backup Codes</h4>
                <p className="text-slate-500 mt-1 leading-relaxed">Includes 10 single-use emergency recovery keys if you lose access to your authenticator app.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2FA Setup Modal */}
        {is2faModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Set Up Google Authenticator</h3>
                    <p className="text-xs text-slate-500">Scan QR Code & Enter Verification Token</p>
                  </div>
                </div>
                <button
                  onClick={() => setIs2faModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {generating2fa ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <Loader2 className="animate-spin mx-auto text-teal-600" size={32} />
                  <p className="text-xs font-semibold">Generating QR Code & Secret Keys...</p>
                </div>
              ) : totpSetup ? (
                <div className="space-y-6">
                  {/* Step 1: Scan QR Code */}
                  <div className="text-center space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                      Step 1: Scan QR Code
                    </span>
                    <p className="text-xs text-slate-600 font-medium">Open Google Authenticator or Authy on your smartphone and scan this code:</p>
                    
                    <div className="w-48 h-48 mx-auto bg-white p-2 border-2 border-slate-200 rounded-2xl shadow-inner flex items-center justify-center relative">
                      {totpSetup.qrCodeUrl ? (
                        <img src={totpSetup.qrCodeUrl} alt="2FA QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <p className="text-xs text-slate-400">QR Code Error</p>
                      )}
                    </div>
                  </div>

                  {/* Secret Key Manual Input */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span>Secret Key (Manual Entry):</span>
                      <button
                        onClick={() => copyToClipboard(totpSetup.secret, 'secret')}
                        className="text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer font-bold"
                      >
                        {copiedSecret ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copiedSecret ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <code className="block text-center font-mono font-bold text-sm text-slate-900 select-all tracking-wider break-all">
                      {totpSetup.secret}
                    </code>
                  </div>

                  {/* Backup Codes Section */}
                  {totpSetup.backupCodes && totpSetup.backupCodes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Emergency Backup Codes (Save These):</span>
                        <button
                          onClick={() => copyToClipboard(totpSetup.backupCodes.join('\n'), 'codes')}
                          className="text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCodes ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          <span>{copiedCodes ? 'Copied All' : 'Copy All'}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] font-bold">
                        {totpSetup.backupCodes.map((code, idx) => (
                          <div key={idx} className="text-center">{code}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Verification Input */}
                  <form onSubmit={handleVerifyAndEnable2FA} className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Step 2: Enter 6-digit Authenticator Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-2xl font-black tracking-[0.4em] outline-none focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIs2faModalOpen(false)}
                        className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={enabling2fa || verificationCode.length !== 6}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {enabling2fa ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                        <span>{enabling2fa ? 'Verifying...' : 'Verify & Enable 2FA'}</span>
                      </button>
                    </div>
                  </form>

                </div>
              ) : null}

            </div>
          </div>
        )}

      </div>
      {dialog}
    </DashboardLayout>
  );
}
