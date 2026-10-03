'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Phone,
  Mail,
  Building2,
  PhoneCall,
  HelpCircle,
  School
} from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface TenantInfo {
  logoUrl: string;
  name: string;
  trustName?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolAddress?: string;
  trustPhone?: string;
  trustEmail?: string;
}

export default function AlumniLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedRole, setVerifiedRole] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const { dialog, showAlert } = usePortalDialog();

  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);

  useEffect(() => {
    fetch('/api/public/tenant-info')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          const name = data.name || 'Alumni Network';
          const logoUrl = data.logoUrl || '/my-gurukul.png';
          setTenantInfo({
            logoUrl,
            name,
            trustName: data.trustName,
            schoolPhone: data.schoolPhone,
            schoolEmail: data.schoolEmail,
            schoolAddress: data.schoolAddress,
            trustPhone: data.trustPhone,
            trustEmail: data.trustEmail,
          });
          document.title = `${name} - Alumni Hub Login`;
          if (logoUrl && logoUrl !== '/my-gurukul.png') {
            const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
            if (link) {
              link.href = logoUrl;
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeTab === 'email' ? email : phone, password, rememberMe }),
      });

      const data = await res.json();
      if (data.requires2FA) {
        setTwoFactorStep(true);
        setVerifiedEmail(data.email || email);
        setVerifiedRole(data.role || 'ALUMNI');
        showAlert({ title: '2FA Required', message: data.message || 'Enter your 6-digit Authenticator code to continue.', variant: 'success' });
      } else if (data.requiresOtp) {
        setOtpStep(true);
        setVerifiedEmail(data.email || email);
        setVerifiedRole(data.role);
        showAlert({ title: 'OTP sent', message: data.message || 'Enter the OTP sent to your registered email.', variant: 'success' });
      } else if (data.success && data.redirectTo) {
        router.push(data.redirectTo);
      } else {
        showAlert({ title: 'Login failed', message: data.error || 'The credentials you entered are incorrect.', variant: 'danger' });
      }
    } catch (err) {
      showAlert({ title: 'Connection error', message: 'System encountered a connection error. Please try again.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifiedEmail, role: verifiedRole || 'ALUMNI', code: twoFactorCode, rememberMe }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.redirectTo || '/alumni/dashboard');
      } else {
        showAlert({ title: '2FA verification failed', message: data.error || 'Invalid 6-digit Authenticator code or Backup Code.', variant: 'danger' });
      }
    } catch {
      showAlert({ title: 'Connection error', message: 'System encountered a connection error. Please try again.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifiedEmail, role: verifiedRole, otp, rememberMe }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.redirectTo || '/alumni/dashboard');
      } else {
        showAlert({ title: 'OTP verification failed', message: data.error || 'Please enter the correct OTP.', variant: 'danger' });
      }
    } catch {
      showAlert({ title: 'Connection error', message: 'System encountered a connection error. Please try again.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!resetOtpSent) {
        const res = await fetch('/api/auth/alumni-forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail }),
        });
        const data = await res.json();
        if (res.ok) {
          setResetOtpSent(true);
          setResetEmail(data.email || resetEmail);
          showAlert({ title: 'OTP sent', message: data.message || 'Password reset OTP sent to your email.', variant: 'success' });
        } else {
          showAlert({ title: 'Reset failed', message: data.error || 'Failed to send reset OTP.', variant: 'danger' });
        }
      } else {
        if (newPassword.length < 8) {
          showAlert({ title: 'Weak password', message: 'Password must be at least 8 characters.', variant: 'danger' });
          return;
        }
        if (newPassword !== confirmPassword) {
          showAlert({ title: 'Password mismatch', message: 'New password and confirm password must match.', variant: 'danger' });
          return;
        }

        const res = await fetch('/api/auth/alumni-reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          showAlert({ title: 'Password updated', message: data.message || 'Please login again with your new password.', variant: 'success' });
          setResetMode(false);
          setResetOtpSent(false);
          setResetOtp('');
          setNewPassword('');
          setConfirmPassword('');
          setEmail(resetEmail);
        } else {
          showAlert({ title: 'Reset failed', message: data.error || 'Failed to reset password.', variant: 'danger' });
        }
      }
    } catch {
      showAlert({ title: 'Connection error', message: 'System encountered a connection error. Please try again.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="relative flex min-h-screen items-center justify-between bg-gradient-to-br from-[#eff6ff] via-[#f5f3ff] to-white overflow-hidden font-inter">

      {/* 3D Glassy Ribbon SVG Background */}
      <svg className="absolute bottom-[-10%] left-[-10%] w-[120%] h-[70%] z-0 pointer-events-none" viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-50 450 C 200 350, 400 550, 700 400 C 1000 250, 1100 300, 1300 200" stroke="url(#ribbon-grad)" strokeWidth="140" strokeLinecap="round" opacity="0.22" filter="blur(50px)" />
        <path d="M-50 450 C 200 350, 400 550, 700 400 C 1000 250, 1100 300, 1300 200" stroke="url(#ribbon-grad-2)" strokeWidth="70" strokeLinecap="round" opacity="0.3" filter="blur(12px)" />
        <defs>
          <linearGradient id="ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="40%" stopColor="#6366f1" />
            <stop offset="80%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="ribbon-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Top Left: Logo */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-12 flex items-center space-x-2 z-10 cursor-pointer">
        <div className="relative flex items-center justify-center">
          <Image src={tenantInfo?.logoUrl || "/my-gurukul.png"} alt="Logo" width={48} height={48} className="object-contain sm:w-[58px] sm:h-[58px]" priority />
        </div>
        <span className="font-outfit font-bold tracking-tight text-slate-800 text-xs sm:text-sm">
          {tenantInfo?.name || "My Gurukul"}
        </span>
      </div>

      {/* Left side: Visual Branding Elements */}
      <div className="hidden lg:flex w-1/2 min-h-screen relative flex-col justify-center px-16 select-none z-10">

        {/* Floating Chat Bubbles */}
        <div className="space-y-2.5 mb-12">
          <div className="bg-slate-200/50 border border-slate-300/20 backdrop-blur-md rounded-2xl px-4 py-2.5 text-[11px] font-semibold text-slate-500 max-w-max shadow-sm animate-pulse" style={{ animationDuration: '3s' }}>
            Hi there, alumni.
          </div>
          <div className="bg-white/85 border border-white/80 backdrop-blur-md rounded-2xl px-4 py-2.5 text-[11px] font-semibold text-slate-700 max-w-max shadow-sm ml-6 animate-pulse" style={{ animationDuration: '4s' }}>
            Welcome back to the portal.
          </div>
          <div className="bg-white/85 border border-white/80 backdrop-blur-md rounded-2xl px-4 py-2.5 text-[11px] font-semibold text-slate-700 max-w-max shadow-sm ml-12">
            Reconnecting with classmates?
          </div>
          <div className="bg-white/85 border border-white/80 backdrop-blur-md rounded-2xl px-4 py-2.5 text-[11px] font-semibold text-slate-700 max-w-max shadow-sm ml-16">
            I'll need to verify your identity first, though.
          </div>
        </div>

        {/* Brand Text */}
        <div className="space-y-1 ml-4">
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.25em] uppercase">THE</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-6xl font-outfit font-black text-slate-900 tracking-tight">alumni</span>
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.15em] uppercase">NETWORK</p>
        </div>

        {/* Bottom Left Accessories */}
        <div className="absolute bottom-8 left-16 flex items-center space-x-8 text-xs text-slate-400 font-bold">
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Contact Us</a>
          </div>
        </div>
      </div>

      {/* Right side: High-fidelity Login Card */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-4 pt-20 sm:p-12 z-10">
        <div className="w-full max-w-[440px] bg-white/90 border border-white/80 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl sm:rounded-[32px] shadow-[0_20px_60px_rgba(30,41,59,0.06)] flex flex-col space-y-5 sm:space-y-6">

          {/* Card Title */}
          <div>
            <h2 className="text-xl font-outfit font-bold text-slate-900 tracking-tight">Sign In to Account</h2>
          </div>

          {/* Form Tabs (from Image 1) */}
          <div className="flex border-b border-slate-100 pb-1 space-x-6">
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`text-xs font-bold pb-2.5 transition-all relative ${activeTab === 'email' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Email Login
              {activeTab === 'email' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in fade-in duration-200"></div>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('phone')}
              className={`text-xs font-bold pb-2.5 transition-all relative ${activeTab === 'phone' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Phone Login
              {activeTab === 'phone' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in fade-in duration-200"></div>
              )}
            </button>
          </div>

	          <form onSubmit={resetMode ? handleResetSubmit : twoFactorStep ? handle2FASubmit : otpStep ? handleOtpSubmit : handleSubmit} className="space-y-4">
              {resetMode ? (
                <div className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Forgot Password / Account Recovery</h3>
                    <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">
                      {resetOtpSent
                        ? 'Enter the 6-digit OTP sent to your registered email and choose a new password.'
                        : 'Enter your registered email address or mobile number to receive a password reset OTP.'}
                    </p>
                  </div>
                  {!resetOtpSent ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email or Mobile Number</label>
                      <input
                        type="text"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/5 text-slate-800 text-xs font-semibold placeholder:text-slate-300 shadow-xs"
                        placeholder="e.g. alumni@example.com or 9820012345"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/5 text-slate-900 text-center text-xl font-black tracking-[0.3em]"
                        placeholder="000000"
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/5 text-slate-800 text-xs font-semibold placeholder:text-slate-300"
                        placeholder="New password (min 8 chars)"
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/5 text-slate-800 text-xs font-semibold placeholder:text-slate-300"
                        placeholder="Confirm new password"
                      />
                    </div>
                  )}

                  {/* School & Trust Contact Card for Alumni without Email or Stolen Access */}
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-3.5 space-y-2.5 shadow-xs text-left">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                      <HelpCircle size={15} className="text-blue-600 shrink-0" />
                      <span>Don't have an email or need instant help?</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Contact your school or trust administration office directly. The administrators can verify your identity and give you a temporary password to log in immediately.
                    </p>

                    <div className="pt-1.5 space-y-2 border-t border-blue-100/80">
                      {/* School Contact */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/90 p-2.5 rounded-xl border border-blue-100/60 shadow-xs">
                        <div className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 truncate">
                            <School size={13} className="text-blue-600 shrink-0" />
                            <span>{tenantInfo?.name || 'School Administration'}</span>
                          </span>
                          <span className="block text-[10px] text-slate-500 font-medium truncate mt-0.5">
                            {tenantInfo?.schoolAddress || 'School Office Helpline'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {tenantInfo?.schoolPhone && (
                            <a
                              href={`tel:${tenantInfo.schoolPhone.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10.5px] font-bold shadow-xs transition-all cursor-pointer"
                              title="Call School Office"
                            >
                              <PhoneCall size={11} />
                              <span>Call</span>
                            </a>
                          )}
                          {tenantInfo?.schoolEmail && (
                            <a
                              href={`mailto:${tenantInfo.schoolEmail}?subject=Alumni%20Portal%20Password%20Reset%20Request`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-black text-white rounded-lg text-[10.5px] font-bold shadow-xs transition-all cursor-pointer"
                              title="Email School Office"
                            >
                              <Mail size={11} />
                              <span>Email</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Trust Contact */}
                      {tenantInfo?.trustName && (
                        <div className="flex items-center justify-between gap-2 px-2 text-[10.5px] text-slate-600">
                          <span className="flex items-center gap-1 truncate font-medium text-slate-700">
                            <Building2 size={12} className="text-slate-400 shrink-0" />
                            <span>{tenantInfo.trustName}</span>
                          </span>
                          {tenantInfo.trustPhone && (
                            <a
                              href={`tel:${tenantInfo.trustPhone.replace(/\s+/g, '')}`}
                              className="text-blue-600 font-bold hover:underline shrink-0 flex items-center gap-1"
                            >
                              <Phone size={10} />
                              <span>{tenantInfo.trustPhone}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setResetMode(false);
                        setResetOtpSent(false);
                        setResetOtp('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      ← Back to login
                    </button>
                  </div>
                </div>
              ) : twoFactorStep ? (
                <div className="space-y-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Two-Factor Authentication</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Enter the 6-digit code from Google Authenticator, Authy, or your Emergency Backup Code.
                    </p>
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.trim())}
                    className="w-full px-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/5 text-slate-900 text-center text-2xl font-black tracking-[0.35em]"
                    placeholder="000000"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => { setTwoFactorStep(false); setTwoFactorCode(''); }}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Back to login
                    </button>
                    <span className="text-[11px] text-slate-400">TOTP or Backup Code</span>
                  </div>
                </div>
              ) : otpStep ? (
                <div className="space-y-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Verify your email</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">Enter the 6-digit OTP sent to {verifiedEmail}.</p>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/5 text-slate-900 text-center text-2xl font-black tracking-[0.35em]"
                    placeholder="000000"
                  />
                  <button type="button" onClick={() => { setOtpStep(false); setOtp(''); }} className="text-xs font-bold text-blue-600 hover:underline">
                    Use another email
                  </button>
                </div>
              ) : (
                <>

	            {activeTab === 'email' ? (
              /* Email Input */
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/5 text-slate-800 text-xs font-semibold placeholder:text-slate-300"
                  placeholder="alumni@example.com"
                />
              </div>
            ) : (
              /* Phone Input */
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/5 text-slate-800 text-xs font-semibold placeholder:text-slate-300"
                  placeholder="15602226456"
                />
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-xl outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/5 text-slate-800 text-xs font-semibold placeholder:text-slate-300"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1 px-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                  Remember me on this device <span className="text-[11px] text-blue-600 font-bold">(30 Days)</span>
                </span>
              </label>
            </div>

            {/* Agreement Terms Checkbox */}
            <div className="flex items-start space-x-2 pt-1 px-1">
              <input
                type="checkbox"
                id="terms"
                defaultChecked
                className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600 mt-0.5"
              />
              <label htmlFor="terms" className="text-[10px] text-slate-400 font-semibold cursor-pointer select-none">
                I have read and agree to the <span className="text-blue-600 hover:underline">User Agreement</span> and <span className="text-blue-600 hover:underline">Privacy Policy</span>
              </label>
            </div>
                </>
              )}

	            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-white" size={16} />
	                  <span>{resetMode ? 'Processing...' : twoFactorStep ? 'Verifying 2FA...' : otpStep ? 'Checking OTP...' : 'Logging in...'}</span>
                </>
              ) : (
                <>
		                  <span>{resetMode ? (resetOtpSent ? 'Update Password' : 'Send Reset OTP') : twoFactorStep ? 'Verify 2FA Code' : otpStep ? 'Verify OTP' : 'Login'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Text */}
	          <div className="pt-2 text-center text-xs text-slate-400">
	            <span>Forgot password? </span>
	            <button
                type="button"
                onClick={() => {
                  setResetMode(true);
                  setOtpStep(false);
                  setResetEmail(email);
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                Reset
              </button>
	          </div>

        </div>
      </div>
    </div>
    {dialog}
    </>
  );
}
