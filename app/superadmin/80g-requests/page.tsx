'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  FileCheck2,
  Send,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  CreditCard,
  Mail,
  Phone,
  User,
  ShieldAlert,
  Download,
  Filter,
} from 'lucide-react';

type Item80G = {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donorPan: string;
  amount: number;
  paymentId: string;
  causeName: string;
  schoolName: string;
  schoolId?: string | null;
  status: 'PENDING' | 'APPROVED_SENT' | 'REJECTED';
  sentAt?: string | null;
  createdAt: string;
};

export default function SuperAdmin80GRequestsPage() {
  const [requests, setRequests] = useState<Item80G[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED_SENT'>('ALL');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/superadmin/80g-requests');
      const data = await res.json();
      if (res.ok && data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Error loading 80G requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndSend = async (id: string, donorName: string) => {
    if (processingId) return;
    setProcessingId(id);
    setAlertMsg(null);

    try {
      const res = await fetch('/api/superadmin/80g-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'APPROVE_SEND' }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAlertMsg({
          type: 'success',
          text: `Official 80G Tax Exemption Certificate PDF successfully generated and emailed to ${donorName}!`,
        });
        await fetchRequests();
      } else {
        setAlertMsg({ type: 'error', text: data.error || 'Failed to send 80G PDF email' });
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err?.message || 'Server connection error' });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.donorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.donorPan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.causeName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED_SENT').length;
  const totalValue = requests.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <DashboardLayout title="80G Tax Exemption Requests" role="SUPER_ADMIN" activeItem="80G Requests">
      <div className="flex flex-col gap-6 p-2 md:p-4 max-w-7xl mx-auto w-full pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <FileCheck2 size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">80G Certificate Requests</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Review donor PAN submissions, generate official 80G Tax Exemption PDF certificates, and dispatch via email.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRequests}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Refresh List
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {alertMsg && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in ${
              alertMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>
        )}

        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
              {requests.length}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Requests</p>
              <p className="text-lg font-black text-slate-900">{requests.length} Submissions</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center gap-3 bg-amber-50/30">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase">Pending Review</p>
              <p className="text-lg font-black text-amber-900">{pendingCount} Action Needed</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-3 bg-emerald-50/30">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase">Approved & Emailed</p>
              <p className="text-lg font-black text-emerald-900">{approvedCount} Certificates</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-sm flex items-center gap-3 bg-teal-50/30">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-800 uppercase">Tax Deductible Value</p>
              <p className="text-lg font-black text-teal-950">₹{totalValue.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search donor, PAN, email or school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 shrink-0">
              <Filter size={13} /> Filter:
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-full sm:w-auto">
              {(['ALL', 'PENDING', 'APPROVED_SENT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'PENDING' ? 'Pending' : 'Emailed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              Loading 80G tax exemption requests...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              No 80G tax exemption requests found matching your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Donor & Contact</th>
                    <th className="py-3.5 px-4">PAN Card Number</th>
                    <th className="py-3.5 px-4">Donation Cause & School</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filtered.map((r) => {
                    const isPending = r.status === 'PENDING';
                    const isProcessing = processingId === r.id;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Donor Info */}
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {r.donorName[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{r.donorName}</p>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
                                <Mail size={11} className="shrink-0" />
                                {r.donorEmail}
                              </p>
                              {r.donorPhone && (
                                <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
                                  <Phone size={10} className="shrink-0" />
                                  {r.donorPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* PAN Card Number */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-mono text-xs font-bold tracking-wider shadow-xs">
                            <ShieldAlert size={12} className="text-amber-600 shrink-0" />
                            {r.donorPan}
                          </span>
                        </td>

                        {/* Cause & School */}
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <p className="font-bold text-slate-800 leading-snug truncate">{r.causeName}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
                            <Building2 size={11} className="shrink-0" />
                            {r.schoolName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Requested: {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-sm font-black text-slate-900">
                            ₹{Number(r.amount).toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-800 text-[11px] font-bold border border-amber-300">
                              <Clock size={12} />
                              Pending Review
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                              <CheckCircle2 size={12} />
                              Approved & Emailed
                            </span>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isPending ? (
                            <button
                              onClick={() => handleApproveAndSend(r.id, r.donorName)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Send size={13} />
                              {isProcessing ? 'Generating & Sending...' : 'Approve & Send 80G PDF'}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
                              <CheckCircle2 size={14} className="text-emerald-600" />
                              Emailed on {r.sentAt ? new Date(r.sentAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Done'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
