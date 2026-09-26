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
  LayoutGrid
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  activeTrusts: number;
  totalSchools: number;
  alumniBase: number;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [systemStats, setSystemStats] = useState<SystemStats>({ 
    totalUsers: 0, 
    activeTrusts: 0, 
    totalSchools: 0, 
    alumniBase: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) setSystemStats(data);
    } catch (err) { 
      console.error('Stats fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Command Center</h1>
          <p className="text-slate-500 mt-1 font-medium text-xs">Overview of institutional network infrastructure and school operations.</p>
        </div>
        <div className="flex items-center space-x-3 relative z-10">
          <div className="flex flex-col items-end mr-4">
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Network Status</span>
             <span className="text-sm font-bold text-emerald-500 flex items-center mt-0.5">
               <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
               Live System
             </span>
          </div>
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
            <Settings size={20} />
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#1A3D63]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0A1931] rounded-[2rem] p-6 text-white shadow-xl shadow-[#1A3D63]/10 group relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                <Building2 size={20} className="text-[#B3CFE5]" />
              </div>
              <ArrowUpRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
            </div>
            <div className="mt-6">
              <p className="text-[#B3CFE5]/60 text-[10px] font-semibold uppercase tracking-widest">Total Trusts</p>
              <h3 className="text-3xl font-semibold tracking-tighter mt-1">{systemStats.activeTrusts}</h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700" />
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group hover:shadow-md transition-all">
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <School size={20} className="text-emerald-600" />
              </div>
              <ArrowUpRight size={16} className="text-slate-200 group-hover:text-[#1A3D63] transition-colors" />
            </div>
            <div className="mt-6 flex justify-between items-end">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Schools</p>
                <h3 className="text-3xl font-semibold text-slate-900 tracking-tighter mt-1">{systemStats.totalSchools}</h3>
              </div>
              <div className="flex items-center space-x-1 mb-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tighter">Live</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group hover:shadow-md transition-all">
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-[#1A3D63]/5 rounded-xl border border-[#1A3D63]/10">
                <Users size={20} className="text-[#1A3D63]" />
              </div>
              <ArrowUpRight size={16} className="text-slate-200 group-hover:text-[#1A3D63] transition-colors" />
            </div>
            <div className="mt-6">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">Sub-admins</p>
              <h3 className="text-3xl font-semibold text-slate-900 tracking-tighter mt-1">{systemStats.totalUsers}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 px-2 flex items-center">
            <LayoutGrid size={18} className="mr-2 text-slate-400" />
            Quick Navigation
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Trust Registry', path: '/superadmin/trust', color: 'bg-blue-50', text: 'text-blue-700', icon: <Building2 size={16} /> },
              { name: 'School Directory', path: '/superadmin/school', color: 'bg-emerald-50', text: 'text-emerald-700', icon: <School size={16} /> },
              { name: 'Officer Roster', path: '/superadmin/subadmin', color: 'bg-purple-50', text: 'text-purple-700', icon: <Users size={16} /> },
              { name: 'Academic Terms', path: '/superadmin/academic-year', color: 'bg-amber-50', text: 'text-amber-700', icon: <Activity size={16} /> },
              { name: 'Monitoring', path: '/superadmin/monitoring', color: 'bg-slate-100', text: 'text-slate-700', icon: <ShieldCheck size={16} /> }
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`flex items-center justify-between p-5 ${item.color} rounded-2xl group hover:shadow-sm transition-all border border-transparent hover:border-slate-200`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${item.text} opacity-70`}>{item.icon}</div>
                  <span className={`text-xs font-semibold ${item.text}`}>{item.name}</span>
                </div>
                <ChevronRight size={14} className={`${item.text} opacity-30 group-hover:opacity-100 transition-all`} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 px-2 flex items-center">
            <Plus size={18} className="mr-2 text-slate-400" />
            Immediate Actions
          </h3>
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-center space-y-4">
            <p className="text-[13px] text-slate-500 font-medium px-2 leading-relaxed">Perform rapid institutional provisioning and system updates.</p>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/superadmin/trust/new" className="flex items-center justify-center space-x-2 py-3 bg-[#1A3D63] text-white rounded-xl text-[11px] font-semibold hover:bg-[#0A1931] transition-all shadow-lg shadow-[#1A3D63]/10 tracking-widest uppercase">
                <Plus size={14} />
                <span>Register New Trust</span>
              </Link>
              <Link href="/superadmin/school/new" className="flex items-center justify-center space-x-2 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl text-[11px] font-semibold hover:bg-slate-50 transition-all tracking-widest uppercase">
                <Plus size={14} />
                <span>Provision New School</span>
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
      <div className="space-y-6 max-w-7xl mx-auto py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 animate-pulse">
            <Activity className="text-slate-200 mb-4 animate-spin" size={40} />
            <p className="text-slate-400 font-semibold text-sm tracking-widest uppercase">Initializing Command Center...</p>
          </div>
        ) : (
          renderOverview()
        )}
      </div>
    </DashboardLayout>
  );
}
