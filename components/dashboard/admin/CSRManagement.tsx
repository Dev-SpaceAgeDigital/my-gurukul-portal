'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Loader2, Search, ShieldCheck } from 'lucide-react';
import { usePortalDialog } from '@/components/ui/PortalDialog';

type CsrInquiry = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string | null;
  category: string;
  budgetRange?: string | null;
  message?: string | null;
  source: string;
  status: string;
  schoolName?: string | null;
  referredByAlumniName?: string | null;
  referredByAlumniEmail?: string | null;
  notes?: string | null;
  createdAt: string;
};

export default function CSRManagement({ role }: { role: 'SUPER_ADMIN' | 'SUB_ADMIN' }) {
  const [inquiries, setInquiries] = useState<CsrInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [source, setSource] = useState('ALL');
  const [savingId, setSavingId] = useState<string | null>(null);
  const { dialog, showAlert } = usePortalDialog();

  const query = useMemo(() => {
    const params = new URLSearchParams({ search, status, source });
    return params.toString();
  }, [search, status, source]);

  useEffect(() => {
    fetchInquiries();
  }, [query]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/csr?${query}`);
      const data = await res.json();
      if (res.ok) setInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (inquiry: CsrInquiry, nextStatus: string) => {
    setSavingId(inquiry.id);
    try {
      const res = await fetch('/api/admin/csr', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inquiry.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to update CSR inquiry');
      setInquiries((current) => current.map((item) => item.id === inquiry.id ? data.inquiry : item));
      showAlert({ title: 'CSR updated', message: `${inquiry.companyName} is now ${nextStatus}.`, variant: 'success' });
    } catch (error: any) {
      showAlert({ title: 'Update failed', message: error?.message || 'Please try again.', variant: 'danger' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl bg-white/95 border border-[#d8e7e4] shadow-sm p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-[#1A6B5A]" size={22} />
                CSR Management
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {role === 'SUB_ADMIN' ? 'CSR inquiries connected to your school.' : 'All CSR inquiries from website and alumni referrals.'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['ALL', 'PENDING', 'CONTACTED', 'APPROVED'].map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`rounded-xl border px-3 py-2 text-[11px] font-black ${status === item ? 'bg-[#1A6B5A] text-white border-[#1A6B5A]' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 mt-5">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, contact, email, school..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#1A6B5A]"
              />
            </div>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#1A6B5A]"
            >
              <option value="ALL">All Sources</option>
              <option value="PUBLIC">Website</option>
              <option value="ALUMNI">Alumni</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl bg-white/95 border border-[#d8e7e4] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex justify-center text-[#1A6B5A]"><Loader2 className="animate-spin" /></div>
          ) : inquiries.length === 0 ? (
            <div className="p-10 text-center">
              <Building2 size={34} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700">No CSR inquiries found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] min-w-[1050px]">
                <thead className="bg-[#12343a] text-[#dac48b] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Company</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">School</th>
                    <th className="px-5 py-4">Source</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <div className="font-black text-slate-900">{inquiry.companyName}</div>
                        <div className="text-[11px] text-slate-500 mt-1 max-w-xs line-clamp-2">{inquiry.message || 'No message added'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{inquiry.contactPerson}</div>
                        <div className="text-slate-500">{inquiry.email}</div>
                        <div className="text-slate-500">{inquiry.phone || '-'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{inquiry.category}</div>
                        <div className="text-slate-500">{inquiry.budgetRange || 'Budget not set'}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-semibold">{inquiry.schoolName || 'Trust level'}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">{inquiry.source}</span>
                        {inquiry.referredByAlumniName && (
                          <div className="text-[11px] text-slate-500 mt-2">{inquiry.referredByAlumniName}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">{inquiry.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {['CONTACTED', 'APPROVED', 'REJECTED'].map((nextStatus) => (
                            <button
                              key={nextStatus}
                              onClick={() => updateStatus(inquiry, nextStatus)}
                              disabled={savingId === inquiry.id}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 hover:border-[#1A6B5A] hover:text-[#1A6B5A] disabled:opacity-60"
                            >
                              {savingId === inquiry.id ? <Loader2 size={12} className="animate-spin" /> : nextStatus === 'APPROVED' ? <CheckCircle2 size={12} /> : nextStatus}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {dialog}
    </>
  );
}
