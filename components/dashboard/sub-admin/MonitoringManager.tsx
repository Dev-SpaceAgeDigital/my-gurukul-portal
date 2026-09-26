'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, ExternalLink, Mail, Search, Shield, UserRoundCheck } from 'lucide-react';

type MonitoringTab = 'subadmin' | 'alumni';

type MonitoringRow = {
  id: string;
  kind: 'ACTIVITY' | 'EMAIL';
  type: string;
  action: string;
  title: string;
  message?: string | null;
  status?: string | null;
  actor?: string | null;
  email?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  link?: string | null;
  createdAt: string;
};

const tabOptions = [
  { id: 'subadmin' as const, title: 'Subadmin Monitoring', description: 'School admin actions, publishing, projects, promotions, and sent emails.', icon: Shield },
  { id: 'alumni' as const, title: 'Alumni Monitoring', description: 'Alumni submissions, review items, portal actions, and received emails.', icon: UserRoundCheck },
];

const typeOptions = [
  'ALL',
  'ALUMNI',
  'ALUMNI_CREDENTIALS',
  'EVENT',
  'UPDATE',
  'PROJECT',
  'PROMOTION',
  'SCHOOL_PAGE',
  'BLOG',
  'ACHIEVEMENT',
  'CAREER',
  'MENTORSHIP',
  'OTP',
  'LOGIN_LINK',
  'PASSWORD_RESET_INSTRUCTION',
  'ALUMNI_PASSWORD_RESET_OTP',
  'ALUMNI_ACCESS_RESET',
  'PASSWORD_RESET',
  'ALUMNI_ACCESS',
  'DONATION_PAYMENT_LINK',
  'DONATION_RECEIPT',
];
const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SENT', 'FAILED', 'SKIPPED', 'SUCCESS'];

export default function MonitoringManager() {
  const [activeTab, setActiveTab] = useState<MonitoringTab>('subadmin');
  const [rows, setRows] = useState<MonitoringRow[]>([]);
  const [stats, setStats] = useState({ total: 0, emails: 0, failedEmails: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    const controller = new AbortController();
    const fetchRows = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ tab: activeTab, search, type, status });
        const res = await fetch(`/api/subadmin/monitoring?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (res.ok) {
          setRows(Array.isArray(data.rows) ? data.rows : []);
          setStats(data.stats || { total: 0, emails: 0, failedEmails: 0, pending: 0 });
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          setRows([]);
        }
      } finally {
        setLoading(false);
      }
    };

    const timeout = window.setTimeout(fetchRows, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [activeTab, search, type, status]);

  const selectedTab = useMemo(() => tabOptions.find((tab) => tab.id === activeTab) || tabOptions[0], [activeTab]);

  return (
    <div className="py-4 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Monitoring</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">School scoped audit and communication history</p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            {tabOptions.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border text-xs font-bold transition-all ${
                    isActive ? 'bg-[#18181b] text-white border-[#18181b] shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon size={14} />
                  {tab.title}
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">{selectedTab.description}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total records" value={stats.total} icon={<Activity size={18} />} />
        <StatCard label="Email records" value={stats.emails} icon={<Mail size={18} />} />
        <StatCard label="Pending reviews" value={stats.pending} icon={<AlertCircle size={18} />} />
        <StatCard label="Failed emails" value={stats.failedEmails} icon={<AlertCircle size={18} />} tone="danger" />
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm p-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-2">
          <label className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search actor, email, title..."
              className="w-full h-10 pl-9 pr-3 rounded-md border border-slate-300 bg-white text-sm outline-none focus:border-[#1b4a50] focus:ring-2 focus:ring-[#1b4a50]/10"
            />
          </label>
          <select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#1b4a50]">
            {typeOptions.map((option) => <option key={option} value={option}>{option === 'ALL' ? 'All types' : option.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#1b4a50]">
            {statusOptions.map((option) => <option key={option} value={option}>{option === 'ALL' ? 'All statuses' : option}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <div className="hidden lg:grid grid-cols-[160px_1fr_180px_120px_140px] px-5 py-3 bg-[#172f36] text-[11px] font-black uppercase tracking-wide text-white">
          <span>Type</span>
          <span>Record</span>
          <span>Actor / Email</span>
          <span>Status</span>
          <span>Time</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[68dvh] overflow-y-auto">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={`monitoring-skeleton-${index}`} />)
          ) : rows.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                <Activity size={20} />
              </div>
              <p className="text-sm font-bold text-slate-800">No monitoring records found</p>
              <p className="text-xs text-slate-500 mt-1">New actions and email attempts will appear here.</p>
            </div>
          ) : (
            rows.map((row) => <MonitoringRowItem key={`${row.kind}-${row.type}-${row.id}-${row.createdAt}`} row={row} />)
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tone = 'default' }: { label: string; value: number; icon: React.ReactNode; tone?: 'default' | 'danger' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md ${tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-[#EAF4F0] text-[#1b4a50]'}`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function MonitoringRowItem({ row }: { row: MonitoringRow }) {
  const isEmail = row.kind === 'EMAIL';
  const status = row.status || (isEmail ? 'SENT' : 'SUCCESS');
  const time = new Date(row.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_180px_120px_140px] gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${isEmail ? 'bg-blue-50 text-blue-600' : 'bg-[#EAF4F0] text-[#1b4a50]'}`}>
          {isEmail ? <Mail size={16} /> : <Activity size={16} />}
        </span>
        <div>
          <p className="text-xs font-black text-slate-800">{row.type?.replace(/_/g, ' ') || row.kind}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{row.kind}</p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-900">{row.title}</p>
          {row.link ? (
            <a href={row.link} className="shrink-0 text-slate-400 hover:text-[#1b4a50]" title="Open related page">
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.message || row.action}</p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-700">{row.actor || 'System'}</p>
        <p className="truncate text-xs text-slate-500">{row.email || 'No email recorded'}</p>
      </div>

      <div>
        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-wide ${getStatusClass(status)}`}>
          {status === 'SENT' || status === 'APPROVED' || status === 'SUCCESS' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {status}
        </span>
      </div>

      <p className="text-xs font-semibold text-slate-500">{time}</p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_180px_120px_140px] gap-3 px-5 py-4">
      <div className="h-8 rounded-md bg-slate-100 animate-pulse" />
      <div className="h-8 rounded-md bg-slate-100 animate-pulse" />
      <div className="h-8 rounded-md bg-slate-100 animate-pulse" />
      <div className="h-8 rounded-md bg-slate-100 animate-pulse" />
      <div className="h-8 rounded-md bg-slate-100 animate-pulse" />
    </div>
  );
}

function getStatusClass(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'FAILED' || normalized === 'REJECTED') return 'bg-red-50 text-red-700 border-red-200';
  if (normalized === 'PENDING' || normalized === 'SKIPPED') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}
