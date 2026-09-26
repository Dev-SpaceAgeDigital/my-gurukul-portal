'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

type RegistrationRequest = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  batchYear?: string | null;
  currentTitle?: string | null;
  currentBio?: string | null;
  linkedIn?: string | null;
  status: string;
  createdAt: string;
};

export default function AlumniRegistrationRequests() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { dialog, showAlert, confirmDialog } = usePortalDialog();

  useEffect(() => {
    fetchRequests();
  }, [status]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subadmin/alumni/requests?status=${status}`);
      const data = await res.json();
      if (res.ok) setRequests(Array.isArray(data.requests) ? data.requests : []);
    } finally {
      setLoading(false);
    }
  };

  const review = async (request: RegistrationRequest, action: 'APPROVE' | 'REJECT') => {
    if (action === 'APPROVE') {
      const ok = await confirmDialog({
        title: 'Approve alumni request?',
        message: `This will create an alumni account for ${request.name} and email login credentials.`,
        confirmText: 'Approve',
        variant: 'success',
      });
      if (!ok) return;
    }

    setSavingId(request.id);
    try {
      const res = await fetch('/api/subadmin/alumni/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: request.id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to review request');
      setRequests((current) => current.filter((item) => item.id !== request.id));
      showAlert({
        title: action === 'APPROVE' ? 'Alumni approved' : 'Request rejected',
        message: action === 'APPROVE'
          ? `Credentials ${data.emailSent ? 'were emailed' : 'were generated, but email was not sent'}.`
          : 'The request has been rejected.',
        variant: action === 'APPROVE' ? 'success' : 'info',
      });
    } catch (error: any) {
      showAlert({ title: 'Action failed', message: error?.message || 'Please try again.', variant: 'danger' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-4 shadow-sm">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-[#1A6B5A]" />
              Registration Requests
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">Approve old students before alumni credentials are sent.</p>
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All</option>
          </select>
        </div>

        <div className="flex-1 min-h-0 overflow-auto bg-white border border-slate-200 rounded-md shadow-sm">
          {loading ? (
            <div className="py-24 flex justify-center text-[#1A6B5A]"><Loader2 className="animate-spin" /></div>
          ) : requests.length === 0 ? (
            <div className="p-10 text-center text-sm font-bold text-slate-500">No registration requests found.</div>
          ) : (
            <table className="w-full text-left text-[12px] min-w-[900px]">
              <thead className="bg-[#12343a] text-[#dac48b] uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Current</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-900">{request.name}</div>
                      <div className="text-slate-500 line-clamp-2 max-w-xs">{request.currentBio || 'No bio added'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{request.email}</div>
                      <div className="text-slate-500">{request.phone || '-'}</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-700">{request.batchYear || 'Unknown'}</td>
                    <td className="px-5 py-4 text-slate-600">{request.currentTitle || '-'}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-700">{request.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      {request.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button onClick={() => review(request, 'APPROVE')} disabled={savingId === request.id} className="rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2 text-[10px] font-black text-emerald-700 flex items-center gap-1">
                            {savingId === request.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Approve
                          </button>
                          <button onClick={() => review(request, 'REJECT')} disabled={savingId === request.id} className="rounded-md bg-rose-50 border border-rose-100 px-3 py-2 text-[10px] font-black text-rose-700 flex items-center gap-1">
                            <XCircle size={12} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {dialog}
    </>
  );
}
