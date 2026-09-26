'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Lock, Mail, Radio, ShieldCheck } from 'lucide-react';

type AutomationRow = {
  id: string;
  name: string;
  trigger: string;
  recipient: string;
  category: string;
  protected: boolean;
  status: string;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  lastSentAt?: string | null;
};

export default function EmailAutomationManager() {
  const [rows, setRows] = useState<AutomationRow[]>([]);
  const [totals, setTotals] = useState({ active: 0, sent: 0, failed: 0, skipped: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAutomations = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/subadmin/email-automation');
        const data = await res.json();
        if (res.ok) {
          setRows(Array.isArray(data.rows) ? data.rows : []);
          setTotals(data.totals || { active: 0, sent: 0, failed: 0, skipped: 0 });
        }
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAutomations();
  }, []);

  return (
    <div className="py-4 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <Link href="/subadmin/dashboard" className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900">
              <ArrowLeft size={14} />
              Back to dashboard
            </Link>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Email Automation Center</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">View automatic email triggers and delivery health</p>
          </div>
          <Link
            href="/subadmin/monitoring"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-[#1b4a50] hover:text-[#1b4a50]"
          >
            <ExternalLink size={14} />
            View Email Logs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active triggers" value={totals.active} icon={<Radio size={18} />} />
        <StatCard label="Emails sent" value={totals.sent} icon={<CheckCircle2 size={18} />} />
        <StatCard label="Failed" value={totals.failed} icon={<AlertCircle size={18} />} tone="danger" />
        <StatCard label="Skipped" value={totals.skipped} icon={<ShieldCheck size={18} />} tone="warning" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 9 }).map((_, index) => <AutomationSkeleton key={`automation-skeleton-${index}`} />)
        ) : (
          rows.map((row) => <AutomationCard key={row.id} row={row} />)
        )}
      </div>
    </div>
  );
}

function AutomationCard({ row }: { row: AutomationRow }) {
  const lastSent = row.lastSentAt
    ? new Date(row.lastSentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'No email sent yet';

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#EAF4F0] text-[#1b4a50]">
            <Mail size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 leading-snug">{row.name}</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{row.category}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
          <CheckCircle2 size={11} />
          {row.status}
        </span>
      </div>

      <div className="space-y-2">
        <InfoLine label="Trigger" value={row.trigger} />
        <InfoLine label="Recipient" value={row.recipient} />
        <InfoLine label="Last sent" value={lastSent} />
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
        <MiniMetric label="Sent" value={row.sent} />
        <MiniMetric label="Failed" value={row.failed} danger />
        <MiniMetric label="Skipped" value={row.skipped} />
      </div>

      {row.protected ? (
        <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
          <Lock size={13} />
          Required system email
        </div>
      ) : null}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-700">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-2 py-2">
      <p className={`text-sm font-black ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function StatCard({ label, value, icon, tone = 'default' }: { label: string; value: number; icon: React.ReactNode; tone?: 'default' | 'danger' | 'warning' }) {
  const toneClass = tone === 'danger'
    ? 'bg-red-50 text-red-600'
    : tone === 'warning'
      ? 'bg-amber-50 text-amber-600'
      : 'bg-[#EAF4F0] text-[#1b4a50]';

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md ${toneClass}`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function AutomationSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4">
      <div className="h-10 w-3/4 rounded-md bg-slate-100 animate-pulse" />
      <div className="mt-4 h-24 rounded-md bg-slate-100 animate-pulse" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-12 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-12 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-12 rounded-md bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}
