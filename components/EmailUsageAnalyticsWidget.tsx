'use client';

import { useEffect, useState } from 'react';
import { Mail, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Clock } from 'lucide-react';

interface EmailLogItem {
  id: string;
  recipientEmail: string;
  recipientRole?: string;
  emailType: string;
  subject: string;
  provider: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

interface EmailStats {
  sentToday: number;
  failedToday: number;
  totalToday: number;
  brevoStatus: string;
  dailyBrevoLimit: string | number;
}

export default function EmailUsageAnalyticsWidget({
  trustId,
  schoolId,
  title = 'Email Delivery & Usage Tracking',
}: {
  trustId?: string;
  schoolId?: string;
  title?: string;
}) {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (trustId) params.set('trustId', trustId);
    if (schoolId) params.set('schoolId', schoolId);

    fetch(`/api/email/stats?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          setLogs(data.logs || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, [trustId, schoolId]);

  const getProviderBadge = (status?: string) => {
    switch (status) {
      case 'SCHOOL_DEDICATED_KEY':
        return (
          <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            School Dedicated Brevo Key ($9/mo Plan)
          </span>
        );
      case 'TRUST_SHARED_KEY':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            Trust Shared Brevo Gateway
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Mail className="w-3 h-3 text-slate-500" />
            Global Platform Brevo Gateway
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
            <div className="mt-0.5">{getProviderBadge(stats?.brevoStatus)}</div>
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Usage Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Emails Sent Today</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {loading ? '...' : stats?.sentToday ?? 0}
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
          <div className="text-[11px] font-bold text-emerald-600 uppercase">Delivery Success</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {loading ? '...' : (stats?.sentToday ?? 0) > 0 ? '100%' : 'Active'}
          </div>
        </div>

        <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100">
          <div className="text-[11px] font-bold text-rose-600 uppercase">Failed Attempts</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            {loading ? '...' : stats?.failedToday ?? 0}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div>
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Recent Outbound Email Delivery Log</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading delivery logs...</div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Recipient</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Subject</th>
                  <th className="pb-2">Provider</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 font-medium text-slate-900 max-w-[150px] truncate">
                      {log.recipientEmail}
                    </td>
                    <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                      {log.emailType}
                    </td>
                    <td className="py-2.5 text-slate-700 max-w-[200px] truncate">
                      {log.subject}
                    </td>
                    <td className="py-2.5 text-slate-500 font-semibold">
                      {log.provider}
                    </td>
                    <td className="py-2.5 text-right">
                      {log.status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            No outbound emails logged yet today.
          </div>
        )}
      </div>
    </div>
  );
}
