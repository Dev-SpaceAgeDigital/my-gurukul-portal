'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, GraduationCap, Users, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

interface LoginFormProps {
  roleName: string;
  loginEndpoint: string;
  accentColor: string;
  roleIcon: React.ReactNode;
}

export default function LoginForm({ roleName, loginEndpoint, accentColor, roleIcon }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedRole, setVerifiedRole] = useState('');
  const router = useRouter();
  const { dialog, showAlert } = usePortalDialog();

  const [tenantInfo, setTenantInfo] = useState<{ logoUrl: string; name: string } | null>(null);

  useEffect(() => {
    setIsLoaded(true);
    fetch('/api/public/tenant-info')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          const name = data.name || 'EduTrust OS';
          const logoUrl = data.logoUrl || '/my-gurukul.png';
          setTenantInfo({
            logoUrl,
            name,
          });

          // Update tab title and favicon
          document.title = `${name} - ${roleName} Login`;
          if (logoUrl && logoUrl !== '/my-gurukul.png') {
            const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
            if (link) {
              link.href = logoUrl;
            }
          }
        }
      })
      .catch(() => {});
  }, [roleName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.requires2FA) {
        setTwoFactorStep(true);
        setVerifiedEmail(data.email || email);
        setVerifiedRole(data.role || 'SUPER_ADMIN');
        showAlert({
          title: '2FA Required',
          message: data.message || 'Enter your 6-digit Authenticator code to continue.',
          variant: 'success',
        });
      } else if (data.requiresOtp) {
        setOtpStep(true);
        setVerifiedEmail(data.email || email);
        setVerifiedRole(data.role);
        showAlert({
          title: 'OTP sent',
          message: data.message || 'Enter the OTP sent to your registered email.',
          variant: 'success',
        });
      } else if (data.success && data.redirectTo) {
        router.push(data.redirectTo);
      } else {
        showAlert({
          title: 'Login failed',
          message: data.error || 'The credentials you entered are incorrect.',
          variant: 'danger',
        });
      }
    } catch (err) {
      showAlert({
        title: 'Connection error',
        message: 'System encountered a connection error. Please try again.',
        variant: 'danger',
      });
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
        body: JSON.stringify({ email: verifiedEmail, role: verifiedRole || 'SUPER_ADMIN', code: twoFactorCode }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.redirectTo || '/superadmin/dashboard');
      } else {
        showAlert({
          title: '2FA verification failed',
          message: data.error || 'Invalid 6-digit Authenticator code or Backup Code.',
          variant: 'danger',
        });
      }
    } catch {
      showAlert({
        title: 'Connection error',
        message: 'System encountered a connection error. Please try again.',
        variant: 'danger',
      });
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
        body: JSON.stringify({ email: verifiedEmail, role: verifiedRole, otp }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.redirectTo || '/superadmin/dashboard');
      } else {
        showAlert({
          title: 'OTP verification failed',
          message: data.error || 'Please enter the correct OTP.',
          variant: 'danger',
        });
      }
    } catch {
      showAlert({
        title: 'Connection error',
        message: 'System encountered a connection error. Please try again.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccentColors = () => {
    switch (accentColor) {
      case 'indigo': return {
        primary: 'bg-[#0b1525] hover:bg-[#16325c] text-white shadow-lg shadow-[#0b1525]/20',
        lightBg: 'bg-[#EBF2F7] text-[#0b1525] border-[#D0DFEB]',
        focusRing: 'focus:bg-white focus:ring-4 focus:ring-[#3f72af]/20 focus:border-[#3f72af]',
        badge: 'bg-[#EBF2F7] text-[#0b1525] border-[#D0DFEB]',
        gradientText: 'from-[#3f72af] to-[#16325c]',
        iconBg: 'bg-[#0b1525] text-white shadow-[#0b1525]/30'
      };
      case 'emerald': return {
        primary: 'bg-[#1b4a50] hover:bg-[#143d43] text-white shadow-lg shadow-[#1b4a50]/20',
        lightBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        focusRing: 'focus:bg-white focus:ring-4 focus:ring-[#1b4a50]/20 focus:border-[#1b4a50]',
        badge: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        gradientText: 'from-[#1b4a50] to-[#143d43]',
        iconBg: 'bg-[#1b4a50] text-white shadow-[#1b4a50]/30'
      };
      case 'amber': return {
        primary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20',
        lightBg: 'bg-amber-50 text-amber-900 border-amber-200',
        focusRing: 'focus:bg-white focus:ring-4 focus:ring-amber-500/20 focus:border-amber-600',
        badge: 'bg-amber-50 text-amber-900 border-amber-200',
        gradientText: 'from-amber-600 to-orange-600',
        iconBg: 'bg-amber-600 text-white shadow-amber-600/30'
      };
      default: return {
        primary: 'bg-[#0b1525] hover:bg-[#16325c] text-white shadow-lg shadow-[#0b1525]/20',
        lightBg: 'bg-[#EBF2F7] text-[#0b1525] border-[#D0DFEB]',
        focusRing: 'focus:bg-white focus:ring-4 focus:ring-[#3f72af]/20 focus:border-[#3f72af]',
        badge: 'bg-[#EBF2F7] text-[#0b1525] border-[#D0DFEB]',
        gradientText: 'from-[#0b1525] to-[#3f72af]',
        iconBg: 'bg-[#0b1525] text-white shadow-[#0b1525]/30'
      };
    }
  };

  const colors = getAccentColors();

  return (
    <>
      {/* SuperAdmin Layout Ice-Blue Background Canvas */}
      <div className={`min-h-screen w-full bg-[#EBF2F7] text-[#0b1525] flex items-center justify-center p-4 md:p-8 relative overflow-hidden transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Ambient SuperAdmin Soft Blue Glows */}
        <div className="absolute top-10 left-10 w-[450px] h-[450px] bg-[#3f72af]/15 rounded-full blur-[130px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#16325c]/10 rounded-full blur-[130px] pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }}></div>

        {/* Central Master Card matching SuperAdmin Portal */}
        <div className="relative z-10 w-full max-w-[1040px] grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[32px] border border-[#D0DFEB] shadow-[0_20px_50px_rgba(11,21,37,0.08)] overflow-hidden">
          
          {/* Left Panel — SuperAdmin Deep Navy Showcase Panel */}
          <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0b1525] via-[#112240] to-[#16325c] text-white">
            
            <div className="space-y-8 relative z-10">
              {/* Brand Chip */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-wide shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{tenantInfo?.name || "EduTrust OS"}</span>
              </div>

              {/* 3D Icon / Dynamic Logo Badge */}
              <div className="relative group">
                <div className="relative w-20 h-20 rounded-2xl bg-white/90 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-500 p-2 overflow-hidden">
                  <Image src={tenantInfo?.logoUrl || "/my-gurukul.png"} alt="Logo" width={64} height={64} className="object-contain" priority />
                </div>
              </div>

              {/* Typography Block */}
              <div className="space-y-3">
                <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {roleName} <br />
                  <span className="text-[#93c5fd]">
                    Governance Console
                  </span>
                </h1>
                <p className="text-slate-300 text-xs leading-relaxed font-medium">
                  Enterprise-grade institutional management, multi-school analytics & administrative governance workspace.
                </p>
              </div>
            </div>

            {/* Feature Badges & Footer */}
            <div className="space-y-6 pt-8 relative z-10">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Security</div>
                  <div className="text-xs font-bold text-white mt-0.5">256-bit AES</div>
                </div>
                <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">SLA Guarantee</div>
                  <div className="text-xs font-bold text-white mt-0.5">99.9% Uptime</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 border-t border-white/15 pt-4">
                <span>© {new Date().getFullYear()} EduTrust Platform</span>
                <span className="text-slate-300 font-mono">v1.0.0</span>
              </div>
            </div>

          </div>

          {/* Right Panel — Pure White Login Form */}
          <div className="lg:col-span-7 p-8 lg:p-12 bg-white flex flex-col justify-center relative">
            <div className="max-w-[380px] mx-auto w-full space-y-7">
              
              {/* Form Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold border uppercase tracking-wider ${colors.badge}`}>
                    {roleIcon}
                    <span>{roleName} Portal</span>
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#0b1525] tracking-tight">Sign in to Workspace</h2>
                <p className="text-slate-600 text-xs font-medium">
                  Enter your verified administrator credentials below.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={twoFactorStep ? handle2FASubmit : otpStep ? handleOtpSubmit : handleSubmit} className="space-y-5">
                {twoFactorStep ? (
                  <div className="space-y-5 bg-[#F0F5FA] p-5 rounded-2xl border border-[#D0DFEB]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0b1525] text-white flex items-center justify-center font-bold">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0b1525]">Two-Factor Authentication</h4>
                        <p className="text-[11px] text-slate-600 font-medium">Enter 6-digit Authenticator code or Backup Code</p>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.trim())}
                        className={`w-full px-4 py-3.5 bg-white border border-[#D0DFEB] rounded-xl outline-none text-center text-2xl font-mono font-extrabold tracking-[0.3em] text-[#0b1525] ${colors.focusRing}`}
                        placeholder="000000"
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <button 
                        type="button" 
                        onClick={() => { setTwoFactorStep(false); setTwoFactorCode(''); }} 
                        className="text-xs font-bold text-[#3f72af] hover:text-[#0b1525] transition-colors cursor-pointer"
                      >
                        ← Back to login
                      </button>
                      <span className="text-[11px] text-slate-400">TOTP or Backup Code</span>
                    </div>
                  </div>
                ) : otpStep ? (
                  <div className="space-y-5 bg-[#F0F5FA] p-5 rounded-2xl border border-[#D0DFEB]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0b1525] text-white flex items-center justify-center font-bold">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0b1525]">Enter Security OTP</h4>
                        <p className="text-[11px] text-slate-600 font-medium">Sent to {verifiedEmail}</p>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={`w-full px-4 py-3.5 bg-white border border-[#D0DFEB] rounded-xl outline-none text-center text-2xl font-mono font-extrabold tracking-[0.3em] text-[#0b1525] ${colors.focusRing}`}
                        placeholder="000000"
                        autoFocus
                      />
                    </div>

                    <button 
                      type="button" 
                      onClick={() => { setOtpStep(false); setOtp(''); }} 
                      className="text-xs font-bold text-[#3f72af] hover:text-[#0b1525] transition-colors"
                    >
                      ← Back to email login
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Work Email Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0b1525]">Work Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail size={16} />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 bg-[#F0F5FA] border border-[#D0DFEB] rounded-xl text-xs font-medium text-[#0b1525] placeholder:text-slate-400 outline-none transition-all ${colors.focusRing}`}
                          placeholder="admin@institution.org"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#0b1525]">Password</label>
                        <span className="text-[11px] font-bold text-[#3f72af] hover:underline cursor-pointer">Forgot?</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock size={16} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`w-full pl-10 pr-10 py-3 bg-[#F0F5FA] border border-[#D0DFEB] rounded-xl text-xs font-medium text-[#0b1525] placeholder:text-slate-400 outline-none transition-all ${colors.focusRing}`}
                          placeholder="••••••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 ${colors.primary}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>{twoFactorStep ? 'Verifying 2FA...' : otpStep ? 'Verifying OTP...' : 'Authenticating...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{twoFactorStep ? 'Verify 2FA Code' : otpStep ? 'Verify Security Code' : 'Sign in to Console'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Security Footer Note */}
              <div className="pt-4 text-center border-t border-slate-100">
                <p className="text-[11px] text-slate-500 font-medium">
                  Authorized personnel access only • Protected by EduTrust OS
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
      {dialog}
    </>
  );
}
