'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff, Sparkles, Building } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

export default function SubAdminLoginPage() {
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
          const name = data.name || 'School Administration';
          const logoUrl = data.logoUrl || '/my-gurukul.png';
          setTenantInfo({
            logoUrl,
            name,
          });
          document.title = `${name} - Campus Admin Login`;
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
      const res = await fetch('/api/auth/login/subadmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.requires2FA) {
        setTwoFactorStep(true);
        setVerifiedEmail(data.email || email);
        setVerifiedRole(data.role || 'SUB_ADMIN');
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
        body: JSON.stringify({ email: verifiedEmail, role: verifiedRole || 'SUB_ADMIN', code: twoFactorCode }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.redirectTo || '/subadmin/dashboard');
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
        body: JSON.stringify({ email: verifiedEmail, role: verifiedRole, otp }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.redirectTo || '/subadmin/dashboard');
      } else {
        showAlert({ title: 'OTP verification failed', message: data.error || 'Please enter the correct OTP.', variant: 'danger' });
      }
    } catch {
      showAlert({ title: 'Connection error', message: 'System encountered a connection error. Please try again.', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} subadmin-portal bg-subadmin-gradient`}>

      {/* Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
              <polygon points="24.8,22 37.3,29.2 37.3,43.7 24.8,50.9 12.3,43.7 12.3,29.2" id="hex" fill="none" stroke="#1b4a50" strokeWidth="1" />
              <use href="#hex" x="25" y="-43.4" />
              <use href="#hex" x="-25" y="43.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      {/* Floating Glowing Orbs */}
      <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-[5%] left-[10%] w-[500px] h-[500px] bg-[#1b4a50]/10 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[1000px] flex flex-col lg:flex-row items-stretch m-4 rounded-[2rem] overflow-hidden bg-white/60 backdrop-blur-xl border border-[#8c8273]/20 shadow-xl">

        {/* Left Branding Panel (Dark Teal) */}
        <div className="w-full lg:w-5/12 p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#1b4a50] via-[#143d43] to-[#0d2a4a]">

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 shadow-inner relative overflow-hidden p-1.5">
              <Image src={tenantInfo?.logoUrl || "/my-gurukul.png"} alt="Logo" width={56} height={56} className="object-contain" priority />
            </div>

            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#AAFFC7]/10 text-[10px] font-bold uppercase tracking-wider mb-4 border border-[#AAFFC7]/20 text-white">
              <Building size={12} />
              <div>{tenantInfo?.name || "School Administration"}</div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight mb-4 text-white">
              Manage your <br /> institution with <div className="inline text-[#AAFFC7]">precision.</div>
            </h1>

            <div className="text-white opacity-80 text-sm leading-relaxed max-w-sm font-medium">
              Access your personalized dashboard to oversee operations, track student progress, and streamline communication.
            </div>
          </div>

          <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
            <div className="flex items-center space-x-4 text-white opacity-70 text-xs font-semibold">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[#0d2a4a] border-2 border-[#1b4a50] flex items-center justify-center">
                    <ShieldCheck size={12} className="text-white opacity-70" />
                  </div>
                ))}
              </div>
              <div className="text-white leading-tight">Trusted by leading<br />educational trusts</div>
            </div>
          </div>
        </div>

        {/* Right Form Panel (Light Theme) */}
        <div className="w-full lg:w-7/12 p-10 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center lg:text-left mb-10">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Enter your credentials to securely access your portal.</p>
            </div>

	            <form onSubmit={twoFactorStep ? handle2FASubmit : otpStep ? handleOtpSubmit : handleSubmit} className="space-y-6">
                {twoFactorStep ? (
                  <div className="space-y-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1b4a50]/10 text-[#1b4a50]">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">Two-Factor Authentication</h3>
                      <p className="mt-1 text-sm font-medium text-slate-500">Enter your 6-digit Authenticator code or Backup Code.</p>
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.trim())}
                      className="w-full px-4 py-4 bg-white/80 border border-[#8c8273]/30 rounded-xl outline-none transition-all duration-300 focus:bg-white focus:border-[#1b4a50] focus:ring-4 focus:ring-[#1b4a50]/10 text-slate-900 text-center text-2xl font-black tracking-[0.35em]"
                      placeholder="000000"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <button type="button" onClick={() => { setTwoFactorStep(false); setTwoFactorCode(''); }} className="text-xs font-bold text-[#1b4a50] hover:text-[#1b4a50]/80 cursor-pointer">
                        ← Back to login
                      </button>
                      <span className="text-[11px] text-slate-400">TOTP or Backup Code</span>
                    </div>
                  </div>
                ) : otpStep ? (
                  <div className="space-y-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1b4a50]/10 text-[#1b4a50]">
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
                      className="w-full px-4 py-4 bg-white/80 border border-[#8c8273]/30 rounded-xl outline-none transition-all duration-300 focus:bg-white focus:border-[#1b4a50] focus:ring-4 focus:ring-[#1b4a50]/10 text-slate-900 text-center text-2xl font-black tracking-[0.35em]"
                      placeholder="000000"
                    />
                    <button type="button" onClick={() => { setOtpStep(false); setOtp(''); }} className="text-xs font-bold text-[#1b4a50] hover:text-[#1b4a50]/80">
                      Use another email
                    </button>
                  </div>
                ) : (
                  <>
	              <div className="space-y-2 group">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 group-focus-within:text-[#1b4a50] transition-colors">Work Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1b4a50] transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-white/80 border border-[#8c8273]/30 rounded-xl outline-none transition-all duration-300 focus:bg-white focus:border-[#1b4a50] focus:ring-4 focus:ring-[#1b4a50]/10 text-slate-900 placeholder:text-slate-400 font-medium"
                    placeholder="name@school.edu"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-[#1b4a50] transition-colors">Password</label>
                  <button type="button" className="text-xs font-bold text-[#1b4a50] hover:text-[#1b4a50]/80 transition-colors">Forgot?</button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1b4a50] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-4 bg-white/80 border border-[#8c8273]/30 rounded-xl outline-none transition-all duration-300 focus:bg-white focus:border-[#1b4a50] focus:ring-4 focus:ring-[#1b4a50]/10 text-slate-900 placeholder:text-slate-400 font-medium tracking-wide"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
	                </div>
	              </div>
                  </>
                )}

	              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-4 rounded-xl text-white font-bold text-sm shadow-[0_4px_14px_rgba(27,74,80,0.3)] bg-gradient-to-r from-[#1b4a50] to-[#143d43] hover:from-[#143d43] hover:to-[#0d2a4a] transition-all active:scale-[0.98] overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
	                      <span>{twoFactorStep ? 'Verifying 2FA...' : otpStep ? 'Checking OTP...' : 'Authenticating...'}</span>
                    </>
                  ) : (
                    <>
	                      <span>{twoFactorStep ? 'Verify 2FA Code' : otpStep ? 'Verify OTP' : 'Sign In to Portal'}</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }
      `}</style>
    </div>
    {dialog}
    </>
  );
}
