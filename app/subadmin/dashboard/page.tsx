'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FinancialAidCoverage from '@/components/dashboard/sub-admin/FinancialAidCoverage';
import {
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Landmark,
  Mail,
} from 'lucide-react';

export default function SubAdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/subadmin/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) { }
  };

  return (
    <DashboardLayout
      title="School administration"
      role="SUB_ADMIN"
      activeItem="Dashboard"
    >
      <OverviewTab stats={stats} />
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────────
   OVERVIEW TAB — 3-zone layout
   ─────────────────────────────────────────────
   Zone 1 (top row, shrink-0):
     • Left (2 cols): Sponsorship & Financial Aid Coverage
     • Right (1 col): 4 compact stat cards

   Zone 2 (bottom row, flex-1):
     • Left: Donut ratio chart + Donation trend chart
     • Right: Recent Contributions Ledger
───────────────────────────────────────────── */
function OverviewTab({ stats }: { stats: any }) {
  const iconStyle = {
    color: 'text-[#8b7355]',
    bg: 'bg-[#efebe1] border border-[#e4dcd1]'
  };

  const displayStats = [
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: <Users size={20} />, ...iconStyle },
    { label: 'Active Standards', value: stats?.activeStandards ?? 0, icon: <BookOpen size={20} />, ...iconStyle },
    { label: 'Total Donations', value: `₹${((stats?.totalDonations || 0) / 100000).toFixed(1)}L`, icon: <TrendingUp size={20} />, ...iconStyle },
    { label: 'Fee Potential', value: `₹${((stats?.totalFeesPotential || 0) / 100000).toFixed(1)}L`, icon: <ArrowUpRight size={20} />, ...iconStyle },
  ];

  // ── Donut chart calculations ──────────────────
  const constructionAmt = Number(stats?.constructionDonations) || 0;
  const financialAidAmt = Number(stats?.financialAidDonations) || 0;
  const totalBreakdown = constructionAmt + financialAidAmt;
  const aidPct = totalBreakdown > 0 ? Math.round((financialAidAmt / totalBreakdown) * 100) : 0;
  const constPct = totalBreakdown > 0 ? Math.round((constructionAmt / totalBreakdown) * 100) : 0;
  const r = 34;
  const circ = 2 * Math.PI * r;
  const aidStroke = circ * (aidPct / 100);
  const constStroke = circ * (constPct / 100);

  // ── Trend chart calculations ──────────────────
  const recentTx: any[] = stats?.recentTransactions ?? [];
  const cronTx = [...recentTx].reverse();
  const amounts = cronTx.map((t: any) => parseFloat(t.amount) || 0);
  const chartH = 68;
  const maxVal = Math.max(...amounts, 1000);

  const points = cronTx.map((t: any, i: number) => {
    const x = cronTx.length > 1 ? (i / (cronTx.length - 1)) * 92 + 4 : 48; // percentage-based
    const val = parseFloat(t.amount) || 0;
    const y = chartH - 10 - ((val / maxVal) * (chartH - 20));
    return {
      x,
      y,
      val,
      pct: (i / Math.max(cronTx.length - 1, 1)) * 100,
      date: new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };
  });

  const toSvgX = (pct: number) => (pct / 100) * 96 + 2;
  const svgPoints = points.map((p) => ({ ...p, sx: toSvgX(p.pct) }));

  const linePath = svgPoints.length > 0
    ? svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx} ${p.y}`).join(' ')
    : '';
  const areaPath = svgPoints.length > 0
    ? `${linePath} L ${svgPoints[svgPoints.length - 1].sx} ${chartH - 2} L ${svgPoints[0].sx} ${chartH - 2} Z`
    : '';

  return (
    <div className="flex flex-col gap-3 pb-8 no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── HEADER ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-md border border-slate-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">School Overview</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Link
            href="/subadmin/email-automation"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1b4a50] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-[#143d43] transition-colors"
          >
            <Mail size={13} />
            Email Automation
          </Link>
	          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200/50">
	            <Calendar size={13} className="text-[#67C090]" />
	            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
	              Academic Session {stats?.activeAcademicYear || 'Not Set'}
	            </span>
	          </div>
        </div>
      </div>

      {/* ── ZONE 1 (TOP ROW): Financial Aid + Stat Cards ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 shrink-0">

        {/* Financial Aid Coverage — 2 cols wide */}
        <div className="lg:col-span-2">
          <FinancialAidCoverage />
        </div>

        {/* 4 Compact Stat Cards — 1 col, 2×2 on mobile, 4×1 on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
          {displayStats.map((stat, i) => (
            <div
              key={i}
              className="bg-white px-3 py-2.5 rounded-md border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex items-center space-x-2.5"
            >
              <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0 ml-1">
                <p className="text-xs font-normal text-slate-500 uppercase tracking-wide leading-tight truncate">{stat.label}</p>
                <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ZONE 2 (BOTTOM ROW): Charts + Ledger ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0 shrink-0 pb-4">

        {/* LEFT: Donation ratio donut + Trend chart */}
        <div className="bg-white p-4 rounded-md shadow-sm flex flex-col gap-3 min-h-[240px] overflow-hidden">
          {/* Section label */}
          <div className="flex items-center justify-between shrink-0">
            <p className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Landmark size={15} className="text-[#dac48b]" />
              Donation Stats
            </p>
            <span className="text-xs font-semibold bg-amber-50 text-[#dac48b] px-2.5 py-1 rounded-lg uppercase tracking-wide">Live</span>
          </div>

          {/* ── Side-by-side: Donut (left) + Trend chart (right) ── */}
          <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">

            {/* LEFT HALF: Donut (bigger) + Legend centered below */}
            <div className="flex flex-col items-center justify-center gap-2 flex-1 pr-4 border-r border-slate-100 overflow-hidden">
              {/* Donut — enlarged */}
              <div className="relative w-[120px] h-[120px] shrink-0">
                <svg width="100%" height="100%" viewBox="0 0 76 76" className="-rotate-90">
                  <circle cx="38" cy="38" r={r} fill="transparent" stroke="rgba(0,0,0,0.05)" strokeWidth="8" />
                  {aidPct > 0 && (
                    <circle
                      cx="38" cy="38" r={r} fill="transparent"
                      stroke="#dac48b" strokeWidth="8"
                      strokeDasharray={`${aidStroke} ${circ - aidStroke}`}
                      strokeDashoffset="0" strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  )}
                  {constPct > 0 && (
                    <circle
                      cx="38" cy="38" r={r} fill="transparent"
                      stroke="#7c776e" strokeWidth="8"
                      strokeDasharray={`${constStroke} ${circ - constStroke}`}
                      strokeDashoffset={-aidStroke} strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase leading-none">Ratio</span>
                  <span className="text-sm font-black text-slate-900 mt-0.5">{aidPct}:{constPct}</span>
                </div>
              </div>

              {/* Fund Allocation legend — centered below donut */}
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Fund Allocation</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#dac48b] shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Fin. Aid <span className="text-slate-400">({aidPct}%)</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#7c776e] shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Constr. <span className="text-slate-400">({constPct}%)</span></span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-500">Total:</span>
                  <span className="text-sm font-black text-slate-900">₹{totalBreakdown.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* RIGHT HALF: Trend chart */}
            <div className="flex-1 min-h-0 flex flex-col">
              <p className="text-sm font-semibold text-slate-600 tracking-wide flex items-center justify-between mb-2 shrink-0">
                <span>Donation Trend (Last {recentTx.length} txs)</span>
                <TrendingUp size={13} className="text-[#dac48b]" />
              </p>
              {svgPoints.length > 0 ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  <svg width="100%" height="100%" className="overflow-visible flex-1" viewBox={`0 0 100 ${chartH}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trendGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dac48b" stopOpacity="0.30" />
                        <stop offset="100%" stopColor="#dac48b" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#trendGrad2)" />
                    <path d={linePath} fill="none" stroke="#dac48b" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    {svgPoints.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.sx} cy={p.y} r="2.5" fill="#fff" stroke="#dac48b" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        <title>{`₹${p.val.toLocaleString('en-IN')} (${p.date})`}</title>
                      </g>
                    ))}
                  </svg>
                  <div className="flex justify-between px-0.5 text-xs text-slate-400 font-semibold uppercase tracking-wide mt-1 shrink-0">
                    <span>{svgPoints[0]?.date}</span>
                    <span>{svgPoints[Math.floor(svgPoints.length / 2)]?.date}</span>
                    <span>{svgPoints[svgPoints.length - 1]?.date}</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200/60 rounded-md">
                  <span className="text-xs text-slate-300 font-bold uppercase tracking-wide">No Activity</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT: Recent Contributions Ledger */}
        <div className="bg-white p-4 rounded-md shadow-sm flex flex-col min-h-[240px] overflow-hidden">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-sm font-black text-slate-900 uppercase tracking-wide">Recent Donations</p>
            <span className="text-xs font-semibold text-slate-400">up to 5 entries</span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar space-y-0.5 pr-0.5">
            {recentTx.length > 0 ? (
              recentTx.slice(0, 5).map((t: any, i: number) => {
                const amount = parseFloat(t.amount) || 0;
                const isConstruction = t.type === 'CONSTRUCTION';
                return (
                  <div
                    key={t.id || i}
                    className="flex items-center justify-between py-2 px-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 rounded-md transition-all duration-200"
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#efebe1] border border-[#e4dcd1] text-[#8b7355] flex items-center justify-center text-xs shrink-0 font-bold shadow-sm">
                        {t.donorName ? t.donorName[0].toUpperCase() : 'D'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 leading-none truncate">{t.donorName || 'Anonymous'}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Amount + badge */}
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs font-black text-slate-900">₹{amount.toLocaleString('en-IN')}</p>
                      <span className={`text-xs font-semibold px-1.5 bg-amber-50 py-0.5 rounded-lg inline-block mt-0.5 ${isConstruction ? 'bg-[#7c776e]/10 text-[#7c776e]' : 'bg-[#dac48b]/10 text-[#dac48b]'}`}>
                        {isConstruction ? 'Construction' : 'Fin. Aid'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-300 font-bold uppercase text-xs tracking-wide py-12">
                No contributions found
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Other tab section components ────────── */
