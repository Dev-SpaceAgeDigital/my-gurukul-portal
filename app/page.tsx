'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  School,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  Receipt,
  Globe,
} from 'lucide-react';

export default function Home() {
  const [tenantInfo, setTenantInfo] = useState<{
    name: string;
    logoUrl: string;
    trustName?: string;
    tenantType?: string;
  }>({
    name: 'My Gurukul Platform',
    logoUrl: '/my-gurukul.png',
    trustName: 'EduTrust Network',
    tenantType: 'PLATFORM',
  });

  useEffect(() => {
    // Check if user is already logged in (e.g. launching from PWA mobile app)
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((authData) => {
        if (authData?.role === 'ALUMNI') {
          window.location.replace('/alumni/dashboard');
          return;
        } else if (authData?.role === 'SUB_ADMIN') {
          window.location.replace('/subadmin/dashboard');
          return;
        } else if (authData?.role === 'SUPER_ADMIN') {
          window.location.replace('/superadmin/dashboard');
          return;
        }

        // If not logged in, but launching from installed PWA standalone app
        try {
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
          const preferred = localStorage.getItem('preferred_portal');
          if (isStandalone && preferred) {
            if (preferred === 'alumni') {
              window.location.replace('/alumni/login');
            } else if (preferred === 'subadmin') {
              window.location.replace('/subadmin/login');
            } else if (preferred === 'superadmin') {
              window.location.replace('/superadmin/login');
            }
          }
        } catch {}
      })
      .catch(() => {});

    fetch('/api/public/tenant-info')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          const name = data.name || 'My Gurukul Platform';
          const logoUrl = data.logoUrl || '/my-gurukul.png';
          setTenantInfo({
            name,
            logoUrl,
            trustName: data.trustName || 'EduTrust Network',
            tenantType: data.tenantType,
          });

          // Dynamically update Chrome Tab Title
          document.title = `${name} - Institutional & Alumni Portal`;

          // Dynamically update Favicon
          if (logoUrl && logoUrl !== '/my-gurukul.png') {
            const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
            if (link) {
              link.href = logoUrl;
            } else {
              const newLink = document.createElement('link');
              newLink.rel = 'icon';
              newLink.href = logoUrl;
              document.head.appendChild(newLink);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50/40 to-blue-50/60 text-slate-800 font-sans antialiased relative overflow-hidden flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Ambient Decorative Light Glow Effects matching Logo Palette */}
      <div className="absolute top-[-10%] left-[-5%] w-[55%] h-[55%] rounded-full bg-sky-200/35 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[55%] h-[55%] rounded-full bg-blue-200/35 blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-amber-100/40 blur-[130px] pointer-events-none" />

      {/* Subtle Light Grid Pattern */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"
      />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {/* Nice BIG Standalone Logo - Dynamic Tenant Logo */}
          <div className="relative h-16 md:h-20 w-auto min-w-[60px] flex items-center">
            <Image
              src={tenantInfo.logoUrl}
              alt={`${tenantInfo.name} Logo`}
              width={80}
              height={80}
              className="h-16 md:h-20 w-auto max-h-20 object-contain drop-shadow-sm transition-transform hover:scale-105 duration-300"
              priority
              unoptimized
            />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 leading-tight">
              {tenantInfo.name}
            </h2>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {tenantInfo.trustName || 'Educational Trust & Alumni Network'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Multi-Tenant Active
          </span>
          <span className="text-xs font-black text-blue-700 bg-blue-50 px-3.5 py-2 rounded-full border border-blue-200/80 shadow-xs uppercase tracking-wider">
            v2.4 Enterprise
          </span>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-10 relative z-10 max-w-7xl mx-auto w-full">
        {/* Title Badge */}
        <div className="text-center max-w-3xl mb-12 animate-in fade-in duration-700">
          <div className="inline-flex items-center gap-2.5 px-4.5 py-2 text-xs font-extrabold bg-white/90 backdrop-blur-md text-blue-800 rounded-full border border-blue-200/80 shadow-xs mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="tracking-widest uppercase">{tenantInfo.name} PORTAL</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Select Your <span className="bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-800 bg-clip-text text-transparent">Access Portal</span>
          </h1>
          <p className="text-slate-600 text-sm md:text-base mt-4 max-w-xl mx-auto leading-relaxed font-medium">
            Dedicated access hubs engineered for Educational Trust Leadership, Campus Administrators, and Alumni Community Members.
          </p>
        </div>

        {/* 3 Main Portals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-in fade-in duration-1000">

          {/* Card 1: Trust Owner & Governance */}
          <Link href="/superadmin/login" className="group">
            <div className="h-full bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-[2.5rem] p-8 flex flex-col justify-between hover:bg-white hover:border-blue-500/50 hover:shadow-[0_20px_50px_rgba(37,99,235,0.14)] hover:-translate-y-1.5 transition-all duration-300 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-300" />

              <div>
                {/* Header Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/90 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xs">
                    <Building2 size={28} />
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 uppercase tracking-widest">
                    Trust Level
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                  Trust Owner & Governance
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  <strong className="text-slate-700">Role:</strong> Educational Trust Presidents, Trustees & Financial Governance Officers.
                </p>

                {/* Key Benefits List */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                  <div className="font-extrabold text-blue-700 text-[11px] uppercase tracking-wider">
                    Key Portal Capabilities
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>Multi-school trust financial & operational oversight</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>80G tax exemption receipt approval & issuance</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>Razorpay payment gateway & custom domain setup</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>Brevo email key provision & Trust-wide usage logs</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-600 group-hover:text-blue-700 transition-colors border-t border-slate-100">
                <span>Access Trust Governance</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: School & Institution Admin */}
          <Link href="/subadmin/login" className="group">
            <div className="h-full bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-[2.5rem] p-8 flex flex-col justify-between hover:bg-white hover:border-emerald-500/50 hover:shadow-[0_20px_50px_rgba(16,185,129,0.14)] hover:-translate-y-1.5 transition-all duration-300 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-300" />

              <div>
                {/* Header Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/90 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-xs">
                    <School size={28} />
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-widest">
                    School Level
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                  School & Institution Admin
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  <strong className="text-slate-700">Role:</strong> School Principals, Headmasters & Campus Administrative Officers.
                </p>

                {/* Key Benefits List */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                  <div className="font-extrabold text-emerald-700 text-[11px] uppercase tracking-wider">
                    Key Portal Capabilities
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Campus student directory & academic class setup</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Fee potential tracking & campus transaction collections</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Direct alumni directory & campus event management</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Dedicated school Brevo email gateway ($9/mo plan)</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-600 group-hover:text-emerald-700 transition-colors border-t border-slate-100">
                <span>Enter School Administration</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 3: Alumni & Network Portal */}
          <Link href="/alumni/login" className="group">
            <div className="h-full bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-[2.5rem] p-8 flex flex-col justify-between hover:bg-white hover:border-amber-500/50 hover:shadow-[0_20px_50px_rgba(245,158,11,0.14)] hover:-translate-y-1.5 transition-all duration-300 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-300" />

              <div>
                {/* Header Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/90 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-xs">
                    <GraduationCap size={28} />
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 uppercase tracking-widest">
                    Alumni Level
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-amber-700 transition-colors">
                  Alumni & Network Hub
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  <strong className="text-slate-700">Role:</strong> Institution Graduates, Donors, Mentors & Career Leads.
                </p>

                {/* Key Benefits List */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                  <div className="font-extrabold text-amber-800 text-[11px] uppercase tracking-wider">
                    Key Portal Capabilities
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Global alumni directory search & career connections</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Instantly download 80G tax exemption receipts for donations</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Post job openings & offer mentorship to campus students</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Receive school updates & annual reunion invitations</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-600 group-hover:text-amber-700 transition-colors border-t border-slate-100">
                <span>Access Alumni Hub</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

        </div>

        {/* Feature Highlights Bar */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-600 font-semibold border-t border-slate-200/80 pt-8 w-full">
          <div className="flex items-center gap-2.5 hover:text-slate-900 transition-colors">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Google Authenticator 2FA Enabled</span>
          </div>
          <div className="flex items-center gap-2.5 hover:text-slate-900 transition-colors">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Brevo Email Gateway Tracking</span>
          </div>
          <div className="flex items-center gap-2.5 hover:text-slate-900 transition-colors">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>Instant 80G Tax Exemption Receipts</span>
          </div>
          <div className="flex items-center gap-2.5 hover:text-slate-900 transition-colors">
            <Globe className="w-4 h-4 text-purple-600" />
            <span>Custom Registrar & Domain Support</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs font-medium text-slate-400 border-t border-slate-200/60 relative z-10">
        © {new Date().getFullYear()} My Gurukul SaaS Platform. Multi-Tenant Educational Governance Engine.
      </footer>
    </div>
  );
}
