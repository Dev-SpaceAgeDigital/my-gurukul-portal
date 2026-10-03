'use client';

import React, { useEffect, useState } from 'react';
import { Check, CheckCircle2, Clock, Copy, ExternalLink, Loader2, MessageCircle, Send, ShieldCheck, X, XCircle } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

type RegistrationRequest = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  batchYear?: string | null;
  apaarId?: string | null;
  udiseNo?: string | null;
  currentTitle?: string | null;
  currentBio?: string | null;
  linkedIn?: string | null;
  status: string;
  createdAt: string;
};

interface ApprovedModalData {
  name: string;
  phone?: string | null;
  email?: string | null;
  password?: string;
  isSelfSetPassword?: boolean;
  emailSent?: boolean;
}

export default function AlumniRegistrationRequests() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [approvedData, setApprovedData] = useState<ApprovedModalData | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const { dialog, showAlert, confirmDialog } = usePortalDialog();

  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [status]);

  const copyPublicLink = () => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const url = `${origin}/alumni/register`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

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
        message: `This will activate the alumni account for ${request.name} and grant portal access.`,
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

      if (action === 'APPROVE') {
        setApprovedData({
          name: request.name,
          phone: request.phone || data.alumni?.phone || data.alumni?.mobileNumber,
          email: request.email || data.alumni?.email,
          password: data.password,
          isSelfSetPassword: Boolean(data.isSelfSetPassword),
          emailSent: Boolean(data.emailSent),
        });
      } else {
        showAlert({
          title: 'Request rejected',
          message: 'The registration request has been rejected.',
          variant: 'info',
        });
      }
    } catch (error: any) {
      showAlert({ title: 'Action failed', message: error?.message || 'Please try again.', variant: 'danger' });
    } finally {
      setSavingId(null);
    }
  };

  const handleShareWhatsApp = () => {
    if (!approvedData || typeof window === 'undefined') return;
    const digits = (approvedData.phone || '').replace(/\D/g, '');
    const phoneWithCountry = digits.startsWith('91') ? digits : `91${digits.slice(-10)}`;
    const loginUrl = `${window.location.origin}/alumni/login`;
    
    let message = `Hello ${approvedData.name}, your alumni profile has been approved! 🎓\n\nYou can now log in to the Alumni Portal:\n🌐 Link: ${loginUrl}\n📱 Mobile: ${approvedData.phone || ''}`;
    if (!approvedData.isSelfSetPassword && approvedData.password) {
      message += `\n🔑 Temporary Password: ${approvedData.password}`;
    } else {
      message += `\n🔑 Password: (Use the password you chose during registration)`;
    }

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyCreds = () => {
    if (!approvedData || typeof window === 'undefined') return;
    const loginUrl = `${window.location.origin}/alumni/login`;
    let text = `Alumni Login Credentials\nName: ${approvedData.name}\nLogin URL: ${loginUrl}\nIdentifier: ${approvedData.phone || approvedData.email}`;
    if (!approvedData.isSelfSetPassword && approvedData.password) {
      text += `\nPassword: ${approvedData.password}`;
    } else {
      text += `\nPassword: (Chosen during registration)`;
    }
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
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
          <div className="flex items-center gap-2">
            <button
              onClick={copyPublicLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 transition-all shadow-sm"
              title="Copy common link to send to any alumni for self-registration"
            >
              {copiedLink ? '✓ Copied!' : 'Copy Onboarding Link'}
            </button>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ALL">All</option>
            </select>
          </div>
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
                      {(request.apaarId || request.udiseNo) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {request.apaarId && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[9px] font-bold text-blue-700">
                              APAAR: {request.apaarId}
                            </span>
                          )}
                          {request.udiseNo && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-700">
                              UDISE: {request.udiseNo}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-slate-500 line-clamp-2 max-w-xs mt-0.5">{request.currentBio || 'No bio added'}</div>
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

      {/* Approval Success & WhatsApp Share Modal */}
      {approvedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#12343a] to-[#1A6B5A] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <ShieldCheck className="text-emerald-300" size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Alumnus Account Approved</h4>
                  <p className="text-[11px] text-emerald-100 font-medium">Account is now active for login</p>
                </div>
              </div>
              <button
                onClick={() => setApprovedData(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Alumnus Name:</span>
                  <span className="font-bold text-slate-900">{approvedData.name}</span>
                </div>
                {approvedData.phone && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Mobile / Login ID:</span>
                    <span className="font-mono font-bold text-emerald-700">{approvedData.phone}</span>
                  </div>
                )}
                {approvedData.email && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="font-bold text-slate-900">{approvedData.email}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Password Status:</span>
                  <span className="font-mono font-bold text-[#1A6B5A]">
                    {approvedData.isSelfSetPassword ? '✓ Self-Set during Registration' : approvedData.password || 'Generated'}
                  </span>
                </div>
              </div>

              {approvedData.emailSent ? (
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5">
                  <Check size={13} /> Automated credentials email was delivered to {approvedData.email}.
                </p>
              ) : (
                <p className="text-[11px] font-medium text-slate-500">
                  {approvedData.phone ? 'You can send credentials directly to the alumnus via WhatsApp below.' : 'No email provided. Share credentials manually.'}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {approvedData.phone && (
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <MessageCircle size={15} />
                    <span>Share on WhatsApp</span>
                  </button>
                )}
                <button
                  onClick={handleCopyCreds}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedCreds ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedCreds ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dialog}
    </>
  );
}
