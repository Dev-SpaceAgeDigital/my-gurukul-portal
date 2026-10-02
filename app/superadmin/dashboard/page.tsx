'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Users,
  Plus,
  ShieldCheck,
  Building2,
  School,
  Activity,
  ChevronRight,
  ArrowUpRight,
  Settings,
  GraduationCap,
  Wallet,
  IndianRupee,
  UserCheck,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  FolderPlus,
  Calendar
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  activeTrusts: number;
  totalSchools: number;
  totalStudents: number;
  needyStudents: number;
  alumniBase: number;
  pendingAlumniRequests: number;
  totalDonations: number;
  donationsThisMonth: number;
  pending80GCount: number;
  activeProjectsCount: number;
  activeProjects: Array<{
    id: string;
    title: string;
    type: string;
    estimatedCost: number;
    paidAmount: number;
    progress: number;
    schoolName: string;
  }>;
  schoolsList: Array<{
    id: string;
    schoolName: string;
    establishYear?: number;
    trustName: string;
    studentCount: number;
    subadminCount: number;
    alumniCount: number;
    totalRaised: number;
  }>;
  recentDonations: Array<{
    id: string;
    amount: string | number;
    donorName: string;
    type: string;
    status: string;
    createdAt: string;
    schoolName: string;
  }>;
  recentActivity: Array<{
    id: string;
    actorName?: string;
    actorRole: string;
    title: string;
    category: string;
    status?: string;
    createdAt: string;
  }>;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeTrusts: 0,
    totalSchools: 0,
    totalStudents: 0,
    needyStudents: 0,
    alumniBase: 0,
    pendingAlumniRequests: 0,
    totalDonations: 0,
    donationsThisMonth: 0,
    pending80GCount: 0,
    activeProjectsCount: 0,
    activeProjects: [],
    schoolsList: [],
    recentDonations: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) setSystemStats(data);
    } catch (err) {
      console.error('Stats fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatINR = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome & Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-1 border border-slate-200/60">
            <ShieldCheck size={13} className="text-[#1A3D63]" />
            <span>Master Governance Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Command Center</h1>
          <p className="text-slate-500 font-medium text-xs">
            Real-time overview of trusts, schools, students, alumni network, and institutional philanthropy.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10 shrink-0">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Network Infrastructure</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
              Active System
            </span>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200/80 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Metrics"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => router.push('/superadmin/profile')}
            className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200/80 transition-all cursor-pointer shadow-xs"
            title="Settings & Credentials"
          >
            <Settings size={16} />
          </button>
        </div>
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#1A3D63]/5 rounded-full -mr-28 -mt-28 blur-3xl pointer-events-none" />
      </div>

      {/* Actionable Alerts Bar */}
      {(systemStats.pendingAlumniRequests > 0 || systemStats.pending80GCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemStats.pendingAlumniRequests > 0 && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{systemStats.pendingAlumniRequests} Pending Alumni Registrations</h4>
                  <p className="text-[11px] text-amber-700/80 font-medium">Awaiting school sub-admin verification.</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/superadmin/alumni')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-xs"
              >
                Review Roster
              </button>
            </div>
          )}

          {systemStats.pending80GCount > 0 && (
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-blue-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold">{systemStats.pending80GCount} Pending 80G Tax Requests</h4>
                  <p className="text-[11px] text-blue-700/80 font-medium">Donor certificates awaiting generation.</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/superadmin/80g-requests')}
                className="px-3 py-1.5 rounded-xl bg-[#1A3D63] hover:bg-[#0A1931] text-white text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-xs"
              >
                Issue Certificates
              </button>
            </div>
          )}
        </div>
      )}

      {/* Primary Key Metrics Grid (6 Essential Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Trusts */}
        <div className="bg-[#0A1931] rounded-[2rem] p-6 text-white shadow-xl shadow-[#1A3D63]/10 group relative overflow-hidden flex flex-col justify-between min-h-[150px]">
          <div className="relative z-10 flex justify-between items-start">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
              <Building2 size={20} className="text-[#B3CFE5]" />
            </div>
            <button
              onClick={() => router.push('/superadmin/trust')}
              className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="relative z-10 mt-4">
            <p className="text-[#B3CFE5]/70 text-[10px] font-bold uppercase tracking-widest">Trust Foundations</p>
            <h3 className="text-3xl font-extrabold tracking-tight mt-0.5">{systemStats.activeTrusts}</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700" />
        </div>

        {/* Active Schools */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between min-h-[150px]">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <School size={20} className="text-emerald-600" />
            </div>
            <div className="flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tight">Live</span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Schools</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">{systemStats.totalSchools}</h3>
            </div>
            <button
              onClick={() => router.push('/superadmin/school')}
              className="text-xs font-bold text-[#1A3D63] hover:underline flex items-center gap-0.5"
            >
              <span>Directory</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Sub-admins / School Officers */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between min-h-[150px]">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100">
              <Users size={20} className="text-purple-600" />
            </div>
            <button
              onClick={() => router.push('/superadmin/subadmin')}
              className="p-1 text-slate-300 hover:text-purple-600 transition-colors cursor-pointer"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Sub-admin Officers</p>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">{systemStats.totalUsers}</h3>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between min-h-[150px]">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <GraduationCap size={20} className="text-blue-600" />
            </div>
            {systemStats.needyStudents > 0 && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {systemStats.needyStudents} Needy Aid
              </span>
            )}
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Enrolled Students</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">{systemStats.totalStudents}</h3>
            </div>
            <button
              onClick={() => router.push('/superadmin/students')}
              className="text-xs font-bold text-[#1A3D63] hover:underline flex items-center gap-0.5"
            >
              <span>View Roster</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Alumni Base */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between min-h-[150px]">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <UserCheck size={20} className="text-indigo-600" />
            </div>
            <button
              onClick={() => router.push('/superadmin/alumni-communication')}
              className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors"
            >
              Send Meet Link
            </button>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Alumni Network</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">{systemStats.alumniBase}</h3>
            </div>
            <button
              onClick={() => router.push('/superadmin/alumni')}
              className="text-xs font-bold text-[#1A3D63] hover:underline flex items-center gap-0.5"
            >
              <span>Alumni Hub</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Total Funds & Donations Raised */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between min-h-[150px]">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <Wallet size={20} className="text-emerald-600" />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <TrendingUp size={11} />
              <span>{formatINR(systemStats.donationsThisMonth)} this mo.</span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Donations Raised</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {formatINR(systemStats.totalDonations)}
              </h3>
            </div>
            <button
              onClick={() => router.push('/superadmin/donations')}
              className="text-xs font-bold text-[#1A3D63] hover:underline flex items-center gap-0.5"
            >
              <span>Ledger</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Active Projects & Recent Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Institutional Projects (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-[#1A3D63]" />
                <span>Active Institutional Projects & Costs</span>
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Funding targets and expenditure progress across schools.
              </p>
            </div>
            <button
              onClick={() => router.push('/superadmin/donations')}
              className="text-xs font-bold text-[#1A3D63] hover:underline flex items-center gap-1"
            >
              <span>Manage Projects</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {systemStats.activeProjects.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto border border-slate-100">
                <FolderPlus size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500">No active project costings created yet.</p>
              <button
                onClick={() => router.push('/superadmin/donations')}
                className="px-3.5 py-1.5 rounded-xl bg-[#1A3D63] text-white text-xs font-bold hover:bg-[#0A1931] transition-all inline-flex items-center gap-1.5"
              >
                <Plus size={13} /> Add Project Costing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {systemStats.activeProjects.map((proj) => (
                <div key={proj.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100/90 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {proj.schoolName} • {proj.type}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{proj.title}</h4>
                    </div>
                    <span className="text-xs font-extrabold text-[#1A3D63] shrink-0">
                      {proj.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#1A3D63] h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
                    <span>Raised: <strong className="text-slate-800">{formatINR(proj.paidAmount)}</strong></span>
                    <span>Target: <strong className="text-slate-800">{formatINR(proj.estimatedCost)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Donations & Philanthropy (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wallet size={18} className="text-emerald-600" />
                  <span>Recent Donations</span>
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Live donor stream across institutions.
                </p>
              </div>
              <button
                onClick={() => router.push('/superadmin/donations')}
                className="text-xs font-bold text-[#1A3D63] hover:underline"
              >
                View All
              </button>
            </div>

            {systemStats.recentDonations.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <IndianRupee className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-400">No recent transactions recorded.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {systemStats.recentDonations.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{tx.donorName || 'Anonymous Donor'}</p>
                      <span className="text-[10px] text-slate-400 font-medium truncate block">
                        {tx.schoolName || 'Institution'} • {new Date(tx.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl shrink-0">
                      {formatINR(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => router.push('/superadmin/80g-requests')}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText size={14} className="text-[#1A3D63]" />
              <span>Review 80G Tax Requests ({systemStats.pending80GCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* School Infrastructure Health & Breakdown Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <School size={18} className="text-[#1A3D63]" />
              <span>School Infrastructure & Capacity Overview</span>
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Consolidated roster of all active schools, enrolled strength, and fundraising metrics.
            </p>
          </div>
          <button
            onClick={() => router.push('/superadmin/school/new')}
            className="px-3.5 py-2 rounded-xl bg-[#1A3D63] hover:bg-[#0A1931] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus size={14} />
            <span>Provision New School</span>
          </button>
        </div>

        {systemStats.schoolsList.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-400">
            No schools provisioned under this trust group.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 px-2">School & Trust</th>
                  <th className="pb-3 px-2 text-center">Enrolled Students</th>
                  <th className="pb-3 px-2 text-center">Sub-admins</th>
                  <th className="pb-3 px-2 text-center">Alumni Base</th>
                  <th className="pb-3 px-2 text-right">Total Raised</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {systemStats.schoolsList.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-2">
                      <div className="font-bold text-slate-900 text-xs">{sch.schoolName}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {sch.trustName} {sch.establishYear ? `• Est. ${sch.establishYear}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-center font-bold text-slate-800">{sch.studentCount}</td>
                    <td className="py-3.5 px-2 text-center font-bold text-slate-800">{sch.subadminCount}</td>
                    <td className="py-3.5 px-2 text-center font-bold text-slate-800">{sch.alumniCount}</td>
                    <td className="py-3.5 px-2 text-right font-bold text-emerald-700">{formatINR(sch.totalRaised)}</td>
                    <td className="py-3.5 px-2 text-right">
                      <button
                        onClick={() => router.push(`/superadmin/school/${sch.id}/edit`)}
                        className="text-[11px] font-bold text-[#1A3D63] hover:underline px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation Shortcuts & Quick Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Shortcuts (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-base font-bold text-slate-900 px-1 flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#1A3D63]" />
            <span>Governance Shortcuts</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {[
              { name: 'Trust Registry', path: '/superadmin/trust', color: 'bg-blue-50/70', text: 'text-blue-800', icon: <Building2 size={16} /> },
              { name: 'School Directory', path: '/superadmin/school', color: 'bg-emerald-50/70', text: 'text-emerald-800', icon: <School size={16} /> },
              { name: 'Officer Roster', path: '/superadmin/subadmin', color: 'bg-purple-50/70', text: 'text-purple-800', icon: <Users size={16} /> },
              { name: 'Student Registry', path: '/superadmin/students', color: 'bg-sky-50/70', text: 'text-sky-800', icon: <GraduationCap size={16} /> },
              { name: 'Alumni Network', path: '/superadmin/alumni', color: 'bg-indigo-50/70', text: 'text-indigo-800', icon: <UserCheck size={16} /> },
              { name: 'Donations & Costs', path: '/superadmin/donations', color: 'bg-teal-50/70', text: 'text-teal-800', icon: <Wallet size={16} /> },
              { name: '80G Tax Requests', path: '/superadmin/80g-requests', color: 'bg-rose-50/70', text: 'text-rose-800', icon: <FileText size={16} /> },
              { name: 'Academic Terms', path: '/superadmin/academic-year', color: 'bg-amber-50/70', text: 'text-amber-800', icon: <Calendar size={16} /> },
              { name: 'Audit Logs', path: '/superadmin/monitoring', color: 'bg-slate-100/70', text: 'text-slate-800', icon: <Activity size={16} /> },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`flex items-center justify-between p-4 ${item.color} rounded-2xl group hover:shadow-sm transition-all border border-transparent hover:border-slate-200 cursor-pointer`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className={`${item.text} opacity-80 shrink-0`}>{item.icon}</div>
                  <span className={`text-xs font-bold ${item.text} truncate`}>{item.name}</span>
                </div>
                <ChevronRight size={14} className={`${item.text} opacity-30 group-hover:opacity-100 transition-all shrink-0`} />
              </button>
            ))}
          </div>
        </div>

        {/* Immediate Executive Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900 px-1 flex items-center gap-2">
            <Plus size={18} className="text-[#1A3D63]" />
            <span>Immediate Actions</span>
          </h3>
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-between space-y-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Rapid provisioning tools and institutional communications.
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                href="/superadmin/trust/new"
                className="flex items-center justify-center space-x-2 py-3 bg-[#1A3D63] text-white rounded-xl text-xs font-bold hover:bg-[#0A1931] transition-all shadow-md shadow-[#1A3D63]/10 uppercase tracking-wider"
              >
                <Plus size={14} />
                <span>Register New Trust</span>
              </Link>
              <Link
                href="/superadmin/school/new"
                className="flex items-center justify-center space-x-2 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-xs uppercase tracking-wider"
              >
                <Plus size={14} />
                <span>Provision New School</span>
              </Link>
              <Link
                href="/superadmin/subadmin/new"
                className="flex items-center justify-center space-x-2 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-xs uppercase tracking-wider"
              >
                <Plus size={14} />
                <span>Add School Officer</span>
              </Link>
              <Link
                href="/superadmin/alumni-communication"
                className="flex items-center justify-center space-x-2 py-3 bg-slate-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all shadow-xs uppercase tracking-wider"
              >
                <ArrowRight size={14} />
                <span>Dispatch Alumni Meet Link</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="Super Admin Dashboard"
      role="SUPER_ADMIN"
      activeItem="Dashboard"
    >
      <div className="space-y-6 max-w-7xl mx-auto py-2 sm:py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 animate-pulse">
            <Activity className="text-slate-300 mb-4 animate-spin" size={40} />
            <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">
              Initializing Command Center Metrics...
            </p>
          </div>
        ) : (
          renderOverview()
        )}
      </div>
    </DashboardLayout>
  );
}
